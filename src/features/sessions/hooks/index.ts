/**
 * Session Hooks - Public API
 *
 * All session-related hooks exported from here.
 *
 * @example
 * import { useSession, useUserSessions, useDeleteSession, useSupportSession } from '@/features/sessions/hooks';
 */

// Query hooks
export {
  useSession,
  useSessionWithDetails,
  useUserSessions,
  SESSION_KEYS,
} from './useSessions';

// Mutation hooks
export {
  useDeleteSession,
  useSupportSession,
  useUpdateSession,
  useInvalidateSession,
  useInvalidateAllSessions,
} from './useSessionMutations';

// Re-export types
export type { SupportSessionData } from '../services/SessionService';
