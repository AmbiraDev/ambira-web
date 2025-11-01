# Contract Tests Guide

Guide for writing contract tests that validate API responses and data structures.

## Overview

Contract tests verify that APIs and services return data with the correct structure and types. They catch breaking changes before they cause runtime errors in consuming code.

### Benefits

- **Detect Breaking Changes Early** - Catch API changes before deploying
- **Document Expected Shapes** - Tests serve as data structure documentation
- **Type Safety** - Ensure returned data matches TypeScript interfaces
- **Integration Confidence** - Verify that backend and frontend contracts align

## When to Write Contract Tests

Write contract tests for:

- HTTP API endpoints (REST, GraphQL)
- Firebase Firestore documents
- Third-party API integrations
- Data transformation pipelines
- Service response validation

## Test Structure

```
contract/
├── README.md                      # This file
└── api/                           # API contract tests
    ├── challenges.contract.test.ts
    └── notifications.contract.test.ts
```

## API Contract Tests

### Basic API Contract Test

```typescript
import { getChallenges } from '@/services/challengeService';

describe('Challenges API Contract', () => {
  it('should return challenges with correct structure', async () => {
    const response = await getChallenges();

    expect(Array.isArray(response)).toBe(true);

    response.forEach(challenge => {
      // Verify required fields exist
      expect(challenge).toHaveProperty('id');
      expect(challenge).toHaveProperty('title');
      expect(challenge).toHaveProperty('type');
      expect(challenge).toHaveProperty('startDate');
      expect(challenge).toHaveProperty('endDate');
      expect(challenge).toHaveProperty('participants');

      // Verify types
      expect(typeof challenge.id).toBe('string');
      expect(typeof challenge.title).toBe('string');
      expect(typeof challenge.startDate).toBe('string');
      expect(Array.isArray(challenge.participants)).toBe(true);
    });
  });
});
```

### Contract with Enum Validation

```typescript
import { ChallengeType } from '@/types/challenge';
import { getChallenges } from '@/services/challengeService';

describe('Challenges API Contract - Types', () => {
  it('should return valid challenge types', async () => {
    const validTypes: ChallengeType[] = [
      'most-activity',
      'fastest-effort',
      'longest-session',
      'group-goal',
    ];

    const response = await getChallenges();

    response.forEach(challenge => {
      expect(validTypes).toContain(challenge.type);
    });
  });

  it('should never return invalid types', async () => {
    const response = await getChallenges();

    response.forEach(challenge => {
      expect(challenge.type).not.toBe('invalid-type');
      expect(challenge.type).not.toBe('');
      expect(challenge.type).not.toBeNull();
    });
  });
});
```

### Contract with Nested Objects

```typescript
describe('Challenge Detail API Contract', () => {
  it('should return challenge with nested participants', async () => {
    const challengeId = 'challenge-1';
    const challenge = await getChallenge(challengeId);

    // Verify nested structure
    expect(challenge.participants).toBeDefined();
    expect(Array.isArray(challenge.participants)).toBe(true);

    challenge.participants.forEach(participant => {
      expect(participant).toHaveProperty('id');
      expect(participant).toHaveProperty('userId');
      expect(participant).toHaveProperty('progress');
      expect(participant).toHaveProperty('completed');

      expect(typeof participant.id).toBe('string');
      expect(typeof participant.userId).toBe('string');
      expect(typeof participant.progress).toBe('number');
      expect(typeof participant.completed).toBe('boolean');

      // Validate number ranges
      expect(participant.progress).toBeGreaterThanOrEqual(0);
      expect(participant.progress).toBeLessThanOrEqual(100);
    });
  });
});
```

### Contract for Paginated Responses

```typescript
describe('Sessions List API Contract - Pagination', () => {
  it('should return paginated sessions with metadata', async () => {
    const response = await getSessions({ page: 1, limit: 20 });

    // Verify pagination structure
    expect(response).toHaveProperty('items');
    expect(response).toHaveProperty('page');
    expect(response).toHaveProperty('limit');
    expect(response).toHaveProperty('total');
    expect(response).toHaveProperty('hasMore');

    // Verify types
    expect(Array.isArray(response.items)).toBe(true);
    expect(typeof response.page).toBe('number');
    expect(typeof response.limit).toBe('number');
    expect(typeof response.total).toBe('number');
    expect(typeof response.hasMore).toBe('boolean');

    // Verify data consistency
    expect(response.items.length).toBeLessThanOrEqual(response.limit);

    if (response.page * response.limit < response.total) {
      expect(response.hasMore).toBe(true);
    } else {
      expect(response.hasMore).toBe(false);
    }
  });
});
```

### Contract for Timestamps

```typescript
describe('Session API Contract - Date Handling', () => {
  it('should return valid ISO 8601 timestamps', async () => {
    const sessions = await getSessions();

    sessions.forEach(session => {
      // Validate ISO 8601 format
      expect(session.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // Should be parseable as Date
      const date = new Date(session.createdAt);
      expect(date.getTime()).not.toBeNaN();

      // Should be in the past (or very recent)
      expect(new Date(session.createdAt).getTime()).toBeLessThanOrEqual(
        Date.now()
      );
    });
  });

  it('should have consistent timestamp ordering', async () => {
    const sessions = await getSessions();

    for (let i = 1; i < sessions.length; i++) {
      const prevTime = new Date(sessions[i - 1].createdAt).getTime();
      const currTime = new Date(sessions[i].createdAt).getTime();

      // Should be in descending order (newest first)
      expect(prevTime).toBeGreaterThanOrEqual(currTime);
    }
  });
});
```

## Firestore Contract Tests

### Firestore Document Contract

```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types/user';

describe('Firestore Users Contract', () => {
  it('should return user documents with correct structure', async () => {
    const userId = 'test-user-id';
    const userDoc = await getDoc(doc(db, 'users', userId));

    expect(userDoc.exists()).toBe(true);

    const userData = userDoc.data() as User;

    // Verify required fields
    expect(userData).toHaveProperty('id');
    expect(userData).toHaveProperty('email');
    expect(userData).toHaveProperty('name');
    expect(userData).toHaveProperty('createdAt');
    expect(userData).toHaveProperty('followers');
    expect(userData).toHaveProperty('following');

    // Verify types
    expect(typeof userData.id).toBe('string');
    expect(typeof userData.email).toBe('string');
    expect(typeof userData.name).toBe('string');
    expect(userData.createdAt instanceof Timestamp).toBe(true);
    expect(typeof userData.followers).toBe('number');
    expect(typeof userData.following).toBe('number');

    // Verify constraints
    expect(userData.followers).toBeGreaterThanOrEqual(0);
    expect(userData.following).toBeGreaterThanOrEqual(0);
  });
});
```

### Firestore Collection Contract

```typescript
describe('Firestore Sessions Collection Contract', () => {
  it('should return session documents with valid structure', async () => {
    const sessionsRef = collection(db, 'sessions');
    const sessionsSnapshot = await getDocs(query(sessionsRef, limit(10)));

    expect(sessionsSnapshot.docs.length).toBeGreaterThan(0);

    sessionsSnapshot.docs.forEach(doc => {
      const session = doc.data();

      // Verify required fields
      expect(session).toHaveProperty('userId');
      expect(session).toHaveProperty('projectId');
      expect(session).toHaveProperty('duration');
      expect(session).toHaveProperty('visibility');

      // Verify types
      expect(typeof session.userId).toBe('string');
      expect(typeof session.projectId).toBe('string');
      expect(typeof session.duration).toBe('number');
      expect(['everyone', 'followers', 'private']).toContain(
        session.visibility
      );

      // Verify constraints
      expect(session.duration).toBeGreaterThan(0);
      expect(session.duration).toBeLessThanOrEqual(86400); // 24 hours max
    });
  });
});
```

## Validation Schemas

### Using Zod for Contract Validation

```typescript
import { z } from 'zod';

// Define the contract schema
const ChallengeSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  type: z.enum([
    'most-activity',
    'fastest-effort',
    'longest-session',
    'group-goal',
  ]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  goal: z.number().positive(),
  participants: z.array(
    z.object({
      id: z.string(),
      userId: z.string(),
      progress: z.number().min(0).max(100),
      completed: z.boolean(),
    })
  ),
});

describe('Challenges API Contract with Zod', () => {
  it('should validate challenge response', async () => {
    const response = await getChallenges();

    // Parse and validate
    const parsed = z.array(ChallengeSchema).safeParse(response);

    expect(parsed.success).toBe(true);

    if (parsed.success) {
      const challenges = parsed.data;
      expect(challenges.length).toBeGreaterThan(0);

      challenges.forEach(challenge => {
        expect(challenge.title.length).toBeLessThanOrEqual(100);
        expect(new Date(challenge.startDate)).toBeInstanceOf(Date);
      });
    }
  });

  it('should reject invalid challenge data', async () => {
    const invalidChallenge = {
      id: 'not-a-uuid',
      title: '',
      type: 'invalid-type',
      startDate: 'not-a-date',
    };

    const result = ChallengeSchema.safeParse(invalidChallenge);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});
```

## Response Status Code Contracts

```typescript
describe('API Response Status Contracts', () => {
  it('should return 200 for successful requests', async () => {
    const response = await fetch('/api/challenges');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('should return 404 for not found', async () => {
    const response = await fetch('/api/challenges/nonexistent-id');

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });

  it('should return 400 for invalid input', async () => {
    const response = await fetch('/api/challenges', {
      method: 'POST',
      body: JSON.stringify({ title: '' }), // Invalid: empty title
    });

    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('errors');
    expect(Array.isArray(body.errors)).toBe(true);
  });

  it('should return 401 for unauthenticated requests', async () => {
    const response = await fetch('/api/profile', {
      headers: {
        // No auth header
      },
    });

    expect(response.status).toBe(401);
  });

  it('should return 500 for server errors', async () => {
    const response = await fetch('/api/challenges/error-test');

    if (response.status === 500) {
      const body = await response.json();
      expect(body).toHaveProperty('error');
    }
  });
});
```

## Error Response Contracts

```typescript
describe('Error Response Contract', () => {
  it('should return consistent error format', async () => {
    const response = await fetch('/api/challenges/invalid-id');

    expect(response.status).toBe(404);

    const error = await response.json();

    // Verify error structure
    expect(error).toHaveProperty('error');
    expect(error).toHaveProperty('message');
    expect(error).toHaveProperty('timestamp');

    expect(typeof error.error).toBe('string');
    expect(typeof error.message).toBe('string');

    // Should be ISO timestamp
    expect(new Date(error.timestamp)).toBeInstanceOf(Date);
  });

  it('should return validation error format', async () => {
    const response = await fetch('/api/challenges', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);

    const error = await response.json();

    // Verify validation error structure
    expect(error).toHaveProperty('errors');
    expect(Array.isArray(error.errors)).toBe(true);

    error.errors.forEach(validationError => {
      expect(validationError).toHaveProperty('field');
      expect(validationError).toHaveProperty('message');
    });
  });
});
```

## Testing Breaking Changes

```typescript
describe('Contract Regression Tests', () => {
  it('should not remove required fields', async () => {
    const challenge = await getChallenge('challenge-1');

    // These fields must always exist
    const requiredFields = ['id', 'title', 'type', 'startDate', 'endDate'];

    requiredFields.forEach(field => {
      expect(challenge).toHaveProperty(field);
      expect(challenge[field]).not.toBeUndefined();
      expect(challenge[field]).not.toBeNull();
    });
  });

  it('should not change field types', async () => {
    const challenge = await getChallenge('challenge-1');

    // Type must stay consistent
    expect(typeof challenge.title).toBe('string');
    expect(typeof challenge.goal).toBe('number');
    expect(Array.isArray(challenge.participants)).toBe(true);
  });

  it('should maintain backwards compatibility', async () => {
    const challenge = await getChallenge('challenge-1');

    // Old consumers should still work
    expect(challenge.id).toBeDefined(); // Old code expects this
    expect(challenge.title).toBeDefined(); // Old code expects this
  });
});
```

## Best Practices

### 1. Test Required vs Optional Fields

```typescript
// Good - distinguishes required from optional
describe('User API Contract', () => {
  it('should have all required fields', async () => {
    const user = await getUser('user-1');

    // Required
    expect(user.id).toBeDefined();
    expect(user.email).toBeDefined();

    // Optional (may be null)
    expect(user.bio).toBeDefined(); // exists (might be empty)
  });
});
```

### 2. Test Constraints and Boundaries

```typescript
// Good - tests real constraints
describe('Session Duration Contract', () => {
  it('should have valid duration', async () => {
    const session = await getSession('session-1');

    expect(session.duration).toBeGreaterThan(0);
    expect(session.duration).toBeLessThanOrEqual(86400); // 24 hours max
  });
});
```

### 3. Keep Contracts in Sync with Types

```typescript
// Keep these in sync!
interface Challenge {
  id: string;
  title: string;
  type: ChallengeType;
}

// ✅ Test reflects interface
describe('Challenge Contract', () => {
  it('should match interface', async () => {
    const challenge: Challenge = await getChallenge('id');

    expect(challenge).toHaveProperty('id');
    expect(challenge).toHaveProperty('title');
    expect(challenge).toHaveProperty('type');
  });
});
```

### 4. Document Why Constraints Exist

```typescript
// Bad - no context
it('should have positive duration', async () => {
  expect(session.duration).toBeGreaterThan(0);
});

// Good - explains the constraint
it('should have positive duration', async () => {
  // Sessions must have at least 1 second duration
  // 0-second sessions indicate data entry errors
  const session = await getSession('session-1');
  expect(session.duration).toBeGreaterThan(0);
});
```

## Debugging Contract Tests

### Print Response Structure

```typescript
it('should debug response', async () => {
  const response = await getChallenges();

  // See actual structure
  console.log(JSON.stringify(response, null, 2));

  // See first item in detail
  console.log('First challenge:', response[0]);
});
```

### Validate with Tools

```bash
# Use jq to inspect JSON responses
curl https://api.example.com/challenges | jq '.[0]'

# Pretty print with Python
curl https://api.example.com/challenges | python -m json.tool
```

## Next Steps

- [Main Test Guide](../README.md) - Back to overview
- [Integration Tests Guide](../integration/README.md) - Multi-component testing
- [Unit Tests Guide](../unit/README.md) - Individual component testing
