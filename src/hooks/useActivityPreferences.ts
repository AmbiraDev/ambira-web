/**
 * Activity Preferences Query Hooks - React Query Boundary
 *
 * This is the ONLY place where React Query should be used for activity preferences.
 * All components should use these hooks instead of direct API calls.
 *
 * Cache Strategy:
 * - User preferences: 15 minutes
 * - Recent activities: 15 minutes (updated optimistically on session creation)
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'
import { Timestamp } from 'firebase/firestore'
import { UserActivityPreference } from '@/types'
import { CACHE_TIMES } from '@/lib/queryClient'
import {
  firebaseActivityPreferencesApi,
  getRecentActivities,
  getAllActivityPreferences,
  getActivityPreference,
  updateActivityPreference,
} from '@/lib/api/activityPreferences'
import { useAuth } from './useAuth'

// ==================== CACHE KEYS ====================

export const ACTIVITY_PREFERENCE_KEYS = {
  all: () => ['activityPreferences'] as const,
  recent: (userId: string, limit?: number) =>
    [...ACTIVITY_PREFERENCE_KEYS.all(), 'recent', userId, limit] as const,
  list: (userId: string) => [...ACTIVITY_PREFERENCE_KEYS.all(), 'list', userId] as const,
  detail: (userId: string, typeId: string) =>
    [...ACTIVITY_PREFERENCE_KEYS.all(), 'detail', userId, typeId] as const,
}

// ==================== QUERY HOOKS ====================

/**
 * Get recent activities for horizontal bar in picker
 *
 * Returns the most recently used activities.
 * Cached for 15 minutes, updated optimistically on session creation.
 *
 * @param userId - User ID
 * @param limit - Number of recent activities (default: 5)
 *
 * @example
 * const { data: recentActivities, isLoading } = useRecentActivities(userId);
 * const { data: top3 } = useRecentActivities(userId, 3);
 */
export function useRecentActivities(
  userId: string,
  limit: number = 5,
  options?: Partial<UseQueryOptions<UserActivityPreference[], Error>>
) {
  return useQuery<UserActivityPreference[], Error>({
    queryKey: ACTIVITY_PREFERENCE_KEYS.recent(userId, limit),
    queryFn: () => getRecentActivities(userId, limit),
    staleTime: CACHE_TIMES.LONG, // 15 minutes
    gcTime: CACHE_TIMES.LONG,
    enabled: !!userId,
    ...options,
  })
}

/**
 * Get all activity preferences for a user
 *
 * Returns all activities the user has used, ordered by most recent.
 * Cached for 15 minutes.
 *
 * @param userId - User ID
 *
 * @example
 * const { data: allPreferences, isLoading } = useAllActivityPreferences(userId);
 */
export function useAllActivityPreferences(
  userId: string,
  options?: Partial<UseQueryOptions<UserActivityPreference[], Error>>
) {
  return useQuery<UserActivityPreference[], Error>({
    queryKey: ACTIVITY_PREFERENCE_KEYS.list(userId),
    queryFn: () => getAllActivityPreferences(userId),
    staleTime: CACHE_TIMES.LONG, // 15 minutes
    gcTime: CACHE_TIMES.LONG,
    enabled: !!userId,
    ...options,
  })
}

/**
 * Get a single activity preference
 *
 * Returns usage data for a specific activity.
 * Cached for 15 minutes.
 *
 * @param userId - User ID
 * @param typeId - Activity type ID
 *
 * @example
 * const { data: preference } = useActivityPreference(userId, 'work');
 */
export function useActivityPreference(
  userId: string,
  typeId: string,
  options?: Partial<UseQueryOptions<UserActivityPreference | null, Error>>
) {
  return useQuery<UserActivityPreference | null, Error>({
    queryKey: ACTIVITY_PREFERENCE_KEYS.detail(userId, typeId),
    queryFn: () => getActivityPreference(userId, typeId),
    staleTime: CACHE_TIMES.LONG, // 15 minutes
    gcTime: CACHE_TIMES.LONG,
    enabled: !!userId && !!typeId,
    ...options,
  })
}

// ==================== MUTATION HOOKS ====================

// Context types for mutation rollbacks
type UpdateActivityPreferenceContext = {
  previousRecent: unknown
  previousList: unknown
  previousDetail: unknown
}

/**
 * Update activity preference (track usage)
 *
 * Called when user creates a session with an activity.
 * Updates lastUsed timestamp and increments useCount.
 * Performs optimistic updates to all related queries.
 *
 * @example
 * const updateMutation = useUpdateActivityPreference();
 *
 * // When user creates a session
 * updateMutation.mutate({ typeId: 'work' });
 *
 * // Or with explicit userId (admin use case)
 * updateMutation.mutate({ typeId: 'work', userId: 'user123' });
 */
export function useUpdateActivityPreference(
  options?: Partial<
    UseMutationOptions<
      void,
      Error,
      { typeId: string; userId?: string },
      UpdateActivityPreferenceContext
    >
  >
) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation<
    void,
    Error,
    { typeId: string; userId?: string },
    UpdateActivityPreferenceContext
  >({
    mutationFn: ({ typeId, userId }) => updateActivityPreference(typeId, userId),

    onMutate: async ({ typeId, userId }) => {
      const targetUserId = userId || user?.id
      if (!targetUserId) {
        return {
          previousRecent: null,
          previousList: null,
          previousDetail: null,
        }
      }

      // Cancel outgoing queries for all preference queries
      await queryClient.cancelQueries({
        queryKey: ACTIVITY_PREFERENCE_KEYS.recent(targetUserId),
      })
      await queryClient.cancelQueries({
        queryKey: ACTIVITY_PREFERENCE_KEYS.list(targetUserId),
      })
      await queryClient.cancelQueries({
        queryKey: ACTIVITY_PREFERENCE_KEYS.detail(targetUserId, typeId),
      })

      // Snapshot previous values
      const previousRecent = queryClient.getQueryData(
        ACTIVITY_PREFERENCE_KEYS.recent(targetUserId, 5)
      )
      const previousList = queryClient.getQueryData(ACTIVITY_PREFERENCE_KEYS.list(targetUserId))
      const previousDetail = queryClient.getQueryData(
        ACTIVITY_PREFERENCE_KEYS.detail(targetUserId, typeId)
      )

      // Helper to update a preference
      const updatePreference = (pref: UserActivityPreference): UserActivityPreference => {
        if (pref.typeId !== typeId) return pref
        return {
          ...pref,
          lastUsed: Timestamp.fromDate(new Date()),
          useCount: pref.useCount + 1,
          updatedAt: Timestamp.fromDate(new Date()),
        }
      }

      // Helper to create new preference if doesn't exist
      const createPreference = (): UserActivityPreference => ({
        typeId,
        userId: targetUserId,
        lastUsed: Timestamp.fromDate(new Date()),
        useCount: 1,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      })

      // Optimistically update recent activities
      queryClient.setQueryData<UserActivityPreference[]>(
        ACTIVITY_PREFERENCE_KEYS.recent(targetUserId, 5),
        (old) => {
          if (!old) return [createPreference()]

          // Check if activity already in recent
          const existingIndex = old.findIndex((p) => p.typeId === typeId)

          if (existingIndex >= 0) {
            // Update existing and move to front
            const existingPref = old[existingIndex]
            if (!existingPref) return old
            const updated = updatePreference(existingPref)
            return [updated, ...old.filter((_, i) => i !== existingIndex)]
          } else {
            // Add new to front, limit to 5
            return [createPreference(), ...old].slice(0, 5)
          }
        }
      )

      // Optimistically update all preferences list
      queryClient.setQueryData<UserActivityPreference[]>(
        ACTIVITY_PREFERENCE_KEYS.list(targetUserId),
        (old) => {
          if (!old) return [createPreference()]

          const existingIndex = old.findIndex((p) => p.typeId === typeId)

          if (existingIndex >= 0) {
            // Update existing and move to front
            const existingPref = old[existingIndex]
            if (!existingPref) return old
            const updated = updatePreference(existingPref)
            return [updated, ...old.filter((_, i) => i !== existingIndex)]
          } else {
            // Add new to front
            return [createPreference(), ...old]
          }
        }
      )

      // Optimistically update detail
      queryClient.setQueryData<UserActivityPreference | null>(
        ACTIVITY_PREFERENCE_KEYS.detail(targetUserId, typeId),
        (old) => {
          if (!old) return createPreference()
          return updatePreference(old)
        }
      )

      return { previousRecent, previousList, previousDetail }
    },

    onError: (error, { typeId, userId }, context) => {
      const targetUserId = userId || user?.id
      if (!targetUserId || !context) return

      // Rollback on error
      if (context.previousRecent !== undefined) {
        queryClient.setQueryData(
          ACTIVITY_PREFERENCE_KEYS.recent(targetUserId, 5),
          context.previousRecent
        )
      }
      if (context.previousList !== undefined) {
        queryClient.setQueryData(ACTIVITY_PREFERENCE_KEYS.list(targetUserId), context.previousList)
      }
      if (context.previousDetail !== undefined) {
        queryClient.setQueryData(
          ACTIVITY_PREFERENCE_KEYS.detail(targetUserId, typeId),
          context.previousDetail
        )
      }
    },

    onSuccess: (_, { typeId, userId }) => {
      const targetUserId = userId || user?.id
      if (!targetUserId) return

      // Invalidate to fetch fresh data (server timestamps)
      queryClient.invalidateQueries({
        queryKey: ACTIVITY_PREFERENCE_KEYS.recent(targetUserId),
      })
      queryClient.invalidateQueries({
        queryKey: ACTIVITY_PREFERENCE_KEYS.list(targetUserId),
      })
      queryClient.invalidateQueries({
        queryKey: ACTIVITY_PREFERENCE_KEYS.detail(targetUserId, typeId),
      })
    },

    ...options,
  })
}

/**
 * Helper hook to invalidate all activity preferences for a user
 *
 * Useful when you need to force a refetch (e.g., after migration).
 *
 * @example
 * const invalidatePreferences = useInvalidateActivityPreferences();
 * invalidatePreferences(userId);
 */
export function useInvalidateActivityPreferences() {
  const queryClient = useQueryClient()

  return (userId: string) => {
    queryClient.invalidateQueries({
      queryKey: ACTIVITY_PREFERENCE_KEYS.all(),
      predicate: (query) => {
        const key = query.queryKey as string[]
        return key.includes(userId)
      },
    })
  }
}

// Export the API for direct usage if needed
export { firebaseActivityPreferencesApi }
