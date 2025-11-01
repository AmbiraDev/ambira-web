# Test Mocks

This directory contains comprehensive mock implementations and test data factories for Ambira testing.

## Structure

```
__mocks__/
├── firebase/          # Firebase service mocks
│   ├── auth.ts       # Firebase Auth mock
│   ├── firestore.ts  # Firestore mock with query support
│   ├── storage.ts    # Firebase Storage mock
│   └── index.ts      # Central Firebase exports
├── api/              # API client mocks
│   └── index.ts      # HTTP client mock
└── factories/        # Test data factories
    ├── sessionFactory.ts
    ├── userFactory.ts
    ├── activityFactory.ts
    ├── groupFactory.ts
    ├── challengeFactory.ts
    ├── commentFactory.ts
    ├── activeSessionFactory.ts
    └── index.ts      # Central factory exports
```

## Firebase Mocks

### Firestore Mock

```typescript
import { mockFirestore } from '@/tests/__mocks__/firebase/firestore';

// Seed data
mockFirestore._seedData('users', 'user-123', { name: 'Test User' });

// Clear all data
mockFirestore._clearAll();

// Check data
const data = mockFirestore._getAllData('users');
```

**Features:**

- In-memory data store
- Full CRUD operations (addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs)
- Query support (where, orderBy, limit, startAfter)
- Batch operations
- Field values (increment, arrayUnion, arrayRemove, serverTimestamp)
- Deterministic behavior for reliable tests

### Auth Mock

```typescript
import { mockAuth, createMockUser } from '@/tests/__mocks__/firebase/auth';

// Set current user
mockAuth._setCurrentUser(createMockUser({ email: 'test@example.com' }));

// Clear auth state
mockAuth._clearAuthState();

// Reset all mocks
mockAuth._reset();
```

**Features:**

- User authentication state management
- Auth state listeners
- Sign in/out operations
- User creation and deletion
- Password reset
- Google/social auth providers

### Storage Mock

```typescript
import { mockStorage } from '@/tests/__mocks__/firebase/storage';

// Seed file
mockStorage._seedFile('images/test.jpg', new Blob(['data']));

// Check if file exists
const exists = mockStorage._hasFile('images/test.jpg');

// Clear all files
mockStorage._clearAll();
```

**Features:**

- File upload/download
- Upload progress simulation
- File metadata
- List operations
- Deterministic URLs

## API Mock

```typescript
import { mockApiClient } from '@/tests/__mocks__/api';

// Mock a response
mockApiClient.mockResponse('GET', '/api/users', {
  data: [{ id: '1', name: 'User' }],
  status: 200,
});

// Mock an error
mockApiClient.mockError('POST', '/api/sessions', 400, 'Invalid session data');

// Check request history
const requests = mockApiClient.getRequestHistory();
const lastRequest = mockApiClient.getLastRequest();

// Reset
mockApiClient.reset();
```

**Features:**

- Full HTTP method support (GET, POST, PUT, PATCH, DELETE)
- Response mocking
- Error simulation
- Request history tracking
- Automatic response/error handling

## Test Data Factories

Factories create realistic mock data with sensible defaults and optional overrides.

### Usage Pattern

```typescript
import {
  createMockUser,
  createMockSession,
  createMockActivity,
} from '@/tests/__mocks__/factories';

// Create with defaults
const user = createMockUser();

// Create with overrides
const customUser = createMockUser({
  email: 'custom@example.com',
  name: 'Custom User',
  followersCount: 100,
});

// Create batches
const users = createMockUserBatch(5);
```

### Available Factories

#### User Factory

```typescript
createMockUser(overrides?: Partial<User>): User
createMockUserBatch(count: number, baseOverrides?: Partial<User>): User[]
createMockUserWithFollowers(followerCount: number): User
createMockPrivateUser(): User
createMockFollowersOnlyUser(): User
```

#### Session Factory

```typescript
createMockSession(overrides?: Partial<Session>): Session
createMockSessionWithUser(userOverrides?, sessionOverrides?): SessionWithDetails
createMockSessionBatch(count: number, baseOverrides?): Session[]
```

#### Activity Factory

```typescript
createMockActivity(overrides?: Partial<Activity>): Activity
createMockProject(overrides?: Partial<Activity>): Activity // Alias
createMockActivityBatch(count: number, baseOverrides?): Activity[]
```

#### Group Factory

```typescript
createMockGroup(overrides?: Partial<Group>): Group
createMockGroupMembership(overrides?: Partial<GroupMembership>): GroupMembership
createMockGroupBatch(count: number, baseOverrides?): Group[]
```

#### Challenge Factory

```typescript
createMockChallenge(overrides?: Partial<Challenge>): Challenge
createMockChallengeParticipant(overrides?: Partial<ChallengeParticipant>): ChallengeParticipant
createMockChallengeBatch(count: number, baseOverrides?): Challenge[]
```

#### Comment Factory

```typescript
createMockComment(overrides?: Partial<Comment>): Comment
createMockCommentWithDetails(overrides?: Partial<CommentWithDetails>): CommentWithDetails
createMockCommentBatch(count: number, baseOverrides?): Comment[]
```

#### Active Session Factory

```typescript
createMockActiveSession(overrides?): ActiveSession
createMockRunningSession(overrides?): ActiveSession
createMockPausedSession(overrides?): ActiveSession
createMockOldSession(overrides?): ActiveSession
```

### Factory Reset

```typescript
import { resetAllFactories } from '@/tests/__mocks__/factories';

// Reset all factory counters (useful in afterEach)
afterEach(() => {
  resetAllFactories();
});
```

## Best Practices

### 1. Use AAA Pattern (Arrange-Act-Assert)

```typescript
test('should create user', () => {
  // Arrange
  const userData = createMockUser({ name: 'Test' });
  mockFirestore._seedData('users', userData.id, userData);

  // Act
  const result = getUserById(userData.id);

  // Assert
  expect(result).toEqual(userData);
});
```

### 2. Clean Up After Tests

```typescript
import { mockFirestore } from '@/tests/__mocks__/firebase/firestore';
import { resetAllFactories } from '@/tests/__mocks__/factories';

afterEach(() => {
  mockFirestore._clearAll();
  resetAllFactories();
});
```

### 3. Mock Only What You Need

```typescript
// Good: Specific mock
mockApiClient.mockResponse('GET', '/api/users/123', {
  data: createMockUser({ id: '123' }),
});

// Avoid: Over-mocking
// Don't mock every single API endpoint if you only test one
```

### 4. Use Factories for Consistency

```typescript
// Good: Use factory
const user = createMockUser({ email: 'test@example.com' });

// Avoid: Manual object creation
const user = {
  id: '123',
  email: 'test@example.com',
  // ... missing fields, inconsistent structure
};
```

### 5. Test Isolation

Each test should be independent:

```typescript
describe('User tests', () => {
  beforeEach(() => {
    mockFirestore._clearAll();
    mockAuth._clearAuthState();
  });

  afterEach(() => {
    resetAllFactories();
  });

  test('test 1', () => {
    // Fully isolated
  });

  test('test 2', () => {
    // Fully isolated
  });
});
```

## Integration with Jest

### Setup File (jest.setup.ts)

```typescript
// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}));

// Import mocks
import '@/tests/__mocks__/firebase';
import '@/tests/__mocks__/api';
```

### In Test Files

```typescript
import { mockFirestore } from '@/tests/__mocks__/firebase/firestore';
import { createMockUser } from '@/tests/__mocks__/factories';

describe('My Component', () => {
  it('should work', () => {
    const user = createMockUser();
    mockFirestore._seedData('users', user.id, user);
    // ... test
  });
});
```

## Troubleshooting

### "Collection not found" Error

Make sure to seed data before querying:

```typescript
mockFirestore._seedData('users', 'user-1', createMockUser({ id: 'user-1' }));
```

### "Mock not called" Error

Ensure the mock is set up before the code under test runs:

```typescript
// Set up mock BEFORE calling the function
mockApiClient.mockResponse('GET', '/api/users', { data: [] });
await fetchUsers(); // This will use the mock
```

### Stale Data Between Tests

Always clear mocks in afterEach:

```typescript
afterEach(() => {
  mockFirestore._clearAll();
  mockAuth._reset();
  mockStorage._reset();
  mockApiClient.reset();
  resetAllFactories();
});
```
