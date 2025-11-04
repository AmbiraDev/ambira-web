/**
 * Notification Factory
 * Creates mock notification objects for testing
 */

import type { Notification } from '@/types';

let notificationIdCounter = 1;

/**
 * Reset the notification ID counter
 * Call this in beforeEach to ensure consistent IDs across tests
 */
export function resetNotificationFactory(): void {
  notificationIdCounter = 1;
}

/**
 * Create a mock notification with default values
 * All fields can be overridden via the overrides parameter
 */
export function createMockNotification(
  overrides: Partial<Notification> = {}
): Notification {
  const id = `notification-${notificationIdCounter}`;
  notificationIdCounter += 1;

  return {
    id,
    userId: 'user-1',
    type: 'follow',
    title: 'New Follower',
    message: 'Someone followed you',
    isRead: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

/**
 * Create a batch of mock notifications
 */
export function createMockNotificationBatch(
  count: number,
  overrides: Partial<Notification> = {}
): Notification[] {
  return Array.from({ length: count }, (_, i) =>
    createMockNotification({
      ...overrides,
      message: `Notification ${i + 1}`,
      createdAt: new Date(`2024-01-01T00:${i.toString().padStart(2, '0')}:00Z`),
    })
  );
}

/**
 * Create a mock unread notification
 */
export function createMockUnreadNotification(
  overrides: Partial<Notification> = {}
): Notification {
  return createMockNotification({
    isRead: false,
    ...overrides,
  });
}

/**
 * Create a mock read notification
 */
export function createMockReadNotification(
  overrides: Partial<Notification> = {}
): Notification {
  return createMockNotification({
    isRead: true,
    ...overrides,
  });
}

/**
 * Create a mock follow notification
 */
export function createMockFollowNotification(
  overrides: Partial<Notification> = {}
): Notification {
  return createMockNotification({
    type: 'follow',
    title: 'New Follower',
    message: 'Alex followed you',
    actorId: 'user-alex',
    actorName: 'Alex',
    actorUsername: 'alex',
    actorProfilePicture: 'https://example.com/alex.jpg',
    linkUrl: '/profile/alex',
    ...overrides,
  });
}

/**
 * Create a mock support notification
 */
export function createMockSupportNotification(
  overrides: Partial<Notification> = {}
): Notification {
  return createMockNotification({
    type: 'support',
    title: 'New Support',
    message: 'Sam supported your session',
    actorId: 'user-sam',
    actorName: 'Sam',
    actorUsername: 'sam',
    sessionId: 'session-123',
    linkUrl: '/sessions/session-123',
    ...overrides,
  });
}

/**
 * Create a mock comment notification
 */
export function createMockCommentNotification(
  overrides: Partial<Notification> = {}
): Notification {
  return createMockNotification({
    type: 'comment',
    title: 'New Comment',
    message: 'Jordan commented on your session',
    actorId: 'user-jordan',
    actorName: 'Jordan',
    actorUsername: 'jordan',
    sessionId: 'session-123',
    commentId: 'comment-456',
    linkUrl: '/sessions/session-123#comment-456',
    ...overrides,
  });
}

/**
 * Create a mock challenge notification
 */
export function createMockChallengeNotification(
  overrides: Partial<Notification> = {}
): Notification {
  return createMockNotification({
    type: 'challenge',
    title: '🏆 Challenge Completed!',
    message: 'You completed the "30 Day Streak" challenge',
    challengeId: 'challenge-789',
    linkUrl: '/challenges/challenge-789',
    ...overrides,
  });
}

/**
 * Create a mock group notification
 */
export function createMockGroupNotification(
  overrides: Partial<Notification> = {}
): Notification {
  return createMockNotification({
    type: 'group',
    title: 'New Group Member',
    message: 'Taylor joined your group',
    actorId: 'user-taylor',
    actorName: 'Taylor',
    actorUsername: 'taylor',
    groupId: 'group-101',
    linkUrl: '/groups/group-101',
    ...overrides,
  });
}
