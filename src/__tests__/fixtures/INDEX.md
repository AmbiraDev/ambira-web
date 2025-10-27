# Test Fixtures Index

Welcome to the test fixtures directory. This directory contains reusable mock factories and testing utilities.

## Quick Start

### Using Mock Factories

```typescript
import { createMockFirebaseSessionApi } from '@/__tests__/fixtures/mocks';

jest.mock('@/lib/api', () => ({
  firebaseSessionApi: createMockFirebaseSessionApi({
    getSessions: jest.fn(() => Promise.resolve({
      sessions: [],
      nextCursor: null,
    })),
  }),
}));
```

## Files in This Directory

### `mocks.ts`
**Purpose**: Mock factory functions for creating isolated mock instances

**Contains**:
- 16 factory functions
- Firebase mocks (auth, db, storage)
- API mocks (session, activity, notification, auth)
- React Query mocks (QueryClient)
- HTTP mocks (axios, axios.create)
- Next.js mocks (router, localStorage)
- Context mocks (auth, projects, toast, timer)

**Usage**: Import any `createMock*` function and use it to create fresh mocks for each test

**Example**:
```typescript
import { createMockFirebaseSessionApi } from '@/__tests__/fixtures/mocks';
const mockApi = createMockFirebaseSessionApi({ /* overrides */ });
```

### `README.md`
**Purpose**: Comprehensive documentation for mock factories

**Contains**:
- Overview of mock factories
- API reference for each factory
- Usage examples for common scenarios
- Best practices and patterns
- Troubleshooting guide
- Migration guide from global mocks

**When to Read**: When you need to understand how to use a specific mock factory

### `TEST_MIGRATION_EXAMPLE.md`
**Purpose**: Before/after examples showing test migration

**Contains**:
- Before: Using global mocks (problems explained)
- After: Using mock factories (benefits explained)
- Real-world examples: Session API migration
- Migration checklist
- Common patterns
- Tips for successful migration

**When to Read**: When migrating existing tests to use mock factories

### `INDEX.md` (This File)
**Purpose**: Quick navigation and overview of fixtures directory

## Available Mock Factories

### Firebase Mocks
- `createMockAuth()` - Firebase Auth with authentication methods
- `createMockDb()` - Firebase Firestore with collection/doc operations
- `createMockStorage()` - Firebase Storage with ref operations

### API Mocks
- `createMockFirebaseSessionApi()` - Session operations (8 methods)
- `createMockFirebaseActivityApi()` - Project/Activity operations (4 methods)
- `createMockFirebaseNotificationApi()` - Notification operations (6 methods)
- `createMockFirebaseAuthApi()` - Authentication operations (5 methods)

### Utility Mocks
- `createMockQueryClient()` - React Query client (8 methods)
- `createMockAxios()` - Axios HTTP client (6 methods)
- `createMockAxiosCreate()` - Axios factory function
- `createMockRouter()` - Next.js useRouter (6 methods)
- `createMockLocalStorage()` - Browser localStorage

### Context Mocks
- `createMockAuthContext()` - Auth context value
- `createMockProjectsContext()` - Projects context value
- `createMockToastContext()` - Toast/notifications context
- `createMockTimerContext()` - Timer context value

## Common Usage Patterns

### Pattern 1: Basic Mock
```typescript
jest.mock('@/lib/api', () => ({
  firebaseSessionApi: createMockFirebaseSessionApi(),
}));
```

### Pattern 2: Customized Mock
```typescript
jest.mock('@/lib/api', () => ({
  firebaseSessionApi: createMockFirebaseSessionApi({
    getSessions: jest.fn(() => Promise.resolve({ sessions: [], nextCursor: null })),
  }),
}));
```

### Pattern 3: Multiple Services
```typescript
jest.mock('@/lib/api', () => ({
  firebaseSessionApi: createMockFirebaseSessionApi(),
  firebaseActivityApi: createMockFirebaseActivityApi(),
  firebaseNotificationApi: createMockFirebaseNotificationApi(),
}));
```

### Pattern 4: Error Simulation
```typescript
jest.mock('@/lib/api', () => ({
  firebaseSessionApi: createMockFirebaseSessionApi({
    getSessions: jest.fn(() => Promise.reject(new Error('API Error'))),
  }),
}));
```

### Pattern 5: Dynamic Behavior
```typescript
const mockSessions = [];
jest.mock('@/lib/api', () => ({
  firebaseSessionApi: createMockFirebaseSessionApi({
    getSessions: jest.fn(() => Promise.resolve({
      sessions: mockSessions,
      nextCursor: null,
    })),
  }),
}));

// In tests:
it('should display added sessions', () => {
  mockSessions.push({ id: '1', title: 'New Session' });
  render(<SessionList />);
  expect(screen.getByText('New Session')).toBeInTheDocument();
});
```

## Key Principles

### 1. Fresh Mocks Per Test
Always create new mock instances for each test to prevent state leakage:
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 2. Explicit Over Implicit
Mock setup should be visible in test files, not hidden in jest.setup.ts:
```typescript
// Good: Clear what's being mocked
jest.mock('@/lib/api', () => ({
  firebaseSessionApi: createMockFirebaseSessionApi(),
}));

// Bad: Relying on global setup
// (implicit dependency on jest.setup.ts)
```

### 3. Minimal Customization
Only override what you need for each test:
```typescript
// Good: Only customize what matters for this test
createMockFirebaseSessionApi({
  getSessions: jest.fn(() => Promise.resolve({ sessions: [], nextCursor: null })),
})

// Bad: Unnecessarily recreate everything
createMockFirebaseSessionApi({
  getSessions: jest.fn(...),
  getSession: jest.fn(...),
  createSession: jest.fn(...),
  // ... every method
})
```

### 4. Verify Mock Behavior
Assert that your code uses mocks correctly:
```typescript
it('should load sessions on mount', async () => {
  const { firebaseSessionApi } = require('@/lib/api');

  render(<SessionList />);

  expect(firebaseSessionApi.getSessions).toHaveBeenCalledWith({
    limit: 10,
    cursor: null,
  });
});
```

## Best Practices

### Do's
- Create fresh mocks in jest.mock() calls
- Clear mocks between tests with jest.clearAllMocks()
- Override only the methods you need
- Document complex mock setups with comments
- Test that your code calls mocks with correct arguments

### Don'ts
- Don't share mock instances between tests
- Don't rely on jest.setup.ts for test-specific mocks
- Don't override methods you don't need to test
- Don't forget to clear mocks between tests
- Don't assume mock state carries over between tests

## Troubleshooting

### Mock Not Being Used
**Problem**: Mock setup appears correct but isn't being used
**Solution**: Ensure jest.mock() is called BEFORE imports

```typescript
// Correct order
import { createMockFirebaseApi } from '@/__tests__/fixtures/mocks';
jest.mock('@/lib/api', () => ({ ... }));
import { MyComponent } from '@/components/MyComponent';

// Wrong order - won't work!
import { MyComponent } from '@/components/MyComponent';
jest.mock('@/lib/api', () => ({ ... }));
```

### Mock State Persists
**Problem**: Previous test's mock state affects current test
**Solution**: Clear mocks in beforeEach()

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // Optional: reset modules for jest.doMock()
  jest.resetModules();
});
```

### Can't Customize Per Test
**Problem**: Need different mock behavior for different tests
**Solution**: Use jest.doMock() with resetModules()

```typescript
beforeEach(() => {
  jest.resetModules();
});

it('test 1', () => {
  jest.doMock('@/lib/api', () => ({
    firebaseSessionApi: createMockFirebaseSessionApi({...}),
  }));
  // Import and test
});

it('test 2', () => {
  jest.doMock('@/lib/api', () => ({
    firebaseSessionApi: createMockFirebaseSessionApi({...}),
  }));
  // Import and test
});
```

## Related Documentation

- **Full Mock Reference**: See `README.md`
- **Migration Examples**: See `TEST_MIGRATION_EXAMPLE.md`
- **Refactoring Report**: See `MOCK_REFACTORING_REPORT.md` in project root
- **Jest Docs**: https://jestjs.io/docs/jest-object
- **Jest Mocking**: https://jestjs.io/docs/manual-mocks

## Asking Questions

### Where to Look First
1. `README.md` - Reference for specific mock factory
2. `TEST_MIGRATION_EXAMPLE.md` - Before/after examples
3. Existing tests - Find similar test and copy pattern
4. `mocks.ts` - JSDoc comments in factory functions

### Making Additions

To add a new mock factory:

1. Add the factory function to `mocks.ts`
2. Include JSDoc documentation
3. Add example to `README.md`
4. Update this INDEX.md if needed
5. Consider adding to `TEST_MIGRATION_EXAMPLE.md` if it's a common pattern

## Summary

The mock fixtures in this directory provide:
- **Better isolation**: Fresh mocks per test
- **Clear dependencies**: Mock setup visible in tests
- **Easy customization**: Override only what you need
- **Comprehensive documentation**: Multiple reference guides
- **Consistent patterns**: Standardized mock creation

Start with the quick start examples above, refer to `README.md` for detailed documentation, and check `TEST_MIGRATION_EXAMPLE.md` when migrating existing tests.

Happy testing!
