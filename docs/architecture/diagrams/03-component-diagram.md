# Component Diagram (C4 Level 3)

This diagram shows the internal component structure of a feature module, following the Clean Architecture pattern with React Query at feature boundaries.

```mermaid
graph TB
    %% User/Browser
    Browser([Browser])

    %% Page Layer
    subgraph PageLayer["Page Layer (src/app/)"]
        GroupPage[Group Detail Page<br/>src/app/groups/[id]/page.tsx<br/>Server Component]
    end

    %% Component Layer
    subgraph ComponentLayer["Component Layer"]
        GroupCard[Group Card Component<br/>Presentation Only]
        MemberList[Member List Component<br/>Presentation Only]
        JoinButton[Join Button Component<br/>Presentation Only]
    end

    %% Feature Hooks Layer (React Query Boundary)
    subgraph HooksLayer["Feature Hooks Layer ⭐<br/>React Query Boundary"]
        direction LR

        subgraph Queries["Query Hooks"]
            UseGroupDetails[useGroupDetails<br/>Fetches group data<br/>Cache key: groups.detail.id]
            UseGroupMembers[useGroupMembers<br/>Fetches members<br/>Cache key: groups.members.id]
            UseUserGroups[useUserGroups<br/>Fetches user's groups<br/>Cache key: groups.user.userId]
        end

        subgraph Mutations["Mutation Hooks"]
            UseJoinGroup[useJoinGroup<br/>Joins group<br/>Optimistic update]
            UseLeaveGroup[useLeaveGroup<br/>Leaves group<br/>Optimistic update]
            UseCreateGroup[useCreateGroup<br/>Creates group<br/>Cache invalidation]
        end

        CacheKeys[Cache Keys<br/>GROUPS_KEYS hierarchy<br/>groups / list / detail]
    end

    %% Service Layer
    subgraph ServiceLayer["Service Layer"]
        GroupService[GroupService<br/>Business Logic<br/>No React Dependencies]

        subgraph ServiceMethods["Service Methods"]
            GetGroupDetails[getGroupDetails]
            GetUserGroups[getUserGroups]
            JoinGroup[joinGroup]
            LeaveGroup[leaveGroup]
            CreateGroup[createGroup]
        end
    end

    %% Domain Layer
    subgraph DomainLayer["Domain Layer (Optional)"]
        GroupDomain[Group Domain Rules<br/>Validation, Business Rules]
        MembershipRules[Membership Rules<br/>Can join? Is admin?]
    end

    %% Repository Layer
    subgraph RepositoryLayer["Repository Layer"]
        GroupRepo[GroupRepository<br/>Data Access Only]

        subgraph RepoMethods["Repository Methods"]
            FindById[findById]
            FindByMemberId[findByMemberId]
            Create[create]
            Update[update]
            AddMember[addMember]
            RemoveMember[removeMember]
        end
    end

    %% Firebase/Infrastructure
    subgraph Infrastructure["Infrastructure"]
        FirestoreAPI[Firestore API<br/>firebase-admin<br/>@firebase/firestore]
        Collections[(Collections<br/>groups<br/>groupMembers)]
    end

    %% Shared Infrastructure
    subgraph SharedInfra["Shared Infrastructure"]
        FirebaseConfig[Firebase Config<br/>src/lib/firebase.ts]
        TypeDefs[Type Definitions<br/>src/types/index.ts<br/>src/features/groups/types/]
        Utils[Utilities<br/>Validation, Formatting]
    end

    %% Flow
    Browser --> GroupPage
    GroupPage --> GroupCard
    GroupPage --> MemberList
    GroupPage --> JoinButton

    GroupCard --> UseGroupDetails
    MemberList --> UseGroupMembers
    JoinButton --> UseJoinGroup

    UseGroupDetails --> GetGroupDetails
    UseGroupMembers --> GetGroupDetails
    UseUserGroups --> GetUserGroups
    UseJoinGroup --> JoinGroup
    UseLeaveGroup --> LeaveGroup
    UseCreateGroup --> CreateGroup

    UseGroupDetails -.Cache Keys.-> CacheKeys
    UseJoinGroup -.Invalidates.-> CacheKeys

    GetGroupDetails --> GroupDomain
    JoinGroup --> MembershipRules

    GetGroupDetails --> FindById
    GetUserGroups --> FindByMemberId
    JoinGroup --> AddMember
    LeaveGroup --> RemoveMember
    CreateGroup --> Create

    FindById --> FirestoreAPI
    AddMember --> FirestoreAPI
    Create --> FirestoreAPI

    FirestoreAPI --> Collections

    GroupService -.uses.-> FirebaseConfig
    GroupService -.uses.-> TypeDefs
    GroupService -.uses.-> Utils

    %% Styling
    classDef page fill:#007AFF,stroke:#005BBB,stroke-width:2px,color:#fff
    classDef component fill:#30B0C7,stroke:#2590A8,stroke-width:2px,color:#fff
    classDef hook fill:#5856D6,stroke:#3634A3,stroke-width:3px,color:#fff
    classDef service fill:#34C759,stroke:#248A3D,stroke-width:2px,color:#fff
    classDef domain fill:#FF9500,stroke:#C77400,stroke-width:2px,color:#fff
    classDef repo fill:#32ADE6,stroke:#2590A8,stroke-width:2px,color:#fff
    classDef infra fill:#8E8E93,stroke:#636366,stroke-width:2px,color:#fff
    classDef user fill:#FC4C02,stroke:#C83C01,stroke-width:2px,color:#fff

    class GroupPage page
    class GroupCard,MemberList,JoinButton component
    class UseGroupDetails,UseGroupMembers,UseUserGroups,UseJoinGroup,UseLeaveGroup,UseCreateGroup,CacheKeys hook
    class GroupService,GetGroupDetails,GetUserGroups,JoinGroup,LeaveGroup,CreateGroup service
    class GroupDomain,MembershipRules domain
    class GroupRepo,FindById,FindByMemberId,Create,Update,AddMember,RemoveMember repo
    class FirestoreAPI,Collections,FirebaseConfig,TypeDefs,Utils infra
    class Browser user
```

## Layer Responsibilities

### 1. Page Layer

**Location**: `src/app/**/*.tsx`
**Technology**: Next.js App Router, Server/Client Components
**Responsibilities**:

- Route handling
- Initial data loading (Server Components)
- Layout composition
- Delegates to feature hooks

**Example**:

```typescript
// src/app/groups/[id]/page.tsx
'use client';
import { useGroupDetails } from '@/features/groups/hooks';

export default function GroupPage({ params }) {
  const { data: group } = useGroupDetails(params.id);
  return <GroupCard group={group} />;
}
```

### 2. Component Layer

**Location**: `src/components/` and `src/features/*/components/`
**Technology**: React, Tailwind CSS, shadcn/ui
**Responsibilities**:

- Pure presentation
- UI composition
- Event handling
- NO data fetching
- NO business logic

**Example**:

```typescript
// src/features/groups/components/GroupCard.tsx
export function GroupCard({ group, onJoin }) {
  return (
    <Card>
      <h1>{group.name}</h1>
      <Button onClick={onJoin}>Join</Button>
    </Card>
  );
}
```

### 3. Feature Hooks Layer ⭐ (React Query Boundary)

**Location**: `src/features/*/hooks/`
**Technology**: TanStack Query (React Query)
**Responsibilities**:

- **ONLY place for useQuery/useMutation**
- Cache management
- Loading/error states
- Optimistic updates
- Cache invalidation
- Background refetching

**Key Exports**:

- Query hooks (`useGroupDetails`, `useGroupMembers`)
- Mutation hooks (`useJoinGroup`, `useCreateGroup`)
- Cache keys (`GROUPS_KEYS`)

**Example**:

```typescript
// src/features/groups/hooks/useGroups.ts
export const GROUPS_KEYS = {
  all: () => ['groups'],
  detail: id => [...GROUPS_KEYS.all(), 'detail', id],
};

export function useGroupDetails(groupId: string) {
  return useQuery({
    queryKey: GROUPS_KEYS.detail(groupId),
    queryFn: () => groupService.getGroupDetails(groupId),
    staleTime: 15 * 60 * 1000,
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }) =>
      groupService.joinGroup(groupId, userId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({
        queryKey: GROUPS_KEYS.detail(groupId),
      });
    },
  });
}
```

### 4. Service Layer

**Location**: `src/features/*/services/`
**Technology**: Pure TypeScript (no React)
**Responsibilities**:

- Business logic orchestration
- Multi-step operations
- Domain rule enforcement
- Repository coordination
- **NO React hooks or dependencies**

**Example**:

```typescript
// src/features/groups/services/GroupService.ts
export class GroupService {
  private groupRepo: GroupRepository;

  async joinGroup(groupId: string, userId: string): Promise<void> {
    // Business logic
    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new Error('Group not found');
    if (group.memberIds.includes(userId)) {
      throw new Error('Already a member');
    }

    // Update membership
    await this.groupRepo.addMember(groupId, userId);
  }
}
```

### 5. Domain Layer (Optional)

**Location**: `src/features/*/domain/`
**Technology**: Pure TypeScript
**Responsibilities**:

- Business rules and validation
- Domain entities
- Value objects
- Domain-specific logic

**Example**:

```typescript
// src/features/groups/domain/MembershipRules.ts
export class MembershipRules {
  static canJoinGroup(group: Group, user: User): boolean {
    if (group.privacy === 'approval-required') {
      return false; // Need approval flow
    }
    return !group.memberIds.includes(user.id);
  }
}
```

### 6. Repository Layer

**Location**: `src/features/*/repositories/` or `src/infrastructure/firebase/repositories/`
**Technology**: Firebase SDK
**Responsibilities**:

- Data access only
- CRUD operations
- Query construction
- Data transformation
- **NO business logic**

**Example**:

```typescript
// src/features/groups/repositories/GroupRepository.ts
export class GroupRepository {
  async findById(groupId: string): Promise<Group | null> {
    const doc = await firestore.collection('groups').doc(groupId).get();
    return doc.exists ? (doc.data() as Group) : null;
  }

  async addMember(groupId: string, userId: string): Promise<void> {
    await firestore
      .collection('groups')
      .doc(groupId)
      .update({
        memberIds: firestore.FieldValue.arrayUnion(userId),
        memberCount: firestore.FieldValue.increment(1),
      });
  }
}
```

### 7. Infrastructure Layer

**Location**: `src/lib/`, `src/infrastructure/`
**Technology**: Firebase SDK, third-party libraries
**Responsibilities**:

- Firebase configuration
- Database connections
- External service integration
- Shared utilities

## Data Flow Example: Joining a Group

1. **User clicks "Join" button** → `JoinButton` component
2. **Component calls mutation** → `const { mutate } = useJoinGroup()`
3. **Hook executes mutation** → `groupService.joinGroup(groupId, userId)`
4. **Service validates** → Business rules checked
5. **Service calls repository** → `groupRepo.addMember(groupId, userId)`
6. **Repository updates Firestore** → Direct database operation
7. **Mutation success callback** → `queryClient.invalidateQueries()`
8. **React Query refetches** → Updated data automatically appears
9. **Component re-renders** → User sees updated UI

## Key Principles

### ✅ DO:

- Use feature hooks in components
- Keep services pure (no React)
- Use hierarchical cache keys
- Implement optimistic updates in hooks
- Test each layer independently

### ❌ DON'T:

- Use `useQuery`/`useMutation` in components
- Call repositories directly from components
- Mix business logic in hooks
- Mix React code in services
- Create circular dependencies

## File Organization

```
src/
├── app/                          # Pages (App Router)
│   └── groups/[id]/page.tsx
│
├── components/                   # Shared UI components
│   └── ui/                       # shadcn/ui components
│
├── features/
│   └── groups/
│       ├── components/           # Feature-specific components
│       │   ├── GroupCard.tsx
│       │   └── MemberList.tsx
│       │
│       ├── hooks/                # ⭐ React Query boundary
│       │   ├── useGroups.ts
│       │   ├── useGroupMutations.ts
│       │   └── index.ts
│       │
│       ├── services/             # Business logic
│       │   └── GroupService.ts
│       │
│       ├── domain/               # Business rules (optional)
│       │   └── MembershipRules.ts
│       │
│       ├── repositories/         # Data access (optional)
│       │   └── GroupRepository.ts
│       │
│       └── types/                # Feature types
│           └── index.ts
│
└── infrastructure/
    └── firebase/
        └── repositories/         # Shared repositories
```

## Testing Strategy

### Component Tests

```typescript
// Components are tested with mocked hooks
jest.mock('@/features/groups/hooks');

test('GroupCard renders group name', () => {
  useGroupDetails.mockReturnValue({ data: mockGroup });
  render(<GroupCard />);
  expect(screen.getByText('Group Name')).toBeInTheDocument();
});
```

### Hook Tests

```typescript
// Hooks are tested with React Query test utils
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

test('useGroupDetails fetches and caches', async () => {
  const { result } = renderHook(() => useGroupDetails('123'), { wrapper });
  await waitFor(() => expect(result.current.data).toBeDefined());
});
```

### Service Tests

```typescript
// Services are pure - easy to test
test('joinGroup throws when already member', async () => {
  const service = new GroupService();
  await expect(service.joinGroup('group-1', 'user-1')).rejects.toThrow(
    'Already a member'
  );
});
```

## Migration from Legacy Patterns

### Before (Context Pattern)

```typescript
// ❌ Old pattern - Context everywhere
const GroupPage = () => {
  const { groups, loading } = useGroupsContext();
  // Context causes re-renders across all consumers
};
```

### After (React Query at Feature Boundary)

```typescript
// ✅ New pattern - React Query at boundary
const GroupPage = () => {
  const { data: groups, isLoading } = useGroups();
  // Granular caching, automatic refetching
};
```

## Benefits

1. **Clear Boundaries**: React Query ONLY in feature hooks
2. **Testable**: Each layer can be tested independently
3. **Reusable**: Services work outside React
4. **Performant**: Optimized caching and updates
5. **Type-Safe**: Strong TypeScript contracts
6. **Maintainable**: Easy to understand and modify
