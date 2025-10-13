# Rate Limiting Implementation

This document describes the rate limiting implementation added to the Ambira application to prevent abuse and protect Firebase resources.

## Overview

The rate limiting system provides client-side protection against excessive API calls. It uses in-memory storage to track request counts per user per operation, with automatic cleanup and exponential backoff for repeated violations.

## Implementation Details

### Core Files

- **`src/lib/rateLimit.ts`** - Main rate limiting utility with configuration
- **`src/lib/__tests__/rateLimit.test.ts`** - Comprehensive test suite (20 tests, all passing)

### Protected Operations

The following operations are now rate-limited:

#### Authentication (per email/user)

- **Login**: 5 attempts per 15 minutes
- **Signup**: 3 attempts per hour

#### Social Actions (per user)

- **Follow/Unfollow**: 20 actions per minute
- **Support (likes)**: 30 actions per minute
- **Comments**: 10 per minute

#### Content Creation (per user)

- **Sessions**: 30 per minute
- **Projects**: 10 per minute
- **Tasks**: 50 per minute
- **Session Updates**: 50 per minute
- **Project Updates**: 30 per minute

#### File Operations (per user)

- **File Uploads**: 10 per minute

#### Search (per user)

- **Search Queries**: 30 per minute

### Key Features

1. **In-Memory Storage**: Fast, no external dependencies
2. **Per-User Tracking**: Each user has separate limits for each operation
3. **Automatic Cleanup**: Expired rate limit entries are cleaned every 5 minutes
4. **Exponential Backoff**: Repeated violations result in progressively longer wait times
5. **User-Friendly Errors**: Clear error messages with retry information
6. **Time Window Reset**: Limits automatically reset after the configured time window

## Usage

### Basic Usage

```typescript
import { checkRateLimit } from '@/lib/rateLimit';

// Check rate limit before performing operation
try {
  checkRateLimit(userId, 'AUTH_LOGIN');
  // Proceed with login
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter} seconds`);
  }
}
```

### Async Wrapper

```typescript
import { withRateLimit } from '@/lib/rateLimit';

const result = await withRateLimit(userId, 'PROJECT_CREATE', async () => {
  // Your async operation here
  return await createProject(data);
});
```

### Get Rate Limit Info

```typescript
import { getRateLimitInfo } from '@/lib/rateLimit';

const info = getRateLimitInfo(userId, 'FOLLOW');
console.log(`Remaining: ${info.remaining}/${info.limit}`);
console.log(`Reset in: ${info.resetTime}ms`);
console.log(`Violations: ${info.violations}`);
```

### Reset Rate Limit (Admin/Testing)

```typescript
import { resetRateLimit } from '@/lib/rateLimit';

// Reset a specific user's rate limit for an operation
resetRateLimit(userId, 'AUTH_LOGIN');
```

## Integration Points

Rate limiting has been integrated into the following Firebase API functions:

### `src/lib/firebaseApi.ts`

- `firebaseAuthApi.login()` - Login attempts
- `firebaseAuthApi.signup()` - Signup attempts
- `firebaseUserApi.followUser()` - Follow actions
- `firebaseUserApi.unfollowUser()` - Unfollow actions
- `firebaseUserApi.searchUsers()` - Search queries
- `firebaseProjectApi.createProject()` - Project creation
- `firebaseSessionApi.createSession()` - Session creation
- `firebaseSessionApi.supportSession()` - Support/like actions
- `firebaseCommentApi.createComment()` - Comment creation

### `src/lib/imageUpload.ts`

- `uploadImage()` - File uploads

## Error Handling

When a rate limit is exceeded, a `RateLimitError` is thrown with the following properties:

```typescript
class RateLimitError extends Error {
  message: string; // User-friendly error message
  retryAfter: number; // Seconds until retry is allowed
  limit: number; // The rate limit that was exceeded
}
```

Example error handling:

```typescript
try {
  await firebaseAuthApi.login(credentials);
} catch (error) {
  if (error instanceof RateLimitError) {
    // Rate limit specific handling
    toast.error(
      `${error.message} Please wait ${formatRetryAfter(error.retryAfter)}`
    );
  } else {
    // Other error handling
    toast.error(error.message);
  }
}
```

## Configuration

Rate limits are configured in `src/lib/rateLimit.ts`:

```typescript
export const RATE_LIMITS = {
  AUTH_LOGIN: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts. Please try again later.',
  },
  // ... other limits
};
```

To adjust limits, modify the values in the `RATE_LIMITS` object.

## Testing

Run the test suite:

```bash
npm test -- src/lib/__tests__/rateLimit.test.ts
```

The test suite includes:

- Basic rate limiting functionality
- Multi-user and multi-operation tracking
- Error throwing and messages
- Exponential backoff
- Time window expiration
- Configuration validation

## Monitoring and Metrics

To monitor rate limiting in production:

1. **Check violation counts**:

```typescript
const info = getRateLimitInfo(userId, operation);
console.log(
  `User ${userId} has ${info.violations} violations for ${operation}`
);
```

2. **Log rate limit errors**:

```typescript
catch (error) {
  if (error instanceof RateLimitError) {
    console.warn('Rate limit exceeded', {
      userId,
      operation,
      retryAfter: error.retryAfter,
      limit: error.limit
    });
  }
}
```

## Future Enhancements

Potential improvements for the future:

1. **Server-Side Rate Limiting**: Move to Firebase Cloud Functions for more robust protection
2. **Redis/Firestore Storage**: For distributed rate limiting across multiple instances
3. **IP-Based Limiting**: For unauthenticated operations
4. **Dynamic Limits**: Adjust limits based on user tier or behavior
5. **Analytics Dashboard**: Track rate limit violations and patterns
6. **Allowlist/Blocklist**: Special handling for specific users
7. **Circuit Breaker**: Temporary blocking for severe abuse

## Performance Impact

The rate limiting implementation has minimal performance overhead:

- **Memory**: ~100 bytes per active user-operation pair
- **CPU**: O(1) for rate limit checks
- **Cleanup**: Runs every 5 minutes, O(n) where n = number of entries

## Security Considerations

1. **Client-Side Only**: Current implementation is client-side only. Sophisticated attackers can bypass it by modifying the client code.
2. **No Persistence**: Rate limits reset on page reload or app restart.
3. **Complementary to Firebase Security Rules**: This should work alongside Firebase security rules, not replace them.

For production applications, consider implementing server-side rate limiting in Firebase Cloud Functions.

## Troubleshooting

### Rate limit triggered too easily

- Increase `maxRequests` in the configuration
- Increase `windowMs` for a longer time window

### Rate limit not working

- Ensure `checkRateLimit()` is called before the operation
- Verify the userId is consistent across calls
- Check that RateLimitError is not being caught and ignored

### Memory concerns

- The cleanup interval can be adjusted (currently 5 minutes)
- Consider calling `rateLimiter.destroy()` when appropriate
- Reset specific limits with `resetRateLimit()` if needed

## Support

For questions or issues:

1. Review this documentation
2. Check the test suite for examples
3. Create an issue in the repository
