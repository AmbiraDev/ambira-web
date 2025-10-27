/**
 * Streaks Feature - Public API
 *
 * @example
 * ```tsx
 * import {
 *   useStreakData,
 *   useStreakStats,
 *   useUpdateStreakVisibility
 * } from '@/features/streaks/hooks';
 *
 * // Get streak data
 * const { data: streak } = useStreakData(userId);
 *
 * // Update visibility
 * const updateVisibility = useUpdateStreakVisibility();
 * updateVisibility.mutate({ userId, isPublic: true });
 * ```
 */

// Query hooks
export {
  useStreakData,
  useStreakStats,
  STREAK_KEYS,
} from './useStreaks';

// Mutation hooks
export {
  useUpdateStreakVisibility,
  useInvalidateStreak,
  useInvalidateAllStreaks,
} from './useStreakMutations';

// Types
export type { UpdateStreakVisibilityData } from './useStreakMutations';
