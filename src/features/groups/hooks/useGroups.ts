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
import { Group as DomainGroup } from '@/domain/entities/Group';
import { Group as UIGroup } from '@/types';
import {
  LeaderboardEntry,
  TimePeriod,
  GroupStats,
} from '../types/groups.types';

// Singleton service instance
const groupService = new GroupService();

// ==================== ADAPTERS ====================
/**
 * Convert domain Group entity to UI Group interface
 * Maps domain model to the shape expected by UI components
 */
function adaptDomainGroupToUI(domainGroup: DomainGroup): UIGroup {
  return {
    id: domainGroup.id,
    name: domainGroup.name,
    description: domainGroup.description,
    category: domainGroup.category,
    type: 'professional', // Default type - can be made configurable
    privacySetting:
      domainGroup.privacy === 'public' ? 'public' : 'approval-required',
    memberCount: domainGroup.getMemberCount(),
    adminUserIds: Array.from(domainGroup.adminUserIds),
    memberIds: Array.from(domainGroup.memberIds),
    createdByUserId: domainGroup.createdByUserId,
    createdAt: domainGroup.createdAt,
    updatedAt: domainGroup.createdAt, // Use createdAt as updatedAt since domain doesn't track it
    imageUrl: domainGroup.imageUrl,
    location: domainGroup.location,
    // Optional fields - add defaults if needed by UI layer
    icon: undefined,
    color: undefined,
    bannerUrl: undefined,
  };
}

/**
 * Convert array of domain Groups to UI Groups
 */
function adaptDomainGroupsToUI(domainGroups: DomainGroup[]): UIGroup[] {
  return domainGroups.map(adaptDomainGroupToUI);
}

// ==================== CACHE KEYS ====================
// Hierarchical cache keys for efficient invalidation
export const GROUPS_KEYS = {
  all: () => ['groups'] as const,
  lists: () => [...GROUPS_KEYS.all(), 'list'] as const,
  list: (filters?: string) => [...GROUPS_KEYS.lists(), { filters }] as const,
  details: () => [...GROUPS_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...GROUPS_KEYS.details(), id] as const,
  userGroups: (userId: string) =>
    [...GROUPS_KEYS.all(), 'user', userId] as const,
  publicGroups: () => [...GROUPS_KEYS.lists(), 'public'] as const,
  leaderboard: (groupId: string, period: TimePeriod) =>
    [...GROUPS_KEYS.detail(groupId), 'leaderboard', period] as const,
  stats: (groupId: string) =>
    [...GROUPS_KEYS.detail(groupId), 'stats'] as const,
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
  options?: Partial<UseQueryOptions<UIGroup | null, Error>>
) {
  return useQuery<UIGroup | null, Error>({
    queryKey: GROUPS_KEYS.detail(groupId),
    queryFn: async () => {
      const domainGroup = await groupService.getGroupDetails(groupId);
      return domainGroup ? adaptDomainGroupToUI(domainGroup) : null;
    },
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
  options?: Partial<UseQueryOptions<UIGroup[], Error>>
) {
  return useQuery<UIGroup[], Error>({
    queryKey: GROUPS_KEYS.userGroups(userId),
    queryFn: async () => {
      const domainGroups = await groupService.getUserGroups(userId);
      return adaptDomainGroupsToUI(domainGroups);
    },
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
  options?: Partial<UseQueryOptions<UIGroup[], Error>>
) {
  return useQuery<UIGroup[], Error>({
    queryKey: [...GROUPS_KEYS.publicGroups(), limit],
    queryFn: async () => {
      const domainGroups = await groupService.getPublicGroups(limit);
      return adaptDomainGroupsToUI(domainGroups);
    },
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

/**
 * Get all groups with optional filters
 *
 * @example
 * const { data: groups } = useGroups({ category: 'fitness' });
 */
export function useGroups(
  filters?: Record<string, unknown>,
  options?: Partial<UseQueryOptions<UIGroup[], Error>>
) {
  return useQuery<UIGroup[], Error>({
    queryKey: GROUPS_KEYS.list(JSON.stringify(filters || {})),
    queryFn: async () => {
      const domainGroups = await groupService.getPublicGroups();
      return adaptDomainGroupsToUI(domainGroups);
    },
    staleTime: CACHE_TIMES.LONG,
    ...options,
  });
}

/**
 * Search for groups with specific criteria
 *
 * @example
 * const { data: groups } = useGroupSearch({ name: 'fitness' }, 50);
 */
export function useGroupSearch(
  filters: { name?: string; location?: string; category?: string },
  limit: number = 50,
  options?: Partial<UseQueryOptions<UIGroup[], Error>>
) {
  return useQuery<UIGroup[], Error>({
    queryKey: [...GROUPS_KEYS.lists(), 'search', filters, limit],
    queryFn: async () => {
      // Get all public groups and filter client-side
      const domainGroups = await groupService.getPublicGroups(limit);
      const filtered = domainGroups.filter(group => {
        const matchesName =
          !filters.name ||
          group.name.toLowerCase().includes(filters.name.toLowerCase());
        const matchesLocation =
          !filters.location ||
          group.location
            ?.toLowerCase()
            .includes(filters.location.toLowerCase());
        const matchesCategory =
          !filters.category || group.category === filters.category;
        return matchesName && matchesLocation && matchesCategory;
      });
      return adaptDomainGroupsToUI(filtered);
    },
    staleTime: CACHE_TIMES.SHORT,
    ...options,
  });
}
