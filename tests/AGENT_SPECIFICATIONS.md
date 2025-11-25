# Agent Specifications for Ambira Testing

## Overview

This document provides detailed specifications for agents creating tests to achieve 95% coverage.

---

## Agent 1: Unit Testing Agent

**Agent ID:** `unit-testing:test-automator`
**Phase:** 1-2 (Week 1-2)
**Estimated Tests:** 78

### Scope

#### API Layer Tests (Priority: P0)

**Location:** `tests/unit/api/`

1. **Auth API** (`src/lib/api/auth/index.ts`)
   - Test: `signInWithEmail`, `signUpWithEmail`, `signOut`
   - Verify: Email validation, password strength, error messages
   - Edge cases: Invalid credentials, network errors, duplicate emails

2. **Sessions API** (`src/lib/api/sessions/`)
   - Test: Create, read, update, delete sessions
   - Verify: Session validation, visibility rules, duration calculations
   - Edge cases: Invalid session data, concurrent updates, image attachments

3. **Users API** (`src/lib/api/users/index.ts`)
   - Test: Get user profile, update profile, search users
   - Verify: Privacy settings, profile validation, follower counts
   - Edge cases: User not found, invalid updates, search with no results

4. **Projects API** (`src/lib/api/projects/index.ts`)
   - Test: CRUD operations for projects
   - Verify: Project validation, default projects, status transitions
   - Edge cases: Delete project with sessions, invalid project data

5. **Groups API** (`src/lib/api/groups/index.ts`)
   - Test: Create group, join/leave, member management
   - Verify: Privacy settings, admin permissions, member limits
   - Edge cases: Join private group, leave as admin, duplicate members

6. **Challenges API** (`src/lib/api/challenges/index.ts`)
   - Test: Create challenge, join, update progress, leaderboard
   - Verify: Challenge types, date validation, progress calculation
   - Edge cases: Join expired challenge, invalid goal values

7. **Notifications API** (`src/lib/api/notifications/index.ts`)
   - Test: Send notification, mark as read, get unread count
   - Verify: Notification types, preferences, batch operations
   - Edge cases: Notification to non-existent user, bulk mark as read

8. **Social API** (`src/lib/api/social/`)
   - Test: Follow/unfollow, comments, likes
   - Verify: Follow status, comment threading, like counts
   - Edge cases: Self-follow, comment on private session, duplicate likes

9. **Streaks API** (`src/lib/api/streaks/index.ts`)
   - Review existing test: Ensure comprehensive coverage

10. **Shared Utilities** (`src/lib/api/shared/utils.ts`)
    - Test: stripUndefined, data validation, error handling
    - Verify: Utility functions used across APIs

#### Hook Tests (Priority: P0)

**Location:** `tests/unit/hooks/`

1. **useActivitiesQuery** (`src/hooks/useActivitiesQuery.ts`)
   - Test: Fetch activities, filter by status, loading states
   - Verify: React Query integration, cache invalidation
   - Edge cases: Empty results, network error, concurrent fetches

2. **useNotifications** (`src/hooks/useNotifications.ts`)
   - Test: Fetch notifications, mark as read, real-time updates
   - Verify: Notification count, sorting, filtering
   - Edge cases: No notifications, bulk operations

3. **useDebounce** (`src/hooks/useDebounce.ts`)
   - Test: Debounce value updates, configurable delay
   - Verify: Timing accuracy, cleanup on unmount
   - Edge cases: Rapid value changes, zero delay

#### Service Tests (Priority: P0)

**Location:** `tests/unit/services/`

Review and expand existing service tests:

- `FeedService.test.ts` - Ensure complete coverage
- `ProfileService.test.ts` - Ensure complete coverage
- `SessionService.test.ts` - Ensure complete coverage
- `TimerService.test.ts` - Ensure complete coverage

### Testing Patterns

#### API Test Template

```typescript
import { mockFirestore } from '@/tests/__mocks__/firebase/firestore'
import { createMockUser, createMockSession } from '@/tests/__mocks__/factories'
import { createSession } from '@/lib/api/sessions'

describe('createSession', () => {
  beforeEach(() => {
    mockFirestore._clearAll()
  })

  it('should create a session with valid data', async () => {
    // Arrange
    const user = createMockUser()
    const sessionData = {
      title: 'Test Session',
      duration: 3600,
      activityId: 'activity-1',
    }

    // Act
    const result = await createSession(user.id, sessionData)

    // Assert
    expect(result).toHaveProperty('id')
    expect(result.title).toBe('Test Session')
    expect(result.userId).toBe(user.id)
  })

  it('should throw error with invalid data', async () => {
    // Arrange
    const invalidData = { title: '', duration: -1 }

    // Act & Assert
    await expect(createSession('user-1', invalidData)).rejects.toThrow()
  })
})
```

#### Hook Test Template

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useActivitiesQuery } from '@/hooks/useActivitiesQuery';
import { mockFirestore } from '@/tests/__mocks__/firebase/firestore';
import { createMockActivity } from '@/tests/__mocks__/factories';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useActivitiesQuery', () => {
  beforeEach(() => {
    mockFirestore._clearAll();
  });

  it('should fetch activities successfully', async () => {
    // Arrange
    const activity = createMockActivity();
    mockFirestore._seedData('activities', activity.id, activity);

    // Act
    const { result } = renderHook(() => useActivitiesQuery('user-1'), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].id).toBe(activity.id);
  });
});
```

### Required Imports

```typescript
// Mocks
import { mockFirestore } from '@/tests/__mocks__/firebase/firestore'
import { mockAuth } from '@/tests/__mocks__/firebase/auth'
import { mockStorage } from '@/tests/__mocks__/firebase/storage'

// Factories
import {
  createMockUser,
  createMockSession,
  createMockActivity,
  createMockGroup,
  createMockChallenge,
  createMockComment,
} from '@/tests/__mocks__/factories'
```

### Output Structure

```
tests/unit/
├── api/
│   ├── auth.test.ts
│   ├── sessions.test.ts
│   ├── users.test.ts
│   ├── projects.test.ts
│   ├── groups.test.ts
│   ├── challenges.test.ts
│   ├── notifications.test.ts
│   ├── social.test.ts
│   └── utils.test.ts
├── hooks/
│   ├── useActivitiesQuery.test.ts
│   ├── useNotifications.test.ts
│   └── useDebounce.test.ts
└── services/
    └── (expand existing tests)
```

---

## Agent 2: Integration Testing Agent

**Agent ID:** `full-stack-orchestration:test-automator`
**Phase:** 2-3 (Week 2-3)
**Estimated Tests:** 45

### Scope

#### Session Flows (Priority: P0)

**Location:** `tests/integration/sessions/`

1. **create-session.test.ts**
   - Flow: Start timer → Enter details → Add images → Save session
   - Verify: Session created in Firestore, images uploaded, feed updated
   - Edge cases: Save without title, exceed image limit

2. **edit-session.test.ts**
   - Flow: Load session → Edit fields → Save changes
   - Verify: Updates reflected in Firestore, timestamps updated
   - Edge cases: Edit archived session, concurrent edits

3. **delete-session.test.ts**
   - Flow: Select session → Confirm delete → Session removed
   - Verify: Session deleted, images removed, feed updated
   - Edge cases: Delete session with comments, cascade delete

4. **session-visibility.test.ts**
   - Flow: Create session → Change visibility → Verify feed
   - Verify: Visibility rules enforced, feed filtering correct
   - Edge cases: Private session in public feed

5. **session-images.test.ts**
   - Flow: Upload images → Display in session → Delete images
   - Verify: Images stored in Firebase Storage, URLs valid
   - Edge cases: Invalid file types, size limits

#### Feed Interactions (Priority: P0)

**Location:** `tests/integration/feed/`

1. **feed-filtering.test.ts**
   - Flow: Apply filters → Verify results → Clear filters
   - Verify: Correct sessions shown, counts accurate
   - Edge cases: Multiple filters, no results

2. **feed-pagination.test.ts**
   - Flow: Scroll feed → Load more → Verify no duplicates
   - Verify: Pagination cursor works, correct order
   - Edge cases: Last page, rapid scrolling

3. **support-session.test.ts**
   - Flow: Click support → Update count → Remove support
   - Verify: supportCount incremented, user added to supportedBy
   - Edge cases: Double support, support own session

4. **comment-session.test.ts**
   - Flow: Write comment → Submit → Display in list
   - Verify: Comment saved, notification sent, count updated
   - Edge cases: Empty comment, reply to comment

5. **share-session.test.ts**
   - Flow: Generate share URL → Copy link → Open in new tab
   - Verify: Correct URL format, session accessible
   - Edge cases: Share private session, expired link

#### Social Graph (Priority: P0)

**Location:** `tests/integration/social/`

1. **follow-user.test.ts**
   - Flow: Search user → Click follow → Update counts
   - Verify: Follow relationship created, counts incremented
   - Edge cases: Follow yourself, already following

2. **unfollow-user.test.ts**
   - Flow: Click unfollow → Confirm → Update counts
   - Verify: Follow deleted, counts decremented, feed updated
   - Edge cases: Unfollow non-followed user

3. **follower-list.test.ts**
   - Flow: Open followers → Display list → Pagination
   - Verify: Correct followers shown, counts match
   - Edge cases: Empty list, many followers

4. **following-list.test.ts**
   - Flow: Open following → Display list → Unfollow from list
   - Verify: Correct users shown, unfollow updates list
   - Edge cases: Empty list, recently unfollowed

5. **user-suggestions.test.ts**
   - Flow: Load suggestions → Display users → Follow from suggestions
   - Verify: Relevant suggestions, no followed users
   - Edge cases: No suggestions, all users followed

#### Groups (Priority: P0)

**Location:** `tests/integration/groups/`

1. **create-group.test.ts**
   - Flow: Fill form → Upload image → Create group
   - Verify: Group created, creator is admin, member count = 1
   - Edge cases: Duplicate name, invalid category

2. **join-group.test.ts**
   - Flow: Browse groups → Click join → Verify membership
   - Verify: Member added, count incremented, feed updated
   - Edge cases: Join private group, approval required

3. **leave-group.test.ts**
   - Flow: Click leave → Confirm → Remove membership
   - Verify: Member removed, count decremented
   - Edge cases: Leave as admin, last member

4. **group-members.test.ts**
   - Flow: View members → Promote member → Remove member
   - Verify: Role changes persist, permissions updated
   - Edge cases: Remove yourself, promote non-member

5. **group-settings.test.ts**
   - Flow: Open settings → Update fields → Save changes
   - Verify: Settings updated, members notified
   - Edge cases: Non-admin access, invalid settings

#### Challenges (Priority: P0)

**Location:** `tests/integration/challenges/`

1. **create-challenge.test.ts**
   - Flow: Fill form → Set dates → Create challenge
   - Verify: Challenge created, creator is participant
   - Edge cases: Invalid dates, overlapping challenges

2. **join-challenge.test.ts**
   - Flow: Browse challenges → Join → Track progress
   - Verify: Participant added, progress starts at 0
   - Edge cases: Join expired challenge, already joined

3. **challenge-progress.test.ts**
   - Flow: Complete session → Update progress → Check leaderboard
   - Verify: Progress calculated correctly, rank updated
   - Edge cases: Multiple sessions, progress exceeds goal

4. **challenge-leaderboard.test.ts**
   - Flow: View leaderboard → Sort by rank → Filter participants
   - Verify: Correct order, ties handled, real-time updates
   - Edge cases: Empty leaderboard, all tied

#### Timer (Priority: P0)

**Location:** `tests/integration/timer/`

1. **start-timer.test.ts**
   - Flow: Select activity → Start timer → Verify running
   - Verify: Timer starts, state persisted, elapsed time updates
   - Edge cases: Multiple tabs, rapid start/stop

2. **pause-timer.test.ts**
   - Flow: Start → Pause → Resume → Verify elapsed
   - Verify: Pause works, elapsed time frozen, resume continues
   - Edge cases: Long pause, multiple pauses

3. **stop-timer.test.ts**
   - Flow: Stop timer → Enter details → Save session
   - Verify: Timer stopped, session created, state cleared
   - Edge cases: Stop without saving, timer state cleanup

4. **timer-persistence.test.ts**
   - Flow: Start timer → Refresh page → Verify state
   - Verify: Timer restored, elapsed time correct, activity preserved
   - Edge cases: Clear cache, expired timer

#### Profile (Priority: P0)

**Location:** `tests/integration/profile/`

1. **edit-profile.test.ts**
   - Flow: Open edit → Update fields → Save
   - Verify: Profile updated, displayed name changes
   - Edge cases: Invalid email, duplicate username

2. **privacy-settings.test.ts**
   - Flow: Change privacy → Save → Verify visibility
   - Verify: Settings applied, profile visibility changed
   - Edge cases: Private profile, followers-only sessions

3. **profile-visibility.test.ts**
   - Flow: View different users → Check visibility
   - Verify: Privacy rules enforced, restricted content hidden
   - Edge cases: View own profile, blocked user

#### Notifications (Priority: P0)

**Location:** `tests/integration/notifications/`

1. **receive-notification.test.ts**
   - Flow: Trigger event → Receive notification → Display
   - Verify: Notification created, count incremented, displayed
   - Edge cases: Multiple notifications, notification for yourself

2. **mark-read.test.ts**
   - Flow: Click notification → Mark as read → Update count
   - Verify: Read status updated, count decremented
   - Edge cases: Mark all as read, already read

3. **notification-preferences.test.ts**
   - Flow: Disable type → Trigger event → Verify not sent
   - Verify: Preferences respected, selective notifications
   - Edge cases: Disable all, enable all

#### Projects (Priority: P0)

**Location:** `tests/integration/projects/`

1. **create-project.test.ts**
   - Flow: Fill form → Select icon → Create project
   - Verify: Project created, displayed in list
   - Edge cases: Duplicate name, invalid data

2. **edit-project.test.ts**
   - Flow: Open edit → Change fields → Save
   - Verify: Updates saved, sessions still linked
   - Edge cases: Change to archived, remove icon

3. **delete-project.test.ts**
   - Flow: Delete project → Confirm → Remove
   - Verify: Project deleted, sessions orphaned or deleted
   - Edge cases: Delete with active sessions, default project

4. **project-stats.test.ts**
   - Flow: View project → Check stats → Verify calculations
   - Verify: Total hours, session count, weekly progress
   - Edge cases: No sessions, archived project

#### Search (Priority: P1)

**Location:** `tests/integration/search/`

1. **search-users.test.ts**
   - Flow: Enter query → Display results → Pagination
   - Verify: Relevant results, correct order, follow from results
   - Edge cases: No results, exact match

2. **search-groups.test.ts**
   - Flow: Search groups → Filter by category → Join from results
   - Verify: Search works, filters applied, join flow
   - Edge cases: Private groups, no matches

3. **search-challenges.test.ts**
   - Flow: Search challenges → Filter by status → Join from results
   - Verify: Active challenges shown, expired filtered
   - Edge cases: Expired challenges, no active

#### Media (Priority: P1)

**Location:** `tests/integration/media/`

1. **upload-image.test.ts**
   - Flow: Select file → Upload → Display preview
   - Verify: Image uploaded to Storage, URL returned, preview shown
   - Edge cases: Large file, invalid format

2. **delete-image.test.ts**
   - Flow: Select image → Delete → Confirm
   - Verify: Image removed from Storage, URL invalid
   - Edge cases: Delete non-existent, concurrent delete

3. **image-validation.test.ts**
   - Flow: Upload various files → Verify validation
   - Verify: File type check, size limit, count limit
   - Edge cases: PDF, video, oversized image

### Testing Pattern

#### Integration Test Template

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockFirestore } from '@/tests/__mocks__/firebase/firestore';
import { mockAuth } from '@/tests/__mocks__/firebase/auth';
import { createMockUser, createMockSession } from '@/tests/__mocks__/factories';
import { SessionForm } from '@/components/SessionForm';

describe('Create Session Flow', () => {
  beforeEach(() => {
    mockFirestore._clearAll();
    mockAuth._clearAuthState();
  });

  it('should create session with complete flow', async () => {
    // Arrange
    const user = createMockUser();
    mockAuth._setCurrentUser(user);

    render(<SessionForm />);

    // Act
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Test Session' },
    });
    fireEvent.change(screen.getByLabelText('Duration'), {
      target: { value: '60' },
    });
    fireEvent.click(screen.getByText('Save'));

    // Assert
    await waitFor(() => {
      const sessions = mockFirestore._getAllData('sessions');
      expect(sessions?.size).toBe(1);
    });
  });
});
```

### Output Structure

```
tests/integration/
├── sessions/
│   ├── create-session.test.ts
│   ├── edit-session.test.ts
│   ├── delete-session.test.ts
│   ├── session-visibility.test.ts
│   └── session-images.test.ts
├── feed/
│   ├── feed-filtering.test.ts
│   ├── feed-pagination.test.ts
│   ├── support-session.test.ts
│   ├── comment-session.test.ts
│   └── share-session.test.ts
├── social/
│   ├── follow-user.test.ts
│   ├── unfollow-user.test.ts
│   ├── follower-list.test.ts
│   ├── following-list.test.ts
│   └── user-suggestions.test.ts
├── groups/
│   ├── create-group.test.ts
│   ├── join-group.test.ts
│   ├── leave-group.test.ts
│   ├── group-members.test.ts
│   └── group-settings.test.ts
├── challenges/
│   ├── create-challenge.test.ts
│   ├── join-challenge.test.ts
│   ├── challenge-progress.test.ts
│   └── challenge-leaderboard.test.ts
├── profile/
│   ├── edit-profile.test.ts
│   ├── privacy-settings.test.ts
│   └── profile-visibility.test.ts
├── timer/
│   ├── start-timer.test.ts
│   ├── pause-timer.test.ts
│   ├── stop-timer.test.ts
│   └── timer-persistence.test.ts
├── notifications/
│   ├── receive-notification.test.ts
│   ├── mark-read.test.ts
│   └── notification-preferences.test.ts
├── projects/
│   ├── create-project.test.ts
│   ├── edit-project.test.ts
│   ├── delete-project.test.ts
│   └── project-stats.test.ts
├── search/
│   ├── search-users.test.ts
│   ├── search-groups.test.ts
│   └── search-challenges.test.ts
└── media/
    ├── upload-image.test.ts
    ├── delete-image.test.ts
    └── image-validation.test.ts
```

---

## Agent 3: Component Testing Agent

**Agent ID:** `component-testing:test-automator` (if available)
**Phase:** 2-3 (Week 2-3)
**Estimated Tests:** 140

### Scope

Test all components in `src/components/` with focus on:

- User interactions (clicks, form inputs, keyboard navigation)
- Conditional rendering (loading, error, empty states)
- Accessibility (ARIA attributes, keyboard support)
- Props validation
- Event callbacks
- State changes

### Priority Components

**P0 - Must Test (80 components)**

- Auth: LoginForm, SignupForm, ProtectedRoute
- Timer: SessionTimer, SessionTimerEnhanced, ActiveTimerBar, SaveSession
- Feed: Feed, FeedPost, SessionCard, SessionInteractions, FeedFilterDropdown
- Social: CommentInput, CommentList, CommentsModal, SearchUsers
- Projects: ProjectList, ProjectCard, CreateProjectModal, ProjectAnalytics
- Groups: GroupCard, GroupHeader, CreateGroupModal, GroupSettings
- Challenges: ChallengeDetail, ChallengeLeaderboard, ChallengeProgress
- Profile: ProfileHeader, ProfileStats, EditProfileModal, PrivacySettings
- Media: ImageUpload, ImageGallery, ImageLightbox

**P1 - Should Test (40 components)**

- Layout: HeaderComponent, LeftSidebar, RightSidebar, BottomNavigation
- Analytics: PersonalAnalyticsDashboard, GroupAnalytics, HeatmapCalendar
- Achievements: AchievementCard, AchievementUnlock
- Notifications: NotificationIcon, NotificationsPanel

**P2 - Nice to Test (20 components)**

- PWA: PWAInstaller, PWAInstallPrompt
- UI utilities: Modal, Dropdown, Card, Button variants

### Component Test Template

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionCard } from '@/components/SessionCard';
import { createMockSessionWithDetails } from '@/tests/__mocks__/factories';

describe('SessionCard', () => {
  it('should render session details', () => {
    // Arrange
    const session = createMockSessionWithDetails();

    // Act
    render(<SessionCard session={session} />);

    // Assert
    expect(screen.getByText(session.title)).toBeInTheDocument();
    expect(screen.getByText(session.user.name)).toBeInTheDocument();
  });

  it('should handle support click', async () => {
    // Arrange
    const session = createMockSessionWithDetails();
    const onSupport = jest.fn();
    render(<SessionCard session={session} onSupport={onSupport} />);

    // Act
    const supportButton = screen.getByRole('button', { name: /support/i });
    await userEvent.click(supportButton);

    // Assert
    expect(onSupport).toHaveBeenCalledWith(session.id);
  });

  it('should display accessibility attributes', () => {
    // Arrange
    const session = createMockSessionWithDetails();
    render(<SessionCard session={session} />);

    // Assert
    expect(screen.getByRole('article')).toHaveAttribute('aria-label', expect.stringContaining(session.title));
  });
});
```

### Output Structure

```
tests/unit/features/
├── auth/
│   ├── LoginForm.test.tsx
│   ├── SignupForm.test.tsx
│   └── ProtectedRoute.test.tsx
├── timer/
│   ├── SessionTimer.test.tsx
│   ├── SessionTimerEnhanced.test.tsx
│   ├── ActiveTimerBar.test.tsx
│   └── SaveSession.test.tsx
├── feed/
│   ├── Feed.test.tsx
│   ├── FeedPost.test.tsx
│   ├── SessionCard.test.tsx
│   └── FeedFilterDropdown.test.tsx
├── social/
│   ├── CommentInput.test.tsx
│   ├── CommentList.test.tsx
│   ├── CommentsModal.test.tsx
│   └── SearchUsers.test.tsx
├── groups/
│   ├── GroupCard.test.tsx
│   ├── GroupHeader.test.tsx
│   ├── CreateGroupModal.test.tsx
│   └── GroupSettings.test.tsx
├── challenges/
│   ├── ChallengeDetail.test.tsx
│   ├── ChallengeLeaderboard.test.tsx
│   └── ChallengeProgress.test.tsx
├── profile/
│   ├── ProfileHeader.test.tsx
│   ├── ProfileStats.test.tsx
│   ├── EditProfileModal.test.tsx
│   └── PrivacySettings.test.tsx
└── media/
    ├── ImageUpload.test.tsx
    ├── ImageGallery.test.tsx
    └── ImageLightbox.test.tsx
```

---

## General Guidelines for All Agents

### Test Quality Standards

1. **Use AAA Pattern**
   - Arrange: Set up test data and mocks
   - Act: Execute the code under test
   - Assert: Verify expected behavior

2. **Test Naming Convention**
   - Format: `should <expected behavior> when <condition>`
   - Example: `should create session when valid data is provided`

3. **Test Isolation**
   - Each test should be independent
   - Use `beforeEach` to reset mocks
   - Clear state between tests

4. **Mock External Dependencies**
   - Always mock Firebase services
   - Use factories for test data
   - Mock API calls with `mockApiClient`

5. **Test Both Success and Error Cases**
   - Happy path (success scenario)
   - Error handling (network errors, validation errors)
   - Edge cases (empty data, boundary conditions)

6. **Verify Accessibility**
   - Check ARIA attributes
   - Test keyboard navigation
   - Verify screen reader support

### Common Pitfalls to Avoid

1. **Don't test implementation details**
   - Test behavior, not internals
   - Avoid testing state variables directly

2. **Don't share state between tests**
   - Each test should clean up after itself
   - Use `afterEach` for cleanup

3. **Don't use real Firebase**
   - Always use mocks from `tests/__mocks__/`
   - Never connect to real Firestore/Auth/Storage

4. **Don't write flaky tests**
   - Avoid arbitrary timeouts
   - Use `waitFor` for async operations
   - Make tests deterministic

5. **Don't skip edge cases**
   - Test empty states, error states, loading states
   - Test boundary conditions
   - Test concurrent operations

### Resources

- **Mocks Documentation:** `/tests/__mocks__/README.md`
- **Test Plan:** `/tests/TEST_PLAN.md`
- **Jest Documentation:** https://jestjs.io/
- **React Testing Library:** https://testing-library.com/react
- **Project Guidelines:** `/CLAUDE.md`

---

## Coordination & Communication

### Daily Standups

- Report: Tests completed, coverage achieved, blockers
- Coordinate: Shared dependencies, integration points
- Review: Test quality, coverage gaps

### Code Review Checklist

- [ ] Tests follow AAA pattern
- [ ] Uses mocks from `tests/__mocks__/`
- [ ] Tests success and error cases
- [ ] Includes edge case coverage
- [ ] Clear test names and documentation
- [ ] Proper cleanup in `afterEach`
- [ ] No shared state between tests
- [ ] Accessibility checks included (for components)

### Coverage Monitoring

- Run `npm run test:coverage` after each batch
- Track progress toward 95% target
- Identify and prioritize coverage gaps
- Update TEST_PLAN.md with progress

---

## Ready to Begin!

All mocks, factories, and specifications are in place. Agents can begin test creation immediately following these specifications.

**Questions?** Refer to:

- `/tests/__mocks__/README.md` for mock usage
- `/tests/TEST_PLAN.md` for overall strategy
- `/CLAUDE.md` for project context
