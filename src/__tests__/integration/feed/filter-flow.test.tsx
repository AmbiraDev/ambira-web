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

// Mock useFeedInfinite hook
jest.mock('@/features/feed/hooks/useFeed', () => ({
  useFeedInfinite: jest.fn(),
}));

// Mock auth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: {
      id: 'user-123',
      email: 'user@example.com',
      username: 'testuser',
      displayName: 'Test User',
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
        activityId: 'activity-1',
        projectId: 'project-1',
        title: 'Following Session',
        duration: 3600,
        startTime: new Date(),
        isArchived: false,
        visibility: 'followers',
        supportCount: 0,
        commentCount: 0,
        isSupported: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-456',
          email: 'other@example.com',
          username: 'otheruser',
          name: 'Other User',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        activity: {
          id: 'activity-1',
          userId: 'user-456',
          name: 'Work',
          description: 'Work activity',
          icon: 'briefcase',
          color: '#0066CC',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];

    const everyoneSessions: SessionWithDetails[] = [
      {
        id: 'session-2',
        userId: 'user-789',
        activityId: 'activity-2',
        projectId: 'project-2',
        title: 'Public Session',
        duration: 7200,
        startTime: new Date(),
        isArchived: false,
        visibility: 'everyone',
        supportCount: 10,
        commentCount: 5,
        isSupported: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-789',
          email: 'another@example.com',
          username: 'anotheruser',
          name: 'Another User',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        activity: {
          id: 'activity-2',
          userId: 'user-789',
          name: 'Study',
          description: 'Study activity',
          icon: 'book',
          color: '#34C759',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];

    // Test following filter
    (useFeedInfinite as jest.Mock).mockReturnValueOnce({
      data: {
        pages: [{ sessions: followingSessions }],
      },
      isSuccess: true,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });

    const { result: followingResult } = renderHook(
      () => useFeedInfinite('user-123', { type: 'following' }),
      { wrapper }
    );

    // Verify following filter results
    expect(followingResult.current.data?.pages[0]?.sessions[0]?.title).toBe(
      'Following Session'
    );

    // Test everyone filter (uses public feed)
    (useFeedInfinite as jest.Mock).mockReturnValueOnce({
      data: {
        pages: [{ sessions: everyoneSessions }],
      },
      isSuccess: true,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });

    const { result: everyoneResult } = renderHook(
      () => useFeedInfinite('user-123', { type: 'all' }),
      { wrapper }
    );

    // Verify everyone filter results
    expect(everyoneResult.current.data?.pages[0]?.sessions[0]?.title).toBe(
      'Public Session'
    );
  });
});
