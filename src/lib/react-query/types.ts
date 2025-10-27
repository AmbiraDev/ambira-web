/**
 * Standardized React Query Types
 *
 * These types ensure consistency across all feature hooks.
 * Use these instead of importing directly from @tanstack/react-query in feature hooks.
 */

import type {
  UseQueryOptions as TanStackUseQueryOptions,
  UseMutationOptions as TanStackUseMutationOptions,
  QueryKey,
} from '@tanstack/react-query';

/**
 * Standard query options for feature hooks
 *
 * @example
 * export function useGroupDetails(
 *   groupId: string,
 *   options?: QueryOptions<Group | null>
 * ) {
 *   return useQuery({
 *     queryKey: GROUPS_KEYS.detail(groupId),
 *     queryFn: () => groupService.getGroupDetails(groupId),
 *     ...options,
 *   });
 * }
 */
export type QueryOptions<
  TData = unknown,
  TError = Error,
  TQueryKey extends QueryKey = QueryKey,
> = Partial<TanStackUseQueryOptions<TData, TError, TData, TQueryKey>>;

/**
 * Standard mutation options for feature hooks
 *
 * @example
 * export function useJoinGroup(
 *   options?: MutationOptions<void, { groupId: string; userId: string }>
 * ) {
 *   return useMutation({
 *     mutationFn: ({ groupId, userId }) => groupService.joinGroup(groupId, userId),
 *     ...options,
 *   });
 * }
 */
export type MutationOptions<
  TData = unknown,
  TVariables = void,
  TError = Error,
> = Partial<TanStackUseMutationOptions<TData, TError, TVariables>>;

/**
 * Cache key factory pattern
 *
 * Use this to create hierarchical cache keys for efficient invalidation.
 *
 * @example
 * export const GROUPS_KEYS: CacheKeyFactory = {
 *   all: () => ['groups'] as const,
 *   lists: () => [...GROUPS_KEYS.all(), 'list'] as const,
 *   list: (filters?: string) => [...GROUPS_KEYS.lists(), { filters }] as const,
 *   details: () => [...GROUPS_KEYS.all(), 'detail'] as const,
 *   detail: (id: string) => [...GROUPS_KEYS.details(), id] as const,
 * };
 */
export type CacheKeyFactory = Record<
  string,
  (...args: never[]) => readonly unknown[]
>;

/**
 * Standard cache times for different data types
 *
 * Use these constants for consistent caching across features.
 */
export const STANDARD_CACHE_TIMES = {
  /** 30 seconds - Real-time data that changes frequently */
  REAL_TIME: 30 * 1000,

  /** 1 minute - Frequently changing data (feed, search results) */
  SHORT: 1 * 60 * 1000,

  /** 5 minutes - Moderately changing data (sessions, comments) */
  MEDIUM: 5 * 60 * 1000,

  /** 15 minutes - Relatively static data (user profiles, groups) */
  LONG: 15 * 60 * 1000,

  /** 1 hour - Rarely changing data (stats, analytics) */
  VERY_LONG: 60 * 60 * 1000,

  /** Infinite - Data that never changes */
  INFINITE: Infinity,
} as const;

/**
 * Helper type for service methods that feature hooks wrap
 */
export type ServiceMethod<TReturn, TParams extends unknown[] = []> = (
  ...args: TParams
) => Promise<TReturn>;

/**
 * Extract parameters from a service method
 *
 * @example
 * type GroupServiceParams = ServiceParams<typeof groupService.getGroupDetails>;
 * // string
 */
export type ServiceParams<T> =
  T extends ServiceMethod<unknown, infer P> ? P : never;

/**
 * Extract return type from a service method
 *
 * @example
 * type GroupReturn = ServiceReturn<typeof groupService.getGroupDetails>;
 * // Group | null
 */
export type ServiceReturn<T> = T extends ServiceMethod<infer R> ? R : never;
