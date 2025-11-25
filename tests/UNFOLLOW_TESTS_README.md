# Unfollow Functionality Test Suite

This document describes the comprehensive test suite for the unfollow functionality in Ambira.

## Overview

The unfollow test suite follows the project's 3-tier testing strategy:

1. **Unit Tests** - Isolated logic testing for services, hooks, and components
2. **Integration Tests** - Cross-module workflow testing
3. **E2E Tests** - Full user journey testing (to be added)

## Test Coverage

### Unit Tests

#### 1. Service Layer (`tests/unit/lib/api/social/updateSocialGraph.test.ts`)

Tests the core `updateSocialGraph` helper function for unfollow operations.

**Coverage:**

- Deletes social graph documents correctly
- Decrements follower/following counts
- Handles mutual friendship count updates
- Edge cases: not following, user not found
- Transaction integrity (reads before writes)
- Error handling
- No notification created for unfollow

**Test Count:** 10 tests
**Status:** ✅ All Passing

#### 2. UI Components

##### UserCard Component (`tests/unit/components/UserCard.unfollow.test.tsx`)

Tests the unfollow button interactions in the UserCard component.

**Coverage:**

- Button display states (Following/Follow)
- Unfollow click handling
- Optimistic UI updates
- Error handling and rollback
- Loading states
- Event propagation
- Variant-specific behavior (search, suggestion, follower)
- UserCardCompact variant
- Authentication edge cases

**Test Count:** 15+ tests
**Location:** `/Users/hughgramelspacher/repos/ambira-main/worktrees/fix-unfollow/tests/unit/components/`

##### ProfileHeader Component (`tests/unit/components/ProfileHeader.unfollow.test.tsx`)

Tests the unfollow functionality in the ProfileHeader component.

**Coverage:**

- Following button display with checkmark icon
- Unfollow action handling
- Follower count decrements (with floor at zero)
- onProfileUpdate callback invocation
- Loading and disabled states
- Error handling
- Own profile behavior (no follow button)
- Profile stats display updates

**Test Count:** 12+ tests
**Location:** `/Users/hughgramelspacher/repos/ambira-main/worktrees/fix-unfollow/tests/unit/components/`

### Integration Tests

#### Complete Unfollow Flow (`tests/integration/social/unfollow-flow.test.ts`)

Tests the end-to-end unfollow workflow from UI to service layer.

**Coverage:**

- Basic unfollow flow with state updates
- React Query cache synchronization
- Multiple users unfollowing same target
- Mutual friendship handling
- Edge cases and validation
- State persistence across page refresh
- Follow/unfollow cycles
- Cache invalidation strategy
- Optimistic updates with error rollback

**Test Count:** 12 tests
**Status:** ✅ All Passing
**Location:** `/Users/hughgramelspacher/repos/ambira-main/worktrees/fix-unfollow/tests/integration/social/`

## Test Execution

### Run All Unfollow Tests

```bash
npm test -- --testNamePattern="unfollow"
```

### Run Specific Test Suites

```bash
# Service layer tests
npm test -- tests/unit/lib/api/social/updateSocialGraph.test.ts

# Component tests
npm test -- tests/unit/components/UserCard.unfollow.test.tsx
npm test -- tests/unit/components/ProfileHeader.unfollow.test.tsx

# Integration tests
npm test -- tests/integration/social/unfollow-flow.test.ts
```

### Run with Coverage

```bash
npm run test:coverage -- --testNamePattern="unfollow"
```

## Key Testing Patterns

### AAA Pattern (Arrange-Act-Assert)

All tests follow the AAA pattern for clarity:

```typescript
it('decrements follower count after unfollow', async () => {
  // Arrange: Set up initial state
  await followUser(currentUser.id, targetUser.id)

  // Act: Perform the action
  await unfollowUser(currentUser.id, targetUser.id)

  // Assert: Verify the outcome
  expect(targetUser.followersCount).toBe(0)
})
```

### Optimistic Updates with Rollback

Tests verify that UI updates immediately (optimistic) and rolls back on error:

```typescript
it('reverts to "Following" state on API error', async () => {
  mockApi.unfollowUser.mockRejectedValue(new Error('Network error'))

  fireEvent.click(followingButton)

  // Initially optimistic: "Follow"
  await waitFor(() => expect(screen.getByText('Follow')).toBeInTheDocument())

  // After error: reverts to "Following"
  await waitFor(() => expect(screen.getByText('Following')).toBeInTheDocument())
})
```

### Transaction Integrity

Service layer tests verify Firestore transaction requirements:

```typescript
it('performs all reads before writes', async () => {
  const operations: string[] = []
  mockTransaction.get = () => {
    operations.push('read')
  }
  mockTransaction.update = () => {
    operations.push('write')
  }

  await updateSocialGraph(user1, user2, 'unfollow')

  const firstWrite = operations.indexOf('write')
  expect(operations.slice(0, firstWrite).every((op) => op === 'read')).toBe(true)
})
```

## Test Data Factories

Tests use factories from `tests/integration/__helpers__/testFactories.ts`:

```typescript
const user = createTestUser({
  email: 'test@example.com',
  username: 'testuser',
})
```

## Mocking Strategy

### Firebase Mocks

- In-memory store from `tests/integration/__helpers__/firebaseMocks.ts`
- Deterministic behavior for consistent test results
- Supports follow/unfollow operations with count management

### API Mocks

- Component tests mock `@/lib/api` directly
- Service tests mock Firebase functions
- React Query cache mocking for integration tests

## Coverage Contribution

These tests contribute to the project's 80% coverage target:

- **Service Layer:** Core business logic for social graph updates
- **UI Components:** User interaction flows and error handling
- **Integration:** Complete workflows with cache management

## Related Documentation

- [Testing Strategy](../docs/architecture/TESTING_COVERAGE_ROADMAP.md)
- [Architecture Examples](../docs/architecture/EXAMPLES.md)
- [Caching Strategy](../docs/architecture/CACHING_STRATEGY.md)

## Future Enhancements

### Planned Tests

1. **E2E Tests (Playwright)**
   - Full user journey: Search → Profile → Unfollow
   - Accessibility testing for unfollow interactions
   - Mobile responsive testing

2. **Performance Tests**
   - Measure unfollow latency
   - Concurrent unfollow operations
   - Cache invalidation performance

3. **Edge Case Tests**
   - Network interruption during unfollow
   - Rapid follow/unfollow clicks (debouncing)
   - Unfollow while target deletes account

## Maintenance Notes

- Tests use TypeScript strict mode
- ESLint compliant (any types only for test mocks)
- All tests must pass before PR merge
- Coverage must stay above Phase 1 threshold (11%)
