/**
 * Tests for useTimerQuery hooks
 *
 * These tests ensure that timer mutations properly update the React Query cache
 * and invalidate queries to trigger UI re-renders.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useStartTimerMutation,
  usePauseTimerMutation,
  useResumeTimerMutation,
  useSaveActiveSession,
  useActiveTimerQuery,
} from '@/hooks/useTimerQuery';
import { firebaseSessionApi } from '@/lib/api';
import { CACHE_KEYS } from '@/lib/queryClient';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' },
  },
  db: {},
  storage: {},
}));

// Mock the API
jest.mock('@/lib/api', () => ({
  firebaseSessionApi: {
    saveActiveSession: jest.fn(),
    getActiveSession: jest.fn(),
    clearActiveSession: jest.fn(),
  },
}));

// Mock the auth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    isAuthenticated: true,
  }),
}));

describe('useTimerQuery - Cache Invalidation', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    // Create wrapper with QueryClientProvider
    wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useStartTimerMutation', () => {
    it('should invalidate active session query after starting timer', async () => {
      const mockSaveActiveSession =
        firebaseSessionApi.saveActiveSession as jest.Mock;
      mockSaveActiveSession.mockResolvedValue(undefined);

      // Spy on queryClient methods
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');

      const { result } = renderHook(() => useStartTimerMutation(), { wrapper });

      // Start the timer
      await waitFor(async () => {
        await result.current.mutateAsync({
          projectId: 'test-project',
          customStartTime: undefined,
        });
      });

      // Verify saveActiveSession was called
      expect(mockSaveActiveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'test-project',
          pausedDuration: 0,
          isPaused: false,
        })
      );

      // Verify cache was updated with setQueryData
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        CACHE_KEYS.ACTIVE_SESSION('test-user-id'),
        expect.objectContaining({
          projectId: 'test-project',
          pausedDuration: 0,
          isPaused: false,
        })
      );

      // CRITICAL: Verify invalidateQueries was called to trigger re-render
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: CACHE_KEYS.ACTIVE_SESSION('test-user-id'),
      });
    });

    it('should update cache with custom start time', async () => {
      const mockSaveActiveSession =
        firebaseSessionApi.saveActiveSession as jest.Mock;
      mockSaveActiveSession.mockResolvedValue(undefined);

      const customStartTime = new Date('2025-01-01T10:00:00Z');
      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');

      const { result } = renderHook(() => useStartTimerMutation(), { wrapper });

      await waitFor(async () => {
        await result.current.mutateAsync({
          projectId: 'test-project',
          customStartTime,
        });
      });

      // Verify cache was updated with custom start time
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        CACHE_KEYS.ACTIVE_SESSION('test-user-id'),
        expect.objectContaining({
          startTime: customStartTime,
          projectId: 'test-project',
        })
      );
    });
  });

  describe('usePauseTimerMutation', () => {
    it('should invalidate active session query after pausing timer', async () => {
      const mockSaveActiveSession =
        firebaseSessionApi.saveActiveSession as jest.Mock;
      mockSaveActiveSession.mockResolvedValue(undefined);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');

      const { result } = renderHook(() => usePauseTimerMutation(), { wrapper });

      const startTime = new Date();
      const elapsedSeconds = 300; // 5 minutes

      await waitFor(async () => {
        await result.current.mutateAsync({
          startTime,
          projectId: 'test-project',
          elapsedSeconds,
        });
      });

      // Verify saveActiveSession was called with paused state
      expect(mockSaveActiveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'test-project',
          pausedDuration: elapsedSeconds,
          isPaused: true,
        })
      );

      // Verify cache was updated
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        CACHE_KEYS.ACTIVE_SESSION('test-user-id'),
        expect.objectContaining({
          pausedDuration: elapsedSeconds,
          isPaused: true,
        })
      );

      // CRITICAL: Verify invalidateQueries was called
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: CACHE_KEYS.ACTIVE_SESSION('test-user-id'),
      });
    });
  });

  describe('useResumeTimerMutation', () => {
    it('should invalidate active session query after resuming timer', async () => {
      const mockSaveActiveSession =
        firebaseSessionApi.saveActiveSession as jest.Mock;
      mockSaveActiveSession.mockResolvedValue(undefined);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');

      const { result } = renderHook(() => useResumeTimerMutation(), {
        wrapper,
      });

      const pausedDuration = 300; // 5 minutes paused

      await waitFor(async () => {
        await result.current.mutateAsync({
          pausedDuration,
          projectId: 'test-project',
        });
      });

      // Verify saveActiveSession was called with resumed state
      expect(mockSaveActiveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'test-project',
          pausedDuration: 0,
          isPaused: false,
        })
      );

      // Verify cache was updated with resumed state
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        CACHE_KEYS.ACTIVE_SESSION('test-user-id'),
        expect.objectContaining({
          pausedDuration: 0,
          isPaused: false,
        })
      );

      // CRITICAL: Verify invalidateQueries was called
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: CACHE_KEYS.ACTIVE_SESSION('test-user-id'),
      });
    });

    it('should calculate adjusted start time correctly', async () => {
      const mockSaveActiveSession =
        firebaseSessionApi.saveActiveSession as jest.Mock;
      mockSaveActiveSession.mockResolvedValue(undefined);

      const { result } = renderHook(() => useResumeTimerMutation(), {
        wrapper,
      });

      const pausedDuration = 600; // 10 minutes
      const beforeResume = Date.now();

      await waitFor(async () => {
        await result.current.mutateAsync({
          pausedDuration,
          projectId: 'test-project',
        });
      });

      // Verify the adjusted start time was calculated correctly
      const saveCall = mockSaveActiveSession.mock.calls[0][0];
      const adjustedStartTime = saveCall.startTime.getTime();
      const expectedStartTime = beforeResume - pausedDuration * 1000;

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(adjustedStartTime - expectedStartTime)).toBeLessThan(
        1000
      );
    });
  });

  describe('useSaveActiveSession', () => {
    it('should invalidate active session query after saving', async () => {
      const mockSaveActiveSession =
        firebaseSessionApi.saveActiveSession as jest.Mock;
      mockSaveActiveSession.mockResolvedValue(undefined);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');

      const { result } = renderHook(() => useSaveActiveSession(), { wrapper });

      const sessionData = {
        startTime: new Date(),
        projectId: 'test-project',
        selectedTaskIds: ['task1', 'task2'],
        pausedDuration: 0,
        isPaused: false,
      };

      await waitFor(async () => {
        await result.current.mutateAsync(sessionData);
      });

      // Verify cache was updated
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        CACHE_KEYS.ACTIVE_SESSION('test-user-id'),
        expect.objectContaining({
          projectId: 'test-project',
          selectedTaskIds: ['task1', 'task2'],
        })
      );

      // CRITICAL: Verify invalidateQueries was called
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: CACHE_KEYS.ACTIVE_SESSION('test-user-id'),
      });
    });
  });

  describe('Integration - Cache updates trigger UI re-renders', () => {
    it('should trigger query refetch when cache is invalidated', async () => {
      const mockGetActiveSession =
        firebaseSessionApi.getActiveSession as jest.Mock;
      const mockSaveActiveSession =
        firebaseSessionApi.saveActiveSession as jest.Mock;

      // Initial state: no active session
      mockGetActiveSession.mockResolvedValue(null);
      mockSaveActiveSession.mockResolvedValue(undefined);

      // Render the query hook
      const { result: queryResult } = renderHook(() => useActiveTimerQuery(), {
        wrapper,
      });

      // Wait for initial query to complete
      await waitFor(() => {
        expect(queryResult.current.isLoading).toBe(false);
      });

      // Verify no active session initially
      expect(queryResult.current.data).toBeNull();

      // Now start a timer
      const { result: mutationResult } = renderHook(
        () => useStartTimerMutation(),
        { wrapper }
      );

      // Update mock to return active session after mutation
      const startTime = new Date();
      mockGetActiveSession.mockResolvedValue({
        startTime,
        projectId: 'test-project',
        selectedTaskIds: [],
        pausedDuration: 0,
        isPaused: false,
      });

      // Execute the mutation
      await waitFor(async () => {
        await mutationResult.current.mutateAsync({
          projectId: 'test-project',
        });
      });

      // CRITICAL: The query should refetch due to invalidation
      await waitFor(() => {
        expect(queryResult.current.data).toBeTruthy();
        expect(queryResult.current.data?.projectId).toBe('test-project');
      });
    });
  });
});
