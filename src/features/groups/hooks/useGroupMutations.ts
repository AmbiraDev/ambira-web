/**
 * Group Mutations - React Query Boundary
 *
 * This file contains all group mutation hooks (create, update, delete, join, leave).
 * Includes optimistic updates and cache invalidation.
 */

import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
import { GroupService } from '../services/GroupService';
import { GROUPS_KEYS } from './useGroups';
import { Group } from '@/types';

// Singleton service instance
const groupService = new GroupService();

// Type for group cache data with member info
interface GroupCacheData {
  id: string;
  memberIds: string[];
}

// ==================== MUTATION HOOKS ====================

/**
 * Join a group
 *
 * @example
 * const joinMutation = useJoinGroup();
 * joinMutation.mutate({ groupId: '123', userId: 'user-456' });
 */
export function useJoinGroup(
  options?: Partial<
    UseMutationOptions<void, Error, { groupId: string; userId: string }>
  >
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { groupId: string; userId: string }>({
    mutationFn: ({ groupId, userId }) =>
      groupService.joinGroup({ groupId }, userId),

    onMutate: async ({ groupId, userId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: GROUPS_KEYS.detail(groupId),
      });
      await queryClient.cancelQueries({
        queryKey: GROUPS_KEYS.userGroups(userId),
      });

      // Snapshot previous values for rollback
      const previousGroup = queryClient.getQueryData<Group>(
        GROUPS_KEYS.detail(groupId)
      );
      const previousUserGroups = queryClient.getQueryData<Group[]>(
        GROUPS_KEYS.userGroups(userId)
      );

      // Optimistically update group member count
      queryClient.setQueryData<Group>(GROUPS_KEYS.detail(groupId), (old) => {
        if (!old) return old;
        return {
          ...old,
          memberIds: [...old.memberIds, userId],
        };
      });

      return { previousGroup, previousUserGroups };
    },

    onError: (error, variables, context: unknown) => {
      // Rollback on error
      if (
        context &&
        typeof context === 'object' &&
        'previousGroup' in context &&
        context.previousGroup
      ) {
        queryClient.setQueryData<Group>(
          GROUPS_KEYS.detail(variables.groupId),
          context.previousGroup as Group
        );
      }
      if (
        context &&
        typeof context === 'object' &&
        'previousUserGroups' in context &&
        context.previousUserGroups
      ) {
        queryClient.setQueryData<Group[]>(
          GROUPS_KEYS.userGroups(variables.userId),
          context.previousUserGroups as Group[]
        );
      }
    },

    onSuccess: (_, { groupId, userId }) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.detail(groupId) });
      queryClient.invalidateQueries({
        queryKey: GROUPS_KEYS.userGroups(userId),
      });
      queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.stats(groupId) });
    },

    ...options,
  });
}

/**
 * Leave a group
 *
 * @example
 * const leaveMutation = useLeaveGroup();
 * leaveMutation.mutate({ groupId: '123', userId: 'user-456' });
 */
export function useLeaveGroup(
  options?: Partial<
    UseMutationOptions<void, Error, { groupId: string; userId: string }>
  >
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { groupId: string; userId: string }>({
    mutationFn: ({ groupId, userId }) =>
      groupService.leaveGroup({ groupId }, userId),

    onMutate: async ({ groupId, userId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: GROUPS_KEYS.detail(groupId),
      });
      await queryClient.cancelQueries({
        queryKey: GROUPS_KEYS.userGroups(userId),
      });

      // Snapshot previous values
      const previousGroup = queryClient.getQueryData<Group>(
        GROUPS_KEYS.detail(groupId)
      );
      const previousUserGroups = queryClient.getQueryData<Group[]>(
        GROUPS_KEYS.userGroups(userId)
      );

      // Optimistically update group
      queryClient.setQueryData<Group>(GROUPS_KEYS.detail(groupId), (old) => {
        if (!old) return old;
        return {
          ...old,
          memberIds: old.memberIds.filter((id) => id !== userId),
        };
      });

      // Optimistically remove from user groups
      queryClient.setQueryData<Group[]>(GROUPS_KEYS.userGroups(userId), (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((group) => group.id !== groupId);
      });

      return { previousGroup, previousUserGroups };
    },

    onError: (error, variables, context: unknown) => {
      // Rollback on error
      if (
        context &&
        typeof context === 'object' &&
        'previousGroup' in context &&
        context.previousGroup
      ) {
        queryClient.setQueryData<Group>(
          GROUPS_KEYS.detail(variables.groupId),
          context.previousGroup as Group
        );
      }
      if (
        context &&
        typeof context === 'object' &&
        'previousUserGroups' in context &&
        context.previousUserGroups
      ) {
        queryClient.setQueryData<Group[]>(
          GROUPS_KEYS.userGroups(variables.userId),
          context.previousUserGroups as Group[]
        );
      }
    },

    onSuccess: (_, { groupId, userId }) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.detail(groupId) });
      queryClient.invalidateQueries({
        queryKey: GROUPS_KEYS.userGroups(userId),
      });
      queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.stats(groupId) });
    },

    ...options,
  });
}

/**
 * Helper hook to invalidate all group-related queries
 * Useful for scenarios where you need to refresh all group data
 *
 * @example
 * const invalidateGroups = useInvalidateGroups();
 * invalidateGroups();
 */
export function useInvalidateGroups() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.all() });
  };
}

/**
 * Helper hook to invalidate specific group data
 *
 * @example
 * const invalidateGroup = useInvalidateGroup();
 * invalidateGroup('group-123');
 */
export function useInvalidateGroup() {
  const queryClient = useQueryClient();

  return (groupId: string) => {
    queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.detail(groupId) });
  };
}
