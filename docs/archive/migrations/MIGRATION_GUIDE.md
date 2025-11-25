# Migration Guide: React Query at Feature Boundaries

This guide helps you migrate from the current mixed caching patterns to the standardized approach with React Query at feature boundaries.

## Overview

**Goal**: Move all React Query usage to feature hooks, eliminating direct usage in components and the centralized `useCache.ts` file.

**Timeline**: Feature-by-feature migration to avoid breaking changes.

## Before and After

### Before (Current State)

```typescript
// Component with direct React Query usage ❌
import { useQuery } from '@tanstack/react-query';
import { firebaseApi } from '@/lib/firebaseApi';

function GroupPage({ groupId }: { groupId: string }) {
  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => firebaseApi.group.getGroup(groupId),
  });

  return <div>{group?.name}</div>;
}
```

```typescript
// Component with centralized hook ❌
import { useGroup } from '@/hooks/useCache';

function GroupPage({ groupId }: { groupId: string }) {
  const { data: group } = useGroup(groupId);

  return <div>{group?.name}</div>;
}
```

### After (Target State)

```typescript
// Component with feature hook ✅
import { useGroupDetails } from '@/features/groups/hooks';

function GroupPage({ groupId }: { groupId: string }) {
  const { data: group, isLoading, error } = useGroupDetails(groupId);

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return <div>{group?.name}</div>;
}
```

## Migration Steps by Feature

### Phase 1: Groups Feature (Example - COMPLETED)

#### Step 1: Create Feature Hooks

✅ Created `src/features/groups/hooks/useGroups.ts`
✅ Created `src/features/groups/hooks/useGroupMutations.ts`
✅ Created `src/features/groups/hooks/index.ts`

#### Step 2: Update Components

Find all components using group data:

```bash
# Find components using groups
grep -r "useGroup\|firebaseApi.group" src/app src/components --include="*.tsx"
```

**Migration example:**

```typescript
// BEFORE
import { useGroup, useUserGroups } from '@/hooks/useCache'
import { firebaseApi } from '@/lib/firebaseApi'

function GroupsPage() {
  const { data: userGroups } = useUserGroups(userId)

  const handleJoin = async (groupId: string) => {
    await firebaseApi.group.joinGroup(groupId, userId)
  }
}

// AFTER
import { useUserGroups, useJoinGroup } from '@/features/groups/hooks'

function GroupsPage() {
  const { data: userGroups, isLoading } = useUserGroups(userId)
  const joinMutation = useJoinGroup()

  const handleJoin = (groupId: string) => {
    joinMutation.mutate({ groupId, userId })
  }
}
```

### Phase 2: Feed Feature

#### Step 1: Create Service (if not exists)

✅ Already exists: `src/features/feed/services/FeedService.ts`

#### Step 2: Create Feature Hooks

```bash
# Create hooks directory
mkdir -p src/features/feed/hooks
```

Create `src/features/feed/hooks/useFeed.ts`:

```typescript
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { FeedService } from '../services/FeedService'

const feedService = new FeedService()

export const FEED_KEYS = {
  all: () => ['feed'] as const,
  lists: () => [...FEED_KEYS.all(), 'list'] as const,
  list: (filters: any) => [...FEED_KEYS.lists(), { filters }] as const,
}

export function useFeedSessions(currentUserId: string, filters?: any, options?: any) {
  return useInfiniteQuery({
    queryKey: FEED_KEYS.list(filters),
    queryFn: ({ pageParam }) =>
      feedService.getFeed(currentUserId, filters, {
        limit: 20,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  })
}
```

#### Step 3: Update Feed Component

```typescript
// BEFORE - src/components/Feed.tsx
import { useFeedSessions } from '@/hooks/useCache'

// AFTER
import { useFeedSessions } from '@/features/feed/hooks'
```

### Phase 3: Profile/User Feature

#### Step 1: Create Feature Structure

```bash
mkdir -p src/features/profile/hooks
```

#### Step 2: Create Profile Hooks

Create `src/features/profile/hooks/useProfile.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { ProfileService } from '../services/ProfileService'

const profileService = new ProfileService()

export const PROFILE_KEYS = {
  all: () => ['profile'] as const,
  details: () => [...PROFILE_KEYS.all(), 'detail'] as const,
  detail: (userId: string) => [...PROFILE_KEYS.details(), userId] as const,
  stats: (userId: string) => [...PROFILE_KEYS.detail(userId), 'stats'] as const,
  sessions: (userId: string) => [...PROFILE_KEYS.detail(userId), 'sessions'] as const,
}

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: PROFILE_KEYS.detail(userId),
    queryFn: () => profileService.getUserProfile(userId),
    staleTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!userId,
  })
}

export function useUserStats(userId: string) {
  return useQuery({
    queryKey: PROFILE_KEYS.stats(userId),
    queryFn: () => profileService.getUserStats(userId),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!userId,
  })
}
```

#### Step 3: Migrate User Queries from useCache.ts

Find and replace:

- `useUserProfile` → `import { useUserProfile } from '@/features/profile/hooks'`
- `useUserStats` → `import { useUserStats } from '@/features/profile/hooks'`
- `useUserSessions` → `import { useUserSessions } from '@/features/profile/hooks'`

### Phase 4: Sessions Feature

#### Step 1: Create Service

Create `src/features/sessions/services/SessionService.ts`:

```typescript
import { SessionRepository } from '@/infrastructure/firebase/repositories/SessionRepository'

export class SessionService {
  private readonly sessionRepo: SessionRepository

  constructor() {
    this.sessionRepo = new SessionRepository()
  }

  async getSession(sessionId: string) {
    return this.sessionRepo.findById(sessionId)
  }

  async createSession(data: CreateSessionData) {
    // Business logic
    return this.sessionRepo.create(data)
  }

  async deleteSession(sessionId: string) {
    return this.sessionRepo.delete(sessionId)
  }
}
```

#### Step 2: Create Hooks

Create `src/features/sessions/hooks/useSessions.ts`:

```typescript
export const SESSION_KEYS = {
  all: () => ['sessions'] as const,
  details: () => [...SESSION_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...SESSION_KEYS.details(), id] as const,
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: SESSION_KEYS.detail(sessionId),
    queryFn: () => sessionService.getSession(sessionId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

### Phase 5: Comments Feature

Similar pattern - create service, hooks, and migrate components.

### Phase 6: Projects Feature

Similar pattern - create service, hooks, and migrate components.

### Phase 7: Challenges Feature

Similar pattern - create service, hooks, and migrate components.

## Common Migration Patterns

### Pattern 1: Simple Query Migration

```typescript
// BEFORE
import { useCache } from '@/hooks/useCache'
const { data, isLoading } = useCache.useGroup(groupId)

// AFTER
import { useGroupDetails } from '@/features/groups/hooks'
const { data, isLoading } = useGroupDetails(groupId)
```

### Pattern 2: Mutation Migration

```typescript
// BEFORE
import { firebaseApi } from '@/lib/firebaseApi'

const handleUpdate = async () => {
  await firebaseApi.group.joinGroup(groupId, userId)
  // Manual cache invalidation
  queryClient.invalidateQueries(['groups'])
}

// AFTER
import { useJoinGroup } from '@/features/groups/hooks'

const joinMutation = useJoinGroup()

const handleUpdate = () => {
  joinMutation.mutate({ groupId, userId })
  // Cache invalidation handled automatically
}
```

### Pattern 3: Optimistic Updates

```typescript
// BEFORE - Component handles optimistic update
const handleSupport = async () => {
  // Manually update cache
  queryClient.setQueryData(['session', sessionId], (old: any) => ({
    ...old,
    supportCount: old.supportCount + 1,
  }))

  try {
    await firebaseApi.post.supportSession(sessionId)
  } catch (error) {
    // Manual rollback
    queryClient.invalidateQueries(['session', sessionId])
  }
}

// AFTER - Hook handles optimistic update
import { useSupportSession } from '@/features/sessions/hooks'

const supportMutation = useSupportSession()

const handleSupport = () => {
  supportMutation.mutate(sessionId)
  // Optimistic update and rollback handled in the hook
}
```

## Testing During Migration

### 1. Test Each Feature Migration

```typescript
// Example test for useGroupDetails
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGroupDetails } from '@/features/groups/hooks';

test('useGroupDetails fetches group data', async () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const { result } = renderHook(() => useGroupDetails('group-123'), { wrapper });

  expect(result.current.isLoading).toBe(true);

  await waitFor(() => {
    expect(result.current.data).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });
});
```

### 2. Integration Tests

Test that components work with new hooks:

```typescript
import { render, screen } from '@testing-library/react';
import GroupPage from '@/app/groups/[id]/page';

test('GroupPage displays group name', async () => {
  render(<GroupPage params={{ id: 'group-123' }} />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Test Group')).toBeInTheDocument();
  });
});
```

## Checklist for Each Feature

- [ ] Create service if it doesn't exist
- [ ] Create `hooks/use[Feature].ts` with query hooks
- [ ] Create `hooks/use[Feature]Mutations.ts` with mutation hooks
- [ ] Create `hooks/index.ts` for clean exports
- [ ] Define cache keys using hierarchical pattern
- [ ] Update all components importing old hooks
- [ ] Remove direct `firebaseApi` calls from components
- [ ] Add tests for new hooks
- [ ] Update existing component tests
- [ ] Mark old hooks as `@deprecated`

## Cleanup Phase

Once all features are migrated:

### 1. Remove Central useCache.ts

```bash
# Check if useCache is still imported anywhere
grep -r "from '@/hooks/useCache'" src/

# If no results, remove the file
rm src/hooks/useCache.ts
rm src/hooks/useMutations.ts
```

### 2. Add ESLint Rules

Add to `.eslintrc.js` to prevent regression:

```javascript
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "@/lib/firebaseApi",
            "importNames": ["firebaseApi"],
            "message": "Import from feature hooks instead: @/features/[feature]/hooks"
          },
          {
            "name": "@/hooks/useCache",
            "message": "Import from feature hooks instead: @/features/[feature]/hooks"
          }
        ],
        "patterns": [
          {
            "group": ["@tanstack/react-query"],
            "importNames": ["useQuery", "useMutation", "useInfiniteQuery"],
            "message": "React Query hooks should only be used in src/features/*/hooks/*"
          }
        ]
      }
    ]
  }
}
```

### 3. Update Documentation

Update README and other docs to reference the new pattern.

## FAQ

### Q: Can I use React Query in services?

**A: No.** Services should be pure TypeScript/JavaScript with no React dependencies. Only hooks can use React Query.

### Q: What if I need to share logic between features?

**A: Create a shared service** in `src/domain/services/` or `src/infrastructure/services/`, then call it from your feature hooks.

### Q: How do I handle cache invalidation across features?

**A: Export cache keys** from each feature's hooks and use them in other features:

```typescript
// In feature A's mutation
import { GROUPS_KEYS } from '@/features/groups/hooks'

onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.all() })
}
```

### Q: Should I create a hook for every service method?

**A: No.** Only create hooks for operations that components actually need. If a service method is only used internally by other services, it doesn't need a hook.

### Q: What about real-time listeners (onSnapshot)?

**A: Use a custom hook** that wraps onSnapshot and updates React Query cache:

```typescript
export function useGroupLiveUpdates(groupId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'groups', groupId), (snapshot) => {
      const group = snapshot.data()
      queryClient.setQueryData(GROUPS_KEYS.detail(groupId), group)
    })

    return unsubscribe
  }, [groupId, queryClient])
}
```

## Resources

- [Caching Strategy Documentation](./CACHING_STRATEGY.md)
- [TanStack Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)
