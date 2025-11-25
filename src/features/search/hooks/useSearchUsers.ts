/**
 * Search Users Hook
 *
 * Optimized React Query hook for searching users with:
 * - Automatic caching and deduplication
 * - Stale-while-revalidate pattern
 * - Proper loading and error states
 */

import { useQuery } from '@tanstack/react-query'
import { firebaseUserApi } from '@/lib/api'
import { CACHE_TIMES } from '@/lib/queryClient'
import type { UserSearchResult } from '@/types'

interface UseSearchUsersOptions {
  searchTerm: string
  enabled?: boolean
  page?: number
  limit?: number
}

interface UseSearchUsersReturn {
  users: UserSearchResult[]
  totalCount: number
  hasMore: boolean
  isLoading: boolean
  isError: boolean
  error: Error | null
}

export function useSearchUsers({
  searchTerm,
  enabled = true,
  page = 1,
  limit = 20,
}: UseSearchUsersOptions): UseSearchUsersReturn {
  const trimmedTerm = searchTerm.trim()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['search', 'users', trimmedTerm, page, limit],
    queryFn: async () => {
      if (!trimmedTerm) {
        return { users: [], totalCount: 0, hasMore: false }
      }
      // searchUsers only takes searchTerm and limit (not page)
      return firebaseUserApi.searchUsers(trimmedTerm, limit)
    },
    enabled: enabled && trimmedTerm.length > 0,
    staleTime: CACHE_TIMES.MEDIUM, // 5 minutes
    gcTime: CACHE_TIMES.LONG, // 15 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus for search results
  })

  return {
    users: data?.users ?? [],
    totalCount: data?.totalCount ?? 0,
    hasMore: data?.hasMore ?? false,
    isLoading,
    isError,
    error: error as Error | null,
  }
}
