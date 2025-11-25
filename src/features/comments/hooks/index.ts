/**
 * Comment Hooks - Public API
 *
 * All comment-related hooks exported from here.
 *
 * @example
 * import { useSessionComments, useCreateComment, useCommentLike } from '@/features/comments/hooks';
 */

// Query hooks
export { useSessionComments, COMMENT_KEYS } from './useComments'

// Mutation hooks
export {
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useCommentLike,
  useInvalidateComments,
  useInvalidateAllComments,
} from './useCommentMutations'

// Re-export types
export type { CommentLikeData } from '../services/CommentService'
