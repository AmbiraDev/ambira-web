/**
 * Comment Query Hooks - React Query Boundary
 *
 * This is the ONLY place where React Query should be used for comments.
 * All components should use these hooks instead of direct React Query or firebaseApi calls.
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { CommentService } from '../services/CommentService'
import { CommentsResponse } from '@/types'
import { STANDARD_CACHE_TIMES } from '@/lib/react-query'

const commentService = new CommentService()

// ==================== CACHE KEYS ====================

export const COMMENT_KEYS = {
  all: () => ['comments'] as const,
  lists: () => [...COMMENT_KEYS.all(), 'list'] as const,
  list: (sessionId: string, limit?: number) => [...COMMENT_KEYS.lists(), sessionId, limit] as const,
  session: (sessionId: string) => [...COMMENT_KEYS.all(), 'session', sessionId] as const,
}

// ==================== QUERY HOOKS ====================

/**
 * Get all comments for a session
 *
 * @example
 * const { data, isLoading, error } = useSessionComments(sessionId);
 * const comments = data?.comments || [];
 */
export function useSessionComments(
  sessionId: string,
  limit: number = 20,
  options?: Partial<UseQueryOptions<CommentsResponse, Error>>
) {
  return useQuery<CommentsResponse, Error>({
    queryKey: COMMENT_KEYS.list(sessionId, limit),
    queryFn: () => commentService.getSessionComments(sessionId, limit),
    staleTime: STANDARD_CACHE_TIMES.SHORT, // 1 minute - comments change frequently
    enabled: !!sessionId,
    ...options,
  })
}
