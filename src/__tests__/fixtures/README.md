# Fixtures Guide

Guide for managing test data and fixtures in the Ambira test suite.

## Overview

Fixtures are reusable test data used across multiple tests. They ensure consistency and reduce duplication.

## Fixture Types

### Factory Fixtures

Factory functions create test data on demand:

```typescript
// mocks.ts
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  ...overrides,
});
```

### Static Fixtures

Pre-defined constant data for unchanging scenarios:

```typescript
// fixtures.ts
export const VALID_CHALLENGE_DATA = {
  title: 'November Challenge',
  type: 'most-activity',
  goal: 100,
};

export const INVALID_CHALLENGE_DATA = {
  title: '', // Invalid: empty
  type: 'invalid', // Invalid: not enum value
};
```

## Using Fixtures

### Factory Approach (Recommended)

```typescript
import { createMockUser, createMockSession } from '@/__tests__/__mocks__/mocks';

it('should work with default data', () => {
  const user = createMockUser();
  // Uses default values
});

it('should work with custom data', () => {
  const user = createMockUser({
    name: 'Custom Name',
    email: 'custom@example.com',
  });
  // Custom + default values
});
```

### Benefits

- Data stays in sync with changes
- Easy to customize per test
- Self-documenting
- DRY principle
- Type-safe

## Common Fixtures

### User Fixtures

```typescript
// Default user
createMockUser();

// Admin user
createMockUser({ role: 'admin' });

// User with many followers
createMockUser({ followers: 100 });
```

### Session Fixtures

```typescript
// Default session
createMockSession();

// Long session (2 hours)
createMockSession({ duration: 7200 });

// Private session
createMockSession({ visibility: 'private' });
```

### Project Fixtures

```typescript
// Default project
createMockProject();

// High-hour project
createMockProject({ totalHours: 500 });
```

## Best Practices

1. **Use Factories** - Create data, don't hardcode
2. **Keep It Simple** - Default to minimal valid data
3. **Meaningful Names** - Clear what data represents
4. **Update with Types** - Keep fixtures aligned with actual types
5. **Document Purpose** - Comment why specific data is used

## Next Steps

- [Main Test Guide](../README.md) - Back to overview
- [Mocks Guide](../__mocks__/README.md) - Using shared mocks
