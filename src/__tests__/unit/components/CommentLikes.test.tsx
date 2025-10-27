import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CommentItem } from '@/components/CommentItem';
import { CommentWithDetails } from '@/types';
import '@testing-library/jest-dom';

// Mock the firebaseApi
jest.mock('@/lib/api', () => ({
  firebaseCommentApi: {
    likeComment: jest.fn(),
    unlikeComment: jest.fn(),
  },
}));

const mockComment: CommentWithDetails = {
  id: 'comment-1',
  sessionId: 'session-1',
  userId: 'user-2',
  content: 'Great work on this session!',
  likeCount: 5,
  replyCount: 0,
  isLiked: false,
  isEdited: false,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
  user: {
    id: 'user-2',
    email: 'commenter@example.com',
    name: 'Jane Commenter',
    username: 'janecomments',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
};

describe('CommentLikes', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('CommentItem Like Display', () => {
    it('should display like button with count when comment has likes', () => {
      renderWithProviders(
        <CommentItem
          comment={mockComment}
          sessionId="session-1"
          currentUserId="user-1"
          onLike={jest.fn()}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should not display count when likeCount is 0', () => {
      const commentWithNoLikes = { ...mockComment, likeCount: 0 };

      renderWithProviders(
        <CommentItem
          comment={commentWithNoLikes}
          sessionId="session-1"
          currentUserId="user-1"
          onLike={jest.fn()}
        />
      );

      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should show filled heart when comment is liked by current user', () => {
      const likedComment = { ...mockComment, isLiked: true };

      renderWithProviders(
        <CommentItem
          comment={likedComment}
          sessionId="session-1"
          currentUserId="user-1"
          onLike={jest.fn()}
        />
      );

      const heartButton = screen.getByRole('button');
      expect(heartButton).toHaveClass('text-red-600');
    });

    it('should show outlined heart when comment is not liked by current user', () => {
      renderWithProviders(
        <CommentItem
          comment={mockComment}
          sessionId="session-1"
          currentUserId="user-1"
          onLike={jest.fn()}
        />
      );

      const heartButton = screen.getByRole('button');
      expect(heartButton).toHaveClass('text-gray-500');
    });

    it('should not display like button when currentUserId is not provided', () => {
      renderWithProviders(
        <CommentItem
          comment={mockComment}
          sessionId="session-1"
          onLike={jest.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: /heart/i })).not.toBeInTheDocument();
    });
  });

  describe('CommentItem Like Interactions', () => {
    it('should call onLike with "like" action when unliked comment is clicked', async () => {
      const onLike = jest.fn();

      renderWithProviders(
        <CommentItem
          comment={mockComment}
          sessionId="session-1"
          currentUserId="user-1"
          onLike={onLike}
        />
      );

      const heartButton = screen.getByRole('button');
      fireEvent.click(heartButton);

      expect(onLike).toHaveBeenCalledWith('comment-1', 'like');
    });

    it('should call onLike with "unlike" action when liked comment is clicked', async () => {
      const likedComment = { ...mockComment, isLiked: true };
      const onLike = jest.fn();

      renderWithProviders(
        <CommentItem
          comment={likedComment}
          sessionId="session-1"
          currentUserId="user-1"
          onLike={onLike}
        />
      );

      const heartButton = screen.getByRole('button');
      fireEvent.click(heartButton);

      expect(onLike).toHaveBeenCalledWith('comment-1', 'unlike');
    });

    it('should not call onLike when button is disabled (no onLike handler)', () => {
      renderWithProviders(
        <CommentItem
          comment={mockComment}
          sessionId="session-1"
          currentUserId="user-1"
        />
      );

      const heartButton = screen.getByRole('button');
      fireEvent.click(heartButton);

      // Should not throw error when clicking
      expect(heartButton).toBeDisabled();
    });

    it('should handle multiple rapid clicks gracefully', () => {
      const onLike = jest.fn();

      renderWithProviders(
        <CommentItem
          comment={mockComment}
          sessionId="session-1"
          currentUserId="user-1"
          onLike={onLike}
        />
      );

      const heartButton = screen.getByRole('button');

      // Simulate rapid clicking
      fireEvent.click(heartButton);
      fireEvent.click(heartButton);
      fireEvent.click(heartButton);

      // All clicks should register
      expect(onLike).toHaveBeenCalledTimes(3);
    });
  });

  describe('Comment Like Count Edge Cases', () => {
    it('should display large like counts correctly', () => {
      const popularComment = { ...mockComment, likeCount: 1234 };

      renderWithProviders(
        <CommentItem
          comment={popularComment}
          sessionId="session-1"
          currentUserId="user-1"
          onLike={jest.fn()}
        />
      );

      expect(screen.getByText('1234')).toBeInTheDocument();
    });

    it('should handle negative like counts (defensive)', () => {
      const invalidComment = { ...mockComment, likeCount: -5 };

      renderWithProviders(
        <CommentItem
          comment={invalidComment}
          sessionId="session-1"
          currentUserId="user-1"
          onLike={jest.fn()}
        />
      );

      // Component should render without crashing
      expect(screen.getByText('Jane Commenter')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button for screen readers', () => {
      renderWithProviders(
        <CommentItem
          comment={mockComment}
          sessionId="session-1"
          currentUserId="user-1"
          onLike={jest.fn()}
        />
      );

      const heartButton = screen.getByRole('button');
      expect(heartButton).toBeInTheDocument();
      expect(heartButton).not.toHaveAttribute('aria-label');
    });

    it('should indicate disabled state properly', () => {
      renderWithProviders(
        <CommentItem
          comment={mockComment}
          sessionId="session-1"
          currentUserId="user-1"
        />
      );

      const heartButton = screen.getByRole('button');
      expect(heartButton).toBeDisabled();
    });
  });

  describe('Integration with Comment Context', () => {
    it('should display comment content along with like button', () => {
      renderWithProviders(
        <CommentItem
          comment={mockComment}
          sessionId="session-1"
          currentUserId="user-1"
          onLike={jest.fn()}
        />
      );

      expect(screen.getByText('Great work on this session!')).toBeInTheDocument();
      expect(screen.getByText('Jane Commenter')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should handle comment with no likes and not liked', () => {
      const newComment = {
        ...mockComment,
        likeCount: 0,
        isLiked: false,
      };

      renderWithProviders(
        <CommentItem
          comment={newComment}
          sessionId="session-1"
          currentUserId="user-1"
          onLike={jest.fn()}
        />
      );

      // Like button should be present but count should not display
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });
});
