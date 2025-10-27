/**
 * Groups Feature Hooks - React Query Boundary
 *
 * This is the ONLY place where React Query should be used for groups.
 * All components should use these hooks instead of direct React Query or firebaseApi calls.
 *
 * Architecture:
 * Components → useGroups hooks (React Query) → GroupService → GroupRepository → Firebase
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GroupService } from '../services/GroupService';
import { Group } from '@/domain/entities/Group';
import { LeaderboardEntry, TimePeriod, GroupStats } from '../types/groups.types';

// Singleton service instance
const groupService = new GroupService();

// ==================== CACHE KEYS ====================
// Hierarchical cache keys for efficient invalidation
export const GROUPS_KEYS = {
  all: () => ['groups'] as const,
  lists: () => [...GROUPS_KEYS.all(), 'list'] as const,
  list: (filters?: string) => [...GROUPS_KEYS.lists(), { filters }] as const,
  details: () => [...GROUPS_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...GROUPS_KEYS.details(), id] as const,
  userGroups: (userId: string) => [...GROUPS_KEYS.all(), 'user', userId] as const,
  publicGroups: () => [...GROUPS_KEYS.lists(), 'public'] as const,
  leaderboard: (groupId: string, period: TimePeriod) =>
    [...GROUPS_KEYS.detail(groupId), 'leaderboard', period] as const,
  stats: (groupId: string) => [...GROUPS_KEYS.detail(groupId), 'stats'] as const,
};

// ==================== CACHE TIMES ====================
const CACHE_TIMES = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
};

// ==================== QUERY HOOKS ====================

/**
 * Get details for a specific group
 *
 * @example
 * const { data: group, isLoading, error } = useGroupDetails(groupId);
 */
export function useGroupDetails(
  groupId: string,
  options?: Partial<UseQueryOptions<Group | null, Error>>
) {
  return useQuery<Group | null, Error>({
    queryKey: GROUPS_KEYS.detail(groupId),
    queryFn: () => groupService.getGroupDetails(groupId),
    staleTime: CACHE_TIMES.LONG, // 15 minutes cache
    enabled: !!groupId,
    ...options,
  });
}

/**
 * Get all groups the user is a member of
 *
 * @example
 * const { data: userGroups, isLoading } = useUserGroups(userId);
 */
export function useUserGroups(
  userId: string,
  options?: Partial<UseQueryOptions<Group[], Error>>
) {
  return useQuery<Group[], Error>({
    queryKey: GROUPS_KEYS.userGroups(userId),
    queryFn: () => groupService.getUserGroups(userId),
    staleTime: CACHE_TIMES.LONG, // 15 minutes cache
    enabled: !!userId,
    ...options,
  });
}

/**
 * Get all public groups for discovery
 *
 * @example
 * const { data: publicGroups, isLoading } = usePublicGroups();
 */
export function usePublicGroups(
  limit?: number,
  options?: Partial<UseQueryOptions<Group[], Error>>
) {
  return useQuery<Group[], Error>({
    queryKey: GROUPS_KEYS.publicGroups(),
    queryFn: () => groupService.getPublicGroups(limit),
    staleTime: CACHE_TIMES.LONG, // 15 minutes cache
    ...options,
  });
}

/**
 * Get group leaderboard for a specific time period
 *
 * @example
 * const { data: leaderboard } = useGroupLeaderboard(groupId, 'week');
 */
export function useGroupLeaderboard(
  groupId: string,
  period: TimePeriod,
  options?: Partial<UseQueryOptions<LeaderboardEntry[], Error>>
) {
  return useQuery<LeaderboardEntry[], Error>({
    queryKey: GROUPS_KEYS.leaderboard(groupId, period),
    queryFn: () => groupService.getGroupLeaderboard(groupId, period),
    staleTime: CACHE_TIMES.MEDIUM, // 5 minutes cache for leaderboards
    enabled: !!groupId,
    ...options,
  });
}

/**
 * Get group statistics
 *
 * @example
 * const { data: stats } = useGroupStats(groupId);
 */
export function useGroupStats(
  groupId: string,
  options?: Partial<UseQueryOptions<GroupStats, Error>>
) {
  return useQuery<GroupStats, Error>({
    queryKey: GROUPS_KEYS.stats(groupId),
    queryFn: () => groupService.getGroupStats(groupId),
    staleTime: CACHE_TIMES.MEDIUM, // 5 minutes cache for stats
    enabled: !!groupId,
    ...options,
  });
}

/**
 * Check if a user can join a specific group
 *
 * @example
 * const { data: canJoin } = useCanJoinGroup(groupId, userId);
 */
export function useCanJoinGroup(
  groupId: string,
  userId: string,
  options?: Partial<UseQueryOptions<boolean, Error>>
) {
  return useQuery<boolean, Error>({
    queryKey: [...GROUPS_KEYS.detail(groupId), 'canJoin', userId],
    queryFn: () => groupService.canUserJoin(groupId, userId),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled: !!groupId && !!userId,
    ...options,
  });
}

/**
 * Check if a user can invite others to a specific group
 *
 * @example
 * const { data: canInvite } = useCanInviteToGroup(groupId, userId);
 */
export function useCanInviteToGroup(
  groupId: string,
  userId: string,
  options?: Partial<UseQueryOptions<boolean, Error>>
) {
  return useQuery<boolean, Error>({
    queryKey: [...GROUPS_KEYS.detail(groupId), 'canInvite', userId],
    queryFn: () => groupService.canUserInvite(groupId, userId),
    staleTime: CACHE_TIMES.MEDIUM,
    enabled: !!groupId && !!userId,
    ...options,
  });
}
