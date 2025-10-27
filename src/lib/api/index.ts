/**
 * Firebase API - Main Export File
 *
 * This file provides backward compatibility while the codebase migrates
 * from the monolithic firebaseApi.ts to modular domain-specific files.
 *
 * MIGRATION STATUS:
 * ✅ ALL MODULES EXTRACTED!
 *
 * USAGE:
 * - Old (still works): import { firebaseAuthApi } from '@/lib/api'
 * - New (preferred): import { firebaseAuthApi } from '@/lib/api/auth'
 */

// ============================================================================
// EXTRACTED MODULES (✅ Complete)
// ============================================================================

// Auth Module
export { firebaseAuthApi } from './auth';

// User Module
export { firebaseUserApi } from './users';

// Projects Module
export { firebaseProjectApi } from './projects';

// Sessions Module
export { firebaseSessionApi } from './sessions';
export { populateSessionsWithDetails } from './sessions/helpers';

// Posts Module (Legacy - sessions ARE posts)
export { firebasePostApi } from './sessions/posts';

// Social Modules
export {
  updateSocialGraph,
  fetchUserDataForSocialContext,
  buildCommentUserDetails,
} from './social/helpers';
export { firebaseCommentApi } from './social/comments';

// Challenges Module
export { firebaseChallengeApi } from './challenges';

// Streaks Module
export { firebaseStreakApi } from './streaks';

// Achievements Module
export { firebaseAchievementApi, ACHIEVEMENT_DEFINITIONS } from './achievements';

// Notifications Module
export { firebaseNotificationApi, challengeNotifications } from './notifications';

// Groups Module
export { firebaseGroupApi } from './groups';

// Shared Utilities
export {
  convertTimestamp,
  convertToTimestamp,
  removeUndefinedFields,
  getErrorMessage, // Legacy - deprecated
  PRIVATE_USER_FALLBACK_NAME,
  PRIVATE_USER_USERNAME_PREFIX,
} from './shared/utils';

// ============================================================================
// ACTIVITY API (Alias for Projects)
// ============================================================================

import { firebaseProjectApi } from './projects';
export const firebaseActivityApi = firebaseProjectApi;

// ============================================================================
// LEGACY COMBINED API OBJECT
// ============================================================================

import { firebaseAuthApi } from './auth';
import { firebaseUserApi } from './users';
import { firebaseSessionApi } from './sessions';
import { firebasePostApi } from './sessions/posts';
import { firebaseCommentApi } from './social/comments';
import { firebaseChallengeApi } from './challenges';
import { firebaseStreakApi } from './streaks';
import { firebaseAchievementApi } from './achievements';
import { firebaseNotificationApi, challengeNotifications } from './notifications';
import { firebaseGroupApi } from './groups';

/**
 * Combined API object for backward compatibility
 * @deprecated Use individual module imports instead
 *
 * Instead of:
 *   firebaseApi.auth.login()
 *
 * Use:
 *   import { firebaseAuthApi } from '@/lib/api/auth'
 *   firebaseAuthApi.login()
 */
export const firebaseApi = {
  auth: firebaseAuthApi,
  user: firebaseUserApi,
  project: firebaseProjectApi,
  activity: firebaseActivityApi,
  session: firebaseSessionApi,
  post: firebasePostApi,
  comment: firebaseCommentApi,
  challenge: firebaseChallengeApi,
  streak: firebaseStreakApi,
  achievement: firebaseAchievementApi,
  notification: firebaseNotificationApi,
  group: firebaseGroupApi,
  challengeNotifications,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Re-export types from @/types for convenience
export type {
  // Auth types
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
  AuthUser,

  // User types
  User,
  UserProfile,
  UserStats,
  ActivityData,
  WeeklyActivity,
  ProjectBreakdown,
  PrivacySettings,
  UserSearchResult,
  SuggestedUser,

  // Project types
  Project,
  Activity,
  CreateProjectData,
  UpdateProjectData,
  ProjectStats,

  // Session types
  Session,
  SessionWithDetails,
  CreateSessionData,
  SessionFormData,
  SessionFilters,
  SessionSort,
  SessionListResponse,

  // Post types (legacy)
  Post,
  PostWithDetails,
  CreatePostData,
  UpdatePostData,
  PostSupport,
  FeedResponse,
  FeedFilters,

  // Comment types
  Comment,
  CommentWithDetails,
  CreateCommentData,
  UpdateCommentData,
  CommentLike,
  CommentsResponse,

  // Social types
  Notification,
  Group,
  CreateGroupData,
  UpdateGroupData,
  GroupFilters,
  GroupMembership,
  GroupStats,
  GroupLeaderboard,
  GroupLeaderboardEntry,

  // Challenge types
  Challenge,
  CreateChallengeData,
  UpdateChallengeData,
  ChallengeFilters,
  ChallengeParticipant,
  ChallengeProgress,
  ChallengeLeaderboard,
  ChallengeLeaderboardEntry,
  ChallengeStats,
} from '@/types';
