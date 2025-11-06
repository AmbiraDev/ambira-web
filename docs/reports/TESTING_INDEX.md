# Ambira Testing Documentation Index

**Complete guide to all testing resources in the Ambira project.**

This index helps you find exactly what you need for any testing task.

---

## Quick Links

**New to testing?**

- Start here: [Testing Handbook](./docs/testing/TESTING_HANDBOOK.md)
- Then read: [Quick Start Guide](./docs/testing/QUICKSTART.md)

**Already familiar with testing?**

- Jump to specific guide below by test type
- Reference: [Testing Strategy](./docs/testing/TESTING_STRATEGY.md) for philosophy

**Writing code right now?**

- Quick reference: [Command Reference](#command-reference)
- Pattern lookup: [Common Patterns](#common-patterns)

---

## Complete Documentation Map

### Strategic Documents

| Document                                               | Purpose                                                                        | Audience         | Time   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ | ---------------- | ------ |
| [Testing Handbook](./docs/testing/TESTING_HANDBOOK.md) | **MAIN REFERENCE** - Complete guide with navigation, patterns, troubleshooting | Everyone         | 15 min |
| [Testing Strategy](./docs/testing/TESTING_STRATEGY.md) | Philosophy, quality standards, testing workflows, metrics                      | Leads, reviewers | 20 min |
| [Quick Start Guide](./docs/testing/QUICKSTART.md)      | 5-minute setup and first test                                                  | New developers   | 5 min  |

### Test Type Guides

| Document                                                         | Test Type   | Content                                                      | Audience           |
| ---------------------------------------------------------------- | ----------- | ------------------------------------------------------------ | ------------------ |
| [Unit Tests Guide](./src/__tests__/unit/README.md)               | Unit        | Component testing, hooks, functions, 100+ examples           | All developers     |
| [Integration Tests Guide](./src/__tests__/integration/README.md) | Integration | Workflows, Firebase, React Query, file uploads, 50+ examples | Feature developers |
| [Contract Tests Guide](./src/__tests__/contract/README.md)       | Contract    | API validation, Firestore, schema validation, 30+ examples   | API developers     |
| [Test Suite Overview](./src/__tests__/README.md)                 | All Types   | Directory structure, running tests, coverage, 30+ examples   | All developers     |

### Utility Guides

| Document                                             | Purpose      | Content                                            | Audience       |
| ---------------------------------------------------- | ------------ | -------------------------------------------------- | -------------- |
| [Mocks Guide](./src/__tests__/__mocks__/README.md)   | Shared Mocks | Firebase mocks, factories, API mocks, 40+ examples | All developers |
| [Fixtures Guide](./src/__tests__/fixtures/README.md) | Test Data    | Factory patterns, static fixtures, custom data     | All developers |

### CI/CD & Configuration

| Document                                                     | Purpose      | Content                                   | Audience       |
| ------------------------------------------------------------ | ------------ | ----------------------------------------- | -------------- |
| [Playwright CI Setup](./docs/testing/playwright-ci-setup.md) | E2E in CI    | GitHub Actions, workflows, reporting      | DevOps, leads  |
| [ESLint Standards](./docs/testing/eslint-standards.md)       | Code Quality | Linting rules, standards enforcement      | All developers |
| [Testing README](./docs/testing/README.md)                   | Navigation   | Index of all testing docs, quick commands | Everyone       |

---

## By Task: Find What You Need

### I want to...

#### Write a unit test

1. Read: [Unit Tests Guide](./src/__tests__/unit/README.md)
2. Reference: [Common Patterns](#common-patterns)
3. Copy: Example from that guide
4. Run: `npm test MyComponent`

#### Write an integration test

1. Read: [Integration Tests Guide](./src/__tests__/integration/README.md)
2. Understand: Test setup and mocking
3. Reference: Firebase or React Query pattern
4. Run: `npm test -- --testPathPattern="integration"`

#### Write a contract test

1. Read: [Contract Tests Guide](./src/__tests__/contract/README.md)
2. Choose: API contract or Firestore schema
3. Validate: Response structure
4. Run: `npm test -- --testPathPattern="contract"`

#### Mock a service

1. Read: [Mocks Guide](./src/__tests__/__mocks__/README.md)
2. Choose: Firebase mock or service mock
3. Setup: Mock in beforeEach
4. Use: In test

#### Create test data

1. Read: [Mocks Guide](./src/__tests__/__mocks__/README.md) - Test Data Factories section
2. Choose: Appropriate factory (createMockUser, etc.)
3. Create: With customizations
4. Use: In test

#### Debug a failing test

1. Read: [Troubleshooting](#troubleshooting) section
2. Run: `npm test -- --testNamePattern="test-name"`
3. Use: screen.debug() to inspect DOM
4. Reference: [Mocks Guide](#mocks-and-fixtures) for mock issues

#### Set up CI/CD testing

1. Read: [Playwright CI Setup](./docs/testing/playwright-ci-setup.md)
2. Configure: GitHub Actions
3. Run: E2E tests in pipeline
4. Monitor: Test reports

#### Improve test coverage

1. Run: `npm run test:coverage`
2. Open: `coverage/lcov-report/index.html`
3. Identify: Uncovered lines/branches
4. Add: Tests for gaps
5. Verify: Coverage > 95%

#### Understand testing strategy

1. Read: [Testing Strategy](./docs/testing/TESTING_STRATEGY.md)
2. Learn: Test pyramid approach
3. Review: Quality standards
4. Reference: Testing workflows

---

## Command Reference

### Running Tests

```bash
# All tests (unit + integration)
npm test

# Watch mode
npm run test:watch

# Specific test
npm test MyComponent

# Pattern matching
npm test -- --testNamePattern="should render"

# Filter by directory
npm test -- --testPathPattern="unit"
npm test -- --testPathPattern="integration"
npm test -- --testPathPattern="contract"
```

### Coverage

```bash
# Generate report
npm run test:coverage

# View in browser
open coverage/lcov-report/index.html

# Coverage for specific file
npm run test:coverage -- src/components/Button
```

### E2E Tests

```bash
# All E2E tests
npm run test:e2e

# Smoke tests only
npm run test:smoke

# Interactive UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# View report
npm run test:e2e:report
```

### Code Quality

```bash
# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Formatting
npm run format
npm run format:check
```

### Pre-Commit

```bash
# Complete check
npm test && npm run type-check && npm run lint:fix && npm run test:smoke
```

---

## Common Patterns

### Unit Test - Component Rendering

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/Button';

it('should render button', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

See: [Unit Tests Guide - Testing Components](./src/__tests__/unit/README.md#testing-components)

### Unit Test - User Interaction

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should call onClick', async () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click</Button>);

  await userEvent.click(screen.getByRole('button'));

  expect(handleClick).toHaveBeenCalled();
});
```

See: [Unit Tests Guide - Testing User Interactions](./src/__tests__/unit/README.md#testing-user-interactions)

### Unit Test - Hook

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCounter } from '@/hooks/useCounter'

it('should increment', () => {
  const { result } = renderHook(() => useCounter())

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})
```

See: [Unit Tests Guide - Testing Hooks](./src/__tests__/unit/README.md#testing-hooks)

### Integration Test - Complete Workflow

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

it('should complete workflow', async () => {
  render(
    <QueryClientProvider client={queryClient}>
      <MyComponent />
    </QueryClientProvider>
  );

  // Act
  await userEvent.click(screen.getByRole('button'));

  // Assert
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

See: [Integration Tests Guide](./src/__tests__/integration/README.md)

### Firebase Mock

```typescript
import { firebaseMock } from '@/__tests__/__mocks__/firebaseMock'

jest.mock('firebase/firestore')

it('should save to Firestore', async () => {
  firebaseMock.db.collection('items').add.mockResolvedValue({ id: 'new-id' })

  // Test code
  expect(firebaseMock.db.collection).toHaveBeenCalledWith('items')
})
```

See: [Mocks Guide - Firebase Mocks](./src/__tests__/__mocks__/README.md#firebase-mocks)

### Service Mock

```typescript
import * as userService from '@/services/userService'

jest.mock('@/services/userService')

it('should fetch user', async () => {
  ;(userService.getUser as jest.Mock).mockResolvedValue({
    id: '1',
    name: 'John',
  })

  // Test code
  expect(userService.getUser).toHaveBeenCalledWith('1')
})
```

See: [Unit Tests Guide - Testing with Mocks](./src/__tests__/unit/README.md#testing-with-mocks)

### Test Data Factory

```typescript
import { createMockUser, createMockSession } from '@/__tests__/__mocks__/mocks';

it('should render user session', () => {
  const user = createMockUser({ name: 'Jane' });
  const session = createMockSession({ userId: user.id });

  render(<SessionCard session={session} user={user} />);
  // Test code
});
```

See: [Mocks Guide - Test Data Factories](./src/__tests__/__mocks__/README.md#test-data-factories)

### Contract Test - API Validation

```typescript
describe('API Contract', () => {
  it('should return data with required fields', async () => {
    const response = await getChallenges()

    response.forEach((item) => {
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('title')
      expect(typeof item.id).toBe('string')
    })
  })
})
```

See: [Contract Tests Guide - API Contract Tests](./src/__tests__/contract/README.md#api-contract-tests)

---

## Troubleshooting

### Tests Pass Locally But Fail in CI

**Solution**: Use explicit waits instead of arbitrary timeouts.

```typescript
// Good - waits for specific condition
await waitFor(() => {
  expect(screen.getByText('Done')).toBeInTheDocument()
})

// Bad - arbitrary wait
await new Promise((resolve) => setTimeout(resolve, 1000))
```

See: [Testing Handbook - Troubleshooting](./docs/testing/TESTING_HANDBOOK.md#troubleshooting)

### Flaky Tests (Inconsistent Pass/Fail)

**Solution**: Avoid testing implementation details, mock external dependencies.

See: [Testing Handbook - Flaky Tests](./docs/testing/TESTING_HANDBOOK.md#flaky-tests-inconsistent-results)

### "Cannot find module" Errors

**Solution**: Check path aliases and mock declarations.

See: [Testing Handbook - Cannot find module](./docs/testing/TESTING_HANDBOOK.md#cannot-find-module-errors)

### Mock Not Working

**Solution**: Ensure mock is declared before imports, clear mocks between tests.

See: [Mocks Guide - Verifying Mock Calls](./src/__tests__/__mocks__/README.md#verifying-mock-calls)

---

## File Structure

### Documentation Files

```
docs/testing/
├── TESTING_HANDBOOK.md      # Start here - complete reference
├── QUICKSTART.md            # 5-minute setup
├── TESTING_STRATEGY.md      # Philosophy and standards
├── README.md                # Navigation
├── playwright-ci-setup.md   # E2E in CI
└── eslint-standards.md      # Linting rules

src/__tests__/
├── README.md                # Test suite overview
├── unit/
│   └── README.md            # Unit testing guide
├── integration/
│   └── README.md            # Integration testing guide
├── contract/
│   └── README.md            # Contract testing guide
├── __mocks__/
│   └── README.md            # Mocks guide
└── fixtures/
    └── README.md            # Fixtures guide

e2e/
└── README.md                # E2E testing guide (Playwright)
```

### Test Files

```
src/__tests__/
├── unit/
│   ├── components/          # Component tests
│   ├── hooks/               # Hook tests
│   └── ...
├── integration/
│   ├── auth/                # Auth workflow tests
│   ├── firebase/            # Firebase tests
│   └── image-upload/        # Upload workflow tests
├── contract/
│   └── api/                 # API contract tests
├── __mocks__/               # Mock implementations
└── fixtures/                # Test data
```

---

## Getting Help

### Step-by-Step Help

1. **Find your task** above (By Task: Find What You Need)
2. **Read the recommended guide**
3. **Copy a similar example**
4. **Run your test** (`npm test MyTest`)
5. **Debug with** `screen.debug()` if needed
6. **Check** [Troubleshooting](#troubleshooting) section

### Debugging Techniques

```typescript
// Print the DOM
screen.debug()

// Print specific element
screen.debug(screen.getByRole('button'))

// Check if element exists
console.log(screen.queryByText('Text'))

// Log mock calls
console.log(myMock.mock.calls)
```

### When Stuck

1. **Check test output carefully** - Error message usually explains the problem
2. **Search documentation** - Use Ctrl+F to find keywords
3. **Look for similar tests** - Find a working test with similar pattern
4. **Use debug mode** - `npm run test:e2e:debug` for E2E
5. **Ask team** - Share the failing test and error message

---

## Summary

### Documentation Stats

- **Files**: 10 comprehensive guides
- **Lines**: 9,000+ documentation lines
- **Examples**: 100+ code examples
- **Coverage**: All test types, patterns, troubleshooting
- **Tools**: Jest, React Testing Library, Playwright, axe-core

### Recommended Reading Order

1. **New to project?**
   - [Quick Start Guide](./docs/testing/QUICKSTART.md) (5 min)
   - [Testing Handbook](./docs/testing/TESTING_HANDBOOK.md) (15 min)

2. **Writing first test?**
   - [Unit Tests Guide](./src/__tests__/unit/README.md)
   - [Common Patterns](#common-patterns) section

3. **Need specific help?**
   - Jump to relevant guide from [By Task](#by-task-find-what-you-need)
   - Reference [Command Reference](#command-reference)

4. **Understand philosophy?**
   - [Testing Strategy](./docs/testing/TESTING_STRATEGY.md)

---

## Quick Navigation

- [Testing Handbook](./docs/testing/TESTING_HANDBOOK.md) - Start here
- [Quick Start](./docs/testing/QUICKSTART.md) - 5-minute setup
- [Testing Strategy](./docs/testing/TESTING_STRATEGY.md) - Philosophy
- [Unit Tests](./src/__tests__/unit/README.md) - Component testing
- [Integration Tests](./src/__tests__/integration/README.md) - Workflow testing
- [Contract Tests](./src/__tests__/contract/README.md) - API testing
- [Mocks Guide](./src/__tests__/__mocks__/README.md) - Mocks and factories
- [Full Test Suite Guide](./src/__tests__/README.md) - Overview

---

**Last Updated**: October 31, 2024
**Total Documentation**: 9,000+ lines
**Test Files in Project**: 720+
**Coverage Target**: 95%+

Start with [Testing Handbook](./docs/testing/TESTING_HANDBOOK.md) or [Quick Start](./docs/testing/QUICKSTART.md).
