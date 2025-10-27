/**
 * Following List Hook
 *
 * ULTRA-OPTIMIZED React Query hook for fetching ONLY following IDs.
 *
 * Key optimizations:
 * - Fetches only IDs, not full user objects (10x faster)
 * - Returns Set for O(1) lookup (instant .has() checks)
 * - Aggressive caching (30 min stale time)
 * - No refetching on mount/focus
 */

import { useQuery } from '@tanstack/react-query';
import { getFollowingIds } from '@/lib/api/users/getFollowingIds';
import { CACHE_TIMES } from '@/lib/queryClient';

interface UseFollowingListOptions {
  userId?: string;
  enabled?: boolean;
}

interface UseFollowingListReturn {
  followingIds: Set<string>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useFollowingList({
  userId,
  enabled = true,
}: UseFollowingListOptions): UseFollowingListReturn {
  const queryKey = ['following-ids', userId] as const;

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) {
        return new Set<string>();
      }
      return await getFollowingIds(userId);
    },
    enabled: enabled && !!userId,
    staleTime: CACHE_TIMES.VERY_LONG, // 30 minutes - following changes infrequently
    gcTime: 60 * 60 * 1000, // 1 hour - keep in memory longer
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Critical: don't refetch if we have data
    refetchOnReconnect: false,
  });

  return {
    followingIds: data ?? new Set<string>(),
    isLoading,
    isError,
    error: error as Error | null,
  };
}
