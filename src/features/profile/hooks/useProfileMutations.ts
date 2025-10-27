/**
 * Profile Mutation Hooks - React Query Boundary
 *
 * Note: Follow/unfollow mutations are currently placeholders as the ProfileService
 * shows these operations aren't fully implemented in the clean architecture yet.
 * When they are implemented, these hooks will handle the React Query integration.
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { ProfileService } from '../services/ProfileService';
import { PROFILE_KEYS } from './useProfile';

const profileService = new ProfileService();

/**
 * Follow a user
 *
 * Note: Currently a placeholder. The actual implementation is pending
 * in the ProfileService. Use the existing firebaseApi.user.followUser for now.
 *
 * @example
 * const followMutation = useFollowUser();
 * followMutation.mutate({ currentUserId, targetUserId });
 */
export function useFollowUser(
  options?: Partial<UseMutationOptions<void, Error, { currentUserId: string; targetUserId: string }>>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { currentUserId: string; targetUserId: string }>({
    mutationFn: ({ currentUserId, targetUserId }) =>
      profileService.followUser(currentUserId, targetUserId),

    onMutate: async ({ currentUserId, targetUserId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: PROFILE_KEYS.detail(targetUserId) });
      await queryClient.cancelQueries({ queryKey: PROFILE_KEYS.following(currentUserId) });
      await queryClient.cancelQueries({ queryKey: PROFILE_KEYS.followers(targetUserId) });

      // Snapshot previous values
      const previousProfile = queryClient.getQueryData(PROFILE_KEYS.detail(targetUserId));
      const previousFollowing = queryClient.getQueryData(PROFILE_KEYS.following(currentUserId));

      // Optimistically update isFollowing
      queryClient.setQueryData(
        PROFILE_KEYS.isFollowing(currentUserId, targetUserId),
        true
      );

      // Optimistically update follower count on profile
      queryClient.setQueryData(PROFILE_KEYS.detail(targetUserId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          followerCount: (old.followerCount || 0) + 1,
        };
      });

      return { previousProfile, previousFollowing };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          PROFILE_KEYS.detail(variables.targetUserId),
          context.previousProfile
        );
      }
      if (context?.previousFollowing) {
        queryClient.setQueryData(
          PROFILE_KEYS.following(variables.currentUserId),
          context.previousFollowing
        );
      }
      queryClient.setQueryData(
        PROFILE_KEYS.isFollowing(variables.currentUserId, variables.targetUserId),
        false
      );
    },

    onSuccess: (_, { currentUserId, targetUserId }) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail(targetUserId) });
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.following(currentUserId) });
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.followers(targetUserId) });
      queryClient.invalidateQueries({
        queryKey: PROFILE_KEYS.isFollowing(currentUserId, targetUserId),
      });
    },

    ...options,
  });
}

/**
 * Unfollow a user
 *
 * Note: Currently a placeholder. The actual implementation is pending
 * in the ProfileService. Use the existing firebaseApi.user.unfollowUser for now.
 *
 * @example
 * const unfollowMutation = useUnfollowUser();
 * unfollowMutation.mutate({ currentUserId, targetUserId });
 */
export function useUnfollowUser(
  options?: Partial<UseMutationOptions<void, Error, { currentUserId: string; targetUserId: string }>>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { currentUserId: string; targetUserId: string }>({
    mutationFn: ({ currentUserId, targetUserId }) =>
      profileService.unfollowUser(currentUserId, targetUserId),

    onMutate: async ({ currentUserId, targetUserId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: PROFILE_KEYS.detail(targetUserId) });
      await queryClient.cancelQueries({ queryKey: PROFILE_KEYS.following(currentUserId) });
      await queryClient.cancelQueries({ queryKey: PROFILE_KEYS.followers(targetUserId) });

      // Snapshot previous values
      const previousProfile = queryClient.getQueryData(PROFILE_KEYS.detail(targetUserId));

      // Optimistically update isFollowing
      queryClient.setQueryData(
        PROFILE_KEYS.isFollowing(currentUserId, targetUserId),
        false
      );

      // Optimistically update follower count on profile
      queryClient.setQueryData(PROFILE_KEYS.detail(targetUserId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          followerCount: Math.max(0, (old.followerCount || 0) - 1),
        };
      });

      return { previousProfile };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          PROFILE_KEYS.detail(variables.targetUserId),
          context.previousProfile
        );
      }
      queryClient.setQueryData(
        PROFILE_KEYS.isFollowing(variables.currentUserId, variables.targetUserId),
        true
      );
    },

    onSuccess: (_, { currentUserId, targetUserId }) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail(targetUserId) });
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.following(currentUserId) });
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.followers(targetUserId) });
      queryClient.invalidateQueries({
        queryKey: PROFILE_KEYS.isFollowing(currentUserId, targetUserId),
      });
    },

    ...options,
  });
}

/**
 * Helper hook to invalidate all profile-related queries for a user
 *
 * @example
 * const invalidateProfile = useInvalidateProfile();
 * invalidateProfile(userId);
 */
export function useInvalidateProfile() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail(userId) });
  };
}

/**
 * Helper hook to invalidate all profile queries
 *
 * Use after operations that affect multiple profiles.
 *
 * @example
 * const invalidateAllProfiles = useInvalidateAllProfiles();
 * invalidateAllProfiles();
 */
export function useInvalidateAllProfiles() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.all() });
  };
}
