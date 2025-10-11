import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { TimerProvider, useTimer } from '../TimerContext';
import { firebaseSessionApi } from '@/lib/firebaseApi';
import { useAuth } from '../AuthContext';
import { useProjects } from '../ProjectsContext';
import { useTasks } from '../TasksContext';

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
jest.mock('../TasksContext');
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
    (useTasks as jest.Mock).mockReturnValue({ tasks: [mockTask] });

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
      expect(result.current.timerState.selectedTasks).toEqual([]);
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
      expect(result.current.timerState.selectedTasks).toEqual([]);
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
});
