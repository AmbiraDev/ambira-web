# React Query Quick Reference

> Quick reference guide for React Query patterns in Ambira. For comprehensive documentation, see [CACHING_STRATEGY.md](./CACHING_STRATEGY.md).

---

## Feature Hook Structure

```typescript
// src/features/[feature]/hooks/use[Feature].ts

import { useQuery } from '@tanstack/react-query';
import { [Feature]Service } from '../services/[Feature]Service';
import { STANDARD_CACHE_TIMES } from '@/lib/react-query';

const service = new [Feature]Service();

// ==================== CACHE KEYS ====================
export const [FEATURE]_KEYS = {
  all: () => ['feature'] as const,
  lists: () => [...[FEATURE]_KEYS.all(), 'list'] as const,
  details: () => [...[FEATURE]_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...[FEATURE]_KEYS.details(), id] as const,
};

// ==================== QUERY HOOKS ====================
export function use[Feature](id: string) {
  return useQuery({
    queryKey: [FEATURE]_KEYS.detail(id),
    queryFn: () => service.get[Feature](id),
    staleTime: STANDARD_CACHE_TIMES.[TIME],
    enabled: !!id,
  });
}
```

---

## Cache Time Selection

| Data Type         | Use                 | Examples                |
| ----------------- | ------------------- | ----------------------- |
| `REAL_TIME` (30s) | Live data           | Active timers, presence |
| `SHORT` (1m)      | Frequently changing | Feed, comments          |
| `MEDIUM` (5m)     | Moderately dynamic  | Session details         |
| `LONG` (15m)      | Relatively static   | Profiles, groups        |
| `VERY_LONG` (1h)  | Rarely changing     | Stats, analytics        |

---

## Query Patterns

### Basic Query

```typescript
const { data, isLoading, error } = useSession(sessionId)
```

### With Options

```typescript
const { data } = useProfile(userId, {
  staleTime: STANDARD_CACHE_TIMES.LONG,
  enabled: !!userId,
})
```

### Conditional Query

```typescript
const { data } = useGroupDetails(groupId, {
  enabled: !!groupId && userCanView,
})
```

---

## Mutation Patterns

### Basic Mutation

```typescript
export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => service.deleteSession(id),

    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.all() })
    },
  })
}
```

### Optimistic Update

```typescript
export function useLikeSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => service.likeSession(sessionId),

    onMutate: async (sessionId) => {
      // 1. Cancel queries
      await queryClient.cancelQueries({
        queryKey: SESSION_KEYS.detail(sessionId),
      })

      // 2. Snapshot
      const previous = queryClient.getQueryData(SESSION_KEYS.detail(sessionId))

      // 3. Optimistically update
      queryClient.setQueryData(SESSION_KEYS.detail(sessionId), (old: any) => ({
        ...old,
        likeCount: (old.likeCount || 0) + 1,
        isLiked: true,
      }))

      return { previous }
    },

    onError: (error, sessionId, context) => {
      // 4. Rollback
      if (context?.previous) {
        queryClient.setQueryData(SESSION_KEYS.detail(sessionId), context.previous)
      }
    },

    onSettled: (_, __, sessionId) => {
      // 5. Refetch
      queryClient.invalidateQueries({
        queryKey: SESSION_KEYS.detail(sessionId),
      })
    },
  })
}
```

### Helper Hook

```typescript
export function useInvalidateSession() {
  const queryClient = useQueryClient()

  return (sessionId: string) => {
    queryClient.invalidateQueries({ queryKey: SESSION_KEYS.detail(sessionId) })
  }
}
```

---

## Infinite Query (Pagination)

```typescript
export function useFeedInfinite(userId: string) {
  return useInfiniteQuery({
    queryKey: FEED_KEYS.list(userId),
    queryFn: ({ pageParam }) => feedService.getFeed(userId, { cursor: pageParam }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: undefined as string | undefined,
    staleTime: STANDARD_CACHE_TIMES.SHORT,
  })
}

// Usage
const { data, fetchNextPage, hasNextPage } = useFeedInfinite(userId)
const allItems = data?.pages.flatMap((page) => page.items) || []
```

---

## Error Handling

### Silent Errors (Expected)

```typescript
queryFn: async () => {
  try {
    return await service.getProfile(userId);
  } catch (error: any) {
    if (error?.message?.includes('not found')) {
      return null; // Expected, don't throw
    }
    throw error; // Unexpected, rethrow
  }
},
retry: false, // Don't retry expected errors
```

### Idempotent Operations

```typescript
mutationFn: async (id) => {
  try {
    await service.like(id)
  } catch (error: any) {
    if (error.message.includes('Already liked')) {
      return // Idempotent - treat as success
    }
    throw error
  }
}
```

---

## Cache Key Patterns

### Entity Keys

```typescript
// Single entity
;['sessions', 'detail', sessionId][
  // Entity with subresource
  ('profile', 'detail', userId, 'stats')
][
  // Entity with populated data
  ('sessions', 'detail', sessionId, 'with-details')
]
```

### List Keys

```typescript
// Simple list
;['projects', 'list'][
  // List with filters
  ('feed', 'list', userId, { type: 'following' })
][
  // Scoped list
  ('sessions', 'user', userId)
]
```

### Relationship Keys

```typescript
;['profile', 'followers', userId][('profile', 'following', userId)][
  ('profile', 'isFollowing', currentUserId, targetUserId)
]
```

---

## Invalidation Strategies

### Hierarchical Invalidation

```typescript
// Invalidate everything
queryClient.invalidateQueries({ queryKey: SESSION_KEYS.all() })
// Matches: ['sessions', ...]

// Invalidate all lists
queryClient.invalidateQueries({ queryKey: SESSION_KEYS.lists() })
// Matches: ['sessions', 'list', ...]

// Invalidate specific item
queryClient.invalidateQueries({ queryKey: SESSION_KEYS.detail(id) })
// Matches: ['sessions', 'detail', id]
```

### Multiple Features

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: SESSION_KEYS.all() })
  queryClient.invalidateQueries({ queryKey: ['feed'] })
  queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail(userId) })
}
```

---

## Common Pitfalls

### ❌ Stale Closures

```typescript
// BAD
const count = session.likeCount
queryClient.setQueryData(key, (old) => ({
  ...old,
  likeCount: count + 1, // Uses stale value!
}))

// GOOD
queryClient.setQueryData(key, (old) => ({
  ...old,
  likeCount: (old.likeCount || 0) + 1,
}))
```

### ❌ Missing Cancel Queries

```typescript
// BAD
onMutate: async (id) => {
  const previous = queryClient.getQueryData(KEY)
  queryClient.setQueryData(KEY, newData)
  return { previous }
}

// GOOD
onMutate: async (id) => {
  await queryClient.cancelQueries({ queryKey: KEY }) // Add this!
  const previous = queryClient.getQueryData(KEY)
  queryClient.setQueryData(KEY, newData)
  return { previous }
}
```

### ❌ Hardcoded Keys

```typescript
// BAD
queryClient.invalidateQueries({ queryKey: ['sessions', 'detail', id] })

// GOOD
queryClient.invalidateQueries({ queryKey: SESSION_KEYS.detail(id) })
```

---

## Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('useSession', () => {
  it('fetches session data', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useSession('123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

---

## Performance Tips

### Prefetch on Hover

```typescript
const queryClient = useQueryClient();

<Link
  href={`/sessions/${id}`}
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: SESSION_KEYS.detail(id),
      queryFn: () => sessionService.getSession(id),
    });
  }}
>
```

### Select Subsets

```typescript
// Only re-render when name changes
const { data: name } = useProfile(userId, {
  select: (profile) => profile.name,
})
```

### Appropriate Stale Times

```typescript
// Don't default to 0!
useQuery({
  queryKey,
  queryFn,
  staleTime: STANDARD_CACHE_TIMES.MEDIUM, // Let it stay fresh
})
```

---

## Resources

- [Full Documentation](./CACHING_STRATEGY.md)
- [Audit Summary](./REACT_QUERY_AUDIT_SUMMARY.md)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)
