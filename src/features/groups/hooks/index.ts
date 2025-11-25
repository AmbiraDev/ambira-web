/**
 * Groups Feature Hooks - Public API
 *
 * All group-related hooks are exported from here.
 * Components should import from this file for a clean API.
 *
 * @example
 * import { useGroupDetails, useJoinGroup } from '@/features/groups/hooks';
 */

// Query hooks
export {
  useGroupDetails,
  useUserGroups,
  usePublicGroups,
  useGroupLeaderboard,
  useGroupStats,
  useCanJoinGroup,
  useCanInviteToGroup,
  useGroups,
  useGroupSearch,
  GROUPS_KEYS,
} from './useGroups'

// Members hook
export { useGroupMembers } from './useGroupMembers'

// Leaderboard hook (override the one from useGroups)
export { useGroupLeaderboard as useGroupLeaderboardData } from './useGroupLeaderboard'

// Mutation hooks
export {
  useJoinGroup,
  useLeaveGroup,
  useInvalidateGroups,
  useInvalidateGroup,
} from './useGroupMutations'
