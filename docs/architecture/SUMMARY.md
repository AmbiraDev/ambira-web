# React Query at Feature Boundaries - Implementation Summary

## What Was Done

A comprehensive standardized caching pattern has been designed and documented for Ambira, moving from mixed React Query usage to a clean architecture with **React Query at feature boundaries only**.

## Deliverables

### 1. Architecture Documentation

**📂 Location**: `/docs/architecture/`

#### Core Documents Created:

1. **[README.md](./README.md)** - Central hub with quick reference and navigation
2. **[CACHING_STRATEGY.md](./CACHING_STRATEGY.md)** - Complete architecture specification
3. **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Step-by-step migration instructions
4. **[EXAMPLES.md](./EXAMPLES.md)** - Real-world complete implementations
5. **[SUMMARY.md](./SUMMARY.md)** - This document

### 2. Reference Implementation

**📂 Location**: `/src/features/groups/hooks/`

A complete Groups feature implementation demonstrating the pattern:

- ✅ `useGroups.ts` - Query hooks with hierarchical cache keys
- ✅ `useGroupMutations.ts` - Mutation hooks with optimistic updates
- ✅ `index.ts` - Clean public API
- ✅ Updated `useGroupDetails.ts` - Backwards-compatible wrapper with deprecation notice

### 3. Updated Project Documentation

- ✅ Updated `CLAUDE.md` to reference architecture docs
- ✅ Maintained backwards compatibility during transition

## Architecture Overview

### The Pattern

```
┌─────────────────────────────────────────────────────────────┐
│  Components (Presentation)                                   │
│  - Pure UI logic                                             │
│  - NO React Query                                            │
│  - NO firebaseApi                                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Feature Hooks (React Query Boundary) ★                      │
│  - ONLY place for useQuery/useMutation                       │
│  - Cache management                                          │
│  - Optimistic updates                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Services (Business Logic)                                   │
│  - Pure TypeScript                                           │
│  - No React dependencies                                     │
│  - Testable without React                                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Repositories (Data Access)                                  │
│  - Firebase operations                                       │
│  - Data transformation                                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Benefits

1. **Clear Separation of Concerns**
   - Each layer has single responsibility
   - Easy to reason about code flow

2. **Better Testability**
   - Services testable without React
   - Hooks testable with React Testing Library
   - Components testable with mocked hooks

3. **Improved Maintainability**
   - Changes isolated to appropriate layer
   - Predictable patterns across features

4. **Enhanced Performance**
   - Centralized cache management
   - Optimistic updates for instant feedback
   - Intelligent invalidation strategies

## File Structure

### Current State

```
src/
├── features/
│   ├── feed/
│   │   └── services/FeedService.ts ✅
│   ├── groups/
│   │   ├── domain/LeaderboardCalculator.ts ✅
│   │   ├── hooks/
│   │   │   ├── useGroups.ts ✅ NEW
│   │   │   ├── useGroupMutations.ts ✅ NEW
│   │   │   ├── useGroupDetails.ts ✅ UPDATED (backwards compatible)
│   │   │   └── index.ts ✅ NEW
│   │   ├── services/GroupService.ts ✅
│   │   └── types/groups.types.ts ✅
│   ├── profile/
│   │   └── services/ProfileService.ts ✅
│   └── timer/
│       └── services/TimerService.ts ✅
│
├── hooks/
│   ├── useCache.ts ⚠️ TO BE DEPRECATED
│   └── useMutations.ts ⚠️ TO BE DEPRECATED
│
└── docs/
    └── architecture/
        ├── README.md ✅ NEW
        ├── CACHING_STRATEGY.md ✅ NEW
        ├── MIGRATION_GUIDE.md ✅ NEW
        ├── EXAMPLES.md ✅ NEW
        └── SUMMARY.md ✅ NEW
```

## Implementation Details

### 1. Hierarchical Cache Keys

Using TanStack Query's recommended pattern:

```typescript
export const GROUPS_KEYS = {
  all: () => ['groups'] as const,
  lists: () => [...GROUPS_KEYS.all(), 'list'] as const,
  list: (filters?: string) => [...GROUPS_KEYS.lists(), { filters }] as const,
  details: () => [...GROUPS_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...GROUPS_KEYS.details(), id] as const,
  leaderboard: (groupId: string, period: TimePeriod) =>
    [...GROUPS_KEYS.detail(groupId), 'leaderboard', period] as const,
};
```

**Benefits**:
- Efficient invalidation (invalidate all with `GROUPS_KEYS.all()`)
- Granular control (invalidate specific detail with `GROUPS_KEYS.detail(id)`)
- Type-safe with TypeScript

### 2. Optimistic Updates

Example from `useGroupMutations.ts`:

```typescript
export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userId }) => groupService.joinGroup(groupId, userId),

    onMutate: async ({ groupId, userId }) => {
      // 1. Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: GROUPS_KEYS.detail(groupId) });

      // 2. Snapshot for rollback
      const previousGroup = queryClient.getQueryData(GROUPS_KEYS.detail(groupId));

      // 3. Optimistic update
      queryClient.setQueryData(GROUPS_KEYS.detail(groupId), (old: any) => ({
        ...old,
        memberIds: [...old.memberIds, userId],
      }));

      return { previousGroup };
    },

    onError: (_, { groupId }, context) => {
      // 4. Rollback on error
      if (context?.previousGroup) {
        queryClient.setQueryData(GROUPS_KEYS.detail(groupId), context.previousGroup);
      }
    },

    onSuccess: (_, { groupId }) => {
      // 5. Invalidate for fresh data
      queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.detail(groupId) });
    },
  });
}
```

### 3. Cache Time Configuration

Different data types get different cache times:

```typescript
const CACHE_TIMES = {
  SHORT: 1 * 60 * 1000,      // 1m  - Feed, frequently changing
  MEDIUM: 5 * 60 * 1000,     // 5m  - Sessions, comments
  LONG: 15 * 60 * 1000,      // 15m - Groups, user profiles
  VERY_LONG: 60 * 60 * 1000, // 1h  - Stats, analytics
};
```

### 4. Backwards Compatibility

Old `useGroupDetails` hook updated to wrap new implementation:

```typescript
/**
 * @deprecated Use the new React Query hooks from './useGroups' instead
 */
export function useGroupDetails(groupId: string) {
  const { data, isLoading, error, refetch } = useGroupDetailsNew(groupId);

  return {
    group: data,      // Old API
    isLoading,
    error,
    refetch,
  };
}
```

This allows gradual migration without breaking existing code.

## Migration Path

### Phase 1: Groups (COMPLETED ✅)
- ✅ Service already exists
- ✅ Created query hooks (`useGroups.ts`)
- ✅ Created mutation hooks (`useGroupMutations.ts`)
- ✅ Backwards-compatible wrapper
- ⏳ Need to update components to use new hooks

### Phase 2: Feed
- ✅ Service exists (`FeedService`)
- ⏳ Create `src/features/feed/hooks/useFeed.ts`
- ⏳ Migrate from `useCache.ts`

### Phase 3: Profile/User
- ✅ Service exists (`ProfileService`)
- ⏳ Create `src/features/profile/hooks/useProfile.ts`
- ⏳ Migrate user queries from `useCache.ts`

### Phase 4+: Sessions, Comments, Projects, Challenges
- ⏳ Create services
- ⏳ Create hooks
- ⏳ Migrate from `useCache.ts`

### Final Phase: Cleanup
- ⏳ Remove `src/hooks/useCache.ts`
- ⏳ Remove `src/hooks/useMutations.ts`
- ⏳ Add ESLint rules to prevent regression

## Usage Examples

### Before (Current State - Mixed Patterns)

```typescript
// Component with direct React Query ❌
import { useQuery } from '@tanstack/react-query';
import { firebaseApi } from '@/lib/firebaseApi';

function GroupPage({ groupId }) {
  const { data } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => firebaseApi.group.getGroup(groupId),
  });
}
```

```typescript
// Component with centralized hook ❌
import { useGroup } from '@/hooks/useCache';

function GroupPage({ groupId }) {
  const { data: group } = useGroup(groupId);
}
```

### After (Target State - Feature Boundaries)

```typescript
// Component with feature hook ✅
import { useGroupDetails, useJoinGroup } from '@/features/groups/hooks';

function GroupPage({ groupId, userId }) {
  const { data: group, isLoading, error } = useGroupDetails(groupId);
  const joinMutation = useJoinGroup();

  const handleJoin = () => {
    joinMutation.mutate({ groupId, userId });
  };

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <h1>{group?.name}</h1>
      <button onClick={handleJoin} disabled={joinMutation.isPending}>
        Join Group
      </button>
    </div>
  );
}
```

## Testing Strategy

### 1. Service Tests (No React)

```typescript
describe('GroupService', () => {
  it('prevents duplicate membership', async () => {
    const service = new GroupService();
    await expect(
      service.joinGroup('group-123', 'existing-member')
    ).rejects.toThrow('Already a member');
  });
});
```

### 2. Hook Tests (With React Query)

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useGroupDetails } from '@/features/groups/hooks';

test('useGroupDetails fetches and caches data', async () => {
  const { result } = renderHook(() => useGroupDetails('group-123'), {
    wrapper: QueryClientProvider,
  });

  await waitFor(() => {
    expect(result.current.data).toBeDefined();
  });
});
```

### 3. Component Tests (With Mocked Hooks)

```typescript
jest.mock('@/features/groups/hooks', () => ({
  useGroupDetails: () => ({
    data: mockGroup,
    isLoading: false,
    error: null,
  }),
}));

test('GroupPage displays group name', () => {
  render(<GroupPage groupId="group-123" />);
  expect(screen.getByText('Test Group')).toBeInTheDocument();
});
```

## Next Steps

### Immediate Actions

1. **Review Documentation**
   - Read [CACHING_STRATEGY.md](./CACHING_STRATEGY.md) for principles
   - Review [EXAMPLES.md](./EXAMPLES.md) for implementation patterns
   - Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for step-by-step instructions

2. **Begin Migration**
   - Start with Feed feature (service already exists)
   - Follow the Groups implementation as reference
   - Update components one at a time

3. **Testing**
   - Add tests for new hooks as they're created
   - Ensure backwards compatibility during transition
   - Integration test components with new hooks

### Future Improvements

1. **ESLint Rules**
   - Prevent direct `firebaseApi` imports in components
   - Restrict React Query usage to feature hooks
   - Enforce file organization patterns

2. **Performance Monitoring**
   - Track cache hit rates
   - Monitor network request reduction
   - Measure perceived performance improvements

3. **Developer Experience**
   - Create CLI tool to scaffold new features
   - Generate feature structure automatically
   - Provide templates for common patterns

## Success Metrics

### Code Quality
- ✅ Single responsibility per layer
- ✅ Type safety throughout
- ✅ Testable at each layer
- ✅ Clear data flow

### Performance
- 🎯 Reduced Firestore reads (through caching)
- 🎯 Faster perceived performance (optimistic updates)
- 🎯 Better UX with instant feedback

### Developer Experience
- 🎯 Easier to find code (feature-based organization)
- 🎯 Easier to test (mocking at boundaries)
- 🎯 Easier to understand (predictable patterns)
- 🎯 Easier to maintain (isolated changes)

## Resources

### Documentation
- [Main Architecture README](./README.md)
- [Caching Strategy](./CACHING_STRATEGY.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Examples](./EXAMPLES.md)

### External Resources
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## Questions?

For questions or clarifications:
1. Check the [Migration Guide FAQ](./MIGRATION_GUIDE.md#faq)
2. Review the [Examples](./EXAMPLES.md)
3. Look at the Groups implementation
4. Ask the team!

---

**Status**: ✅ Architecture designed and documented
**Reference Implementation**: ✅ Groups feature complete
**Next Phase**: 🔄 Begin feature-by-feature migration
**Timeline**: Gradual migration, no breaking changes
