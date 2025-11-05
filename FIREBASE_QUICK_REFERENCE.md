# Firebase Operations - Quick Reference Guide

## Key Files to Monitor for Optimization

### 🔴 High Priority (Performance Impact)

#### 1. `src/lib/api/sessions/posts.ts` (1099 lines)

**Status:** Legacy, being refactored  
**Main Issue:** N+1 queries in `getUserPosts()` and 3x fetch multiplier  
**Action:** Monitor for migration to `FeedService`

**Key functions:**

- `getFeedSessions()` - 7 feed types, complex logic
- `supportSession()` - Transaction + notification
- `getUserPosts()` - ⚠️ N+1 pattern
- `listenToSessionUpdates()` - Real-time listeners (max 10 sessions)

---

#### 2. `src/features/groups/hooks/useGroupMembers.ts`

**Status:** Active  
**Issue:** N+1 pattern (fetches user for each member in parallel)  
**Severity:** Medium (parallelized but still N+1)

```typescript
// Fetches user doc for each group member (N queries)
const memberPromises = memberships.map(m => getDoc(db, 'users', m.userId));
```

**Optimization:** Cache user documents or composite documents

---

#### 3. `src/lib/api/auth/index.ts`

**Status:** Active  
**Issue:** generateUniqueUsername() can make 999 queries  
**Mitigation:** Rate limiting applied

```typescript
// Worst case: tries username, then username1, username2, ... username999
for (let i = 1; i <= 999; i++) {
  if (!(await checkUsernameExists(candidate))) return candidate;
}
```

---

### 🟡 Medium Priority (Monitor)

#### 4. `src/components/Feed.tsx` (Line 201)

**Pattern:** Periodic check every 2 minutes

```typescript
const interval = setInterval(checkForNewSessions, 120000);
```

**Status:** Good - checks cache first, has visibility awareness  
**Note:** Potential high-traffic area

---

#### 5. `src/hooks/useNotifications.ts` (Line 67)

**Pattern:** Real-time listener for user's notifications

```typescript
const unsubscribe = onSnapshot(
  query(collection(db, 'notifications'), where('userId', '==', user.id)),
  snapshot => {
    queryClient.setQueryData(queryKey, notifications);
  }
);
```

**Status:** Good - properly cleaned up  
**Watch:** Memory usage if many notifications

---

#### 6. `src/lib/api/social/helpers.ts` (Line 54)

**Pattern:** Follow/unfollow transaction

```typescript
await runTransaction(db, async transaction => {
  // ALL READS FIRST
  // THEN ALL WRITES
});
```

**Status:** Excellent - follows best practices  
**Note:** Complex multi-document update

---

### 🟢 Low Priority (Well-Optimized)

#### 7. Repository Classes

- `SessionRepository.ts` - Clean single-responsibility queries
- `UserRepository.ts` - Efficient with batching for `in` queries
- `FeedRepository.ts` - Better structured than legacy posts.ts

---

## Query Patterns to Watch

### N+1 Queries

**Occurs when:**

```typescript
const posts = await getDocs(query(collection(db, 'posts')));
// Then for each post:
for (const post of posts) {
  const user = await getDoc(doc(db, 'users', post.userId)); // N queries
}
```

**Locations:**

1. ⚠️ `posts.ts:getUserPosts()` - No parallelization
2. ⚠️ `useGroupMembers.ts` - Parallelized (better)
3. ✅ Other locations - Well managed

---

### Real-Time Listeners

**Memory concern:** Multiple listeners accumulate  
**Monitoring points:**

1. **useNotifications.ts** - Single listener per user (good)
2. **posts.ts:listenToSessionUpdates()** - Throttled to 10 sessions (good)
3. **Feed.tsx** - Polling not listeners (efficient)

---

### Batch Operations

**Files using writeBatch():**

- `challenges/index.ts` - 4 uses
- `notifications/index.ts` - 4 uses
- `social/comments.ts` - 1 use

**Status:** All proper usage ✅

---

## Performance Baseline

### Current Query Load (Approximate)

- **Feed page load:** 2-3 main queries + pagination cursor
- **Group members:** 1 membership query + N user fetches
- **Notifications:** Real-time listener (updated incrementally)
- **Auth:** Single listener via React Query

### Recommended Firestore Indexes

```
Index 1: sessions (userId, visibility, createdAt DESC)
Index 2: sessions (visibility, createdAt DESC)
Index 3: groupMemberships (groupId, status)
Index 4: notifications (userId, createdAt DESC)
```

---

## Monitoring & Alerts

### Watch For:

1. `posts.ts` read operations increasing
2. Multiple rapid username checks (rate limit bypass?)
3. Large group member lists (useGroupMembers.ts performance)
4. Feed polling frequency increase

### Metrics to Track:

- Firestore read quota usage
- Real-time listener count
- N+1 query patterns in logs
- Feed pagination cursor generation rate

---

## Code Review Checklist

When reviewing Firebase changes:

- [ ] No new `onSnapshot()` without cleanup in useEffect?
- [ ] No loops with Firebase queries?
- [ ] Rate limiting applied for user-triggered actions?
- [ ] React Query cache used at feature boundaries?
- [ ] Transactions follow read-then-write pattern?
- [ ] Batch operations for bulk writes?
- [ ] Error handling includes permission checks?
- [ ] Memory cleanup for listeners in tests?

---

## Migration Roadmap

**Phase 1 (Current):** Monitor legacy `posts.ts`  
**Phase 2:** Migrate `getFeedSessions()` to `FeedService`  
**Phase 3:** Optimize N+1 patterns in group members  
**Phase 4:** Consider denormalization for user data on sessions

---

## Contact Points for Firebase Questions

**Architecture:** See `/docs/architecture/` directory  
**API Modules:** `src/lib/api/` directory  
**Infrastructure:** `src/infrastructure/firebase/` directory  
**Hooks:** `src/features/*/hooks/` and `src/hooks/`
