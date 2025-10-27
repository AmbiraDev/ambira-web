import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCommentLike, COMMENT_KEYS } from '@/features/comments/hooks';
import { firebaseApi } from '@/lib/api';
import React from 'react';

// Mock the firebaseApi
jest.mock('@/lib/api', () => ({
  firebaseApi: {
    comment: {
      likeComment: jest.fn(),
      unlikeComment: jest.fn(),
    },
  },
}));

describe('useCommentLike', () => {
  let queryClient: QueryClient;
  const sessionId = 'session-123';
  const commentId = 'comment-456';

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Like Comment', () => {
    it('should call likeComment API when action is "like"', async () => {
      const { result } = renderHook(() => useCommentLike(sessionId), {
        wrapper,
      });

      result.current.mutate({ commentId, action: 'like' });

      await waitFor(() => {
        expect(firebaseApi.comment.likeComment).toHaveBeenCalledWith(commentId);
      });
    });

    it('should optimistically update comment like state', async () => {
      // Set up initial query data
      const initialComments = {
        comments: [
          {
            id: commentId,
            content: 'Great session!',
            likeCount: 5,
            isLiked: false,
          },
          {
            id: 'comment-789',
            content: 'Nice work!',
            likeCount: 3,
            isLiked: false,
          },
        ],
        hasMore: false,
      };

      queryClient.setQueryData(COMMENT_KEYS.list(sessionId), initialComments);

      const { result } = renderHook(() => useCommentLike(sessionId), {
        wrapper,
      });

      // Mock successful API call
      (firebaseApi.comment.likeComment as jest.Mock).mockResolvedValueOnce(
        undefined
      );

      result.current.mutate({ commentId, action: 'like' });

      // Check optimistic update
      await waitFor(() => {
        const updatedData = queryClient.getQueryData(
          COMMENT_KEYS.list(sessionId)
        ) as {
          comments: Array<{
            id: string;
            content: string;
            likeCount: number;
            isLiked: boolean;
          }>;
          hasMore: boolean;
        };
        expect(updatedData.comments[0].isLiked).toBe(true);
        expect(updatedData.comments[0].likeCount).toBe(6);
        // Other comment should remain unchanged
        expect(updatedData.comments[1].isLiked).toBe(false);
        expect(updatedData.comments[1].likeCount).toBe(3);
      });
    });

    it('should invalidate comments query after successful like', async () => {
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCommentLike(sessionId), {
        wrapper,
      });

      (firebaseApi.comment.likeComment as jest.Mock).mockResolvedValueOnce(
        undefined
      );

      result.current.mutate({ commentId, action: 'like' });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: COMMENT_KEYS.list(sessionId),
        });
      });
    });
  });

  describe('Unlike Comment', () => {
    it('should call unlikeComment API when action is "unlike"', async () => {
      const { result } = renderHook(() => useCommentLike(sessionId), {
        wrapper,
      });

      result.current.mutate({ commentId, action: 'unlike' });

      await waitFor(() => {
        expect(firebaseApi.comment.unlikeComment).toHaveBeenCalledWith(
          commentId
        );
      });
    });

    it('should optimistically update comment unlike state', async () => {
      // Set up initial query data with liked comment
      const initialComments = {
        comments: [
          {
            id: commentId,
            content: 'Great session!',
            likeCount: 6,
            isLiked: true,
          },
        ],
        hasMore: false,
      };

      queryClient.setQueryData(COMMENT_KEYS.list(sessionId), initialComments);

      const { result } = renderHook(() => useCommentLike(sessionId), {
        wrapper,
      });

      (firebaseApi.comment.unlikeComment as jest.Mock).mockResolvedValueOnce(
        undefined
      );

      result.current.mutate({ commentId, action: 'unlike' });

      // Check optimistic update
      await waitFor(() => {
        const updatedData = queryClient.getQueryData(
          COMMENT_KEYS.list(sessionId)
        ) as {
          comments: Array<{
            id: string;
            content: string;
            likeCount: number;
            isLiked: boolean;
          }>;
          hasMore: boolean;
        };
        expect(updatedData.comments[0].isLiked).toBe(false);
        expect(updatedData.comments[0].likeCount).toBe(5);
      });
    });

    it('should not allow likeCount to go below 0', async () => {
      // Edge case: comment with 0 likes being unliked
      const initialComments = {
        comments: [
          {
            id: commentId,
            content: 'Great session!',
            likeCount: 0,
            isLiked: true, // Inconsistent state but handled defensively
          },
        ],
        hasMore: false,
      };

      queryClient.setQueryData(COMMENT_KEYS.list(sessionId), initialComments);

      const { result } = renderHook(() => useCommentLike(sessionId), {
        wrapper,
      });

      (firebaseApi.comment.unlikeComment as jest.Mock).mockResolvedValueOnce(
        undefined
      );

      result.current.mutate({ commentId, action: 'unlike' });

      await waitFor(() => {
        const updatedData = queryClient.getQueryData(
          COMMENT_KEYS.list(sessionId)
        ) as {
          comments: Array<{
            id: string;
            content: string;
            likeCount: number;
            isLiked: boolean;
          }>;
          hasMore: boolean;
        };
        expect(updatedData.comments[0].likeCount).toBe(0);
        expect(updatedData.comments[0].likeCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should rollback optimistic update on error', async () => {
      const initialComments = {
        comments: [
          {
            id: commentId,
            content: 'Great session!',
            likeCount: 5,
            isLiked: false,
          },
        ],
        hasMore: false,
      };

      queryClient.setQueryData(COMMENT_KEYS.list(sessionId), initialComments);

      const { result } = renderHook(() => useCommentLike(sessionId), {
        wrapper,
      });

      // Mock failed API call
      (firebaseApi.comment.likeComment as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      result.current.mutate({ commentId, action: 'like' });

      // Wait for error and rollback
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Data should be rolled back to original state
      const finalData = queryClient.getQueryData(
        COMMENT_KEYS.list(sessionId)
      ) as {
        comments: Array<{
          id: string;
          content: string;
          likeCount: number;
          isLiked: boolean;
        }>;
        hasMore: boolean;
      };
      expect(finalData.comments[0].isLiked).toBe(false);
      expect(finalData.comments[0].likeCount).toBe(5);
    });

    it('should handle missing comments data gracefully', async () => {
      const { result } = renderHook(() => useCommentLike(sessionId), {
        wrapper,
      });

      (firebaseApi.comment.likeComment as jest.Mock).mockResolvedValueOnce(
        undefined
      );

      // Should not throw error when no initial data
      expect(() => {
        result.current.mutate({ commentId, action: 'like' });
      }).not.toThrow();

      await waitFor(() => {
        expect(firebaseApi.comment.likeComment).toHaveBeenCalled();
      });
    });
  });

  describe('Multiple Mutations', () => {
    it('should handle sequential like/unlike operations', async () => {
      const initialComments = {
        comments: [
          {
            id: commentId,
            content: 'Great session!',
            likeCount: 5,
            isLiked: false,
          },
        ],
        hasMore: false,
      };

      queryClient.setQueryData(COMMENT_KEYS.list(sessionId), initialComments);

      const { result } = renderHook(() => useCommentLike(sessionId), {
        wrapper,
      });

      (firebaseApi.comment.likeComment as jest.Mock).mockResolvedValue(
        undefined
      );
      (firebaseApi.comment.unlikeComment as jest.Mock).mockResolvedValue(
        undefined
      );

      // Like
      result.current.mutate({ commentId, action: 'like' });
      await waitFor(() => {
        const data = queryClient.getQueryData(COMMENT_KEYS.list(sessionId)) as {
          comments: Array<{
            id: string;
            content: string;
            likeCount: number;
            isLiked: boolean;
          }>;
          hasMore: boolean;
        };
        expect(data.comments[0].isLiked).toBe(true);
        expect(data.comments[0].likeCount).toBe(6);
      });

      // Unlike
      result.current.mutate({ commentId, action: 'unlike' });
      await waitFor(() => {
        const data = queryClient.getQueryData(COMMENT_KEYS.list(sessionId)) as {
          comments: Array<{
            id: string;
            content: string;
            likeCount: number;
            isLiked: boolean;
          }>;
          hasMore: boolean;
        };
        expect(data.comments[0].isLiked).toBe(false);
        expect(data.comments[0].likeCount).toBe(5);
      });
    });

    it('should handle likes on different comments independently', async () => {
      const initialComments = {
        comments: [
          {
            id: 'comment-1',
            content: 'First comment',
            likeCount: 5,
            isLiked: false,
          },
          {
            id: 'comment-2',
            content: 'Second comment',
            likeCount: 3,
            isLiked: false,
          },
        ],
        hasMore: false,
      };

      queryClient.setQueryData(COMMENT_KEYS.list(sessionId), initialComments);

      const { result } = renderHook(() => useCommentLike(sessionId), {
        wrapper,
      });

      (firebaseApi.comment.likeComment as jest.Mock).mockResolvedValue(
        undefined
      );

      // Like first comment
      result.current.mutate({ commentId: 'comment-1', action: 'like' });

      await waitFor(() => {
        const data = queryClient.getQueryData(COMMENT_KEYS.list(sessionId)) as {
          comments: Array<{
            id: string;
            content: string;
            likeCount: number;
            isLiked: boolean;
          }>;
          hasMore: boolean;
        };
        expect(data.comments[0].isLiked).toBe(true);
        expect(data.comments[0].likeCount).toBe(6);
        // Second comment should be unchanged
        expect(data.comments[1].isLiked).toBe(false);
        expect(data.comments[1].likeCount).toBe(3);
      });
    });
  });

  describe('Cache Invalidation', () => {
    it('should cancel ongoing queries before mutation', async () => {
      const cancelQueriesSpy = jest.spyOn(queryClient, 'cancelQueries');

      const { result } = renderHook(() => useCommentLike(sessionId), {
        wrapper,
      });

      (firebaseApi.comment.likeComment as jest.Mock).mockResolvedValueOnce(
        undefined
      );

      result.current.mutate({ commentId, action: 'like' });

      await waitFor(() => {
        expect(cancelQueriesSpy).toHaveBeenCalledWith({
          queryKey: COMMENT_KEYS.list(sessionId),
        });
      });
    });
  });
});
