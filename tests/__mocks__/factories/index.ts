/**
 * Factory Index
 * Central export for all test data factories
 */

// Session factories
export {
  createMockSession,
  createMockSessionWithUser,
  createMockSessionBatch,
  createMockSessionUser,
  createMockSessionActivity,
  resetSessionFactory,
} from './sessionFactory';

// User factories
export {
  createMockUser,
  createMockUserBatch,
  createMockUserWithFollowers,
  createMockPrivateUser,
  createMockFollowersOnlyUser,
  resetUserFactory,
} from './userFactory';

// Active session factories
export {
  createMockActiveSession,
  createMockRunningSession,
  createMockPausedSession,
  createMockOldSession,
  createMockSessionBatch as createMockActiveSessionBatch,
  resetActiveSessionFactory,
} from './activeSessionFactory';

// Activity/Project factories
export {
  createMockActivity,
  createMockProject,
  createMockActivityBatch,
  resetActivityFactory,
} from './activityFactory';

// Group factories
export {
  createMockGroup,
  createMockGroupMembership,
  createMockGroupBatch,
  resetGroupFactory,
} from './groupFactory';

// Challenge factories
export {
  createMockChallenge,
  createMockChallengeParticipant,
  createMockChallengeBatch,
  resetChallengeFactory,
} from './challengeFactory';

// Comment factories
export {
  createMockComment,
  createMockCommentWithDetails,
  createMockCommentBatch,
  resetCommentFactory,
} from './commentFactory';

// Notification factories
export {
  createMockNotification,
  createMockNotificationBatch,
  createMockUnreadNotification,
  createMockReadNotification,
  createMockFollowNotification,
  createMockSupportNotification,
  createMockCommentNotification,
  createMockChallengeNotification,
  createMockGroupNotification,
  resetNotificationFactory,
} from './notificationFactory';

// Import reset functions for use in resetAllFactories
import { resetSessionFactory } from './sessionFactory';
import { resetUserFactory } from './userFactory';
import { resetActiveSessionFactory } from './activeSessionFactory';
import { resetActivityFactory } from './activityFactory';
import { resetGroupFactory } from './groupFactory';
import { resetChallengeFactory as resetChallenge } from './challengeFactory';
import { resetCommentFactory as resetComment } from './commentFactory';
import { resetNotificationFactory } from './notificationFactory';

// Reset all factories
export function resetAllFactories() {
  resetSessionFactory();
  resetUserFactory();
  resetActiveSessionFactory();
  resetActivityFactory();
  resetGroupFactory();
  resetChallenge();
  resetComment();
  resetNotificationFactory();
}
