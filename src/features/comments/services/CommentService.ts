/**
 * Comment Service - Business Logic Layer
 *
 * Orchestrates business workflows for comments.
 * No React dependencies - pure TypeScript for testability.
 */

import { firebaseApi } from '@/lib/api';
import {
  Comment,
  CommentWithDetails,
  CreateCommentData,
  UpdateCommentData,
  CommentsResponse,
} from '@/types';
import {
  validateOrThrow,
  CreateCommentSchema,
  UpdateCommentSchema,
  type CreateCommentData as ValidatedCreateCommentData,
  type UpdateCommentData as ValidatedUpdateCommentData,
} from '@/lib/validation';

export class CommentService {
  /**
   * Get all comments for a session
   */
  async getSessionComments(
    sessionId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<CommentsResponse> {
    try {
      return await firebaseApi.comment.getSessionComments(sessionId, limit);
    } catch (error) {
      console.error('Error getting session comments:', error);
      return {
        comments: [],
        hasMore: false,
      };
    }
  }

  /**
   * Create a new comment
   */
  async createComment(data: unknown): Promise<CommentWithDetails> {
    // Validate input data
    const validatedData = validateOrThrow(CreateCommentSchema, data);

    return firebaseApi.comment.createComment(validatedData as CreateCommentData);
  }

  /**
   * Update a comment
   */
  async updateComment(commentId: string, data: unknown): Promise<void> {
    // Validate input data
    const validatedData = validateOrThrow(UpdateCommentSchema, data);

    await firebaseApi.comment.updateComment(commentId, validatedData as UpdateCommentData);
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    return firebaseApi.comment.deleteComment(commentId);
  }

  /**
   * Like a comment
   */
  async likeComment(commentId: string): Promise<void> {
    return firebaseApi.comment.likeComment(commentId);
  }

  /**
   * Unlike a comment
   */
  async unlikeComment(commentId: string): Promise<void> {
    return firebaseApi.comment.unlikeComment(commentId);
  }
}

export interface CommentLikeData {
  commentId: string;
  action: 'like' | 'unlike';
}
