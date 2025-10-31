# Ambira Testing Strategy & Implementation Plan

## Overview

This document outlines the comprehensive testing strategy for Ambira to achieve 95% coverage.

## Current State

- **Total source files**: ~354
- **Existing test files**: 15
- **Current coverage**: ~5.48%
- **Target coverage**: 95%

## Test Organization

### Directory Structure

```
tests/
├── unit/
│   ├── api/              # API layer tests
│   ├── domain/           # Domain entity tests
│   ├── features/         # Feature service tests
│   │   ├── timer/
│   │   ├── sessions/
│   │   ├── projects/
│   │   ├── auth/
│   │   ├── feed/
│   │   ├── comments/
│   │   ├── social/
│   │   ├── groups/
│   │   ├── challenges/
│   │   ├── profile/
│   │   └── streaks/
│   ├── hooks/           # React hooks tests
│   ├── lib/             # Utility library tests
│   ├── services/        # Infrastructure services
│   └── ui/components/   # UI component tests
└── e2e/                 # End-to-end tests (Playwright)
```

## Testing Patterns & Best Practices

### AAA Pattern (Arrange-Act-Assert)

All tests follow the AAA pattern for clarity:

```typescript
describe('ServiceName', () => {
  it('should do X when Y', () => {
    // Arrange: Set up test data and mocks
    const mockData = { ... };
    jest.spyOn(module, 'method').mockResolvedValue(mockData);

    // Act: Execute the function
    const result = await functionUnderTest(mockData);

    // Assert: Verify the outcome
    expect(result).toEqual(expectedValue);
  });
});
```

### Mock Strategy

- Use factory functions for creating test data
- Mock external dependencies at module boundaries
- Keep mocks close to tests
- Use `jest.spyOn()` for partial mocking
- Mock Firebase/Firestore globally in jest.setup.ts
- Create shared mock factories in `/tests/__mocks__/`

### Test Data Factories

Located in `/tests/__mocks__/factories/`:

- `userFactory.ts` - Create mock users
- `sessionFactory.ts` - Create mock sessions
- `projectFactory.ts` - Create mock projects
- `firebaseFactory.ts` - Create mock Firebase responses

### File Naming Convention

- Test files mirror source structure
- Suffix tests with `.test.ts` or `.test.tsx`
- Service tests: `ServiceName.test.ts`
- Hook tests: `useHookName.test.tsx` or `hookName.test.tsx`
- Component tests: `ComponentName.test.tsx`

## Priority-Based Testing Plan

### P0: Critical Path Tests (Must Complete)

These features are core to the application and must have comprehensive coverage:

#### Timer Feature

- [ ] `tests/unit/features/timer/TimerService.test.ts`
- [ ] `tests/unit/features/timer/hooks/useTimer.test.tsx`
- [ ] `tests/unit/features/timer/hooks/useTimerMutations.test.tsx`
- [ ] `tests/unit/features/timer/hooks/useTimerState.test.tsx`

#### Session Management

- [ ] `tests/unit/features/sessions/SessionService.test.ts`
- [ ] `tests/unit/features/sessions/hooks/useSessions.test.tsx`
- [ ] `tests/unit/features/sessions/hooks/useSessionMutations.test.tsx`

#### Projects

- [ ] `tests/unit/features/projects/ProjectService.test.ts`
- [ ] `tests/unit/features/projects/hooks/useProjects.test.tsx`
- [ ] `tests/unit/features/projects/hooks/useProjectMutations.test.tsx`

#### Authentication

- [ ] `tests/unit/lib/api/auth/index.test.ts`
- [ ] `tests/unit/hooks/useAuth.test.tsx`
- [ ] `tests/unit/features/auth/AuthService.test.ts`

### P1: High Priority Tests

These features are important but secondary to P0:

#### Feed & Discovery

- [ ] `tests/unit/features/feed/hooks/useFeed.test.tsx`
- [ ] `tests/unit/features/feed/hooks/useFeedFilters.test.tsx`

#### Comments & Social Engagement

- [ ] `tests/unit/features/comments/CommentService.test.ts`
- [ ] `tests/unit/features/comments/hooks/useComments.test.tsx`
- [ ] `tests/unit/features/comments/hooks/useCommentMutations.test.tsx`

#### Supports (Likes)

- [ ] `tests/unit/features/social/SupportService.test.ts`
- [ ] `tests/unit/features/social/hooks/useSupports.test.tsx`

#### Groups

- [ ] `tests/unit/features/groups/GroupService.test.ts`
- [ ] `tests/unit/features/groups/hooks/useGroups.test.tsx`
- [ ] `tests/unit/features/groups/hooks/useGroupMutations.test.tsx`
- [ ] `tests/unit/domain/Group.test.ts`

#### Challenges & Leaderboards

- [ ] `tests/unit/features/challenges/ChallengeService.test.ts`
- [ ] `tests/unit/features/challenges/hooks/useChallenges.test.tsx`
- [ ] `tests/unit/features/challenges/hooks/useChallengeMutations.test.tsx`
- [ ] `tests/unit/domain/LeaderboardCalculator.test.ts`

#### Following/Social Graph

- [ ] `tests/unit/features/social/FollowService.test.ts`
- [ ] `tests/unit/features/social/hooks/useFollows.test.tsx`

### P2: Medium Priority Tests

UI Components and utilities:

#### UI Components (15+)

- [ ] `tests/unit/ui/components/SessionCard.test.tsx`
- [ ] `tests/unit/ui/components/ActivityCard.test.tsx`
- [ ] `tests/unit/ui/components/ProjectCard.test.tsx`
- [ ] `tests/unit/ui/components/GroupCard.test.tsx`
- [ ] `tests/unit/ui/components/CommentList.test.tsx`
- [ ] `tests/unit/ui/components/FeedFilters.test.tsx`
- [ ] `tests/unit/ui/components/TimerDisplay.test.tsx`
- [ ] `tests/unit/ui/components/ProfileHeader.test.tsx`
- [ ] `tests/unit/ui/components/StreakDisplay.test.tsx`
- [ ] `tests/unit/ui/components/SearchBar.test.tsx`
- [ ] `tests/unit/ui/components/ImageGallery.test.tsx`
- [ ] `tests/unit/ui/components/AnalyticsWidget.test.tsx`

#### Utilities

- [ ] `tests/unit/lib/utils/dateHelpers.test.ts`
- [ ] `tests/unit/lib/utils/validationHelpers.test.ts`
- [ ] `tests/unit/lib/utils/formatters.test.ts`
- [ ] `tests/unit/lib/imageUpload.test.ts`
- [ ] `tests/unit/lib/cache.test.ts` (enhance existing)
- [ ] `tests/unit/lib/errorHandler.test.ts` (enhance existing)

## Testing Coverage Targets

### By Module

- **API Layer**: 95% coverage
- **Domain Entities**: 95% coverage
- **Services**: 95% coverage
- **Hooks**: 90% coverage (acceptable for UI layer)
- **Components**: 85% coverage (focus on logic, less on render)
- **Utils**: 95% coverage

### Overall Threshold

- **Statements**: 95%
- **Branches**: 95%
- **Functions**: 95%
- **Lines**: 95%

## Test Execution

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
npm test -- tests/unit/features/timer
```

### Generate Coverage Report

```bash
npm run test:coverage
```

### Watch Mode (for development)

```bash
npm run test:watch
```

## Success Criteria

✅ **Coverage Achievement**

- 50+ new test files created
- All P0 tests (20+ tests) implemented
- All P1 tests (25+ tests) implemented
- Most P2 tests (20+ tests) implemented
- Overall coverage increased to 80%+

✅ **Quality Metrics**

- All tests pass
- No flaky tests
- Test execution time < 5 seconds
- All tests follow AAA pattern
- Descriptive test names

✅ **Code Quality**

- Proper mock isolation
- No test interdependencies
- Shared factories for common test data
- Comprehensive edge case coverage

## Next Steps

1. Create shared mock factories
2. Start with P0 tests (Timer, Sessions, Projects, Auth)
3. Continue with P1 tests
4. Complete P2 tests
5. Run coverage and identify gaps
6. Refactor for coverage improvements
