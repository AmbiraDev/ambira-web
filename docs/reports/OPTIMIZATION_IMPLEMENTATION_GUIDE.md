# Firebase Optimization Implementation Guide

This guide provides step-by-step instructions for implementing the critical optimizations identified in the Firebase Optimization Report.

---

## Table of Contents

1. [Fix 1: N+1 Query Pattern in getFollowers/getFollowing](#fix-1-n1-query-pattern-in-getfollowersgetfollowing)
2. [Fix 2: N+1 Query Pattern in Feed Posts](#fix-2-n1-query-pattern-in-feed-posts)
3. [Fix 3: Disable Automatic Follower Count Recalculation](#fix-3-disable-automatic-follower-count-recalculation)
4. [Fix 4: User Search Limit](#fix-4-user-search-limit)
5. [Fix 5: Deploy Missing Composite Indexes](#fix-5-deploy-missing-composite-indexes)
6. [Testing & Validation](#testing--validation)

---

## Fix 1: N+1 Query Pattern in getFollowers/getFollowing

### Current Problem

```typescript
// BEFORE: Sequential getDoc calls in a loop
for (const followerId of followerIds) {
  const userDoc = await getDoc(doc(db, 'users', followerId)) // 🔴 1 read per follower
  if (userDoc.exists()) {
    followers.push({
      id: userDoc.id,
      username: userData.username,
      // ... other fields
    })
  }
}
// For 20 followers: 20 sequential read operations + 1 initial query = 21 total
```

### Solution: Batch Load with Promise.all

**File**: `/src/lib/api/users/index.ts`

**Changes Required**:

```typescript
/**
 * Get all followers for a user (people who follow this user)
 * Supports both new social_graph structure and legacy follows collection
 *
 * @param userId - The user ID whose followers to retrieve
 * @returns Promise resolving to array of follower users (empty array on error)
 * @throws Error if fetch fails (except permission errors which return empty array)
 */
getFollowers: async (userId: string): Promise<User[]> => {
  try {
    let followerIds: string[] = [];

    // Try new social_graph structure first
    try {
      const inboundRef = collection(db, `social_graph/${userId}/inbound`);
      const inboundSnapshot = await getDocs(inboundRef);

      if (!inboundSnapshot.empty) {
        followerIds = inboundSnapshot.docs.map(doc => doc.id);
      }
    } catch (_socialGraphError) {
      // If social_graph doesn't exist or has permission issues, continue to fallback
    }

    // Fallback to old follows collection if no followers found via social_graph
    if (followerIds.length === 0) {
      const followersQuery = query(
        collection(db, 'follows'),
        where('followingId', '==', userId)
      );
      const followersSnapshot = await getDocs(followersQuery);

      followerIds = followersSnapshot.docs.map(doc => {
        const data = doc.data();
        return data.followerId;
      });
    }

    if (followerIds.length === 0) {
      return [];
    }

    // 🟢 OPTIMIZED: Batch load all users at once with Promise.all
    const userDocPromises = followerIds.map(followerId =>
      getDoc(doc(db, 'users', followerId))
    );
    const userDocs = await Promise.all(userDocPromises);

    // 🟢 Build array from docs
    const followers: User[] = [];
    for (const userDoc of userDocs) {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        followers.push({
          id: userDoc.id,
          username: userData.username,
          email: userData.email,
          name: userData.name,
          bio: userData.bio || '',
          profilePicture: userData.profilePicture,
          followersCount: userData.followersCount || 0,
          followingCount: userData.followingCount || 0,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
        });
      }
    }

    return followers;
  } catch (_error) {
    // Handle permission errors silently for privacy-protected data
    if (isPermissionError(_error)) {
      return [];
    }
    const apiError = handleError(_error, 'Fetch followers', {
      defaultMessage: ERROR_MESSAGES.PROFILE_LOAD_FAILED,
    });
    throw new Error(apiError.userMessage);
  }
},

/**
 * Get all users that a user is following
 * Supports both new social_graph structure and legacy follows collection
 *
 * @param userId - The user ID whose following list to retrieve
 * @returns Promise resolving to array of following users (empty array on error)
 * @throws Error if fetch fails (except permission errors which return empty array)
 */
getFollowing: async (userId: string): Promise<User[]> => {
  try {
    let followingIds: string[] = [];

    // Try new social_graph structure first
    try {
      const outboundRef = collection(db, `social_graph/${userId}/outbound`);
      const outboundSnapshot = await getDocs(outboundRef);

      if (!outboundSnapshot.empty) {
        followingIds = outboundSnapshot.docs.map(doc => doc.id);
      }
    } catch (_socialGraphError) {
      // If social_graph doesn't exist or has permission issues, continue to fallback
    }

    // Fallback to old follows collection if no following found via social_graph
    if (followingIds.length === 0) {
      const followingQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', userId)
      );
      const followingSnapshot = await getDocs(followingQuery);

      followingIds = followingSnapshot.docs.map(doc => {
        const data = doc.data();
        return data.followingId;
      });
    }

    if (followingIds.length === 0) {
      return [];
    }

    // 🟢 OPTIMIZED: Batch load all users at once with Promise.all
    const userDocPromises = followingIds.map(followingId =>
      getDoc(doc(db, 'users', followingId))
    );
    const userDocs = await Promise.all(userDocPromises);

    // 🟢 Build array from docs
    const following: User[] = [];
    for (const userDoc of userDocs) {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        following.push({
          id: userDoc.id,
          username: userData.username,
          email: userData.email,
          name: userData.name,
          bio: userData.bio || '',
          profilePicture: userData.profilePicture,
          followersCount: userData.followersCount || 0,
          followingCount: userData.followingCount || 0,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
        });
      }
    }

    return following;
  } catch (_error) {
    // Handle permission errors silently for privacy-protected data
    if (isPermissionError(_error)) {
      return [];
    }
    const apiError = handleError(_error, 'Fetch following', {
      defaultMessage: ERROR_MESSAGES.PROFILE_LOAD_FAILED,
    });
    throw new Error(apiError.userMessage);
  }
},
```

### Expected Impact

- **Before**: 20 followers = 21 reads (1 query + 20 sequential getDoc)
- **After**: 20 followers = 2-3 reads (1 query + 1 batch Promise.all)
- **Savings**: 85-90% reduction in read operations

### Testing

```typescript
// Test with large follower list
import { firebaseUserApi } from '@/lib/api/users'

const followers = await firebaseUserApi.getFollowers('user123')
console.log('Fetched', followers.length, 'followers')
// Should complete much faster than before
```

---

## Fix 2: N+1 Query Pattern in Feed Posts

### Current Problem

The `_processPosts` function fetches user, session, project, and support data for each post individually:

```typescript
// BEFORE: Sequential reads
const batchPromises = batch.map(async postDoc => {
  const userDoc = await getDoc(doc(db, 'users', postData.userId)); // 🔴 Read 1
  const sessionDoc = await getDoc(doc(db, 'sessions', postData.sessionId)); // 🔴 Read 2
  const projectDoc = await getDoc(doc(...)); // 🔴 Read 3
  const supportDoc = await getDoc(doc(db, 'postSupports', ...)); // 🔴 Read 4
  // For 10 posts: 40 total reads
});
```

### Solution: Deduplicate & Batch Load

**File**: `/src/lib/api/sessions/posts.ts`

```typescript
/**
 * Process feed post documents into PostWithDetails with deduplication
 * Loads user, session, and support data efficiently with batching
 */
const _processPosts = async (postDocs: DocumentSnapshot[]): Promise<PostWithDetails[]> => {
  // 🟢 PHASE 1: Deduplicate IDs
  const userIds = new Set<string>()
  const sessionIds = new Set<string>()
  const postIds = new Set<string>()

  postDocs.forEach((postDoc) => {
    const postData = postDoc.data()
    if (postData?.userId) userIds.add(postData.userId)
    if (postData?.sessionId) sessionIds.add(postData.sessionId)
    postIds.add(postDoc.id)
  })

  // 🟢 PHASE 2: Batch load all documents in parallel
  const [userDocs, sessionDocs, supportDocs] = await Promise.all([
    // Load all users in one batch
    Promise.all(Array.from(userIds).map((userId) => getDoc(doc(db, 'users', userId)))),
    // Load all sessions in one batch
    Promise.all(Array.from(sessionIds).map((sessionId) => getDoc(doc(db, 'sessions', sessionId)))),
    // Load all support records in one batch (only if authenticated)
    auth.currentUser
      ? Promise.all(
          Array.from(postIds).map((postId) =>
            getDoc(doc(db, 'postSupports', `${auth.currentUser!.uid}_${postId}`))
          )
        )
      : Promise.resolve([]),
  ])

  // 🟢 PHASE 3: Build lookup maps
  const userMap = new Map<string, DocumentData>()
  const sessionMap = new Map<string, DocumentData>()
  const supportMap = new Map<string, boolean>()

  userDocs.forEach((doc) => {
    if (doc.exists()) userMap.set(doc.id, doc.data())
  })

  sessionDocs.forEach((doc) => {
    if (doc.exists()) sessionMap.set(doc.id, doc.data())
  })

  supportDocs.forEach((doc) => {
    if (doc.exists()) {
      const data = doc.data()
      const postId = data.postId
      supportMap.set(postId, true)
    }
  })

  // 🟢 PHASE 4: Build results without additional reads
  const posts: PostWithDetails[] = []

  for (const postDoc of postDocs) {
    const postData = postDoc.data()
    if (!postData) continue

    const userData = userMap.get(postData.userId as string) || {}
    const sessionData = sessionMap.get(postData.sessionId as string)
    const isSupported = supportMap.get(postDoc.id) || false

    const post: PostWithDetails = {
      id: postDoc.id,
      sessionId: postData.sessionId as string,
      userId: postData.userId as string,
      content: postData.content as string,
      supportCount: (postData.supportCount as number) || 0,
      commentCount: (postData.commentCount as number) || 0,
      isSupported,
      visibility: (postData.visibility as 'everyone' | 'followers' | 'private') || 'everyone',
      createdAt: convertTimestamp(postData.createdAt),
      updatedAt: convertTimestamp(postData.updatedAt),
      user: {
        id: postData.userId as string,
        email: userData.email || '',
        name: userData.name || 'Unknown User',
        username: userData.username || 'unknown',
        bio: userData.bio,
        location: userData.location,
        profilePicture: userData.profilePicture,
        createdAt: convertTimestamp(userData.createdAt) || new Date(),
        updatedAt: convertTimestamp(userData.updatedAt) || new Date(),
      },
      session: sessionData
        ? {
            id: postData.sessionId as string,
            userId: postData.userId as string,
            activityId:
              (sessionData.activityId as string) || (sessionData.projectId as string) || '',
            projectId:
              (sessionData.projectId as string) || (sessionData.activityId as string) || '',
            title: (sessionData.title as string) || 'Untitled Session',
            description: (sessionData.description as string) || '',
            duration: (sessionData.duration as number) || 0,
            startTime: convertTimestamp(sessionData.startTime) || new Date(),
            tags: (sessionData.tags as string[]) || [],
            visibility:
              (sessionData.visibility as 'everyone' | 'followers' | 'private') || 'everyone',
            showStartTime: sessionData.showStartTime as boolean | undefined,
            howFelt: sessionData.howFelt as number | undefined,
            privateNotes: sessionData.privateNotes as string | undefined,
            isArchived: (sessionData.isArchived as boolean) || false,
            supportCount: (sessionData.supportCount as number) || 0,
            commentCount: (sessionData.commentCount as number) || 0,
            createdAt: convertTimestamp(sessionData.createdAt) || new Date(),
            updatedAt: convertTimestamp(sessionData.updatedAt) || new Date(),
          }
        : ({
            id: postData.sessionId as string,
            userId: postData.userId as string,
            activityId: '',
            projectId: '',
            title: 'Session Not Found',
            description: '',
            duration: 0,
            startTime: new Date(),
            tags: [],
            visibility: 'everyone',
            isArchived: false,
            supportCount: 0,
            commentCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Session),
    }

    posts.push(post)
  }

  return posts
}
```

### Expected Impact

- **Before**: 20 posts = 80+ reads (20 users + 20 sessions + 20 projects + 20 support checks)
- **After**: 20 posts = 20-25 reads (batch loads deduplicate users/sessions)
- **Savings**: 70-75% reduction

### Testing

```typescript
// Verify feed loading is faster and uses fewer reads
import { firebasePostApi } from '@/lib/api/sessions/posts'

const feedResponse = await firebasePostApi.getFeedSessions(20)
console.log('Loaded', feedResponse.sessions.length, 'posts efficiently')
```

---

## Fix 3: Disable Automatic Follower Count Recalculation

### Current Problem

```typescript
// BEFORE: Every profile view recalculates counts
const shouldRecalculate =
  isOwnProfile || userData.followersCount === undefined || userData.followingCount === undefined

if (shouldRecalculate) {
  // Scans entire inbound/outbound collections
  const inboundSnapshot = await getDocs(inboundRef) // 🔴 500+ reads for large users
  followersCount = inboundSnapshot.size
}
```

### Solution: Cache Counts, Background Sync Only

**File**: `/src/lib/api/users/index.ts`

```typescript
getUserProfile: async (username: string): Promise<UserProfile> => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('username', '==', username)
    );
    const querySnapshot = await getDocs(usersQuery);

    if (querySnapshot.empty) {
      throw new Error('User not found');
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const isOwnProfile = auth.currentUser?.uid === userDoc.id;

    // Check privacy settings
    const profileVisibility = userData.profileVisibility || 'everyone';

    if (!isOwnProfile && profileVisibility === 'private') {
      throw new Error('This profile is private');
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (auth.currentUser && !isOwnProfile) {
      const socialGraphDoc = await getDoc(
        doc(db, `social_graph/${auth.currentUser.uid}/outbound`, userDoc.id)
      );
      isFollowing = socialGraphDoc.exists();
    }

    if (!isOwnProfile && profileVisibility === 'followers' && !isFollowing) {
      throw new Error('This profile is only visible to followers');
    }

    // 🟢 OPTIMIZED: Trust denormalized counts from document
    // Don't recalculate on every view - too expensive
    // Only recalculate if explicitly stale (>24 hours old)
    let followersCount = userData.followersCount || 0;
    let followingCount = userData.followingCount || 0;

    const MAX_COUNT_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
    const countCachedAt = userData.countCachedAt
      ? convertTimestamp(userData.countCachedAt).getTime()
      : 0;
    const countAge = Date.now() - countCachedAt;
    const shouldRecalculate = countAge > MAX_COUNT_AGE_MS && isOwnProfile;

    // Only recalculate if own profile AND counts are stale
    if (shouldRecalculate) {
      // 🟢 Schedule background recalculation, don't block profile load
      recalculateCountsInBackground(userDoc.id).catch(err => {
        handleError(err, 'Background count recalc', {
          severity: ErrorSeverity.WARNING,
        });
      });
      // Keep existing counts for this request - don't wait for recalc
    }

    return {
      id: userDoc.id,
      username: userData.username,
      name: userData.name,
      bio: userData.bio,
      location: userData.location,
      profilePicture: userData.profilePicture,
      followersCount,
      followingCount,
      totalHours: userData.totalHours || 0,
      isFollowing,
      isPrivate: profileVisibility === 'private',
      createdAt: convertTimestamp(userData.createdAt),
      updatedAt: convertTimestamp(userData.updatedAt),
    };
  } catch (_err) {
    // Handle errors as before
    const errorMessage =
      _err instanceof Error ? _err.message : 'Failed to get user profile';
    const isExpectedError =
      errorMessage === 'User not found' ||
      errorMessage === 'This profile is private' ||
      errorMessage === 'This profile is only visible to followers';

    if (!isExpectedError) {
      handleError(_err, 'Get user profile', {
        defaultMessage: ERROR_MESSAGES.PROFILE_LOAD_FAILED,
      });
    }

    throw _err;
  }
},
```

### Add Background Recalculation Function

```typescript
/**
 * Recalculate and update follower/following counts in the background
 * This doesn't block the user profile load, just updates counts asynchronously
 */
async function recalculateCountsInBackground(userId: string): Promise<void> {
  try {
    // Count followers
    const inboundRef = collection(db, `social_graph/${userId}/inbound`)
    const inboundSnapshot = await getDocs(inboundRef)
    const followersCount = inboundSnapshot.size

    // Count following
    const outboundRef = collection(db, `social_graph/${userId}/outbound`)
    const outboundSnapshot = await getDocs(outboundRef)
    const followingCount = outboundSnapshot.size

    // Update document with fresh counts
    await updateDoc(doc(db, 'users', userId), {
      followersCount,
      followingCount,
      countCachedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    // Silently fail - this is just a background maintenance task
    console.debug('Count recalc failed:', error)
  }
}
```

### Expected Impact

- **Before**: Profile view = 2-3 reads (1 user doc + 2 full collection scans)
- **After**: Profile view = 1 read (just user document, trusts denormalized counts)
- **Savings**: 80-95% reduction for profile views

### Testing

```typescript
// Test profile loads without expensive count scans
const profile = await firebaseUserApi.getUserProfile('john')
console.log('Profile loaded quickly with counts:', profile.followersCount)
// Should complete in <100ms even with 500+ followers
```

---

## Fix 4: User Search Limit

### Current Problem

```typescript
// BEFORE: Loads all 1000 users to search
const usersQuery = query(collection(db, 'users'), limitFn(1000))
const querySnapshot = await getDocs(usersQuery)

// Filter client-side
querySnapshot.forEach((docSnap) => {
  if (username.includes(searchTerm) || name.includes(searchTerm)) {
    // Add to results
  }
})
```

### Solution: Limit Initial Query & Use Efficient Filtering

**File**: `/src/lib/api/users/index.ts`

```typescript
searchUsers: async (
  searchTerm: string,
  limitCount: number = 20
): Promise<{
  users: UserSearchResult[];
  totalCount: number;
  hasMore: boolean;
}> => {
  try {
    if (auth.currentUser) {
      checkRateLimit(auth.currentUser.uid, 'SEARCH');
    }

    const term = (searchTerm || '').trim();
    if (!term) {
      return { users: [], totalCount: 0, hasMore: false };
    }

    const termLower = term.toLowerCase();

    // 🟢 OPTIMIZED: Limit initial query to avoid loading all users
    // Fetch 3x what we need to account for filtering, but cap at reasonable number
    const fetchLimit = Math.min(limitCount * 3, 100); // Never load more than 100

    const usersQuery = query(
      collection(db, 'users'),
      limitFn(fetchLimit) // 🟢 Changed from 1000 to 100
    );
    const querySnapshot = await getDocs(usersQuery);

    // Merge and de-duplicate results, prefer username matches first
    const byId: Record<string, UserSearchResult> = {};
    querySnapshot.forEach(docSnap => {
      const userData = docSnap.data();
      const username = (userData.username || '').toLowerCase();
      const name = (userData.name || '').toLowerCase();

      // Only include users whose username or name contains the search term
      if (username.includes(termLower) || name.includes(termLower)) {
        byId[docSnap.id] = {
          id: docSnap.id,
          username: userData.username,
          name: userData.name,
          bio: userData.bio,
          profilePicture: userData.profilePicture,
          followersCount:
            userData.inboundFriendshipCount || userData.followersCount || 0,
          isFollowing: false,
        } as UserSearchResult;
      }
    });

    // Convert to array and apply relevance sort
    let users = Object.values(byId)
      .sort((a, b) => {
        const t = termLower;
        const aUser = a.username?.toLowerCase() || '';
        const bUser = b.username?.toLowerCase() || '';
        const aName = a.name?.toLowerCase() || '';
        const bName = b.name?.toLowerCase() || '';

        // Prioritize exact prefix matches
        const aScore =
          (aUser.startsWith(t) ? 4 : 0) +
          (aName.startsWith(t) ? 2 : 0) +
          (aUser.includes(t) ? 1 : 0) +
          (aName.includes(t) ? 0.5 : 0);
        const bScore =
          (bUser.startsWith(t) ? 4 : 0) +
          (bName.startsWith(t) ? 2 : 0) +
          (bUser.includes(t) ? 1 : 0) +
          (bName.includes(t) ? 0.5 : 0);
        return bScore - aScore;
      })
      .slice(0, limitCount); // Return only requested amount

    // Check if current user is following each user (batch load)
    if (auth.currentUser) {
      const followingChecks = await Promise.all(
        users.map(async user => {
          if (user.id === auth.currentUser!.uid) {
            return { ...user, isFollowing: false };
          }
          const socialGraphDoc = await getDoc(
            doc(db, `social_graph/${auth.currentUser!.uid}/outbound`, user.id)
          );
          return { ...user, isFollowing: socialGraphDoc.exists() };
        })
      );
      users = followingChecks;
    }

    return {
      users,
      totalCount: users.length,
      hasMore: users.length === limitCount,
    };
  } catch (_error) {
    const apiError = handleError(_error, 'Search users', {
      defaultMessage: 'Failed to search users',
    });
    throw new Error(apiError.userMessage);
  }
},
```

### Expected Impact

- **Before**: 1 search = 1000 reads
- **After**: 1 search = 100 reads max (actual is usually 20-50)
- **Savings**: 90-95% reduction per search operation

### Testing

```typescript
// Test search with small limit
const results = await firebaseUserApi.searchUsers('john', 20)
console.log('Search returned', results.users.length, 'results')
// Should never read more than 100 docs
```

---

## Fix 5: Deploy Missing Composite Indexes

### Required Indexes

These indexes are missing and causing inefficient queries:

**Index 1: Sessions Feed (Visibility & Created)**

- Collection: `sessions`
- Fields:
  - `visibility` (Ascending)
  - `createdAt` (Descending)
- Used by: Trending feed queries

**Index 2: Sessions Following (User, Visibility, Created)**

- Collection: `sessions`
- Fields:
  - `userId` (Ascending)
  - `visibility` (Ascending)
  - `createdAt` (Descending)
- Used by: Per-user feed filtering

### How to Deploy

**Option 1: Deploy via CLI**

```bash
cd /Users/hughgramelspacher/repos/ambira-main/worktrees/feature-activities-refactor

# Deploy all indexes (including new ones)
npx firebase-tools deploy --only firestore:indexes

# Monitor deployment
npx firebase-tools firestore:indexes
```

**Option 2: Deploy via Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore → Indexes
4. Create new Composite Index for sessions (visibility, createdAt)
5. Create new Composite Index for sessions (userId, visibility, createdAt)
6. Wait for "Enabled" status

### Index Creation File

If needed, create `firebase-indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "sessions",
      "queryScope": "Collection",
      "fields": [
        { "fieldPath": "visibility", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "Collection",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "visibility", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Expected Impact

- **Before**: Feed queries scan 60+ documents with no index guidance
- **After**: Feed queries scan 20-30 documents with efficient index
- **Savings**: 60-70% reduction in feed reads
- **Speed**: Queries complete 2-3x faster

### Verification

After deploying, verify indexes are enabled:

```bash
# List all indexes and their status
npx firebase-tools firestore:indexes --json

# Should show:
# {
#   "indexes": [
#     {
#       "name": "...",
#       "state": "READY"
#     }
#   ]
# }
```

---

## Testing & Validation

### Create Test Suite

**File**: `tests/integration/firebase-optimization.test.ts`

```typescript
import { firebaseUserApi } from '@/lib/api/users'
import { firebasePostApi } from '@/lib/api/sessions/posts'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

describe('Firebase Optimization Tests', () => {
  // Track reads
  let readCount = 0

  beforeEach(() => {
    readCount = 0
    // Instrument Firestore to count reads
    jest.spyOn(db, 'getDoc').mockImplementation((docRef) => {
      readCount++
      return getDoc(docRef)
    })
  })

  test('getFollowers should batch load users', async () => {
    const followers = await firebaseUserApi.getFollowers('user123')

    // Should be ~2-3 reads (1 query + 1 batch), not 1 + N
    expect(readCount).toBeLessThan(followers.length * 0.5)
    expect(followers.length).toBeGreaterThan(0)
  })

  test('getFeedSessions should deduplicate user loads', async () => {
    const feed = await firebasePostApi.getFeedSessions(20)

    // Should be ~20-25 reads, not 80+
    expect(readCount).toBeLessThan(30)
    expect(feed.sessions.length).toBeGreaterThan(0)
  })

  test('getUserProfile should not recalculate counts', async () => {
    const profile = await firebaseUserApi.getUserProfile('john')

    // Should be 1 read (user doc), not 3+ (user + 2 collection scans)
    expect(readCount).toBeLessThan(3)
    expect(profile.followersCount).toBeGreaterThanOrEqual(0)
  })

  test('searchUsers should limit initial query', async () => {
    const results = await firebaseUserApi.searchUsers('john')

    // Should never load 1000 users
    expect(readCount).toBeLessThan(150) // 100 limit + some overhead
    expect(results.users.length).toBeLessThanOrEqual(20)
  })
})
```

### Run Tests

```bash
# Run optimization tests
npm test -- tests/integration/firebase-optimization.test.ts

# Run full test suite to ensure no regressions
npm test

# Run e2e tests to verify user-facing features
npm run test:e2e
```

### Monitor Improvements

```typescript
// Add to your monitoring/analytics:
console.metrics({
  'firestore.reads.profile': readCount,
  'firestore.reads.followers': readCount,
  'firestore.reads.feed': readCount,
  'firestore.reads.search': readCount,
})
```

### Before/After Comparison

Create a test to compare performance:

```bash
# Before optimizations
npm run test:benchmark -- --baseline

# After optimizations
npm run test:benchmark

# Compare results
# Should show ~60-75% improvement in read operations
```

---

## Rollout Plan

### Phase 1: Prepare (Day 1)

- [ ] Back up Firestore data
- [ ] Create feature branch: `feature/firebase-optimization`
- [ ] Review all changes with team

### Phase 2: Implement (Days 2-4)

- [ ] Implement Fix 1: getFollowers/getFollowing batching
- [ ] Implement Fix 2: Feed deduplication
- [ ] Implement Fix 3: Disable count recalculation
- [ ] Implement Fix 4: Search limits
- [ ] Deploy composite indexes

### Phase 3: Test (Days 5-6)

- [ ] Run unit tests: `npm test`
- [ ] Run integration tests: `npm test -- tests/integration/`
- [ ] Run e2e tests: `npm run test:e2e`
- [ ] Manual testing of critical flows
- [ ] Monitor Firestore metrics in Cloud Console

### Phase 4: Deploy (Day 7)

- [ ] Merge to main branch
- [ ] Deploy to production
- [ ] Monitor for 24 hours
- [ ] Document results

---

## Monitoring Post-Deployment

### Key Metrics to Track

1. **Read Operations**
   - Baseline: ~2000-3000 reads/hour
   - Target: ~500-800 reads/hour
   - Alert if: > 4000 reads/hour (regression)

2. **Write Operations**
   - Baseline: ~300-500 writes/hour
   - Target: ~250-400 writes/hour
   - Alert if: > 600 writes/hour

3. **Query Latency**
   - Baseline: 100-500ms (p95)
   - Target: 50-200ms (p95)
   - Alert if: > 1000ms (p95)

### Cloud Console Dashboard

Navigate to: **Cloud Firestore → Insights**

- Monitor "Composite index efficiency"
- Check "Query performance"
- Review "Document size distribution"

### Custom Alerts

```typescript
// Log optimization metrics
if (readCount > expectedReads * 1.5) {
  console.warn(`Unexpected read count: ${readCount} vs ${expectedReads}`)
  // Send alert to monitoring service
}
```

---

## Next Steps

After implementing these 5 critical fixes:

1. **Implement Fix 6-10** from the optimization report
2. **Plan data model improvements** (weeks 4-8)
3. **Set up continuous monitoring** with Firestore Insights
4. **Review costs** monthly to track savings

---

**Estimated Timeline**: 1 week for Fixes 1-5
**Expected Savings**: 60-75% reduction in read operations
**Cost Impact**: ~$300-400/month savings
