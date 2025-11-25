# Architecture Documentation

This directory contains architecture documentation for the Ambira codebase, with a focus on the standardized caching pattern using React Query at feature boundaries.

## Quick Start

**New to the codebase?** Start here:

1. Read [CACHING_STRATEGY.md](./CACHING_STRATEGY.md) - Understand the architecture and principles
2. Review [EXAMPLES.md](./EXAMPLES.md) - See complete implementations
3. Follow [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) when adding new features

## Documents

### Core Architecture

#### [CACHING_STRATEGY.md](./CACHING_STRATEGY.md)

**The definitive guide to our caching architecture.**

Covers:

- Architecture layers and responsibilities
- Where React Query should (and shouldn't) be used
- Key principles and design patterns
- Benefits and anti-patterns
- Cache key conventions

**Read this first** to understand the "why" behind the pattern.

#### [EXAMPLES.md](./EXAMPLES.md)

**Real-world, complete implementations.**

Shows:

- Full stack example (Component → Hook → Service → Repository)
- Infinite scroll with React Query
- Optimistic updates for mutations
- Error handling patterns
- Loading states

**Use this as a reference** when implementing new features.

### Context Elimination Strategy (NEW)

#### [CONTEXT_ELIMINATION_SUMMARY.md](./CONTEXT_ELIMINATION_SUMMARY.md) ⭐

**Executive summary for eliminating global Context providers.**

Quick overview:

- Current state analysis (5 global providers)
- Target architecture (React Query at feature boundaries)
- Migration priority matrix
- Week-by-week action plan
- Risk mitigation strategies

**Start here** for a high-level understanding of the context migration strategy.

#### [CONTEXT_ELIMINATION_STRATEGY.md](./CONTEXT_ELIMINATION_STRATEGY.md)

**Comprehensive 200+ page strategy document.**

Deep dive into:

- Provider inventory and dependencies (AuthContext, TimerContext, etc.)
- Consumption pattern analysis (199+ files affected)
- Phased migration approach (6 weeks, 44 hours)
- Technical implementation patterns
- Risk assessment and mitigation
- Rollback strategies for each phase

**Use this** for detailed implementation guidance during the migration.

#### [CONTEXT_ELIMINATION_DIAGRAMS.md](./CONTEXT_ELIMINATION_DIAGRAMS.md)

**Visual diagrams and flowcharts.**

Visualizations:

- Before/after architecture diagrams
- Data flow transformations
- Phase-by-phase migration visualizations
- Dependency graphs
- Performance impact comparisons

**Review this** for visual understanding of the architecture transformation.

### Migration & Implementation

#### [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

**Step-by-step migration instructions.**

Includes:

- Before/after code examples
- Feature-by-feature migration plan
- Testing strategies
- Cleanup checklist
- FAQ for common scenarios

**Follow this guide** when refactoring existing code.

#### [MIGRATION_STATUS.md](./MIGRATION_STATUS.md)

**Current migration progress tracking.**

Tracks:

- Completed migrations
- In-progress work
- Planned migrations
- Blockers and dependencies

**Check this** to see where we are in the migration journey.

### Tools & Utilities

#### [TOOLING.md](./TOOLING.md)

**Development tools and utilities.**

Includes:

- CLI feature scaffolder (`npm run create-feature`)
- VSCode snippets for common patterns
- TypeScript utilities and helpers
- ESLint rules to enforce patterns
- Testing utilities
- Best practices

**Use these tools** to speed up development and ensure consistency.

#### [SUMMARY.md](./SUMMARY.md)

**Implementation summary and status.**

Provides:

- Overview of what was delivered
- Current implementation status
- Migration path
- Success metrics
- Next steps

**Read this** for a high-level overview.

## Quick Start for Context Migration

**Want to eliminate global Context providers?**

1. 📖 Read [CONTEXT_ELIMINATION_SUMMARY.md](./CONTEXT_ELIMINATION_SUMMARY.md) (15 min read)
2. 🎯 Identify which phase applies to your work (Quick Wins, Timer, or Auth)
3. 📋 Follow the step-by-step guide in [CONTEXT_ELIMINATION_STRATEGY.md](./CONTEXT_ELIMINATION_STRATEGY.md)
4. 📊 Check [CONTEXT_ELIMINATION_DIAGRAMS.md](./CONTEXT_ELIMINATION_DIAGRAMS.md) for visual references

**Key Insight:** 50% of the migration is already done! NotificationsContext and ActivitiesContext are deprecated with React Query hooks in place.

### Context Migration Priority

| Priority | Provider             | Effort | Risk   | Start Here                                                                                      |
| -------- | -------------------- | ------ | ------ | ----------------------------------------------------------------------------------------------- |
| 🔥 **1** | NotificationsContext | 2h     | Low    | [Quick Wins](./CONTEXT_ELIMINATION_STRATEGY.md#phase-1-quick-wins-1-week-low-risk)              |
| 🔥 **2** | ActivitiesContext    | 4h     | Low    | [Quick Wins](./CONTEXT_ELIMINATION_STRATEGY.md#phase-1-quick-wins-1-week-low-risk)              |
| 🔥 **3** | TimerContext         | 8h     | Medium | [Timer Migration](./CONTEXT_ELIMINATION_STRATEGY.md#phase-2-timer-migration-1-week-medium-risk) |
| ⏰ **4** | AuthContext          | 24h    | High   | [Auth Migration](./CONTEXT_ELIMINATION_STRATEGY.md#phase-3-auth-migration-2-3-weeks-high-risk)  |
| ⏸️ **5** | ToastContext         | N/A    | N/A    | Optional (UI-only)                                                                              |

---

## Quick Reference

### Architecture Layers

```
Components (UI)
    ↓
Feature Hooks (React Query Boundary) ← ONLY place for useQuery/useMutation
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access)
    ↓
Firebase/Firestore
```

### File Organization

```
src/
├── features/
│   └── [feature]/
│       ├── domain/              # Business entities and rules
│       ├── hooks/               # React Query hooks (ONLY HERE)
│       │   ├── use[Feature].ts
│       │   ├── use[Feature]Mutations.ts
│       │   └── index.ts
│       ├── services/            # Business logic (no React)
│       │   └── [Feature]Service.ts
│       └── types/               # Feature-specific types
│
├── infrastructure/
│   └── firebase/
│       └── repositories/        # Data access layer
│
└── components/                  # Presentation only
```

### Do's and Don'ts

✅ **DO:**

- Use feature hooks in components
- Keep services pure (no React dependencies)
- Use hierarchical cache keys
- Implement optimistic updates in hooks
- Test each layer independently

❌ **DON'T:**

- Use `useQuery`/`useMutation` in components
- Call `firebaseApi` directly from components
- Mix business logic in hooks
- Mix React code in services
- Create circular dependencies between features

## Common Patterns

### 1. Query Hook

```typescript
// src/features/groups/hooks/useGroups.ts
export function useGroupDetails(groupId: string) {
  return useQuery({
    queryKey: GROUPS_KEYS.detail(groupId),
    queryFn: () => groupService.getGroupDetails(groupId),
    staleTime: 15 * 60 * 1000,
  })
}
```

### 2. Mutation Hook with Optimistic Update

```typescript
// src/features/groups/hooks/useGroupMutations.ts
export function useJoinGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, userId }) => groupService.joinGroup(groupId, userId),

    onMutate: async ({ groupId }) => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: GROUPS_KEYS.detail(groupId),
      })
      const previous = queryClient.getQueryData(GROUPS_KEYS.detail(groupId))
      queryClient.setQueryData(GROUPS_KEYS.detail(groupId), (old: any) => ({
        ...old,
        memberIds: [...old.memberIds, userId],
      }))
      return { previous }
    },

    onError: (_, { groupId }, context) => {
      // Rollback
      queryClient.setQueryData(GROUPS_KEYS.detail(groupId), context?.previous)
    },

    onSuccess: (_, { groupId }) => {
      // Invalidate
      queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.detail(groupId) })
    },
  })
}
```

### 3. Component Using Hooks

```typescript
// src/app/groups/[id]/page.tsx
import { useGroupDetails, useJoinGroup } from '@/features/groups/hooks';

export default function GroupPage({ params }: { params: { id: string } }) {
  const { data: group, isLoading } = useGroupDetails(params.id);
  const joinMutation = useJoinGroup();

  const handleJoin = () => {
    joinMutation.mutate({ groupId: params.id, userId: currentUser.id });
  };

  if (isLoading) return <Loading />;

  return (
    <div>
      <h1>{group?.name}</h1>
      <button onClick={handleJoin}>Join</button>
    </div>
  );
}
```

## Feature Implementation Checklist

When implementing a new feature:

- [ ] Create feature directory structure:
  - [ ] `src/features/[feature]/domain/` (if needed)
  - [ ] `src/features/[feature]/services/[Feature]Service.ts`
  - [ ] `src/features/[feature]/hooks/use[Feature].ts`
  - [ ] `src/features/[feature]/hooks/use[Feature]Mutations.ts`
  - [ ] `src/features/[feature]/hooks/index.ts`
  - [ ] `src/features/[feature]/types/` (if needed)

- [ ] Implement layers:
  - [ ] Repository (data access)
  - [ ] Service (business logic)
  - [ ] Query hooks (read operations)
  - [ ] Mutation hooks (write operations)

- [ ] Define cache keys using hierarchical pattern

- [ ] Add optimistic updates for better UX

- [ ] Write tests:
  - [ ] Service unit tests
  - [ ] Hook tests
  - [ ] Component integration tests

- [ ] Update components to use new hooks

## Migration Status

### ✅ Completed

- **Groups**: Full implementation with service, hooks, and examples

### 🔄 In Progress

- **Feed**: Service exists, needs hooks migration
- **Profile**: Service exists, needs hooks migration
- **Timer**: Service exists, needs hooks migration

### ⏳ Planned

- Sessions
- Comments
- Projects
- Challenges
- Streaks

## Testing Strategy

### Unit Tests (Services)

```typescript
// No React dependencies - easy to test
describe('GroupService', () => {
  it('should throw error when joining a group you already belong to', async () => {
    const service = new GroupService()
    await expect(service.joinGroup('group-123', 'user-456')).rejects.toThrow('Already a member')
  })
})
```

### Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGroupDetails } from '@/features/groups/hooks';

test('useGroupDetails fetches and caches group data', async () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(() => useGroupDetails('group-123'), { wrapper });

  await waitFor(() => {
    expect(result.current.data).toBeDefined();
  });
});
```

### Integration Tests (Components)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import GroupPage from '@/app/groups/[id]/page';

test('GroupPage allows user to join group', async () => {
  render(<GroupPage params={{ id: 'group-123' }} />);

  const joinButton = await screen.findByText('Join Group');
  fireEvent.click(joinButton);

  await waitFor(() => {
    expect(screen.getByText('Joining...')).toBeInTheDocument();
  });
});
```

## Performance Considerations

### Cache Configuration

Different data types need different cache times:

```typescript
const CACHE_TIMES = {
  REAL_TIME: 30 * 1000, // 30s - Real-time data
  SHORT: 1 * 60 * 1000, // 1m  - Feed, search results
  MEDIUM: 5 * 60 * 1000, // 5m  - Session details, comments
  LONG: 15 * 60 * 1000, // 15m - User profiles, groups
  VERY_LONG: 60 * 60 * 1000, // 1h  - Stats, analytics
}
```

### Optimistic Updates

Use optimistic updates for instant feedback:

- ✅ Likes/supports (can be rolled back)
- ✅ Follows (can be rolled back)
- ✅ Join/leave groups (can be rolled back)
- ❌ Payments (must confirm first)
- ❌ Account deletion (must confirm first)

### Prefetching

Prefetch data for better UX:

```typescript
// Prefetch group details when hovering over link
<Link
  href={`/groups/${group.id}`}
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: GROUPS_KEYS.detail(group.id),
      queryFn: () => groupService.getGroupDetails(group.id),
    });
  }}
>
  {group.name}
</Link>
```

## Troubleshooting

### Cache not updating after mutation

**Problem**: Data doesn't update after a successful mutation.

**Solution**: Ensure you're invalidating the correct cache keys:

```typescript
onSuccess: (_, { groupId }) => {
  // Invalidate specific group
  queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.detail(groupId) })

  // Invalidate all groups lists
  queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.lists() })
}
```

### Stale data shown

**Problem**: Old data is shown even though it should have updated.

**Solution**: Check your `staleTime` configuration. Lower values mean more frequent refetches:

```typescript
return useQuery({
  queryKey: GROUPS_KEYS.detail(groupId),
  queryFn: () => groupService.getGroupDetails(groupId),
  staleTime: 5 * 60 * 1000, // Adjust based on data freshness needs
})
```

### Too many network requests

**Problem**: Excessive API calls to Firebase.

**Solution**:

1. Increase `staleTime` for less frequently changing data
2. Use `enabled` option to prevent unnecessary queries
3. Check if you're creating new query keys on each render

```typescript
// ❌ BAD - Creates new object on each render
queryKey: ['groups', { filter: 'active' }]

// ✅ GOOD - Stable reference
queryKey: GROUPS_KEYS.list('active')
```

## Resources

### External Documentation

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

### Internal Documentation

- [Project README](../../README.md)
- [CLAUDE.md](../../CLAUDE.md)

## Questions?

If you have questions about this architecture:

1. Check the [FAQ in MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md#faq)
2. Review the [examples](./EXAMPLES.md)
3. Look for similar patterns in existing features (Groups feature is the reference)
4. Ask the team!

## Contributing

When making changes to this architecture:

1. Update relevant documentation
2. Add examples for new patterns
3. Update migration guide if needed
4. Ensure changes align with core principles
