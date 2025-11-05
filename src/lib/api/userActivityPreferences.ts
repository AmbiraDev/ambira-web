/**
 * User Activity Preferences API Module
 * Handles user-specific preferences and usage tracking for activity types
 *
 * This module provides:
 * 1. Tracking when users last used each activity (for "recent" sorting)
 * 2. Use count for popularity metrics
 * 3. User preferences like custom colors (future)
 *
 * Note: This API creates the structure for Firestore queries that will work
 * once the /users/{userId}/activityPreferences collection is created.
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
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';

// Local Firebase config
import { db, auth } from '@/lib/firebase';

// Error handling
import { handleError } from '@/lib/errorHandler';

// Shared utilities
import { convertTimestamp, removeUndefinedFields } from './shared/utils';

// Activity types (for fallback defaults)
import { getActivityTypeById } from './activityTypes';
import type { ActivityType } from './activityTypes';

// ============================================================================
// TYPES
// ============================================================================

/**
 * User Activity Preference
 * Tracks user-specific data for each activity type
 *
 * Stored in: /users/{userId}/activityPreferences/{typeId}
 */
export interface UserActivityPreference {
  typeId: string; // References activity type ID
  userId: string; // Owner
  lastUsed: Date; // Last time user created a session with this activity
  useCount: number; // Total number of times used
  createdAt: Date;
  updatedAt: Date;
  // Future fields (not implemented yet):
  // isHidden?: boolean;
  // customColor?: string;
  // weeklyTarget?: number;
  // isPinned?: boolean;
}

/**
 * Activity type with usage data
 * Combines ActivityType with user preference data
 */
export interface ActivityTypeWithUsage extends ActivityType {
  lastUsed?: Date;
  useCount: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Update activity preference when user creates a session
 * Creates preference if it doesn't exist, updates lastUsed and increments useCount
 *
 * This should be called every time a user creates a session with an activity
 *
 * @param userId - User ID
 * @param typeId - Activity type ID
 * @param lastUsed - Date of session creation (defaults to now)
 * @param useCount - Increment amount (defaults to 1)
 *
 * @example
 * // When user creates a session with 'work' activity
 * await updateActivityPreference('user123', 'work');
 */
export async function updateActivityPreference(
  userId: string,
  typeId: string,
  lastUsed?: Date,
  useCount: number = 1
): Promise<void> {
  try {
    if (!userId || !typeId) {
      throw new Error('User ID and type ID are required');
    }

    // Reference to preference document
    const prefRef = doc(db, `users/${userId}/activityPreferences/${typeId}`);

    // Update or create preference
    // Using setDoc with merge to create if not exists
    const prefData = removeUndefinedFields({
      typeId: typeId,
      userId: userId,
      lastUsed: lastUsed ? Timestamp.fromDate(lastUsed) : serverTimestamp(),
      useCount: increment(useCount), // Increment by useCount (default 1)
      updatedAt: serverTimestamp(),
    });

    // Set createdAt only if document doesn't exist
    const existingDoc = await getDoc(prefRef);
    if (!existingDoc.exists()) {
      (prefData as Record<string, unknown>).createdAt = serverTimestamp();
    }

    await setDoc(prefRef, prefData, { merge: true });
  } catch (_error) {
    const apiError = handleError(_error, 'Update activity preference', {
      defaultMessage: 'Failed to update activity preference',
    });
    throw new Error(apiError.userMessage);
  }
}

/**
 * Get recent activities for horizontal bar
 * Returns activity IDs sorted by most recently used
 *
 * If user has fewer than limit recent activities, fills with popular defaults:
 * - work, coding, study, reading, writing
 *
 * @param userId - User ID
 * @param limitCount - Number of recent activities to return (default: 5)
 * @returns Array of activity type IDs sorted by most recent
 *
 * @example
 * const recentIds = await getRecentActivities('user123', 5);
 */
export async function getRecentActivities(
  userId: string,
  limitCount: number = 5
): Promise<string[]> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Query recent activity preferences, ordered by lastUsed descending
    const prefsQuery = query(
      collection(db, `users/${userId}/activityPreferences`),
      orderBy('lastUsed', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(prefsQuery);
    const recentIds = snapshot.docs.map(doc => doc.data().typeId as string);

    // If user has fewer than limit recent activities, fill with popular defaults
    if (recentIds.length < limitCount) {
      // Popular defaults to fill with
      const popularDefaults = ['work', 'coding', 'study', 'reading', 'writing'];

      const fillCount = limitCount - recentIds.length;
      const fillIds = popularDefaults
        .filter(id => !recentIds.includes(id)) // Don't duplicate
        .slice(0, fillCount);

      recentIds.push(...fillIds);
    }

    return recentIds;
  } catch (_error) {
    const apiError = handleError(_error, 'Get recent activities', {
      defaultMessage: 'Failed to get recent activities',
    });
    throw new Error(apiError.userMessage);
  }
}

/**
 * Get all user activity preferences
 * Returns all preferences for a user (for analytics, stats, etc.)
 *
 * @param userId - User ID
 * @returns Array of user activity preferences
 *
 * @example
 * const prefs = await getUserActivityPreferences('user123');
 */
export async function getUserActivityPreferences(
  userId: string
): Promise<UserActivityPreference[]> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const prefsQuery = query(
      collection(db, `users/${userId}/activityPreferences`),
      orderBy('lastUsed', 'desc')
    );

    const snapshot = await getDocs(prefsQuery);
    const preferences: UserActivityPreference[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      preferences.push({
        typeId: data.typeId,
        userId: userId,
        lastUsed: convertTimestamp(data.lastUsed),
        useCount: data.useCount || 0,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });

    return preferences;
  } catch (_error) {
    const apiError = handleError(_error, 'Get user activity preferences', {
      defaultMessage: 'Failed to get activity preferences',
    });
    throw new Error(apiError.userMessage);
  }
}

/**
 * Get activity preference for a specific activity type
 * Returns preference data for a single activity
 *
 * @param userId - User ID
 * @param typeId - Activity type ID
 * @returns User activity preference or null if not found
 *
 * @example
 * const pref = await getActivityPreference('user123', 'work');
 */
export async function getActivityPreference(
  userId: string,
  typeId: string
): Promise<UserActivityPreference | null> {
  try {
    if (!userId || !typeId) {
      throw new Error('User ID and type ID are required');
    }

    const prefDoc = await getDoc(
      doc(db, `users/${userId}/activityPreferences/${typeId}`)
    );

    if (!prefDoc.exists()) {
      return null;
    }

    const data = prefDoc.data();
    return {
      typeId: data.typeId,
      userId: userId,
      lastUsed: convertTimestamp(data.lastUsed),
      useCount: data.useCount || 0,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    };
  } catch (_error) {
    const apiError = handleError(_error, 'Get activity preference', {
      defaultMessage: 'Failed to get activity preference',
    });
    throw new Error(apiError.userMessage);
  }
}

// ============================================================================
// COMBINED QUERIES (Activity Types + Preferences)
// ============================================================================

/**
 * Get recent activities with full activity type details
 * Combines getRecentActivities() with activity type data
 *
 * @param userId - User ID
 * @param limitCount - Number of recent activities to return (default: 5)
 * @returns Array of activity types sorted by most recent usage
 *
 * @example
 * const recentActivities = await getRecentActivitiesWithDetails('user123', 5);
 */
export async function getRecentActivitiesWithDetails(
  userId: string,
  limitCount: number = 5
): Promise<ActivityType[]> {
  try {
    // Get recent activity IDs
    const recentIds = await getRecentActivities(userId, limitCount);

    // Fetch full activity type details for each ID
    const activities = await Promise.all(
      recentIds.map(async id => {
        const activity = await getActivityTypeById(id, userId);
        return activity;
      })
    );

    // Filter out nulls (activities that don't exist)
    return activities.filter(
      (activity): activity is ActivityType => activity !== null
    );
  } catch (_error) {
    const apiError = handleError(_error, 'Get recent activities with details', {
      defaultMessage: 'Failed to get recent activities',
    });
    throw new Error(apiError.userMessage);
  }
}

/**
 * Get all activities with usage data
 * Combines all activity types with user preference data
 * Useful for analytics and activity selection UI
 *
 * @param userId - User ID
 * @returns Array of activity types with usage data (lastUsed, useCount)
 *
 * @example
 * const activitiesWithUsage = await getAllActivitiesWithUsage('user123');
 * activitiesWithUsage.forEach(a => {
 * });
 */
export async function getAllActivitiesWithUsage(
  userId: string
): Promise<ActivityTypeWithUsage[]> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get all activity types (system + custom)
    const { getAllActivityTypes } = await import('./activityTypes');
    const allActivities = await getAllActivityTypes(userId);

    // Get all user preferences
    const preferences = await getUserActivityPreferences(userId);

    // Create a map of typeId -> preference
    const prefMap = new Map<string, UserActivityPreference>();
    preferences.forEach(pref => {
      prefMap.set(pref.typeId, pref);
    });

    // Combine activity types with preference data
    const activitiesWithUsage: ActivityTypeWithUsage[] = allActivities.map(
      activity => {
        const pref = prefMap.get(activity.id);
        return {
          ...activity,
          lastUsed: pref?.lastUsed,
          useCount: pref?.useCount || 0,
        };
      }
    );

    return activitiesWithUsage;
  } catch (_error) {
    const apiError = handleError(_error, 'Get all activities with usage', {
      defaultMessage: 'Failed to get activities with usage data',
    });
    throw new Error(apiError.userMessage);
  }
}

/**
 * Get activities sorted by usage count
 * Returns most-used activities first
 * Useful for "popular activities" or sorting dropdown
 *
 * @param userId - User ID
 * @param limitCount - Number of activities to return (default: 10)
 * @returns Array of activity types sorted by use count descending
 *
 * @example
 * const popular = await getMostUsedActivities('user123', 5);
 */
export async function getMostUsedActivities(
  userId: string,
  limitCount: number = 10
): Promise<ActivityTypeWithUsage[]> {
  try {
    const activitiesWithUsage = await getAllActivitiesWithUsage(userId);

    // Sort by useCount descending, then by name
    const sorted = activitiesWithUsage.sort((a, b) => {
      if (b.useCount !== a.useCount) {
        return b.useCount - a.useCount;
      }
      return a.name.localeCompare(b.name);
    });

    // Return top N
    return sorted.slice(0, limitCount);
  } catch (_error) {
    const apiError = handleError(_error, 'Get most used activities', {
      defaultMessage: 'Failed to get most used activities',
    });
    throw new Error(apiError.userMessage);
  }
}

// ============================================================================
// ANALYTICS HELPERS
// ============================================================================

/**
 * Get activities with at least one session
 * Used for analytics filter dropdown (only show activities with sessions)
 *
 * Note: This queries the sessions collection to determine which activities have data
 * Returns activity types sorted by session count descending
 *
 * @param userId - User ID
 * @returns Array of activity types that have at least one session
 *
 * @example
 * const activitiesWithSessions = await getActivitiesWithSessions('user123');
 * // Only returns activities user has actually used
 */
export async function getActivitiesWithSessions(
  userId: string
): Promise<ActivityTypeWithUsage[]> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get all activity preferences (only exist if user has created sessions)
    const preferences = await getUserActivityPreferences(userId);

    if (preferences.length === 0) {
      return [];
    }

    // Get activity type details for each preference
    const activities = await Promise.all(
      preferences.map(async pref => {
        const activity = await getActivityTypeById(pref.typeId, userId);
        if (!activity) {
          return null;
        }

        return {
          ...activity,
          lastUsed: pref.lastUsed,
          useCount: pref.useCount,
        } as ActivityTypeWithUsage;
      })
    );

    // Filter out nulls and sort by use count descending
    const validActivities = activities.filter(
      (a): a is ActivityTypeWithUsage => a !== null
    );

    return validActivities.sort((a, b) => b.useCount - a.useCount);
  } catch (_error) {
    const apiError = handleError(_error, 'Get activities with sessions', {
      defaultMessage: 'Failed to get activities with sessions',
    });
    throw new Error(apiError.userMessage);
  }
}

/**
 * Get activity usage stats
 * Returns aggregate statistics about activity usage
 *
 * @param userId - User ID
 * @returns Usage statistics
 *
 * @example
 * const stats = await getActivityUsageStats('user123');
 */
export async function getActivityUsageStats(userId: string): Promise<{
  totalActivities: number; // Total activities available (system + custom)
  activitiesUsed: number; // Number of activities with ≥1 session
  mostUsedActivity: ActivityTypeWithUsage | null;
  totalSessions: number; // Total sessions across all activities
  averageSessionsPerActivity: number;
}> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get all activities and preferences in parallel
    const { getAllActivityTypes } = await import('./activityTypes');
    const [allActivities, preferences] = await Promise.all([
      getAllActivityTypes(userId),
      getUserActivityPreferences(userId),
    ]);

    // Calculate stats
    const totalActivities = allActivities.length;
    const activitiesUsed = preferences.length;
    const totalSessions = preferences.reduce(
      (sum, pref) => sum + pref.useCount,
      0
    );
    const averageSessionsPerActivity =
      activitiesUsed > 0 ? totalSessions / activitiesUsed : 0;

    // Find most used activity
    let mostUsedActivity: ActivityTypeWithUsage | null = null;
    if (preferences.length > 0) {
      const topPref = preferences.reduce((prev, current) =>
        prev.useCount > current.useCount ? prev : current
      );
      const topActivity = await getActivityTypeById(topPref.typeId, userId);
      if (topActivity) {
        mostUsedActivity = {
          ...topActivity,
          lastUsed: topPref.lastUsed,
          useCount: topPref.useCount,
        };
      }
    }

    return {
      totalActivities,
      activitiesUsed,
      mostUsedActivity,
      totalSessions,
      averageSessionsPerActivity,
    };
  } catch (_error) {
    const apiError = handleError(_error, 'Get activity usage stats', {
      defaultMessage: 'Failed to get activity usage statistics',
    });
    throw new Error(apiError.userMessage);
  }
}
