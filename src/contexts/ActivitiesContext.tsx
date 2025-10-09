'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Activity,
  ActivityStats,
  CreateActivityData,
  UpdateActivityData,
  ActivitiesContextType,
  DEFAULT_ACTIVITIES
} from '@/types';
import { firebaseActivityApi } from '@/lib/firebaseApi';
import { useAuth } from './AuthContext';

// Create context (exported for direct use and backwards compatibility)
export const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined);

// Custom hook to use activities context
export const useActivities = (): ActivitiesContextType => {
  const context = useContext(ActivitiesContext);
  if (context === undefined) {
    throw new Error('useActivities must be used within an ActivitiesProvider');
  }
  return context;
};

// Custom hook to get a single activity
export const useActivity = (id: string): { activity: Activity | null; isLoading: boolean; error: string | null } => {
  const { activities, isLoading } = useActivities();
  const activity = activities.find(a => a.id === id) || null;

  return {
    activity,
    isLoading,
    error: null, // Could be enhanced to track individual activity errors
  };
};

// Activities provider component
interface ActivitiesProviderProps {
  children: ReactNode;
}

export const ActivitiesProvider: React.FC<ActivitiesProviderProps> = ({ children }) => {
  const [customActivities, setCustomActivities] = useState<Activity[]>([]);
  const [activityStats, setActivityStats] = useState<Map<string, ActivityStats>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Fetch custom activities when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchActivities();
      loadActivityStats();
    } else {
      setCustomActivities([]);
      setActivityStats(new Map());
      setError(null);
    }
  }, [isAuthenticated, user]);

  // Load stats for all activities (to filter out defaults with 0 hours)
  const loadActivityStats = async () => {
    if (!user) return;

    try {
      const { db } = await import('@/lib/firebase');
      const { collection, getDocs, query, where } = await import('firebase/firestore');

      const q = query(collection(db, 'sessions'), where('userId', '==', user.id));
      const snapshot = await getDocs(q);

      const statsMap = new Map<string, ActivityStats>();

      // Initialize all default activities with 0 stats
      DEFAULT_ACTIVITIES.forEach(activity => {
        statsMap.set(activity.id, {
          totalHours: 0,
          weeklyHours: 0,
          sessionCount: 0,
          currentStreak: 0,
          weeklyProgressPercentage: 0,
          totalProgressPercentage: 0,
          averageSessionDuration: 0
        });
      });

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      snapshot.forEach((doc) => {
        const data: any = doc.data();
        const activityId = data.activityId || data.projectId;
        if (!activityId) return;

        const duration = Number(data.duration) || 0;
        const start = data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime);

        const currentStats = statsMap.get(activityId) || {
          totalHours: 0,
          weeklyHours: 0,
          sessionCount: 0,
          currentStreak: 0,
          weeklyProgressPercentage: 0,
          totalProgressPercentage: 0,
          averageSessionDuration: 0
        };

        currentStats.totalHours += duration / 3600;
        currentStats.sessionCount += 1;
        if (start >= weekStart) {
          currentStats.weeklyHours += duration / 3600;
        }

        statsMap.set(activityId, currentStats);
      });

      setActivityStats(statsMap);
    } catch (err) {
      console.error('Error loading activity stats:', err);
    }
  };

  // Get all activities (default + custom, filtered by stats)
  const getAllActivities = (): Activity[] => {
    const defaults: Activity[] = DEFAULT_ACTIVITIES.map(defaultActivity => {
      const stats = activityStats.get(defaultActivity.id);
      return {
        id: defaultActivity.id,
        userId: user?.id || '',
        name: defaultActivity.name,
        icon: defaultActivity.icon,
        color: defaultActivity.color,
        description: '',
        status: 'active' as const,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }).filter(activity => {
      // Only show default activities with hours > 0
      const stats = activityStats.get(activity.id);
      return stats && stats.totalHours > 0;
    });

    return [...defaults, ...customActivities];
  };

  // Icon migration map from old Lucide names to new Iconify format
  const ICON_MIGRATION_MAP: Record<string, string> = {
    'Briefcase': 'flat-color-icons:briefcase',
    'BookOpen': 'flat-color-icons:reading',
    'Code': 'flat-color-icons:electronics',
    'Book': 'flat-color-icons:book',
    'Pencil': 'flat-color-icons:document',
    'Palette': 'flat-color-icons:gallery',
    'Dumbbell': 'flat-color-icons:sports-mode',
    'Brain': 'flat-color-icons:graduation-cap',
    'Folder': 'flat-color-icons:briefcase', // Default fallback
  };

  // Migrate activity icon if needed
  const migrateActivityIcon = async (activity: Activity): Promise<Activity> => {
    // Check if icon needs migration (doesn't contain ':' which indicates Iconify format)
    if (!activity.icon.includes(':')) {
      const newIcon = ICON_MIGRATION_MAP[activity.icon] || 'flat-color-icons:briefcase';

      try {
        // Update in Firebase
        await firebaseActivityApi.updateProject(activity.id, { icon: newIcon });
        console.log(`Migrated icon for ${activity.name}: ${activity.icon} -> ${newIcon}`);

        // Return updated activity
        return {
          ...activity,
          icon: newIcon
        };
      } catch (err) {
        console.error(`Failed to migrate icon for ${activity.name}:`, err);
        // Return activity with migrated icon even if update fails
        return {
          ...activity,
          icon: newIcon
        };
      }
    }

    return activity;
  };

  // Fetch all custom activities
  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const fetchedActivities = await firebaseActivityApi.getProjects();

      // Migrate icons if needed
      const migratedActivities = await Promise.all(
        fetchedActivities.map(activity => migrateActivityIcon(activity))
      );

      setCustomActivities(migratedActivities);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new activity
  const createActivity = async (data: CreateActivityData): Promise<Activity> => {
    try {
      setError(null);

      const newActivity = await firebaseActivityApi.createProject(data);

      // Add to local state
      setCustomActivities(prev => [...prev, newActivity]);

      return newActivity;
    } catch (err) {
      console.error('Error creating activity:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create activity';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update activity
  const updateActivity = async (id: string, data: UpdateActivityData): Promise<Activity> => {
    try {
      setError(null);

      const updatedActivity = await firebaseActivityApi.updateProject(id, data);

      // Update local state
      setCustomActivities(prev =>
        prev.map(a => a.id === id ? updatedActivity : a)
      );

      return updatedActivity;
    } catch (err) {
      console.error('Error updating activity:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update activity';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Delete activity
  const deleteActivity = async (id: string): Promise<void> => {
    try {
      setError(null);

      await firebaseActivityApi.deleteProject(id);

      // Remove from local state
      setCustomActivities(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting activity:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete activity';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Archive activity
  const archiveActivity = async (id: string): Promise<Activity> => {
    return updateActivity(id, { status: 'archived' });
  };

  // Restore activity
  const restoreActivity = async (id: string): Promise<Activity> => {
    return updateActivity(id, { status: 'active' });
  };

  // Get activity statistics
  const getActivityStats = async (id: string): Promise<ActivityStats> => {
    try {
      setError(null);

      // Return cached stats if available
      const cached = activityStats.get(id);
      if (cached) {
        return cached;
      }

      // Compute stats from sessions tied to this activity
      const userId = user?.id;
      if (!userId) {
        return {
          totalHours: 0,
          weeklyHours: 0,
          sessionCount: 0,
          currentStreak: 0,
          weeklyProgressPercentage: 0,
          totalProgressPercentage: 0,
          averageSessionDuration: 0
        };
      }

      // Import on-demand to avoid circular deps
      const { db } = await import('@/lib/firebase');
      const { collection, getDocs, query, where, or } = await import('firebase/firestore');

      // Query for both activityId and projectId (backwards compatibility)
      const q = query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        or(
          where('activityId', '==', id),
          where('projectId', '==', id)
        )
      );
      const snapshot = await getDocs(q);

      let totalSeconds = 0;
      let weeklySeconds = 0;
      let sessionCount = 0;
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      snapshot.forEach((doc) => {
        const data: any = doc.data();
        const duration = Number(data.duration) || 0;
        const start = data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime);
        totalSeconds += duration;
        sessionCount += 1;
        if (start >= weekStart) weeklySeconds += duration;
      });

      const totalHours = totalSeconds / 3600;
      const weeklyHours = weeklySeconds / 3600;

      // Streak placeholder for now
      const currentStreak = sessionCount > 0 ? 1 : 0;

      const stats: ActivityStats = {
        totalHours,
        weeklyHours,
        sessionCount,
        currentStreak,
        weeklyProgressPercentage: 0,
        totalProgressPercentage: 0,
        averageSessionDuration: sessionCount > 0 ? totalSeconds / sessionCount : 0
      };

      // Cache the stats
      setActivityStats(prev => new Map(prev).set(id, stats));

      return stats;
    } catch (err) {
      console.error('Error fetching activity stats:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activity stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const allActivitiesList = getAllActivities();

  const value: ActivitiesContextType = {
    activities: allActivitiesList,
    isLoading,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
    archiveActivity,
    restoreActivity,
    getActivityStats,
  };

  // Add backwards compatibility for 'projects' property
  const valueWithBackwardsCompat: any = {
    ...value,
    projects: allActivitiesList, // Alias for backwards compatibility
    createProject: createActivity,
    updateProject: updateActivity,
    deleteProject: deleteActivity,
    archiveProject: archiveActivity,
    restoreProject: restoreActivity,
    getProjectStats: getActivityStats,
  };

  return (
    <ActivitiesContext.Provider value={valueWithBackwardsCompat}>
      {children}
    </ActivitiesContext.Provider>
  );
};

// Backwards compatibility exports
export const ProjectsContext = ActivitiesContext;
export const ProjectsProvider = ActivitiesProvider;
export const useProjects = useActivities;
export const useProject = useActivity;
