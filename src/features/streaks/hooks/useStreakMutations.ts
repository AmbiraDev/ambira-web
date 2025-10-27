/**
 * Streak Mutation Hooks - React Query Boundary
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { StreakService } from '../services/StreakService';
import { STREAK_KEYS } from './useStreaks';

const streakService = new StreakService();

/**
 * Update streak visibility setting
 *
 * @example
 * ```tsx
 * const updateVisibility = useUpdateStreakVisibility();
 *
 * updateVisibility.mutate(
 *   { userId: 'user-123', isPublic: true },
 *   {
 *     onSuccess: () => {
 *       console.log('Streak visibility updated');
 *     }
 *   }
 * );
 * ```
 */
export function useUpdateStreakVisibility(
  options?: Partial<UseMutationOptions<void, Error, UpdateStreakVisibilityData>>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateStreakVisibilityData>({
    mutationFn: ({ userId, isPublic }) =>
      streakService.updateStreakVisibility(userId, isPublic),
    onSuccess: (_, { userId }) => {
      // Invalidate streak data to refetch with new visibility
      queryClient.invalidateQueries({ queryKey: STREAK_KEYS.data(userId) });
      queryClient.invalidateQueries({ queryKey: STREAK_KEYS.stats(userId) });
    },
    ...options,
  });
}

/**
 * Helper to invalidate streak data for a user
 * Useful after actions that might affect streaks (completing sessions, etc.)
 */
export function useInvalidateStreak() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.invalidateQueries({ queryKey: STREAK_KEYS.data(userId) });
    queryClient.invalidateQueries({ queryKey: STREAK_KEYS.stats(userId) });
  };
}

/**
 * Helper to invalidate all streak data
 * Useful for admin operations or bulk updates
 */
export function useInvalidateAllStreaks() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: STREAK_KEYS.all() });
  };
}

// Types
export interface UpdateStreakVisibilityData {
  userId: string;
  isPublic: boolean;
}
