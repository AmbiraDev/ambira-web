# Firestore Indexes Guide

Comprehensive guide to Firestore composite indexes required for Ambira. Learn what they are, why they're needed, and how to create them.

## What Are Firestore Indexes?

Firestore uses indexes to efficiently query data. Single-field indexes are created automatically, but **composite indexes** (queries on multiple fields) must be created manually.

### Why Are They Needed?

Without proper indexes, complex queries will fail with errors like:

```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

Indexes enable:

- Filtering and sorting on multiple fields simultaneously
- Efficient pagination of large datasets
- Fast leaderboard and feed queries

## How Indexes Work

When you run a query that needs a composite index:

1. Firestore detects the missing index
2. Browser console shows an error with a creation link
3. Click the link to auto-create the index
4. Wait 2-5 minutes for the index to build
5. Re-run your query

## Required Indexes for Ambira

Below are all composite indexes required for Ambira to function properly.

### 1. Sessions - Following Feed

**Purpose**: Fetch recent sessions from users you follow, filtered by visibility.

**Query Example**:

```typescript
collection(db, 'sessions')
  .where('visibility', 'in', ['everyone', 'followers'])
  .orderBy('createdAt', 'desc')
  .limit(20)
```

**Index Configuration**:

- **Collection**: `sessions`
- **Fields**:
  - `visibility` - Ascending
  - `createdAt` - Descending

**When Created**: First time loading the feed with "Following" filter.

**Manual Creation**:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Firestore Database > Indexes
3. Click "Create Index"
4. Set collection ID: `sessions`
5. Add fields:
   - Field: `visibility`, Order: Ascending
   - Field: `createdAt`, Order: Descending
6. Click "Create"

---

### 2. Sessions - Trending Feed

**Purpose**: Fetch popular sessions from the last 7 days, sorted by engagement.

**Query Example**:

```typescript
collection(db, 'sessions')
  .where('visibility', '==', 'everyone')
  .where('createdAt', '>', sevenDaysAgo)
  .orderBy('createdAt', 'desc')
  .orderBy('supportCount', 'desc')
  .limit(20)
```

**Index Configuration**:

- **Collection**: `sessions`
- **Fields**:
  - `visibility` - Ascending
  - `createdAt` - Descending
  - `supportCount` - Descending (optional, for trending sort)

**When Created**: First time loading the feed with "Trending" filter.

> **Note**: This index may be automatically satisfied by the "Following Feed" index depending on your query structure. If you get an index error, use the link to create it.

---

### 3. Sessions - User Activity with Date Filter

**Purpose**: Fetch user's sessions within a specific date range (used for group leaderboards).

**Query Example**:

```typescript
collection(db, 'sessions')
  .where('userId', '==', currentUserId)
  .where('createdAt', '>=', startDate)
  .where('createdAt', '<=', endDate)
  .orderBy('createdAt', 'asc')
```

**Index Configuration**:

- **Collection**: `sessions`
- **Fields**:
  - `userId` - Ascending
  - `createdAt` - Ascending

**When Created**: First time viewing a group leaderboard with time filter (week/month).

**Use Cases**:

- Group challenge leaderboards filtered by time period
- User analytics with date ranges
- Weekly/monthly activity summaries

---

### 4. Challenge Participants - Leaderboard Sorting

**Purpose**: Fetch and sort challenge participants by progress.

**Query Example**:

```typescript
collection(db, 'challengeParticipants')
  .where('challengeId', '==', challengeId)
  .orderBy('progress', 'desc')
  .limit(100)
```

**Index Configuration**:

- **Collection**: `challengeParticipants`
- **Fields**:
  - `challengeId` - Ascending
  - `progress` - Descending

**When Created**: First time viewing a challenge leaderboard.

---

### 5. Comments - Session Comments with Replies

**Purpose**: Fetch comments for a session, sorted by creation date, excluding deleted ones.

**Query Example**:

```typescript
collection(db, 'comments')
  .where('sessionId', '==', sessionId)
  .where('parentId', '==', null)
  .orderBy('createdAt', 'desc')
```

**Index Configuration**:

- **Collection**: `comments`
- **Fields**:
  - `sessionId` - Ascending
  - `parentId` - Ascending
  - `createdAt` - Descending

**When Created**: First time loading comments on a session.

---

### 6. Groups - Discovery by Category

**Purpose**: Browse groups filtered by category and sorted by member count.

**Query Example**:

```typescript
collection(db, 'groups')
  .where('category', '==', 'fitness')
  .where('privacySetting', 'in', ['public', 'approval-required'])
  .orderBy('memberCount', 'desc')
  .limit(20)
```

**Index Configuration**:

- **Collection**: `groups`
- **Fields**:
  - `category` - Ascending
  - `privacySetting` - Ascending
  - `memberCount` - Descending

**When Created**: First time using group category filters.

---

### 7. Follows - Mutual Friendships

**Purpose**: Find mutual followers (people you follow who also follow you).

**Query Example**:

```typescript
collection(db, 'follows').where('followerId', '==', userId).where('followingId', 'in', followerIds)
```

**Index Configuration**:

- **Collection**: `follows`
- **Fields**:
  - `followerId` - Ascending
  - `followingId` - Ascending

**When Created**: First time checking for mutual followers.

**Note**: This may be satisfied by existing single-field indexes depending on query structure.

---

## Auto-Creation Method (Recommended)

The easiest way to create indexes is to let Firestore auto-generate them:

1. **Use the App Normally**
   - Navigate to different features (feed, challenges, groups)
   - Try different filters and sorting options

2. **Watch Browser Console**
   - Open Developer Tools (F12)
   - Look for index errors in the Console tab

3. **Click the Creation Link**
   - Each error includes a direct link to create the index
   - Example: `https://console.firebase.google.com/v1/r/project/.../firestore/indexes?create_composite=...`

4. **Wait for Index to Build**
   - Small indexes: 1-2 minutes
   - Large indexes (lots of existing data): 5-10 minutes
   - Check Firestore Console > Indexes for build status

5. **Retry Your Action**
   - Once index shows "Enabled" status, retry the query
   - The feature should now work

## Manual Creation Method

If you prefer to create indexes upfront:

### Using Firebase Console (GUI)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** > **Indexes**
4. Click **Create Index** (or **Add index**)
5. Configure the index:
   - Collection ID: e.g., `sessions`
   - Fields to index:
     - Add each field with Ascending/Descending order
     - Order matters! Match the query exactly
6. Click **Create**
7. Wait for "Enabled" status

### Using Firebase CLI

You can define indexes in `firestore.indexes.json` and deploy them:

```json
{
  "indexes": [
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "visibility", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy with:

```bash
npx firebase-tools deploy --only firestore:indexes --non-interactive
```

## Index Best Practices

### Performance Tips

1. **Create Only What You Need**
   - Each index costs storage and write time
   - Only create indexes for queries you actually use

2. **Index Build Time**
   - Indexes on collections with lots of existing data take longer to build
   - Plan index creation during low-traffic periods

3. **Monitor Index Usage**
   - Firebase Console > Firestore > Indexes shows usage stats
   - Delete unused indexes to save resources

### Query Design

1. **Match Index Order**
   - Query field order must match index field order exactly
   - `where('a').where('b').orderBy('c')` ≠ `where('b').where('a').orderBy('c')`

2. **Inequality Filters**
   - Only one inequality filter (`>`, `<`, `!=`) per query
   - Must be the first orderBy field

3. **Array-Contains and In Operators**
   - `array-contains` and `in` operators require specific indexes
   - Can't combine `array-contains` with inequality filters

## Troubleshooting Index Issues

### Index creation fails

**Error**: "Index creation failed"

**Solutions**:

- Check if an identical index already exists
- Verify field names match your collection schema exactly
- Try deleting and recreating the index
- Wait a few minutes and try again (temporary Firebase issue)

### Query still fails after index creation

**Error**: "The query requires an index" even after creating it

**Solutions**:

- Wait 2-5 minutes for index to fully build
- Check Firestore Console > Indexes for "Enabled" status
- Verify index fields exactly match your query
- Check field order matches query order

### Index stuck in "Building" status

**Symptom**: Index shows "Building" for more than 15 minutes

**Solutions**:

- Check collection size (large collections take longer)
- Wait up to 1 hour for very large collections
- Check [Firebase Status Page](https://status.firebase.google.com/) for incidents
- Try deleting and recreating if stuck for >2 hours

### Index error links don't work

**Error**: Clicking the console link doesn't create the index

**Solutions**:

- Copy the link and open in a new private/incognito window
- Ensure you're logged into the correct Google account
- Manually create the index using the GUI method above
- Check browser console for any JavaScript errors blocking the popup

## Checking Current Indexes

### Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** > **Indexes**
4. View all indexes and their status:
   - **Enabled**: Index is ready to use
   - **Building**: Index is being created
   - **Error**: Index creation failed

### Firebase CLI

List all indexes:

```bash
npx firebase-tools firestore:indexes
```

## Deleting Unused Indexes

To save resources and improve write performance:

1. Go to Firebase Console > Firestore > Indexes
2. Find unused indexes (check "Last Used" column if available)
3. Click the three dots menu > **Delete index**
4. Confirm deletion

Or use CLI:

```bash
npx firebase-tools firestore:indexes:delete <index-name>
```

## Production Considerations

### Before Launching

1. **Create All Indexes Upfront**
   - Don't rely on auto-creation in production
   - Test all features in staging to trigger index creation
   - Export indexes from staging and import to production

2. **Index Deployment Strategy**
   - Deploy indexes before deploying code that uses them
   - Use `firestore.indexes.json` for version control
   - Include index updates in deployment checklists

3. **Monitoring**
   - Set up alerts for query errors
   - Monitor Firestore usage and performance metrics
   - Track index build times during deployments

### Index Costs

- **Storage**: Each index requires additional storage (minimal cost)
- **Writes**: Index updates happen on every document write (adds latency)
- **Reads**: Indexes speed up reads significantly (worth the cost)

**Rule of Thumb**: Index costs are negligible compared to the performance benefits for most applications.

## Additional Resources

- [Firestore Indexing Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Index Types and Best Practices](https://firebase.google.com/docs/firestore/query-data/index-overview)
- [Query Limitations](https://firebase.google.com/docs/firestore/query-data/queries#query_limitations)
- [Firestore Pricing](https://firebase.google.com/pricing)

---

**Last Updated**: November 2024
**Firestore Version**: Native mode
**Next.js Version**: 15.x
