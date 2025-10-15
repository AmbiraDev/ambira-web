# Ambira Data Architecture

**Version:** 1.0
**Last Updated:** 2025-10-14
**Database:** Firebase Firestore (NoSQL)

---

## 1. Database Structure

### Technology Stack
- **Database:** Firebase Firestore (Cloud NoSQL)
- **Authentication:** Firebase Auth
- **Storage:** Firebase Cloud Storage
- **Real-time:** Firestore real-time listeners

### Main Collections

| Collection | Path | Description |
|------------|------|-------------|
| **users** | `/users/{userId}` | User profiles and settings |
| **sessions** | `/sessions/{sessionId}` | Activity sessions (primary content/posts) |
| **projects** | `/projects/{userId}/userProjects/{projectId}` | User activities/projects (subcollection) |
| **tasks** | `/projects/{userId}/userProjects/{projectId}/tasks/{taskId}` | Project tasks (nested subcollection) |
| **follows** | `/follows/{followId}` | Follow relationships (composite ID: `{followerId}_{followingId}`) |
| **groups** | `/groups/{groupId}` | Social groups |
| **challenges** | `/challenges/{challengeId}` | Competitions/challenges |
| **challengeParticipants** | `/challengeParticipants/{participantId}` | Challenge participation records |
| **comments** | `/comments/{commentId}` | Comments on sessions |
| **commentLikes** | `/commentLikes/{likeId}` | Likes on comments |
| **streaks** | `/streaks/{userId}` | User streak tracking |
| **notifications** | `/notifications/{notificationId}` | User notifications |
| **social_graph** | `/social_graph/{userId}/inbound/{friendId}` | Friendship graph (inbound/outbound) |

### Key Design Patterns
- **Sessions as Posts:** No separate posts collection - sessions ARE the feed content (Strava-like model)
- **User-scoped subcollections:** Projects/tasks organized under user documents for security
- **Composite IDs:** Follow relationships use `{followerId}_{followingId}` for efficient lookup
- **Denormalized counts:** `followersCount`, `supportCount`, `commentCount` stored directly for performance
- **Privacy-aware:** Visibility fields (`everyone`, `followers`, `private`) on sessions and profiles

### Required Firestore Indexes

```
Collection: sessions
Fields: visibility (Ascending), createdAt (Descending)
Purpose: Feed queries with visibility filtering

Collection: challengeParticipants
Fields: challengeId (Ascending), progress (Descending)
Purpose: Leaderboard queries
```

---

## 2. Core Data Models

### User
```typescript
id, email, username, name, bio, tagline, pronouns, location
profilePicture, website, socialLinks {twitter, github, linkedin}
followersCount, followingCount
profileVisibility: 'everyone' | 'followers' | 'private'
activityVisibility, projectVisibility
createdAt, updatedAt
```

### Session (Primary Content Type)
```typescript
id, userId, activityId, title, description
duration (seconds), startTime
visibility: 'everyone' | 'followers' | 'private'
supportCount, supportedBy[], commentCount
isSupported (computed), images[] (max 3)
howFelt (1-5), privateNotes
allowComments, isArchived
createdAt, updatedAt
```
**Note:** Sessions function as posts directly - feed displays sessions with social engagement

### Activity/Project
```typescript
id, userId, name, description, icon, color
weeklyTarget (hours), totalTarget (hours)
status: 'active' | 'completed' | 'archived'
isDefault (for built-in activities)
createdAt, updatedAt
```

### Group
```typescript
id, name, description, icon, color
category: 'work' | 'study' | 'side-project' | 'learning' | 'other'
type: 'just-for-fun' | 'professional' | 'competitive' | 'other'
privacySetting: 'public' | 'approval-required'
memberCount, memberIds[], adminUserIds[]
createdByUserId, createdAt, updatedAt
```

### Challenge
```typescript
id, groupId (optional), name, description
type: 'most-activity' | 'fastest-effort' | 'longest-session' | 'group-goal'
goalValue, startDate, endDate
participantCount, projectIds[], rewards[]
isActive, createdByUserId
createdAt, updatedAt
```

### Comment
```typescript
id, sessionId, userId, parentId (for replies)
content, likeCount, replyCount
isLiked (computed), isEdited
createdAt, updatedAt
```

### Streak
```typescript
userId, currentStreak, longestStreak
lastActivityDate, totalStreakDays
streakHistory: [{date, hasActivity, sessionCount, totalMinutes}]
isPublic
```

### Follow
```typescript
id (composite: {followerId}_{followingId})
followerId, followingId, createdAt
```

---

## 3. Caching Strategy

### Cache Architecture (Multi-Layer)

```
┌──────────────────────────────────────┐
│      Component (React/Next.js)       │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│     React Query (TanStack Query)     │ ← Primary caching layer
│  • staleTime: 5 min (default)        │
│  • gcTime: 10 min                    │
│  • Optimistic updates                │
│  • Automatic invalidation             │
└──────────┬───────────────────────────┘
           │ Cache miss or stale
           ↓
┌──────────────────────────────────────┐
│        Firestore API Layer           │
│   (firebaseApi.ts, firestoreCache)   │
└──────────┬───────────────────────────┘
           │ May use client cache
           ↓
┌──────────────────────────────────────┐
│      Client-Side Multi-Layer         │
│                                       │
│  1. Memory Cache (Map)               │
│     • TTL: 5 min default             │
│     • Max size: 100 items            │
│     • Cleared on page refresh        │
│                                       │
│  2. Session Storage                  │
│     • Tab-scoped                     │
│     • Cleared on tab close           │
│                                       │
│  3. Local Storage                    │
│     • TTL: 24 hours default          │
│     • Max retention: 7 days          │
│     • Persistent across sessions     │
│                                       │
│  + Query Deduplicator                │
│     • 1 second window                │
│     • Prevents duplicate requests    │
└──────────┬───────────────────────────┘
           │ All cache layers miss
           ↓
┌──────────────────────────────────────┐
│         Firestore Database           │
│      (Actual database read)          │
└──────────────────────────────────────┘
```

### Cache TTL by Data Type

| Data Type | React Query staleTime | Use Case |
|-----------|----------------------|----------|
| **Real-time** | 30 sec | Active timer state |
| **Short** | 1 min | Feed, tasks, live data |
| **Medium** | 5 min | Sessions, profiles (default) |
| **Long** | 15 min | Groups, projects, followers |
| **Very Long** | 1 hour | Analytics, statistics, suggestions |
| **Infinite** | ∞ | Static config data |

### Cache Invalidation Strategies

**Automatic (React Query):**
- Refetch on window focus (configurable)
- Automatic retry on failure (1 attempt)
- Garbage collection after gcTime expires

**Manual (Mutations):**
```typescript
// After creating session
queryClient.invalidateQueries({ queryKey: ['feed'] })

// After follow/unfollow
queryClient.invalidateQueries({ queryKey: ['user', userId] })

// After updating profile
queryClient.invalidateQueries({ queryKey: ['user', 'profile', userId] })
```

**Optimistic Updates:**
- Likes/supports: Update UI instantly, rollback on error
- Comments: Add to local cache immediately
- Follow actions: Update counts before server confirmation

### Key Benefits

✓ **Cost Reduction:** 70-90% fewer Firestore reads (each read = $0.06/100k)
✓ **Performance:** Sub-100ms response times for cached data
✓ **Offline Resilience:** localStorage provides partial offline capability
✓ **UX Improvements:** Instant UI updates with optimistic mutations
✓ **Scalability:** Query deduplication prevents thundering herd

---

## 4. Data Flow

### Typical Read Operation (Feed)

```
1. Component calls useFeedSessions() hook
   ↓
2. React Query checks its cache
   • If fresh (< 1 min): Return cached data immediately ✓
   • If stale: Return stale data, fetch in background
   ↓
3. firebaseApi.post.getFeedSessions() called
   ↓
4. Optional: Check Firestore cache wrapper
   • Memory cache (5 min TTL)
   • Session storage (tab lifetime)
   • Local storage (24 hr TTL)
   ↓
5. Firestore query executed
   • Query: sessions where visibility IN ['everyone', 'followers']
   • Order by: createdAt DESC
   • Limit: 20 per page
   ↓
6. Populate with user/activity data (batch fetch with cache)
   ↓
7. Store in all cache layers
   ↓
8. Return to component with metadata {sessions, hasMore, nextCursor}
```

**Estimated reads for cold start:** 20 sessions + 20 users + 20 activities = 60 reads
**Estimated reads for cached:** 0 reads (served from React Query cache)
**Estimated reads for stale cache:** 20 reads (sessions only, users/activities cached)

### Write Operation with Cache Invalidation

```
1. User clicks "Like" button
   ↓
2. Optimistic update (instant UI feedback)
   • Increment supportCount locally
   • Add userId to supportedBy array
   • Update isSupported = true
   ↓
3. supportMutation.mutate() called
   ↓
4. Firestore update
   • Add userId to session.supportedBy array
   • Increment session.supportCount
   ↓
5. On success: Confirm optimistic update
   ↓
6. On error: Rollback optimistic update
   • Revert supportCount
   • Remove userId from supportedBy
   • Show error toast
   ↓
7. React Query auto-invalidates related queries
   • ['session', sessionId]
   • ['feed'] (if configured)
   ↓
8. Next read fetches fresh data
```

### Real-Time Data Handling

**Top 10 Feed Items:**
```
1. Component renders with cached feed
   ↓
2. firebaseApi.post.listenToSessionUpdates() subscribes
   • Only first 10 sessions (performance optimization)
   • Firestore onSnapshot listener
   ↓
3. On server update (support/comment):
   • Receive real-time update
   • Update local session state
   • No full refetch needed
   ↓
4. Component re-renders with new counts
```

**Active Timer Persistence:**
```
1. Timer starts → Write to /users/{userId}/activeSession
   ↓
2. Auto-save every 30 seconds
   • Update pausedDuration
   • Update lastUpdated
   ↓
3. On page refresh:
   • Load from /users/{userId}/activeSession
   • Resume timer state
   ↓
4. On timer finish:
   • Create session document
   • Delete activeSession
   • Invalidate feed cache
```

### Pagination with Caching

```
1. Initial page: useFeedSessions(20, undefined)
   • Query: first 20 sessions
   • Cache key: ['feed', 'sessions', 20, undefined, filters]
   ↓
2. Scroll to bottom → IntersectionObserver triggers
   ↓
3. Next page: useFeedSessionsPaginated(20, cursor)
   • Query: next 20 sessions after cursor
   • Cache key: ['feed', 'sessions', 20, cursor, filters]
   • Longer TTL (5 min) since paginated results are stable
   ↓
4. Append to existing sessions array
   ↓
5. Each page cached independently
   • Back navigation = instant (cached)
   • Forward navigation = may need fetch
```

---

## Security & Performance Notes

### Firestore Security Rules Highlights
- Users can only modify their own documents (userId check)
- Follower counts: any authenticated user can increment/decrement (safe with increment ops)
- Session visibility enforced at query level
- Group admins have special permissions for challenges
- Rate limiting enforced client-side (see rateLimit.ts)

### Performance Optimizations
- **Denormalized counts:** Avoid expensive aggregations at read time
- **Composite IDs:** `{followerId}_{followingId}` eliminates need for compound queries
- **Batch operations:** Max 500 docs per batch, auto-chunked
- **Real-time throttling:** Only first 10 feed items get live updates
- **Pagination cursor caching:** Each page cached separately for instant back navigation
- **Image optimization:** Max 3 images per session, stored in Firebase Storage

### Rate Limiting (Client-Side)
| Operation | Limit | Window |
|-----------|-------|--------|
| Follow | 20 req | 1 min |
| Support/Like | 30 req | 1 min |
| Comment | 10 req | 1 min |
| Session Create | 30 req | 1 min |
| File Upload | 10 req | 1 min |
| Search | 30 req | 1 min |

---

## Data Consistency Patterns

### Eventual Consistency
- Social counts (followers, likes) may have brief lag (~1-2 sec)
- Real-time listeners provide near-instant updates for visible items
- Background jobs could sync counts periodically (not implemented)

### Strong Consistency
- Session creation: Write completes before returning
- Authentication state: Firebase Auth SDK handles consistency
- User profile updates: Immediate consistency within user's session

### Conflict Resolution
- Last-write-wins for most fields
- Array operations (supportedBy) use atomic updates
- Optimistic UI updates rolled back on conflict

---

**End of Document**
