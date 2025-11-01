# Mocks and Fixtures Guide

Complete documentation for shared mocks, test utilities, and fixtures in the Ambira test suite.

## Overview

This directory contains reusable mocks and test utilities that help keep tests DRY (Don't Repeat Yourself) and maintainable. Use these mocks instead of creating custom mocks in every test file.

## Directory Structure

```
__mocks__/
├── README.md              # This file
├── firebaseMock.ts       # Firebase/Firestore mocks
├── mocks.ts              # API mocks and test factories
├── apiMock.ts            # HTTP API mocks
└── (other mocks)
```

## Firebase Mocks

### Overview

The `firebaseMock.ts` file provides comprehensive mocks for Firebase services:

- Firebase App initialization
- Firestore database operations
- Authentication
- Storage

### Using Firebase Mocks

#### Basic Setup

```typescript
import { firebaseMock } from '@/__tests__/__mocks__/firebaseMock';

describe('MyComponent', () => {
  beforeEach(() => {
    // Reset all Firebase mocks
    jest.clearAllMocks();
  });

  it('should interact with Firestore', () => {
    // firebaseMock provides a complete Firebase instance
    const db = firebaseMock.db;
    expect(db.collection).toBeDefined();
  });
});
```

#### Mocking Firestore Reads

```typescript
import { firebaseMock } from '@/__tests__/__mocks__/firebaseMock';

describe('UserProfile', () => {
  it('should fetch user data', async () => {
    // Mock the Firestore response
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };

    firebaseMock.db
      .collection('users')
      .doc('user-1')
      .onSnapshot.mockImplementation(callback => {
        callback({ exists: true, data: () => mockUser });
      });

    // Your test here
  });
});
```

#### Mocking Firestore Writes

```typescript
import { firebaseMock } from '@/__tests__/__mocks__/firebaseMock';

describe('SessionCreation', () => {
  it('should create session in Firestore', async () => {
    const sessionData = {
      userId: 'user-1',
      projectId: 'project-1',
      duration: 3600,
    };

    firebaseMock.db.collection('sessions').add.mockResolvedValue({
      id: 'session-1',
    });

    // Create session
    const result = await db.collection('sessions').add(sessionData);

    expect(firebaseMock.db.collection).toHaveBeenCalledWith('sessions');
    expect(firebaseMock.db.collection().add).toHaveBeenCalledWith(sessionData);
    expect(result.id).toBe('session-1');
  });
});
```

#### Mocking Authentication

```typescript
import { firebaseMock } from '@/__tests__/__mocks__/firebaseMock';

describe('Authentication', () => {
  it('should authenticate user', async () => {
    const mockUser = { uid: 'user-123', email: 'test@example.com' };

    firebaseMock.auth.signInWithEmailAndPassword.mockResolvedValue({
      user: mockUser,
    });

    const result = await auth.signInWithEmailAndPassword(
      'test@example.com',
      'password'
    );

    expect(result.user.uid).toBe('user-123');
  });
});
```

### Firebase Mock API Reference

#### firebaseMock.app

Firebase App instance mock.

```typescript
firebaseMock.app.name; // 'DEFAULT'
```

#### firebaseMock.db (Firestore)

Firestore database mock with full collection/document API.

```typescript
// Collections
firebaseMock.db.collection('users');
firebaseMock.db.collection('sessions').doc('session-1');

// Document operations
.get()                    // Get document once
.onSnapshot()            // Subscribe to real-time updates
.set()                   // Create/replace document
.update()                // Update document fields
.delete()                // Delete document
.collection()            // Subcollections

// Collection queries
.where()                 // Filter by field
.orderBy()               // Sort results
.limit()                 // Limit results
.startAfter()            // Pagination
.endBefore()             // Pagination
```

#### firebaseMock.auth

Firebase Authentication mock.

```typescript
// Email/Password
firebaseMock.auth.signInWithEmailAndPassword(email, password);
firebaseMock.auth.createUserWithEmailAndPassword(email, password);

// Sign out
firebaseMock.auth.signOut();

// Current user
firebaseMock.auth.currentUser;

// User state
firebaseMock.auth.onAuthStateChanged(callback);
```

#### firebaseMock.storage

Firebase Storage mock.

```typescript
firebaseMock.storage.ref(path);
firebaseMock.storage.ref().put(file);
firebaseMock.storage.ref().getDownloadURL();
```

## Test Data Factories

### Overview

The `mocks.ts` file provides factory functions to create consistent test data:

- User factories
- Session factories
- Project factories
- Challenge factories
- Challenge participant factories

### Using Factories

#### Basic Usage

```typescript
import {
  createMockUser,
  createMockSession,
  createMockProject,
} from '@/__tests__/__mocks__/mocks';

describe('ActivityCard', () => {
  it('should display activity', () => {
    const user = createMockUser();
    const session = createMockSession({ userId: user.id });

    render(<ActivityCard session={session} user={user} />);

    expect(screen.getByText(session.title)).toBeInTheDocument();
  });
});
```

#### Customizing Data

All factory functions accept optional overrides:

```typescript
// Default data
const defaultUser = createMockUser();

// Custom data
const customUser = createMockUser({
  id: 'custom-id',
  name: 'Jane Doe',
  email: 'jane@example.com',
});

// Mix default and custom
const partialUser = createMockUser({
  name: 'John Custom',
  // All other fields use defaults
});
```

### Factory Reference

#### createMockUser(overrides?)

Creates a mock User object.

```typescript
const user = createMockUser({
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  username: 'johndoe',
  bio: 'Software engineer',
  profileImage: 'https://example.com/avatar.jpg',
  followers: 10,
  following: 5,
  totalHours: 100,
  createdAt: new Date('2024-01-01'),
  profileVisibility: 'everyone',
  activityVisibility: 'followers',
  projectVisibility: 'followers',
});
```

#### createMockSession(overrides?)

Creates a mock Session object (activity/post).

```typescript
const session = createMockSession({
  id: 'session-1',
  userId: 'user-1',
  projectId: 'project-1',
  title: 'Morning Coding',
  description: 'Worked on new features',
  startedAt: new Date(),
  completedAt: new Date(),
  duration: 3600,
  visibility: 'everyone',
  supportCount: 5,
  commentCount: 2,
  isSupported: false,
  createdAt: new Date(),
});
```

#### createMockProject(overrides?)

Creates a mock Project object.

```typescript
const project = createMockProject({
  id: 'project-1',
  userId: 'user-1',
  name: 'Ambira',
  description: 'Productivity tracking app',
  color: '#007AFF',
  emoji: '🚀',
  totalHours: 100,
  createdAt: new Date(),
  visibility: 'everyone',
});
```

#### createMockChallenge(overrides?)

Creates a mock Challenge object.

```typescript
const challenge = createMockChallenge({
  id: 'challenge-1',
  title: 'November Coding Marathon',
  description: 'Code for 100 hours in November',
  type: 'most-activity',
  startDate: new Date('2024-11-01'),
  endDate: new Date('2024-11-30'),
  goal: 100,
  groupId: null,
  createdBy: 'user-1',
  visibility: 'public',
});
```

#### createMockChallengeParticipant(overrides?)

Creates a mock Challenge Participant object.

```typescript
const participant = createMockChallengeParticipant({
  id: 'participant-1',
  challengeId: 'challenge-1',
  userId: 'user-1',
  progress: 50,
  completed: false,
  joinedAt: new Date(),
  completedAt: null,
});
```

## API Mocks

### Mocking HTTP Calls

```typescript
import { apiMock } from '@/__tests__/__mocks__/apiMock';

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch user data', async () => {
    const mockUser = createMockUser();

    // Mock axios/fetch response
    apiMock.get.mockResolvedValue({ data: mockUser });

    const result = await userService.getUser('user-1');

    expect(apiMock.get).toHaveBeenCalledWith('/api/users/user-1');
    expect(result).toEqual(mockUser);
  });

  it('should handle API errors', async () => {
    apiMock.get.mockRejectedValue(new Error('Network error'));

    await expect(userService.getUser('user-1')).rejects.toThrow(
      'Network error'
    );
  });
});
```

## Creating New Mocks

### Adding to firebaseMock.ts

```typescript
// Add to firebaseMock.ts
export const firebaseMock = {
  // ... existing mocks
  myNewService: {
    methodName: jest.fn().mockResolvedValue(expectedValue),
  },
};
```

### Adding to mocks.ts

Create a factory function for your data type:

```typescript
export interface MyDataType {
  id: string;
  name: string;
  createdAt: Date;
}

export const createMockMyDataType = (
  overrides?: Partial<MyDataType>
): MyDataType => ({
  id: 'default-id',
  name: 'Default Name',
  createdAt: new Date(),
  ...overrides,
});
```

## Best Practices

### Use Factories Instead of Duplicating Data

```typescript
// Bad - data duplicated in every test
describe('UserProfile', () => {
  it('test 1', () => {
    const user = { id: 'user-1', name: 'John', email: 'john@example.com' };
  });

  it('test 2', () => {
    const user = { id: 'user-1', name: 'John', email: 'john@example.com' };
  });
});

// Good - use factory
describe('UserProfile', () => {
  it('test 1', () => {
    const user = createMockUser();
  });

  it('test 2', () => {
    const user = createMockUser();
  });
});
```

### Reset Mocks Between Tests

```typescript
describe('MyComponent', () => {
  beforeEach(() => {
    // Clear all mock calls and implementation
    jest.clearAllMocks();
  });

  // or reset specific mocks
  afterEach(() => {
    firebaseMock.db.collection.mockClear();
  });
});
```

### Mock Only What You Need

```typescript
// Bad - mock everything
jest.mock('@/services/userService');
jest.mock('@/services/sessionService');
jest.mock('@/services/projectService');

// Good - mock only what's used
jest.mock('@/services/userService');
// Keep other services real for integration testing
```

### Keep Mocks Aligned with Real Types

When you update actual types, update corresponding factories:

```typescript
// If you add a field to User type
interface User {
  id: string;
  name: string;
  email: string;
  newField: string; // NEW FIELD
}

// Update the factory
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'default-id',
  name: 'Default User',
  email: 'user@example.com',
  newField: 'default-value', // UPDATE FACTORY
  ...overrides,
});
```

## Debugging with Mocks

### Verifying Mock Calls

```typescript
// Check if mock was called
expect(firebaseMock.db.collection).toHaveBeenCalled();

// Check with specific arguments
expect(firebaseMock.db.collection).toHaveBeenCalledWith('users');

// Check call count
expect(firebaseMock.db.collection).toHaveBeenCalledTimes(1);

// Check call order (multiple mocks)
expect(mockA).toHaveBeenCalledBefore(mockB);
```

### Inspecting Mock Arguments

```typescript
// Get all calls to a mock
const calls = firebaseMock.db.collection.mock.calls;
console.log('All calls:', calls);

// Get specific call
const firstCall = firebaseMock.db.collection.mock.calls[0];
console.log('First call args:', firstCall[0]);

// Get return values
const returns = firebaseMock.db.collection.mock.results;
console.log('Return values:', returns);
```

## Common Mock Patterns

### Mocking Success and Error Cases

```typescript
it('should handle success', async () => {
  firebaseMock.db
    .collection()
    .doc()
    .get.mockResolvedValue({
      exists: true,
      data: () => ({ id: '1', name: 'Test' }),
    });

  const result = await getDocument();
  expect(result.name).toBe('Test');
});

it('should handle error', async () => {
  firebaseMock.db
    .collection()
    .doc()
    .get.mockRejectedValue(new Error('Not found'));

  await expect(getDocument()).rejects.toThrow('Not found');
});
```

### Mocking Real-Time Updates

```typescript
it('should subscribe to real-time updates', done => {
  const mockData = { id: '1', name: 'Test' };

  firebaseMock.db
    .collection('items')
    .onSnapshot.mockImplementation(callback => {
      callback({
        docs: [
          {
            id: '1',
            data: () => mockData,
          },
        ],
      });
      return jest.fn(); // Unsubscribe function
    });

  const unsubscribe = subscribeToItems(items => {
    expect(items).toContainEqual(mockData);
    unsubscribe();
    done();
  });
});
```

### Mocking Batch Operations

```typescript
it('should handle batch writes', async () => {
  const mockBatch = {
    set: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    commit: jest.fn().mockResolvedValue(null),
  };

  firebaseMock.db.batch.mockReturnValue(mockBatch);

  await performBatchWrite();

  expect(mockBatch.set).toHaveBeenCalled();
  expect(mockBatch.update).toHaveBeenCalled();
  expect(mockBatch.commit).toHaveBeenCalled();
});
```

## Testing Mock Implementations

### Verifying Mock Setup

```typescript
describe('Mock Configuration', () => {
  it('should have proper defaults', () => {
    const user = createMockUser();

    expect(user.id).toBeDefined();
    expect(user.name).toBeDefined();
    expect(user.email).toMatch(/@/);
  });

  it('should allow overrides', () => {
    const user = createMockUser({ id: 'custom-id', name: 'Custom' });

    expect(user.id).toBe('custom-id');
    expect(user.name).toBe('Custom');
  });
});
```

## Maintenance

### Keep Mocks Up to Date

- Update mocks when API/data structure changes
- Document breaking changes in mock implementations
- Add new factories for new data types
- Review mocks during code reviews

### Reviewing Mock Usage

```bash
# Find all mock imports
grep -r "createMock" src/__tests__/

# Find all firebaseMock usages
grep -r "firebaseMock" src/__tests__/

# Check mock implementations
grep -r "jest.mock" src/__tests__/
```

## Next Steps

- [Main Test Guide](../README.md) - Back to test overview
- [Unit Tests Guide](../unit/README.md) - Unit testing patterns
- [Integration Tests Guide](../integration/README.md) - Integration testing
