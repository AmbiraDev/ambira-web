# Firebase Operations & Query Patterns Analysis - Ambira Codebase

**Analysis Date:** November 3, 2025  
**Codebase:** Ambira (Next.js 15 + TypeScript + Firebase)  
**Scope:** Complete Firebase usage audit across all services, hooks, and APIs

---

## Executive Summary

The Ambira codebase is a well-structured Next.js application with **comprehensive Firebase integration** across session tracking, social features, and group management. The architecture follows **clean separation of concerns** with infrastructure repositories, domain services, and React Query at feature boundaries.

**Key Findings:**

- ✅ **No Cloud Functions** - All logic runs client-side
- ✅ **Well-organized repositories** - Infrastructure layer abstracts Firestore
- ✅ **React Query at boundaries** - Good caching strategy
- ⚠️ **One potential N+1 query pattern** in group members fetching
- ⚠️ **Large legacy API file** (1099 lines) with complex feed logic
- ✅ **Good error handling** - Comprehensive error utilities and rate limiting
- ✅ **Transaction patterns** - Proper use of runTransaction for consistency

---

## 1. Firebase Cloud Functions

**Status:** ❌ **NONE FOUND**

No `/functions` directory exists in the repository. All Firebase operations (auth, database reads/writes) are executed client-side through:

- Firebase SDK v9 modular imports
- React Query for state management
- Direct API modules in `/src/lib/api/`

---

## 2. Complete List of Firebase-Related Files

### **Core Firebase Setup**

- `src/lib/firebase.ts` (79 lines)
  - Initializes Firebase app, Auth, Firestore, Storage
  - Sets up auth persistence
  - Graceful fallback with proxy objects if config missing

### **Infrastructure Layer (Repositories & Mappers)**

**Repositories** (Clean Architecture pattern):

- `src/infrastructure/firebase/repositories/SessionRepository.ts`
- `src/infrastructure/firebase/repositories/FeedRepository.ts`
- `src/infrastructure/firebase/repositories/UserRepository.ts`
- `src/infrastructure/firebase/repositories/SocialGraphRepository.ts`
- `src/infrastructure/firebase/repositories/GroupRepository.ts`
- `src/infrastructure/firebase/repositories/ActiveSessionRepository.ts`

**Mappers** (Data transformation):

- `src/infrastructure/firebase/mappers/SessionMapper.ts`
- `src/infrastructure/firebase/mappers/UserMapper.ts`
- `src/infrastructure/firebase/mappers/GroupMapper.ts`
- `src/infrastructure/firebase/mappers/ActiveSessionMapper.ts`

### **API Layer** (Business Logic)

**Main API Modules:**

- `src/lib/api/sessions/index.ts` - Session CRUD & complex queries
- `src/lib/api/sessions/posts.ts` (1099 lines) - **LEGACY** - Feed operations
- `src/lib/api/sessions/helpers.ts` - Session population helpers
- `src/lib/api/auth/index.ts` - Auth operations (login, signup, OAuth)
- `src/lib/api/users/index.ts` - User operations & search
- `src/lib/api/users/getFollowingIds.ts` - Social graph queries
- `src/lib/api/groups/index.ts` - Group CRUD operations
- `src/lib/api/challenges/index.ts` - Challenge management
- `src/lib/api/social/helpers.ts` - Follow/unfollow transactions
- `src/lib/api/social/comments.ts` - Comment operations
- `src/lib/api/streaks/index.ts` - Streak tracking
- `src/lib/api/notifications/index.ts` - Notification CRUD
- `src/lib/api/shared/utils.ts` - Common utilities

### **React Query Integration**

**Auth State:**

- `src/lib/react-query/auth.queries.ts` - Auth state management with Firebase listener

**Feature Hooks:**

- `src/features/sessions/hooks/useSessions.ts` - Session queries
- `src/features/feed/hooks/useFeed.ts` - Feed queries
- `src/features/groups/hooks/useGroups.ts`, `useGroupDetails.ts`, `useGroupMembers.ts`, `useGroupLeaderboard.ts`
- `src/features/comments/hooks/useComments.ts`
- `src/features/challenges/hooks/useChallenges.ts`
- `src/features/social/hooks/useFollowers.ts`, `useFollowing.ts`
- `src/features/search/hooks/useSearchUsers.ts`, `useSearchGroups.ts`, etc.

### **Component Usage**

- `src/components/Feed.tsx` - **Real-time listener setup** (line 201: setInterval check every 2 min)
- `src/hooks/useNotifications.ts` - **Real-time listener** (onSnapshot for notifications)

---

## 3. Firestore Query Patterns

### **A. Simple Document Reads**

```typescript
// Pattern: Get single document by ID
const docRef = doc(db, 'collection', id);
const docSnap = await getDoc(docRef);
```

**Files using this:**

- `SessionRepository.findById()` - Get session by ID
- `UserRepository.findById()` - Get user by ID
- All entity fetch operations

### **B. Query with WHERE Clause**

```typescript
const q = query(
  collection(db, 'collection'),
  where('field', '==', value),
  orderBy('createdAt', 'desc'),
  limit(10)
);
const snapshot = await getDocs(q);
```

**Common use cases:**

1. Get sessions by user
2. Get sessions by project
3. Search users by username
4. Check username availability

### **C. Complex Feed Queries** (Legacy - `posts.ts`)

**7 different feed types:**

1. **Following Feed** - Sessions from followed users
2. **Group Feed** - Sessions from group members
3. **Trending Feed** - Recent public sessions
4. **User Feed** - Sessions for specific user
5. **Group Members Unfollowed** - New people from groups
6. **All** - Chronological feed (all public sessions)
7. **Recent** - Default following + own sessions

**Key pattern:** Fetches 3x limit to account for filtering, then discards 2/3

### **D. Pagination Pattern**

Uses cursor-based pagination with `startAfter()`:

```typescript
const cursorDoc = await getDoc(doc(db, 'sessions', cursor));
query(..., startAfter(cursorDoc), limit(limitCount + 1))
```

---

## 4. Real-Time Listeners (onSnapshot)

**Found in 2 locations:**

### **1. useNotifications Hook** (`src/hooks/useNotifications.ts`, lines 57-104)

- Listens to notifications collection
- Updates React Query cache on changes
- Properly cleaned up in useEffect return

### **2. Session Support Updates** (`src/lib/api/sessions/posts.ts`, lines 920-950)

- Listens to individual session documents
- Multiple listeners per session (throttled to first 10)
- Callback-based pattern for updates

### **3. Feed Periodic Check** (`src/components/Feed.tsx`, lines 201-206)

- Checks for new sessions every 2 minutes
- Respects page visibility
- Uses React Query cache first, then API call if needed

---

## 5. Files with Heavy Firebase Activity

### **Tier 1: High Activity**

1. **`src/lib/api/sessions/posts.ts`** (1099 lines) - ⚠️
   - **Issues:**
     - N+1 pattern in `getUserPosts()` - individual getDoc() per post
     - Fetch multiplier 3x to account for filtering
     - Complex in-memory filtering logic
   - **Operations:**
     - getFeedSessions() - 7 feed types (255-726)
     - supportSession() - Transaction + notification (729-801)
     - getUserPosts() - Sequential fetches (960-1096)
     - listenToSessionUpdates() - Multiple listeners (908-957)

2. **`src/lib/api/auth/index.ts`** - ⚠️
   - **Issue:** generateUniqueUsername() can make up to 999 queries
   - **Mitigation:** Rate limiting applied

3. **`src/lib/api/social/helpers.ts`** - ✅
   - **Pattern:** Complex transaction with proper read-before-write order
   - **Operation:** updateSocialGraph() - Follow/unfollow with count updates

### **Tier 2: Medium Activity**

4. **`src/lib/api/challenges/index.ts`** - Multiple writeBatch() operations
5. **`src/lib/api/notifications/index.ts`** - Batch operations
6. **Feature Hooks** - Targeted React Query hooks

### **Tier 3: Low Activity**

7. **Repository classes** - Clean, efficient queries

---

## 6. Query Efficiency Issues

### **Issue 1: N+1 in getUserPosts** ⚠️

**File:** `posts.ts` lines 990-1020

```typescript
// For each post:
const userDoc = await getDoc(doc(db, 'users', userId)); // N queries
const sessionDoc = await getDoc(doc(db, 'sessions', sessionId)); // N queries
const projectDoc = await getDoc(...); // N queries
```

**Impact:** O(N\*M) complexity  
**Mitigation:** Would need composite documents or denormalization

### **Issue 2: N+1 in Group Members** ⚠️

**File:** `useGroupMembers.ts` lines 44-73

```typescript
const memberPromises = memberships.map(async m => {
  const userDoc = await getDoc(doc(db, 'users', m.userId)); // N queries in parallel
});
```

**Severity:** Medium (uses Promise.all for parallelization)

### **Issue 3: Feed Query Multiplier** ⚠️

**File:** `posts.ts` lines 286-292

```typescript
limitFn(limitCount * 3); // Fetch 3x, discard 2/3
```

**Impact:** Wastes bandwidth  
**Better:** Composite index would enable proper pagination

### **Pattern 4: Transaction Handling** ✅

**File:** `social/helpers.ts` lines 54-128

```typescript
await runTransaction(db, async transaction => {
  // ALL READS FIRST
  // THEN ALL WRITES
});
```

**Verdict:** Correct pattern - best practices followed

---

## 7. Summary Statistics

| Metric                            | Count       |
| --------------------------------- | ----------- |
| Firebase-related TypeScript files | 60+         |
| Firestore query patterns          | 30+ unique  |
| Real-time listeners               | 3           |
| Batch operations                  | 5+          |
| Transaction patterns              | 2           |
| React Query hooks                 | 15+         |
| API modules                       | 10+         |
| Firebase-related code             | 5000+ lines |

---

## 8. Recommendations

### **Immediate Actions**

1. Consolidate Feed Queries - Migrate from legacy `posts.ts` to structured `FeedService`
2. Add Firestore composite indexes:
   - `sessions` (userId + visibility + createdAt)
   - `sessions` (visibility + createdAt)
3. Optimize group members - Add caching or composite documents

### **Medium-term**

1. Denormalize user data on sessions to prevent N+1
2. Implement monitoring for frequent queries
3. Consider suggest-username pool vs loop

### **Best Practices Already Implemented** ✅

- Clean repository pattern
- React Query at feature boundaries
- Proper error handling
- Rate limiting
- Transaction safety
- Batch operations
- Real-time listener cleanup

---

## 9. Firestore Collections

```
collections:
  ├── users/{userId}
  ├── sessions/{sessionId}
  ├── projects/{userId}/userProjects/{projectId}
  ├── groups/{groupId}
  ├── groupMemberships/{membershipId}
  ├── social_graph/{userId}/outbound/{targetUserId}
  ├── social_graph/{userId}/inbound/{followerId}
  ├── challenges/{challengeId}
  ├── challengeParticipants/{participantId}
  ├── notifications/{notificationId}
  ├── comments/{commentId}
  ├── streaks/{userId}
  └── posts/{postId} (deprecated - using sessions)
```

---

## Conclusion

**Overall Health Score: 8/10** ✅

The codebase demonstrates mature Firebase integration with good separation of concerns. Main optimization opportunities are in feed query efficiency and N+1 patterns, addressable through composite indexes and better query planning.
