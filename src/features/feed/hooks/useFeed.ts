/**
 * Feed Query Hooks - React Query Boundary
 *
 * This is the ONLY place where React Query should be used for feed.
 * All components should use these hooks instead of direct React Query or firebaseApi calls.
 *
 * Architecture:
 * Components → useFeed hooks (React Query) → FeedService → Repositories → Firebase
 */

import {
  useInfiniteQuery,
  useQuery,
  UseQueryOptions,
  UseInfiniteQueryOptions,
  InfiniteData,
} from '@tanstack/react-query';
import { FeedService, FeedFilters } from '../services/FeedService';
import { Session } from '@/domain/entities/Session';
import { STANDARD_CACHE_TIMES } from '@/lib/react-query';

// Singleton service instance
const feedService = new FeedService();

// ==================== TYPES ====================

// Type for infinite query options without 'select' property
// Infinite queries must return InfiniteData, so select cannot transform to FeedResult
type InfiniteQueryOptions<TData, TError> = Omit<
  Partial<UseInfiniteQueryOptions<TData, TError, InfiniteData<TData, unknown>>>,
  'select'
>;

export interface FeedResult {
  sessions: Session[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface FeedPage {
  sessions: Session[];
  hasMore: boolean;
  nextCursor?: string;
}

// ==================== CACHE KEYS ====================
// Hierarchical cache keys for efficient invalidation

export const FEED_KEYS = {
  all: () => ['feed'] as const,
  lists: () => [...FEED_KEYS.all(), 'list'] as const,
  list: (userId: string, filters: FeedFilters) =>
    [...FEED_KEYS.lists(), userId, filters] as const,
  user: (userId: string) => [...FEED_KEYS.all(), 'user', userId] as const,
  group: (groupId: string) => [...FEED_KEYS.all(), 'group', groupId] as const,
};

// ==================== QUERY HOOKS ====================

/**
 * Get paginated feed with infinite scroll support
 *
 * This is the primary hook for feed functionality with pagination.
 *
 * @example
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage
 * } = useFeedInfinite(userId, { type: 'following' }, { limit: 10 });
 *
 * // Access all pages:
 * const allSessions = data?.pages.flatMap(page => page.sessions) || [];
 */
export function useFeedInfinite(
  currentUserId: string,
  filters: FeedFilters = {},
  options?: InfiniteQueryOptions<FeedResult, Error> & { limit?: number }
) {
  const limit = options?.limit || 10;

  return useInfiniteQuery<FeedResult, Error>({
    queryKey: [...FEED_KEYS.list(currentUserId, filters), limit],
    queryFn: ({ pageParam }) =>
      feedService.getFeed(currentUserId, filters, {
        limit,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: lastPage => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
    // Cache Configuration:
    // - 2 minutes balances feed freshness with Firebase read costs
    // - Social feeds need relatively fresh data but don't require real-time updates
    // - Shorter than general SHORT cache (1min) would cause excessive reads
    staleTime: 2 * 60 * 1000, // 2 minutes
    // Refetch Behavior:
    // - On window focus: Ensures users see recent updates when returning to tab
    // - On mount: Refreshes feed when navigating back to feed page (if stale)
    // - On reconnect: Syncs data after network interruptions
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    enabled: !!currentUserId,
    ...options,
  });
}

/**
 * Get initial feed page (non-paginated)
 *
 * Use this for simple feed displays without infinite scroll.
 *
 * @example
 * const { data: feedData, isLoading, error } = useFeed(userId, { type: 'all' });
 */
export function useFeed(
  currentUserId: string,
  filters: FeedFilters = {},
  limit: number = 20,
  options?: Partial<UseQueryOptions<FeedResult, Error>>
) {
  return useQuery<FeedResult, Error>({
    queryKey: [...FEED_KEYS.list(currentUserId, filters), limit],
    queryFn: () => feedService.getFeed(currentUserId, filters, { limit }),
    // Cache Configuration:
    // - 2 minutes balances feed freshness with Firebase read costs
    // - Social feeds need relatively fresh data but don't require real-time updates
    // - Shorter than general SHORT cache (1min) would cause excessive reads
    staleTime: 2 * 60 * 1000, // 2 minutes
    // Refetch Behavior:
    // - On window focus: Ensures users see recent updates when returning to tab
    // - On mount: Refreshes feed when navigating back to feed page (if stale)
    // - On reconnect: Syncs data after network interruptions
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    enabled: !!currentUserId,
    ...options,
  });
}

/**
 * Get user-specific feed
 *
 * Shows sessions from a specific user (for profile pages).
 *
 * @example
 * const { data: userFeed } = useUserFeed(currentUserId, targetUserId);
 */
export function useUserFeed(
  currentUserId: string,
  userId: string,
  limit: number = 20,
  options?: Partial<UseQueryOptions<FeedResult, Error>>
) {
  return useQuery<FeedResult, Error>({
    queryKey: [...FEED_KEYS.user(userId), currentUserId, limit],
    queryFn: () =>
      feedService.getFeed(currentUserId, { type: 'user', userId }, { limit }),
    staleTime: STANDARD_CACHE_TIMES.MEDIUM, // 5 minutes
    enabled: !!currentUserId && !!userId,
    ...options,
  });
}

/**
 * Get group-specific feed
 *
 * Shows sessions from a specific group.
 *
 * @example
 * const { data: groupFeed } = useGroupFeed(currentUserId, groupId);
 */
export function useGroupFeed(
  currentUserId: string,
  groupId: string,
  limit: number = 20,
  options?: Partial<UseQueryOptions<FeedResult, Error>>
) {
  return useQuery<FeedResult, Error>({
    queryKey: [...FEED_KEYS.group(groupId), currentUserId, limit],
    queryFn: () =>
      feedService.getFeed(currentUserId, { type: 'group', groupId }, { limit }),
    staleTime: STANDARD_CACHE_TIMES.MEDIUM, // 5 minutes
    enabled: !!currentUserId && !!groupId,
    ...options,
  });
}

/**
 * Get following feed (infinite scroll version)
 *
 * Shows sessions from users the current user follows.
 *
 * @example
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage
 * } = useFollowingFeedInfinite(userId);
 */
export function useFollowingFeedInfinite(
  currentUserId: string,
  options?: InfiniteQueryOptions<FeedResult, Error>
) {
  return useFeedInfinite(currentUserId, { type: 'following' }, options);
}

/**
 * Get public/all feed (infinite scroll version)
 *
 * Shows all public sessions.
 *
 * @example
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage
 * } = usePublicFeedInfinite(userId);
 */
export function usePublicFeedInfinite(
  currentUserId: string,
  options?: InfiniteQueryOptions<FeedResult, Error>
) {
  return useFeedInfinite(currentUserId, { type: 'all' }, options);
}
