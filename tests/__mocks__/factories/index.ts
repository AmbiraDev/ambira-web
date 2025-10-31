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

// Reset all factories
export function resetAllFactories() {
  resetSessionFactory();
  resetUserFactory();
  resetActiveSessionFactory();
  resetActivityFactory();
  resetGroupFactory();
  resetChallengeFactory();
  resetCommentFactory();
}
