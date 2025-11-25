# Integration Tests

This directory contains integration tests that verify cross-module workflows and realistic user flows in the Ambira application.

## Overview

Integration tests sit between unit tests and E2E tests, testing how multiple modules work together without requiring a full browser environment. They use mocked Firebase services with in-memory state to verify complete workflows.

## Test Structure

```
tests/integration/
├── __helpers__/           # Shared test utilities
│   ├── index.ts          # Main export
│   ├── testProviders.tsx # React Query providers for tests
│   ├── firebaseMocks.ts  # In-memory Firebase implementation
│   ├── testFactories.ts  # Data factory functions
│   └── waitUtils.ts      # Async waiting utilities
├── auth/                 # Authentication flows
├── timer/                # Timer/session lifecycle
├── feed/                 # Feed interactions (support, comments)
├── projects/             # Project management
├── sessions/             # Session CRUD operations
├── groups/               # Group membership and management
├── challenges/           # Challenge participation
├── social/               # Social features (follow, unfollow)
├── search/               # Search functionality
├── notifications/        # Notification flows
├── profile/              # Profile management
├── media/                # Media upload flows
└── analytics/            # Analytics dashboard
```

## Test Helpers

### Test Providers (`testProviders.tsx`)

Provides React Query context and mock router for testing:

```typescript
import { renderWithProviders, createTestQueryClient } from '../__helpers__';

it('tests component with providers', () => {
  const { queryClient } = renderWithProviders(<MyComponent />);
  // Test with full provider context
});
```

### Firebase Mocks (`firebaseMocks.ts`)

In-memory Firebase store that maintains state across operations:

```typescript
import { testFirebaseStore, createMockFirebaseApi } from '../__helpers__'

const mockApi = createMockFirebaseApi(testFirebaseStore)

// Store maintains state for verification
await mockApi.sessions.create(sessionData)
const session = testFirebaseStore.getSession(sessionId)
```

### Test Factories (`testFactories.ts`)

Factory functions for creating test data:

```typescript
import {
  createTestUser,
  createTestProject,
  createTestSession,
  resetFactoryCounters,
} from '../__helpers__'

beforeEach(() => {
  resetFactoryCounters() // Reset IDs for each test
})

const user = createTestUser({ email: 'test@example.com' })
const project = createTestProject(user.id, { name: 'My Project' })
```

### Wait Utilities (`waitUtils.ts`)

Async waiting helpers for React Query operations:

```typescript
import { waitForCacheUpdate, waitForQueryData } from '../__helpers__'

await waitForCacheUpdate(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument()
})

await waitForQueryData(queryClient, CACHE_KEYS.USER(userId))
```

## Test Coverage by Priority

### P0 - CRITICAL FLOWS (Completed)

**Authentication** (`auth/`)

- ✅ `signup-flow.test.ts` - Complete signup workflow with validation
- ✅ `login-flow.test.ts` - Login, auth state, protected routes
- ✅ `logout-flow.test.ts` - Logout, cache clearing, re-authentication

**Timer** (`timer/`)

- ✅ `session-lifecycle.test.ts` - Start, pause, resume, complete, cancel
- ✅ `timer-persistence.test.ts` - Page refresh, stale cleanup, multi-tab sync

**Feed** (`feed/`)

- ✅ `support-flow.test.ts` - Support/unsupport with optimistic updates
- ✅ `comment-flow.test.ts` - Add/delete comments with count updates

### P1 - HIGH PRIORITY FLOWS (Partially Complete)

**Projects** (`projects/`)

- ✅ `create-project-flow.test.ts` - Project creation with validation

**Social** (`social/`)

- ✅ `follow-flow.test.ts` - Follow/unfollow with count updates

**Sessions** (`sessions/`) - _TODO_

- ❌ `create-session-flow.test.ts` - Manual session entry
- ❌ `edit-session-flow.test.ts` - Session editing and updates

**Groups** (`groups/`) - _TODO_

- ❌ `join-group-flow.test.ts` - Group membership
- ❌ `create-group-flow.test.ts` - Group creation

**Challenges** (`challenges/`) - _TODO_

- ❌ `participation-flow.test.ts` - Challenge participation
- ❌ `lifecycle.test.ts` - Challenge creation to completion

### P2 - MEDIUM PRIORITY FLOWS (TODO)

**Search** (`search/`) - _TODO_

- ❌ `search-flow.test.ts` - Search with debounce
- ❌ `filter-results.test.ts` - Filter application

**Notifications** (`notifications/`) - _TODO_

- ❌ `notification-flow.test.ts` - Receive and mark read
- ❌ `real-time-updates.test.ts` - Real-time notification updates

**Profile** (`profile/`) - _TODO_

- ❌ `edit-profile-flow.test.ts` - Profile editing
- ❌ `privacy-settings-flow.test.ts` - Privacy changes

**Media** (`media/`) - _TODO_

- ❌ `upload-flow.test.ts` - File upload workflow

## Running Integration Tests

```bash
# Run all integration tests
npm test tests/integration

# Run specific test suite
npm test tests/integration/auth

# Run with coverage
npm test -- --coverage tests/integration

# Watch mode
npm test -- --watch tests/integration
```

## Writing Integration Tests

### Basic Structure

```typescript
import {
  createTestQueryClient,
  createMockFirebaseApi,
  testFirebaseStore,
  resetFirebaseStore,
  createTestUser,
  resetFactoryCounters,
} from '../__helpers__'

const mockFirebaseApi = createMockFirebaseApi(testFirebaseStore)

jest.mock('@/lib/api', () => ({
  firebaseAuthApi: mockFirebaseApi.auth,
}))

describe('Integration: Feature Flow', () => {
  let queryClient: any
  let user: any

  beforeEach(() => {
    queryClient = createTestQueryClient()
    resetFirebaseStore()
    resetFactoryCounters()
    jest.clearAllMocks()

    user = createTestUser()
    testFirebaseStore.createUser(user)
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('completes workflow: action → API → cache → UI', async () => {
    // Arrange: Setup initial state
    // Act: Perform action
    // Assert: Verify API call
    // Assert: Verify Firebase state
    // Assert: Verify cache update
  })
})
```

### Best Practices

1. **Test Complete Workflows**: Test multiple steps together (e.g., create → update → delete)
2. **Verify All Side Effects**: Check API calls, Firebase state, cache updates
3. **Use Factory Functions**: Create consistent test data with factories
4. **Test Optimistic Updates**: Verify immediate UI updates before API completion
5. **Test Error Handling**: Verify rollback on API failures
6. **Test Persistence**: Verify state survives page refresh
7. **Test Edge Cases**: Handle duplicate operations, race conditions, etc.

### Common Patterns

**Optimistic Update Pattern**:

```typescript
// Optimistic update
queryClient.setQueryData(key, optimisticValue)

// API call
await mockApi.action()

// Verify optimistic UI
expect(screen.getByText('Updated')).toBeInTheDocument()

// Verify API called
expect(mockApi.action).toHaveBeenCalled()
```

**Error Rollback Pattern**:

```typescript
const previousValue = queryClient.getQueryData(key)

// Optimistic update
queryClient.setQueryData(key, newValue)

// Mock error
mockApi.action.mockRejectedValueOnce(new Error('Failed'))

try {
  await mockApi.action()
} catch {
  // Rollback
  queryClient.setQueryData(key, previousValue)
}

expect(queryClient.getQueryData(key)).toEqual(previousValue)
```

**Multi-User Pattern**:

```typescript
const user1 = createTestUser({ email: 'user1@test.com' })
const user2 = createTestUser({ email: 'user2@test.com' })

testFirebaseStore.createUser(user1)
testFirebaseStore.createUser(user2)

// Both users interact with same data
await mockApi.action(user1.id)
await mockApi.action(user2.id)

// Verify concurrent state
```

## Debugging Integration Tests

### View Firebase Store State

```typescript
// In test
console.log('Users:', Array.from(testFirebaseStore['users'].values()))
console.log('Sessions:', Array.from(testFirebaseStore['sessions'].values()))
```

### View Query Cache State

```typescript
// In test
console.log('Cache:', queryClient.getQueryCache().getAll())
console.log('User cache:', queryClient.getQueryData(CACHE_KEYS.USER(userId)))
```

### Common Issues

**Issue**: Tests pass individually but fail together
**Solution**: Ensure `resetFirebaseStore()` and `resetFactoryCounters()` are called in `beforeEach`

**Issue**: Mock not being called
**Solution**: Verify the mock path matches the actual import in the component

**Issue**: Async timing issues
**Solution**: Use `waitFor` or `waitForCacheUpdate` helpers

## Coverage Goals

- **P0 Flows**: 100% coverage (COMPLETED)
- **P1 Flows**: 80% coverage (IN PROGRESS - 40% complete)
- **P2 Flows**: 60% coverage (TODO)

## Contributing

When adding new features:

1. Create integration tests in the appropriate directory
2. Use existing helpers and patterns
3. Add test description to this README
4. Update coverage goals
5. Ensure tests run in CI

## References

- [React Query Testing](https://tanstack.com/query/latest/docs/framework/react/guides/testing)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)
- [Jest Mock Functions](https://jestjs.io/docs/mock-functions)
