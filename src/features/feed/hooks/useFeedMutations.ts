/**
 * Feed Mutation Hooks - React Query Boundary
 *
 * Handles mutations that affect the feed (refresh, invalidation).
 * Session creation/deletion is handled in the Sessions feature.
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { FeedService, FeedFilters } from '../services/FeedService'
import { FEED_KEYS, FeedResult } from './useFeed'
import { SessionWithDetails } from '@/types'

const feedService = new FeedService()

// Infinite query data structure
interface FeedInfiniteData {
  pages: Array<{
    sessions: SessionWithDetails[]
    hasMore: boolean
    nextCursor?: string
  }>
  pageParams: unknown[]
}

/**
 * Refresh the feed
 *
 * Forces a fresh fetch of feed data.
 *
 * @example
 * const refreshMutation = useRefreshFeed();
 * refreshMutation.mutate({ userId, filters: { type: 'following' } });
 */
export function useRefreshFeed(
  options?: Partial<
    UseMutationOptions<FeedResult, Error, { userId: string; filters?: FeedFilters }>
  >
) {
  const queryClient = useQueryClient()

  return useMutation<FeedResult, Error, { userId: string; filters?: FeedFilters }>({
    mutationFn: ({ userId, filters }) => feedService.refreshFeed(userId, filters),

    onSuccess: (_, { userId, filters = {} }) => {
      // Invalidate the specific feed query
      queryClient.invalidateQueries({
        queryKey: FEED_KEYS.list(userId, filters),
      })
    },

    ...options,
  })
}

/**
 * Helper hook to invalidate all feed queries
 *
 * Use this when an action affects the feed but is handled elsewhere
 * (e.g., creating a session, supporting a session, etc.)
 *
 * @example
 * const invalidateFeeds = useInvalidateFeeds();
 *
 * // After creating a session:
 * invalidateFeeds();
 */
export function useInvalidateFeeds() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: FEED_KEYS.all() })
  }
}

/**
 * Helper hook to invalidate a specific user's feed
 *
 * @example
 * const invalidateUserFeed = useInvalidateUserFeed();
 * invalidateUserFeed(userId);
 */
export function useInvalidateUserFeed() {
  const queryClient = useQueryClient()

  return (userId: string) => {
    queryClient.invalidateQueries({ queryKey: FEED_KEYS.user(userId) })
  }
}

/**
 * Helper hook to invalidate a specific group's feed
 *
 * @example
 * const invalidateGroupFeed = useInvalidateGroupFeed();
 * invalidateGroupFeed(groupId);
 */
export function useInvalidateGroupFeed() {
  const queryClient = useQueryClient()

  return (groupId: string) => {
    queryClient.invalidateQueries({ queryKey: FEED_KEYS.group(groupId) })
  }
}

/**
 * Helper to manually add a session to the feed cache (optimistic update)
 *
 * Use this when creating a new session to immediately show it in the feed.
 *
 * @example
 * const addToFeed = useAddToFeedCache();
 *
 * // After creating a session:
 * addToFeed(userId, { type: 'following' }, newSession);
 */
export function useAddToFeedCache() {
  const queryClient = useQueryClient()

  return (userId: string, filters: FeedFilters, newSession: SessionWithDetails) => {
    const queryKey = FEED_KEYS.list(userId, filters)

    // Update infinite query cache
    queryClient.setQueryData<FeedInfiniteData>(queryKey, (old) => {
      if (!old?.pages) return old

      // Add to the first page
      return {
        ...old,
        pages: old.pages.map((page, index) => {
          if (index === 0) {
            return {
              ...page,
              sessions: [newSession, ...page.sessions],
            }
          }
          return page
        }),
      }
    })
  }
}

/**
 * Helper to manually remove a session from the feed cache (optimistic update)
 *
 * Use this when deleting a session to immediately remove it from the feed.
 *
 * @example
 * const removeFromFeed = useRemoveFromFeedCache();
 *
 * // After deleting a session:
 * removeFromFeed(userId, { type: 'following' }, sessionId);
 */
export function useRemoveFromFeedCache() {
  const queryClient = useQueryClient()

  return (userId: string, filters: FeedFilters, sessionId: string) => {
    const queryKey = FEED_KEYS.list(userId, filters)

    // Update infinite query cache
    queryClient.setQueryData<FeedInfiniteData>(queryKey, (old) => {
      if (!old?.pages) return old

      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          sessions: page.sessions.filter((s) => s.id !== sessionId),
        })),
      }
    })
  }
}
