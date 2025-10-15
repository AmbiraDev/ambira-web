'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import {
  TimerContextType,
  TimerState,
  ActiveTimer,
  Project,
  Session,
  CreateSessionData,
} from '@/types';
import { timerApi, projectApi, authApi } from '@/lib/api';
import { firebaseProjectApi, firebaseSessionApi } from '@/lib/firebaseApi';
import { auth } from '@/lib/firebase';
import { useAuth } from './AuthContext';

// Create context
const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Custom hook to use timer context
export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

// Timer provider component
interface TimerProviderProps {
  children: ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const { user } = useAuth();

  // Helper function to get auth token
  const getAuthToken = async (): Promise<string> => {
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Get Firebase auth token
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      throw new Error('No Firebase user found');
    }

    try {
      const token = await firebaseUser.getIdToken();
      return token;
    } catch (error) {
      throw new Error('Failed to get Firebase auth token');
    }
  };

  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    pausedDuration: 0,
    currentProject: null,
    activeTimerId: null,
    isConnected: true,
    lastAutoSave: null,
  });

  // Network connectivity monitoring
  useEffect(() => {
    const updateOnlineStatus = () => {
      setTimerState(prev => ({ ...prev, isConnected: navigator.onLine }));
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Load active timer on mount
  useEffect(() => {
    if (user) {
      loadActiveTimer();
    }
  }, [user]);

  // Also react to raw Firebase auth state changes (covers cross-origin reloads)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(firebaseUser => {
      if (firebaseUser) {
        loadActiveTimer();
      } else {
        // On logout, stop timers and avoid any persistence
        setTimerState({
          isRunning: false,
          startTime: null,
          pausedDuration: 0,
          currentProject: null,
          activeTimerId: null,
          isConnected: true,
          lastAutoSave: null,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto-save timer state every 30 seconds
  useEffect(() => {
    if (!timerState.isRunning || !timerState.activeTimerId) return;

    const interval = setInterval(async () => {
      try {
        // Only persist if authenticated; guard against logout races
        if (auth.currentUser && timerState.currentProject) {
          // Persist the current running state
          await firebaseSessionApi.saveActiveSession({
            startTime: timerState.startTime || new Date(),
            projectId: timerState.currentProject.id,
            selectedTaskIds: [],
            pausedDuration: 0,
            isPaused: false,
          });
        }
        setTimerState(prev => ({ ...prev, lastAutoSave: new Date() }));
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [
    timerState.isRunning,
    timerState.activeTimerId,
    timerState.pausedDuration,
  ]);

  // Refresh active timer when window regains focus (handles switching origins/ports)
  useEffect(() => {
    const handleFocus = () => {
      // If we don't have a running timer locally, try to pull from server
      if (!timerState.isRunning && !timerState.activeTimerId) {
        loadActiveTimer();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [timerState.isRunning, timerState.activeTimerId]);

  // Listen for cross-tab session cancellation events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only process timer-event changes
      if (e.key !== 'timer-event') return;

      try {
        // The value will be null because we immediately remove it after setting
        // So we need to check if this event just happened (within last 1 second)
        const now = Date.now();

        // Check if we have an active timer that needs to be cancelled
        if (timerState.activeTimerId) {

          // Reset local timer state immediately
          setTimerState({
            isRunning: false,
            startTime: null,
            pausedDuration: 0,
            currentProject: null,
            activeTimerId: null,
            isConnected: true,
            lastAutoSave: null,
          });
        }
      } catch (error) {
        console.warn('Failed to process cross-tab event:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [timerState.activeTimerId]);

  // Periodically check if session is still active (in case another tab cancelled it)
  useEffect(() => {
    if (!timerState.isRunning || !timerState.activeTimerId) return;

    const checkInterval = setInterval(async () => {
      try {
        // Check if the active session is still marked as active
        const activeSession = await firebaseSessionApi.getActiveSession();

        // If no active session found (it was cancelled or completed), reset local state
        if (!activeSession) {
          setTimerState({
            isRunning: false,
            startTime: null,
            pausedDuration: 0,
            currentProject: null,
            activeTimerId: null,
            isConnected: true,
            lastAutoSave: null,
          });
        }
      } catch (error) {
        console.warn('Failed to check session status:', error);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [timerState.isRunning, timerState.activeTimerId]);

  // Calculate elapsed time in seconds
  const getElapsedTime = useCallback((): number => {
    if (!timerState.startTime) return 0;

    // When paused, the pausedDuration represents total elapsed so far
    if (!timerState.isRunning) {
      const pausedDuration = timerState.pausedDuration || 0;
      // Ensure pausedDuration is never negative
      return Math.max(0, pausedDuration);
    }

    // When running, calculate elapsed time from start
    const now = new Date();
    const elapsed = Math.floor(
      (now.getTime() - timerState.startTime.getTime()) / 1000
    );

    // Defensive check: if elapsed is negative or unreasonably large, log a warning
    if (elapsed < 0) {
      console.warn('Timer calculation error: negative elapsed time', {
        now: now.toISOString(),
        startTime: timerState.startTime.toISOString(),
        elapsed,
      });
      return 0;
    }

    // Warn if session exceeds 24 hours (unusual but not invalid)
    const TWENTY_FOUR_HOURS = 24 * 60 * 60;
    if (elapsed > TWENTY_FOUR_HOURS) {
      console.warn('Timer session exceeds 24 hours', {
        elapsedHours: Math.floor(elapsed / 3600),
        startTime: timerState.startTime.toISOString(),
      });
    }

    return Math.max(0, elapsed);
  }, [timerState.startTime, timerState.pausedDuration, timerState.isRunning]);

  // Format time as HH:MM:SS
  const getFormattedTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Load active timer from server
  const loadActiveTimer = async (): Promise<void> => {
    try {
      if (!user) return;

      const activeSession = await firebaseSessionApi.getActiveSession();
      if (!activeSession) return;

      // Validate that the session start time is reasonable
      // If a session started more than 24 hours ago, it's likely stale data
      const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
      const now = new Date();
      const sessionAge = now.getTime() - activeSession.startTime.getTime();

      if (sessionAge > MAX_SESSION_AGE_MS) {
        console.warn(
          `Active session is too old (${Math.floor(sessionAge / (60 * 60 * 1000))} hours). ` +
            `Clearing stale session data.`
        );
        await firebaseSessionApi.clearActiveSession();
        return;
      }

      // Additional validation: if sessionAge is negative, the startTime is in the future (clock issue)
      if (sessionAge < 0) {
        console.warn(
          `Active session has start time in the future (clock drift?). Clearing invalid session.`
        );
        await firebaseSessionApi.clearActiveSession();
        return;
      }

      // Get project and task details
      const projects = await firebaseProjectApi.getProjects();
      let project = projects.find(p => p.id === activeSession.projectId);

      if (!project) {
        console.warn('Project not found for active session');

        // If user has no projects, clear the active session
        if (projects.length === 0) {
          await firebaseSessionApi.clearActiveSession();
          return;
        }

        // Otherwise, assign to the first project
        project = projects[0];

        // Update the active session with the new project
        await firebaseSessionApi.saveActiveSession({
          startTime: activeSession.startTime,
          projectId: project.id,
          selectedTaskIds: [],
          pausedDuration: activeSession.pausedDuration,
          isPaused: activeSession.isPaused,
        });
      }

      // Set timer state
      setTimerState({
        isRunning: !activeSession.isPaused,
        startTime: activeSession.startTime,
        pausedDuration: activeSession.pausedDuration,
        currentProject: project,
        activeTimerId: `active_${Date.now()}`,
        isConnected: true,
        lastAutoSave: null,
      });

      // Timer successfully loaded
    } catch (error) {
      console.error('Failed to load active timer:', error);
    }
  };

  // Start timer
  const startTimer = async (
    projectId: string
  ): Promise<void> => {
    try {
      if (!user) {
        throw new Error('User must be authenticated to start timer');
      }

      const now = new Date();

      // Get project details
      const projects = await firebaseProjectApi.getProjects();
      const project = projects.find(p => p.id === projectId);

      if (!project) {
        throw new Error('Project not found');
      }

      // Save active session to Firebase (use actual project.id)
      await firebaseSessionApi.saveActiveSession({
        startTime: now,
        projectId: project.id,
        selectedTaskIds: [],
        pausedDuration: 0,
        isPaused: false,
      });

      const timerId = `timer_${Date.now()}_${user.id}`;

      setTimerState({
        isRunning: true,
        startTime: now,
        pausedDuration: 0,
        currentProject: project,
        activeTimerId: timerId,
        isConnected: true,
        lastAutoSave: now,
      });

    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    }
  };

  // Pause timer
  const pauseTimer = async (): Promise<void> => {
    if (!timerState.activeTimerId || !timerState.isRunning) return;

    try {
      const currentElapsed = getElapsedTime();

      // Save paused state to Firebase
      if (timerState.currentProject) {
        await firebaseSessionApi.saveActiveSession({
          startTime: timerState.startTime!,
          projectId: timerState.currentProject.id,
          selectedTaskIds: [],
          pausedDuration: currentElapsed,
          isPaused: true,
        });
      }

      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        pausedDuration: currentElapsed,
      }));

    } catch (error) {
      console.error('Failed to pause timer:', error);
      throw error;
    }
  };

  // Resume timer
  const resumeTimer = async (): Promise<void> => {
    if (!timerState.activeTimerId || timerState.isRunning) return;

    try {
      // Calculate the new start time to account for paused duration
      const now = new Date();
      const adjustedStartTime = new Date(
        now.getTime() - timerState.pausedDuration * 1000
      );

      // Save resumed state to Firebase
      if (timerState.currentProject) {
        await firebaseSessionApi.saveActiveSession({
          startTime: adjustedStartTime,
          projectId: timerState.currentProject.id,
          selectedTaskIds: [],
          pausedDuration: 0,
          isPaused: false,
        });
      }

      setTimerState(prev => ({
        ...prev,
        isRunning: true,
        startTime: adjustedStartTime,
        pausedDuration: 0,
      }));

    } catch (error) {
      console.error('Failed to resume timer:', error);
      throw error;
    }
  };

  // Finish timer
  const finishTimer = async (
    title: string,
    description?: string,
    tags?: string[],
    howFelt?: number,
    privateNotes?: string,
    options?: {
      visibility?: 'everyone' | 'followers' | 'private';
      showStartTime?: boolean;
      publishToFeeds?: boolean;
      customDuration?: number;
      images?: string[];
    }
  ): Promise<Session> => {
    if (!timerState.activeTimerId || !timerState.currentProject) {
      throw new Error('No active timer to finish');
    }

    try {
      const finalDuration = options?.customDuration ?? getElapsedTime();
      const sessionData: CreateSessionData = {
        activityId: timerState.currentProject.id,
        projectId: timerState.currentProject.id,
        title,
        description,
        duration: finalDuration,
        startTime: timerState.startTime!,
        tags,
        visibility: options?.visibility,
        showStartTime: options?.showStartTime,
        publishToFeeds: options?.publishToFeeds,
        howFelt,
        privateNotes,
        images: options?.images,
      };

      // Save session to Firebase and create post if visibility allows
      let session: Session;

      if (options?.visibility && options.visibility !== 'private') {
        // Create session with post for non-private sessions
        const result = await firebaseSessionApi.createSessionWithPost(
          sessionData,
          description || `Completed ${title}`,
          options.visibility
        );
        session = result.session;
      } else {
        // Create private session only
        session = await firebaseSessionApi.createSession(sessionData);
      }

      // NOTE: Active session is automatically cleared inside createSession/createSessionWithPost
      // This ensures the timer stops even if the user navigates away before this line executes
      // The clearActiveSession call is now redundant but kept as a safety net
      try {
        await firebaseSessionApi.clearActiveSession();
      } catch (error) {
        // Ignore errors since clearActiveSession is already called in createSession
      }

      // Reset timer state immediately
      setTimerState({
        isRunning: false,
        startTime: null,
        pausedDuration: 0,
        currentProject: null,
        activeTimerId: null,
        isConnected: true,
        lastAutoSave: null,
      });


      return session;
    } catch (error) {
      console.error('Failed to finish timer:', error);
      throw error;
    }
  };

  // Reset timer (cancel without saving)
  const resetTimer = async (): Promise<void> => {
    if (!timerState.activeTimerId) return;

    try {
      // Clear active session from Firebase first
      await firebaseSessionApi.clearActiveSession();

      // Only reset state after successful deletion
      setTimerState({
        isRunning: false,
        startTime: null,
        pausedDuration: 0,
        currentProject: null,
        activeTimerId: null,
        isConnected: true,
        lastAutoSave: null,
      });
    } catch (error) {
      console.error('Failed to cancel timer:', error);
      throw error; // Re-throw to allow UI to handle the error
    }
  };

  const value: TimerContextType = {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    resetTimer,
    loadActiveTimer,
    getElapsedTime,
    getFormattedTime,
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
};
