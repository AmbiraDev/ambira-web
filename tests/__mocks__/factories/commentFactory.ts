/**
 * Comment Factory
 * Creates mock comments for testing
 */

import type { Comment, CommentWithDetails } from '@/types';
import { createMockUser } from './userFactory';

let commentIdCounter = 0;

export function createMockComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: overrides.id || `comment-${Date.now()}-${++commentIdCounter}`,
    sessionId: overrides.sessionId || `session-${Date.now()}`,
    userId: overrides.userId || `user-${Date.now()}`,
    parentId: overrides.parentId,
    content: overrides.content || 'This is a test comment',
    likeCount: overrides.likeCount || 0,
    replyCount: overrides.replyCount || 0,
    isLiked: overrides.isLiked || false,
    isEdited: overrides.isEdited || false,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    user: overrides.user,
  };
}

export function createMockCommentWithDetails(
  overrides: Partial<CommentWithDetails> = {}
): CommentWithDetails {
  const domainUser = overrides.user
    ? undefined
    : createMockUser({ id: overrides.userId });
  const typesUser: import('@/types').User = overrides.user || {
    id: domainUser!.id,
    username: domainUser!.username,
    name: domainUser!.name,
    email: domainUser!.email,
    createdAt: domainUser!.createdAt,
    updatedAt: domainUser!.createdAt, // Use createdAt as default for updatedAt
  };

  const comment = createMockComment({
    ...overrides,
    userId: typesUser.id,
  });

  return {
    ...comment,
    user: typesUser,
    replies: overrides.replies,
  };
}

export function createMockCommentBatch(
  count: number,
  baseOverrides: Partial<Comment> = {}
): Comment[] {
  return Array.from({ length: count }, (_, i) =>
    createMockComment({ ...baseOverrides, content: `Comment ${i + 1}` })
  );
}

export function resetCommentFactory() {
  commentIdCounter = 0;
}
