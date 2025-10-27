/**
 * Profile Hooks - Public API
 *
 * All profile-related hooks exported from here.
 *
 * @example
 * import { useProfileByUsername, useFollowUser } from '@/features/profile/hooks';
 */

// Query hooks
export {
  useProfileById,
  useProfileByUsername,
  useUserSessions,
  useProfileStats,
  useProfileChartData,
  useTopActivities,
  useFollowers,
  useFollowing,
  useIsFollowing,
  useCanViewProfile,
  PROFILE_KEYS,
} from './useProfile';

// Mutation hooks
export {
  useFollowUser,
  useUnfollowUser,
  useInvalidateProfile,
  useInvalidateAllProfiles,
} from './useProfileMutations';
