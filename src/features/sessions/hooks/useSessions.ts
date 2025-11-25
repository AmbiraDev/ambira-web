/**
 * Session Query Hooks - React Query Boundary
 *
 * This is the ONLY place where React Query should be used for sessions.
 * All components should use these hooks instead of direct React Query or firebaseApi calls.
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { SessionService } from '../services/SessionService'
import { Session, SessionWithDetails, SessionFilters } from '@/types'
import { STANDARD_CACHE_TIMES } from '@/lib/react-query'

const sessionService = new SessionService()

// ==================== CACHE KEYS ====================

export const SESSION_KEYS = {
  all: () => ['sessions'] as const,
  lists: () => [...SESSION_KEYS.all(), 'list'] as const,
  list: (filters?: SessionFilters) => [...SESSION_KEYS.lists(), { filters }] as const,
  details: () => [...SESSION_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...SESSION_KEYS.details(), id] as const,
  detailWithData: (id: string) => [...SESSION_KEYS.detail(id), 'with-details'] as const,
  userSessions: (userId: string, filters?: SessionFilters) =>
    [...SESSION_KEYS.all(), 'user', userId, filters] as const,
}

// ==================== QUERY HOOKS ====================

/**
 * Get session by ID
 *
 * @example
 * const { data: session, isLoading, error } = useSession(sessionId);
 */
export function useSession(
  sessionId: string,
  options?: Partial<UseQueryOptions<Session | null, Error>>
) {
  return useQuery<Session | null, Error>({
    queryKey: SESSION_KEYS.detail(sessionId),
    queryFn: () => sessionService.getSession(sessionId),
    staleTime: STANDARD_CACHE_TIMES.MEDIUM, // 5 minutes
    enabled: !!sessionId,
    ...options,
  })
}

/**
 * Get session with populated user and activity details
 *
 * @example
 * const { data: session, isLoading } = useSessionWithDetails(sessionId);
 */
export function useSessionWithDetails(
  sessionId: string,
  options?: Partial<UseQueryOptions<SessionWithDetails | null, Error>>
) {
  return useQuery<SessionWithDetails | null, Error>({
    queryKey: SESSION_KEYS.detailWithData(sessionId),
    queryFn: () => sessionService.getSessionWithDetails(sessionId),
    staleTime: STANDARD_CACHE_TIMES.MEDIUM,
    enabled: !!sessionId,
    ...options,
  })
}

/**
 * Get all sessions for a user
 *
 * @example
 * const { data: sessions, isLoading } = useUserSessions(userId);
 * const { data: sessions } = useUserSessions(userId, { activityId: 'abc123' });
 * const { data: sessions } = useUserSessions(userId, undefined, { enabled: true });
 */
export function useUserSessions(
  userId: string,
  filtersOrOptions?: SessionFilters | Partial<UseQueryOptions<Session[], Error>> | null,
  options?: Partial<UseQueryOptions<Session[], Error>>
) {
  // Handle overloaded parameters: if second param has 'enabled', it's options not filters
  let actualFilters: SessionFilters | undefined
  let actualOptions: Partial<UseQueryOptions<Session[], Error>> | undefined

  if (filtersOrOptions && 'enabled' in filtersOrOptions) {
    actualFilters = undefined
    actualOptions = filtersOrOptions as Partial<UseQueryOptions<Session[], Error>>
  } else {
    actualFilters = filtersOrOptions as SessionFilters | undefined
    actualOptions = options
  }

  return useQuery<Session[], Error>({
    queryKey: SESSION_KEYS.userSessions(userId, actualFilters),
    queryFn: () => sessionService.getUserSessions(userId, actualFilters),
    staleTime: STANDARD_CACHE_TIMES.MEDIUM,
    enabled: !!userId,
    ...actualOptions,
  })
}
