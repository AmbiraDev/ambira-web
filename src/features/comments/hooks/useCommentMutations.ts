/**
 * Comment Mutation Hooks - React Query Boundary
 *
 * All write operations for comments (create, update, delete, like).
 */

import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
import { CommentService, CommentLikeData } from '../services/CommentService';
import { COMMENT_KEYS } from './useComments';
import {
  CommentWithDetails,
  CreateCommentData,
  UpdateCommentData,
  Session,
  SessionWithDetails,
  CommentsResponse,
} from '@/types';
import { SESSION_KEYS } from '@/features/sessions/hooks';

const commentService = new CommentService();

// Feed data structures from React Query cache
interface FeedArrayData {
  sessions?: SessionWithDetails[];
  hasMore?: boolean;
  nextCursor?: string;
}

interface FeedInfiniteData {
  pages: Array<{
    sessions: SessionWithDetails[];
    hasMore: boolean;
    nextCursor?: string;
  }>;
  pageParams: unknown[];
}

type FeedData = SessionWithDetails[] | FeedArrayData | FeedInfiniteData;

/**
 * Create a new comment
 *
 * @example
 * const createMutation = useCreateComment();
 * createMutation.mutate({
 *   sessionId: 'abc123',
 *   content: 'Great work!',
 *   parentId: 'comment-456' // Optional for replies
 * });
 */
export function useCreateComment(
  options?: Partial<
    UseMutationOptions<CommentWithDetails, Error, CreateCommentData>
  >
) {
  const queryClient = useQueryClient();

  return useMutation<CommentWithDetails, Error, CreateCommentData>({
    mutationFn: data => commentService.createComment(data),

    onSuccess: (newComment, variables) => {
      // Invalidate comments for this session
      queryClient.invalidateQueries({
        queryKey: COMMENT_KEYS.session(variables.sessionId),
      });

      // Update comment count in session cache and feed
      const updateSessionCommentCount = (
        session: Session | SessionWithDetails
      ): Session | SessionWithDetails => {
        if (session?.id !== variables.sessionId) return session;
        return {
          ...session,
          commentCount: (session.commentCount || 0) + 1,
        };
      };

      // Update session detail cache
      queryClient.setQueryData(
        SESSION_KEYS.detail(variables.sessionId),
        updateSessionCommentCount
      );

      // Update feed caches
      queryClient.setQueriesData<FeedData>({ queryKey: ['feed'] }, old => {
        if (!old) return old;

        if (Array.isArray(old)) {
          return old.map(updateSessionCommentCount);
        } else if ('sessions' in old && old.sessions) {
          return {
            ...old,
            sessions: old.sessions.map(updateSessionCommentCount),
          };
        } else if ('pages' in old && old.pages) {
          // Handle infinite query
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              sessions: page.sessions.map(updateSessionCommentCount),
            })),
          };
        }

        return old;
      });
    },

    ...options,
  });
}

/**
 * Update a comment
 *
 * @example
 * const updateMutation = useUpdateComment();
 * updateMutation.mutate({
 *   commentId: 'comment-123',
 *   sessionId: 'session-456',
 *   data: { content: 'Updated comment text' }
 * });
 */
export function useUpdateComment(
  options?: Partial<
    UseMutationOptions<
      void,
      Error,
      { commentId: string; sessionId: string; data: UpdateCommentData }
    >
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { commentId: string; sessionId: string; data: UpdateCommentData }
  >({
    mutationFn: ({ commentId, data }) =>
      commentService.updateComment(commentId, data),

    onMutate: async ({ commentId, sessionId, data }) => {
      await queryClient.cancelQueries({
        queryKey: COMMENT_KEYS.session(sessionId),
      });

      const previousComments = queryClient.getQueryData(
        COMMENT_KEYS.session(sessionId)
      );

      // Optimistically update
      queryClient.setQueryData<CommentsResponse>(
        COMMENT_KEYS.list(sessionId),
        old => {
          if (!old?.comments) return old;

          return {
            ...old,
            comments: old.comments.map(comment =>
              comment.id === commentId
                ? { ...comment, ...data, isEdited: true }
                : comment
            ),
          };
        }
      );

      return { previousComments };
    },

    onError: (error, { sessionId }, context: unknown) => {
      if (
        context &&
        typeof context === 'object' &&
        'previousComments' in context &&
        context.previousComments
      ) {
        queryClient.setQueryData(
          COMMENT_KEYS.session(sessionId),
          context.previousComments
        );
      }
    },

    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: COMMENT_KEYS.session(sessionId),
      });
    },

    ...options,
  });
}

/**
 * Delete a comment
 *
 * @example
 * const deleteMutation = useDeleteComment();
 * deleteMutation.mutate({
 *   commentId: 'comment-123',
 *   sessionId: 'session-456'
 * });
 */
export function useDeleteComment(
  options?: Partial<
    UseMutationOptions<void, Error, { commentId: string; sessionId: string }>
  >
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { commentId: string; sessionId: string }>({
    mutationFn: ({ commentId }) => commentService.deleteComment(commentId),

    onMutate: async ({ commentId, sessionId }) => {
      await queryClient.cancelQueries({
        queryKey: COMMENT_KEYS.session(sessionId),
      });

      const previousComments = queryClient.getQueryData(
        COMMENT_KEYS.session(sessionId)
      );

      // Optimistically remove from comments list
      queryClient.setQueryData<CommentsResponse>(
        COMMENT_KEYS.list(sessionId),
        old => {
          if (!old?.comments) return old;

          return {
            ...old,
            comments: old.comments.filter(comment => comment.id !== commentId),
          };
        }
      );

      return { previousComments };
    },

    onError: (error, { sessionId }, context: unknown) => {
      if (
        context &&
        typeof context === 'object' &&
        'previousComments' in context &&
        context.previousComments
      ) {
        queryClient.setQueryData(
          COMMENT_KEYS.session(sessionId),
          context.previousComments
        );
      }
    },

    onSuccess: (_, { sessionId }) => {
      // Invalidate comments
      queryClient.invalidateQueries({
        queryKey: COMMENT_KEYS.session(sessionId),
      });

      // Update comment count in session cache and feed
      const updateSessionCommentCount = (
        session: Session | SessionWithDetails
      ): Session | SessionWithDetails => {
        if (session?.id !== sessionId) return session;
        return {
          ...session,
          commentCount: Math.max(0, (session.commentCount || 0) - 1),
        };
      };

      // Update session detail cache
      queryClient.setQueryData(
        SESSION_KEYS.detail(sessionId),
        updateSessionCommentCount
      );

      // Update feed caches
      queryClient.setQueriesData<FeedData>({ queryKey: ['feed'] }, old => {
        if (!old) return old;

        if (Array.isArray(old)) {
          return old.map(updateSessionCommentCount);
        } else if ('sessions' in old && old.sessions) {
          return {
            ...old,
            sessions: old.sessions.map(updateSessionCommentCount),
          };
        } else if ('pages' in old && old.pages) {
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              sessions: page.sessions.map(updateSessionCommentCount),
            })),
          };
        }

        return old;
      });
    },

    ...options,
  });
}

/**
 * Like or unlike a comment
 *
 * @example
 * const likeMutation = useCommentLike('session-123');
 * likeMutation.mutate({ commentId: 'comment-456', action: 'like' });
 * likeMutation.mutate({ commentId: 'comment-456', action: 'unlike' });
 */
export function useCommentLike(
  sessionId: string,
  options?: Partial<UseMutationOptions<void, Error, CommentLikeData>>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, CommentLikeData>({
    mutationFn: async ({ commentId, action }) => {
      try {
        if (action === 'like') {
          await commentService.likeComment(commentId);
        } else {
          await commentService.unlikeComment(commentId);
        }
      } catch (error: unknown) {
        // If already liked/unliked, treat as success (idempotent)
        const errorMsg = error.message || String(error);
        if (
          errorMsg.includes('Already liked') ||
          errorMsg.includes('not liked')
        ) {
          return;
        }
        throw error;
      }
    },

    onMutate: async ({ commentId, action }) => {
      await queryClient.cancelQueries({
        queryKey: COMMENT_KEYS.session(sessionId),
      });

      const previousComments = queryClient.getQueryData(
        COMMENT_KEYS.session(sessionId)
      );

      const increment = action === 'like' ? 1 : -1;

      // Optimistically update comments
      queryClient.setQueryData<CommentsResponse>(
        COMMENT_KEYS.list(sessionId),
        old => {
          if (!old?.comments) return old;

          return {
            ...old,
            comments: old.comments.map(comment =>
              comment.id === commentId
                ? {
                    ...comment,
                    likeCount: Math.max(
                      0,
                      (comment.likeCount || 0) + increment
                    ),
                    isLiked: action === 'like',
                  }
                : comment
            ),
          };
        }
      );

      return { previousComments };
    },

    onError: (error, variables, context: unknown) => {
      if (
        context &&
        typeof context === 'object' &&
        'previousComments' in context &&
        context.previousComments
      ) {
        queryClient.setQueryData(
          COMMENT_KEYS.session(sessionId),
          context.previousComments
        );
      }
    },

    onSuccess: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: COMMENT_KEYS.session(sessionId),
      });
    },

    ...options,
  });
}

/**
 * Helper hook to invalidate comments for a session
 *
 * @example
 * const invalidateComments = useInvalidateComments();
 * invalidateComments(sessionId);
 */
export function useInvalidateComments() {
  const queryClient = useQueryClient();

  return (sessionId: string) => {
    queryClient.invalidateQueries({
      queryKey: COMMENT_KEYS.session(sessionId),
    });
    queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.list(sessionId) });
  };
}

/**
 * Helper hook to invalidate all comments
 *
 * @example
 * const invalidateAllComments = useInvalidateAllComments();
 * invalidateAllComments();
 */
export function useInvalidateAllComments() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.all() });
  };
}
