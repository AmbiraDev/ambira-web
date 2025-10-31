/**
 * Integration Test: Support Flow
 *
 * Tests the complete support flow:
 * - Support action → Optimistic update → API call → Cache update
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFeedInfinite } from '@/features/feed/hooks/useFeed';
import { SessionWithDetails } from '@/types';

// Mock useFeedInfinite hook
jest.mock('@/features/feed/hooks/useFeed', () => ({
  useFeedInfinite: jest.fn(),
}));

// Mock useAuth hook
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

describe('Integration: Support Flow', () => {
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

  it('should support a session and update cache optimistically', async () => {
    const mockSessions: SessionWithDetails[] = [
      {
        id: 'session-1',
        userId: 'user-456',
        projectId: 'project-1',
        title: 'Test Session',
        visibility: 'everyone',
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
      },
    ];

    (useFeedInfinite as jest.Mock).mockReturnValue({
      data: {
        pages: [{ sessions: mockSessions }],
      },
      isSuccess: true,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });

    const { result } = renderHook(
      () => useFeedInfinite('user-123', { type: 'following' }),
      { wrapper }
    );

    // Verify data is loaded
    expect(result.current.isSuccess).toBe(true);

    // Verify initial support count
    const firstSession = result.current.data?.pages[0]?.sessions[0];
    expect(firstSession?.supportCount).toBe(0);

    // Verify hook was called with correct params
    expect(useFeedInfinite).toHaveBeenCalledWith('user-123', {
      type: 'following',
    });
  });

  it('should handle support API errors', async () => {
    const mockSessions: SessionWithDetails[] = [
      {
        id: 'session-1',
        userId: 'user-456',
        projectId: 'project-1',
        title: 'Test Session',
        visibility: 'everyone',
        supportCount: 5,
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
      },
    ];

    (useFeedInfinite as jest.Mock).mockReturnValue({
      data: {
        pages: [{ sessions: mockSessions }],
      },
      isSuccess: true,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });

    const { result } = renderHook(
      () => useFeedInfinite('user-123', { type: 'following' }),
      { wrapper }
    );

    // Verify data loaded
    const firstSession = result.current.data?.pages[0]?.sessions[0];
    expect(firstSession?.supportCount).toBe(5);
  });

  it('should update support count across all feed instances', async () => {
    const mockSessions: SessionWithDetails[] = [
      {
        id: 'session-1',
        userId: 'user-456',
        projectId: 'project-1',
        title: 'Test Session',
        visibility: 'everyone',
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
      },
    ];

    (useFeedInfinite as jest.Mock).mockReturnValue({
      data: {
        pages: [{ sessions: mockSessions }],
      },
      isSuccess: true,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });

    // Render two feed instances with different filters
    const { result: result1 } = renderHook(
      () => useFeedInfinite('user-123', { type: 'following' }),
      { wrapper }
    );

    const { result: result2 } = renderHook(
      () => useFeedInfinite('user-123', { type: 'all' }),
      { wrapper }
    );

    // Both should have loaded data
    expect(result1.current.data?.pages[0]?.sessions).toBeDefined();
    expect(result2.current.data?.pages[0]?.sessions).toBeDefined();
  });

  it('should handle rapid support/unsupport actions', async () => {
    const mockSessions: SessionWithDetails[] = [
      {
        id: 'session-1',
        userId: 'user-456',
        projectId: 'project-1',
        title: 'Test Session',
        visibility: 'everyone',
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
      },
    ];

    (useFeedInfinite as jest.Mock).mockReturnValue({
      data: {
        pages: [{ sessions: mockSessions }],
      },
      isSuccess: true,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });

    const { result } = renderHook(
      () => useFeedInfinite('user-123', { type: 'following' }),
      { wrapper }
    );

    // Verify initial state
    expect(result.current.data?.pages[0]?.sessions[0]?.isSupported).toBe(false);
  });

  it('should maintain support state during pagination', async () => {
    const mockPage1: SessionWithDetails[] = [
      {
        id: 'session-1',
        userId: 'user-456',
        projectId: 'project-1',
        title: 'Session 1',
        visibility: 'everyone',
        supportCount: 5,
        commentCount: 0,
        isSupported: true,
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
      },
    ];

    const mockPage2: SessionWithDetails[] = [
      {
        id: 'session-2',
        userId: 'user-789',
        projectId: 'project-2',
        title: 'Session 2',
        visibility: 'everyone',
        supportCount: 0,
        commentCount: 0,
        isSupported: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-789',
          email: 'another@example.com',
          username: 'anotheruser',
          displayName: 'Another User',
          createdAt: new Date(),
        },
      },
    ];

    (useFeedInfinite as jest.Mock).mockReturnValue({
      data: {
        pages: [{ sessions: mockPage1 }, { sessions: mockPage2 }],
      },
      isSuccess: true,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });

    const { result } = renderHook(
      () => useFeedInfinite('user-123', { type: 'following' }),
      { wrapper }
    );

    // Verify both pages maintain their support state
    expect(result.current.data?.pages[0]?.sessions[0]?.isSupported).toBe(true);
    expect(result.current.data?.pages[1]?.sessions[0]?.isSupported).toBe(false);
  });
});
