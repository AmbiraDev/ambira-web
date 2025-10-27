/**
 * Timer Mutation Hooks - React Query Boundary
 *
 * All write operations for timer (start, pause, resume, complete, cancel).
 */

import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
import {
  TimerService,
  StartTimerData,
  CompleteTimerData,
} from '../services/TimerService';
import { ActiveSession } from '@/domain/entities/ActiveSession';
import { Session } from '@/domain/entities/Session';

const timerService = new TimerService();

// Query keys for timer-related queries
export const TIMER_KEYS = {
  active: (userId: string) => ['timer', 'active', userId] as const,
};

/**
 * Start a new timer
 *
 * @example
 * const startMutation = useStartTimer();
 * startMutation.mutate({
 *   userId,
 *   projectId,
 *   activityId,
 *   title: 'Working on feature X'
 * });
 */
export function useStartTimer(
  options?: Partial<UseMutationOptions<ActiveSession, Error, StartTimerData>>
) {
  const queryClient = useQueryClient();

  return useMutation<ActiveSession, Error, StartTimerData>({
    mutationFn: data => timerService.startTimer(data),

    onSuccess: (activeSession, variables) => {
      // Update cache with new active session
      queryClient.setQueryData(
        TIMER_KEYS.active(variables.userId),
        activeSession
      );
    },

    ...options,
  });
}

/**
 * Pause the active timer
 *
 * @example
 * const pauseMutation = usePauseTimer();
 * pauseMutation.mutate(userId);
 */
export function usePauseTimer(
  options?: Partial<
    UseMutationOptions<
      ActiveSession,
      Error,
      string,
      { previousSession: ActiveSession | undefined }
    >
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    ActiveSession,
    Error,
    string,
    { previousSession: ActiveSession | undefined }
  >({
    mutationFn: userId => timerService.pauseTimer(userId),

    onMutate: async (
      userId
    ): Promise<{ previousSession: ActiveSession | undefined }> => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: TIMER_KEYS.active(userId) });

      // Snapshot
      const previousSession = queryClient.getQueryData<ActiveSession>(
        TIMER_KEYS.active(userId)
      );

      // Optimistically update
      queryClient.setQueryData(TIMER_KEYS.active(userId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status: 'paused',
        };
      });

      return { previousSession };
    },

    onError: (error, userId, context) => {
      // Rollback
      if (context?.previousSession) {
        queryClient.setQueryData(
          TIMER_KEYS.active(userId),
          context.previousSession
        );
      }
    },

    onSuccess: (pausedSession, userId) => {
      // Update with actual paused session
      queryClient.setQueryData(TIMER_KEYS.active(userId), pausedSession);
    },

    ...options,
  });
}

/**
 * Resume a paused timer
 *
 * @example
 * const resumeMutation = useResumeTimer();
 * resumeMutation.mutate(userId);
 */
export function useResumeTimer(
  options?: Partial<
    UseMutationOptions<
      ActiveSession,
      Error,
      string,
      { previousSession: ActiveSession | undefined }
    >
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    ActiveSession,
    Error,
    string,
    { previousSession: ActiveSession | undefined }
  >({
    mutationFn: userId => timerService.resumeTimer(userId),

    onMutate: async (
      userId
    ): Promise<{ previousSession: ActiveSession | undefined }> => {
      await queryClient.cancelQueries({ queryKey: TIMER_KEYS.active(userId) });

      const previousSession = queryClient.getQueryData<ActiveSession>(
        TIMER_KEYS.active(userId)
      );

      queryClient.setQueryData(TIMER_KEYS.active(userId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status: 'running',
        };
      });

      return { previousSession };
    },

    onError: (error, userId, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(
          TIMER_KEYS.active(userId),
          context.previousSession
        );
      }
    },

    onSuccess: (resumedSession, userId) => {
      queryClient.setQueryData(TIMER_KEYS.active(userId), resumedSession);
    },

    ...options,
  });
}

/**
 * Complete and save the timer session
 *
 * @example
 * const completeMutation = useCompleteTimer();
 * completeMutation.mutate({
 *   userId,
 *   data: {
 *     title: 'Final title',
 *     description: 'Work completed',
 *     visibility: 'everyone'
 *   }
 * });
 */
export function useCompleteTimer(
  options?: Partial<
    UseMutationOptions<
      Session,
      Error,
      { userId: string; data: CompleteTimerData }
    >
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    Session,
    Error,
    { userId: string; data: CompleteTimerData }
  >({
    mutationFn: ({ userId, data }) => timerService.completeTimer(userId, data),

    onSuccess: (session, { userId }) => {
      // Clear active session
      queryClient.setQueryData(TIMER_KEYS.active(userId), null);

      // Invalidate related data
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },

    ...options,
  });
}

/**
 * Cancel the active timer without saving
 *
 * @example
 * const cancelMutation = useCancelTimer();
 * cancelMutation.mutate(userId);
 */
export function useCancelTimer(
  options?: Partial<UseMutationOptions<void, Error, string>>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: userId => timerService.cancelTimer(userId),

    onSuccess: (_, userId) => {
      // Clear active session
      queryClient.setQueryData(TIMER_KEYS.active(userId), null);
    },

    ...options,
  });
}

/**
 * Helper hook to invalidate timer data
 *
 * @example
 * const invalidateTimer = useInvalidateTimer();
 * invalidateTimer(userId);
 */
export function useInvalidateTimer() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.invalidateQueries({ queryKey: TIMER_KEYS.active(userId) });
  };
}
