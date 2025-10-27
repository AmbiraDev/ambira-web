/**
 * Suggested Users Hook
 *
 * Optimized React Query hook for fetching suggested users with:
 * - Automatic caching to prevent repeated loads
 * - Prefetching for instant tab switching
 * - Proper loading and error states
 */

import { useQuery } from '@tanstack/react-query';
import { firebaseUserApi } from '@/lib/api';
import { CACHE_KEYS, CACHE_TIMES } from '@/lib/queryClient';
import type { SuggestedUser } from '@/types';

interface UseSuggestedUsersOptions {
  enabled?: boolean;
  limit?: number;
}

interface UseSuggestedUsersReturn {
  suggestedUsers: SuggestedUser[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useSuggestedUsers({
  enabled = true,
  limit = 10,
}: UseSuggestedUsersOptions = {}): UseSuggestedUsersReturn {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...CACHE_KEYS.SUGGESTED_USERS(), limit],
    queryFn: () => firebaseUserApi.getSuggestedUsers(limit),
    enabled,
    staleTime: CACHE_TIMES.LONG, // 15 minutes
    gcTime: CACHE_TIMES.VERY_LONG, // 1 hour
    refetchOnWindowFocus: false,
  });

  return {
    suggestedUsers: data ?? [],
    isLoading,
    isError,
    error: error as Error | null,
  };
}
