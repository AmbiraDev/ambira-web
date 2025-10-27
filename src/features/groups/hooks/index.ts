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
  GROUPS_KEYS,
} from './useGroups';

// Mutation hooks
export {
  useJoinGroup,
  useLeaveGroup,
  useInvalidateGroups,
  useInvalidateGroup,
} from './useGroupMutations';
