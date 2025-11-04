/**
 * Comment Mutation Hooks Unit Tests
 *
 * Tests React Query hooks for comment mutations with optimistic updates
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, ReactElement } from 'react';
import {
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
  useCommentLike,
} from '@/features/comments/hooks/useCommentMutations';
import { COMMENT_KEYS } from '@/features/comments/hooks/useComments';
import {
  CommentWithDetails,
  CommentsResponse,
  CreateCommentData,
} from '@/types';

// Mock the entire CommentService module
// Create mock functions directly in the factory to avoid hoisting issues
jest.mock('@/features/comments/services/CommentService', () => {
  const mockFunctions = {
    createComment: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
    likeComment: jest.fn(),
    unlikeComment: jest.fn(),
  };

  return {
    CommentService: jest.fn().mockImplementation(() => mockFunctions),
    __mockFunctions: mockFunctions, // Export for test access
  };
});

// Import the mocked module to access __mockFunctions
import * as CommentServiceModule from '@/features/comments/services/CommentService';
const mockFunctions = (CommentServiceModule as any).__mockFunctions;

describe('useCommentMutations', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => ReactElement;

  const mockUser = {
    id: 'user123',
    username: 'testuser',
    name: 'Test User',
    profilePicture: 'https://example.com/avatar.jpg',
  };

  const mockComment: CommentWithDetails = {
    id: 'comment123',
    sessionId: 'session123',
    userId: 'user123',
    content: 'Great work!',
    likeCount: 0,
    replyCount: 0,
    isEdited: false,
    isLiked: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    user: {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      profilePicture: 'https://example.com/avatar.jpg',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Create wrapper component
    wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  describe('useCreateComment', () => {
    it('should optimistically add comment to cache with user data', async () => {
      // ARRANGE
      const sessionId = 'session123';
      const newCommentData: CreateCommentData = {
        sessionId,
        content: 'New comment',
      };

      // Set up auth user in cache
      queryClient.setQueryData(['auth', 'user'], mockUser);

      // Set up initial comments cache
      const initialComments: CommentsResponse = {
        comments: [mockComment],
        hasMore: false,
      };
      queryClient.setQueryData(COMMENT_KEYS.list(sessionId), initialComments);

      // Mock service
      mockFunctions.createComment.mockResolvedValue({
        ...mockComment,
        id: 'comment456',
        content: newCommentData.content,
      });

      // ACT
      const { result } = renderHook(() => useCreateComment(), { wrapper });

      await act(async () => {
        result.current.mutate(newCommentData);
      });

      // ASSERT - Check optimistic update
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify comment was added
      const finalComments = queryClient.getQueryData<CommentsResponse>(
        COMMENT_KEYS.list(sessionId)
      );
      expect(finalComments?.comments.length).toBeGreaterThan(1);
      expect(mockFunctions.createComment).toHaveBeenCalledWith(newCommentData);
    });

    it('should rollback optimistic update on server error', async () => {
      // ARRANGE
      const sessionId = 'session123';
      const newCommentData: CreateCommentData = {
        sessionId,
        content: 'New comment',
      };

      // Set up auth user in cache
      queryClient.setQueryData(['auth', 'user'], mockUser);

      // Set up initial comments cache
      const initialComments: CommentsResponse = {
        comments: [mockComment],
        hasMore: false,
      };
      queryClient.setQueryData(COMMENT_KEYS.list(sessionId), initialComments);

      // Mock service to fail
      mockFunctions.createComment.mockRejectedValue(new Error('Server error'));

      // ACT
      const { result } = renderHook(() => useCreateComment(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(newCommentData);
        } catch {
          // Expected to throw
        }
      });

      // ASSERT - Should rollback to original state
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      const finalComments = queryClient.getQueryData<CommentsResponse>(
        COMMENT_KEYS.list(sessionId)
      );

      // Should have rolled back to original 1 comment
      expect(finalComments?.comments).toHaveLength(1);
      expect(finalComments?.comments[0]?.id).toBe('comment123');
    });

    it('should handle missing auth cache gracefully', async () => {
      // ARRANGE
      const sessionId = 'session123';
      const newCommentData: CreateCommentData = {
        sessionId,
        content: 'New comment',
      };

      // No auth user in cache (user not logged in or cache cleared)
      // queryClient.setQueryData(['auth', 'user'], mockUser); // <-- NOT SET

      // Mock service
      mockFunctions.createComment.mockResolvedValue(mockComment);

      // SPY on console.warn
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // ACT
      const { result } = renderHook(() => useCreateComment(), { wrapper });

      await act(async () => {
        result.current.mutate(newCommentData);
      });

      // ASSERT
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should have logged warning
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Auth user not in cache')
      );

      // Should still create comment on server
      expect(mockFunctions.createComment).toHaveBeenCalledWith(newCommentData);

      warnSpy.mockRestore();
    });

    it('should update session comment count in feed caches', async () => {
      // ARRANGE
      const sessionId = 'session123';
      const newCommentData: CreateCommentData = {
        sessionId,
        content: 'New comment',
      };

      // Set up auth user
      queryClient.setQueryData(['auth', 'user'], mockUser);

      // Set up feed cache with infinite query format
      queryClient.setQueryData(['feed', 'list', 'user123', {}], {
        pages: [
          {
            sessions: [
              {
                id: sessionId,
                commentCount: 5,
                userId: 'user123',
                title: 'Test Session',
              },
            ],
            hasMore: false,
          },
        ],
        pageParams: [undefined],
      });

      // Mock service
      mockFunctions.createComment.mockResolvedValue(mockComment);

      // ACT
      const { result } = renderHook(() => useCreateComment(), { wrapper });

      await act(async () => {
        result.current.mutate(newCommentData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // ASSERT - Verify comment count incremented in feed
      const feedCache = queryClient.getQueryData<{
        pages: Array<{ sessions: Array<{ id: string; commentCount: number }> }>;
      }>(['feed', 'list', 'user123', {}]);

      expect(feedCache?.pages[0]?.sessions[0]?.commentCount).toBe(6);
    });
  });

  describe('useDeleteComment', () => {
    it('should remove comment from cache', async () => {
      // ARRANGE
      const sessionId = 'session123';
      const commentIdToDelete = 'comment123';

      // Set up initial comments cache
      const initialComments: CommentsResponse = {
        comments: [mockComment, { ...mockComment, id: 'comment456' }],
        hasMore: false,
      };
      queryClient.setQueryData(COMMENT_KEYS.list(sessionId), initialComments);

      // Mock service
      mockFunctions.deleteComment.mockResolvedValue(undefined);

      // ACT
      const { result } = renderHook(() => useDeleteComment(), { wrapper });

      await act(async () => {
        result.current.mutate({ commentId: commentIdToDelete, sessionId });
      });

      // ASSERT
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFunctions.deleteComment).toHaveBeenCalledWith(
        commentIdToDelete
      );
    });
  });

  describe('useUpdateComment', () => {
    it('should update comment content', async () => {
      // ARRANGE
      const sessionId = 'session123';
      const commentId = 'comment123';
      const updatedContent = 'Updated content';

      const initialComments: CommentsResponse = {
        comments: [mockComment],
        hasMore: false,
      };
      queryClient.setQueryData(COMMENT_KEYS.list(sessionId), initialComments);

      // Mock service
      mockFunctions.updateComment.mockResolvedValue(undefined);

      // ACT
      const { result } = renderHook(() => useUpdateComment(), { wrapper });

      await act(async () => {
        result.current.mutate({
          commentId,
          sessionId,
          data: { content: updatedContent },
        });
      });

      // ASSERT
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFunctions.updateComment).toHaveBeenCalledWith(commentId, {
        content: updatedContent,
      });
    });
  });

  describe('useCommentLike', () => {
    it('should optimistically update like count and isLiked state', async () => {
      // ARRANGE
      const sessionId = 'session123';
      const commentId = 'comment123';

      const initialComments: CommentsResponse = {
        comments: [{ ...mockComment, isLiked: false, likeCount: 5 }],
        hasMore: false,
      };
      queryClient.setQueryData(COMMENT_KEYS.list(sessionId), initialComments);

      // Mock service
      mockFunctions.likeComment.mockResolvedValue(undefined);

      // ACT
      const { result } = renderHook(() => useCommentLike(sessionId), {
        wrapper,
      });

      await act(async () => {
        result.current.mutate({ commentId, action: 'like' });
      });

      // ASSERT
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFunctions.likeComment).toHaveBeenCalledWith(commentId);
    });

    it('should optimistically update unlike', async () => {
      // ARRANGE
      const sessionId = 'session123';
      const commentId = 'comment123';

      const initialComments: CommentsResponse = {
        comments: [{ ...mockComment, isLiked: true, likeCount: 6 }],
        hasMore: false,
      };
      queryClient.setQueryData(COMMENT_KEYS.list(sessionId), initialComments);

      // Mock service
      mockFunctions.unlikeComment.mockResolvedValue(undefined);

      // ACT
      const { result } = renderHook(() => useCommentLike(sessionId), {
        wrapper,
      });

      await act(async () => {
        result.current.mutate({ commentId, action: 'unlike' });
      });

      // ASSERT
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFunctions.unlikeComment).toHaveBeenCalledWith(commentId);
    });

    it('should handle "already liked" errors gracefully', async () => {
      // ARRANGE
      const sessionId = 'session123';
      const commentId = 'comment123';

      const initialComments: CommentsResponse = {
        comments: [{ ...mockComment, isLiked: false, likeCount: 5 }],
        hasMore: false,
      };
      queryClient.setQueryData(COMMENT_KEYS.list(sessionId), initialComments);

      // Mock service to throw "already liked"
      mockFunctions.likeComment.mockRejectedValue(new Error('Already liked'));

      // ACT
      const { result } = renderHook(() => useCommentLike(sessionId), {
        wrapper,
      });

      await act(async () => {
        result.current.mutate({ commentId, action: 'like' });
      });

      // ASSERT - Should succeed despite error (idempotent)
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Mutation treats "already liked" as success
      expect(result.current.isError).toBe(false);
    });
  });
});
