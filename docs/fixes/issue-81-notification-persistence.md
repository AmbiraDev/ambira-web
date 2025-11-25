# Fix for Issue #81: Notification Keeps Reappearing

## Problem Statement

The "n new sessions" notification in the feed was repeatedly showing the same sessions even after the user had viewed them. The notification would reappear on every page refresh or tab switch, displaying the same count of new sessions indefinitely.

### Root Cause

The Feed component was detecting "new sessions" by comparing session IDs with the current feed (the top 5 sessions). This approach had two critical flaws:

1. **No persistent tracking**: The component had no way to remember which sessions the user had already viewed
2. **ID-based comparison**: Simply checking if a session ID existed in the top 5 was unreliable and could lead to false positives

This meant the notification would trigger every time the page became visible (tab switch, browser refocus), displaying the same "new" sessions repeatedly.

## Solution Overview

The fix implements persistent "last viewed" tracking using browser localStorage. The key insight is: **A session is "new" if it was created AFTER the user last dismissed the notification.**

### How It Works

1. **localStorage tracking**: Store the timestamp of when the user last dismissed the "new sessions" notification
2. **Comparison logic**: On each visibility change, fetch the latest sessions and count only those created after the stored timestamp
3. **Update on dismissal**: When the user clicks the notification button, update the stored timestamp to now
4. **Clear on logout**: When the user logs out, clear the stored timestamp so they start fresh on next login

## Implementation Details

### Files Added

#### `/src/lib/hooks/useFeedViewedState.ts`

A utility module providing localStorage management functions:

```typescript
// Get the last viewed feed timestamp (null if first-time user)
getLastViewedFeedTime(): number | null

// Update timestamp to now (call when dismissing notification)
updateLastViewedFeedTime(): void

// Clear timestamp (call on logout)
clearFeedViewedState(): void

// Count sessions created after a given timestamp
countNewSessions(sessions, lastViewedTime): number
```

**Key design decisions:**

- Uses timestamp comparison (not session IDs) for reliability
- SSR-safe (checks for `window` existence)
- Handles multiple Firestore timestamp formats (numbers, Date objects, Timestamp objects)
- First-time users (null lastViewedTime) see no "new" notification

### Files Modified

#### `/src/features/feed/components/Feed.tsx`

**Changes:**

1. Import the three key functions: `getLastViewedFeedTime`, `updateLastViewedFeedTime`, `countNewSessions`
2. Update the `refreshSessions` callback to call `updateLastViewedFeedTime()` when notification is dismissed
3. Modify the `checkForNewSessions` effect to:
   - Read lastViewedTime from localStorage
   - Use `countNewSessions()` instead of ID comparison
   - Handle the case where no truly new sessions exist

**Before:**

```typescript
// Only compared session IDs
const newSessionIds = response.sessions.map((s) => s.id)
const currentSessionIds = allSessions.slice(0, 5).map((s) => s.id)
const newCount = newSessionIds.filter((id) => !currentSessionIds.includes(id)).length
```

**After:**

```typescript
// Compare based on creation time relative to last view
const lastViewedTime = getLastViewedFeedTime()
const newCount = countNewSessions(response.sessions, lastViewedTime)
```

#### `/src/lib/react-query/auth.queries.ts`

**Changes:**

1. Import `clearFeedViewedState` from the new utility
2. Call `clearFeedViewedState()` in the logout mutation's `onSuccess` and `onError` handlers

This ensures user data is properly cleared on logout and the next login starts fresh.

## Behavior

### First-Time User

- No localStorage entry exists for `ambira_lastViewedFeedTime`
- `getLastViewedFeedTime()` returns `null`
- `countNewSessions()` returns 0 for null (first-timers see all content normally, not as "new")
- No "new sessions" notification appears on initial feed load

### User Views Feed and Dismisses Notification

1. Feed detects new sessions (N sessions with `createdAt > lastViewedTime`)
2. Shows "Click to refresh" button with count
3. User clicks button → `refreshSessions()` called
4. `updateLastViewedFeedTime()` stores current timestamp
5. localStorage now tracks latest viewed session time

### User Switches Tabs and Returns

1. Page visibility change triggers `checkForNewSessions`
2. Fetches latest 5 sessions
3. Compares their `createdAt` against stored `lastViewedTime`
4. If same sessions: `countNewSessions` returns 0 → no notification
5. If newer sessions exist: `countNewSessions` returns count → shows notification

### User Logs Out

1. Logout mutation calls `clearFeedViewedState()`
2. localStorage entry is removed
3. All user-specific caches cleared
4. On next login: back to first-time user state

## Test Coverage

### Unit Tests: `/tests/unit/lib/hooks/useFeedViewedState.test.ts`

- **17 unit tests** covering:
  - Getting/setting localStorage values
  - Counting new sessions with various timestamp formats
  - Edge cases (null values, missing createdAt, boundary conditions)
  - Integration workflow (view → dismiss → check → repeat)

All tests pass with 100% success rate.

### Integration Tests: `/tests/integration/feed/notification-persistence.test.ts`

- **9 integration scenarios** covering real-world workflows:
  - First-time user sees no "new" notification
  - Dismissal prevents re-notification for same sessions
  - Logout clears tracking
  - Rapid checks maintain consistent state
  - Edge cases like exact timestamp boundaries
  - Browser refresh persistence

All tests pass with 100% success rate.

## localStorage Key

**Key**: `ambira_lastViewedFeedTime`
**Value**: UNIX timestamp in milliseconds (as string)
**Example**: `"1700000000000"`

This single localStorage entry is the source of truth for feed notification state.

## Technical Details

### Timestamp Comparison Logic

The solution uses **strict `>` comparison**, not `>=`:

```typescript
// A session is "new" if created AFTER (strictly greater than) lastViewedTime
return sessionTime > lastViewedTime
```

This means:

- Session created at exactly `lastViewedTime` = NOT new
- Session created 1ms after `lastViewedTime` = new
- Prevents edge cases where timestamps are equal

### Firestore Timestamp Handling

The `countNewSessions()` function handles multiple timestamp formats:

```typescript
// Millisecond timestamp (from client Date.now())
if (typeof session.createdAt === 'number')

// JavaScript Date object
if (session.createdAt instanceof Date)

// Firestore Timestamp object: { seconds: number, nanoseconds: number }
if (typeof session.createdAt === 'object' && 'seconds' in session.createdAt)
```

This flexibility ensures compatibility with various data sources.

## Edge Cases Handled

1. **First-time user**: Returns null, `countNewSessions` returns 0 (no false positives)
2. **localStorage cleared**: Treated as first-time user (graceful degradation)
3. **Multiple tabs**: Each tab tracks independently (acceptable tradeoff vs complex sync)
4. **Session with missing createdAt**: Treated as not-new (safe default)
5. **SSR/hydration**: Checks `typeof window` to avoid errors
6. **Logout while viewing**: localStorage cleared even if logout errors

## Performance Impact

- **localStorage operations**: O(1), negligible
- **countNewSessions**: O(n) where n = sessions checked, typically 5-10 sessions
- **No additional Firestore reads**: Uses existing feed query
- **No real-time listeners**: Uses visibility change event (already in place)

**Conclusion**: Negligible performance impact.

## Browser Compatibility

- localStorage: Supported in all modern browsers and IE 8+
- Required for this feature to work
- Gracefully degrades to more frequent notifications if unavailable (not ideal, but functional)

## Future Improvements

1. **Cross-tab synchronization**: Use `storage` event listener to sync across tabs
   - Currently each tab tracks independently (acceptable)
   - Could add in future if needed

2. **Server-side tracking** (long-term):
   - Store `lastViewedFeedTime` in user's Firestore document
   - Synchronize across all user's devices
   - Better UX but requires backend changes

3. **Per-filter tracking**:
   - Currently tracks globally for all feed filters
   - Could track per filter (e.g., separate for "following" vs "trending")
   - Low priority: most users view feed once and dismiss

## Verification Steps

To verify this fix works:

1. **Test basic flow**:
   - View feed (no notification on first load)
   - New sessions arrive → notification appears
   - Click notification → disappears
   - Refresh/switch tabs → notification doesn't reappear for same sessions
   - New session added → notification shows again with correct count

2. **Test logout**:
   - View and dismiss notification
   - Logout → localStorage cleared (can verify in DevTools)
   - Login → back to first-time state (no notification on initial load)

3. **Test persistence**:
   - View and dismiss notification
   - Hard refresh page → localStorage persists
   - Same sessions → no notification reappears

4. **Test edge cases**:
   - Rapid tab switching
   - Multiple sessions arriving simultaneously
   - Sessions with identical timestamps
   - Clear browser cache → treated as first-time user

## Related Files

- **Core logic**: `/src/lib/hooks/useFeedViewedState.ts`
- **Feed component**: `/src/features/feed/components/Feed.tsx` (lines 14-18, 113-122, 142-193)
- **Auth logout**: `/src/lib/react-query/auth.queries.ts` (lines 140-176)
- **Unit tests**: `/tests/unit/lib/hooks/useFeedViewedState.test.ts` (17 tests)
- **Integration tests**: `/tests/integration/feed/notification-persistence.test.ts` (9 scenarios)

## Summary

This fix solves Issue #81 by implementing persistent "last viewed" tracking using localStorage. The notification now correctly identifies truly new sessions and doesn't reappear for sessions the user has already seen. The solution is lightweight, well-tested, and handles edge cases gracefully.
