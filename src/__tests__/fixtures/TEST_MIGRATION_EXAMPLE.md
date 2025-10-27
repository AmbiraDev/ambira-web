# Test Migration Example: Using Mock Factories

This file demonstrates how to migrate existing tests to use mock factories for better isolation.

## Before: Using Global Mocks

Tests relied on global mocks defined in `jest.setup.ts`, which could cause state leakage:

```typescript
// BEFORE: Relies on global mock from jest.setup.ts
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/LoginForm';

// Mock uses global setup - hard to customize per test
const mockLogin = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
    });
  });

  it('should submit form with valid credentials', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
    });
  });
});
```

### Problems with Global Mocks

1. **State Leakage**: Mock state persists across tests
2. **Hard to Customize**: Difficult to set different mock behavior per test
3. **Implicit Dependencies**: Test behavior depends on jest.setup.ts configuration
4. **Difficult to Debug**: Mock state changes are not visible in test file
5. **Maintenance**: Changes to jest.setup.ts affect all tests globally

## After: Using Mock Factories

Tests now create fresh mocks using factory functions:

```typescript
// AFTER: Uses mock factories for better isolation
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMockAuthContext } from '@/__tests__/fixtures/mocks';
import { LoginForm } from '@/components/LoginForm';

// Mock is fresh for each test - easy to customize
const mockLogin = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    loading: false,
    error: null,
    logout: jest.fn(),
    signup: jest.fn(),
  }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should submit form with valid credentials', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
    });
  });

  it('should show error on login failure', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
```

### Benefits of Mock Factories

1. **Better Isolation**: Each test gets fresh mocks
2. **Customizable**: Easy to override behavior per test
3. **Explicit Dependencies**: Mock setup visible in test file
4. **Self-Documenting**: Mock configuration explains test requirements
5. **Easy to Maintain**: Changes don't affect other tests

## Real-World Example: Session API

### Before: Global Mock

```typescript
// jest.setup.ts - affects ALL tests
jest.mock('@/lib/api', () => ({
  firebaseSessionApi: {
    getSessions: jest.fn(() => Promise.resolve({ sessions: [], nextCursor: null })),
    getSession: jest.fn(() => Promise.resolve(null)),
    // ... more methods
  },
}));
```

Problem: Every test that uses the API gets the same mock, making it hard to test different scenarios.

### After: Per-Test Customization

```typescript
import { createMockFirebaseSessionApi } from '@/__tests__/fixtures/mocks';

describe('SessionList Component', () => {
  // Test 1: Empty session list
  it('should show empty state when no sessions', async () => {
    jest.doMock('@/lib/api', () => ({
      firebaseSessionApi: createMockFirebaseSessionApi({
        getSessions: jest.fn(() =>
          Promise.resolve({
            sessions: [],
            nextCursor: null,
          })
        ),
      }),
    }));

    render(<SessionList />);
    expect(screen.getByText(/no sessions found/i)).toBeInTheDocument();
  });

  // Test 2: With sessions
  it('should display sessions', async () => {
    jest.doMock('@/lib/api', () => ({
      firebaseSessionApi: createMockFirebaseSessionApi({
        getSessions: jest.fn(() =>
          Promise.resolve({
            sessions: [
              { id: '1', title: 'Session 1', duration: 3600 },
              { id: '2', title: 'Session 2', duration: 1800 },
            ],
            nextCursor: null,
          })
        ),
      }),
    }));

    render(<SessionList />);
    expect(screen.getByText('Session 1')).toBeInTheDocument();
    expect(screen.getByText('Session 2')).toBeInTheDocument();
  });

  // Test 3: API error
  it('should show error message on API failure', async () => {
    jest.doMock('@/lib/api', () => ({
      firebaseSessionApi: createMockFirebaseSessionApi({
        getSessions: jest.fn(() =>
          Promise.reject(new Error('Network error'))
        ),
      }),
    }));

    render(<SessionList />);
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
```

Now each test has explicit control over API behavior!

## Migration Checklist

When migrating a test file:

- [ ] Import mock factories: `import { create... } from '@/__tests__/fixtures/mocks'`
- [ ] Remove global jest.mock() calls that rely on jest.setup.ts
- [ ] Add jest.mock() or jest.doMock() with factory functions in each test
- [ ] Customize mock behavior using override parameters
- [ ] Add beforeEach() to clear mocks between tests
- [ ] Verify test still works and fails appropriately
- [ ] Document complex mock setups with comments

## Tips for Successful Migration

### Use jest.doMock() for Dynamic Mocks

When you need different mocks for different tests in the same file:

```typescript
// Dynamically mock per test
beforeEach(() => {
  jest.resetModules();
});

it('test case 1', () => {
  jest.doMock('@/lib/api', () => ({
    firebaseSessionApi: createMockFirebaseSessionApi({...}),
  }));
  // Test here
});

it('test case 2', () => {
  jest.doMock('@/lib/api', () => ({
    firebaseSessionApi: createMockFirebaseSessionApi({...}),
  }));
  // Test here
});
```

### Clear Mocks Between Tests

Always use beforeEach to ensure clean state:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // Optional: reset modules for jest.doMock()
  jest.resetModules();
});
```

### Override Only What You Need

Use the override parameter to customize only specific methods:

```typescript
// Only customize getSessions, other methods use defaults
const mockApi = createMockFirebaseSessionApi({
  getSessions: jest.fn(() =>
    Promise.resolve({
      sessions: [testSession],
      nextCursor: null,
    })
  ),
});
```

### Test Mock Calls

Verify that your code uses the mock correctly:

```typescript
it('should call API with correct parameters', async () => {
  const mockApi = createMockFirebaseSessionApi();

  // Use mocked module
  const { firebaseSessionApi } = await import('@/lib/api');

  // Verify mock was called
  expect(firebaseSessionApi.getSessions).toHaveBeenCalledWith({
    limit: 10,
    cursor: null,
  });
});
```

## Common Patterns

### Pattern 1: Default Mock + Override

```typescript
// Use default mock but customize one method
jest.mock('@/lib/api', () => ({
  firebaseSessionApi: createMockFirebaseSessionApi({
    getSessions: jest.fn(() => Promise.resolve(customSessions)),
  }),
}));
```

### Pattern 2: Multiple Services

```typescript
jest.mock('@/lib/api', () => ({
  firebaseSessionApi: createMockFirebaseSessionApi(),
  firebaseActivityApi: createMockFirebaseActivityApi(),
  firebaseNotificationApi: createMockFirebaseNotificationApi(),
}));
```

### Pattern 3: Error Testing

```typescript
jest.mock('@/lib/api', () => ({
  firebaseSessionApi: createMockFirebaseSessionApi({
    getSessions: jest.fn(() => Promise.reject(new Error('API Error'))),
  }),
}));
```

### Pattern 4: Async Behavior

```typescript
jest.mock('@/lib/api', () => ({
  firebaseSessionApi: createMockFirebaseSessionApi({
    createSession: jest.fn(
      () => new Promise(resolve => setTimeout(() => resolve({ id: 'new' }), 100))
    ),
  }),
}));
```

## See Also

- `src/__tests__/fixtures/mocks.ts` - Mock factory implementations
- `src/__tests__/fixtures/README.md` - Comprehensive mock documentation
- [Jest Manual Mocks Documentation](https://jestjs.io/docs/manual-mocks)
- [Jest Module Mocking](https://jestjs.io/docs/es6-class-mocks)
