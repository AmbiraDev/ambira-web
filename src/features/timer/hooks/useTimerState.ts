/**
 * Client-side timer state management
 *
 * Handles local timer state (running/paused, elapsed time, UI updates)
 * Separate from server state managed by React Query
 */

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Project } from '@/types';

// Minimal interface for active session data (matches what comes from getActiveSession)
export interface ActiveSessionData {
  startTime: Date;
  projectId: string;
  selectedTaskIds: string[];
  pausedDuration: number;
  isPaused: boolean;
  activityId?: string;
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  currentProject: Project | null;
  activeTimerId: string | null;
  isConnected: boolean;
  lastAutoSave: Date | null;
}

export interface UseTimerStateOptions {
  activeSession: ActiveSessionData | null;
  currentProject: Project | null;
  onAutoSave?: () => void;
}

/**
 * Hook for managing client-side timer state
 * Handles elapsed time calculation, running state, and auto-save timing
 */
export function useTimerState({
  activeSession,
  currentProject,
  onAutoSave,
}: UseTimerStateOptions) {
  const queryClient = useQueryClient();

  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    elapsedSeconds: 0,
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

  // Sync state with active session from server
  useEffect(() => {
    if (!activeSession) {
      // No active session, reset state
      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        isPaused: false,
        elapsedSeconds: 0,
        currentProject: null,
        activeTimerId: null,
      }));
      return;
    }

    // Calculate elapsed time from server data
    const now = new Date();
    let elapsed: number;

    // Timer is considered paused if pausedDuration > 0
    const isPaused = activeSession.pausedDuration > 0;

    if (isPaused) {
      // When paused, use the pausedDuration from server
      elapsed = activeSession.pausedDuration;
    } else {
      // When running, calculate from start time
      elapsed = Math.floor(
        (now.getTime() - activeSession.startTime.getTime()) / 1000
      );
    }

    setTimerState(prev => ({
      ...prev,
      isRunning: !isPaused,
      isPaused: isPaused,
      elapsedSeconds: Math.max(0, elapsed),
      currentProject: currentProject,
      activeTimerId:
        activeSession.activityId || activeSession.projectId || null,
    }));
  }, [activeSession, currentProject]);

  // Timer tick - update elapsed time every second when running
  useEffect(() => {
    if (!timerState.isRunning || !activeSession) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor(
        (now.getTime() - activeSession.startTime.getTime()) / 1000
      );

      setTimerState(prev => ({
        ...prev,
        elapsedSeconds: Math.max(0, elapsed),
      }));
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [timerState.isRunning, activeSession]);

  // Auto-save every 30 seconds when running
  useEffect(() => {
    if (!timerState.isRunning || !timerState.activeTimerId || !onAutoSave) {
      return;
    }

    const interval = setInterval(() => {
      onAutoSave();
      setTimerState(prev => ({ ...prev, lastAutoSave: new Date() }));
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.activeTimerId, onAutoSave]);

  // Listen for cross-tab session cancellation events
  useEffect(() => {
    /**
     * Handles cross-tab session cancellation events
     *
     * When a session is finished/cancelled in another tab, this listener:
     * 1. Stops the local timer to prevent auto-save from recreating the session
     * 2. Invalidates the cache to refetch fresh data
     * 3. Optimistically updates all active-session caches to null for instant UI feedback
     */
    const handleStorageChange = (e: StorageEvent) => {
      // Only process timer-event changes
      if (e.key !== 'timer-event') return;

      try {
        // CRITICAL FIX for cross-tab auto-save race condition:
        // 1. Immediately stop local timer to cancel the auto-save interval
        setTimerState(prev => ({
          ...prev,
          isRunning: false,
          isPaused: false,
          elapsedSeconds: 0,
          currentProject: null,
          activeTimerId: null,
        }));

        // 2. Invalidate React Query cache to force immediate refetch
        // This ensures activeSession becomes null BEFORE any pending auto-save fires
        queryClient.invalidateQueries({
          predicate: query => {
            // Invalidate all active session queries across all users
            // Safe because each user only has one active session
            return query.queryKey[0] === 'active-session';
          },
        });

        // 3. Set ALL active-session caches to null immediately for instant feedback
        // CRITICAL: Must use setQueriesData with predicate to match actual query keys
        // Query keys are ['active-session', userId, user], not just ['active-session']
        queryClient.setQueriesData(
          { predicate: query => query.queryKey[0] === 'active-session' },
          null
        );
      } catch (error) {
        // Don't crash the app if cache operations fail
        console.error(
          'Failed to handle cross-tab session cancellation:',
          error
        );
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [queryClient]); // Include queryClient in dependencies

  // Format time as HH:MM:SS
  const getFormattedTime = useCallback(
    (seconds?: number): string => {
      const timeToFormat =
        seconds !== undefined ? seconds : timerState.elapsedSeconds;
      const hours = Math.floor(timeToFormat / 3600);
      const minutes = Math.floor((timeToFormat % 3600) / 60);
      const secs = timeToFormat % 60;

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    [timerState.elapsedSeconds]
  );

  return {
    ...timerState,
    getFormattedTime,
  };
}
