/**
 * Integration Test: Filter Flow
 *
 * Tests the complete filter flow:
 * - Change filter → Refetch with new params → Update UI
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFeedInfinite } from '@/features/feed/hooks/useFeed';
import { SessionWithDetails } from '@/types';

// Mock Feed Service
jest.mock('@/features/feed/services/FeedService', () => {
  return {
    FeedService: jest.fn().mockImplementation(() => ({
      getFeed: jest.fn(),
      refreshFeed: jest.fn(),
    })),
  };
});

// Mock auth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: {
      id: 'user-123',
      email: 'user@example.com',
      username: 'testuser',
      name: 'Test User',
    },
  }),
}));

describe('Integration: Filter Flow', () => {
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

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch different data for different filter types', async () => {
    const followingSessions: SessionWithDetails[] = [
      {
        id: 'session-1',
        userId: 'user-456',
        projectId: 'project-1',
        title: 'Following Session',
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 3600,
        visibility: 'followers',
        supportCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-456',
          email: 'following@example.com',
          username: 'followinguser',
          name: 'Following User',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];

    const everyoneSessions: SessionWithDetails[] = [
      {
        id: 'session-2',
        userId: 'user-789',
        projectId: 'project-2',
        title: 'Public Session',
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 1800,
        visibility: 'everyone',
        supportCount: 10,
        commentCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-789',
          email: 'public@example.com',
          username: 'publicuser',
          name: 'Public User',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];

    const FeedService =
      require('@/features/feed/services/FeedService').FeedService;
    const mockGetFeed = jest.fn().mockImplementation((userId, filters) => {
      if (filters.type === 'following') {
        return Promise.resolve({
          sessions: followingSessions,
          hasMore: false,
          nextCursor: undefined,
        });
      } else {
        return Promise.resolve({
          sessions: everyoneSessions,
          hasMore: false,
          nextCursor: undefined,
        });
      }
    });

    FeedService.mockImplementation(() => ({
      getFeed: mockGetFeed,
      refreshFeed: jest.fn(),
    }));

    // Test following filter
    const { result: followingResult } = renderHook(
      () => useFeedInfinite('user-123', { type: 'following' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(followingResult.current.isSuccess).toBe(true);
    });

    expect(followingResult.current.data?.pages[0]?.sessions[0]?.title).toBe(
      'Following Session'
    );

    // Test everyone filter
    const { result: everyoneResult } = renderHook(
      () => useFeedInfinite('user-123', { type: 'everyone' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(everyoneResult.current.isSuccess).toBe(true);
    });

    expect(everyoneResult.current.data?.pages[0]?.sessions[0]?.title).toBe(
      'Public Session'
    );
  });
});
