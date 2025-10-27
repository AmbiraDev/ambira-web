# Sessions Feature

This feature provides hooks and services for managing user sessions in the Ambira application. Sessions are the core content type in Ambira - they function as posts and represent tracked work/productivity sessions.

## Structure

```
sessions/
├── services/SessionService.ts          # Business logic (no React dependencies)
├── hooks/
│   ├── useSessions.ts                  # Query hooks (React Query boundary)
│   ├── useSessionMutations.ts          # Mutation hooks (React Query boundary)
│   └── index.ts                        # Public API exports
└── README.md                           # This file
```

## Quick Start

```typescript
import {
  useSession,
  useSessionWithDetails,
  useUserSessions,
  useDeleteSession,
  useSupportSession,
  useUpdateSession
} from '@/features/sessions/hooks';

// Get session by ID
function SessionDetail({ sessionId }: { sessionId: string }) {
  const { data: session, isLoading, error } = useSession(sessionId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{session?.title}</div>;
}

// Support (like) a session with optimistic updates
function SupportButton({ sessionId, currentUserId }: Props) {
  const supportMutation = useSupportSession(currentUserId);
  const { data: session } = useSession(sessionId);

  const handleSupport = () => {
    const action = session?.isSupported ? 'unsupport' : 'support';
    supportMutation.mutate({ sessionId, action });
    // UI updates instantly!
  };

  return (
    <button onClick={handleSupport}>
      {session?.isSupported ? 'Unlike' : 'Like'} ({session?.supportCount || 0})
    </button>
  );
}
```

## Available Hooks

### Query Hooks

- `useSession(sessionId)` - Get session by ID (5 min cache)
- `useSessionWithDetails(sessionId)` - Get session with user & activity data (5 min cache)
- `useUserSessions(userId, filters?)` - Get all sessions for a user (5 min cache)

### Mutation Hooks

- `useDeleteSession()` - Delete a session (optimistic removal from feed)
- `useSupportSession(userId?)` - Support/unsupport a session (instant UI updates)
- `useUpdateSession()` - Update session fields (optimistic updates)

### Helper Hooks

- `useInvalidateSession()` - Invalidate single session cache
- `useInvalidateAllSessions()` - Invalidate all sessions

## Features

✅ **Hierarchical cache keys** for efficient invalidation
✅ **Optimistic updates** for instant UI feedback
✅ **Automatic rollback** on mutation errors
✅ **5-minute cache** with smart invalidation
✅ **TypeScript** end-to-end type safety
✅ **Testable** service layer without React dependencies

## Cache Keys Structure

```typescript
SESSION_KEYS = {
  all: () => ['sessions'],
  detail: (id) => ['sessions', 'detail', id],
  detailWithData: (id) => ['sessions', 'detail', id, 'with-details'],
  userSessions: (userId, filters) => ['sessions', 'user', userId, filters],
}
```

## Migration from Old Hooks

**Before:**
```typescript
import { useSession } from '@/hooks/useCache';
import { useDeleteSessionMutation, useSupportMutation } from '@/hooks/useMutations';
```

**After:**
```typescript
import {
  useSession,
  useDeleteSession,
  useSupportSession
} from '@/features/sessions/hooks';
```

## Further Reading

- [Architecture Overview](../../../docs/architecture/README.md)
- [Caching Strategy](../../../docs/architecture/CACHING_STRATEGY.md)
- [Migration Guide](../../../docs/architecture/MIGRATION_GUIDE.md)
- [Complete Examples](../../../docs/architecture/EXAMPLES.md)
