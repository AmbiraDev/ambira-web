import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  Activity,
  ActivityStats,
  CreateActivityData,
  UpdateActivityData,
} from '@/types';
import { firebaseActivityApi } from '@/lib/api';
import { CACHE_KEYS, CACHE_TIMES } from '@/lib/queryClient';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, or, and } from 'firebase/firestore';
import { safeNumber } from '@/lib/utils';

/**
 * Hook to fetch user activities with caching
 * Replaces ActivitiesContext for better performance and code splitting
 *
 * @param userId - User ID to fetch activities for (defaults to current user)
 * @param options - Additional React Query options
 */
export function useActivities(
  userId?: string,
  options?: Partial<UseQueryOptions<Activity[]>>
) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery({
    queryKey: CACHE_KEYS.PROJECTS(effectiveUserId || 'none'),
    queryFn: async () => {
      const activities = await firebaseActivityApi.getProjects();
      // Icon migration happens automatically in the API
      return activities;
    },
    enabled: !!effectiveUserId,
    staleTime: CACHE_TIMES.LONG, // 15 minutes cache
    gcTime: CACHE_TIMES.LONG,
    ...options,
  });
}

/**
 * Hook to get a single activity by ID
 * Derived from the activities list for efficiency
 */
export function useActivity(
  activityId: string,
  options?: Partial<UseQueryOptions<Activity | null>>
) {
  const { user } = useAuth();
  const { data: activities } = useActivities(user?.id);

  return useQuery({
    queryKey: ['activity', activityId],
    queryFn: () => {
      const activity = activities?.find(a => a.id === activityId);
      return activity || null;
    },
    enabled: !!activities && !!activityId,
    staleTime: CACHE_TIMES.LONG,
    ...options,
  });
}

/**
 * Hook to get activity statistics
 * Fetches on-demand for heavy computation
 */
export function useActivityStats(
  activityId: string,
  options?: Partial<UseQueryOptions<ActivityStats>>
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activity', 'stats', activityId, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return {
          totalHours: 0,
          weeklyHours: 0,
          sessionCount: 0,
          currentStreak: 0,
          weeklyProgressPercentage: 0,
          totalProgressPercentage: 0,
          averageSessionDuration: 0,
        };
      }

      // Query for both activityId and projectId (backwards compatibility)
      const q = query(
        collection(db, 'sessions'),
        and(
          where('userId', '==', user.id),
          or(
            where('activityId', '==', activityId),
            where('projectId', '==', activityId)
          )
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

      snapshot.forEach(doc => {
        const data: unknown = doc.data();
        const duration = safeNumber(data.duration, 0);
        const start = data.startTime?.toDate
          ? data.startTime.toDate()
          : new Date(data.startTime);
        totalSeconds += duration;
        sessionCount += 1;
        if (start >= weekStart) weeklySeconds += duration;
      });

      const totalHours = totalSeconds / 3600;
      const weeklyHours = weeklySeconds / 3600;

      // Streak placeholder for now
      const currentStreak = sessionCount > 0 ? 1 : 0;

      return {
        totalHours,
        weeklyHours,
        sessionCount,
        currentStreak,
        weeklyProgressPercentage: 0,
        totalProgressPercentage: 0,
        averageSessionDuration:
          sessionCount > 0 ? totalSeconds / sessionCount : 0,
      };
    },
    enabled: !!activityId && !!user,
    staleTime: CACHE_TIMES.VERY_LONG, // 1 hour cache for stats
    ...options,
  });
}

/**
 * Hook to create a new activity with optimistic updates
 */
export function useCreateActivity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = CACHE_KEYS.PROJECTS(user?.id || 'none');

  return useMutation({
    mutationFn: (data: CreateActivityData) =>
      firebaseActivityApi.createProject(data),

    // Optimistic update
    onMutate: async newActivity => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousActivities = queryClient.getQueryData<Activity[]>(queryKey);

      // Optimistically create a temporary activity
      const tempActivity: Activity = {
        id: `temp-${Date.now()}`,
        userId: user?.id || '',
        name: newActivity.name,
        description: newActivity.description,
        icon: newActivity.icon || 'flat-color-icons:briefcase',
        color: newActivity.color || '#007AFF',
        status: 'active',
        weeklyTarget: newActivity.weeklyTarget,
        totalTarget: newActivity.totalTarget,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to cache optimistically
      if (previousActivities) {
        queryClient.setQueryData<Activity[]>(queryKey, [
          ...previousActivities,
          tempActivity,
        ]);
      }

      return { previousActivities, tempActivity };
    },

    // On success, replace temp with real activity
    onSuccess: (newActivity, variables, context) => {
      const previousActivities = context?.previousActivities || [];
      const tempActivity = context?.tempActivity;

      // Replace temp activity with real one
      queryClient.setQueryData<Activity[]>(
        queryKey,
        previousActivities
          .filter(a => a.id !== tempActivity?.id)
          .concat(newActivity)
      );
    },

    // On error, roll back
    onError: (err, variables, context) => {
      if (context?.previousActivities) {
        queryClient.setQueryData(queryKey, context.previousActivities);
      }
      console.error('Error creating activity:', err);
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Hook to update an existing activity with optimistic updates
 */
export function useUpdateActivity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = CACHE_KEYS.PROJECTS(user?.id || 'none');

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateActivityData }) =>
      firebaseActivityApi.updateProject(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousActivities = queryClient.getQueryData<Activity[]>(queryKey);

      // Optimistically update the activity
      if (previousActivities) {
        queryClient.setQueryData<Activity[]>(
          queryKey,
          previousActivities.map(a =>
            a.id === id ? { ...a, ...data, updatedAt: new Date() } : a
          )
        );
      }

      return { previousActivities };
    },

    // On success, use the real updated activity
    onSuccess: (updatedActivity, variables, context) => {
      const previousActivities = context?.previousActivities || [];
      queryClient.setQueryData<Activity[]>(
        queryKey,
        previousActivities.map(a =>
          a.id === updatedActivity.id ? updatedActivity : a
        )
      );
    },

    // On error, roll back
    onError: (err, variables, context) => {
      if (context?.previousActivities) {
        queryClient.setQueryData(queryKey, context.previousActivities);
      }
      console.error('Error updating activity:', err);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Hook to delete an activity with optimistic updates
 */
export function useDeleteActivity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = CACHE_KEYS.PROJECTS(user?.id || 'none');

  return useMutation({
    mutationFn: (activityId: string) =>
      firebaseActivityApi.deleteProject(activityId),

    // Optimistic update
    onMutate: async activityId => {
      await queryClient.cancelQueries({ queryKey });

      const previousActivities = queryClient.getQueryData<Activity[]>(queryKey);

      // Optimistically remove the activity
      if (previousActivities) {
        queryClient.setQueryData<Activity[]>(
          queryKey,
          previousActivities.filter(a => a.id !== activityId)
        );
      }

      return { previousActivities };
    },

    // On error, roll back
    onError: (err, activityId, context) => {
      if (context?.previousActivities) {
        queryClient.setQueryData(queryKey, context.previousActivities);
      }
      console.error('Error deleting activity:', err);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Hook to archive an activity
 * Convenience wrapper around useUpdateActivity
 */
export function useArchiveActivity() {
  const updateActivity = useUpdateActivity();

  return useMutation({
    mutationFn: (activityId: string) =>
      updateActivity.mutateAsync({
        id: activityId,
        data: { status: 'archived' },
      }),
  });
}

/**
 * Hook to restore an archived activity
 * Convenience wrapper around useUpdateActivity
 */
export function useRestoreActivity() {
  const updateActivity = useUpdateActivity();

  return useMutation({
    mutationFn: (activityId: string) =>
      updateActivity.mutateAsync({
        id: activityId,
        data: { status: 'active' },
      }),
  });
}

/**
 * Backward compatibility: Alias activities as projects
 */
export const useProjects = useActivities;
export const useProject = useActivity;
export const useProjectStats = useActivityStats;
export const useCreateProject = useCreateActivity;
export const useUpdateProject = useUpdateActivity;
export const useDeleteProject = useDeleteActivity;
export const useArchiveProject = useArchiveActivity;
export const useRestoreProject = useRestoreActivity;
