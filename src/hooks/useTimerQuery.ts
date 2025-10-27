/**
 * React Query hooks for timer-related data fetching
 *
 * This module provides React Query hooks for server-state related to timers.
 * This is the ONLY place where React Query is used for timer functionality.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { firebaseSessionApi, firebaseProjectApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Session, CreateSessionData, Project } from '@/types';
import { CACHE_KEYS, CACHE_TIMES } from '@/lib/queryClient';

/**
 * Hook to fetch the active session from Firebase
 * Returns the persisted active session if one exists
 */
export function useActiveTimerQuery() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
    queryFn: async () => {
      if (!user) return null;

      const activeSession = await firebaseSessionApi.getActiveSession();
      if (!activeSession) return null;

      // Validate session age (max 24 hours)
      const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000;
      const now = new Date();
      const sessionAge = now.getTime() - activeSession.startTime.getTime();

      if (sessionAge > MAX_SESSION_AGE_MS || sessionAge < 0) {
        // Clear stale or invalid session
        await firebaseSessionApi.clearActiveSession();
        return null;
      }

      return activeSession;
    },
    enabled: isAuthenticated && !!user,
    staleTime: CACHE_TIMES.REAL_TIME, // 30 seconds - frequently check for updates
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchInterval: 10000, // Check every 10 seconds if session still exists
  });
}

// Backward compatibility alias
export const useActiveSession = useActiveTimerQuery;

/**
 * Hook to start a new timer
 * Creates an active session in Firebase and updates cache
 */
export function useStartTimerMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId }: { projectId: string }) => {
      if (!user) {
        throw new Error('User must be authenticated to start timer');
      }

      const now = new Date();

      // Save active session to Firebase
      await firebaseSessionApi.saveActiveSession({
        startTime: now,
        projectId: projectId,
        selectedTaskIds: [],
        pausedDuration: 0,
        isPaused: false,
      });

      return { projectId, startTime: now };
    },
    onSuccess: (data) => {
      // Update the active session cache immediately with optimistic data
      queryClient.setQueryData(
        CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
        {
          startTime: data.startTime,
          projectId: data.projectId,
          selectedTaskIds: [],
          pausedDuration: 0,
          isPaused: false,
        }
      );
    },
  });
}

/**
 * Hook to pause the active timer
 * Saves paused state with elapsed time to Firebase
 */
export function usePauseTimerMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      startTime,
      projectId,
      elapsedSeconds
    }: {
      startTime: Date;
      projectId: string;
      elapsedSeconds: number;
    }) => {
      await firebaseSessionApi.saveActiveSession({
        startTime,
        projectId,
        selectedTaskIds: [],
        pausedDuration: elapsedSeconds,
        isPaused: true,
      });

      return { startTime, projectId, elapsedSeconds };
    },
    onSuccess: (data) => {
      // Update cache with paused state
      queryClient.setQueryData(
        CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
        {
          startTime: data.startTime,
          projectId: data.projectId,
          selectedTaskIds: [],
          pausedDuration: data.elapsedSeconds,
          isPaused: true,
        }
      );
    },
  });
}

/**
 * Hook to resume a paused timer
 * Calculates adjusted start time and saves to Firebase
 */
export function useResumeTimerMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pausedDuration,
      projectId
    }: {
      pausedDuration: number;
      projectId: string;
    }) => {
      // Calculate the new start time to account for paused duration
      const now = new Date();
      const adjustedStartTime = new Date(now.getTime() - pausedDuration * 1000);

      await firebaseSessionApi.saveActiveSession({
        startTime: adjustedStartTime,
        projectId,
        selectedTaskIds: [],
        pausedDuration: 0,
        isPaused: false,
      });

      return { adjustedStartTime, projectId };
    },
    onSuccess: (data) => {
      // Update cache with resumed state
      queryClient.setQueryData(
        CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
        {
          startTime: data.adjustedStartTime,
          projectId: data.projectId,
          selectedTaskIds: [],
          pausedDuration: 0,
          isPaused: false,
        }
      );
    },
  });
}

/**
 * Hook to save the active session to Firebase
 * Used for auto-save functionality
 */
export function useSaveActiveSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionData: {
      startTime: Date;
      projectId: string;
      selectedTaskIds: string[];
      pausedDuration: number;
      isPaused: boolean;
    }) => {
      return firebaseSessionApi.saveActiveSession(sessionData);
    },
    onSuccess: (data, variables) => {
      // Update the active session cache immediately
      queryClient.setQueryData(
        CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
        {
          startTime: variables.startTime,
          projectId: variables.projectId,
          selectedTaskIds: variables.selectedTaskIds,
          pausedDuration: variables.pausedDuration,
          isPaused: variables.isPaused,
        }
      );
    },
  });
}

/**
 * Hook to cancel/reset the active timer
 * Clears the active session from Firebase without creating a session
 */
export function useCancelTimerMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return firebaseSessionApi.clearActiveSession();
    },
    onMutate: async () => {
      // Optimistically clear the active session
      await queryClient.cancelQueries({
        queryKey: CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
      });

      const previousActiveSession = queryClient.getQueryData(
        CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none')
      );

      queryClient.setQueryData(
        CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
        null
      );

      return { previousActiveSession };
    },
    onError: (err, variables, context) => {
      // Restore previous active session on error
      if (context?.previousActiveSession) {
        queryClient.setQueryData(
          CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
          context.previousActiveSession
        );
      }
    },
    onSuccess: () => {
      // Clear the active session cache
      queryClient.setQueryData(
        CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
        null
      );
    },
  });
}

/**
 * Hook to clear the active session from Firebase
 * Used when canceling or completing a session
 * @deprecated Use useCancelTimerMutation instead
 */
export function useClearActiveSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return firebaseSessionApi.clearActiveSession();
    },
    onSuccess: () => {
      // Clear the active session cache
      queryClient.setQueryData(
        CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
        null
      );
    },
  });
}

/**
 * Hook to finish the timer and create a session
 * Clears active session and creates a completed session record
 */
export function useFinishTimerMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      tags,
      howFelt,
      privateNotes,
      options,
    }: {
      title: string;
      description?: string;
      tags?: string[];
      howFelt?: number;
      privateNotes?: string;
      options?: {
        visibility?: 'everyone' | 'followers' | 'private';
        showStartTime?: boolean;
        publishToFeeds?: boolean;
        customDuration?: number;
        images?: string[];
        activityId: string;
        projectId: string;
        startTime: Date;
      };
    }) => {
      if (!options) {
        throw new Error('Options with activityId, projectId, and startTime are required');
      }

      const sessionData: CreateSessionData = {
        activityId: options.activityId,
        projectId: options.projectId,
        title,
        description,
        duration: options.customDuration || 0,
        startTime: options.startTime,
        tags,
        visibility: options.visibility,
        showStartTime: options.showStartTime,
        publishToFeeds: options.publishToFeeds,
        howFelt,
        privateNotes,
        images: options.images,
      };

      let session: Session;

      if (options.visibility && options.visibility !== 'private') {
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

      return session;
    },
    onMutate: async () => {
      // Optimistically clear the active session
      await queryClient.cancelQueries({
        queryKey: CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
      });

      const previousActiveSession = queryClient.getQueryData(
        CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none')
      );

      queryClient.setQueryData(
        CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
        null
      );

      return { previousActiveSession };
    },
    onSuccess: async (session) => {
      // Clear active session from Firebase
      await firebaseSessionApi.clearActiveSession();

      // Ensure cache is cleared
      queryClient.setQueryData(
        CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
        null
      );

      // Invalidate sessions cache to show the new session
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.SESSIONS(user?.id || 'none'),
      });

      // Invalidate user stats since a new session was added
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.USER_STATS(user?.id || 'none'),
      });

      // Invalidate activity stats for the project
      if (session.activityId) {
        queryClient.invalidateQueries({
          queryKey: CACHE_KEYS.ACTIVITY_STATS(session.activityId),
        });
      }
    },
    onError: (err, variables, context) => {
      // Restore previous active session on error
      if (context?.previousActiveSession) {
        queryClient.setQueryData(
          CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
          context.previousActiveSession
        );
      }
    },
  });
}

/**
 * Hook to create a session (finish timer)
 * Handles both private sessions and sessions with posts
 * @deprecated Use useFinishTimerMutation instead
 */
export function useCreateSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const clearActiveSession = useClearActiveSession();

  return useMutation({
    mutationFn: async ({
      sessionData,
      visibility,
    }: {
      sessionData: CreateSessionData;
      visibility?: 'everyone' | 'followers' | 'private';
    }) => {
      let session: Session;

      if (visibility && visibility !== 'private') {
        // Create session with post for non-private sessions
        const result = await firebaseSessionApi.createSessionWithPost(
          sessionData,
          sessionData.description || `Completed ${sessionData.title}`,
          visibility
        );
        session = result.session;
      } else {
        // Create private session only
        session = await firebaseSessionApi.createSession(sessionData);
      }

      return session;
    },
    onMutate: async () => {
      // Optimistically clear the active session
      await queryClient.cancelQueries({
        queryKey: CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
      });

      const previousActiveSession = queryClient.getQueryData(
        CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none')
      );

      queryClient.setQueryData(
        CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
        null
      );

      return { previousActiveSession };
    },
    onSuccess: async (session) => {
      // Clear active session from Firebase
      await clearActiveSession.mutateAsync();

      // Invalidate sessions cache to show the new session
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.SESSIONS(user?.id || 'none'),
      });

      // Invalidate user stats since a new session was added
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.USER_STATS(user?.id || 'none'),
      });

      // Invalidate activity stats for the project
      if (session.activityId) {
        queryClient.invalidateQueries({
          queryKey: CACHE_KEYS.ACTIVITY_STATS(session.activityId),
        });
      }
    },
    onError: (err, variables, context) => {
      // Restore previous active session on error
      if (context?.previousActiveSession) {
        queryClient.setQueryData(
          CACHE_KEYS.ACTIVE_SESSION(user?.id || 'none'),
          context.previousActiveSession
        );
      }
    },
  });
}

/**
 * Backward compatibility: Export aliases matching old context API
 */
export {
  useActiveSession as useTimerActiveSession,
  useSaveActiveSession as useTimerSave,
  useClearActiveSession as useTimerClear,
  useCreateSession as useTimerFinish,
};
