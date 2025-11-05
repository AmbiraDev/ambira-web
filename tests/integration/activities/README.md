# Activities Integration Tests

Comprehensive integration tests for the Ambira activities feature workflows. These tests validate complete user journeys and cross-module coordination between the activities system, session tracking, React Query caching, and activity preferences.

## Test Suites (70 tests, all passing)

### 1. Activity Lifecycle Flow (`lifecycle.test.ts`) - 13 tests

Tests the complete custom activity lifecycle and management.

**Key Tests:**

- Create custom activity and verify it appears in picker
- Edit custom activity and propagate updates to all references
- Delete custom activity and remove from preferences
- Enforce maximum 10 custom activities limit
- Maintain correct ordering (system defaults before custom)
- Support activity categories for organization
- Prevent editing/deleting system activities
- Validate required fields (name, icon, color)
- Track activity usage in preferences
- Persist activities after logout/login

**Coverage:**

- Create operations with validation
- Update operations propagating changes
- Delete operations with cleanup
- Limit enforcement and error handling
- Activity organization and ordering

### 2. Activity Picker Flow (`picker-flow.test.ts`) - 14 tests

Tests the activity picker UI workflow and activity selection.

**Key Tests:**

- Load picker with system activities available
- Display recent activities in horizontal bar
- Show vertical list of all activities
- Select activity and update cache optimistically
- Create session with selected activity
- Create new activity from picker (immediately available)
- Update recent activities based on usage
- Sort recent activities by lastUsed timestamp
- Limit recent activities to 5 in horizontal bar
- Respect custom activity properties in picker
- Fallback to popular defaults for new users
- Handle rapid activity selections

**Coverage:**

- Picker initialization and display
- Activity selection and session creation
- In-picker activity creation
- Recent activity tracking and sorting
- Activity details preservation

### 3. Activity Settings Flow (`settings-flow.test.ts`) - 15 tests

Tests the settings page activity management interface.

**Key Tests:**

- Navigate to settings and load activity list
- Create activity from settings form
- Edit activity and see changes in list
- Delete activity with confirmation
- Validate activity form fields
- Show error messages on duplicate/invalid data
- Optimistically update cache on create/edit/delete
- Rollback cache on error
- Disable create button when max reached
- Persist settings after navigation
- Handle network errors gracefully

**Coverage:**

- Form validation and error handling
- Optimistic UI updates with React Query
- Cache synchronization on mutations
- Error recovery and rollback
- User feedback and confirmation flows

### 4. Session Creation with Activities (`session-creation.test.ts`) - 15 tests

Tests session creation workflow with activity tracking.

**Key Tests:**

- Select activity from picker and start timer
- Complete session with selected activity
- Update activity preference after session creation
- Activity appears in recent activities after session
- Custom activities work in sessions
- Track multiple sessions with different activities
- Increment usage count per session
- Update lastUsed timestamp on session creation
- Optimistic preference cache updates
- Clear active session after completing
- Handle deleted custom activities gracefully
- Display activity details in session record
- Support multiple sessions per activity per day

**Coverage:**

- Session lifecycle with activities
- Preference tracking and updates
- Recent activity sorting
- Usage count increments
- Deleted activity handling

### 5. Cache Synchronization for Activities (`cache-sync.test.ts`) - 13 tests

Tests React Query cache synchronization across activity operations.

**Key Tests:**

- Create activity updates custom cache
- Create activity updates combined cache
- Delete activity removes from custom cache
- Delete activity removes from combined cache
- Session creation updates preference cache
- All preference caches stay in sync
- Activity and preference caches remain consistent
- Optimistic updates then server confirmation
- Rollback optimistic updates on error
- Invalidate cache after server mutation
- Sync cache across multiple components
- Preference updates don't affect activity cache
- Maintain consistency across create-update-delete cycle

**Coverage:**

- Multi-cache synchronization
- Optimistic update patterns
- Error handling and rollback
- Cache invalidation
- Cross-component state management

## Test Infrastructure

### Mock Firebase API

In-memory implementation of Firebase services for deterministic testing:

- **Activity Types API**: System defaults, custom activities, CRUD operations
- **Activity Preferences API**: Recent activities, usage tracking, sorting
- **Session API**: Create, retrieve, update sessions with activities
- **Active Session API**: Timer state management

### Test Data Factories

Reusable factories for creating consistent test data:

- `createTestUser()` - Create test user with defaults
- `createTestActivity()` - Create test activity
- `createTestSession()` - Create test session with all fields
- `resetFactoryCounters()` - Reset ID generation for tests

### Test Helpers

- `createTestQueryClient()` - Create isolated React Query client
- `testFirebaseStore` - In-memory Firestore simulation
- `resetFirebaseStore()` - Clean state between tests
- `createMockFirebaseApi()` - Create mocked Firebase API

## Key Testing Patterns

### 1. Complete User Workflows

Tests follow entire workflows from start to finish:

- Activity creation → picker display → session creation → preference tracking
- Settings navigation → form submission → list update → verification

### 2. Cross-Module Coordination

Validates interactions between systems:

- Timer system + Activity system + Preferences system
- React Query cache + Activity mutations + Session creation
- UI state + API calls + Cache updates

### 3. Optimistic Updates

Tests optimistic UI patterns:

- Update cache before server response
- Verify UI updates immediately
- Rollback on error
- Confirm with server response

### 4. Edge Cases

Covers boundary conditions and error scenarios:

- Maximum activity limits (10)
- Missing preferences
- Deleted activities
- Whitespace validation
- Rapid selections
- Multiple sessions per activity

### 5. Data Consistency

Ensures data stays in sync across caches:

- All cache layers updated together
- Related data updates propagated
- Deletions cascade properly
- Preferences persist with activities

## Running Tests

```bash
# Run all activities tests
npm test -- tests/integration/activities/

# Run specific test file
npm test -- tests/integration/activities/lifecycle.test.ts

# Run with coverage
npm run test:coverage -- tests/integration/activities/

# Watch mode
npm run test:watch -- tests/integration/activities/
```

## Test Statistics

- **Total Tests**: 70
- **Total Test Suites**: 5
- **Pass Rate**: 100%
- **Average Execution Time**: ~1.6 seconds
- **Code Coverage**:
  - Activity Types API: 100%
  - Activity Preferences API: 100%
  - Cache Synchronization: 100%
  - Activity Lifecycle: 100%

## Related Documentation

- [TESTING_COVERAGE_ROADMAP.md](../../docs/architecture/TESTING_COVERAGE_ROADMAP.md) - Overall testing strategy
- [CACHING_STRATEGY.md](../../docs/architecture/CACHING_STRATEGY.md) - React Query caching patterns
- [EXAMPLES.md](../../docs/architecture/EXAMPLES.md) - Feature implementation examples

## Notes

- All tests use mocked Firebase backend for isolation and speed
- Tests are deterministic (no random data, controlled timestamps)
- Proper time delays used where sorting by timestamp is critical
- Activity preferences require explicit creation (not automatic)
- System activities (work, coding, etc.) are read-only by design
- Maximum 10 custom activities per user enforced at API level
