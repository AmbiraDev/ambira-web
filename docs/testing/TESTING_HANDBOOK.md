# Ambira Testing Handbook

**Your complete reference for testing in the Ambira project.**

This handbook consolidates all testing documentation and provides clear navigation to find exactly what you need, when you need it.

---

## Quick Navigation

### I want to...

- **Get started quickly** → [Quick Start Guide](#quick-start-guide)
- **Understand our testing approach** → [Testing Strategy](#testing-strategy)
- **Write unit tests** → [Unit Testing Guide](#unit-testing-guide)
- **Write integration tests** → [Integration Testing Guide](#integration-testing-guide)
- **Write contract/API tests** → [Contract Testing Guide](#contract-testing-guide)
- **Use mocks and fixtures** → [Mocks and Fixtures](#mocks-and-fixtures)
- **Set up CI/CD testing** → [CI/CD Integration](#cicd-integration)
- **Debug failing tests** → [Troubleshooting](#troubleshooting)

---

## Quick Start Guide

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run E2E smoke tests
npm run test:smoke

# Generate coverage report
npm run test:coverage
```

### First Test Run

```bash
# 1. Start development server
npm run dev

# 2. In a new terminal, run tests
npm test

# 3. View coverage
npm run test:coverage
open coverage/lcov-report/index.html
```

---

## Testing Strategy

### Philosophy

Ambira uses a **test pyramid** approach emphasizing:

1. **Fast feedback** - Tests run quickly during development
2. **Confidence** - Comprehensive coverage with 95%+ target
3. **Maintainability** - Tests are easy to read and update
4. **User-focused** - Tests verify what users experience, not implementation

### Test Pyramid

```
           /\
          /  \
         / E2E \        Smoke Tests (Critical Paths)
        /------\        5-10% of tests
       /        \
      / Integration \   Feature Workflows
     /------------\   15-25% of tests
    /              \
   /  Unit Tests    \  Components & Functions
  /__________________\ 65-80% of tests
```

### Test Distribution Target

| Type        | Count  | Coverage            | Speed       |
| ----------- | ------ | ------------------- | ----------- |
| Unit        | 65-80% | 95%+                | <100ms each |
| Integration | 15-25% | Critical paths      | <1s each    |
| Contract    | 5-10%  | All APIs            | <1s each    |
| E2E/Smoke   | 5-10%  | Critical user paths | <30s total  |

For detailed strategy, see [TESTING_STRATEGY.md](./TESTING_STRATEGY.md).

---

## Unit Testing Guide

### When to Write Unit Tests

Write unit tests for:

- React components (rendering, props, events)
- Custom React hooks
- Utility functions
- Business logic
- Error conditions and edge cases

### Basic Example

```typescript
import { render, screen } from '@testing-library/react';
import { ActivityCard } from '@/components/ActivityCard';

describe('ActivityCard', () => {
  it('should render activity data', () => {
    const activity = {
      id: '1',
      title: 'Morning Coding',
      duration: 60,
    };

    render(<ActivityCard activity={activity} />);

    expect(screen.getByText('Morning Coding')).toBeInTheDocument();
    expect(screen.getByText(/60 minutes/i)).toBeInTheDocument();
  });
});
```

### Test File Location

```
src/__tests__/unit/
├── components/          # Component tests
│   ├── LoginForm.test.tsx
│   ├── ActivityCard.test.tsx
│   ├── accessibility/   # Accessibility tests
│   ├── auth/            # Auth component tests
│   └── session/         # Session component tests
└── hooks/               # Hook tests
    └── useTimerQuery.test.ts
```

### Running Unit Tests

```bash
# Run all unit tests
npm test -- --testPathPattern="unit"

# Run component tests only
npm test -- --testPathPattern="unit/components"

# Run specific test file
npm test src/__tests__/unit/components/LoginForm.test.tsx

# Watch mode
npm run test:watch
```

### Test Naming Convention

```typescript
// File: ComponentName.test.tsx or hookName.test.ts
describe('ComponentName', () => {
  it('should [expected behavior]', () => {
    // test implementation
  })
})
```

### Common Patterns

#### Testing Component Rendering

```typescript
it('should render with correct props', () => {
  render(<Button variant="primary">Click</Button>);
  expect(screen.getByRole('button')).toHaveClass('btn-primary');
});
```

#### Testing User Interactions

```typescript
it('should handle click events', async () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click</Button>);

  await userEvent.click(screen.getByRole('button'));

  expect(handleClick).toHaveBeenCalled();
});
```

#### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react'

it('should increment counter', () => {
  const { result } = renderHook(() => useCounter())

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})
```

#### Testing with Mocks

```typescript
jest.mock('@/services/userService');

it('should call service on mount', () => {
  const mockGetUser = jest.fn().mockResolvedValue({ id: '1', name: 'John' });
  (userService.getUser as jest.Mock) = mockGetUser;

  render(<UserProfile userId="1" />);

  expect(mockGetUser).toHaveBeenCalledWith('1');
});
```

### Coverage Goals

- **Branches**: 95%
- **Functions**: 95%
- **Lines**: 95%
- **Statements**: 95%

For complete unit testing guide, see [Unit Tests Guide](../../src/__tests__/unit/README.md).

---

## Integration Testing Guide

### When to Write Integration Tests

Write integration tests for:

- Complete user workflows (login → create session → upload image)
- Firebase integration with components
- React Query with API/database calls
- File upload and processing
- Data synchronization between components
- Real-time features and subscriptions

### Basic Example

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionCreationForm } from '@/components/SessionCreationForm';

describe('Integration: Session Creation', () => {
  it('should create session when form is submitted', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SessionCreationForm />
      </QueryClientProvider>
    );

    // Fill form
    await userEvent.type(
      screen.getByLabelText(/project/i),
      'My Project'
    );
    await userEvent.type(
      screen.getByLabelText(/duration/i),
      '60'
    );

    // Submit
    await userEvent.click(screen.getByRole('button', { name: /create/i }));

    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/session created/i)).toBeInTheDocument();
    });
  });
});
```

### Test File Location

```
src/__tests__/integration/
├── auth/               # Authentication workflows
├── firebase/           # Firebase integration
│   ├── feed-images.test.tsx
│   ├── image-storage.test.ts
│   └── session-images-firestore.test.ts
└── image-upload/       # File upload workflows
```

### Running Integration Tests

```bash
# Run all integration tests
npm test -- --testPathPattern="integration"

# Run Firebase tests
npm test -- --testPathPattern="integration/firebase"

# Run auth tests
npm test -- --testPathPattern="integration/auth"
```

### Firebase Integration Pattern

```typescript
import { firebaseMock } from '@/__tests__/__mocks__/firebaseMock'

jest.mock('firebase/firestore')

it('should save data to Firestore', async () => {
  firebaseMock.db.collection('sessions').add.mockResolvedValue({ id: 'session-1' })

  // Test code
  await performAction()

  expect(firebaseMock.db.collection).toHaveBeenCalledWith('sessions')
  expect(firebaseMock.db.collection().add).toHaveBeenCalled()
})
```

### React Query Pattern

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

render(<MyComponent />, { wrapper });
```

For complete integration testing guide, see [Integration Tests Guide](../../src/__tests__/integration/README.md).

---

## Contract Testing Guide

### What Are Contract Tests?

Contract tests verify that APIs and services return data with the correct structure and types. They catch breaking changes before they cause runtime errors.

### When to Write Contract Tests

Write contract tests for:

- HTTP API endpoints
- Firebase Firestore documents
- Third-party API integrations
- Data transformation pipelines
- Service response validation

### Basic Example

```typescript
describe('Challenges API Contract', () => {
  it('should return challenges with correct structure', async () => {
    const response = await getChallenges()

    expect(Array.isArray(response)).toBe(true)

    response.forEach((challenge) => {
      // Verify required fields
      expect(challenge).toHaveProperty('id')
      expect(challenge).toHaveProperty('title')
      expect(challenge).toHaveProperty('type')

      // Verify types
      expect(typeof challenge.id).toBe('string')
      expect(typeof challenge.title).toBe('string')

      // Verify enum values
      expect(['most-activity', 'fastest-effort', 'longest-session', 'group-goal']).toContain(
        challenge.type
      )
    })
  })
})
```

### Test File Location

```
src/__tests__/contract/
└── api/
    ├── challenges.contract.test.ts
    └── notifications.contract.test.ts
```

### Running Contract Tests

```bash
# Run all contract tests
npm test -- --testPathPattern="contract"

# Run API contract tests
npm test -- --testPathPattern="contract/api"
```

### Advanced: Schema Validation

```typescript
import { z } from 'zod'

const ChallengeSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  type: z.enum(['most-activity', 'fastest-effort', 'longest-session']),
  goal: z.number().positive(),
})

it('should validate against schema', async () => {
  const response = await getChallenges()
  const result = z.array(ChallengeSchema).safeParse(response)

  expect(result.success).toBe(true)
})
```

For complete contract testing guide, see [Contract Tests Guide](../../src/__tests__/contract/README.md).

---

## Mocks and Fixtures

### What Are Mocks?

Mocks replace real implementations for testing. They let you test code in isolation without calling actual APIs, databases, or services.

### Firebase Mocks

```typescript
import { firebaseMock } from '@/__tests__/__mocks__/firebaseMock'

// Mock Firestore read
firebaseMock.db
  .collection('users')
  .doc('user-1')
  .get.mockResolvedValue({
    exists: true,
    data: () => ({ id: 'user-1', name: 'John' }),
  })

// Mock Firestore write
firebaseMock.db.collection('sessions').add.mockResolvedValue({
  id: 'session-1',
})
```

### Test Data Factories

```typescript
import { createMockUser, createMockSession, createMockProject } from '@/__tests__/__mocks__/mocks'

// Default data
const user = createMockUser()

// Custom data
const customUser = createMockUser({
  name: 'Jane Doe',
  email: 'jane@example.com',
})

// Mix default and custom
const session = createMockSession({
  userId: user.id,
  duration: 7200,
})
```

### Available Factories

```typescript
// Users
createMockUser(overrides?)

// Sessions (activities/posts)
createMockSession(overrides?)

// Projects
createMockProject(overrides?)

// Challenges
createMockChallenge(overrides?)

// Challenge Participants
createMockChallengeParticipant(overrides?)
```

### Best Practices

```typescript
// Good - use factories
describe('UserProfile', () => {
  it('test 1', () => {
    const user = createMockUser()
    // test
  })

  it('test 2', () => {
    const user = createMockUser()
    // test
  })
})

// Bad - data duplicated
describe('UserProfile', () => {
  it('test 1', () => {
    const user = { id: 'user-1', name: 'John', email: 'john@example.com' }
    // test
  })

  it('test 2', () => {
    const user = { id: 'user-1', name: 'John', email: 'john@example.com' }
    // test
  })
})
```

For complete mocks guide, see [Mocks Guide](../../src/__tests__/__mocks__/README.md).

---

## CI/CD Integration

### Automated Testing

Tests run automatically on:

- Every pull request
- Every push to main branch
- Manual workflow dispatch

### CI Pipeline

1. Install dependencies (with cache)
2. Run linting
3. Run type checking
4. Run unit and integration tests
5. Generate coverage reports
6. Build application
7. Run E2E smoke tests

### GitHub Actions Workflows

**Main CI Workflow**: `.github/workflows/ci.yml`

```yaml
# Runs on: pull_request, push to main, workflow_dispatch
# Steps: lint, type-check, unit tests, build, E2E smoke tests
```

**Playwright E2E Workflow**: `.github/workflows/playwright.yml`

```yaml
# Dedicated E2E testing
# Runs on: push to main, scheduled, manual dispatch
```

### Viewing Test Results

- **GitHub**: Check Actions tab on pull requests
- **Coverage**: `npm run test:coverage && open coverage/lcov-report/index.html`
- **E2E Reports**: `npm run test:e2e:report`

### Pre-Commit Checklist

Before committing code:

```bash
# 1. Run unit tests
npm test

# 2. Check types
npm run type-check

# 3. Fix linting
npm run lint:fix

# 4. Run smoke tests
npm run test:smoke
```

For complete CI/CD guide, see [Playwright CI Setup](./playwright-ci-setup.md).

---

## Best Practices

### Writing Good Tests

1. **Test behavior, not implementation**

   ```typescript
   // Good - tests what user sees
   await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

   // Avoid - tests implementation details
   expect(component.state.isLoading).toBe(false)
   ```

2. **Use semantic queries**

   ```typescript
   // Good - accessible, semantic
   screen.getByRole('button', { name: /submit/i })
   screen.getByLabelText(/email/i)

   // Avoid - brittle, CSS-dependent
   screen.getByClassName('btn-submit')
   screen.getByTestId('email-input')
   ```

3. **One behavior per test**

   ```typescript
   // Good - focused
   it('should display error when email is invalid', () => {
     // test
   })

   // Avoid - testing multiple behaviors
   it('should render and submit', () => {
     // test
   })
   ```

4. **Use AAA pattern** (Arrange-Act-Assert)

   ```typescript
   it('should increment counter', () => {
     // Arrange: Set up test data
     const { result } = renderHook(() => useCounter())

     // Act: Perform action
     act(() => {
       result.current.increment()
     })

     // Assert: Verify results
     expect(result.current.count).toBe(1)
   })
   ```

5. **Keep tests DRY** (Don't Repeat Yourself)

   ```typescript
   describe('Button', () => {
     let button: HTMLElement;

     beforeEach(() => {
       render(<Button>Click</Button>);
       button = screen.getByRole('button');
     });

     it('test 1', () => {
       // use button
     });

     it('test 2', () => {
       // use button
     });
   });
   ```

### Naming Conventions

```
ComponentName.test.tsx          # Component unit tests
hookName.test.ts                # Hook unit tests
functionName.test.ts            # Function unit tests
FeatureName.test.tsx            # Integration tests
APIName.contract.test.ts        # Contract tests
```

### Test File Organization

```
describe('ComponentName', () => {
  beforeEach(() => {
    // Shared setup
  });

  describe('rendering', () => {
    it('should render correctly', () => {});
  });

  describe('user interactions', () => {
    it('should handle click', async () => {});
  });

  describe('error handling', () => {
    it('should show error message', async () => {});
  });
});
```

---

## Troubleshooting

### Tests Pass Locally But Fail in CI

**Problem**: Tests work on your machine but fail in GitHub Actions.

**Solutions**:

- Add explicit waits: `await waitFor(() => { ... })`
- Check environment variables are set in CI
- Increase timeout: `jest.setTimeout(10000)`
- Mock time-dependent operations

### Flaky Tests (Inconsistent Results)

**Problem**: Tests pass sometimes, fail other times.

**Solutions**:

- Use `waitFor` instead of `setTimeout`
- Avoid testing implementation details
- Mock external dependencies
- Don't depend on test execution order

### "Cannot find module" Errors

**Problem**: Module path resolution issues.

**Solutions**:

- Check path aliases in `tsconfig.json` and `jest.config.ts`
- Ensure file extensions are correct
- Mock modules at file top with `jest.mock()`

### "Not wrapped in act(...)" Warnings

**Problem**: React state update warnings.

**Solutions**:

```typescript
import { act } from '@testing-library/react'

act(() => {
  result.current.setState(newValue)
})
```

### Coverage Gaps

**Problem**: Coverage below 95% target.

**Solutions**:

- Run `npm run test:coverage`
- Open `coverage/lcov-report/index.html`
- Add tests for uncovered branches
- Add edge case tests

### Slow Tests

**Problem**: Test suite takes > 30 seconds.

**Solutions**:

- Remove unnecessary waits
- Parallelize test execution
- Profile tests: `npm test -- --detectOpenHandles`
- Move slow tests to separate suite

---

## Command Reference

### Testing Commands

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run with specific filter
npm test -- --testNamePattern="LoginForm"

# Run specific file
npm test src/__tests__/unit/components/LoginForm.test.tsx

# Run only unit tests
npm test -- --testPathPattern="unit"

# Run only integration tests
npm test -- --testPathPattern="integration"
```

### E2E/Smoke Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run only smoke tests
npm run test:smoke

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check

# Format code
npm run format
```

---

## Documentation Structure

### Main Entry Points

| Document                                           | Purpose                               | Audience         |
| -------------------------------------------------- | ------------------------------------- | ---------------- |
| [Testing Handbook](./TESTING_HANDBOOK.md)          | **You are here** - Complete reference | Everyone         |
| [Testing Strategy](./TESTING_STRATEGY.md)          | High-level philosophy and standards   | Leads, reviewers |
| [Test Suite README](../../src/__tests__/README.md) | Overview of all test types            | Developers       |

### Type-Specific Guides

| Document                                                             | Purpose                        | Audience            |
| -------------------------------------------------------------------- | ------------------------------ | ------------------- |
| [Unit Tests Guide](../../src/__tests__/unit/README.md)               | Component and function testing | All developers      |
| [Integration Tests Guide](../../src/__tests__/integration/README.md) | Workflow testing               | Feature developers  |
| [Contract Tests Guide](../../src/__tests__/contract/README.md)       | API testing                    | Backend integrators |

### Utility Guides

| Document                                                 | Purpose                | Audience       |
| -------------------------------------------------------- | ---------------------- | -------------- |
| [Mocks Guide](../../src/__tests__/__mocks__/README.md)   | Mock and fixture usage | All developers |
| [Fixtures Guide](../../src/__tests__/fixtures/README.md) | Test data management   | All developers |

### CI/CD Guides

| Document                                        | Purpose           | Audience             |
| ----------------------------------------------- | ----------------- | -------------------- |
| [Playwright CI Setup](./playwright-ci-setup.md) | E2E testing in CI | DevOps, backend devs |
| [ESLint Standards](./eslint-standards.md)       | Linting rules     | All developers       |

---

## Tools and Dependencies

### Core Testing Tools

| Tool                       | Purpose                      | Version |
| -------------------------- | ---------------------------- | ------- |
| Jest                       | Unit/integration test runner | 30.x    |
| React Testing Library      | Component testing utilities  | 16.x    |
| Playwright                 | E2E testing framework        | 1.5x+   |
| Testing Library User Event | Realistic user interactions  | 14.x    |
| axe-core                   | Accessibility testing        | 4.1x    |

### Test Configuration Files

- `jest.config.ts` - Jest configuration
- `playwright.config.ts` - Playwright configuration
- `package.json` - Test scripts

---

## Coverage and Metrics

### Current Targets

| Metric             | Target       | Tools           |
| ------------------ | ------------ | --------------- |
| Unit Test Coverage | 95%+         | Jest            |
| Accessibility      | 0 violations | axe-core        |
| Test Duration      | <30 seconds  | Built-in timing |
| Flaky Tests        | <1%          | Monitoring      |

### Viewing Metrics

```bash
# Coverage report
npm run test:coverage
open coverage/lcov-report/index.html

# E2E report
npm run test:e2e:report

# Watch detailed output
npm run test:watch
# Then press 'v' in watch mode for coverage
```

---

## Contributing to Tests

### When Adding Features

1. Write tests alongside feature code
2. Aim for 95%+ coverage
3. Include accessibility tests for UI
4. Add integration tests for workflows
5. Document new testing patterns

### When Fixing Bugs

1. Write regression test first
2. Fix the bug
3. Verify test now passes
4. Update documentation if needed

### Code Review Checklist

- Tests pass in CI
- Coverage maintained or improved
- Tests are clear and focused
- No debug code (console.log, debugger)
- Appropriate test type used
- Accessibility checks included (UI tests)

---

## Resources and References

### Internal Documentation

- [src/**tests**/README.md](../../src/__tests__/README.md) - Main test guide
- [src/**tests**/unit/README.md](../../src/__tests__/unit/README.md) - Unit testing
- [src/**tests**/integration/README.md](../../src/__tests__/integration/README.md) - Integration testing
- [src/**tests**/contract/README.md](../../src/__tests__/contract/README.md) - Contract testing
- [src/**tests**/**mocks**/README.md](../../src/__tests__/__mocks__/README.md) - Mocks guide
- [docs/testing/TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Testing strategy
- [docs/testing/playwright-ci-setup.md](./playwright-ci-setup.md) - CI/CD setup

### External Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## FAQ

### Q: Which test type should I use?

**A:** Use this decision tree:

1. **Testing a single component/function?** → Unit Test
2. **Testing a complete user workflow?** → Integration Test
3. **Testing API response structure?** → Contract Test
4. **Testing critical user path in real browser?** → E2E/Smoke Test

### Q: How do I test async code?

**A:** Use `waitFor` for assertions:

```typescript
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

### Q: How do I mock an API call?

**A:** Use Jest mocks:

```typescript
jest.mock('@/services/userService')
;(userService.getUser as jest.Mock).mockResolvedValue({
  id: '1',
  name: 'John',
})
```

### Q: How do I test keyboard navigation?

**A:** Use `userEvent`:

```typescript
import userEvent from '@testing-library/user-event'

await userEvent.tab()
expect(element).toHaveFocus()

await userEvent.keyboard('{Enter}')
```

### Q: How do I test accessibility?

**A:** Use axe-core with Playwright:

```typescript
import { makeAxeBuilder } from '@axe-core/playwright'

const results = await makeAxeBuilder().analyze()
expect(results.violations).toHaveLength(0)
```

### Q: My test is flaky, what do I do?

**A:** Common fixes:

1. Replace `setTimeout` with `waitFor`
2. Mock time-dependent code
3. Add explicit waits for async operations
4. Avoid testing implementation details
5. Don't depend on execution order

---

## Getting Help

### Debugging Steps

1. **Read the error message** - It usually explains the problem
2. **Check test output** - Look for specific line numbers
3. **Use debug output** - `screen.debug()` shows DOM
4. **Run in isolation** - `npm test -- specific.test.tsx`
5. **Check mock setup** - Verify mocks are configured correctly

### Where to Ask

1. Check this handbook for answers
2. Review existing test examples
3. Ask team members in Slack/standup
4. Create GitHub issue with reproducible example

---

## Summary

The Ambira test suite is comprehensive with **4,300+ lines of documentation** covering:

- ✅ 3-tier testing strategy (unit, integration, E2E)
- ✅ 95%+ coverage goals
- ✅ 720+ test files
- ✅ Complete mock and fixture systems
- ✅ CI/CD integration
- ✅ Accessibility testing
- ✅ Detailed guides and examples

**Start with this handbook, then dive into specific guides as needed.**

---

**Last Updated**: October 31, 2024
**Total Documentation**: 4,300+ lines
**Code Examples**: 50+ included
**Test Files**: 720+
**Coverage Target**: 95%

For questions or updates, consult the internal documentation or ask your team.
