/**
 * Comment validation schemas
 *
 * Validates comment creation, updates, and likes with proper type safety
 * and input sanitization.
 */

import * as v from 'valibot';

/**
 * Firebase ID schema - accepts Firebase's 20-character alphanumeric IDs
 * Firebase uses custom IDs, not UUIDs
 */
const FirebaseIdSchema = v.pipe(
  v.string('ID is required'),
  v.nonEmpty('ID cannot be empty'),
  v.regex(/^[a-zA-Z0-9]{18,28}$/, 'Invalid Firebase ID format')
);

/**
 * Schema for creating a new comment
 */
export const CreateCommentSchema = v.object({
  // Required fields
  sessionId: FirebaseIdSchema,
  content: v.pipe(
    v.string('Comment content is required'),
    v.nonEmpty('Comment cannot be empty'),
    v.maxLength(2000, 'Comment cannot exceed 2000 characters'),
    v.transform(str => str.trim())
  ),

  // Optional fields
  parentId: v.optional(FirebaseIdSchema), // For nested replies
});

/**
 * Schema for updating an existing comment
 */
export const UpdateCommentSchema = v.object({
  content: v.optional(
    v.pipe(
      v.string(),
      v.nonEmpty('Comment cannot be empty'),
      v.maxLength(2000, 'Comment cannot exceed 2000 characters'),
      v.transform(str => str.trim())
    )
  ),
  isEdited: v.optional(v.boolean()),
});

/**
 * Schema for comment like/unlike operations
 */
export const CommentLikeSchema = v.object({
  commentId: FirebaseIdSchema,
});

/**
 * Schema for comment filters
 */
export const CommentFiltersSchema = v.object({
  sessionId: v.optional(FirebaseIdSchema),
  userId: v.optional(FirebaseIdSchema),
  parentCommentId: v.optional(FirebaseIdSchema),
  includeReplies: v.optional(v.boolean()),
});

/**
 * Schema for comment sort options
 */
export const CommentSortSchema = v.object({
  field: v.picklist(['createdAt', 'likeCount', 'replyCount']),
  direction: v.picklist(['asc', 'desc']),
});

// Type exports
export type CreateCommentInput = v.InferInput<typeof CreateCommentSchema>;
export type CreateCommentData = v.InferOutput<typeof CreateCommentSchema>;

export type UpdateCommentInput = v.InferInput<typeof UpdateCommentSchema>;
export type UpdateCommentData = v.InferOutput<typeof UpdateCommentSchema>;

export type CommentLikeInput = v.InferInput<typeof CommentLikeSchema>;
export type CommentLikeData = v.InferOutput<typeof CommentLikeSchema>;

export type CommentFiltersInput = v.InferInput<typeof CommentFiltersSchema>;
export type CommentFilters = v.InferOutput<typeof CommentFiltersSchema>;

export type CommentSortInput = v.InferInput<typeof CommentSortSchema>;
export type CommentSort = v.InferOutput<typeof CommentSortSchema>;
