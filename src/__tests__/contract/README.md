# Contract Tests

Contract tests validate API interfaces, data structures, and system contracts to ensure consistency and backward compatibility.

## What to Test

### API Contracts
- Method signatures
- Parameter types and validation
- Return value shapes
- Error handling patterns
- Required vs optional fields

### Data Models
- Type definitions
- Field constraints
- Business rules
- Validation logic

### System Boundaries
- Inter-service communication
- Event structures
- Message formats
- Protocol compliance

## Contract Test Structure

Contract tests follow the pattern: `service-name.contract.test.ts`

### Current Contracts

#### api/notifications.contract.test.ts
Tests for the notification system API:
- Notification type definitions
- Data structure validation
- API method availability
- Challenge notification helpers
- Milestone calculation logic
- Rank change logic

#### api/challenges.contract.test.ts
Tests for the challenges API (if present)

## Testing Patterns

### Validating API Method Signatures
```typescript
import { firebaseNotificationApi } from '@/lib/firebaseApi'

describe('API Contract - Notifications', () => {
  test('should have all required API methods', () => {
    expect(typeof firebaseNotificationApi.createNotification).toBe('function')
    expect(typeof firebaseNotificationApi.getUserNotifications).toBe('function')
    expect(typeof firebaseNotificationApi.markAsRead).toBe('function')
    expect(typeof firebaseNotificationApi.markAllAsRead).toBe('function')
    expect(typeof firebaseNotificationApi.deleteNotification).toBe('function')
    expect(typeof firebaseNotificationApi.getUnreadCount).toBe('function')
  })
})
```

### Validating Data Structures
```typescript
import { Notification } from '@/types'

describe('Data Contract - Notification', () => {
  test('should have valid notification structure', () => {
    const notification: Notification = {
      id: 'test-id',
      userId: 'test-user',
      type: 'challenge',
      title: 'Test Notification',
      message: 'This is a test',
      challengeId: 'challenge-123',
      isRead: false,
      createdAt: new Date()
    }

    expect(notification.type).toBe('challenge')
    expect(notification.challengeId).toBe('challenge-123')
    expect(notification.isRead).toBe(false)
  })

  test('should support all notification types', () => {
    const validTypes = [
      'follow',
      'session_support',
      'comment',
      'mention',
      'group_invite',
      'group_join',
      'challenge_completed',
      'challenge_joined',
      'challenge_ending',
      'challenge_created',
      'challenge_rank_changed',
      'challenge_milestone'
    ]

    validTypes.forEach(type => {
      const notification: Partial<Notification> = {
        type: type as any
      }
      expect(notification.type).toBe(type)
    })
  })
})
```

### Validating Business Logic
```typescript
describe('Business Logic Contract - Milestones', () => {
  test('should calculate milestones correctly', () => {
    const testCases = [
      { progress: 25, goal: 100, expectedMilestone: 25 },
      { progress: 50, goal: 100, expectedMilestone: 50 },
      { progress: 75, goal: 100, expectedMilestone: 75 },
      { progress: 90, goal: 100, expectedMilestone: 90 }
    ]

    testCases.forEach(({ progress, goal, expectedMilestone }) => {
      const percentage = (progress / goal) * 100
      const milestones = [25, 50, 75, 90]

      let reachedMilestone = null
      for (const milestone of milestones) {
        if (percentage >= milestone && percentage < milestone + 5) {
          reachedMilestone = milestone
          break
        }
      }

      expect(reachedMilestone).toBe(expectedMilestone)
    })
  })
})
```

### Validating Helper Functions
```typescript
import { challengeNotifications } from '@/lib/firebaseApi'

describe('Helper Contract - Challenge Notifications', () => {
  test('should have all challenge notification methods', () => {
    expect(typeof challengeNotifications.notifyCompletion).toBe('function')
    expect(typeof challengeNotifications.notifyParticipantJoined).toBe('function')
    expect(typeof challengeNotifications.notifyEndingSoon).toBe('function')
    expect(typeof challengeNotifications.notifyNewChallenge).toBe('function')
    expect(typeof challengeNotifications.notifyRankChange).toBe('function')
    expect(typeof challengeNotifications.notifyMilestone).toBe('function')
  })
})
```

## When to Write Contract Tests

### 1. New API Methods
When adding new methods to an API:
```typescript
describe('New API Method Contract', () => {
  test('should have getUserStats method', () => {
    expect(typeof userApi.getUserStats).toBe('function')
  })

  test('should return stats with correct shape', async () => {
    const stats = await userApi.getUserStats('user-123')

    expect(stats).toHaveProperty('totalSessions')
    expect(stats).toHaveProperty('totalHours')
    expect(stats).toHaveProperty('longestStreak')
    expect(typeof stats.totalSessions).toBe('number')
  })
})
```

### 2. Type Changes
When modifying data types:
```typescript
describe('Updated Type Contract', () => {
  test('Session should include new visibility field', () => {
    const session: Session = {
      id: 'session-1',
      userId: 'user-1',
      // ... other fields
      visibility: 'everyone' // New field
    }

    expect(['everyone', 'followers', 'private'])
      .toContain(session.visibility)
  })
})
```

### 3. Business Rule Changes
When business logic changes:
```typescript
describe('Updated Business Rule - Rank Changes', () => {
  test('should notify on 3+ position improvement', () => {
    const testCases = [
      { previous: 10, current: 7, shouldNotify: true },  // 3 positions
      { previous: 10, current: 8, shouldNotify: false }, // 2 positions
      { previous: 8, current: 1, shouldNotify: true }    // 7 positions
    ]

    testCases.forEach(({ previous, current, shouldNotify }) => {
      const improvement = previous - current
      expect(improvement >= 3).toBe(shouldNotify)
    })
  })
})
```

## Best Practices

### 1. Document Expected Behavior
```typescript
/**
 * Contract: Notification API
 *
 * The notification API must:
 * - Support all notification types defined in the Notification type
 * - Return notifications in descending createdAt order
 * - Include unread count with getUserNotifications
 * - Support batch operations for markAllAsRead
 */
describe('Notification API Contract', () => {
  // Tests here
})
```

### 2. Version Your Contracts
```typescript
describe('Notification API Contract - v2', () => {
  test('should support new mention type', () => {
    const notification: Notification = {
      type: 'mention', // New in v2
      // ... other fields
    }

    expect(notification.type).toBe('mention')
  })
})
```

### 3. Test Edge Cases
```typescript
describe('Edge Cases - Milestone Calculation', () => {
  test('should handle progress exceeding goal', () => {
    const progress = 120
    const goal = 100

    const percentage = Math.min((progress / goal) * 100, 100)
    expect(percentage).toBe(100)
  })

  test('should handle zero goal', () => {
    const progress = 50
    const goal = 0

    // Should not divide by zero
    const percentage = goal === 0 ? 0 : (progress / goal) * 100
    expect(percentage).toBe(0)
  })
})
```

### 4. Validate Required Fields
```typescript
describe('Required Fields Contract', () => {
  test('should require userId in Notification', () => {
    const createNotification = (data: Partial<Notification>) => {
      if (!data.userId) {
        throw new Error('userId is required')
      }
      return data as Notification
    }

    expect(() => createNotification({})).toThrow('userId is required')
    expect(() => createNotification({ userId: 'user-1' })).not.toThrow()
  })
})
```

## Contract Test Categories

### Type Contracts
Validate TypeScript type definitions match runtime behavior

### API Contracts
Validate method signatures and return values

### Data Contracts
Validate data structures and field constraints

### Business Logic Contracts
Validate business rules and calculations

### Event Contracts
Validate event structures and message formats

## Running Contract Tests

```bash
# Run all contract tests
npm test -- contract/

# Run specific contract
npm test -- contract/api/notifications.contract.test.ts

# Watch mode
npm test -- --watch contract/

# Verbose output
npm test -- --verbose contract/
```

## Migration Notes

Previously, contract-style tests were named with `-manual.test.ts` suffix and located in:
- `src/__tests__/notifications-manual.test.ts`
- `src/__tests__/challenges-manual.test.ts`

They have been renamed and relocated to:
- `src/__tests__/contract/api/notifications.contract.test.ts`
- `src/__tests__/contract/api/challenges.contract.test.ts`

The `.contract.test.ts` naming convention makes their purpose clearer.

## When NOT to Use Contract Tests

Contract tests are not for:
- Testing implementation details (use unit tests)
- Testing user workflows (use integration tests)
- Testing UI rendering (use unit/integration tests)
- Performance testing (use dedicated performance tests)

Use contract tests specifically for validating interfaces, types, and system boundaries.

## Example: Adding a New Contract

When adding a new API module:

1. Create the contract test file:
```bash
touch src/__tests__/contract/api/groups.contract.test.ts
```

2. Write the contract:
```typescript
import { groupsApi } from '@/lib/firebaseApi'
import { Group } from '@/types'

describe('API Contract - Groups', () => {
  test('should have CRUD operations', () => {
    expect(typeof groupsApi.createGroup).toBe('function')
    expect(typeof groupsApi.getGroup).toBe('function')
    expect(typeof groupsApi.updateGroup).toBe('function')
    expect(typeof groupsApi.deleteGroup).toBe('function')
  })

  test('should validate group data structure', () => {
    const group: Group = {
      id: 'group-1',
      name: 'Test Group',
      description: 'A test group',
      privacy: 'public',
      createdAt: new Date()
    }

    expect(['public', 'approval-required']).toContain(group.privacy)
  })
})
```

3. Run the tests:
```bash
npm test -- groups.contract.test.ts
```
