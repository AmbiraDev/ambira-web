/**
 * Suggested Groups Hook
 *
 * Optimized React Query hook for fetching suggested groups with:
 * - Automatic caching to prevent repeated loads
 * - Filters out already-joined groups
 * - Proper loading and error states
 */

import { useQuery } from '@tanstack/react-query'
import {
  collection,
  query as firestoreQuery,
  orderBy,
  limit as limitFn,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CACHE_KEYS, CACHE_TIMES } from '@/lib/queryClient'
import { useUserGroups } from './useUserGroups'

interface SuggestedGroup {
  id: string
  name: string
  description: string
  imageUrl?: string
  location?: string
  category?: string
  memberCount: number
  members: number
  image?: string
}

interface UseSuggestedGroupsOptions {
  userId?: string
  enabled?: boolean
  limit?: number
}

interface UseSuggestedGroupsReturn {
  suggestedGroups: SuggestedGroup[]
  isLoading: boolean
  isError: boolean
  error: Error | null
}

export function useSuggestedGroups({
  userId,
  enabled = true,
  limit = 20,
}: UseSuggestedGroupsOptions): UseSuggestedGroupsReturn {
  // Fetch user's joined groups first
  const { groups: userGroups, isLoading: isLoadingUserGroups } = useUserGroups({
    userId,
    enabled: enabled && !!userId,
  })

  const joinedGroupIds = new Set(userGroups.map((g) => g.id))
  const queryKey = [...CACHE_KEYS.SUGGESTED_GROUPS(), userId, limit, joinedGroupIds.size] as const

  const {
    data,
    isLoading: isLoadingSuggested,
    isError,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // Fetch all groups ordered by popularity
      const allGroupsSnapshot = await getDocs(
        firestoreQuery(collection(db, 'groups'), orderBy('memberCount', 'desc'), limitFn(limit))
      )

      const allGroups: SuggestedGroup[] = allGroupsSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          location: data.location,
          category: data.category,
          memberCount: data.memberCount,
          members: data.memberCount,
          image: data.imageUrl || '📁',
        }
      })

      // Filter out groups user is already in
      return allGroups.filter((group) => !joinedGroupIds.has(group.id))
    },
    enabled: enabled && !isLoadingUserGroups,
    staleTime: CACHE_TIMES.LONG, // 15 minutes
    gcTime: CACHE_TIMES.VERY_LONG, // 1 hour
    refetchOnWindowFocus: false,
  })

  return {
    suggestedGroups: data ?? [],
    isLoading: isLoadingUserGroups || isLoadingSuggested,
    isError,
    error: error as Error | null,
  }
}
