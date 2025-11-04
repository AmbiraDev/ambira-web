# Comments Feature

This feature provides hooks and services for managing comments on sessions in the Ambira application. Comments support nested replies, likes, and real-time updates.

## Structure

```
comments/
├── services/CommentService.ts          # Business logic (no React dependencies)
├── hooks/
│   ├── useComments.ts                  # Query hooks (React Query boundary)
│   ├── useCommentMutations.ts          # Mutation hooks (React Query boundary)
│   └── index.ts                        # Public API exports
└── README.md                           # This file
```

## Quick Start

```typescript
import {
  useSessionComments,
  useCreateComment,
  useDeleteComment,
  useCommentLike
} from '@/features/comments/hooks';

// Get comments for a session
function CommentsList({ sessionId }: { sessionId: string }) {
  const { data, isLoading } = useSessionComments(sessionId);
  const comments = data?.comments || [];

  if (isLoading) return <div>Loading comments...</div>;

  return (
    <div>
      {comments.map(comment => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}

// Create a comment
function AddComment({ sessionId }: { sessionId: string }) {
  const createMutation = useCreateComment();
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      sessionId,
      content: text
    });
    setText('');
  };

  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={handleSubmit} disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Posting...' : 'Post Comment'}
      </button>
    </div>
  );
}

// Like a comment
function LikeButton({ commentId, sessionId }: Props) {
  const likeMutation = useCommentLike(sessionId);

  return (
    <button onClick={() => likeMutation.mutate({ commentId, action: 'like' })}>
      Like
    </button>
  );
}
```

## Available Hooks

### Query Hooks

- `useSessionComments(sessionId, limit?)` - Get all comments for a session (1 min cache)

### Mutation Hooks

- `useCreateComment()` - Create a comment (updates comment count in feed)
- `useUpdateComment()` - Update comment content (optimistic updates)
- `useDeleteComment()` - Delete a comment (optimistic removal + count update)
- `useCommentLike(sessionId)` - Like/unlike a comment (instant UI updates)

### Helper Hooks

- `useInvalidateComments()` - Invalidate comments for a session
- `useInvalidateAllComments()` - Invalidate all comment caches

## Features

✅ **Optimistic updates** for all mutations
✅ **Automatic comment count** updates in feed and session
✅ **Nested replies** support via parentId
✅ **Like system** with instant feedback
✅ **1-minute cache** for frequently changing data
✅ **TypeScript** end-to-end type safety
✅ **Testable** service layer without React

## Cache Keys Structure

```typescript
COMMENT_KEYS = {
  all: () => ['comments'],
  lists: () => ['comments', 'list'],
  list: (sessionId, limit) => ['comments', 'list', sessionId, limit],
  session: sessionId => ['comments', 'session', sessionId],
};
```

## Migration from Old Hooks

**Before:**

```typescript
import {
  useAddCommentMutation,
  useDeleteCommentMutation,
  useCommentLikeMutation,
} from '@/hooks/useMutations';
```

**After:**

```typescript
import {
  useCreateComment,
  useDeleteComment,
  useCommentLike,
} from '@/features/comments/hooks';
```

## Further Reading

- [Architecture Overview](../../../docs/architecture/README.md)
- [Caching Strategy](../../../docs/architecture/CACHING_STRATEGY.md)
- [Migration Guide](../../../docs/architecture/MIGRATION_GUIDE.md)
