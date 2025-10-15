/**
 * Optimized mutation hooks with optimistic updates
 * Reduces perceived latency and Firestore reads by updating UI immediately
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { firebaseApi } from '@/lib/firebaseApi';
import { CACHE_KEYS } from '@/lib/queryClient';
import { SessionWithDetails } from '@/types';

// ==================== SESSION SUPPORT MUTATIONS ====================

/**
 * Optimistic support/unsupport mutations
 * Updates UI immediately, then syncs with Firestore
 */
export function useSupportMutation(currentUserId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, action }: { sessionId: string; action: 'support' | 'unsupport' }) => {
      if (action === 'support') {
        await firebaseApi.post.supportSession(sessionId);
      } else {
        await firebaseApi.post.removeSupportFromSession(sessionId);
      }
    },
    onMutate: async ({ sessionId, action }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      await queryClient.cancelQueries({ queryKey: CACHE_KEYS.SESSION(sessionId) });

      // Snapshot the previous value
      const previousFeedData = queryClient.getQueriesData({ queryKey: ['feed'] });
      const previousSession = queryClient.getQueryData(CACHE_KEYS.SESSION(sessionId));

      // Optimistically update feed sessions
      queryClient.setQueriesData<any>({ queryKey: ['feed'] }, (old: any) => {
        if (!old) return old;

        const updateSession = (session: SessionWithDetails) => {
          if (session.id !== sessionId) return session;

          if (action === 'support') {
            return {
              ...session,
              isSupported: true,
              supportCount: session.supportCount + 1,
              supportedBy: [...(session.supportedBy || []), currentUserId].filter(Boolean),
            };
          } else {
            return {
              ...session,
              isSupported: false,
              supportCount: Math.max(0, session.supportCount - 1),
              supportedBy: (session.supportedBy || []).filter(id => id !== currentUserId),
            };
          }
        };

        if (Array.isArray(old)) {
          return old.map(updateSession);
        } else if (old.sessions) {
          return {
            ...old,
            sessions: old.sessions.map(updateSession),
          };
        }
        return old;
      });

      // Optimistically update individual session
      queryClient.setQueryData(CACHE_KEYS.SESSION(sessionId), (old: any) => {
        if (!old) return old;
        if (action === 'support') {
          return {
            ...old,
            isSupported: true,
            supportCount: old.supportCount + 1,
            supportedBy: [...(old.supportedBy || []), currentUserId].filter(Boolean),
          };
        } else {
          return {
            ...old,
            isSupported: false,
            supportCount: Math.max(0, old.supportCount - 1),
            supportedBy: (old.supportedBy || []).filter((id: string) => id !== currentUserId),
          };
        }
      });

      return { previousFeedData, previousSession };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFeedData) {
        context.previousFeedData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousSession) {
        queryClient.setQueryData(CACHE_KEYS.SESSION(variables.sessionId), context.previousSession);
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch in background to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SESSION(variables.sessionId) });
    },
  });
}

// ==================== COMMENT MUTATIONS ====================

export function useAddCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, text }: { sessionId: string; text: string }) => {
      return await firebaseApi.comment.createComment({ sessionId, content: text });
    },
    onSuccess: (data, variables) => {
      // Invalidate comments for this session
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.COMMENTS(variables.sessionId) });

      // Update comment count in feed
      queryClient.setQueriesData<any>({ queryKey: ['feed'] }, (old: any) => {
        if (!old) return old;

        const updateSession = (session: SessionWithDetails) => {
          if (session.id !== variables.sessionId) return session;
          return {
            ...session,
            commentCount: session.commentCount + 1,
          };
        };

        if (Array.isArray(old)) {
          return old.map(updateSession);
        } else if (old.sessions) {
          return {
            ...old,
            sessions: old.sessions.map(updateSession),
          };
        }
        return old;
      });

      // Update individual session
      queryClient.setQueryData(CACHE_KEYS.SESSION(variables.sessionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          commentCount: old.commentCount + 1,
        };
      });
    },
  });
}

export function useDeleteCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, commentId }: { sessionId: string; commentId: string }) => {
      return await firebaseApi.comment.deleteComment(commentId);
    },
    onSuccess: (data, variables) => {
      // Invalidate comments for this session
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.COMMENTS(variables.sessionId) });

      // Update comment count in feed
      queryClient.setQueriesData<any>({ queryKey: ['feed'] }, (old: any) => {
        if (!old) return old;

        const updateSession = (session: SessionWithDetails) => {
          if (session.id !== variables.sessionId) return session;
          return {
            ...session,
            commentCount: Math.max(0, session.commentCount - 1),
          };
        };

        if (Array.isArray(old)) {
          return old.map(updateSession);
        } else if (old.sessions) {
          return {
            ...old,
            sessions: old.sessions.map(updateSession),
          };
        }
        return old;
      });

      // Update individual session
      queryClient.setQueryData(CACHE_KEYS.SESSION(variables.sessionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          commentCount: Math.max(0, old.commentCount - 1),
        };
      });
    },
  });
}

/**
 * Optimistic comment like/unlike mutations
 * Updates UI immediately, then syncs with Firestore
 */
export function useCommentLikeMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, action }: { commentId: string; action: 'like' | 'unlike' }) => {
      try {
        if (action === 'like') {
          await firebaseApi.comment.likeComment(commentId);
        } else {
          await firebaseApi.comment.unlikeComment(commentId);
        }
      } catch (error: any) {
        // If already liked/unliked, treat as success (idempotent)
        const errorMsg = error.message || String(error);
        if (errorMsg.includes('Already liked') || errorMsg.includes('not liked')) {
          return;
        }
        throw error;
      }
    },
    onMutate: async ({ commentId, action }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: CACHE_KEYS.COMMENTS(sessionId) });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData(CACHE_KEYS.COMMENTS(sessionId));

      // Optimistically update comments
      queryClient.setQueryData(CACHE_KEYS.COMMENTS(sessionId), (old: any) => {
        if (!old?.comments) return old;

        return {
          ...old,
          comments: old.comments.map((comment: any) => {
            if (comment.id !== commentId) return comment;

            if (action === 'like') {
              return {
                ...comment,
                isLiked: true,
                likeCount: comment.likeCount + 1,
              };
            } else {
              return {
                ...comment,
                isLiked: false,
                likeCount: Math.max(0, comment.likeCount - 1),
              };
            }
          }),
        };
      });

      return { previousComments };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(CACHE_KEYS.COMMENTS(sessionId), context.previousComments);
      }
    },
    onSettled: () => {
      // Refetch in background to ensure consistency
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.COMMENTS(sessionId) });
    },
  });
}

// ==================== FOLLOW MUTATIONS ====================

export function useFollowMutation(currentUserId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'follow' | 'unfollow' }) => {
      if (action === 'follow') {
        await firebaseApi.user.followUser(userId);
      } else {
        await firebaseApi.user.unfollowUser(userId);
      }
    },
    onMutate: async ({ userId, action }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: CACHE_KEYS.USER_PROFILE(userId) });
      await queryClient.cancelQueries({ queryKey: CACHE_KEYS.USER_FOLLOWERS(userId) });
      if (currentUserId) {
        await queryClient.cancelQueries({ queryKey: CACHE_KEYS.USER_FOLLOWING(currentUserId) });
      }

      // Snapshot
      const previousProfile = queryClient.getQueryData(CACHE_KEYS.USER_PROFILE(userId));

      // Optimistic update
      queryClient.setQueryData(CACHE_KEYS.USER_PROFILE(userId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isFollowing: action === 'follow',
          followerCount: action === 'follow'
            ? old.followerCount + 1
            : Math.max(0, old.followerCount - 1),
        };
      });

      return { previousProfile };
    },
    onError: (err, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(CACHE_KEYS.USER_PROFILE(variables.userId), context.previousProfile);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.USER_PROFILE(variables.userId) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.USER_FOLLOWERS(variables.userId) });
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.USER_FOLLOWING(currentUserId) });
      }
    },
  });
}

// ==================== SESSION MUTATIONS ====================

export function useDeleteSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await firebaseApi.session.deleteSession(sessionId);
    },
    onMutate: async (sessionId) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      // Snapshot
      const previousFeedData = queryClient.getQueriesData({ queryKey: ['feed'] });

      // Optimistically remove from feed
      queryClient.setQueriesData<any>({ queryKey: ['feed'] }, (old: any) => {
        if (!old) return old;

        if (Array.isArray(old)) {
          return old.filter((s: any) => s.id !== sessionId);
        } else if (old.sessions) {
          return {
            ...old,
            sessions: old.sessions.filter((s: any) => s.id !== sessionId),
          };
        }
        return old;
      });

      return { previousFeedData };
    },
    onError: (err, variables, context) => {
      if (context?.previousFeedData) {
        context.previousFeedData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// ==================== ACTIVITY/PROJECT MUTATIONS ====================

export function useCreateActivityMutation(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      // Assuming firebaseActivityApi exists
      return await firebaseApi.project.createProject(data);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PROJECTS(userId) });
      }
    },
  });
}

export function useUpdateActivityMutation(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await firebaseApi.project.updateProject(id, data);
    },
    onSuccess: (data, variables) => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PROJECTS(userId) });
      }
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PROJECT(variables.id) });
    },
  });
}

export function useDeleteActivityMutation(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      await firebaseApi.project.deleteProject(activityId);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PROJECTS(userId) });
      }
    },
  });
}
