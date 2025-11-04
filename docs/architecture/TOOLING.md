# Development Tooling for React Query Pattern

This document describes the development tools available to help you follow the standardized React Query at feature boundaries pattern.

## Available Tools

### 1. CLI Feature Scaffolder

**Location**: `scripts/create-feature.js`

Automatically generates the complete file structure for a new feature following the standardized pattern.

#### Usage

```bash
npm run create-feature <feature-name>
```

#### Example

```bash
npm run create-feature sessions
```

This creates:

```
src/features/sessions/
├── services/
│   └── SessionsService.ts         # Business logic service
├── hooks/
│   ├── useSessions.ts             # Query hooks
│   ├── useSessionsMutations.ts    # Mutation hooks
│   └── index.ts                   # Public API exports
├── types/
│   └── sessions.types.ts          # Feature-specific types
└── README.md                      # Feature documentation
```

#### What Gets Generated

**SessionsService.ts**:

- Complete service class structure
- CRUD operation methods
- Type definitions for create/update operations
- JSDoc comments

**useSessions.ts**:

- Cache key factory with hierarchical structure
- Query hooks for common operations (getById, getByUser, etc.)
- Proper TypeScript types
- JSDoc examples

**useSessionsMutations.ts**:

- Create, update, delete mutation hooks
- Optimistic update implementations
- Proper cache invalidation
- Invalidation helper hooks

**index.ts**:

- Clean public API
- Organized exports for queries and mutations

**types file**:

- Placeholder for feature-specific types
- Example interfaces

#### After Scaffolding

Follow the TODO list in the generated README:

1. Create the Repository in `src/infrastructure/firebase/repositories/`
2. Create the Entity in `src/domain/entities/`
3. Implement the service methods
4. Customize the hooks as needed
5. Add tests
6. Update components to use the new hooks

### 2. VSCode Snippets

**Location**: `.vscode/react-query-feature.code-snippets`

Pre-configured code snippets for common patterns.

#### Available Snippets

| Prefix           | Description                                   |
| ---------------- | --------------------------------------------- |
| `rq-query`       | Feature query hook                            |
| `rq-mutation`    | Feature mutation hook with optimistic updates |
| `rq-keys`        | Hierarchical cache keys                       |
| `rq-service`     | Feature service class                         |
| `rq-hooks-index` | Hooks index file                              |
| `rq-infinite`    | Infinite query hook for pagination            |
| `rq-component`   | Component using feature hooks                 |

#### Usage Example

1. Create a new file: `src/features/groups/hooks/useGroups.ts`
2. Type `rq-query` and press Tab
3. Fill in the placeholders
4. Get a complete, properly-typed query hook

#### Snippet: `rq-query`

```typescript
// Type: rq-query [Tab]

// Generates:
import { useQuery } from '@tanstack/react-query';
import { FeatureService } from '../services/FeatureService';
import type { QueryOptions } from '@/lib/react-query';
import { STANDARD_CACHE_TIMES } from '@/lib/react-query';

const featureService = new FeatureService();

/**
 * Get description
 *
 * @example
 * const { data, isLoading, error } = useHookName(param);
 */
export function useHookName(
  param: ParamType,
  options?: QueryOptions<ReturnType>
) {
  return useQuery<ReturnType, Error>({
    queryKey: FEATURE_KEYS.keyName(param),
    queryFn: () => featureService.methodName(param),
    staleTime: STANDARD_CACHE_TIMES.LONG,
    enabled: !!param,
    ...options,
  });
}
```

#### Snippet: `rq-mutation`

```typescript
// Type: rq-mutation [Tab]

// Generates a complete mutation hook with:
// - Optimistic updates
// - Error rollback
// - Cache invalidation
// - Proper TypeScript types
```

#### Snippet: `rq-component`

```typescript
// Type: rq-component [Tab]

// Generates a component with:
// - Query and mutation hooks
// - Loading/error states
// - Event handlers
// - Proper TypeScript types
```

### 3. TypeScript Utilities

**Location**: `src/lib/react-query/`

Reusable TypeScript types and helper functions.

#### Types (`types.ts`)

```typescript
import type { QueryOptions, MutationOptions } from '@/lib/react-query';

// Use in your hooks for consistent typing
export function useGroupDetails(
  groupId: string,
  options?: QueryOptions<Group | null>
) {
  // ...
}
```

Available types:

- `QueryOptions<TData>` - Standard query options
- `MutationOptions<TData, TVariables>` - Standard mutation options
- `CacheKeyFactory` - Cache key factory pattern
- `ServiceMethod<TReturn, TParams>` - Service method type
- `ServiceParams<T>` - Extract params from service method
- `ServiceReturn<T>` - Extract return type from service method

#### Constants

```typescript
import { STANDARD_CACHE_TIMES } from '@/lib/react-query';

// Use standard cache times
staleTime: STANDARD_CACHE_TIMES.LONG, // 15 minutes
```

Available constants:

- `REAL_TIME` - 30 seconds
- `SHORT` - 1 minute
- `MEDIUM` - 5 minutes
- `LONG` - 15 minutes
- `VERY_LONG` - 1 hour
- `INFINITE` - Never expires

#### Helper Functions (`helpers.ts`)

**createCacheKeyFactory**:

```typescript
import { createCacheKeyFactory } from '@/lib/react-query';

export const GROUPS_KEYS = createCacheKeyFactory('groups', {
  lists: () => [],
  list: (filters?: string) => [{ filters }],
  details: () => [],
  detail: (id: string) => [id],
});

// Results in proper hierarchical keys:
// ['groups']
// ['groups', 'list']
// ['groups', 'list', { filters: 'active' }]
// ['groups', 'detail']
// ['groups', 'detail', '123']
```

**createOptimisticUpdate**:

```typescript
import { createOptimisticUpdate } from '@/lib/react-query';

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userId }) =>
      groupService.joinGroup(groupId, userId),
    ...createOptimisticUpdate(
      queryClient,
      ({ groupId }) => GROUPS_KEYS.detail(groupId),
      (old: Group, { userId }) => ({
        ...old,
        memberIds: [...old.memberIds, userId],
      })
    ),
  });
}
```

**batchInvalidate**:

```typescript
import { batchInvalidate } from '@/lib/react-query';

onSuccess: (_, variables) => {
  batchInvalidate(queryClient, [
    GROUPS_KEYS.detail(variables.groupId),
    GROUPS_KEYS.userGroups(variables.userId),
    FEED_KEYS.all(),
  ]);
};
```

**prefetchQuery**:

```typescript
import { prefetchQuery } from '@/lib/react-query';

export function usePrefetchGroup() {
  const queryClient = useQueryClient();

  return (groupId: string) => {
    prefetchQuery(
      queryClient,
      GROUPS_KEYS.detail(groupId),
      () => groupService.getGroupDetails(groupId),
      { staleTime: 15 * 60 * 1000 }
    );
  };
}
```

Other helpers:

- `createInvalidator` - Create invalidation helper
- `isCached` - Check if data is cached and fresh
- `getCachedData` - Get cached data without triggering fetch
- `setCachedData` - Manually set cached data

### 4. ESLint Rules

**Location**: `.eslintrc.react-query-rules.js`

Enforce the standardized pattern with linting rules.

#### Setup

Add to your `.eslintrc.js`:

```javascript
module.exports = {
  ...require('./.eslintrc.react-query-rules.js'),
  // ... rest of your config
};
```

#### What It Enforces

**1. No Direct firebaseApi in Components**:

```typescript
// ❌ Will fail linting
import { firebaseApi } from '@/lib/firebaseApi';

function MyComponent() {
  const data = await firebaseApi.group.getGroup(id);
}
```

```typescript
// ✅ Correct
import { useGroupDetails } from '@/features/groups/hooks';

function MyComponent({ id }) {
  const { data } = useGroupDetails(id);
}
```

**2. No React Query in Components**:

```typescript
// ❌ Will fail linting in components
import { useQuery } from '@tanstack/react-query';

function MyComponent() {
  const { data } = useQuery({...});
}
```

```typescript
// ✅ Correct
import { useGroupDetails } from '@/features/groups/hooks';

function MyComponent({ id }) {
  const { data } = useGroupDetails(id);
}
```

**3. No React in Services**:

```typescript
// ❌ Will fail linting in services
import { useState } from 'react';

export class GroupService {
  // Services must be pure TypeScript
}
```

**4. Deprecation Warnings**:

```typescript
// ⚠️ Will warn
import { useGroup } from '@/hooks/useCache';

// Suggests:
// Use feature-specific hooks instead: @/features/groups/hooks
```

#### Excluded Files

The rules are smart and don't apply to:

- Feature hooks (`src/features/*/hooks/**`)
- React Query utilities (`src/lib/react-query/**`)
- Layout files that need QueryClientProvider

## Quick Start Workflow

### Creating a New Feature

1. **Scaffold the feature**:

   ```bash
   npm run create-feature sessions
   ```

2. **Create the repository** (data access layer):

   ```typescript
   // src/infrastructure/firebase/repositories/SessionRepository.ts
   export class SessionRepository {
     async findById(id: string): Promise<Session | null> {
       // Firebase operations
     }
   }
   ```

3. **Create the entity** (domain model):

   ```typescript
   // src/domain/entities/Session.ts
   export class Session {
     constructor(public readonly id: string /* ... */) {}
   }
   ```

4. **Implement service methods** (business logic):

   ```typescript
   // src/features/sessions/services/SessionService.ts
   async getSession(id: string): Promise<Session | null> {
     // Add business validation
     return this.sessionRepo.findById(id);
   }
   ```

5. **Customize hooks** (as needed):
   - Adjust cache times
   - Add custom query/mutation hooks
   - Implement specific optimistic updates

6. **Update components**:

   ```typescript
   import { useSession } from '@/features/sessions/hooks';

   function SessionView({ id }) {
     const { data, isLoading } = useSession(id);
     // ...
   }
   ```

### Adding a Hook to Existing Feature

1. **Use the snippet**:
   - Type `rq-query` or `rq-mutation`
   - Fill in placeholders

2. **Export from index**:

   ```typescript
   // src/features/sessions/hooks/index.ts
   export { useNewHook } from './useSessions';
   ```

3. **Use in components**:
   ```typescript
   import { useNewHook } from '@/features/sessions/hooks';
   ```

## Testing Utilities

### Service Tests (Pure TypeScript)

```typescript
// No special utilities needed - pure functions!
describe('GroupService', () => {
  it('validates business rules', async () => {
    const service = new GroupService();
    await expect(
      service.joinGroup('group-id', 'already-member')
    ).rejects.toThrow('Already a member');
  });
});
```

### Hook Tests (React Testing Library)

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGroupDetails } from '@/features/groups/hooks';

test('useGroupDetails fetches group data', async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const { result } = renderHook(
    () => useGroupDetails('group-123'),
    { wrapper }
  );

  expect(result.current.isLoading).toBe(true);

  await waitFor(() => {
    expect(result.current.data).toBeDefined();
  });
});
```

### Component Tests (Mock Hooks)

```typescript
import { render, screen } from '@testing-library/react';

jest.mock('@/features/groups/hooks', () => ({
  useGroupDetails: () => ({
    data: { id: '123', name: 'Test Group' },
    isLoading: false,
    error: null,
  }),
}));

test('renders group name', () => {
  render(<GroupPage groupId="123" />);
  expect(screen.getByText('Test Group')).toBeInTheDocument();
});
```

## Best Practices

### 1. Always Use the Scaffolder

Don't create files manually - use the scaffolder to ensure consistency:

```bash
npm run create-feature my-new-feature
```

### 2. Use Snippets for Individual Hooks

When adding to an existing feature, use the snippets:

- `rq-query` for queries
- `rq-mutation` for mutations

### 3. Import from Utilities

```typescript
// ✅ Good
import { QueryOptions, STANDARD_CACHE_TIMES } from '@/lib/react-query';

// ❌ Bad
import { UseQueryOptions } from '@tanstack/react-query';
const LONG = 15 * 60 * 1000;
```

### 4. Enable ESLint Rules

Add the rules to catch mistakes early:

```javascript
// .eslintrc.js
module.exports = {
  ...require('./.eslintrc.react-query-rules.js'),
};
```

### 5. Use Helper Functions

Don't rewrite common patterns:

```typescript
// ✅ Good
import { createOptimisticUpdate } from '@/lib/react-query';

const optimistic = createOptimisticUpdate(/* ... */);

// ❌ Bad
onMutate: async variables => {
  // 30 lines of boilerplate...
};
```

## Troubleshooting

### Scaffolder Issues

**Problem**: `npm run create-feature` doesn't work

**Solution**: Ensure the script is executable:

```bash
chmod +x scripts/create-feature.js
```

**Problem**: Feature already exists error

**Solution**: The feature directory already exists. Either:

- Delete the existing directory
- Use a different name
- Manually update the existing feature

### Snippet Issues

**Problem**: Snippets don't appear

**Solution**:

1. Ensure VSCode is using the workspace
2. Reload VSCode window
3. Check `.vscode/react-query-feature.code-snippets` exists

**Problem**: Wrong placeholders after Tab

**Solution**: Use Tab to cycle through placeholders, Shift+Tab to go back

### ESLint Issues

**Problem**: Rules not applying

**Solution**: Ensure rules are merged into `.eslintrc.js` and restart ESLint server

**Problem**: Too many errors

**Solution**: The rules are strict by design. Migrate features gradually to avoid overwhelm.

## Resources

- [Main Architecture Documentation](./README.md)
- [Caching Strategy](./CACHING_STRATEGY.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Examples](./EXAMPLES.md)
