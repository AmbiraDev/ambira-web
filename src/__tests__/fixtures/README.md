# Test Fixtures and Mock Factories

This directory contains reusable test utilities including mock factories for better test isolation.

## Overview

Mock factories provide a clean way to create fresh mock instances for each test, preventing state leakage and improving test reliability.

## Mock Factories

### Firebase Mocks

#### `createMockAuth(overrides)`
Creates a mock Firebase Auth instance.

```typescript
import { createMockAuth } from '@/__tests__/fixtures/mocks';

jest.mock('@/lib/firebase', () => ({
  auth: createMockAuth({
    currentUser: { uid: 'test-user-123' }
  }),
}));
```

#### `createMockDb(overrides)`
Creates a mock Firebase Firestore (DB) instance.

```typescript
const mockDb = createMockDb({
  collection: jest.fn(() => ({
    doc: jest.fn(),
  })),
});
```

#### `createMockStorage(overrides)`
Creates a mock Firebase Storage instance.

```typescript
const mockStorage = createMockStorage({
  ref: jest.fn(),
});
```

### API Mocks

#### `createMockFirebaseSessionApi(overrides)`
Creates a mock Firebase Session API instance with all session-related methods.

```typescript
jest.mock('@/lib/api', () => ({
  firebaseSessionApi: createMockFirebaseSessionApi({
    getSessions: jest.fn(() => Promise.resolve({
      sessions: [{ id: 'session-1', title: 'Test Session' }],
      nextCursor: null
    })),
  }),
}));
```

Available methods:
- `getSessions()`
- `getSession()`
- `createSession()`
- `updateSession()`
- `deleteSession()`
- `getActiveSession()`
- `saveActiveSession()`
- `clearActiveSession()`

#### `createMockFirebaseActivityApi(overrides)`
Creates a mock Firebase Activity API instance.

```typescript
const mockActivityApi = createMockFirebaseActivityApi();
```

Available methods:
- `getProjects()`
- `createProject()`
- `updateProject()`
- `deleteProject()`

#### `createMockFirebaseNotificationApi(overrides)`
Creates a mock Firebase Notification API instance.

```typescript
const mockNotifApi = createMockFirebaseNotificationApi({
  getUserNotifications: jest.fn(() => Promise.resolve([
    { id: '1', message: 'Test notification' }
  ])),
});
```

#### `createMockFirebaseAuthApi(overrides)`
Creates a mock Firebase Auth API instance.

```typescript
const mockAuthApi = createMockFirebaseAuthApi({
  login: jest.fn(() => Promise.resolve({
    user: { id: 'user-123', email: 'test@example.com' },
    token: 'mock-token'
  })),
});
```

### React Query Mocks

#### `createMockQueryClient(overrides)`
Creates a mock React Query QueryClient instance.

```typescript
const mockQueryClient = createMockQueryClient({
  invalidateQueries: jest.fn(),
});
```

Available methods:
- `invalidateQueries()`
- `setQueryData()`
- `getQueryData()`
- `cancelQueries()`
- `clear()`
- `prefetchQuery()`
- `removeQueries()`
- `resetQueries()`

### HTTP Client Mocks

#### `createMockAxios(overrides)`
Creates a mock axios instance.

```typescript
const mockAxios = createMockAxios({
  get: jest.fn(() => Promise.resolve({ data: {} })),
});
```

#### `createMockAxiosCreate(baseConfig)`
Creates a mock axios create function that returns mock instances.

```typescript
jest.mock('axios', () => ({
  create: createMockAxiosCreate(),
}));
```

### Next.js Mocks

#### `createMockRouter(overrides)`
Creates a mock Next.js router.

```typescript
const mockRouter = createMockRouter({
  push: jest.fn().mockResolvedValue(true),
});
```

#### `createMockLocalStorage(initialState)`
Creates a mock localStorage with optional initial state.

```typescript
const mockStorage = createMockLocalStorage({
  'user-token': 'test-token-123',
});
```

### Context Mocks

#### `createMockAuthContext(overrides)`
Creates a mock Auth context value.

```typescript
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => createMockAuthContext({
    user: { id: 'user-123', email: 'test@example.com' },
  }),
}));
```

#### `createMockProjectsContext(overrides)`
Creates a mock Projects context value.

```typescript
const mockProjectsContext = createMockProjectsContext({
  projects: [{ id: 'proj-1', name: 'My Project' }],
});
```

#### `createMockToastContext(overrides)`
Creates a mock Toast context value for notifications.

```typescript
const mockToastContext = createMockToastContext({
  success: jest.fn(),
});
```

#### `createMockTimerContext(overrides)`
Creates a mock Timer context value.

```typescript
const mockTimerContext = createMockTimerContext({
  isRunning: true,
  elapsedTime: 300,
});
```

## Best Practices

### 1. Use Factories for Each Test
Create a fresh mock for each test to prevent state leakage:

```typescript
// BAD: Global mock that persists across tests
const mockApi = createMockFirebaseSessionApi();
jest.mock('@/lib/api', () => ({ firebaseSessionApi: mockApi }));

// GOOD: Fresh mock for each test
describe('SessionCard', () => {
  beforeEach(() => {
    jest.mock('@/lib/api', () => ({
      firebaseSessionApi: createMockFirebaseSessionApi(),
    }));
  });
});
```

### 2. Customize Behavior Per Test
Use overrides to set up specific mock behavior for each test:

```typescript
it('should handle API errors', () => {
  jest.mock('@/lib/api', () => ({
    firebaseSessionApi: createMockFirebaseSessionApi({
      getSessions: jest.fn(() => Promise.reject(new Error('API Error'))),
    }),
  }));
  // Test error handling
});

it('should display sessions', () => {
  jest.mock('@/lib/api', () => ({
    firebaseSessionApi: createMockFirebaseSessionApi({
      getSessions: jest.fn(() => Promise.resolve({
        sessions: [{ id: '1', title: 'Test' }],
        nextCursor: null,
      })),
    }),
  }));
  // Test success case
});
```

### 3. Clear Mocks Between Tests
Always clear mock calls between tests:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 4. Test Mock Behavior
Verify that mocks were called correctly:

```typescript
it('should call API with correct parameters', async () => {
  const { firebaseSessionApi } = require('@/lib/api');

  render(<SessionList />);
  await waitFor(() => {
    expect(firebaseSessionApi.getSessions).toHaveBeenCalledWith({
      limit: 10,
      cursor: null,
    });
  });
});
```

## Migration Guide

### Before (Global Mocks)
```typescript
// jest.setup.ts - global mock affects ALL tests
jest.mock('@/lib/api', () => ({
  firebaseSessionApi: {
    getSessions: jest.fn(() => Promise.resolve({ sessions: [], nextCursor: null })),
  },
}));
```

### After (Factory Functions)
```typescript
// In your test file
import { createMockFirebaseSessionApi } from '@/__tests__/fixtures/mocks';

jest.mock('@/lib/api', () => ({
  firebaseSessionApi: createMockFirebaseSessionApi({
    // Customize as needed per test
  }),
}));
```

## Troubleshooting

### Mock Not Being Used
Ensure you're importing from the correct location and that jest.mock() is called before imports:

```typescript
// CORRECT: jest.mock before component import
import { createMockFirebaseSessionApi } from '@/__tests__/fixtures/mocks';
jest.mock('@/lib/api', () => ({
  firebaseSessionApi: createMockFirebaseSessionApi(),
}));
import { SessionCard } from '@/components/SessionCard';

// INCORRECT: jest.mock after imports
import { SessionCard } from '@/components/SessionCard';
jest.mock('@/lib/api', () => ({...})); // Won't work!
```

### Mock State Leaking Between Tests
Use `beforeEach` to create fresh mocks:

```typescript
describe('Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('test 1', () => {
    // Uses fresh mock
  });

  it('test 2', () => {
    // Also uses fresh mock (not affected by test 1)
  });
});
```

## Adding New Mocks

To add a new mock factory:

1. Create the factory function in `mocks.ts`
2. Follow the naming convention: `createMock<Service>(overrides)`
3. Document the factory with JSDoc comments
4. Add an example in this README
5. Update the mock in test files gradually

Example:

```typescript
/**
 * Create a mock User Service instance
 *
 * @param overrides - Partial overrides for custom behavior
 * @returns Mock User Service object
 */
export const createMockUserService = (overrides = {}) => ({
  getUser: jest.fn(() => Promise.resolve(null)),
  updateUser: jest.fn(() => Promise.resolve()),
  deleteUser: jest.fn(() => Promise.resolve()),
  ...overrides,
})
```

## Related Documentation

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](../README.md)
