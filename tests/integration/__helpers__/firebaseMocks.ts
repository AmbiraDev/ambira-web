/**
 * Firebase Mocks for Integration Tests
 *
 * Provides in-memory implementations of Firebase services for integration testing.
 * These mocks maintain state across operations within a test to verify workflows.
 */

// Note: 'any' types are acceptable in test mocks to maintain flexibility
// and avoid overly complex type definitions for test data structures

import { User, Session, Project, Group, Challenge } from '@/types';

// Counter for unique project IDs
let mockProjectCounter = 0;

export function resetMockProjectCounter() {
  mockProjectCounter = 0;
}

/**
 * In-memory Firebase store for integration tests
 */
export class InMemoryFirebaseStore {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private projects: Map<string, Project> = new Map();
  private groups: Map<string, Group> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  private activeSessions: Map<string, any> = new Map();
  private follows: Map<string, { followerId: string; followingId: string }> =
    new Map();
  private supports: Map<string, { sessionId: string; userId: string }> =
    new Map();
  private comments: Map<string, any[]> = new Map();

  // User operations
  createUser(user: User): void {
    this.users.set(user.id, user);
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  updateUser(userId: string, updates: Partial<User>): void {
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, { ...user, ...updates });
    }
  }

  deleteUser(userId: string): void {
    this.users.delete(userId);
  }

  // Session operations
  createSession(session: Session): void {
    this.sessions.set(session.id, session);
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getSessions(filters?: { userId?: string; visibility?: string }): Session[] {
    let sessions = Array.from(this.sessions.values());

    if (filters?.userId) {
      sessions = sessions.filter(s => s.userId === filters.userId);
    }

    if (filters?.visibility) {
      sessions = sessions.filter(s => s.visibility === filters.visibility);
    }

    return sessions.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  updateSession(sessionId: string, updates: Partial<Session>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.set(sessionId, { ...session, ...updates });
    }
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // Active session operations (for timer)
  saveActiveSession(userId: string, sessionData: any): void {
    this.activeSessions.set(userId, sessionData);
  }

  getActiveSession(userId: string): any | undefined {
    return this.activeSessions.get(userId);
  }

  clearActiveSession(userId: string): void {
    this.activeSessions.delete(userId);
  }

  // Project operations
  createProject(project: Project): void {
    this.projects.set(project.id, project);
  }

  getProject(projectId: string): Project | undefined {
    return this.projects.get(projectId);
  }

  getProjects(userId: string): Project[] {
    return Array.from(this.projects.values()).filter(p => p.userId === userId);
  }

  updateProject(projectId: string, updates: Partial<Project>): void {
    const project = this.projects.get(projectId);
    if (project) {
      this.projects.set(projectId, { ...project, ...updates });
    }
  }

  deleteProject(projectId: string): void {
    this.projects.delete(projectId);
  }

  // Follow operations
  createFollow(followerId: string, followingId: string): void {
    const followId = `${followerId}_${followingId}`;
    this.follows.set(followId, { followerId, followingId });

    // Update follower/following counts
    const follower = this.users.get(followerId);
    const following = this.users.get(followingId);

    if (follower) {
      follower.followingCount = (follower.followingCount || 0) + 1;
    }
    if (following) {
      following.followersCount = (following.followersCount || 0) + 1;
    }
  }

  deleteFollow(followerId: string, followingId: string): void {
    const followId = `${followerId}_${followingId}`;
    this.follows.delete(followId);

    // Update follower/following counts
    const follower = this.users.get(followerId);
    const following = this.users.get(followingId);

    if (follower) {
      follower.followingCount = Math.max(0, (follower.followingCount || 0) - 1);
    }
    if (following) {
      following.followersCount = Math.max(
        0,
        (following.followersCount || 0) - 1
      );
    }
  }

  isFollowing(followerId: string, followingId: string): boolean {
    const followId = `${followerId}_${followingId}`;
    return this.follows.has(followId);
  }

  getFollowingIds(userId: string): string[] {
    return Array.from(this.follows.values())
      .filter(f => f.followerId === userId)
      .map(f => f.followingId);
  }

  // Support operations
  createSupport(sessionId: string, userId: string): void {
    const supportId = `${sessionId}_${userId}`;
    this.supports.set(supportId, { sessionId, userId });

    // Increment support count
    const session = this.sessions.get(sessionId);
    if (session) {
      session.supportCount = (session.supportCount || 0) + 1;
    }
  }

  deleteSupport(sessionId: string, userId: string): void {
    const supportId = `${sessionId}_${userId}`;
    this.supports.delete(supportId);

    // Decrement support count
    const session = this.sessions.get(sessionId);
    if (session) {
      session.supportCount = Math.max(0, (session.supportCount || 0) - 1);
    }
  }

  isSupported(sessionId: string, userId: string): boolean {
    const supportId = `${sessionId}_${userId}`;
    return this.supports.has(supportId);
  }

  // Comment operations
  addComment(sessionId: string, comment: any): void {
    const existing = this.comments.get(sessionId) || [];
    this.comments.set(sessionId, [...existing, comment]);

    // Increment comment count
    const session = this.sessions.get(sessionId);
    if (session) {
      session.commentCount = (session.commentCount || 0) + 1;
    }
  }

  getComments(sessionId: string): any[] {
    return this.comments.get(sessionId) || [];
  }

  deleteComment(sessionId: string, commentId: string): void {
    const existing = this.comments.get(sessionId) || [];
    const filtered = existing.filter(c => c.id !== commentId);
    this.comments.set(sessionId, filtered);

    // Decrement comment count
    const session = this.sessions.get(sessionId);
    if (session) {
      session.commentCount = Math.max(0, (session.commentCount || 0) - 1);
    }
  }

  // Group operations
  createGroup(group: Group): void {
    this.groups.set(group.id, group);
  }

  getGroup(groupId: string): Group | undefined {
    return this.groups.get(groupId);
  }

  // Challenge operations
  createChallenge(challenge: Challenge): void {
    this.challenges.set(challenge.id, challenge);
  }

  getChallenge(challengeId: string): Challenge | undefined {
    return this.challenges.get(challengeId);
  }

  // Clear all data (for test cleanup)
  clear(): void {
    this.users.clear();
    this.sessions.clear();
    this.projects.clear();
    this.groups.clear();
    this.challenges.clear();
    this.activeSessions.clear();
    this.follows.clear();
    this.supports.clear();
    this.comments.clear();
  }
}

/**
 * Global store instance for tests
 */
export const testFirebaseStore = new InMemoryFirebaseStore();

/**
 * Reset Firebase store between tests
 */
export function resetFirebaseStore(): void {
  testFirebaseStore.clear();
}

/**
 * Create mock Firebase API that uses the in-memory store
 */
export function createMockFirebaseApi(
  store: InMemoryFirebaseStore = testFirebaseStore
) {
  return {
    // Auth API
    auth: {
      signIn: jest.fn(async (email: string, _password: string) => {
        const user = Array.from(store['users'].values()).find(
          u => u.email === email
        );
        if (!user) throw new Error('Invalid credentials');
        return user;
      }),
      signUp: jest.fn(async (data: any) => {
        const newUser: User = {
          id: `user-${Date.now()}`,
          email: data.email,
          username: data.username,
          name: data.name || data.username,
          createdAt: new Date(),
          updatedAt: new Date(),
          followersCount: 0,
          followingCount: 0,
        };
        store.createUser(newUser);
        return newUser;
      }),
      signOut: jest.fn(async () => {
        // Clear auth state
      }),
      getCurrentUser: jest.fn(async () => {
        // Return first user or null
        const users = Array.from(store['users'].values());
        return users[0] || null;
      }),
    },

    // Session API
    sessions: {
      create: jest.fn(async (sessionData: any) => {
        const newSession: Session = {
          id: `session-${Date.now()}`,
          ...sessionData,
          createdAt: new Date(),
          supportCount: 0,
          commentCount: 0,
        };
        store.createSession(newSession);
        return newSession;
      }),
      get: jest.fn(async (sessionId: string) => {
        return store.getSession(sessionId);
      }),
      update: jest.fn(async (sessionId: string, updates: any) => {
        store.updateSession(sessionId, updates);
        return store.getSession(sessionId);
      }),
      delete: jest.fn(async (sessionId: string) => {
        store.deleteSession(sessionId);
      }),
      getFeed: jest.fn(async (filters?: any) => {
        return store.getSessions(filters);
      }),
    },

    // Active session API (timer)
    activeSession: {
      save: jest.fn(async (userId: string, data: any) => {
        store.saveActiveSession(userId, data);
      }),
      get: jest.fn(async (userId: string) => {
        return store.getActiveSession(userId);
      }),
      clear: jest.fn(async (userId: string) => {
        store.clearActiveSession(userId);
      }),
    },

    // Project API
    projects: {
      create: jest.fn(async (projectData: any) => {
        // Validate required fields
        if (!projectData.name) throw new Error('Project name required');
        if (!projectData.userId) throw new Error('User ID required');

        const now = new Date();
        const newProject: Project = {
          id: `project-${Date.now()}-${mockProjectCounter++}`,
          description: '',
          icon: 'folder',
          color: '#007AFF',
          ...projectData,
          status: projectData.status ?? 'active',
          createdAt: new Date(),
          updatedAt: now,
        };
        store.createProject(newProject);
        return newProject;
      }),
      get: jest.fn(async (projectId: string) => {
        return store.getProject(projectId);
      }),
      getAll: jest.fn(async (userId: string) => {
        return store.getProjects(userId);
      }),
      update: jest.fn(async (projectId: string, updates: any) => {
        store.updateProject(projectId, updates);
        return store.getProject(projectId);
      }),
      delete: jest.fn(async (projectId: string) => {
        store.deleteProject(projectId);
      }),
    },

    // Social API
    social: {
      follow: jest.fn(async (followerId: string, followingId: string) => {
        store.createFollow(followerId, followingId);
      }),
      unfollow: jest.fn(async (followerId: string, followingId: string) => {
        store.deleteFollow(followerId, followingId);
      }),
      isFollowing: jest.fn(async (followerId: string, followingId: string) => {
        return store.isFollowing(followerId, followingId);
      }),
      support: jest.fn(async (sessionId: string, userId: string) => {
        store.createSupport(sessionId, userId);
      }),
      unsupport: jest.fn(async (sessionId: string, userId: string) => {
        store.deleteSupport(sessionId, userId);
      }),
      comment: jest.fn(async (sessionId: string, commentData: any) => {
        const comment = {
          id: `comment-${Date.now()}`,
          ...commentData,
          createdAt: new Date(),
        };
        store.addComment(sessionId, comment);
        return comment;
      }),
    },
  };
}
