# Streaks Feature

Hooks and services for managing user streak data - tracking consecutive days of activity.

## Quick Start

```typescript
import { useStreakData, useStreakStats, useUpdateStreakVisibility } from '@/features/streaks/hooks'

// Get user's streak data
const { data: streak } = useStreakData(userId)
// streak.currentStreak, streak.longestStreak, etc.

// Get streak statistics
const { data: stats } = useStreakStats(userId)

// Update streak visibility
const updateVisibility = useUpdateStreakVisibility()
updateVisibility.mutate({ userId, isPublic: true })
```

## Available Hooks

### Query Hooks

- `useStreakData(userId)` - Get streak data (5 min cache)
- `useStreakStats(userId)` - Get streak statistics (5 min cache)

### Mutation Hooks

- `useUpdateStreakVisibility()` - Update public/private visibility setting

### Helper Hooks

- `useInvalidateStreak()` - Invalidate streak data for a user
- `useInvalidateAllStreaks()` - Invalidate all streak data

## Cache Keys

```typescript
STREAK_KEYS = {
  all: () => ['streaks'],
  data: (userId) => ['streaks', 'data', userId],
  stats: (userId) => ['streaks', 'stats', userId],
}
```

## Features

✅ **Current streak tracking** - Days of consecutive activity
✅ **Longest streak** - Historical best streak
✅ **Privacy controls** - Public or private visibility
✅ **Statistics** - Detailed streak analytics
✅ **5-minute cache** - Balanced freshness (streaks update daily)

## Usage Examples

### Display User Streak

```typescript
function StreakDisplay({ userId }: { userId: string }) {
  const { data: streak, isLoading } = useStreakData(userId);

  if (isLoading) return <Skeleton />;
  if (!streak) return null;

  return (
    <div>
      <h3>Current Streak: {streak.currentStreak} days 🔥</h3>
      <p>Longest Streak: {streak.longestStreak} days</p>
      <p>Last Activity: {streak.lastActivityDate.toLocaleDateString()}</p>
    </div>
  );
}
```

### Toggle Streak Visibility

```typescript
function StreakPrivacyToggle({ userId }: { userId: string }) {
  const { data: streak } = useStreakData(userId);
  const updateVisibility = useUpdateStreakVisibility();

  const handleToggle = () => {
    updateVisibility.mutate({
      userId,
      isPublic: !streak?.isPublic,
    });
  };

  return (
    <button onClick={handleToggle}>
      {streak?.isPublic ? 'Make Private' : 'Make Public'}
    </button>
  );
}
```

### Invalidate After Session Completion

```typescript
function SessionCompleteHandler() {
  const invalidateStreak = useInvalidateStreak();
  const completeSession = useCompleteSession();

  const handleComplete = async (sessionData) => {
    await completeSession.mutateAsync(sessionData);

    // Streak might have changed after completing a session
    invalidateStreak(sessionData.userId);
  };

  return <button onClick={handleComplete}>Complete Session</button>;
}
```

## Migration

**Before:**

```typescript
import { useStreak } from '@/hooks/useCache'

const { data } = useStreak(userId)
```

**After:**

```typescript
import { useStreakData } from '@/features/streaks/hooks'

const { data } = useStreakData(userId)
```

## Service Layer

The `StreakService` provides:

- `getStreakData(userId)` - Fetch streak data from Firestore
- `getStreakStats(userId)` - Fetch streak statistics
- `updateStreakVisibility(userId, isPublic)` - Update privacy setting

All service methods handle errors gracefully and return `null` on failure for reads.

## Cache Strategy

**5-minute cache** - Streaks update daily at most, so medium cache time provides good balance between freshness and performance.

## Related Features

- **Sessions** - Completing sessions extends streaks
- **Profile** - Streaks displayed on user profiles
- **Feed** - Streak milestones may appear in feed
