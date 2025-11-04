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
  User,
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

// Type guards for feed data
function isFeedArrayData(data: FeedData): data is FeedArrayData {
  return (
    !Array.isArray(data) &&
    'sessions' in data &&
    Array.isArray((data as FeedArrayData).sessions)
  );
}

function isFeedInfiniteData(data: FeedData): data is FeedInfiniteData {
  return (
    !Array.isArray(data) &&
    'pages' in data &&
    Array.isArray((data as FeedInfiniteData).pages)
  );
}

// Context type for create comment mutation
interface CreateCommentContext {
  previousComments: CommentsResponse | undefined;
  optimisticId: string;
}

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
    UseMutationOptions<
      CommentWithDetails,
      Error,
      CreateCommentData,
      CreateCommentContext
    >
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    CommentWithDetails,
    Error,
    CreateCommentData,
    CreateCommentContext
  >({
    mutationKey: ['comments', 'create'],
    mutationFn: data => commentService.createComment(data),

    onMutate: async variables => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({
        queryKey: COMMENT_KEYS.session(variables.sessionId),
      });

      // Snapshot the previous value for rollback
      const previousComments = queryClient.getQueryData<CommentsResponse>(
        COMMENT_KEYS.list(variables.sessionId)
      );

      // Generate unique optimistic ID
      const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Get current user from auth cache
      const currentUser = queryClient.getQueryData<User>(['auth', 'user']);

      // Create optimistic comment if user is available
      if (currentUser) {
        const optimisticComment: CommentWithDetails = {
          id: optimisticId,
          sessionId: variables.sessionId,
          userId: currentUser.id,
          parentId: variables.parentId,
          content: variables.content,
          likeCount: 0,
          replyCount: 0,
          isEdited: false,
          isLiked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: currentUser,
        };

        // Optimistically add comment to the list
        queryClient.setQueryData<CommentsResponse>(
          COMMENT_KEYS.list(variables.sessionId),
          old => {
            if (!old) {
              return {
                comments: [optimisticComment],
                hasMore: false,
              };
            }

            return {
              ...old,
              comments: [optimisticComment, ...old.comments],
            };
          }
        );
      } else {
        // Log warning if auth cache is missing (helps debugging)
        console.warn(
          '[useCreateComment] Auth user not in cache - optimistic update skipped. Comment will appear after server response.'
        );
      }

      return { previousComments, optimisticId };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          COMMENT_KEYS.list(variables.sessionId),
          context.previousComments
        );
      }
    },

    onSuccess: (newComment, variables, context) => {
      // Replace only the specific optimistic comment with real one from server
      queryClient.setQueryData<CommentsResponse>(
        COMMENT_KEYS.list(variables.sessionId),
        old => {
          if (!old) return old;

          return {
            ...old,
            comments: old.comments.map(comment =>
              comment.id === context.optimisticId ? newComment : comment
            ),
          };
        }
      );

      // Invalidate to ensure consistency (will refetch in background)
      queryClient.invalidateQueries({
        queryKey: COMMENT_KEYS.session(variables.sessionId),
      });

      // Update comment count in session cache and feed
      const updateSessionCommentCount = <
        T extends Session | SessionWithDetails,
      >(
        session: T
      ): T => {
        if (session?.id !== variables.sessionId) return session;
        return {
          ...session,
          commentCount: (session.commentCount || 0) + 1,
        } as T;
      };

      // Update session detail cache
      queryClient.setQueryData(
        SESSION_KEYS.detail(variables.sessionId),
        updateSessionCommentCount
      );

      // Update feed caches with proper type guards
      queryClient.setQueriesData<FeedData>(
        { queryKey: ['feed'] },
        (old: FeedData | undefined): FeedData | undefined => {
          if (!old) return old;

          // Array format: SessionWithDetails[]
          if (Array.isArray(old)) {
            // Check if session exists in this feed before updating
            const hasSession = old.some(s => s.id === variables.sessionId);
            if (!hasSession) return old;

            return old.map(updateSessionCommentCount) as SessionWithDetails[];
          }

          // Object format with sessions array: FeedArrayData
          if (isFeedArrayData(old)) {
            const hasSession = old.sessions?.some(
              s => s.id === variables.sessionId
            );
            if (!hasSession) return old;

            return {
              ...old,
              sessions: old.sessions!.map(updateSessionCommentCount),
            };
          }

          // Infinite query format: FeedInfiniteData
          if (isFeedInfiniteData(old)) {
            // Check if session exists in any page
            const hasSession = old.pages.some(page =>
              page.sessions.some(s => s.id === variables.sessionId)
            );
            if (!hasSession) return old;

            return {
              ...old,
              pages: old.pages.map(page => ({
                ...page,
                sessions: page.sessions.map(updateSessionCommentCount),
              })),
            };
          }

          return old;
        }
      );
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
// Context type for update comment mutation
interface UpdateCommentContext {
  previousComments: CommentsResponse | undefined;
}

export function useUpdateComment(
  options?: Partial<
    UseMutationOptions<
      void,
      Error,
      { commentId: string; sessionId: string; data: UpdateCommentData },
      UpdateCommentContext
    >
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { commentId: string; sessionId: string; data: UpdateCommentData },
    UpdateCommentContext
  >({
    mutationKey: ['comments', 'update'],
    mutationFn: ({ commentId, data }) =>
      commentService.updateComment(commentId, data),

    onMutate: async ({ commentId, sessionId, data }) => {
      await queryClient.cancelQueries({
        queryKey: COMMENT_KEYS.session(sessionId),
      });

      const previousComments = queryClient.getQueryData<CommentsResponse>(
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

    onError: (error, { sessionId }, context) => {
      if (context?.previousComments) {
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
// Context type for delete comment mutation
interface DeleteCommentContext {
  previousComments: CommentsResponse | undefined;
}

export function useDeleteComment(
  options?: Partial<
    UseMutationOptions<
      void,
      Error,
      { commentId: string; sessionId: string },
      DeleteCommentContext
    >
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { commentId: string; sessionId: string },
    DeleteCommentContext
  >({
    mutationKey: ['comments', 'delete'],
    mutationFn: ({ commentId }) => commentService.deleteComment(commentId),

    onMutate: async ({ commentId, sessionId }) => {
      await queryClient.cancelQueries({
        queryKey: COMMENT_KEYS.session(sessionId),
      });

      const previousComments = queryClient.getQueryData<CommentsResponse>(
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

    onError: (error, { sessionId }, context) => {
      if (context?.previousComments) {
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
      const updateSessionCommentCount = <
        T extends Session | SessionWithDetails,
      >(
        session: T
      ): T => {
        if (session?.id !== sessionId) return session;
        return {
          ...session,
          commentCount: Math.max(0, (session.commentCount || 0) - 1),
        } as T;
      };

      // Update session detail cache
      queryClient.setQueryData(
        SESSION_KEYS.detail(sessionId),
        updateSessionCommentCount
      );

      // Update feed caches with proper type guards
      queryClient.setQueriesData<FeedData>(
        { queryKey: ['feed'] },
        (old: FeedData | undefined): FeedData | undefined => {
          if (!old) return old;

          // Array format: SessionWithDetails[]
          if (Array.isArray(old)) {
            const hasSession = old.some(s => s.id === sessionId);
            if (!hasSession) return old;
            return old.map(updateSessionCommentCount) as SessionWithDetails[];
          }

          // Object format with sessions array: FeedArrayData
          if (isFeedArrayData(old)) {
            const hasSession = old.sessions?.some(s => s.id === sessionId);
            if (!hasSession) return old;
            return {
              ...old,
              sessions: old.sessions!.map(updateSessionCommentCount),
            };
          }

          // Infinite query format: FeedInfiniteData
          if (isFeedInfiniteData(old)) {
            const hasSession = old.pages.some(page =>
              page.sessions.some(s => s.id === sessionId)
            );
            if (!hasSession) return old;
            return {
              ...old,
              pages: old.pages.map(page => ({
                ...page,
                sessions: page.sessions.map(updateSessionCommentCount),
              })),
            };
          }

          return old;
        }
      );
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
// Context type for comment like mutation
interface CommentLikeContext {
  previousComments: CommentsResponse | undefined;
}

export function useCommentLike(
  sessionId: string,
  options?: Partial<
    UseMutationOptions<void, Error, CommentLikeData, CommentLikeContext>
  >
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, CommentLikeData, CommentLikeContext>({
    mutationKey: ['comments', 'like'],
    mutationFn: async ({ commentId, action }) => {
      try {
        if (action === 'like') {
          await commentService.likeComment(commentId);
        } else {
          await commentService.unlikeComment(commentId);
        }
      } catch (error: unknown) {
        // If already liked/unliked, treat as success (idempotent)
        const errorMsg = error instanceof Error ? error.message : String(error);
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

      const previousComments = queryClient.getQueryData<CommentsResponse>(
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

    onError: (error, variables, context) => {
      if (context?.previousComments) {
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
