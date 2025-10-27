/**
 * Unified timer hook combining server state (React Query) and client state
 *
 * This is the main timer hook that components should use.
 * It provides a unified interface matching the old TimerContext API.
 */

import { useCallback } from 'react';
import {
  useActiveTimerQuery,
  useStartTimerMutation,
  usePauseTimerMutation,
  useResumeTimerMutation,
  useCancelTimerMutation,
  useFinishTimerMutation,
  useSaveActiveSession,
} from '@/hooks/useTimerQuery';
import { useTimerState } from './useTimerState';
import { useActivities } from '@/hooks/useActivitiesQuery';
import { useAuth } from '@/hooks/useAuth';
import { Session, Project, TimerState as TimerStateType } from '@/types';
import { auth } from '@/lib/firebase';

export interface UseTimerReturn {
  // Server state
  activeTimer: any | null;
  isLoading: boolean;
  error: Error | null;

  // Client state
  timerState: TimerStateType;
  elapsedTime: number;
  isRunning: boolean;
  isPaused: boolean;

  // Mutations
  startTimer: (projectId: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  finishTimer: (
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
  ) => Promise<Session>;
  resetTimer: () => Promise<void>;

  // Utility functions
  loadActiveTimer: () => Promise<void>;
  getElapsedTime: () => number;
  getFormattedTime: (seconds?: number) => string;
}

/**
 * Main timer hook that combines server state from React Query with client-side state
 * Provides a unified interface matching the old TimerContext API for easier migration
 */
export function useTimer(): UseTimerReturn {
  const { user } = useAuth();

  // Server state - React Query
  const {
    data: activeSession,
    isLoading,
    error,
    refetch: refetchActiveSession,
  } = useActiveTimerQuery();

  // Get projects to find the current project
  const { data: projects = [] } = useActivities(user?.id);

  // Find current project from active session
  const currentProject =
    activeSession && projects.length > 0
      ? projects.find(p => p.id === activeSession.projectId) || null
      : null;

  // Mutations
  const startMutation = useStartTimerMutation();
  const pauseMutation = usePauseTimerMutation();
  const resumeMutation = useResumeTimerMutation();
  const cancelMutation = useCancelTimerMutation();
  const finishMutation = useFinishTimerMutation();
  const saveActiveSessionMutation = useSaveActiveSession();

  // Client state - local timer tick, elapsed time, etc.
  const clientState = useTimerState({
    activeSession: activeSession || null,
    currentProject: currentProject,
    onAutoSave: async () => {
      // Auto-save callback - persist current state
      if (auth.currentUser && activeSession && currentProject) {
        try {
          await saveActiveSessionMutation.mutateAsync({
            startTime: activeSession.startTime,
            projectId: currentProject.id,
            selectedTaskIds: [],
            pausedDuration: 0,
            isPaused: false,
          });
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    },
  });

  // Start timer
  const startTimer = useCallback(
    async (projectId: string): Promise<void> => {
      if (!user) {
        throw new Error('User must be authenticated to start timer');
      }

      await startMutation.mutateAsync({ projectId });
    },
    [user, startMutation]
  );

  // Pause timer
  const pauseTimer = useCallback(async (): Promise<void> => {
    if (!activeSession || !clientState.isRunning) return;

    await pauseMutation.mutateAsync({
      startTime: activeSession.startTime,
      projectId: activeSession.projectId,
      elapsedSeconds: clientState.elapsedSeconds,
    });
  }, [
    activeSession,
    clientState.isRunning,
    clientState.elapsedSeconds,
    pauseMutation,
  ]);

  // Resume timer
  const resumeTimer = useCallback(async (): Promise<void> => {
    if (!activeSession || clientState.isRunning) return;

    await resumeMutation.mutateAsync({
      pausedDuration: clientState.elapsedSeconds,
      projectId: activeSession.projectId,
    });
  }, [
    activeSession,
    clientState.isRunning,
    clientState.elapsedSeconds,
    resumeMutation,
  ]);

  // Finish timer
  const finishTimer = useCallback(
    async (
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
      if (!activeSession || !currentProject) {
        throw new Error('No active timer to finish');
      }

      const finalDuration =
        options?.customDuration ?? clientState.elapsedSeconds;

      const session = await finishMutation.mutateAsync({
        title,
        description,
        tags,
        howFelt,
        privateNotes,
        options: {
          ...options,
          customDuration: finalDuration,
          activityId: currentProject.id,
          projectId: currentProject.id,
          startTime: activeSession.startTime,
        },
      });

      return session;
    },
    [activeSession, currentProject, clientState.elapsedSeconds, finishMutation]
  );

  // Reset timer (cancel without saving)
  const resetTimer = useCallback(async (): Promise<void> => {
    if (!clientState.activeTimerId) return;

    await cancelMutation.mutateAsync();
  }, [clientState.activeTimerId, cancelMutation]);

  // Load active timer (refetch from server)
  const loadActiveTimer = useCallback(async (): Promise<void> => {
    await refetchActiveSession();
  }, [refetchActiveSession]);

  // Get elapsed time in seconds
  const getElapsedTime = useCallback((): number => {
    return clientState.elapsedSeconds;
  }, [clientState.elapsedSeconds]);

  // Get formatted time (HH:MM:SS)
  const getFormattedTime = useCallback(
    (seconds?: number): string => {
      return clientState.getFormattedTime(seconds);
    },
    [clientState]
  );

  // Construct timerState object matching old TimerContext interface
  const timerState: TimerStateType = {
    isRunning: clientState.isRunning,
    isPaused: clientState.isPaused,
    startTime: activeSession?.startTime || null,
    pausedDuration: clientState.elapsedSeconds,
    currentProject: currentProject,
    activeTimerId: clientState.activeTimerId,
    isConnected: clientState.isConnected,
    lastAutoSave: clientState.lastAutoSave,
  };

  return {
    // Server state
    activeTimer: activeSession,
    isLoading,
    error: error as Error | null,

    // Client state
    timerState,
    elapsedTime: clientState.elapsedSeconds,
    isRunning: clientState.isRunning,
    isPaused: clientState.isPaused,

    // Mutations
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    resetTimer,

    // Utility functions
    loadActiveTimer,
    getElapsedTime,
    getFormattedTime,
  };
}
