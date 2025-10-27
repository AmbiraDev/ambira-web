/**
 * Feed Hooks - Public API
 *
 * All feed-related hooks exported from here.
 *
 * @example
 * import { useFeedInfinite, useInvalidateFeeds } from '@/features/feed/hooks';
 */

// Query hooks
export {
  useFeed,
  useFeedInfinite,
  useUserFeed,
  useGroupFeed,
  useFollowingFeedInfinite,
  usePublicFeedInfinite,
  FEED_KEYS,
} from './useFeed';

export type { FeedResult, FeedPage } from './useFeed';

// Mutation hooks and helpers
export {
  useRefreshFeed,
  useInvalidateFeeds,
  useInvalidateUserFeed,
  useInvalidateGroupFeed,
  useAddToFeedCache,
  useRemoveFromFeedCache,
} from './useFeedMutations';
