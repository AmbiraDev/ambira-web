/**
 * User Groups Hook
 *
 * Optimized React Query hook for fetching user's joined groups with:
 * - Automatic caching
 * - Proper loading and error states
 * - Cache invalidation on group join/leave
 */

import { useQuery } from '@tanstack/react-query'
import { firebaseApi } from '@/lib/api'
import { CACHE_KEYS, CACHE_TIMES } from '@/lib/queryClient'
import type { Group } from '@/types'

interface UseUserGroupsOptions {
  userId?: string
  enabled?: boolean
  limit?: number
}

interface UseUserGroupsReturn {
  groups: Group[]
  isLoading: boolean
  isError: boolean
  error: Error | null
}

export function useUserGroups({
  userId,
  enabled = true,
  limit,
}: UseUserGroupsOptions): UseUserGroupsReturn {
  const { data, isLoading, isError, error } = useQuery({
    // CACHE_KEYS.USER_GROUPS(userId) already includes userId in the key
    queryKey: [
      ...(userId ? CACHE_KEYS.USER_GROUPS(userId) : ['user-groups', 'null']),
      userId,
      limit,
    ],
    queryFn: () => {
      if (!userId) {
        return []
      }
      return firebaseApi.group.getUserGroups(userId, limit)
    },
    enabled: enabled && !!userId,
    staleTime: CACHE_TIMES.MEDIUM, // 5 minutes
    gcTime: CACHE_TIMES.LONG, // 15 minutes
    refetchOnWindowFocus: false,
  })

  return {
    groups: data ?? [],
    isLoading,
    isError,
    error: error as Error | null,
  }
}
