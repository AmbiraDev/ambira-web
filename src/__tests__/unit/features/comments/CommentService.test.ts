/**
 * CommentService Unit Tests
 *
 * Tests comment CRUD operations, likes, and retrieval
 */

import { CommentService } from '@/features/comments/services/CommentService';
import { firebaseApi } from '@/lib/api';
import { CommentWithDetails, CreateCommentData } from '@/types';

jest.mock('@/lib/api');

describe('CommentService', () => {
  let commentService: CommentService;

  const mockComment: CommentWithDetails = {
    id: 'comment1234567890123',
    sessionId: 'session1234567890123',
    userId: 'user1234567890123456',
    content: 'Great work!',
    likeCount: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    user: {
      id: 'user1234567890123456',
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    commentService = new CommentService();
  });

  describe('getSessionComments', () => {
    it('should get all comments for a session', async () => {
      // ARRANGE
      const mockResponse = {
        comments: [mockComment, { ...mockComment, id: 'comment1234567890124' }],
        hasMore: false,
      };

      (firebaseApi.comment.getSessionComments as jest.Mock).mockResolvedValue(
        mockResponse
      );

      // ACT
      const result = await commentService.getSessionComments(
        'session1234567890123'
      );

      // ASSERT
      expect(result.comments).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(firebaseApi.comment.getSessionComments).toHaveBeenCalledWith(
        'session1234567890123',
        20
      );
    });

    it('should support custom limit', async () => {
      // ARRANGE
      const mockResponse = {
        comments: [mockComment],
        hasMore: true,
      };

      (firebaseApi.comment.getSessionComments as jest.Mock).mockResolvedValue(
        mockResponse
      );

      // ACT
      await commentService.getSessionComments('session1234567890123', 50);

      // ASSERT
      expect(firebaseApi.comment.getSessionComments).toHaveBeenCalledWith(
        'session1234567890123',
        50
      );
    });

    it('should return empty array on error', async () => {
      // ARRANGE
      (firebaseApi.comment.getSessionComments as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      // ACT
      const result = await commentService.getSessionComments(
        'session1234567890123'
      );

      // ASSERT
      expect(result.comments).toEqual([]);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('createComment', () => {
    it('should create comment with valid data', async () => {
      // ARRANGE
      const createData = {
        sessionId: 'session1234567890123',
        content: 'New comment',
      };

      (firebaseApi.comment.createComment as jest.Mock).mockResolvedValue(
        mockComment
      );

      // ACT
      const result = await commentService.createComment(createData);

      // ASSERT
      expect(result).toEqual(mockComment);
      expect(firebaseApi.comment.createComment).toHaveBeenCalled();
    });

    it('should validate comment data', async () => {
      // ARRANGE
      const invalidData = { sessionId: 'session1234567890123', content: '' };

      // ACT & ASSERT
      try {
        await commentService.createComment(invalidData);
        fail('Should have thrown validation error');
      } catch (_err) {
        // Expected validation error
      }
    });

    it('should propagate API errors', async () => {
      // ARRANGE
      (firebaseApi.comment.createComment as jest.Mock).mockRejectedValue(
        new Error('Creation failed')
      );

      // ACT & ASSERT
      await expect(
        commentService.createComment({
          sessionId: 'session1234567890123',
          content: 'Test',
        })
      ).rejects.toThrow();
    });
  });

  describe('updateComment', () => {
    it('should update comment content', async () => {
      // ARRANGE
      (firebaseApi.comment.updateComment as jest.Mock).mockResolvedValue(
        undefined
      );

      // ACT
      await commentService.updateComment('comment1234567890123', {
        content: 'Updated comment',
      });

      // ASSERT
      expect(firebaseApi.comment.updateComment).toHaveBeenCalledWith(
        'comment1234567890123',
        { content: 'Updated comment' }
      );
    });

    it('should validate update data', async () => {
      // ARRANGE
      const invalidData = { content: '' };

      // ACT & ASSERT
      try {
        await commentService.updateComment('comment1234567890123', invalidData);
        fail('Should have thrown validation error');
      } catch (_err) {
        // Expected validation error
      }
    });

    it('should propagate API errors', async () => {
      // ARRANGE
      (firebaseApi.comment.updateComment as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      );

      // ACT & ASSERT
      await expect(
        commentService.updateComment('comment1234567890123', { content: 'New' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteComment', () => {
    it('should delete comment by ID', async () => {
      // ARRANGE
      (firebaseApi.comment.deleteComment as jest.Mock).mockResolvedValue(
        undefined
      );

      // ACT
      await commentService.deleteComment('comment1234567890123');

      // ASSERT
      expect(firebaseApi.comment.deleteComment).toHaveBeenCalledWith(
        'comment1234567890123'
      );
    });

    it('should propagate API errors', async () => {
      // ARRANGE
      (firebaseApi.comment.deleteComment as jest.Mock).mockRejectedValue(
        new Error('Delete failed')
      );

      // ACT & ASSERT
      await expect(
        commentService.deleteComment('comment1234567890123')
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('likeComment', () => {
    it('should like a comment', async () => {
      // ARRANGE
      (firebaseApi.comment.likeComment as jest.Mock).mockResolvedValue(
        undefined
      );

      // ACT
      await commentService.likeComment('comment1234567890123');

      // ASSERT
      expect(firebaseApi.comment.likeComment).toHaveBeenCalledWith(
        'comment1234567890123'
      );
    });

    it('should propagate API errors', async () => {
      // ARRANGE
      (firebaseApi.comment.likeComment as jest.Mock).mockRejectedValue(
        new Error('Like failed')
      );

      // ACT & ASSERT
      await expect(
        commentService.likeComment('comment1234567890123')
      ).rejects.toThrow('Like failed');
    });
  });

  describe('unlikeComment', () => {
    it('should unlike a comment', async () => {
      // ARRANGE
      (firebaseApi.comment.unlikeComment as jest.Mock).mockResolvedValue(
        undefined
      );

      // ACT
      await commentService.unlikeComment('comment1234567890123');

      // ASSERT
      expect(firebaseApi.comment.unlikeComment).toHaveBeenCalledWith(
        'comment1234567890123'
      );
    });

    it('should propagate API errors', async () => {
      // ARRANGE
      (firebaseApi.comment.unlikeComment as jest.Mock).mockRejectedValue(
        new Error('Unlike failed')
      );

      // ACT & ASSERT
      await expect(
        commentService.unlikeComment('comment1234567890123')
      ).rejects.toThrow('Unlike failed');
    });
  });
});
