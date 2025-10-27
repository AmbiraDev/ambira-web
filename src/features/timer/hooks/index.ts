/**
 * Timer feature hooks barrel export
 *
 * Export all timer-related hooks from a single entry point
 */

export { useTimer } from './useTimer';
export type { UseTimerReturn } from './useTimer';

export { useTimerState } from './useTimerState';
export type { TimerState, UseTimerStateOptions } from './useTimerState';

// Re-export React Query hooks for advanced use cases
export {
  useActiveTimerQuery,
  useStartTimerMutation,
  usePauseTimerMutation,
  useResumeTimerMutation,
  useCancelTimerMutation,
  useFinishTimerMutation,
  useSaveActiveSession,
  useClearActiveSession,
  useCreateSession,
  // Backward compatibility aliases
  useActiveSession,
} from '@/hooks/useTimerQuery';
