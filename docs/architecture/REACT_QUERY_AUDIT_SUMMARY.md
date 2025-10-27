# React Query Audit Summary

**Date:** 2025-10-27
**Scope:** React Query usage patterns across all Ambira features

---

## Executive Summary

Ambira has a **well-implemented, consistent React Query architecture** with 39 hook files across 8 major features. The codebase follows the established "React Query at Feature Boundaries" pattern with:

- ✅ Consistent query key naming conventions
- ✅ Standardized cache time constants
- ✅ Sophisticated optimistic update patterns
- ✅ Proper separation of concerns (hooks → services → repositories)
- ✅ Comprehensive error handling strategies

---

## Features Audited

### Implemented Features (8)

1. **Feed** (`src/features/feed/hooks/`)
   - `useFeed.ts` - Query hooks with infinite scroll
   - `useFeedMutations.ts` - Cache invalidation helpers
   - **Cache Keys:** `['feed', 'list', userId, filters]`, `['feed', 'user', userId]`
   - **Stale Time:** SHORT (1 minute)

2. **Sessions** (`src/features/sessions/hooks/`)
   - `useSessions.ts` - Session queries
   - `useSessionMutations.ts` - CRUD + support/unsupport
   - **Cache Keys:** `['sessions', 'detail', id]`, `['sessions', 'user', userId]`
   - **Stale Time:** MEDIUM (5 minutes)
   - **Notable:** Sophisticated optimistic updates for support/like actions

3. **Profile** (`src/features/profile/hooks/`)
   - `useProfile.ts` - Profile queries (by ID, by username)
   - `useProfileMutations.ts` - Follow/unfollow
   - **Cache Keys:** `['profile', 'detail', userId]`, `['profile', 'stats', userId]`
   - **Stale Time:** LONG (15 minutes) for profiles, VERY_LONG (1 hour) for stats
   - **Notable:** Handles privacy settings and permission errors gracefully

4. **Groups** (`src/features/groups/hooks/`)
   - `useGroups.ts` - Group queries, leaderboards
   - `useGroupMutations.ts` - Join/leave groups
   - `useGroupMembers.ts` - Member lists
   - `useGroupLeaderboard.ts` - Leaderboard queries
   - **Cache Keys:** `['groups', 'detail', groupId]`, `['groups', 'user', userId]`
   - **Stale Time:** LONG (15 minutes) for groups, MEDIUM (5 minutes) for leaderboards
   - **Notable:** Domain entity adapters to convert to UI models

5. **Comments** (`src/features/comments/hooks/`)
   - `useComments.ts` - Comment queries
   - `useCommentMutations.ts` - CRUD + like/unlike
   - **Cache Keys:** `['comments', 'session', sessionId]`
   - **Stale Time:** SHORT (1 minute)
   - **Notable:** Cascading cache updates (comments → sessions → feed)

6. **Projects** (`src/features/projects/hooks/`)
   - `useProjects.ts` - Project/activity queries
   - `useProjectMutations.ts` - Project CRUD
   - **Cache Keys:** `['projects', 'detail', projectId]`
   - **Stale Time:** LONG (15 minutes)

7. **Timer** (`src/features/timer/hooks/`)
   - `useTimer.ts` - Unified timer hook
   - `useTimerState.ts` - Client-side timer state
   - `useTimerMutations.ts` - Timer operations
   - **Cache Keys:** Active timer in `/hooks/useTimerQuery.ts`
   - **Notable:** Hybrid approach combining React Query + local state

8. **Additional Features:**
   - **Challenges** (`src/features/challenges/hooks/`)
   - **Streaks** (`src/features/streaks/hooks/`)
   - **Search** (`src/features/search/hooks/`)
   - **Social** (`src/features/social/hooks/`)

---

## Query Key Conventions Found

### Hierarchical Structure

All features follow this pattern:

```
[feature, category?, ...identifiers, ...subresources?]
```

### Pattern Categories

#### 1. Entity Detail Keys

```typescript
['sessions', 'detail', sessionId][
  ('sessions', 'detail', sessionId, 'with-details')
][('profile', 'detail', userId)][('profile', 'detail', userId, 'stats')][
  ('groups', 'detail', groupId)
][('groups', 'detail', groupId, 'leaderboard', period)];
```

#### 2. List/Collection Keys

```typescript
['projects', 'list'][('feed', 'list', userId, filters)][
  ('groups', 'list', 'public')
][('sessions', 'user', userId, filters)];
```

#### 3. Relationship Keys

```typescript
['profile', 'followers', userId][('profile', 'following', userId)][
  ('profile', 'isFollowing', currentUserId, targetUserId)
][('groups', 'user', userId)];
```

#### 4. Lookup Keys

```typescript
['profile', 'username', username][
  ('groups', 'detail', groupId, 'canJoin', userId)
];
```

### Cache Key Factories

Every feature exports a `FEATURE_KEYS` object:

```typescript
export const SESSION_KEYS = {
  all: () => ['sessions'] as const,
  lists: () => [...SESSION_KEYS.all(), 'list'] as const,
  details: () => [...SESSION_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...SESSION_KEYS.details(), id] as const,
  userSessions: (userId: string, filters?: SessionFilters) =>
    [...SESSION_KEYS.all(), 'user', userId, filters] as const,
};
```

**Benefits:**

- Type-safe query keys
- Consistent naming across features
- Easy refactoring
- Hierarchical invalidation

---

## Cache Time Strategy

### Standard Constants (from `/src/lib/react-query/types.ts`)

```typescript
export const STANDARD_CACHE_TIMES = {
  REAL_TIME: 30 * 1000, // 30 seconds
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
  INFINITE: Infinity,
} as const;
```

### Cache Time Usage by Feature

| Feature                | Cache Time     | Rationale                                 |
| ---------------------- | -------------- | ----------------------------------------- |
| **Feed**               | SHORT (1m)     | User-generated content changes frequently |
| **Comments**           | SHORT (1m)     | Conversation data updates often           |
| **Sessions**           | MEDIUM (5m)    | Session details moderately dynamic        |
| **Profile**            | LONG (15m)     | User data relatively static               |
| **Groups**             | LONG (15m)     | Group membership changes infrequently     |
| **Projects**           | LONG (15m)     | Projects rarely change                    |
| **Profile Stats**      | VERY_LONG (1h) | Computed/aggregated data                  |
| **Group Leaderboards** | MEDIUM (5m)    | Leaderboards update periodically          |

---

## Common Patterns Identified

### 1. Optimistic Updates with Rollback

**Most sophisticated example:** `useSupportSession` in sessions feature

```typescript
onMutate: async ({ sessionId, action }) => {
  // 1. Cancel in-flight queries
  await queryClient.cancelQueries({ queryKey: ['feed'] });

  // 2. Snapshot for rollback
  const previousData = queryClient.getQueriesData({ queryKey: ['feed'] });

  // 3. Optimistically update
  queryClient.setQueriesData({ queryKey: ['feed'] }, (old) => {
    // Update logic...
  });

  return { previousData };
},

onError: (error, variables, context) => {
  // 4. Rollback on error
  context.previousData.forEach(([key, data]) => {
    queryClient.setQueryData(key, data);
  });
},

onSettled: () => {
  // 5. Refetch for consistency
  queryClient.invalidateQueries({ queryKey: ['feed'] });
}
```

### 2. Cascading Cache Updates

**Example:** Creating a comment updates multiple caches

```typescript
onSuccess: (newComment, variables) => {
  // 1. Invalidate comments
  queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.session(sessionId) });

  // 2. Update session cache
  queryClient.setQueryData(SESSION_KEYS.detail(sessionId), old => ({
    ...old,
    commentCount: (old.commentCount || 0) + 1,
  }));

  // 3. Update feed caches
  queryClient.setQueriesData({ queryKey: ['feed'] }, updateFn);
};
```

### 3. Helper Invalidation Hooks

Every mutation file exports helper hooks:

```typescript
export function useInvalidateSession() {
  const queryClient = useQueryClient();
  return (sessionId: string) => {
    queryClient.invalidateQueries({ queryKey: SESSION_KEYS.detail(sessionId) });
  };
}

export function useInvalidateAllSessions() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: SESSION_KEYS.all() });
  };
}
```

### 4. Error Handling Strategies

#### Silent Errors for Expected Cases

```typescript
// Profile by username - handle not found gracefully
queryFn: async () => {
  try {
    return await profileService.getProfileByUsername(username);
  } catch (error: any) {
    if (error?.message?.includes('not found')) {
      return null; // Expected error, return null
    }
    throw error; // Unexpected error, rethrow
  }
},
retry: false, // Don't retry expected errors
```

#### Idempotent Operations

```typescript
// Like comment - handle "already liked" gracefully
mutationFn: async ({ commentId, action }) => {
  try {
    await commentService.likeComment(commentId);
  } catch (error: any) {
    if (error.message.includes('Already liked')) {
      return; // Idempotent - treat as success
    }
    throw error;
  }
};
```

#### Conditional Queries

```typescript
// Only query when data is available
useQuery({
  queryKey: PROFILE_KEYS.isFollowing(currentUserId, targetUserId),
  queryFn: () => profileService.isFollowing(currentUserId, targetUserId),
  enabled: !!currentUserId && !!targetUserId && currentUserId !== targetUserId,
});
```

### 5. Infinite Query Pattern

Used for feed pagination:

```typescript
export function useFeedInfinite(
  currentUserId: string,
  filters: FeedFilters = {}
) {
  return useInfiniteQuery({
    queryKey: FEED_KEYS.list(currentUserId, filters),
    queryFn: ({ pageParam }) =>
      feedService.getFeed(currentUserId, filters, {
        limit: 20,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: lastPage =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: STANDARD_CACHE_TIMES.SHORT,
  });
}
```

---

## Code Organization

### Feature Structure

Every feature follows this consistent structure:

```
src/features/[feature]/
├── domain/              # Business entities and rules
├── services/            # Business logic (no React)
├── hooks/               # React Query boundary ⭐
│   ├── use[Feature].ts         # Query hooks
│   ├── use[Feature]Mutations.ts # Mutation hooks
│   └── index.ts               # Exports
├── components/          # Feature-specific UI
└── types/              # Feature-specific types
```

### Hook File Naming

Consistent patterns across all features:

- **Queries:** `use[Feature].ts` (e.g., `useGroups.ts`, `useSessions.ts`)
- **Mutations:** `use[Feature]Mutations.ts` (e.g., `useSessionMutations.ts`)
- **Specialized:** `use[Feature][Specific].ts` (e.g., `useGroupLeaderboard.ts`)
- **Exports:** `index.ts` re-exports all hooks

### Index Export Pattern

Every feature exports hooks via index:

```typescript
// src/features/sessions/hooks/index.ts
export * from './useSessions';
export * from './useSessionMutations';

// Usage in components:
import { useSession, useDeleteSession } from '@/features/sessions/hooks';
```

---

## Advanced Patterns

### 1. Hybrid State Management (Timer Feature)

The timer feature combines React Query (server state) with local state (client-side ticking):

```typescript
// useTimer.ts - Unified interface
export function useTimer() {
  // React Query for server state
  const { data: activeSession } = useActiveTimerQuery();

  // Local state for client-side countdown
  const clientState = useTimerState({
    activeSession,
    onAutoSave: () => saveActiveSessionMutation.mutate(),
  });

  return {
    // Server state
    activeTimer: activeSession,
    // Client state
    elapsedTime: clientState.elapsedSeconds,
    isRunning: clientState.isRunning,
    // Mutations
    startTimer,
    pauseTimer,
    // ...
  };
}
```

### 2. Domain Entity Adapters (Groups Feature)

Groups feature adapts domain entities to UI models:

```typescript
// useGroups.ts
function adaptDomainGroupToUI(domainGroup: DomainGroup): UIGroup {
  return {
    id: domainGroup.id,
    name: domainGroup.name,
    memberCount: domainGroup.getMemberCount(),
    adminUserIds: Array.from(domainGroup.adminUserIds),
    // ...
  };
}

export function useGroupDetails(groupId: string) {
  return useQuery({
    queryKey: GROUPS_KEYS.detail(groupId),
    queryFn: async () => {
      const domainGroup = await groupService.getGroupDetails(groupId);
      return domainGroup ? adaptDomainGroupToUI(domainGroup) : null;
    },
  });
}
```

### 3. Multiple Query Structures Handling

Sessions feature handles different feed query structures:

```typescript
queryClient.setQueriesData({ queryKey: ['feed'] }, (old: any) => {
  if (!old) return old;

  const updateFn = (session: any) => {
    /* ... */
  };

  // Handle array
  if (Array.isArray(old)) {
    return old.map(updateFn);
  }

  // Handle object with sessions
  if (old.sessions) {
    return { ...old, sessions: old.sessions.map(updateFn) };
  }

  // Handle infinite query pages
  if (old.pages) {
    return {
      ...old,
      pages: old.pages.map((page: any) => ({
        ...page,
        sessions: page.sessions.map(updateFn),
      })),
    };
  }

  return old;
});
```

---

## Identified Inconsistencies

### Minor Issues (Not Breaking)

1. **Mixed Feed Key Patterns:**
   - Most features use `FEATURE_KEYS.all()` pattern
   - Feed queries sometimes use `['feed']` directly instead of `FEED_KEYS.all()`
   - **Impact:** Low - still works correctly
   - **Recommendation:** Standardize to always use key factories

2. **Timer Query Location:**
   - Timer queries are in `/src/hooks/useTimerQuery.ts`
   - Should be in `/src/features/timer/hooks/` for consistency
   - **Impact:** Medium - breaks feature isolation pattern
   - **Recommendation:** Move to feature directory

3. **Context Type Handling:**
   - Some mutations properly type context: `useMutation<Result, Error, Variables, Context>`
   - Others use type guards: `if (context && 'previousData' in context)`
   - **Impact:** Low - both work, but inconsistent
   - **Recommendation:** Standardize on explicit Context types

4. **Variable Naming:**
   - Most use `queryClient.getQueriesData()` (plural)
   - Some use `queryClient.getQueryData()` (singular)
   - **Impact:** None - intentional (different methods)
   - **Note:** This is actually correct usage, not an inconsistency

---

## Strengths

### Architectural Excellence

1. **Clean Separation of Concerns**
   - Components never call services directly
   - Services have no React dependencies
   - Hooks are the only React Query boundary

2. **Type Safety**
   - Extensive TypeScript coverage
   - Generic service/hook types in `/src/lib/react-query/types.ts`
   - Proper error type handling

3. **Developer Experience**
   - Clear patterns across all features
   - Comprehensive JSDoc comments
   - Example usage in every hook
   - Consistent naming conventions

4. **Performance Optimization**
   - Appropriate stale times for different data types
   - Optimistic updates for better UX
   - Structural sharing enabled
   - Prefetching opportunities identified

5. **Testing Readiness**
   - Pure service functions easy to unit test
   - Hooks can be tested with React Testing Library
   - Mock-friendly architecture

---

## Recommendations

### High Priority

1. **No Major Issues Found** ✅
   - The architecture is solid and consistent
   - All patterns are being followed correctly
   - No breaking issues identified

### Medium Priority (Quality Improvements)

1. **Move Timer Queries to Feature Directory**

   ```
   From: /src/hooks/useTimerQuery.ts
   To:   /src/features/timer/hooks/useTimerQuery.ts
   ```

2. **Standardize Context Type Definitions**
   - Always define explicit context interfaces
   - Example template in documentation

3. **Add More Prefetching**
   - Implement hover prefetch on group links
   - Prefetch user profiles on hover
   - Documented in optimization section

### Low Priority (Nice to Have)

1. **Create Code Generator**
   - Script to generate feature hook boilerplate
   - Exists: `/scripts/dev/create-feature.js`
   - Could be enhanced with more templates

2. **Add React Query DevTools Check**
   - Ensure DevTools only in development
   - Already handled correctly

3. **Document Batched Invalidations**
   - Helper function exists: `batchInvalidate()`
   - Could use more examples

---

## Documentation Enhancements Made

### Updated: `/docs/architecture/CACHING_STRATEGY.md`

**New Sections Added:**

1. **Standard Query Key Patterns** (Lines 376-489)
   - Real examples from codebase
   - Pattern categories with code snippets
   - Entity detail, list, relationship, and lookup patterns

2. **Standard Cache Times** (Lines 493-543)
   - Cache time selection guide
   - Decision matrix table
   - Actual usage examples from codebase

3. **Mutation Patterns** (Lines 547-743)
   - Basic mutation with invalidation
   - Optimistic updates with rollback (full example)
   - Cascading invalidations
   - Helper hooks for invalidation

4. **Error Handling Patterns** (Lines 747-825)
   - Silent errors with fallbacks
   - Idempotent mutations
   - Conditional queries

5. **Infinite Query Patterns** (Lines 829-865)
   - Full implementation example
   - Usage in components

6. **Testing React Query Hooks** (Lines 869-903)
   - React Testing Library setup
   - Mock provider pattern

7. **Troubleshooting** (Lines 907-1092)
   - Common pitfalls (5 examples with solutions)
   - Debugging with DevTools
   - Performance optimization tips

**Total Addition:** ~750 lines of practical documentation

---

## Statistics

### Files Audited

- **Total Hook Files:** 39
- **Features with React Query:** 8 major features
- **Query Key Factories:** 8 (one per feature)
- **Mutation Hooks:** 16
- **Query Hooks:** 23
- **Lines of React Query Code:** ~3,000+

### Query Key Distribution

```
Feed:      5 key patterns
Sessions:  5 key patterns
Profile:   9 key patterns
Groups:    8 key patterns
Comments:  3 key patterns
Projects:  3 key patterns
Timer:     2 key patterns
Others:    10+ key patterns
```

### Cache Time Distribution

- **SHORT (1m):** Feed, Comments, Search
- **MEDIUM (5m):** Sessions, Leaderboards, Relationships
- **LONG (15m):** Profiles, Groups, Projects
- **VERY_LONG (1h):** Stats, Analytics

---

## Conclusion

Ambira's React Query implementation is **production-ready and well-architected**. The codebase demonstrates:

- ✅ Consistent patterns across 8 major features
- ✅ Sophisticated optimistic update handling
- ✅ Proper error handling for edge cases
- ✅ Type-safe query key management
- ✅ Appropriate cache time strategies
- ✅ Clean separation of concerns

**No breaking issues found.** Only minor recommendations for consistency improvements.

The enhanced documentation in `CACHING_STRATEGY.md` now provides:

- Complete query key conventions with real examples
- Comprehensive mutation patterns from actual code
- Troubleshooting guide for common pitfalls
- Performance optimization techniques

**Next Steps:**

1. Review and approve documentation enhancements
2. Consider implementing medium-priority recommendations
3. Share patterns with team for onboarding
