# Caching System Guide

## Overview

This application uses **React Query (TanStack Query)** for comprehensive data caching, reducing Firebase reads and improving performance.

## Architecture

### 1. Query Client (`src/lib/queryClient.ts`)
- Centralized cache configuration
- Default stale times and garbage collection
- Predefined cache keys for consistency
- Cache time constants for different data types

### 2. Custom Hooks (`src/hooks/useCache.ts`)
- Type-safe hooks for all data fetching
- Automatic caching and background refetching
- Optimistic updates support
- Cache invalidation helpers

### 3. Query Provider (`src/providers/QueryProvider.tsx`)
- Wraps the entire app
- Provides React Query DevTools in development
- Manages global cache state

## Cache Strategy

### Cache Times

| Type | Duration | Use Case |
|------|----------|----------|
| `REAL_TIME` | 30 seconds | Live data (comments, likes) |
| `SHORT` | 1 minute | Frequently updated (tasks, feed) |
| `MEDIUM` | 5 minutes | Standard data (sessions, profiles) |
| `LONG` | 15 minutes | Relatively static (projects, groups) |
| `VERY_LONG` | 1 hour | Analytics, statistics |
| `INFINITE` | Never expires | Immutable data |

### Default Behavior

- **Stale Time**: 5 minutes (data considered fresh)
- **GC Time**: 10 minutes (unused data kept in cache)
- **Refetch on Window Focus**: Yes (ensures fresh data)
- **Refetch on Mount**: No (uses cache if fresh)
- **Retry**: 1 attempt on failure

## Usage Examples

### Basic Data Fetching

```typescript
import { useUserStats } from '@/hooks/useCache';

function AnalyticsPage() {
  const { data: stats, isLoading, error } = useUserStats(userId);
  
  if (isLoading) return <Loading />;
  if (error) return <Error />;
  
  return <StatsDisplay stats={stats} />;
}
```

### With Custom Options

```typescript
const { data } = useUserStats(userId, {
  staleTime: CACHE_TIMES.VERY_LONG, // Override default
  enabled: !!userId, // Conditional fetching
  refetchInterval: 60000, // Refetch every minute
});
```

### Cache Invalidation

```typescript
import { useInvalidateUserData } from '@/hooks/useCache';

function UpdateProfile() {
  const invalidateUser = useInvalidateUserData();
  
  const handleUpdate = async () => {
    await updateUserProfile(data);
    invalidateUser(userId); // Refresh all user data
  };
}
```

### Optimistic Updates

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CACHE_KEYS } from '@/lib/queryClient';

function LikeButton({ sessionId }) {
  const queryClient = useQueryClient();
  
  const likeMutation = useMutation({
    mutationFn: likeSession,
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: CACHE_KEYS.SESSION(sessionId) 
      });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(
        CACHE_KEYS.SESSION(sessionId)
      );
      
      // Optimistically update
      queryClient.setQueryData(
        CACHE_KEYS.SESSION(sessionId),
        (old) => ({ ...old, likes: old.likes + 1 })
      );
      
      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        CACHE_KEYS.SESSION(sessionId),
        context.previous
      );
    },
  });
}
```

## Available Hooks

### User Data
- `useUserStats(userId)` - User statistics (1 hour cache)
- `useUserProfile(userId)` - User profile (15 min cache)
- `useUserSessions(userId, limit)` - User sessions (5 min cache)
- `useUserFollowers(userId)` - Followers list (15 min cache)
- `useUserFollowing(userId)` - Following list (15 min cache)

### Sessions
- `useSession(sessionId)` - Single session (5 min cache)
- `useFeedSessions(limit, cursor, filters)` - Feed sessions (1 min cache)

### Projects & Tasks
- `useProjects(userId)` - User projects (15 min cache)
- `useProject(projectId)` - Single project (15 min cache)
- `useTasks(userId)` - User tasks (1 min cache)

### Groups
- `useGroups(filters)` - Search groups (15 min cache)
- `useGroup(groupId)` - Single group (15 min cache)
- `useUserGroups(userId)` - User's groups (15 min cache)

### Challenges
- `useChallenges(filters)` - Search challenges (15 min cache)

### Suggested Content
- `useSuggestedUsers()` - Suggested users (1 hour cache)
- `useSuggestedGroups()` - Suggested groups (1 hour cache)

### Streaks
- `useStreak(userId)` - Current streak (5 min cache)

## Cache Invalidation Helpers

- `useInvalidateUserData()` - Invalidate all user-related data
- `useInvalidateFeed()` - Invalidate feed data
- `useInvalidateProjects()` - Invalidate project data
- `useInvalidateTasks()` - Invalidate task data

## Performance Benefits

### Before Caching
- Every page load = Firebase read
- Analytics page: ~10-15 reads per visit
- Feed refresh: ~20 reads
- Total: High Firebase costs, slow loading

### After Caching
- First load: Firebase read + cache
- Subsequent loads: Cache only (instant)
- Analytics page: 1 read per hour
- Feed refresh: Cache for 1 minute
- Total: 90% reduction in reads, instant UI

## Best Practices

### 1. Use Appropriate Cache Times
```typescript
// ✅ Good - Analytics cached for 1 hour
const { data } = useUserStats(userId);

// ❌ Bad - Forcing fresh fetch every time
const { data } = useUserStats(userId, { staleTime: 0 });
```

### 2. Invalidate After Mutations
```typescript
// ✅ Good - Invalidate after update
const handleUpdate = async () => {
  await updateProfile(data);
  invalidateUser(userId);
};

// ❌ Bad - No invalidation, stale data
const handleUpdate = async () => {
  await updateProfile(data);
};
```

### 3. Use Optimistic Updates for Better UX
```typescript
// ✅ Good - Instant feedback
const likeMutation = useMutation({
  mutationFn: likePost,
  onMutate: async () => {
    // Update cache immediately
  },
});

// ❌ Bad - Wait for server
const handleLike = async () => {
  await likePost();
  refetch(); // Slow
};
```

### 4. Prefetch Data
```typescript
// Prefetch on hover for instant navigation
const queryClient = useQueryClient();

const handleHover = () => {
  queryClient.prefetchQuery({
    queryKey: CACHE_KEYS.USER_PROFILE(userId),
    queryFn: () => firebaseUserApi.getUserProfile(userId),
  });
};
```

## Debugging

### React Query DevTools
In development, open the DevTools panel (bottom of screen) to:
- View all cached queries
- See query states (fresh, stale, loading)
- Manually invalidate queries
- Monitor network requests

### Cache Inspection
```typescript
import { queryClient } from '@/lib/queryClient';

// Get cached data
const cachedStats = queryClient.getQueryData(
  CACHE_KEYS.USER_STATS(userId)
);

// Check if query is cached
const isCached = queryClient.getQueryState(
  CACHE_KEYS.USER_STATS(userId)
)?.data !== undefined;
```

## Migration Guide

### Converting Existing Code

**Before:**
```typescript
const [stats, setStats] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadStats = async () => {
    setLoading(true);
    const data = await firebaseUserApi.getUserStats(userId);
    setStats(data);
    setLoading(false);
  };
  loadStats();
}, [userId]);
```

**After:**
```typescript
const { data: stats, isLoading } = useUserStats(userId);
```

## Monitoring

Track cache performance:
- Cache hit rate
- Average load time
- Firebase read reduction
- User experience improvements

## Future Enhancements

1. **Persistent Cache**: Store cache in IndexedDB
2. **Background Sync**: Update cache in service worker
3. **Smart Prefetching**: Predict user navigation
4. **Cache Warming**: Preload common data
5. **Compression**: Reduce cache size
