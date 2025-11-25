/**
 * React Query Helper Utilities
 *
 * Reusable utilities for implementing the standardized caching pattern.
 */

import { QueryClient } from '@tanstack/react-query'
import type { CacheKeyFactory } from './types'

/**
 * Create a standard cache key factory for a feature
 *
 * This helper enforces the hierarchical cache key pattern.
 *
 * @example
 * export const GROUPS_KEYS = createCacheKeyFactory('groups', {
 *   lists: () => [],
 *   list: (filters?: string) => [{ filters }],
 *   details: () => [],
 *   detail: (id: string) => [id],
 * });
 *
 * // Results in:
 * // GROUPS_KEYS.all() => ['groups']
 * // GROUPS_KEYS.lists() => ['groups', 'list']
 * // GROUPS_KEYS.list('active') => ['groups', 'list', { filters: 'active' }]
 * // GROUPS_KEYS.details() => ['groups', 'detail']
 * // GROUPS_KEYS.detail('123') => ['groups', 'detail', '123']
 */
export function createCacheKeyFactory<T extends Record<string, (...args: never[]) => unknown[]>>(
  featureName: string,
  keys: T
): CacheKeyFactory & T & { all: () => readonly [string] } {
  const all = () => [featureName] as const

  type FactoryType = CacheKeyFactory & T & { all: () => readonly [string] }

  const factory = Object.entries(keys).reduce(
    (acc, [key, fn]) => {
      // Type assertion necessary for dynamic key assignment with generic type parameters
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(acc as any)[key] = (...args: Parameters<typeof fn>) => {
        const base = all()
        const suffix = fn(...args)
        return [...base, ...suffix] as const
      }
      return acc
    },
    { all } as FactoryType
  )

  return factory
}

/**
 * Create an invalidation helper for a feature
 *
 * Returns a function that invalidates all queries for a feature.
 *
 * @example
 * export function useInvalidateGroups() {
 *   const queryClient = useQueryClient();
 *   return createInvalidator(queryClient, GROUPS_KEYS.all());
 * }
 *
 * // Usage:
 * const invalidate = useInvalidateGroups();
 * invalidate(); // Invalidates all group queries
 */
export function createInvalidator(queryClient: QueryClient, queryKey: readonly unknown[]) {
  return () => {
    queryClient.invalidateQueries({ queryKey })
  }
}

/**
 * Create a prefetch helper for a feature
 *
 * Returns a function that prefetches data for better UX.
 *
 * @example
 * export function usePrefetchGroup() {
 *   const queryClient = useQueryClient();
 *
 *   return (groupId: string) => {
 *     prefetchQuery(
 *       queryClient,
 *       GROUPS_KEYS.detail(groupId),
 *       () => groupService.getGroupDetails(groupId),
 *       { staleTime: 15 * 60 * 1000 }
 *     );
 *   };
 * }
 *
 * // Usage in component:
 * const prefetchGroup = usePrefetchGroup();
 *
 * <Link
 *   href={`/groups/${group.id}`}
 *   onMouseEnter={() => prefetchGroup(group.id)}
 * >
 */
export function prefetchQuery<TData>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: { staleTime?: number }
) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: options?.staleTime,
  })
}

/**
 * Create an optimistic update helper
 *
 * Simplifies the boilerplate for optimistic updates with automatic rollback.
 *
 * @example
 * export function useJoinGroup() {
 *   const queryClient = useQueryClient();
 *
 *   return useMutation({
 *     mutationFn: ({ groupId, userId }) => groupService.joinGroup(groupId, userId),
 *     ...createOptimisticUpdate(
 *       queryClient,
 *       ({ groupId }) => GROUPS_KEYS.detail(groupId),
 *       (old: Group, { userId }) => ({
 *         ...old,
 *         memberIds: [...old.memberIds, userId],
 *       })
 *     ),
 *   });
 * }
 */
interface OptimisticUpdateContext<TData> {
  previousData: TData | undefined
  queryKey: readonly unknown[]
}

export function createOptimisticUpdate<TData, TVariables>(
  queryClient: QueryClient,
  getQueryKey: (variables: TVariables) => readonly unknown[],
  updater: (oldData: TData, variables: TVariables) => TData
) {
  return {
    onMutate: async (variables: TVariables): Promise<OptimisticUpdateContext<TData>> => {
      const queryKey = getQueryKey(variables)

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(queryKey)

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<TData>(queryKey, updater(previousData, variables))
      }

      return { previousData, queryKey }
    },

    onError: (
      _error: Error,
      _variables: TVariables,
      context: OptimisticUpdateContext<TData> | undefined
    ) => {
      // Rollback on error
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData)
      }
    },

    onSettled: (_data: unknown, _error: unknown, variables: TVariables) => {
      // Invalidate to refetch
      const queryKey = getQueryKey(variables)
      queryClient.invalidateQueries({ queryKey })
    },
  }
}

/**
 * Batch invalidate multiple cache keys
 *
 * Useful when a mutation affects multiple features.
 *
 * @example
 * onSuccess: (_, variables) => {
 *   batchInvalidate(queryClient, [
 *     GROUPS_KEYS.detail(variables.groupId),
 *     GROUPS_KEYS.userGroups(variables.userId),
 *     FEED_KEYS.all(),
 *   ]);
 * }
 */
export function batchInvalidate(queryClient: QueryClient, queryKeys: readonly unknown[][]) {
  queryKeys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey })
  })
}

/**
 * Check if a query is currently cached and fresh
 *
 * Useful for conditional logic based on cache state.
 *
 * @example
 * const hasCachedGroup = isCached(queryClient, GROUPS_KEYS.detail(groupId));
 * if (!hasCachedGroup) {
 *   // Prefetch or show loading state
 * }
 */
export function isCached(queryClient: QueryClient, queryKey: readonly unknown[]): boolean {
  const state = queryClient.getQueryState(queryKey)
  return !!state && state.status === 'success' && !state.isInvalidated
}

/**
 * Get cached data without triggering a fetch
 *
 * Useful for reading cached data in event handlers or effects.
 *
 * @example
 * const handleClick = () => {
 *   const cachedGroup = getCachedData(queryClient, GROUPS_KEYS.detail(groupId));
 *   if (cachedGroup) {
 *     // Use cached data
 *   }
 * }
 */
export function getCachedData<TData>(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
): TData | undefined {
  return queryClient.getQueryData<TData>(queryKey)
}

/**
 * Set cached data manually
 *
 * Useful for updating cache from external sources (like WebSocket updates).
 *
 * @example
 * // In a WebSocket listener:
 * socket.on('group-updated', (group) => {
 *   setCachedData(queryClient, GROUPS_KEYS.detail(group.id), group);
 * });
 */
export function setCachedData<TData>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  data: TData | ((old: TData | undefined) => TData)
) {
  queryClient.setQueryData<TData>(queryKey, data)
}
