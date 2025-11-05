/**
 * Unified timer hook combining server state (React Query) and client state
 *
 * This is the main timer hook that components should use.
 * It provides a unified interface matching the old TimerContext API.
 */

import { useCallback } from 'react';
import * as React from 'react';
import {
  useActiveTimerQuery,
  useStartTimerMutation,
  usePauseTimerMutation,
  useResumeTimerMutation,
  useCancelTimerMutation,
  useFinishTimerMutation,
  useSaveActiveSession,
} from '@/hooks/useTimerQuery';
import { useAdjustStartTime } from './useTimerMutations';
import { useTimerState, ActiveSessionData } from './useTimerState';
import { useAllActivityTypes } from '@/hooks/useActivityTypes';
import { useAuth } from '@/hooks/useAuth';
import { Session, TimerState as TimerStateType } from '@/types';
import { auth } from '@/lib/firebase';

export interface UseTimerReturn {
  // Server state
  activeTimer: ActiveSessionData | null;
  isLoading: boolean;
  error: Error | null;

  // Client state
  timerState: TimerStateType;
  elapsedTime: number;
  isRunning: boolean;
  isPaused: boolean;

  // Mutations
  startTimer: (projectId: string, customStartTime?: Date) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  adjustStartTime: (newStartTime: Date) => Promise<void>;
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
      activityId?: string;
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
export function useTimer(options?: { pausePolling?: boolean }): UseTimerReturn {
  const { user } = useAuth();
  const pausePolling = options?.pausePolling ?? false;

  // Server state - React Query
  // Disable polling when pausePolling is true (e.g., when on finish modal)
  const {
    data: activeSession,
    isLoading,
    error,
    refetch: refetchActiveSession,
  } = useActiveTimerQuery({ enabled: !pausePolling });

  // Get all activity types (includes both defaults and custom activities)
  const { data: activityTypes = [] } = useAllActivityTypes(user?.id || '', {
    enabled: !!user?.id,
  });

  // Convert ActivityType to Activity for compatibility with timer state
  // Find current project from active session
  const currentProject = React.useMemo(() => {
    if (!activeSession || !activityTypes.length) {
      return null;
    }

    const activityType = activityTypes.find(
      at =>
        at.id === activeSession.projectId || at.id === activeSession.activityId
    );

    if (!activityType) {
      return null;
    }

    // Convert ActivityType to Activity shape
    return {
      id: activityType.id,
      name: activityType.name,
      description: activityType.description || '',
      icon: activityType.icon,
      color: activityType.defaultColor,
      userId: activityType.userId || '',
      status: 'active' as const,
      createdAt: activityType.createdAt,
      updatedAt: activityType.updatedAt,
    };
  }, [activeSession, activityTypes]);

  // Mutations
  const startMutation = useStartTimerMutation();
  const pauseMutation = usePauseTimerMutation();
  const resumeMutation = useResumeTimerMutation();
  const cancelMutation = useCancelTimerMutation();
  const finishMutation = useFinishTimerMutation();
  const saveActiveSessionMutation = useSaveActiveSession();
  const adjustStartTimeMutation = useAdjustStartTime();

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
        } catch (_err) {
          // Auto-save failed silently
        }
      }
    },
  });

  // Start timer
  const startTimer = useCallback(
    async (projectId: string, customStartTime?: Date): Promise<void> => {
      if (!user) {
        throw new Error('User must be authenticated to start timer');
      }

      await startMutation.mutateAsync({
        projectId,
        customStartTime,
      });
    },
    [user, startMutation]
  );

  // Adjust start time
  const adjustStartTime = useCallback(
    async (newStartTime: Date): Promise<void> => {
      if (!user) {
        throw new Error('User must be authenticated to adjust start time');
      }

      await adjustStartTimeMutation.mutateAsync({
        userId: user.id,
        newStartTime,
      });
    },
    [user, adjustStartTimeMutation]
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
        activityId?: string; // Allow overriding the activity
      }
    ): Promise<Session> => {
      if (!activeSession) {
        throw new Error('No active timer to finish');
      }

      // Use the activity from options if provided, otherwise fall back to currentProject
      const activityId = options?.activityId || currentProject?.id;

      if (!activityId) {
        throw new Error('No activity selected for this session');
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
          activityId: activityId,
          projectId: activityId,
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
    activeTimer: activeSession ?? null,
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
    adjustStartTime,
    finishTimer,
    resetTimer,

    // Utility functions
    loadActiveTimer,
    getElapsedTime,
    getFormattedTime,
  };
}
