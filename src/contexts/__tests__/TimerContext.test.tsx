import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { TimerProvider, useTimer } from '../TimerContext';
import { firebaseSessionApi } from '@/lib/firebaseApi';
import { useAuth } from '../AuthContext';
import { useProjects } from '../ProjectsContext';

// Mock dependencies
jest.mock('@/lib/firebaseApi', () => ({
  firebaseSessionApi: {
    getActiveSession: jest.fn(),
    clearActiveSession: jest.fn(),
    saveActiveSession: jest.fn(),
    createSession: jest.fn(),
    createSessionWithPost: jest.fn()
  },
  firebaseProjectApi: {
    getProjects: jest.fn()
  },
  firebaseTaskApi: {
    getProjectTasks: jest.fn()
  }
}));
jest.mock('../AuthContext');
jest.mock('../ProjectsContext');
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-id', getIdToken: jest.fn().mockResolvedValue('test-token') },
    onAuthStateChanged: jest.fn((callback) => {
      callback({ uid: 'test-user-id' });
      return jest.fn(); // unsubscribe
    })
  }
}));

const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User'
};

const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  description: 'Test project description',
  color: 'blue',
  icon: 'Folder',
  userId: 'test-user-id',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockTask = {
  id: 'task-1',
  name: 'Test Task',
  projectId: 'project-1',
  status: 'active' as const,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockSession = {
  id: 'session-1',
  userId: 'test-user-id',
  projectId: 'project-1',
  activityId: 'project-1',
  title: 'Test Session',
  description: 'Test description',
  duration: 3600,
  startTime: new Date(),
  tasks: [mockTask],
  visibility: 'private' as const,
  showStartTime: false,
  hideTaskNames: false,
  publishToFeeds: true,
  isArchived: false,
  supportCount: 0,
  commentCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('TimerContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useProjects as jest.Mock).mockReturnValue({ projects: [mockProject] });

    // Mock Firebase API modules
    const { firebaseSessionApi, firebaseProjectApi, firebaseTaskApi } = require('@/lib/firebaseApi');

    (firebaseSessionApi.getActiveSession as jest.Mock).mockResolvedValue(null);
    (firebaseSessionApi.clearActiveSession as jest.Mock).mockResolvedValue(undefined);
    (firebaseSessionApi.saveActiveSession as jest.Mock).mockResolvedValue(undefined);
    (firebaseSessionApi.createSession as jest.Mock).mockResolvedValue(mockSession);
    (firebaseSessionApi.createSessionWithPost as jest.Mock).mockResolvedValue({ session: mockSession, post: null });

    (firebaseProjectApi.getProjects as jest.Mock).mockResolvedValue([mockProject]);
    (firebaseTaskApi.getProjectTasks as jest.Mock).mockResolvedValue([mockTask]);
  });

  describe('resetTimer (Cancel Session)', () => {
    it('should successfully cancel and delete active session', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      // Start a timer first
      await act(async () => {
        await result.current.startTimer('project-1', ['task-1']);
      });

      // Verify timer is running
      expect(result.current.timerState.isRunning).toBe(true);
      expect(result.current.timerState.activeTimerId).toBeTruthy();

      // Cancel the timer
      await act(async () => {
        await result.current.resetTimer();
      });

      // Verify Firebase clearActiveSession was called
      expect(firebaseSessionApi.clearActiveSession).toHaveBeenCalledTimes(1);

      // Verify timer state is reset
      expect(result.current.timerState.isRunning).toBe(false);
      expect(result.current.timerState.startTime).toBeNull();
      expect(result.current.timerState.currentProject).toBeNull();
      expect(result.current.timerState.activeTimerId).toBeNull();
      expect(result.current.timerState.pausedDuration).toBe(0);
    });

    it('should throw error if clearActiveSession fails', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      // Start a timer first
      await act(async () => {
        await result.current.startTimer('project-1', ['task-1']);
      });

      // Mock clearActiveSession to fail
      const mockError = new Error('Failed to clear active session');
      const { firebaseSessionApi } = require('@/lib/firebaseApi');
      (firebaseSessionApi.clearActiveSession as jest.Mock).mockRejectedValueOnce(mockError);

      // Try to cancel the timer
      await act(async () => {
        await expect(result.current.resetTimer()).rejects.toThrow('Failed to clear active session');
      });

      // Verify timer state is NOT reset (because deletion failed)
      expect(result.current.timerState.isRunning).toBe(true);
      expect(result.current.timerState.activeTimerId).toBeTruthy();
    });

    it('should not attempt to cancel if no active timer', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      // Try to cancel without starting
      await act(async () => {
        await result.current.resetTimer();
      });

      // Verify clearActiveSession was NOT called
      expect(firebaseSessionApi.clearActiveSession).not.toHaveBeenCalled();
    });
  });

  describe('finishTimer (Complete Session)', () => {
    it('should successfully create session and clear active session', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      // Start a timer first
      await act(async () => {
        await result.current.startTimer('project-1', ['task-1']);
      });

      // Complete the session
      let session;
      await act(async () => {
        session = await result.current.finishTimer(
          'Morning Work Session',
          'Completed some tasks',
          [],
          3,
          'Private notes',
          {
            visibility: 'private',
            showStartTime: true,
            hideTaskNames: false,
            publishToFeeds: true
          }
        );
      });

      // Verify session was created
      expect(firebaseSessionApi.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          title: 'Morning Work Session',
          description: 'Completed some tasks',
          visibility: 'private',
          showStartTime: true,
          hideTaskNames: false,
          publishToFeeds: true,
          howFelt: 3,
          privateNotes: 'Private notes'
        })
      );

      // Verify active session was cleared
      expect(firebaseSessionApi.clearActiveSession).toHaveBeenCalledTimes(1);

      // Verify timer state is reset
      expect(result.current.timerState.isRunning).toBe(false);
      expect(result.current.timerState.startTime).toBeNull();
      expect(result.current.timerState.currentProject).toBeNull();
      expect(result.current.timerState.activeTimerId).toBeNull();

      // Verify session was returned
      expect(session).toEqual(mockSession);
    });

    it('should create session with post for public visibility', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      // Start a timer first
      await act(async () => {
        await result.current.startTimer('project-1', ['task-1']);
      });

      // Complete the session with public visibility
      await act(async () => {
        await result.current.finishTimer(
          'Morning Work Session',
          'Completed some tasks',
          [],
          3,
          'Private notes',
          {
            visibility: 'everyone',
            showStartTime: true,
            hideTaskNames: false,
            publishToFeeds: true
          }
        );
      });

      // Verify session was created with post
      expect(firebaseSessionApi.createSessionWithPost).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          title: 'Morning Work Session',
          description: 'Completed some tasks',
          visibility: 'everyone'
        }),
        'Completed some tasks',
        'everyone'
      );
    });

    it('should use custom duration if provided', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      // Start a timer first
      await act(async () => {
        await result.current.startTimer('project-1', ['task-1']);
      });

      // Complete the session with custom duration
      await act(async () => {
        await result.current.finishTimer(
          'Morning Work Session',
          'Completed some tasks',
          [],
          3,
          'Private notes',
          {
            visibility: 'private',
            customDuration: 7200 // 2 hours
          }
        );
      });

      // Verify custom duration was used
      expect(firebaseSessionApi.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 7200
        })
      );
    });

    it('should throw error if clearActiveSession fails after session creation', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      // Start a timer first
      await act(async () => {
        await result.current.startTimer('project-1', ['task-1']);
      });

      // Mock clearActiveSession to fail
      const mockError = new Error('Failed to clear active session');
      const { firebaseSessionApi } = require('@/lib/firebaseApi');
      (firebaseSessionApi.clearActiveSession as jest.Mock).mockRejectedValueOnce(mockError);

      // Try to complete the session
      await act(async () => {
        await expect(
          result.current.finishTimer(
            'Morning Work Session',
            'Completed some tasks',
            [],
            3,
            'Private notes',
            { visibility: 'private' }
          )
        ).rejects.toThrow('Failed to clear active session');
      });

      // Verify session was created (but clearing failed)
      expect(firebaseSessionApi.createSession).toHaveBeenCalled();

      // Timer state should NOT be reset because clearing failed
      expect(result.current.timerState.activeTimerId).toBeTruthy();
    });

    it('should throw error if no active timer to finish', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      // Try to finish without starting
      await act(async () => {
        await expect(
          result.current.finishTimer(
            'Morning Work Session',
            'Completed some tasks',
            [],
            3,
            'Private notes',
            { visibility: 'private' }
          )
        ).rejects.toThrow('No active timer to finish');
      });
    });

    it('should include images in session if provided', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      // Start a timer first
      await act(async () => {
        await result.current.startTimer('project-1', ['task-1']);
      });

      const imageUrls = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'];

      // Complete the session with images
      await act(async () => {
        await result.current.finishTimer(
          'Morning Work Session',
          'Completed some tasks',
          [],
          3,
          'Private notes',
          {
            visibility: 'private',
            images: imageUrls
          }
        );
      });

      // Verify images were included
      expect(firebaseSessionApi.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          images: imageUrls
        })
      );
    });
  });

  describe('Timer state management', () => {
    it('should maintain timer state across pause and resume', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      // Start a timer
      await act(async () => {
        await result.current.startTimer('project-1', ['task-1']);
      });

      expect(result.current.timerState.isRunning).toBe(true);

      // Pause the timer
      await act(async () => {
        await result.current.pauseTimer();
      });

      expect(result.current.timerState.isRunning).toBe(false);
      expect(result.current.timerState.activeTimerId).toBeTruthy();

      // Resume the timer
      await act(async () => {
        await result.current.resumeTimer();
      });

      expect(result.current.timerState.isRunning).toBe(true);
      expect(result.current.timerState.activeTimerId).toBeTruthy();
    });

    it('should load active session on mount', async () => {
      const activeSessionData = {
        startTime: new Date(),
        projectId: 'project-1',
        selectedTaskIds: ['task-1'],
        pausedDuration: 100,
        isPaused: false
      };

      const { firebaseSessionApi } = require('@/lib/firebaseApi');
      (firebaseSessionApi.getActiveSession as jest.Mock).mockResolvedValue(activeSessionData);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      await waitFor(() => {
        expect(result.current.timerState.currentProject).toBeTruthy();
        expect(result.current.timerState.isRunning).toBe(true);
      });
    });
  });

  describe('Time Calculation - Edge Cases', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-01T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should correctly calculate time for a running session loaded from Firebase', async () => {
      // Simulate a session that started 11 minutes ago
      const startTime = new Date(Date.now() - 11 * 60 * 1000);
      const activeSessionData = {
        startTime,
        projectId: 'project-1',
        selectedTaskIds: ['task-1'],
        pausedDuration: 0,
        isPaused: false
      };

      const { firebaseSessionApi } = require('@/lib/firebaseApi');
      (firebaseSessionApi.getActiveSession as jest.Mock).mockResolvedValue(activeSessionData);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      await waitFor(() => {
        expect(result.current.timerState.isRunning).toBe(true);
      });

      // Elapsed time should be approximately 11 minutes (660 seconds)
      const elapsed = result.current.getElapsedTime();
      expect(elapsed).toBeGreaterThanOrEqual(659);
      expect(elapsed).toBeLessThanOrEqual(661);

      // Format should show 00:11:xx
      const formatted = result.current.getFormattedTime(elapsed);
      expect(formatted).toMatch(/^00:11:\d{2}$/);
    });

    it('should reject sessions with start times more than 24 hours in the past', async () => {
      // Simulate a session that started 36 hours ago (stale data)
      const startTime = new Date(Date.now() - 36 * 60 * 60 * 1000);
      const activeSessionData = {
        startTime,
        projectId: 'project-1',
        selectedTaskIds: ['task-1'],
        pausedDuration: 660, // 11 minutes of actual work
        isPaused: false
      };

      const { firebaseSessionApi } = require('@/lib/firebaseApi');
      (firebaseSessionApi.getActiveSession as jest.Mock).mockResolvedValue(activeSessionData);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      await waitFor(() => {
        // Should have cleared the invalid session instead of loading it
        expect(firebaseSessionApi.clearActiveSession).toHaveBeenCalled();
        expect(result.current.timerState.isRunning).toBe(false);
      });
    });

    it('should correctly handle paused sessions with elapsed time', async () => {
      // Simulate a paused session: started 30 minutes ago, paused after 11 minutes
      const startTime = new Date(Date.now() - 30 * 60 * 1000);
      const activeSessionData = {
        startTime,
        projectId: 'project-1',
        selectedTaskIds: ['task-1'],
        pausedDuration: 660, // 11 minutes of actual work
        isPaused: true
      };

      const { firebaseSessionApi } = require('@/lib/firebaseApi');
      (firebaseSessionApi.getActiveSession as jest.Mock).mockResolvedValue(activeSessionData);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      await waitFor(() => {
        expect(result.current.timerState.currentProject).toBeTruthy();
        expect(result.current.timerState.isRunning).toBe(false);
      });

      // Elapsed time should be exactly 11 minutes (660 seconds), not 30 minutes
      const elapsed = result.current.getElapsedTime();
      expect(elapsed).toBe(660);

      // Format should show 00:11:00
      const formatted = result.current.getFormattedTime(elapsed);
      expect(formatted).toBe('00:11:00');
    });

    // TODO: Fix fake timer interactions with Date mocking
    it.skip('should maintain correct time after pause and resume cycle', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      // Start timer
      await act(async () => {
        await result.current.startTimer('project-1', ['task-1']);
      });

      // Run for 11 minutes
      act(() => {
        jest.advanceTimersByTime(11 * 60 * 1000);
      });

      let elapsedBeforePause;
      act(() => {
        elapsedBeforePause = result.current.getElapsedTime();
      });

      expect(elapsedBeforePause).toBeGreaterThanOrEqual(659);
      expect(elapsedBeforePause).toBeLessThanOrEqual(661);

      // Pause
      await act(async () => {
        await result.current.pauseTimer();
        // Flush any pending timers to ensure state updates
        jest.runOnlyPendingTimers();
      });

      // Verify pause worked and saved the elapsed time
      expect(result.current.timerState.isRunning).toBe(false);
      expect(result.current.timerState.pausedDuration).toBeGreaterThanOrEqual(659);
      expect(result.current.timerState.pausedDuration).toBeLessThanOrEqual(661);

      // Wait 5 hours while paused (simulating leaving the app)
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 60 * 1000);
      });

      // Time should still be 11 minutes
      const elapsedWhilePaused = result.current.getElapsedTime();
      expect(elapsedWhilePaused).toBeGreaterThanOrEqual(659);
      expect(elapsedWhilePaused).toBeLessThanOrEqual(661);

      // Resume
      await act(async () => {
        await result.current.resumeTimer();
      });

      // Run for 5 more minutes
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      // Total should be approximately 16 minutes
      const elapsedAfterResume = result.current.getElapsedTime();
      expect(elapsedAfterResume).toBeGreaterThanOrEqual(959);
      expect(elapsedAfterResume).toBeLessThanOrEqual(961);
    });

    it('should correctly restore time after app rebuild during active session', async () => {
      const { firebaseSessionApi } = require('@/lib/firebaseApi');

      // First render: start a timer
      const wrapper1 = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result: result1, unmount } = renderHook(() => useTimer(), { wrapper: wrapper1 });

      await act(async () => {
        await result1.current.startTimer('project-1', ['task-1']);
      });

      // Run for 11 minutes
      act(() => {
        jest.advanceTimersByTime(11 * 60 * 1000);
      });

      const elapsedBeforeRebuild = result1.current.getElapsedTime();
      const startTimeBeforeRebuild = result1.current.timerState.startTime;

      // Verify auto-save was called with correct startTime
      expect(firebaseSessionApi.saveActiveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: startTimeBeforeRebuild,
          pausedDuration: 0,
          isPaused: false
        })
      );

      // Simulate app rebuild by unmounting
      unmount();

      // Mock Firebase to return the saved session
      (firebaseSessionApi.getActiveSession as jest.Mock).mockResolvedValue({
        startTime: startTimeBeforeRebuild,
        projectId: 'project-1',
        selectedTaskIds: ['task-1'],
        pausedDuration: 0,
        isPaused: false
      });

      // Second render: reload from Firebase (simulating app rebuild)
      const wrapper2 = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result: result2 } = renderHook(() => useTimer(), { wrapper: wrapper2 });

      await waitFor(() => {
        expect(result2.current.timerState.isRunning).toBe(true);
      });

      // Elapsed time should still be approximately 11 minutes, not 36 hours!
      const elapsedAfterRebuild = result2.current.getElapsedTime();
      expect(elapsedAfterRebuild).toBeGreaterThanOrEqual(659);
      expect(elapsedAfterRebuild).toBeLessThanOrEqual(661);

      // Definitely should NOT be 36 hours (129600 seconds)
      expect(elapsedAfterRebuild).toBeLessThan(1000);
    });

    it('should handle timezone and date serialization correctly', async () => {
      // Create a date using different methods to test serialization
      const now = Date.now();
      const startTimeFromTimestamp = new Date(now - 11 * 60 * 1000);
      const startTimeFromISOString = new Date(startTimeFromTimestamp.toISOString());
      const startTimeFromUnixTimestamp = new Date(Math.floor(startTimeFromTimestamp.getTime()));

      const activeSessionData = {
        startTime: startTimeFromISOString, // Simulating Firebase Timestamp conversion
        projectId: 'project-1',
        selectedTaskIds: ['task-1'],
        pausedDuration: 0,
        isPaused: false
      };

      const { firebaseSessionApi } = require('@/lib/firebaseApi');
      (firebaseSessionApi.getActiveSession as jest.Mock).mockResolvedValue(activeSessionData);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      await waitFor(() => {
        expect(result.current.timerState.isRunning).toBe(true);
      });

      // Elapsed time should be approximately 11 minutes regardless of serialization method
      const elapsed = result.current.getElapsedTime();
      expect(elapsed).toBeGreaterThanOrEqual(659);
      expect(elapsed).toBeLessThanOrEqual(661);
    });

    it('should validate that pausedDuration is never negative', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      await act(async () => {
        await result.current.startTimer('project-1', ['task-1']);
      });

      // Immediately pause (very short duration)
      await act(async () => {
        await result.current.pauseTimer();
      });

      const elapsed = result.current.getElapsedTime();
      expect(elapsed).toBeGreaterThanOrEqual(0);
    });

    it('should format very long sessions correctly (edge case)', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      // Wait for timer context to initialize
      await waitFor(() => {
        expect(result.current).toBeTruthy();
      });

      // Test formatting for sessions longer than 24 hours
      expect(result.current.getFormattedTime(24 * 60 * 60)).toBe('24:00:00');
      expect(result.current.getFormattedTime(99 * 60 * 60 + 59 * 60 + 59)).toBe('99:59:59');
    });
  });

  describe('Auto-save Persistence', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-01T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should preserve original startTime during auto-saves', async () => {
      const { firebaseSessionApi } = require('@/lib/firebaseApi');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      await act(async () => {
        await result.current.startTimer('project-1', ['task-1']);
      });

      const originalStartTime = result.current.timerState.startTime;

      // Advance time to trigger multiple auto-saves (every 30 seconds)
      for (let i = 0; i < 5; i++) {
        act(() => {
          jest.advanceTimersByTime(30 * 1000);
        });

        await waitFor(() => {
          expect(firebaseSessionApi.saveActiveSession).toHaveBeenLastCalledWith(
            expect.objectContaining({
              startTime: originalStartTime, // Should always be the original start time
              pausedDuration: 0,
              isPaused: false
            })
          );
        });
      }

      // Verify startTime hasn't changed in state
      expect(result.current.timerState.startTime).toEqual(originalStartTime);
    });

    // TODO: Fix fake timer interactions with async state updates
    it.skip('should save adjusted startTime after resume', async () => {
      const { firebaseSessionApi } = require('@/lib/firebaseApi');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TimerProvider>{children}</TimerProvider>
      );

      const { result } = renderHook(() => useTimer(), { wrapper });

      await act(async () => {
        await result.current.startTimer('project-1', ['task-1']);
      });

      const originalStartTime = result.current.timerState.startTime;

      // Clear previous calls
      (firebaseSessionApi.saveActiveSession as jest.Mock).mockClear();

      // Run for 10 minutes
      act(() => {
        jest.advanceTimersByTime(10 * 60 * 1000);
      });

      // Pause
      await act(async () => {
        await result.current.pauseTimer();
      });

      const pausedDuration = result.current.timerState.pausedDuration;

      // Clear the pause call
      (firebaseSessionApi.saveActiveSession as jest.Mock).mockClear();

      // Resume
      await act(async () => {
        await result.current.resumeTimer();
      });

      const adjustedStartTime = result.current.timerState.startTime;

      // Adjusted start time should be (now - pausedDuration)
      expect(adjustedStartTime).not.toEqual(originalStartTime);

      // Verify Firebase save was called with adjusted start time
      // Should be the most recent call after clearing the pause call
      expect(firebaseSessionApi.saveActiveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: adjustedStartTime,
          pausedDuration: 0, // Reset to 0 after resume
          isPaused: false
        })
      );
    });
  });
});
