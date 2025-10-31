# Test Suite Documentation

Comprehensive guide to the Ambira test suite covering unit, integration, and contract testing.

## Overview

The Ambira test suite uses a 3-tier testing strategy:

```
            /\
           /  \
          / E2E \        (Smoke/End-to-End Tests via Playwright)
         /------\
        /        \
       / Integration \   (Feature Workflows, Firebase, React Query)
      /------------\
     /              \
    /  Unit Tests    \  (Components, Functions, Hooks)
   /__________________\
```

### Test Coverage

- **Unit Tests**: 95% coverage (branches, functions, lines, statements)
- **Integration Tests**: Critical workflows and feature interactions
- **Contract Tests**: API response validation and structure verification
- **E2E Tests**: Critical user paths via Playwright (see `/e2e/` directory)

## Quick Start

### Running Tests

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# View coverage HTML report
open coverage/lcov-report/index.html
```

### Running Specific Tests

```bash
# Run tests matching a pattern
npm test -- --testNamePattern="LoginForm"

# Run tests in a single file
npm test src/__tests__/unit/components/LoginForm.test.tsx

# Run only integration tests
npm test -- --testPathPattern="integration"

# Run only unit tests
npm test -- --testPathPattern="unit"

# Run only contract tests
npm test -- --testPathPattern="contract"
```

### Watch Mode

```bash
# Start watch mode
npm run test:watch

# In watch mode, press:
# a       - run all tests
# p       - filter by filename
# t       - filter by test name
# q       - quit
```

## Test Directory Structure

```
src/__tests__/
├── README.md                          # This file
├── __mocks__/                         # Shared mocks and test utilities
│   ├── README.md                      # Mocks documentation
│   ├── firebaseMock.ts               # Firebase/Firestore mocks
│   └── mocks.ts                      # API mocks and factories
├── fixtures/                          # Test data and fixtures
│   ├── README.md
│   └── mocks.ts
├── helpers/                           # Test helper utilities
│   ├── firebaseMock.ts
│   └── (other helpers)
├── unit/                              # Unit tests
│   ├── README.md
│   ├── components/                    # Component tests
│   │   ├── ActivityCard.test.tsx
│   │   ├── LoginForm.test.tsx
│   │   ├── ProtectedRoute.test.tsx
│   │   ├── accessibility/
│   │   ├── auth/
│   │   ├── analytics/
│   │   └── session/
│   └── hooks/                         # Hook tests
│       └── useTimerQuery.test.ts
├── integration/                       # Integration tests
│   ├── README.md
│   ├── auth/                          # Authentication flows
│   │   └── google-signin.test.ts
│   ├── firebase/                      # Firebase integration
│   │   ├── feed-images.test.tsx
│   │   ├── image-storage.test.ts
│   │   └── session-images-firestore.test.ts
│   └── image-upload/                  # File upload workflows
│       ├── upload-flow-simple.test.ts
│       └── upload-flow.test.tsx
└── contract/                          # Contract tests
    ├── README.md
    └── api/                           # API contract validation
        ├── challenges.contract.test.ts
        └── notifications.contract.test.ts
```

## Unit Tests

### What Are Unit Tests?

Unit tests verify individual functions, hooks, and components in isolation. They should be fast, focused, and test one behavior at a time.

### When to Write Unit Tests

- Testing pure utility functions
- Testing component rendering and user interactions
- Testing custom hooks
- Testing error conditions
- Testing edge cases

### Running Unit Tests

```bash
# Run all unit tests
npm test -- --testPathPattern="unit"

# Run component tests only
npm test -- --testPathPattern="unit/components"

# Run hook tests only
npm test -- --testPathPattern="unit/hooks"

# Run specific test file
npm test src/__tests__/unit/components/LoginForm.test.tsx
```

### Example: Simple Component Test

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityCard } from '@/components/ActivityCard';

describe('ActivityCard', () => {
  it('should render activity data', () => {
    const activity = {
      id: '1',
      title: 'Morning Workout',
      duration: 60,
      timestamp: new Date(),
    };

    render(<ActivityCard activity={activity} />);

    expect(screen.getByText('Morning Workout')).toBeInTheDocument();
    expect(screen.getByText(/60 minutes/i)).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', async () => {
    const onClick = jest.fn();
    render(<ActivityCard activity={activity} onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalled();
  });
});
```

### Example: Hook Test

```typescript
import { renderHook, act } from '@testing-library/react';
import { useTimerQuery } from '@/hooks/useTimerQuery';

describe('useTimerQuery', () => {
  it('should initialize with zero elapsed time', () => {
    const { result } = renderHook(() => useTimerQuery());

    expect(result.current.elapsedSeconds).toBe(0);
  });

  it('should increment elapsed time when started', () => {
    const { result } = renderHook(() => useTimerQuery());

    act(() => {
      result.current.start();
    });

    jest.advanceTimersByTime(1000);

    expect(result.current.elapsedSeconds).toBe(1);
  });
});
```

### Example: Component with Mocks

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/LoginForm';
import * as authService from '@/services/authService';

jest.mock('@/services/authService');

describe('LoginForm', () => {
  it('should call login service with email and password', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ uid: '123' });
    (authService.login as jest.Mock).mockImplementation(mockLogin);

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123');
  });

  it('should display error message on login failure', async () => {
    (authService.login as jest.Mock).mockRejectedValue(
      new Error('Invalid credentials')
    );

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
```

## Integration Tests

### What Are Integration Tests?

Integration tests verify that multiple components/systems work together correctly. They test real workflows like authentication, file uploads, and database interactions.

### When to Write Integration Tests

- Testing complete user workflows (login, create session, upload image)
- Testing Firebase integration with components
- Testing React Query with actual (or mocked) API calls
- Testing file uploads and processing
- Testing context providers with components

### Running Integration Tests

```bash
# Run all integration tests
npm test -- --testPathPattern="integration"

# Run Firebase integration tests
npm test -- --testPathPattern="integration/firebase"

# Run auth integration tests
npm test -- --testPathPattern="integration/auth"

# Run image upload tests
npm test -- --testPathPattern="integration/image-upload"
```

### Example: Firebase Integration

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionTimerEnhanced } from '@/components/session/SessionTimerEnhanced';
import { firebaseMock } from '@/__tests__/__mocks__/firebaseMock';
import { initializeApp } from 'firebase/app';

jest.mock('firebase/app');
jest.mock('firebase/firestore');

describe('SessionTimerEnhanced - Firebase Integration', () => {
  beforeEach(() => {
    (initializeApp as jest.Mock).mockReturnValue(firebaseMock.app);
  });

  it('should save session to Firestore when timer completes', async () => {
    const { getByRole } = render(<SessionTimerEnhanced projectId="proj-1" />);

    // Start timer
    await userEvent.click(getByRole('button', { name: /start/i }));

    // Fast-forward 1 hour
    jest.advanceTimersByTime(3600000);

    // Complete session
    await userEvent.click(getByRole('button', { name: /complete/i }));

    await waitFor(() => {
      expect(firebaseMock.db.collection).toHaveBeenCalledWith('sessions');
      expect(firebaseMock.db.collection().add).toHaveBeenCalled();
    });
  });
});
```

### Example: Image Upload Workflow

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUploadForm } from '@/components/ImageUploadForm';

describe('ImageUploadForm - Integration', () => {
  it('should upload image and update UI', async () => {
    render(<ImageUploadForm onSuccess={jest.fn()} />);

    const file = new File(['image'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/upload/i) as HTMLInputElement;

    await userEvent.upload(input, file);

    expect(screen.getByText(/uploading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/uploaded successfully/i)).toBeInTheDocument();
    });
  });
});
```

### Example: React Query Integration

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProfile } from '@/components/UserProfile';
import * as userService from '@/services/userService';

jest.mock('@/services/userService');

describe('UserProfile - React Query Integration', () => {
  it('should fetch and display user data', async () => {
    const mockUser = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
    };

    (userService.getUser as jest.Mock).mockResolvedValue(mockUser);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <UserProfile userId="123" />
      </QueryClientProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('should handle loading and error states', async () => {
    (userService.getUser as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch')
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <UserProfile userId="123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading user/i)).toBeInTheDocument();
    });
  });
});
```

## Contract Tests

### What Are Contract Tests?

Contract tests verify that API responses match expected data structures and types. They catch breaking changes in APIs before they cause runtime errors.

### When to Write Contract Tests

- Verifying API response structure and types
- Ensuring data contracts between frontend and backend
- Testing Firestore document structure and fields
- Validating data transformations

### Running Contract Tests

```bash
# Run all contract tests
npm test -- --testPathPattern="contract"

# Run API contract tests
npm test -- --testPathPattern="contract/api"
```

### Example: API Contract Test

```typescript
describe('Challenges API Contract', () => {
  it('should return challenges with correct structure', async () => {
    const response = await challengesAPI.getChallenges();

    expect(Array.isArray(response)).toBe(true);

    response.forEach(challenge => {
      expect(challenge).toHaveProperty('id');
      expect(challenge).toHaveProperty('title');
      expect(challenge).toHaveProperty('type');
      expect(challenge).toHaveProperty('startDate');
      expect(challenge).toHaveProperty('endDate');
      expect(challenge).toHaveProperty('participants');

      // Type validation
      expect(typeof challenge.id).toBe('string');
      expect(typeof challenge.title).toBe('string');
      expect(challenge.type).toMatch(
        /^(most-activity|fastest-effort|longest-session|group-goal)$/
      );
      expect(challenge.startDate instanceof Date).toBe(true);
      expect(challenge.participants).toBeInstanceOf(Array);
    });
  });
});
```

## Mocks and Fixtures

### Using Shared Mocks

Ambira provides shared mocks for Firebase, API calls, and test data. See [Mocks Guide](./__mocks__/README.md) for complete documentation.

```typescript
import { firebaseMock } from '@/__tests__/__mocks__/firebaseMock';
import { createMockUser, createMockSession } from '@/__tests__/__mocks__/mocks';

describe('MyComponent', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should work with mocked data', () => {
    const user = createMockUser({ name: 'Test User' });
    const session = createMockSession({ userId: user.id });

    // Use in test
  });
});
```

### Creating Test Fixtures

Create reusable test data using fixture factories:

```typescript
// In __mocks__/mocks.ts
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  createdAt: new Date(),
  ...overrides,
});

export const createMockSession = (overrides?: Partial<Session>): Session => ({
  id: 'session-1',
  userId: 'user-1',
  projectId: 'project-1',
  duration: 3600,
  startedAt: new Date(),
  completedAt: new Date(),
  ...overrides,
});
```

## Writing Tests: Best Practices

### Test Structure (AAA Pattern)

Follow the Arrange-Act-Assert pattern:

```typescript
describe('ComponentName', () => {
  it('should do something specific', () => {
    // ARRANGE: Set up test data and mocks
    const mockData = { id: '1', name: 'Test' };
    jest.spyOn(service, 'getData').mockReturnValue(mockData);

    // ACT: Perform the action being tested
    render(<MyComponent />);
    userEvent.click(screen.getByRole('button'));

    // ASSERT: Verify the results
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Naming Conventions

```
Test Files:      ComponentName.test.tsx or functionName.test.ts
Test Suites:     describe('ComponentName or Feature', () => {})
Test Cases:      it('should [expected behavior]', () => {})
```

Good test names clearly describe what is being tested:

```typescript
// Good
it('should display error message when email is invalid');
it('should increment counter by one when button is clicked');
it('should handle API errors gracefully');

// Avoid
it('works');
it('tests login');
it('error case');
```

### Async Testing

Always use `waitFor` for asynchronous operations:

```typescript
// Bad - may pass inconsistently
it('should display user', async () => {
  render(<UserProfile userId="1" />);
  expect(screen.getByText('John')).toBeInTheDocument();
});

// Good - waits for element
it('should display user', async () => {
  render(<UserProfile userId="1" />);
  await waitFor(() => {
    expect(screen.getByText('John')).toBeInTheDocument();
  });
});
```

### Mocking Best Practices

```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Mock at the top of the file (outside describe)
jest.mock('@/services/userService');

// Use type-safe mocking
const mockUserService = userService as jest.Mocked<typeof userService>;

// Reset specific mocks if needed
mockUserService.getUser.mockReset();
mockUserService.getUser.mockResolvedValue({ id: '1', name: 'Test' });
```

### Testing Hooks

Use `renderHook` for custom hooks:

```typescript
import { renderHook, act } from '@testing-library/react';

it('should update state when action is called', () => {
  const { result } = renderHook(() => useMyHook());

  // Wrap state updates in act()
  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

### Testing Components in Context

```typescript
const Wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>{children}</ThemeProvider>
  </QueryClientProvider>
);

render(<MyComponent />, { wrapper: Wrapper });
```

## Coverage Reports

### Generating Coverage

```bash
# Generate coverage report
npm run test:coverage

# View in browser
open coverage/lcov-report/index.html
```

### Coverage Goals

- **Branches**: 95%
- **Functions**: 95%
- **Lines**: 95%
- **Statements**: 95%

### Interpreting Coverage

Coverage shows which code paths are tested:

- **Uncovered Branches**: Conditional logic (`if`/`else`) not tested
- **Uncovered Functions**: Functions not called in tests
- **Uncovered Lines**: Lines of code not executed
- **Uncovered Statements**: Individual statements not run

```typescript
// Example with missing branch coverage
function processData(value) {
  if (value > 0) {
    return value * 2; // Tested
  }
  return 0; // NOT tested - missing branch coverage
}
```

## Debugging Tests

### Using Debug Mode

```typescript
import { render, screen } from '@testing-library/react';

it('should render correctly', () => {
  const { debug } = render(<MyComponent />);

  // Print DOM to console
  debug();

  // Print specific element
  debug(screen.getByRole('button'));
});
```

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

Then press F5 to start debugging.

### Common Debugging Techniques

```typescript
// Log before/after actions
console.log('Before click:', screen.queryByText('Success'));
userEvent.click(button);
console.log('After click:', screen.queryByText('Success'));

// Check element queries
console.log('Found button:', screen.queryByRole('button'));
console.log('All roles:', screen.logTestingPlaygroundURL());

// Use testing-library queries to inspect
screen.debug(screen.getByRole('main'));
```

## Troubleshooting

### Common Issues

#### Tests pass locally but fail in CI

- Add explicit waits: `await waitFor(() => expect(...).toHaveBeenCalled())`
- Check environment variables in CI
- Review CI logs for specific errors
- Increase timeout: `jest.setTimeout(10000)`

#### Flaky Tests (inconsistent passing/failing)

- Use `waitFor` instead of `setTimeout`
- Avoid testing implementation details
- Mock external dependencies
- Ensure data setup is consistent

#### "Cannot find module" errors

- Check path aliases in `tsconfig.json` and `jest.config.ts`
- Ensure file extensions are correct
- Mock modules at file top with `jest.mock()`

#### "Act" warnings

```typescript
// Error: "not wrapped in act(...)"
// Solution: Wrap state changes in act()
act(() => {
  result.current.setState(newValue);
});
```

#### Memory leaks in tests

- Clear intervals/timers: `jest.clearAllTimers()`
- Unmount components (render cleanup)
- Clear mocks: `jest.clearAllMocks()`
- Unsubscribe from observables

### Getting Help

1. Read the error message carefully - it usually indicates the problem
2. Check the test output for specific line numbers
3. Use debug output to inspect DOM state
4. Review the test setup and mock configuration
5. Consult the documentation for similar test patterns
6. Ask team members for help on specific issues

## CI/CD Integration

### GitHub Actions

Tests run automatically on:

- Every pull request
- Every push to main
- Manual workflow dispatch

### CI Workflow Steps

1. Install dependencies (with cache)
2. Run linting and type checks
3. Run unit and integration tests
4. Generate coverage reports
5. Build application
6. Run E2E smoke tests

### Viewing Test Results

- **Local**: `npm test` output in terminal
- **CI**: GitHub Actions tab in pull request
- **Coverage**: `open coverage/lcov-report/index.html`
- **E2E Reports**: `npm run test:e2e:report`

## Next Steps

- [Unit Tests Guide](./unit/README.md) - Detailed unit testing patterns
- [Integration Tests Guide](./integration/README.md) - Integration testing strategies
- [Contract Tests Guide](./contract/README.md) - API contract validation
- [Mocks Guide](./__mocks__/README.md) - Shared mocks and fixtures
- [Fixtures Guide](./fixtures/README.md) - Test data management

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Playwright Documentation](https://playwright.dev/)
- [Firebase Testing Guide](https://firebase.google.com/docs/rules/unit-tests)
