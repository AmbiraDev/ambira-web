# Testing Quick Start Guide

Get started with testing in Ambira in 5 minutes.

---

## Installation (1 minute)

```bash
# Install dependencies
npm install

# Install Playwright browsers (for E2E tests)
npx playwright install
```

---

## Run Your First Tests (2 minutes)

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run E2E smoke tests
npm run test:smoke
```

**Watch mode tip**: Press these keys in watch mode:

- `a` - run all tests
- `p` - filter by filename
- `t` - filter by test name
- `q` - quit

---

## View Coverage Report (1 minute)

```bash
# Generate coverage report
npm run test:coverage

# Open in browser
open coverage/lcov-report/index.html
```

You should see **95%+ coverage** across all metrics.

---

## Write Your First Test (1 minute)

Create `src/__tests__/unit/components/MyComponent.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render with text', () => {
    render(<MyComponent text="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click', async () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);

    await userEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalled();
  });
});
```

Run your test:

```bash
npm test MyComponent
```

---

## Test Types at a Glance

### Unit Tests

Testing individual components, hooks, or functions

```typescript
// Simple component rendering
it('should render card', () => {
  render(<Card title="Test" />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

**Location**: `src/__tests__/unit/`
**Run**: `npm test -- --testPathPattern="unit"`

### Integration Tests

Testing complete workflows (form → submit → success)

```typescript
// Complete workflow
it('should create session', async () => {
  render(<SessionCreationWizard />);

  await userEvent.type(screen.getByLabelText(/duration/i), '60');
  await userEvent.click(screen.getByRole('button', { name: /create/i }));

  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

**Location**: `src/__tests__/integration/`
**Run**: `npm test -- --testPathPattern="integration"`

### Contract Tests

Testing API response structure

```typescript
// Verify API shape
it('should return user with required fields', async () => {
  const user = await getUser('user-1');

  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('name');
  expect(user).toHaveProperty('email');
  expect(typeof user.id).toBe('string');
});
```

**Location**: `src/__tests__/contract/`
**Run**: `npm test -- --testPathPattern="contract"`

### E2E/Smoke Tests

Testing critical paths in real browser

```bash
# Run smoke tests
npm run test:smoke

# Interactive test runner
npm run test:e2e:ui
```

**Location**: `e2e/smoke/`

---

## Using Mocks

### Mock a Service

```typescript
import * as userService from '@/services/userService';

jest.mock('@/services/userService');

it('should call user service', () => {
  (userService.getUser as jest.Mock).mockResolvedValue({
    id: '1',
    name: 'John',
  });

  // Test code
});
```

### Use Test Data Factory

```typescript
import { createMockUser, createMockSession } from '@/__tests__/__mocks__/mocks';

it('should display user session', () => {
  const user = createMockUser({ name: 'Jane' });
  const session = createMockSession({ userId: user.id });

  render(<SessionCard session={session} user={user} />);
  // Test code
});
```

**Available factories**:

- `createMockUser()`
- `createMockSession()`
- `createMockProject()`
- `createMockChallenge()`

---

## Common Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test MyComponent.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"

# Run only unit tests
npm test -- --testPathPattern="unit"

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
npm run test:smoke
npm run test:e2e:ui
npm run test:e2e:debug

# View reports
npm run test:e2e:report
```

---

## Common Patterns

### Test Component Rendering

```typescript
it('should render component', () => {
  render(<MyComponent prop="value" />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### Test User Interactions

```typescript
it('should handle form submission', async () => {
  render(<LoginForm />);

  await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'password');
  await userEvent.click(screen.getByRole('button', { name: /login/i }));

  expect(handleSubmit).toHaveBeenCalled();
});
```

### Test Async Operations

```typescript
it('should load data', async () => {
  render(<DataComponent />);

  // Wait for element
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### Test Hooks

```typescript
import { renderHook, act } from '@testing-library/react';

it('should increment', () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

### Test Firebase

```typescript
import { firebaseMock } from '@/__tests__/__mocks__/firebaseMock';

jest.mock('firebase/firestore');

it('should save to Firestore', async () => {
  firebaseMock.db
    .collection('sessions')
    .add.mockResolvedValue({ id: 'session-1' });

  // Test code
});
```

---

## Troubleshooting

### Test won't find element

1. Check element text/role matches
2. Use `screen.debug()` to see DOM
3. Use more specific queries:

   ```typescript
   // Good - semantic
   screen.getByRole('button', { name: /submit/i });
   screen.getByLabelText(/email/i);

   // Avoid - brittle
   screen.getByClassName('btn');
   ```

### Test passes locally but fails in CI

1. Add explicit waits:

   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Done')).toBeInTheDocument();
   });
   ```

2. Increase timeout:
   ```typescript
   jest.setTimeout(10000);
   ```

### Mock not working

1. Ensure mock declared **before** import
2. Verify path matches exactly
3. Clear mocks between tests:
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

---

## Before You Commit

```bash
# 1. Run tests
npm test

# 2. Check types
npm run type-check

# 3. Fix linting
npm run lint:fix

# 4. Run smoke tests
npm run test:smoke
```

All tests must pass before committing.

---

## Next Steps

1. **Read a full guide**: [Testing Handbook](./TESTING_HANDBOOK.md)
2. **Unit tests deep dive**: [Unit Tests Guide](../../src/__tests__/unit/README.md)
3. **Integration patterns**: [Integration Tests Guide](../../src/__tests__/integration/README.md)
4. **Mock usage**: [Mocks Guide](../../src/__tests__/__mocks__/README.md)

---

## Key Files

| File                       | Purpose                  |
| -------------------------- | ------------------------ |
| `jest.config.ts`           | Jest configuration       |
| `playwright.config.ts`     | E2E test configuration   |
| `src/__tests__/`           | All tests                |
| `src/__tests__/__mocks__/` | Test mocks and factories |
| `.github/workflows/ci.yml` | Automated testing in CI  |

---

## Resources

- [Testing Handbook](./TESTING_HANDBOOK.md) - Complete reference
- [Jest Docs](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)

---

**You're ready!** Start writing tests with `npm test`.
