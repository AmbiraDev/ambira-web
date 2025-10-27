/**
 * Tests for comment validation schemas
 */

import { validate } from '../utils/validate';
import {
  CreateCommentSchema,
  UpdateCommentSchema,
  CommentLikeSchema,
  CommentFiltersSchema,
  CommentSortSchema,
} from '../schemas/comment.schemas';

describe('Comment Schemas', () => {
  describe('CreateCommentSchema', () => {
    it('should validate valid comment data', () => {
      const input = {
        sessionId: 'abc123def456ghi789jk',
        content: 'Great session! Keep up the good work.',
      };

      const result = validate(CreateCommentSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionId).toBe(input.sessionId);
        expect(result.data.content).toBe(input.content);
      }
    });

    it('should validate comment with parentId for replies', () => {
      const input = {
        sessionId: 'abc123def456ghi789jk',
        content: 'Thanks for the reply!',
        parentId: 'xyz987uvw654rst321po',
      };

      const result = validate(CreateCommentSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parentId).toBe(input.parentId);
      }
    });

    it('should fail for missing sessionId', () => {
      const input = {
        content: 'Great session!',
      };

      const result = validate(CreateCommentSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map(e => e.path);
        expect(paths).toContain('sessionId');
      }
    });

    it('should fail for missing content', () => {
      const input = {
        sessionId: 'abc123def456ghi789jk',
      };

      const result = validate(CreateCommentSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map(e => e.path);
        expect(paths).toContain('content');
      }
    });

    it('should fail for empty content', () => {
      const input = {
        sessionId: 'abc123def456ghi789jk',
        content: '',
      };

      const result = validate(CreateCommentSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('content');
      }
    });

    it('should fail for content exceeding 2000 characters', () => {
      const input = {
        sessionId: 'abc123def456ghi789jk',
        content: 'A'.repeat(2001), // Max is 2000
      };

      const result = validate(CreateCommentSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('content');
      }
    });

    it('should allow content at exactly 2000 characters', () => {
      const input = {
        sessionId: 'abc123def456ghi789jk',
        content: 'A'.repeat(2000), // Exactly max
      };

      const result = validate(CreateCommentSchema, input);

      expect(result.success).toBe(true);
    });

    it('should fail for invalid sessionId format', () => {
      const input = {
        sessionId: 'not-a-uuid',
        content: 'Great work!',
      };

      const result = validate(CreateCommentSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('sessionId');
      }
    });

    it('should fail for invalid parentId format', () => {
      const input = {
        sessionId: 'abc123def456ghi789jk',
        content: 'Reply to comment',
        parentId: 'invalid-id',
      };

      const result = validate(CreateCommentSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('parentId');
      }
    });

    it('should trim content whitespace', () => {
      const input = {
        sessionId: 'abc123def456ghi789jk',
        content: '  Great session!  ',
      };

      const result = validate(CreateCommentSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Great session!');
      }
    });

    it('should pass nonEmpty but trim to empty string', () => {
      const input = {
        sessionId: 'abc123def456ghi789jk',
        content: '   ',
      };

      const result = validate(CreateCommentSchema, input);

      // Schema validates nonEmpty before trim, so "   " passes (not empty)
      // Then it gets trimmed to "" during transformation
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('');
      }
    });
  });

  describe('UpdateCommentSchema', () => {
    it('should validate content update', () => {
      const input = {
        content: 'Updated comment text',
      };

      const result = validate(UpdateCommentSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe(input.content);
      }
    });

    it('should validate isEdited flag update', () => {
      const input = {
        isEdited: true,
      };

      const result = validate(UpdateCommentSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isEdited).toBe(true);
      }
    });

    it('should validate both content and isEdited together', () => {
      const input = {
        content: 'Edited comment',
        isEdited: true,
      };

      const result = validate(UpdateCommentSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Edited comment');
        expect(result.data.isEdited).toBe(true);
      }
    });

    it('should validate empty update object', () => {
      const input = {};

      const result = validate(UpdateCommentSchema, input);

      expect(result.success).toBe(true);
    });

    it('should fail for empty content', () => {
      const input = {
        content: '',
      };

      const result = validate(UpdateCommentSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('content');
      }
    });

    it('should fail for content exceeding 2000 characters', () => {
      const input = {
        content: 'B'.repeat(2001),
      };

      const result = validate(UpdateCommentSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('content');
      }
    });

    it('should trim content whitespace', () => {
      const input = {
        content: '  Updated text  ',
      };

      const result = validate(UpdateCommentSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Updated text');
      }
    });

    it('should fail for invalid isEdited type', () => {
      const input = {
        isEdited: 'yes' as unknown as boolean,
      };

      const result = validate(UpdateCommentSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('isEdited');
      }
    });
  });

  describe('CommentLikeSchema', () => {
    it('should validate valid commentId', () => {
      const input = {
        commentId: 'abc123def456ghi789jk',
      };

      const result = validate(CommentLikeSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.commentId).toBe(input.commentId);
      }
    });

    it('should fail for missing commentId', () => {
      const input = {};

      const result = validate(CommentLikeSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map(e => e.path);
        expect(paths).toContain('commentId');
      }
    });

    it('should fail for invalid commentId format', () => {
      const input = {
        commentId: 'not-a-uuid',
      };

      const result = validate(CommentLikeSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('commentId');
      }
    });
  });

  describe('CommentFiltersSchema', () => {
    it('should validate empty filters', () => {
      const input = {};

      const result = validate(CommentFiltersSchema, input);

      expect(result.success).toBe(true);
    });

    it('should validate sessionId filter', () => {
      const input = {
        sessionId: 'abc123def456ghi789jk',
      };

      const result = validate(CommentFiltersSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionId).toBe(input.sessionId);
      }
    });

    it('should validate userId filter', () => {
      const input = {
        userId: 'xyz987uvw654rst321po',
      };

      const result = validate(CommentFiltersSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(input.userId);
      }
    });

    it('should validate parentCommentId filter', () => {
      const input = {
        parentCommentId: 'qwe456rty789uio012as',
      };

      const result = validate(CommentFiltersSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parentCommentId).toBe(input.parentCommentId);
      }
    });

    it('should validate includeReplies filter', () => {
      const input = {
        includeReplies: true,
      };

      const result = validate(CommentFiltersSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeReplies).toBe(true);
      }
    });

    it('should validate multiple filters together', () => {
      const input = {
        sessionId: 'abc123def456ghi789jk',
        userId: 'xyz987uvw654rst321po',
        includeReplies: false,
      };

      const result = validate(CommentFiltersSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionId).toBe(input.sessionId);
        expect(result.data.userId).toBe(input.userId);
        expect(result.data.includeReplies).toBe(false);
      }
    });

    it('should fail for invalid UUID formats', () => {
      const input = {
        sessionId: 'invalid-uuid',
      };

      const result = validate(CommentFiltersSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('sessionId');
      }
    });
  });

  describe('CommentSortSchema', () => {
    it('should validate sort by createdAt ascending', () => {
      const input = {
        field: 'createdAt' as const,
        direction: 'asc' as const,
      };

      const result = validate(CommentSortSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.field).toBe('createdAt');
        expect(result.data.direction).toBe('asc');
      }
    });

    it('should validate sort by likeCount descending', () => {
      const input = {
        field: 'likeCount' as const,
        direction: 'desc' as const,
      };

      const result = validate(CommentSortSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.field).toBe('likeCount');
        expect(result.data.direction).toBe('desc');
      }
    });

    it('should validate sort by replyCount', () => {
      const input = {
        field: 'replyCount' as const,
        direction: 'desc' as const,
      };

      const result = validate(CommentSortSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.field).toBe('replyCount');
      }
    });

    it('should fail for missing field', () => {
      const input = {
        direction: 'asc' as const,
      };

      const result = validate(CommentSortSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map(e => e.path);
        expect(paths).toContain('field');
      }
    });

    it('should fail for missing direction', () => {
      const input = {
        field: 'createdAt' as const,
      };

      const result = validate(CommentSortSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map(e => e.path);
        expect(paths).toContain('direction');
      }
    });

    it('should fail for invalid field value', () => {
      const input: { field: string; direction: 'asc' } = {
        field: 'invalidField',
        direction: 'asc' as const,
      };

      const result = validate(CommentSortSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('field');
      }
    });

    it('should fail for invalid direction value', () => {
      const input: { field: 'createdAt'; direction: string } = {
        field: 'createdAt' as const,
        direction: 'invalid',
      };

      const result = validate(CommentSortSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.path).toBe('direction');
      }
    });
  });
});
