# Ambira Test Plan

## Comprehensive Testing Strategy to Achieve 95% Coverage

**Current Status:** ~15-20% coverage (19 unit tests, 3 integration tests)
**Target:** 95% code coverage across all production-critical features
**Timeline:** Coordinated multi-agent execution

---

## Test Structure

```
tests/
├── __mocks__/              ✅ COMPLETE - Comprehensive mocks created
│   ├── firebase/          # Firebase Auth, Firestore, Storage mocks
│   ├── api/              # HTTP client mocks
│   └── factories/        # Test data factories (User, Session, Activity, Group, Challenge, Comment)
├── unit/                  ⚠️  PARTIAL - 19 tests exist, ~80 needed
│   ├── api/              # API function tests
│   ├── hooks/            # React hooks tests
│   ├── lib/              # Utility function tests
│   ├── services/         # Service layer tests
│   ├── ui/               # UI component tests (simple)
│   └── features/         # Feature component tests
├── integration/           ⚠️  MINIMAL - 3 tests exist, ~40 needed
│   ├── auth/             # Auth flows (login, signup, logout)
│   ├── sessions/         # Session CRUD and timer flows
│   ├── feed/             # Feed filtering and interactions
│   ├── social/           # Follow, comments, supports
│   ├── groups/           # Group management
│   ├── challenges/       # Challenge participation
│   ├── profile/          # Profile management
│   ├── projects/         # Project CRUD
│   ├── notifications/    # Notification system
│   ├── media/            # Image upload flows
│   └── timer/            # Timer persistence and state
└── e2e/                   ✅ COMPLETE - Playwright smoke tests
    └── smoke/            # Critical path validation
```

---

## Coverage Analysis

### ✅ COMPLETE (Existing Tests)

#### Unit Tests (19 files)

1. `auth.queries.test.tsx` - Auth query functions
2. `cache.test.ts` - Cache management
3. `ChallengeCard.test.tsx` - Challenge card component
4. `errorHandler.test.ts` - Error handling utilities
5. `FeedService.test.ts` - Feed service logic
6. `Header.test.tsx` - Header component
7. `NotificationPanel.test.tsx` - Notification panel
8. `ProfileService.test.ts` - Profile service
9. `ProfileStatsCalculator.test.ts` - Stats calculation
10. `queryClient.test.ts` - React Query config
11. `rateLimit.test.ts` - Rate limiting
12. `Session.test.ts` - Session type tests
13. `sessions.test.ts` - Session utilities
14. `SessionService.test.ts` - Session service
15. `Sidebar.test.tsx` - Sidebar component
16. `streaks.test.ts` - Streak tracking
17. `TimerService.test.ts` - Timer service
18. `User.test.ts` - User type tests
19. `utils.test.ts` - General utilities

#### Integration Tests (3 files)

1. `auth/login-flow.test.ts` - Login flow
2. `auth/signup-flow.test.ts` - Signup flow
3. `auth/logout-flow.test.ts` - Logout flow

#### E2E Tests

- ✅ Smoke tests covering critical paths
- ✅ Accessibility validation
- ✅ Mobile responsiveness

---

## ❌ MISSING COVERAGE (Priority Breakdown)

### 🔴 P0 - CRITICAL (Must Have for 95% Coverage)

#### API Layer Tests (16 API modules, ~13 missing)

**Estimated Coverage Impact:** 15%

| API Module                   | Status     | Priority | Tests Needed |
| ---------------------------- | ---------- | -------- | ------------ |
| `api/auth/index.ts`          | ❌ Missing | P0       | 5            |
| `api/sessions/index.ts`      | ❌ Missing | P0       | 8            |
| `api/sessions/helpers.ts`    | ❌ Missing | P0       | 3            |
| `api/sessions/posts.ts`      | ❌ Missing | P0       | 4            |
| `api/users/index.ts`         | ❌ Missing | P0       | 6            |
| `api/projects/index.ts`      | ❌ Missing | P0       | 5            |
| `api/groups/index.ts`        | ❌ Missing | P0       | 6            |
| `api/challenges/index.ts`    | ❌ Missing | P0       | 5            |
| `api/notifications/index.ts` | ❌ Missing | P0       | 4            |
| `api/social/comments.ts`     | ❌ Missing | P0       | 4            |
| `api/social/helpers.ts`      | ❌ Missing | P0       | 3            |
| `api/streaks/index.ts`       | ✅ Exists  | -        | -            |
| `api/achievements/index.ts`  | ❌ Missing | P1       | 3            |
| `api/shared/utils.ts`        | ❌ Missing | P0       | 4            |

**Total:** ~60 API tests needed

#### Hooks Tests (5 hooks, ~3 missing)

**Estimated Coverage Impact:** 8%

| Hook                          | Status     | Priority | Tests Needed |
| ----------------------------- | ---------- | -------- | ------------ |
| `hooks/useAuth.ts`            | ✅ Exists  | -        | -            |
| `hooks/useActivitiesQuery.ts` | ❌ Missing | P0       | 4            |
| `hooks/useNotifications.ts`   | ❌ Missing | P0       | 5            |
| `hooks/useDebounce.ts`        | ❌ Missing | P1       | 2            |
| `hooks/useTimerQuery.ts`      | ✅ Exists  | -        | -            |

**Total:** ~11 hook tests needed

#### Core Component Tests (153 components, ~140 missing)

**Estimated Coverage Impact:** 30%

**Authentication/Onboarding (P0)**

- ❌ `LoginForm.tsx` - Login form validation and submission
- ❌ `SignupForm.tsx` - Signup form validation
- ❌ `ProtectedRoute.tsx` - Route protection logic

**Session Timer (P0)**

- ❌ `SessionTimer.tsx` - Timer controls
- ❌ `SessionTimerEnhanced.tsx` - Enhanced timer with images
- ❌ `ActiveTimerBar.tsx` - Timer status bar
- ❌ `SaveSession.tsx` - Session save flow
- ❌ `ManualSessionRecorder.tsx` - Manual entry

**Feed & Sessions (P0)**

- ❌ `Feed.tsx` - Feed rendering and filtering
- ❌ `FeedPost.tsx` - Post display
- ❌ `SessionCard.tsx` - Session card display
- ❌ `SessionInteractions.tsx` - Like/comment interactions
- ❌ `FeedFilterDropdown.tsx` - Filter controls
- ❌ `FeedCarousel.tsx` - Image carousel

**Social Features (P0)**

- ❌ `CommentInput.tsx` - Comment creation
- ❌ `CommentList.tsx` - Comment display
- ❌ `CommentsModal.tsx` - Comments modal
- ❌ `SearchUsers.tsx` - User search
- ❌ `FollowersList.tsx` - Follower list display

**Projects/Activities (P0)**

- ❌ `ProjectList.tsx` - Project list display
- ❌ `ProjectCard.tsx` - Project card
- ❌ `CreateProjectModal.tsx` - Project creation
- ❌ `ProjectAnalytics.tsx` - Project stats
- ❌ `ActivityChart.tsx` - Activity visualization

**Groups (P0)**

- ❌ `GroupCard.tsx` - Group card display
- ❌ `GroupHeader.tsx` - Group header
- ❌ `GroupTabs.tsx` - Group navigation
- ❌ `CreateGroupModal.tsx` - Group creation
- ❌ `BrowseGroups.tsx` - Group discovery
- ❌ `GroupSettings.tsx` - Group settings
- ❌ `GroupInviteModal.tsx` - Group invitations

**Challenges (P0)**

- ❌ `ChallengeDetail.tsx` - Challenge details
- ❌ `ChallengeLeaderboard.tsx` - Leaderboard display
- ❌ `ChallengeProgress.tsx` - Progress tracking
- ❌ `CreateChallengeModal.tsx` - Challenge creation

**Profile & Settings (P0)**

- ❌ `ProfileHeader.tsx` - Profile header display
- ❌ `ProfileStats.tsx` - Profile statistics
- ❌ `ProfileTabs.tsx` - Profile navigation
- ❌ `EditProfileModal.tsx` - Profile editing
- ❌ `PrivacySettings.tsx` - Privacy controls
- ❌ `NotificationSettings.tsx` - Notification preferences

**Media Upload (P0)**

- ❌ `ImageUpload.tsx` - Image upload component
- ❌ `ImageGallery.tsx` - Gallery display
- ❌ `ImageLightbox.tsx` - Lightbox viewer
- ❌ `ShareSessionImage.tsx` - Image sharing

**Notifications (P0)**

- ❌ `NotificationIcon.tsx` - Notification indicator
- ❌ `NotificationsPanel.tsx` - Panel display (has test but may need more)

**Layout & Navigation (P1)**

- ❌ `HeaderComponent.tsx` - Main header (has test but may need more)
- ❌ `LeftSidebar.tsx` - Left navigation
- ❌ `RightSidebar.tsx` - Right sidebar
- ❌ `BottomNavigation.tsx` - Mobile nav
- ❌ `MobileHeader.tsx` - Mobile header

**Analytics (P1)**

- ❌ `PersonalAnalyticsDashboard.tsx` - Personal analytics
- ❌ `GroupAnalytics.tsx` - Group analytics
- ❌ `ComparativeAnalytics.tsx` - Comparison view
- ❌ `HeatmapCalendar.tsx` - Activity heatmap
- ❌ `AnalyticsWidget.tsx` - Widget components

**Achievements (P1)**

- ❌ `AchievementCard.tsx` - Achievement display
- ❌ `AchievementUnlock.tsx` - Unlock animation

**Streaks (P0)**

- ❌ `StreakDisplay.tsx` - Streak visualization
- ❌ `StreakCalendar.tsx` - Streak calendar

**PWA (P2)**

- ❌ `PWAInstaller.tsx` - PWA install prompt
- ❌ `PWAInstallPrompt.tsx` - Install UI

**Total:** ~80 component tests needed

---

### 🟡 P1 - HIGH (Important for Complete Coverage)

#### Integration Tests (~35 needed)

**Estimated Coverage Impact:** 20%

**Session Management**

- ❌ `sessions/create-session.test.ts` - Session creation flow
- ❌ `sessions/edit-session.test.ts` - Session editing
- ❌ `sessions/delete-session.test.ts` - Session deletion
- ❌ `sessions/session-visibility.test.ts` - Visibility settings
- ❌ `sessions/session-images.test.ts` - Image upload integration

**Feed Interactions**

- ❌ `feed/feed-filtering.test.ts` - Feed filter combinations
- ❌ `feed/feed-pagination.test.ts` - Infinite scroll
- ❌ `feed/support-session.test.ts` - Like/support flow
- ❌ `feed/comment-session.test.ts` - Comment flow
- ❌ `feed/share-session.test.ts` - Sharing functionality

**Social Graph**

- ❌ `social/follow-user.test.ts` - Follow flow
- ❌ `social/unfollow-user.test.ts` - Unfollow flow
- ❌ `social/follower-list.test.ts` - Follower list
- ❌ `social/following-list.test.ts` - Following list
- ❌ `social/user-suggestions.test.ts` - Follow suggestions

**Projects/Activities**

- ❌ `projects/create-project.test.ts` - Project creation
- ❌ `projects/edit-project.test.ts` - Project editing
- ❌ `projects/delete-project.test.ts` - Project deletion
- ❌ `projects/project-stats.test.ts` - Stats calculation

**Groups**

- ❌ `groups/create-group.test.ts` - Group creation
- ❌ `groups/join-group.test.ts` - Join flow
- ❌ `groups/leave-group.test.ts` - Leave flow
- ❌ `groups/group-members.test.ts` - Member management
- ❌ `groups/group-settings.test.ts` - Settings update

**Challenges**

- ❌ `challenges/create-challenge.test.ts` - Challenge creation
- ❌ `challenges/join-challenge.test.ts` - Participation flow
- ❌ `challenges/challenge-progress.test.ts` - Progress tracking
- ❌ `challenges/challenge-leaderboard.test.ts` - Leaderboard updates

**Profile**

- ❌ `profile/edit-profile.test.ts` - Profile updates
- ❌ `profile/privacy-settings.test.ts` - Privacy changes
- ❌ `profile/profile-visibility.test.ts` - Visibility rules

**Timer**

- ❌ `timer/start-timer.test.ts` - Timer start flow
- ❌ `timer/pause-timer.test.ts` - Pause functionality
- ❌ `timer/stop-timer.test.ts` - Stop and save
- ❌ `timer/timer-persistence.test.ts` - State persistence

**Notifications**

- ❌ `notifications/receive-notification.test.ts` - Notification delivery
- ❌ `notifications/mark-read.test.ts` - Read status
- ❌ `notifications/notification-preferences.test.ts` - Settings

**Search**

- ❌ `search/search-users.test.ts` - User search
- ❌ `search/search-groups.test.ts` - Group search
- ❌ `search/search-challenges.test.ts` - Challenge search

**Media**

- ❌ `media/upload-image.test.ts` - Image upload
- ❌ `media/delete-image.test.ts` - Image deletion
- ❌ `media/image-validation.test.ts` - File validation

**Total:** ~41 integration tests needed

---

### 🟢 P2 - MEDIUM (Nice to Have)

#### Edge Cases & Error Scenarios

**Estimated Coverage Impact:** 5%

- Network error handling
- Offline mode behavior
- Rate limit handling
- Concurrent operation conflicts
- Invalid data handling
- Permission errors

#### Performance & Optimization

**Estimated Coverage Impact:** 2%

- Query caching effectiveness
- Image lazy loading
- Pagination performance
- Debounce/throttle behavior

---

## Coverage Roadmap to 95%

### Phase 1: API Layer (Week 1) - +15%

**Goal:** Complete all P0 API tests

1. Auth API (5 tests)
2. Sessions API (15 tests)
3. Users API (6 tests)
4. Projects API (5 tests)
5. Groups API (6 tests)
6. Challenges API (5 tests)
7. Notifications API (4 tests)
8. Social API (7 tests)
9. Shared utilities (4 tests)

**Deliverable:** 57 API tests, API coverage → 90%+

### Phase 2: Hooks & Services (Week 1-2) - +8%

**Goal:** Test all React hooks and service layers

1. `useActivitiesQuery` (4 tests)
2. `useNotifications` (5 tests)
3. `useDebounce` (2 tests)
4. Additional service tests (10 tests)

**Deliverable:** 21 hook/service tests

### Phase 3: Core Components (Week 2-3) - +30%

**Goal:** Test all P0 components

1. **Auth Components** (10 tests)
   - LoginForm, SignupForm, ProtectedRoute
2. **Timer Components** (15 tests)
   - SessionTimer, ActiveTimerBar, SaveSession, ManualEntry
3. **Feed Components** (20 tests)
   - Feed, FeedPost, SessionCard, FeedFilterDropdown, SessionInteractions
4. **Social Components** (15 tests)
   - CommentInput, CommentList, CommentsModal, SearchUsers
5. **Project Components** (15 tests)
   - ProjectList, ProjectCard, CreateProjectModal, ProjectAnalytics
6. **Group Components** (20 tests)
   - GroupCard, GroupHeader, CreateGroupModal, GroupSettings
7. **Challenge Components** (15 tests)
   - ChallengeDetail, ChallengeLeaderboard, ChallengeProgress
8. **Profile Components** (15 tests)
   - ProfileHeader, ProfileStats, EditProfileModal, PrivacySettings
9. **Media Components** (15 tests)
   - ImageUpload, ImageGallery, ImageLightbox

**Deliverable:** ~140 component tests

### Phase 4: Integration Tests (Week 3-4) - +20%

**Goal:** Complete all critical integration flows

1. **Session Flows** (5 tests)
2. **Feed Interactions** (6 tests)
3. **Social Graph** (5 tests)
4. **Projects** (4 tests)
5. **Groups** (5 tests)
6. **Challenges** (4 tests)
7. **Profile** (3 tests)
8. **Timer** (4 tests)
9. **Notifications** (3 tests)
10. **Search** (3 tests)
11. **Media** (3 tests)

**Deliverable:** ~45 integration tests

### Phase 5: Edge Cases & Refinement (Week 4) - +5%

**Goal:** Cover error scenarios and edge cases

1. Network failures
2. Permission errors
3. Invalid data handling
4. Race conditions
5. Boundary conditions

**Deliverable:** ~20 edge case tests

---

## Test Specifications for Multi-Agent Execution

### Agent 1: `unit-testing:test-automator`

**Responsibility:** Create unit tests for APIs, hooks, and utilities

**Specification:**

```yaml
scope:
  - src/lib/api/**/*.ts
  - src/hooks/**/*.ts
  - src/lib/*.ts (utilities)

requirements:
  - Use AAA pattern (Arrange-Act-Assert)
  - Mock Firebase with tests/__mocks__/firebase
  - Use factories from tests/__mocks__/factories
  - Test success paths and error cases
  - Verify input validation
  - Check data transformations
  - Test edge cases (empty, null, undefined)

output_location: tests/unit/
  - tests/unit/api/
  - tests/unit/hooks/
  - tests/unit/lib/

estimated_tests: 78
estimated_time: Week 1-2
```

### Agent 2: `full-stack-orchestration:test-automator`

**Responsibility:** Create integration tests for user flows

**Specification:**

```yaml
scope:
  - Multi-step user workflows
  - Component integration with Firebase
  - State management flows
  - API + UI coordination

requirements:
  - Test complete user journeys
  - Mock Firebase completely
  - Use realistic test data from factories
  - Test happy paths and error scenarios
  - Verify state changes across components
  - Check async operation handling

output_location: tests/integration/
  - tests/integration/sessions/
  - tests/integration/feed/
  - tests/integration/social/
  - tests/integration/groups/
  - tests/integration/challenges/
  - tests/integration/profile/
  - tests/integration/timer/
  - tests/integration/notifications/
  - tests/integration/search/
  - tests/integration/media/

estimated_tests: 45
estimated_time: Week 2-3
```

### Agent 3: `component-testing:test-automator` (if available)

**Responsibility:** Create component tests for UI

**Specification:**

```yaml
scope:
  - src/components/**/*.tsx (all components)

requirements:
  - Use React Testing Library
  - Test user interactions (clicks, inputs, forms)
  - Verify accessibility (ARIA labels, roles)
  - Test conditional rendering
  - Mock hooks and contexts
  - Test error states
  - Verify loading states

output_location: tests/unit/features/
  - tests/unit/features/auth/
  - tests/unit/features/timer/
  - tests/unit/features/feed/
  - tests/unit/features/social/
  - tests/unit/features/groups/
  - tests/unit/features/challenges/
  - tests/unit/features/profile/

estimated_tests: 140
estimated_time: Week 2-3
```

---

## Success Metrics

### Coverage Targets

- **Overall Code Coverage:** 95%
- **API Layer:** 95%+
- **Hooks:** 95%+
- **Services:** 95%+
- **Components:** 90%+
- **Integration Flows:** 85%+

### Quality Metrics

- All tests pass consistently
- No flaky tests (<1% failure rate)
- Tests run in <2 minutes (unit), <5 minutes (integration)
- Clear test names and documentation
- Proper test isolation (no shared state)

### Deliverables

1. ✅ `tests/__mocks__/` - Comprehensive mocks and factories
2. ⏳ 78 API/hook/utility unit tests
3. ⏳ 140 component unit tests
4. ⏳ 45 integration tests
5. ⏳ `tests/TEST_PLAN.md` - This document
6. ⏳ Updated `CLAUDE.md` with testing guidelines
7. ⏳ CI/CD integration with coverage reporting

---

## Execution Timeline

**Total Estimated Time:** 3-4 weeks

- **Week 1:** API layer tests (57 tests)
- **Week 2:** Hooks, services, and core components (90 tests)
- **Week 3:** Remaining components and integration tests (90 tests)
- **Week 4:** Edge cases, refinement, and documentation (20 tests)

**Checkpoints:**

- End of Week 1: 30% coverage → 45%
- End of Week 2: 45% coverage → 60%
- End of Week 3: 60% coverage → 85%
- End of Week 4: 85% coverage → 95%

---

## Next Steps

1. ✅ Review and approve this test plan
2. ⏳ Assign agents to their respective scopes
3. ⏳ Begin Phase 1: API Layer Tests
4. ⏳ Parallel execution of component and integration tests
5. ⏳ Continuous coverage monitoring
6. ⏳ Daily standups to track progress
7. ⏳ Final coverage validation and report

---

## Notes

- All mocks and factories are ready in `tests/__mocks__/`
- E2E tests are complete and passing
- Jest config set to 95% threshold
- React Testing Library installed and configured
- Follow TDD best practices: Red-Green-Refactor
- Keep tests fast, isolated, and deterministic
- Use meaningful test names describing behavior
- Document complex test scenarios

**Ready to begin Phase 1!**
