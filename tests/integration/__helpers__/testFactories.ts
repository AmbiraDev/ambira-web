/**
 * Test Data Factories for Integration Tests
 *
 * Provides factory functions to create realistic test data for integration testing.
 */

 
// Note: 'any' types are acceptable in test factories for flexibility with partial overrides

import { User, Session, Project, Group, Challenge, Activity } from '@/types';

let userIdCounter = 1;
let sessionIdCounter = 1;
let projectIdCounter = 1;
let groupIdCounter = 1;
let challengeIdCounter = 1;
let activityIdCounter = 1;

/**
 * Reset all ID counters (call in beforeEach)
 */
export function resetFactoryCounters(): void {
  userIdCounter = 1;
  sessionIdCounter = 1;
  projectIdCounter = 1;
  groupIdCounter = 1;
  challengeIdCounter = 1;
  activityIdCounter = 1;
}

/**
 * Create a test user
 */
export function createTestUser(overrides?: Partial<User>): User {
  const id = `user-${userIdCounter++}`;
  const username = overrides?.username || `testuser${userIdCounter}`;

  return {
    id,
    email: overrides?.email || `${username}@test.com`,
    username,
    displayName: overrides?.displayName || username,
    bio: overrides?.bio,
    photoURL: overrides?.photoURL,
    createdAt: overrides?.createdAt || new Date(),
    followerCount: overrides?.followerCount || 0,
    followingCount: overrides?.followingCount || 0,
    profileVisibility: overrides?.profileVisibility || 'everyone',
    activityVisibility: overrides?.activityVisibility || 'everyone',
    projectVisibility: overrides?.projectVisibility || 'everyone',
    ...overrides,
  };
}

/**
 * Create a test project
 */
export function createTestProject(
  userId: string,
  overrides?: Partial<Project>
): Project {
  const id = `project-${projectIdCounter++}`;

  return {
    id,
    userId,
    name: overrides?.name || `Test Project ${projectIdCounter}`,
    description: overrides?.description,
    color: overrides?.color || '#007AFF',
    icon: overrides?.icon || 'folder',
    isArchived: overrides?.isArchived || false,
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
    activities: overrides?.activities || [],
    ...overrides,
  };
}

/**
 * Create a test activity
 */
export function createTestActivity(
  projectId: string,
  overrides?: Partial<Activity>
): Activity {
  const id = `activity-${activityIdCounter++}`;

  return {
    id,
    projectId,
    name: overrides?.name || `Test Activity ${activityIdCounter}`,
    description: overrides?.description,
    color: overrides?.color,
    icon: overrides?.icon,
    isArchived: overrides?.isArchived || false,
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
    ...overrides,
  };
}

/**
 * Create a test session
 */
export function createTestSession(
  userId: string,
  projectId: string,
  activityId: string,
  overrides?: Partial<Session>
): Session {
  const id = `session-${sessionIdCounter++}`;
  const startTime = overrides?.startTime || new Date(Date.now() - 3600000); // 1 hour ago
  const duration = overrides?.duration || 3600; // 1 hour in seconds

  return {
    id,
    userId,
    projectId,
    activityId,
    title: overrides?.title || `Test Session ${sessionIdCounter}`,
    description: overrides?.description,
    duration,
    startTime,
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
    visibility: overrides?.visibility || 'everyone',
    supportCount: overrides?.supportCount || 0,
    commentCount: overrides?.commentCount || 0,
    tags: overrides?.tags || [],
    howFelt: overrides?.howFelt,
    privateNotes: overrides?.privateNotes,
    images: overrides?.images || [],
    showStartTime: overrides?.showStartTime !== false,
    publishToFeeds: overrides?.publishToFeeds !== false,
    ...overrides,
  };
}

/**
 * Create a test group
 */
export function createTestGroup(
  creatorId: string,
  overrides?: Partial<Group>
): Group {
  const id = `group-${groupIdCounter++}`;

  return {
    id,
    name: overrides?.name || `Test Group ${groupIdCounter}`,
    description: overrides?.description,
    creatorId,
    adminIds: overrides?.adminIds || [creatorId],
    memberIds: overrides?.memberIds || [creatorId],
    memberCount: overrides?.memberCount || 1,
    privacy: overrides?.privacy || 'public',
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
    imageUrl: overrides?.imageUrl,
    ...overrides,
  };
}

/**
 * Create a test challenge
 */
export function createTestChallenge(
  creatorId: string,
  overrides?: Partial<Challenge>
): Challenge {
  const id = `challenge-${challengeIdCounter++}`;
  const startDate = overrides?.startDate || new Date();
  const endDate =
    overrides?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  return {
    id,
    title: overrides?.title || `Test Challenge ${challengeIdCounter}`,
    description: overrides?.description,
    type: overrides?.type || 'most-activity',
    startDate,
    endDate,
    creatorId,
    groupId: overrides?.groupId,
    participantCount: overrides?.participantCount || 0,
    status: overrides?.status || 'active',
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
    goal: overrides?.goal,
    rules: overrides?.rules,
    ...overrides,
  };
}

/**
 * Create an active session data (for timer)
 */
export function createActiveSessionData(
  projectId: string,
  overrides?: any
): any {
  return {
    startTime: overrides?.startTime || new Date(),
    projectId,
    selectedTaskIds: overrides?.selectedTaskIds || [],
    pausedDuration: overrides?.pausedDuration || 0,
    isPaused: overrides?.isPaused || false,
    ...overrides,
  };
}

/**
 * Create a test comment
 */
export function createTestComment(
  userId: string,
  sessionId: string,
  overrides?: any
): any {
  return {
    id: `comment-${Date.now()}`,
    userId,
    sessionId,
    text: overrides?.text || 'Test comment',
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
    ...overrides,
  };
}

/**
 * Create multiple test users
 */
export function createTestUsers(count: number): User[] {
  return Array.from({ length: count }, () => createTestUser());
}

/**
 * Create multiple test sessions
 */
export function createTestSessions(
  userId: string,
  projectId: string,
  activityId: string,
  count: number
): Session[] {
  return Array.from({ length: count }, () =>
    createTestSession(userId, projectId, activityId)
  );
}

/**
 * Create a complete test user with projects, activities, and sessions
 */
export function createCompleteTestUser(): {
  user: User;
  projects: Project[];
  activities: Activity[];
  sessions: Session[];
} {
  const user = createTestUser();
  const project = createTestProject(user.id);
  const activity = createTestActivity(project.id);
  const sessions = createTestSessions(user.id, project.id, activity.id, 3);

  return {
    user,
    projects: [project],
    activities: [activity],
    sessions,
  };
}
