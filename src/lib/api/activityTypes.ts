/**
 * Activity Types API Module
 * Handles global activity types (system defaults + user customs)
 *
 * This module provides access to:
 * 1. System-wide default activity types (10 defaults)
 * 2. User-created custom activity types
 * 3. Combined view of all activity types available to a user
 *
 * Note: This API creates the structure for Firestore queries that will work
 * once the /activityTypes collection is created. Collections don't exist yet.
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Firebase imports
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// Local Firebase config
import { db, auth } from '@/lib/firebase';

// Error handling
import { handleError } from '@/lib/errorHandler';
import { checkRateLimit } from '@/lib/rateLimit';

// Shared utilities
import { convertTimestamp, removeUndefinedFields } from './shared/utils';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Activity Type
 * Represents a global activity type (system default or user custom)
 */
export interface ActivityType {
  id: string; // e.g., 'work', 'study', 'coding'
  name: string; // Display name
  category: 'productivity' | 'learning' | 'creative'; // Category grouping
  icon: string; // Emoji icon
  defaultColor: string; // Hex color
  isSystem: boolean; // true for defaults, false for custom
  userId?: string; // Set for custom activities, undefined for system
  order: number; // Display order
  description?: string; // Brief description
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data required to create a custom activity type
 */
export interface CreateCustomActivityTypeData {
  name: string;
  icon: string;
  defaultColor: string;
  category?: 'productivity' | 'learning' | 'creative';
  description?: string;
}

/**
 * Data for updating a custom activity type
 */
export interface UpdateCustomActivityTypeData {
  name?: string;
  icon?: string;
  defaultColor?: string;
  category?: 'productivity' | 'learning' | 'creative';
  description?: string;
}

// ============================================================================
// SYSTEM DEFAULT ACTIVITIES
// ============================================================================

/**
 * 10 default activity types available to all users
 * These are hardcoded and DO NOT exist in Firestore
 * IDs are kebab-case for consistency
 */
const SYSTEM_ACTIVITY_TYPES: ActivityType[] = [
  {
    id: 'work',
    name: 'Work',
    category: 'productivity',
    icon: '📊',
    defaultColor: '#0066CC',
    isSystem: true,
    order: 1,
    description: 'Professional work and meetings',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'coding',
    name: 'Coding',
    category: 'productivity',
    icon: '💻',
    defaultColor: '#5856D6',
    isSystem: true,
    order: 2,
    description: 'Software development and programming',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'side-project',
    name: 'Side Project',
    category: 'productivity',
    icon: '🚀',
    defaultColor: '#FF9500',
    isSystem: true,
    order: 3,
    description: 'Personal projects and side hustles',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'planning',
    name: 'Planning',
    category: 'productivity',
    icon: '🎯',
    defaultColor: '#32ADE6',
    isSystem: true,
    order: 4,
    description: 'Goal setting, planning, and strategy',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'study',
    name: 'Study',
    category: 'learning',
    icon: '📚',
    defaultColor: '#34C759',
    isSystem: true,
    order: 5,
    description: 'Academic learning and coursework',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'learning',
    name: 'Learning',
    category: 'learning',
    icon: '🧠',
    defaultColor: '#FFD60A',
    isSystem: true,
    order: 6,
    description: 'Skill development and online courses',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'reading',
    name: 'Reading',
    category: 'learning',
    icon: '📖',
    defaultColor: '#FF2D55',
    isSystem: true,
    order: 7,
    description: 'Books, articles, and documentation',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'research',
    name: 'Research',
    category: 'learning',
    icon: '🔬',
    defaultColor: '#AF52DE',
    isSystem: true,
    order: 8,
    description: 'Investigation and analysis',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'creative',
    name: 'Creative',
    category: 'creative',
    icon: '🎨',
    defaultColor: '#FF6482',
    isSystem: true,
    order: 9,
    description: 'Design, art, music, video production',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'writing',
    name: 'Writing',
    category: 'creative',
    icon: '✍️',
    defaultColor: '#AC8E68',
    isSystem: true,
    order: 10,
    description: 'Blog posts, documentation, journaling',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get all system activity types (10 defaults)
 * These are hardcoded and not stored in Firestore
 *
 * @returns Array of 10 default activity types
 *
 * @example
 * const defaults = await getSystemActivityTypes();
 * console.log(defaults.length); // 10
 */
export async function getSystemActivityTypes(): Promise<ActivityType[]> {
  try {
    // Return hardcoded defaults
    // In the future, these could be fetched from Firestore for dynamic updates
    return SYSTEM_ACTIVITY_TYPES;
  } catch (_error) {
    const apiError = handleError(_error, 'Get system activity types', {
      defaultMessage: 'Failed to get default activities',
    });
    throw new Error(apiError.userMessage);
  }
}

/**
 * Get user's custom activity types
 * Fetches from /activityTypes collection with userId filter
 *
 * @param userId - User ID to fetch custom activities for
 * @returns Array of custom activity types created by the user
 *
 * @example
 * const customs = await getUserCustomActivityTypes('user123');
 * console.log(customs); // [{ id: 'guitar', name: 'Guitar Practice', ... }]
 */
export async function getUserCustomActivityTypes(
  userId: string
): Promise<ActivityType[]> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // BACKWARD COMPATIBILITY: Read from old /projects/{userId}/userProjects collection
    // This treats existing user activities as "custom activities" in the new system
    const userProjectsRef = collection(db, `projects/${userId}/userProjects`);
    const querySnapshot = await getDocs(userProjectsRef);
    const customTypes: ActivityType[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      // Convert old Activity/Project to new ActivityType format
      customTypes.push({
        id: doc.id,
        name: data.name,
        category: data.category || 'productivity',
        icon: data.icon || '📋',
        defaultColor: data.color || '#0066CC',
        isSystem: false, // All old activities are treated as custom
        userId: userId,
        order: customTypes.length + 100, // Order after system defaults
        description: data.description || '',
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });

    return customTypes;
  } catch (_error) {
    const apiError = handleError(_error, 'Get user custom activity types', {
      defaultMessage: 'Failed to get custom activities',
    });
    throw new Error(apiError.userMessage);
  }
}

/**
 * Get all activity types available to a user
 * Returns system defaults + user's custom activities
 *
 * @param userId - User ID to fetch all available activities for
 * @returns Array of all activity types (defaults + customs)
 *
 * @example
 * const allActivities = await getAllActivityTypes('user123');
 * // Returns 10 defaults + user's custom activities
 */
export async function getAllActivityTypes(
  userId: string
): Promise<ActivityType[]> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get both system defaults and user customs in parallel
    const [systemTypes, customTypes] = await Promise.all([
      getSystemActivityTypes(),
      getUserCustomActivityTypes(userId),
    ]);

    // Combine and sort by order
    const allTypes = [...systemTypes, ...customTypes].sort(
      (a, b) => a.order - b.order
    );

    return allTypes;
  } catch (_error) {
    const apiError = handleError(_error, 'Get all activity types', {
      defaultMessage: 'Failed to get activity types',
    });
    throw new Error(apiError.userMessage);
  }
}

/**
 * Create a custom activity type
 * Adds a new custom activity to /activityTypes collection
 *
 * Max 10 custom activities per user
 *
 * @param userId - User ID creating the activity
 * @param data - Activity type data (name, icon, color, etc.)
 * @returns The created activity type with generated ID
 *
 * @example
 * const newActivity = await createCustomActivityType('user123', {
 *   name: 'Guitar Practice',
 *   icon: '🎸',
 *   defaultColor: '#FF6482',
 *   category: 'creative',
 * });
 */
export async function createCustomActivityType(
  userId: string,
  data: CreateCustomActivityTypeData
): Promise<ActivityType> {
  try {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      throw new Error('User not authenticated or unauthorized');
    }

    if (!data.name || !data.icon || !data.defaultColor) {
      throw new Error('Name, icon, and color are required');
    }

    // Rate limit custom activity creation
    checkRateLimit(userId, 'CUSTOM_ACTIVITY_CREATE');

    // Check custom activity limit (max 10)
    const existingCustoms = await getUserCustomActivityTypes(userId);
    if (existingCustoms.length >= 10) {
      throw new Error(
        'Maximum custom activities reached (10). Delete an existing custom activity to create a new one.'
      );
    }

    // Calculate order (system defaults are 1-10, customs start at 11)
    const order = 10 + existingCustoms.length + 1;

    // Prepare activity data for old collection format
    const activityData = removeUndefinedFields({
      name: data.name,
      icon: data.icon,
      color: data.defaultColor, // Map to 'color' field in old schema
      category: data.category || 'productivity',
      description: data.description,
      isDefault: false, // Old field equivalent to !isSystem
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // BACKWARD COMPATIBILITY: Write to old /projects/{userId}/userProjects collection
    const docRef = await addDoc(
      collection(db, `projects/${userId}/userProjects`),
      activityData
    );

    // Return in new ActivityType format
    return {
      id: docRef.id,
      name: data.name,
      icon: data.icon,
      defaultColor: data.defaultColor,
      category: data.category || 'productivity',
      description: data.description,
      isSystem: false,
      userId: userId,
      order: order,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (_error) {
    const apiError = handleError(_error, 'Create custom activity type', {
      defaultMessage: 'Failed to create custom activity',
    });
    throw new Error(apiError.userMessage);
  }
}

/**
 * Update a custom activity type
 * Only the owner can update their custom activities
 * System activities cannot be updated
 *
 * @param activityId - Activity type ID to update
 * @param userId - User ID (must be the owner)
 * @param data - Fields to update
 * @returns The updated activity type
 *
 * @example
 * const updated = await updateCustomActivityType('activity123', 'user123', {
 *   name: 'Electric Guitar Practice',
 *   icon: '🎸',
 * });
 */
export async function updateCustomActivityType(
  activityId: string,
  userId: string,
  data: UpdateCustomActivityTypeData
): Promise<ActivityType> {
  try {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      throw new Error('User not authenticated or unauthorized');
    }

    if (!activityId) {
      throw new Error('Activity ID is required');
    }

    // BACKWARD COMPATIBILITY: Use old collection path
    const activityDocRef = doc(
      db,
      `projects/${userId}/userProjects`,
      activityId
    );
    const activityDoc = await getDoc(activityDocRef);

    if (!activityDoc.exists()) {
      throw new Error('Activity type not found');
    }

    const activityData = activityDoc.data();

    // In old system, isDefault=true means it's a system activity (can't edit)
    if (activityData.isDefault === true) {
      throw new Error('Cannot update default activity types');
    }

    // Prepare update data - map new field names to old schema
    const updateData = removeUndefinedFields({
      name: data.name,
      icon: data.icon,
      color: data.defaultColor, // Map to old 'color' field
      category: data.category,
      description: data.description,
      updatedAt: serverTimestamp(),
    });

    // Update in Firestore
    await updateDoc(activityDocRef, updateData);

    // Get updated document
    const updatedDoc = await getDoc(activityDocRef);
    const updatedData = updatedDoc.data()!;

    return {
      id: activityId,
      name: updatedData.name,
      icon: updatedData.icon,
      defaultColor: updatedData.color || updatedData.defaultColor,
      category: updatedData.category,
      description: updatedData.description,
      isSystem: false,
      userId: updatedData.userId,
      order: updatedData.order,
      createdAt: convertTimestamp(updatedData.createdAt),
      updatedAt: convertTimestamp(updatedData.updatedAt),
    };
  } catch (_error) {
    const apiError = handleError(_error, 'Update custom activity type', {
      defaultMessage: 'Failed to update custom activity',
    });
    throw new Error(apiError.userMessage);
  }
}

/**
 * Delete a custom activity type (hard delete)
 * Only the owner can delete their custom activities
 * System activities cannot be deleted
 *
 * Sessions using this activity will be marked as "Unassigned"
 * (Handled by application logic, not this function)
 *
 * @param activityId - Activity type ID to delete
 * @param userId - User ID (must be the owner)
 *
 * @example
 * await deleteCustomActivityType('activity123', 'user123');
 */
export async function deleteCustomActivityType(
  activityId: string,
  userId: string
): Promise<void> {
  try {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      throw new Error('User not authenticated or unauthorized');
    }

    if (!activityId) {
      throw new Error('Activity ID is required');
    }

    // BACKWARD COMPATIBILITY: Use old collection path
    const activityDocRef = doc(
      db,
      `projects/${userId}/userProjects`,
      activityId
    );
    const activityDoc = await getDoc(activityDocRef);

    if (!activityDoc.exists()) {
      throw new Error('Activity type not found');
    }

    const activityData = activityDoc.data();

    // In old system, isDefault=true means it's a system activity (can't delete)
    if (activityData.isDefault === true) {
      throw new Error('Cannot delete default activity types');
    }

    // Hard delete from Firestore
    await deleteDoc(activityDocRef);

    // Note: Sessions using this activity will need to be handled by
    // application logic (mark as "Unassigned" or migrate to default)
  } catch (_error) {
    const apiError = handleError(_error, 'Delete custom activity type', {
      defaultMessage: 'Failed to delete custom activity',
    });
    throw new Error(apiError.userMessage);
  }
}

// ============================================================================
// BACKWARD COMPATIBILITY HELPERS
// ============================================================================

/**
 * Get activity type by ID
 * Checks system defaults first, then custom activities
 * Useful for backward compatibility with existing projectId/activityId queries
 *
 * @param activityId - Activity type ID
 * @param userId - Optional user ID (required for custom activities)
 * @returns Activity type or null if not found
 *
 * @example
 * const activity = await getActivityTypeById('work'); // System default
 * const custom = await getActivityTypeById('guitar', 'user123'); // Custom
 */
export async function getActivityTypeById(
  activityId: string,
  userId?: string
): Promise<ActivityType | null> {
  try {
    // Check system defaults first
    const systemType = SYSTEM_ACTIVITY_TYPES.find(t => t.id === activityId);
    if (systemType) {
      return systemType;
    }

    // Check custom activities
    if (!userId) {
      return null; // Can't fetch custom without userId
    }

    // BACKWARD COMPATIBILITY: Use old collection path
    const activityDocRef = doc(
      db,
      `projects/${userId}/userProjects`,
      activityId
    );
    const activityDoc = await getDoc(activityDocRef);

    if (!activityDoc.exists()) {
      return null;
    }

    const data = activityDoc.data();

    // Convert from old schema to new ActivityType format
    return {
      id: activityDoc.id,
      name: data.name,
      category: data.category || 'productivity',
      icon: data.icon || '📋',
      defaultColor: data.color || data.defaultColor || '#0066CC',
      isSystem: false, // All old activities are custom
      userId: userId,
      order: data.order || 100,
      description: data.description || '',
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    };
  } catch (_error) {
    const apiError = handleError(_error, 'Get activity type by ID', {
      defaultMessage: 'Failed to get activity type',
    });
    throw new Error(apiError.userMessage);
  }
}

/**
 * Get activity types by IDs (batch)
 * Useful for populating sessions with activity details
 *
 * @param activityIds - Array of activity IDs
 * @param userId - Optional user ID (required for custom activities)
 * @returns Map of activityId -> ActivityType
 *
 * @example
 * const activities = await getActivityTypesByIds(['work', 'coding', 'guitar'], 'user123');
 * console.log(activities.get('work')?.name); // 'Work'
 */
export async function getActivityTypesByIds(
  activityIds: string[],
  userId?: string
): Promise<Map<string, ActivityType>> {
  try {
    const activityMap = new Map<string, ActivityType>();

    // Process in parallel
    await Promise.all(
      activityIds.map(async id => {
        const activity = await getActivityTypeById(id, userId);
        if (activity) {
          activityMap.set(id, activity);
        }
      })
    );

    return activityMap;
  } catch (_error) {
    const apiError = handleError(_error, 'Get activity types by IDs', {
      defaultMessage: 'Failed to get activity types',
    });
    throw new Error(apiError.userMessage);
  }
}
