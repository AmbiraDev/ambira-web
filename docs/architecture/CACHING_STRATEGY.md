# Caching Strategy - React Query at Feature Boundaries

## Overview

This document defines the standardized caching pattern for Ambira using React Query at feature boundaries. The goal is to have a clear separation of concerns where React Query handles caching and state management ONLY at the boundary between UI components and business logic.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Components (Presentation)                                   │
│  - Pure presentation logic                                   │
│  - No direct React Query usage                               │
│  - No direct firebaseApi calls                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Feature Hooks (React Query Boundary) ★                      │
│  - useQuery/useMutation ONLY here                            │
│  - Cache key management                                      │
│  - Optimistic updates                                        │
│  - Cache invalidation                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Services (Business Logic)                                   │
│  - Pure business logic                                       │
│  - No React/hooks dependencies                               │
│  - Orchestrates repositories                                 │
│  - Domain service coordination                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Repositories (Data Access)                                  │
│  - Firebase/Firestore operations                             │
│  - Data transformation                                       │
│  - No business logic                                         │
└─────────────────────────────────────────────────────────────┘
```

## Key Principles

### 1. Single Responsibility

- **Feature Hooks**: Handle caching, loading states, error states via React Query
- **Services**: Pure business logic, testable without React
- **Repositories**: Data access only
- **Components**: Presentation only

### 2. React Query Boundary

React Query (useQuery, useMutation, useQueryClient) should ONLY be used in feature hooks:

- ✅ `src/features/[feature]/hooks/use[Feature].ts`
- ❌ Components
- ❌ Services
- ❌ Repositories

### 3. No Direct firebaseApi in Components

Components should never call `firebaseApi` directly:

- ❌ `import { firebaseApi } from '@/lib/firebaseApi'` in components
- ✅ Use feature hooks that call services

### 4. Feature Organization

```
src/features/[feature]/
├── domain/              # Domain entities and business rules
├── hooks/               # React Query hooks (ONLY place for useQuery/useMutation)
│   ├── use[Feature].ts
│   └── use[Feature]Mutations.ts
├── services/            # Business logic orchestration
│   └── [Feature]Service.ts
└── types/               # Feature-specific types
```

## Implementation Guide

### Step 1: Define Feature Service

Services contain pure business logic with no React dependencies:

```typescript
// src/features/groups/services/GroupService.ts
export class GroupService {
  private readonly groupRepo: GroupRepository;

  constructor() {
    this.groupRepo = new GroupRepository();
  }

  async getGroupDetails(groupId: string): Promise<Group | null> {
    return this.groupRepo.findById(groupId);
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    return this.groupRepo.findByMemberId(userId);
  }

  async joinGroup(groupId: string, userId: string): Promise<void> {
    // Business logic here
  }
}
```

### Step 2: Create Feature Hooks (React Query Boundary)

Feature hooks are THE ONLY place where React Query is used:

```typescript
// src/features/groups/hooks/useGroups.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GroupService } from '../services/GroupService';

const groupService = new GroupService();

// CACHE KEYS - Centralized per feature
const GROUPS_KEYS = {
  all: () => ['groups'] as const,
  lists: () => [...GROUPS_KEYS.all(), 'list'] as const,
  list: (filters: string) => [...GROUPS_KEYS.lists(), { filters }] as const,
  details: () => [...GROUPS_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...GROUPS_KEYS.details(), id] as const,
  userGroups: (userId: string) =>
    [...GROUPS_KEYS.all(), 'user', userId] as const,
};

// QUERIES
export function useGroupDetails(groupId: string) {
  return useQuery({
    queryKey: GROUPS_KEYS.detail(groupId),
    queryFn: () => groupService.getGroupDetails(groupId),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useUserGroups(userId: string) {
  return useQuery({
    queryKey: GROUPS_KEYS.userGroups(userId),
    queryFn: () => groupService.getUserGroups(userId),
    staleTime: 15 * 60 * 1000,
  });
}

// MUTATIONS
export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      groupService.joinGroup(groupId, userId),

    onSuccess: (_, variables) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({
        queryKey: GROUPS_KEYS.detail(variables.groupId),
      });
      queryClient.invalidateQueries({
        queryKey: GROUPS_KEYS.userGroups(variables.userId),
      });
    },
  });
}
```

### Step 3: Use Feature Hooks in Components

Components use hooks and focus on presentation:

```typescript
// src/app/groups/[id]/page.tsx
'use client';

import { useGroupDetails, useJoinGroup } from '@/features/groups/hooks/useGroups';

export default function GroupPage({ params }: { params: { id: string } }) {
  const { data: group, isLoading, error } = useGroupDetails(params.id);
  const joinMutation = useJoinGroup();

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  if (!group) return <NotFound />;

  const handleJoin = () => {
    joinMutation.mutate({
      groupId: params.id,
      userId: currentUser.id
    });
  };

  return (
    <div>
      <h1>{group.name}</h1>
      <button onClick={handleJoin}>Join Group</button>
    </div>
  );
}
```

## Migration Strategy

### Phase 1: Feature-by-Feature Migration

Migrate one feature at a time to avoid breaking changes:

1. **Groups** (already has service layer)
   - ✅ Service exists: `GroupService`
   - 🔄 Migrate `useGroupDetails.ts` to use React Query
   - 🔄 Create `useGroups.ts` and `useGroupMutations.ts`
   - 🔄 Update components to use new hooks

2. **Feed** (already has service layer)
   - ✅ Service exists: `FeedService`
   - 🔄 Create `src/features/feed/hooks/useFeed.ts`
   - 🔄 Migrate feed queries from `useCache.ts`

3. **Profile** (already has service layer)
   - ✅ Service exists: `ProfileService`
   - 🔄 Create `src/features/profile/hooks/useProfile.ts`
   - 🔄 Migrate user queries from `useCache.ts`

4. **Timer** (already has service layer)
   - ✅ Service exists: `TimerService`
   - 🔄 Create `src/features/timer/hooks/useTimer.ts`

5. **Sessions, Comments, Projects, etc.**
   - 🔄 Create services
   - 🔄 Create feature hooks
   - 🔄 Migrate from centralized `useCache.ts`

### Phase 2: Deprecate Central useCache.ts

Once all features are migrated:

1. Move remaining global hooks to appropriate features
2. Remove `src/hooks/useCache.ts`
3. Remove direct `firebaseApi` imports from components

### Phase 3: Enforce with Linting

Add ESLint rules to prevent:

- Direct `firebaseApi` imports in components
- `useQuery`/`useMutation` usage outside of feature hooks

```javascript
// .eslintrc.js
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "@/lib/firebaseApi",
            "importNames": ["firebaseApi"],
            "message": "Use feature hooks instead of direct firebaseApi calls"
          }
        ],
        "patterns": [
          {
            "group": ["@tanstack/react-query"],
            "importNames": ["useQuery", "useMutation", "useQueryClient"],
            "message": "React Query hooks should only be used in feature hooks (src/features/*/hooks/*)"
          }
        ]
      }
    ]
  }
}
```

## Benefits

1. **Clear Separation of Concerns**
   - Components focus on presentation
   - Services focus on business logic
   - Hooks focus on caching and state management

2. **Better Testability**
   - Services can be tested without React
   - Hooks can be tested with React Testing Library
   - Components can be tested with mocked hooks

3. **Easier to Reason About**
   - One place to look for React Query usage
   - Clear data flow
   - Predictable cache invalidation

4. **Improved Performance**
   - Centralized cache management per feature
   - Consistent cache keys
   - Optimistic updates in one place

5. **Type Safety**
   - Services define contracts
   - Hooks ensure type consistency
   - Components get typed data

## Anti-Patterns to Avoid

### ❌ React Query in Components

```typescript
// BAD - Don't do this
function MyComponent() {
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: () => firebaseApi.user.getUsers(),
  });
}
```

### ❌ Direct firebaseApi in Components

```typescript
// BAD - Don't do this
function MyComponent() {
  const handleClick = async () => {
    await firebaseApi.user.updateUser(id, data);
  };
}
```

### ❌ React Query in Services

```typescript
// BAD - Don't do this
class UserService {
  async getUser(id: string) {
    const queryClient = useQueryClient(); // ❌ Can't use hooks in services
  }
}
```

### ✅ Correct Pattern

```typescript
// GOOD - Feature hook
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUser(userId),
  });
}

// GOOD - Service
class UserService {
  async getUser(userId: string): Promise<User> {
    return userRepository.findById(userId);
  }
}

// GOOD - Component
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUser(userId);

  if (isLoading) return <Loading />;
  return <div>{user.name}</div>;
}
```

## Cache Key Convention

Use hierarchical keys for better invalidation:

```typescript
const FEATURE_KEYS = {
  all: () => ['feature'] as const,
  lists: () => [...FEATURE_KEYS.all(), 'list'] as const,
  list: (filters: string) => [...FEATURE_KEYS.lists(), { filters }] as const,
  details: () => [...FEATURE_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...FEATURE_KEYS.details(), id] as const,
};

// Examples:
// ['feature']
// ['feature', 'list']
// ['feature', 'list', { filters: 'active' }]
// ['feature', 'detail']
// ['feature', 'detail', '123']
```

This allows efficient invalidation:

- `queryClient.invalidateQueries({ queryKey: FEATURE_KEYS.all() })` - invalidates everything
- `queryClient.invalidateQueries({ queryKey: FEATURE_KEYS.lists() })` - invalidates all lists
- `queryClient.invalidateQueries({ queryKey: FEATURE_KEYS.detail(id) })` - invalidates one item

## References

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
