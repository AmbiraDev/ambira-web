/**
 * Unit Test: RightSidebar Component
 * Tests: Suggested groups display on home dashboard
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RightSidebar from '@/components/RightSidebar';
import { useAuth } from '@/hooks/useAuth';
import * as searchHooks from '@/features/search/hooks';

// Helper to flush all pending promises
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock the auth hook
jest.mock('@/hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the Firebase API
jest.mock('@/lib/api', () => ({
  firebaseUserApi: {
    getSuggestedUsers: jest.fn().mockResolvedValue([]),
    getFollowing: jest.fn().mockResolvedValue([]),
  },
  firebaseApi: {
    group: {
      joinGroup: jest.fn().mockResolvedValue(undefined),
      getUserGroups: jest.fn().mockResolvedValue([]),
    },
    user: {
      followUser: jest.fn().mockResolvedValue(undefined),
      unfollowUser: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

// Mock the cache utility
jest.mock('@/lib/cache', () => ({
  cachedQuery: jest.fn((key, fn) => {
    // Return a Promise that resolves to the function result
    return Promise.resolve([]);
  }),
}));

// Mock the search hooks
const mockUseSuggestedGroups = jest.fn();
jest.mock('@/features/search/hooks', () => ({
  useSuggestedGroups: (...args: unknown[]) => mockUseSuggestedGroups(...args),
}));

describe('RightSidebar - Suggested Groups', () => {
  let queryClient: QueryClient;
  const originalError = console.error;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Set up default mock for useAuth
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      currentUser: {
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      loginMutation: {} as any,
      signupMutation: {} as any,
      googleSignInMutation: {} as any,
      logoutMutation: {} as any,
    });

    // Suppress act() warnings for async state updates after render
    // These are expected since mocks may trigger state updates after test completion
    jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const message = String(args[0] || '');
      // Only filter out act() warnings, let other console errors through
      if (message.includes('An update to') && message.includes('act(')) {
        return; // Suppress this specific warning
      }
      originalError.call(console, ...args);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should display suggested groups from the hook', async () => {
    // Arrange: Mock suggested groups
    const suggestedGroupsData = [
      {
        id: 'group-1',
        name: 'Fitness Enthusiasts',
        description: 'A group for fitness lovers',
        memberCount: 15,
        members: 15,
        imageUrl: 'https://example.com/image1.jpg',
      },
      {
        id: 'group-2',
        name: 'Coding Bootcamp',
        description: 'Learn to code together',
        memberCount: 20,
        members: 20,
      },
    ];

    mockUseSuggestedGroups.mockReturnValue({
      suggestedGroups: suggestedGroupsData,
      isLoading: false,
      isError: false,
      error: null,
    });

    // Act: Render the sidebar
    render(<RightSidebar />, { wrapper });

    // Wait for all pending promises and state updates to complete
    await flushPromises();

    // Assert: Should display the groups
    await waitFor(() => {
      expect(screen.getByText('Suggested Groups')).toBeInTheDocument();
      expect(screen.getByText('Fitness Enthusiasts')).toBeInTheDocument();
      expect(screen.getByText('Coding Bootcamp')).toBeInTheDocument();
      expect(screen.getByText('15 members')).toBeInTheDocument();
      expect(screen.getByText('20 members')).toBeInTheDocument();
    });
  });

  it('should show loading state while fetching groups', async () => {
    // Arrange: Mock loading state
    mockUseSuggestedGroups.mockReturnValue({
      suggestedGroups: [],
      isLoading: true,
      isError: false,
      error: null,
    });

    // Act: Render the sidebar
    render(<RightSidebar />, { wrapper });

    // Wait for all pending promises and state updates to complete
    await flushPromises();

    // Assert: Should show loading skeletons (wait for render to complete)
    await waitFor(() => {
      const loadingElements = screen
        .getAllByRole('generic')
        .filter(el => el.className.includes('animate-pulse'));
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  it('should show empty state when no groups are available', async () => {
    // Arrange: Mock empty groups
    mockUseSuggestedGroups.mockReturnValue({
      suggestedGroups: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    // Act: Render the sidebar
    render(<RightSidebar />, { wrapper });

    // Wait for all pending promises and state updates to complete
    await flushPromises();

    // Assert: Should show empty state
    await waitFor(() => {
      expect(screen.getByText('No groups available')).toBeInTheDocument();
    });
  });

  it('should display correct member count with singular/plural', async () => {
    // Arrange: Mock groups with different member counts
    const mockSuggestedGroups = [
      {
        id: 'group-1',
        name: 'Solo Group',
        description: 'Just one member',
        memberCount: 1,
        members: 1,
      },
      {
        id: 'group-2',
        name: 'Popular Group',
        description: 'Many members',
        memberCount: 100,
        members: 100,
      },
    ];

    mockUseSuggestedGroups.mockReturnValue({
      suggestedGroups: mockSuggestedGroups,
      isLoading: false,
      isError: false,
      error: null,
    });

    // Act: Render the sidebar
    render(<RightSidebar />, { wrapper });

    // Wait for all pending promises and state updates to complete
    await flushPromises();

    // Assert: Should display correct singular/plural
    await waitFor(() => {
      expect(screen.getByText('1 member')).toBeInTheDocument();
      expect(screen.getByText('100 members')).toBeInTheDocument();
    });
  });

  it('should display join buttons for suggested groups', async () => {
    // Arrange: Mock suggested groups
    const mockSuggestedGroups = [
      {
        id: 'group-1',
        name: 'Test Group',
        description: 'A test group',
        memberCount: 10,
        members: 10,
      },
    ];

    mockUseSuggestedGroups.mockReturnValue({
      suggestedGroups: mockSuggestedGroups,
      isLoading: false,
      isError: false,
      error: null,
    });

    // Act: Render the sidebar
    render(<RightSidebar />, { wrapper });

    // Wait for all pending promises and state updates to complete
    await flushPromises();

    // Assert: Should display join button
    await waitFor(() => {
      const joinButtons = screen.getAllByRole('button', { name: /join/i });
      expect(joinButtons.length).toBeGreaterThan(0);
    });
  });

  it('should limit display to 5 suggested groups', async () => {
    // Arrange: Mock more than 5 groups
    const mockSuggestedGroups = Array.from({ length: 10 }, (_, i) => ({
      id: `group-${i}`,
      name: `Group ${i}`,
      description: `Description ${i}`,
      memberCount: i * 5,
      members: i * 5,
    }));

    mockUseSuggestedGroups.mockReturnValue({
      suggestedGroups: mockSuggestedGroups,
      isLoading: false,
      isError: false,
      error: null,
    });

    // Act: Render the sidebar
    render(<RightSidebar />, { wrapper });

    // Wait for all pending promises and state updates to complete
    await flushPromises();

    // Assert: Hook should have been called with limit: 5
    await waitFor(() => {
      expect(mockUseSuggestedGroups).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5 })
      );
    });
  });

  it('should only fetch groups when user is authenticated', async () => {
    // Arrange: Mock unauthenticated user
    mockUseAuth.mockReturnValue({
      user: null,
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      loginMutation: {} as any,
      signupMutation: {} as any,
      googleSignInMutation: {} as any,
      logoutMutation: {} as any,
    });

    mockUseSuggestedGroups.mockReturnValue({
      suggestedGroups: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    // Act: Render the sidebar
    render(<RightSidebar />, { wrapper });

    // Wait for all pending promises and state updates to complete
    await flushPromises();

    // Assert: Hook should be called with enabled: false
    await waitFor(() => {
      expect(mockUseSuggestedGroups).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
      );
    });
  });

  it('should handle groups with missing member counts', async () => {
    // Arrange: Mock groups with no memberCount
    const mockSuggestedGroups = [
      {
        id: 'group-1',
        name: 'Test Group',
        description: 'A test group',
        memberCount: 0,
        members: 0,
      },
    ];

    mockUseSuggestedGroups.mockReturnValue({
      suggestedGroups: mockSuggestedGroups,
      isLoading: false,
      isError: false,
      error: null,
    });

    // Act: Render the sidebar
    render(<RightSidebar />, { wrapper });

    // Wait for all pending promises and state updates to complete
    await flushPromises();

    // Assert: Should display 0 members
    await waitFor(() => {
      expect(screen.getByText('0 members')).toBeInTheDocument();
    });
  });
});
