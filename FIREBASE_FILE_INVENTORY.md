# Firebase Operations - Complete File Inventory

## Directory Structure

### Core Firebase Setup (1 file)

```
src/
└── lib/
    └── firebase.ts (79 lines)
```

### Infrastructure Layer (10 files)

```
src/
└── infrastructure/
    └── firebase/
        ├── repositories/
        │   ├── SessionRepository.ts
        │   ├── FeedRepository.ts
        │   ├── UserRepository.ts
        │   ├── SocialGraphRepository.ts
        │   ├── GroupRepository.ts
        │   └── ActiveSessionRepository.ts
        └── mappers/
            ├── SessionMapper.ts
            ├── UserMapper.ts
            ├── GroupMapper.ts
            └── ActiveSessionMapper.ts
```

### API Layer (13 files)

```
src/
└── lib/
    └── api/
        ├── sessions/
        │   ├── index.ts
        │   ├── posts.ts (⚠️ LEGACY - 1099 lines)
        │   └── helpers.ts
        ├── auth/
        │   └── index.ts
        ├── users/
        │   ├── index.ts
        │   └── getFollowingIds.ts
        ├── groups/
        │   └── index.ts
        ├── challenges/
        │   └── index.ts
        ├── social/
        │   ├── helpers.ts
        │   └── comments.ts
        ├── streaks/
        │   └── index.ts
        ├── notifications/
        │   └── index.ts
        ├── shared/
        │   └── utils.ts
        └── achievements/
            └── index.ts
```

### React Query Integration (1 file)

```
src/
└── lib/
    └── react-query/
        └── auth.queries.ts
```

### Feature Hooks (25+ files)

```
src/
└── features/
    ├── sessions/
    │   └── hooks/
    │       ├── useSessions.ts
    │       ├── useSessionMutations.ts
    │       └── index.ts
    ├── feed/
    │   └── hooks/
    │       ├── useFeed.ts
    │       ├── useFeedMutations.ts
    │       └── index.ts
    ├── groups/
    │   └── hooks/
    │       ├── useGroups.ts
    │       ├── useGroupDetails.ts
    │       ├── useGroupMembers.ts ⚠️ N+1 pattern
    │       ├── useGroupLeaderboard.ts
    │       ├── useGroupMutations.ts
    │       └── index.ts
    ├── comments/
    │   └── hooks/
    │       ├── useComments.ts
    │       ├── useCommentMutations.ts
    │       └── index.ts
    ├── challenges/
    │   └── hooks/
    │       ├── useChallenges.ts
    │       ├── useChallengeMutations.ts
    │       └── index.ts
    ├── social/
    │   └── hooks/
    │       ├── useFollowers.ts
    │       └── useFollowing.ts
    ├── search/
    │   └── hooks/
    │       ├── useSearchUsers.ts
    │       ├── useSearchGroups.ts
    │       ├── useSuggestedUsers.ts
    │       ├── useSuggestedGroups.ts
    │       ├── useFollowingList.ts
    │       ├── useUserGroups.ts
    │       └── index.ts
    ├── streaks/
    │   └── hooks/
    │       ├── useStreaks.ts
    │       ├── useStreakMutations.ts
    │       └── index.ts
    ├── timer/
    │   └── hooks/
    │       ├── useTimer.ts
    │       ├── useTimerMutations.ts
    │       └── useTimerState.ts
    └── projects/
        └── hooks/
            ├── useProjects.ts
            └── useProjectMutations.ts
```

### Component-Level Hooks (4 files)

```
src/
└── hooks/
    ├── useAuth.ts
    ├── useNotifications.ts 🔴 Real-time listener
    ├── useTimerQuery.ts
    ├── useActivitiesQuery.ts
    └── useDebounce.ts
```

### Components Using Firebase (2 files)

```
src/
└── components/
    ├── Feed.tsx 🔴 Polling every 2 min (line 201)
    └── (40+ other components using hooks)
```

### Deprecated Contexts (Not using Firebase directly)

```
src/
└── contexts/
    ├── AuthContext.tsx (placeholder - use useAuth hook)
    ├── ProjectsContext.tsx (legacy)
    ├── TimerContext.tsx
    └── ActivitiesContext.tsx
```

### Feature Services (7 files)

```
src/
└── features/
    ├── sessions/
    │   └── services/
    │       └── SessionService.ts
    ├── feed/
    │   └── services/
    │       └── FeedService.ts
    ├── groups/
    │   └── services/
    │       └── GroupService.ts
    ├── comments/
    │   └── services/
    │       └── CommentService.ts
    ├── challenges/
    │   └── services/
    │       └── ChallengeService.ts
    ├── profile/
    │   └── services/
    │       └── ProfileService.ts
    ├── projects/
    │   └── services/
    │       └── ProjectService.ts
    ├── streaks/
    │   └── services/
    │       └── StreakService.ts
    └── timer/
        └── services/
            └── TimerService.ts
```

---

## File Categorization by Read/Write Activity

### 🔴 High Activity (Monitor)

1. `src/lib/api/sessions/posts.ts` - 1099 lines, complex feed logic
2. `src/lib/api/auth/index.ts` - Auth operations, username loop
3. `src/lib/api/social/helpers.ts` - Complex transactions
4. `src/components/Feed.tsx` - Real-time polling
5. `src/hooks/useNotifications.ts` - Real-time listener
6. `src/features/groups/hooks/useGroupMembers.ts` - N+1 queries

### 🟡 Medium Activity

1. `src/lib/api/challenges/index.ts` - Batch operations
2. `src/lib/api/notifications/index.ts` - Batch operations
3. `src/infrastructure/firebase/repositories/*.ts` - Repository queries
4. Feature service files - Standard CRUD

### 🟢 Low Activity (Well-optimized)

1. `src/lib/firebase.ts` - Initialization only
2. Infrastructure mappers - Data transformation
3. Helper utilities - Shared functions

---

## Query Pattern Distribution

### By Query Type

| Pattern                  | Count | Files                     |
| ------------------------ | ----- | ------------------------- |
| Simple `getDoc()`        | ~30   | All repositories          |
| `query()` with WHERE     | ~20   | Services, hooks, APIs     |
| Compound WHERE           | ~10   | Groups, notifications     |
| `onSnapshot()` listeners | 2     | Notifications, posts      |
| `writeBatch()`           | 5     | Challenges, notifications |
| `runTransaction()`       | 2     | Social helpers, posts     |
| Pagination cursor        | ~5    | Feed APIs                 |

### By Feature

| Feature       | API Calls | Hooks | Services | Listeners |
| ------------- | --------- | ----- | -------- | --------- |
| Sessions      | 4         | 3     | 1        | 1         |
| Feed          | 1\*       | 2     | 1        | 1         |
| Groups        | 1         | 5     | 1        | 0         |
| Challenges    | 1         | 2     | 1        | 0         |
| Notifications | 1         | 1     | 0        | 1         |
| Auth          | 1         | 0     | 0        | 1         |
| Social        | 1         | 2     | 0        | 0         |
| Streaks       | 1         | 1     | 1        | 0         |
| Comments      | 1         | 1     | 1        | 0         |

\*Legacy posts.ts - being refactored

---

## Collection Access Patterns

### Direct Document Access

- `users/{userId}` - 20+ files
- `sessions/{sessionId}` - 15+ files
- `groups/{groupId}` - 8+ files
- `challenges/{challengeId}` - 5+ files

### Query Collections

- `sessions` - 8 files (feed, filtering)
- `notifications` - 2 files
- `groupMemberships` - 3 files
- `social_graph/*` - 4 files
- `follows` - 3 files (deprecated)

### Batch Collections

- `challengeParticipants` - Batch updates
- `groupMemberships` - Batch operations
- Notifications - Batch operations

---

## Real-Time Listeners Active

### Production Active

1. **useNotifications.ts** - Per-user notifications
   - Type: Persistent query listener
   - Scope: Current user only
   - Pattern: Updates React Query cache

2. **posts.ts:listenToSessionUpdates()** - Session support counts
   - Type: Document listeners
   - Scope: Limited to first 10 sessions
   - Pattern: Callback-based

### Periodic Activity

1. **Feed.tsx** - New session check
   - Type: Polling (not real-time)
   - Frequency: Every 2 minutes
   - Pattern: Cache-first with API fallback

---

## Async/Batch Patterns

### Sequential Operations

- `posts.ts:getUserPosts()` - Sequential getDoc calls (N+1)
- `useGroupMembers.ts` - Parallel getDoc calls (N+1 but optimized)

### Batch Operations (Efficient)

- `challenges/index.ts` - writeBatch for participant updates
- `notifications/index.ts` - writeBatch for bulk mark-as-read
- `comments.ts` - writeBatch for bulk operations

### Transactions

- `social/helpers.ts:updateSocialGraph()` - Follow/unfollow with count updates
- `posts.ts` - Support/unsupport with safe count updates

---

## Dependencies & Import Patterns

### Firebase SDK Imports

```typescript
// Core
import { initializeApp, getAuth, getFirestore, getStorage }

// Auth
import { signInWithEmailAndPassword, onAuthStateChanged, etc }

// Firestore
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc }
import { query, where, orderBy, limit, startAfter, increment }
import { serverTimestamp, runTransaction, writeBatch, onSnapshot }
```

### State Management

```typescript
// React Query
import { useQuery, useMutation, useInfiniteQuery, useQueryClient }

// React
import { useEffect, useState, useCallback, useMemo, useRef }

// Next.js
import { useRouter, useSearchParams }
```

---

## Summary

- **Total Firebase-related files:** 60+
- **Total lines of Firebase code:** 5000+
- **Real-time listeners:** 2 (plus 1 polling)
- **Batch operations:** Multiple (well-implemented)
- **Transactions:** 2 main patterns
- **N+1 patterns identified:** 2 (one legacy, one feature hook)
- **Well-optimized patterns:** 8+
