/**
 * Firebase Mocks for Integration Tests
 *
 * Provides in-memory implementations of Firebase services for integration testing.
 * These mocks maintain state across operations within a test to verify workflows.
 */

// Note: 'any' types are acceptable in test mocks to maintain flexibility
// and avoid overly complex type definitions for test data structures

import {
  User,
  Session,
  Project,
  Group,
  Challenge,
  ActivityType,
  UserActivityPreference,
} from '@/types';
import { Timestamp } from 'firebase/firestore';

/**
 * Create a mock Timestamp object from a Date
 */
function createMockTimestamp(date: Date): Timestamp {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
    isEqual: (other: Timestamp) => date.getTime() === other.toMillis(),
  } as Timestamp;
}

// Counter for unique IDs
let mockProjectCounter = 0;
let mockActivityIdCounter = 0;

export function resetMockProjectCounter() {
  mockProjectCounter = 0;
}

export function resetMockActivityIdCounter() {
  mockActivityIdCounter = 0;
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
  private customActivities: Map<string, ActivityType> = new Map();
  private activityPreferences: Map<string, UserActivityPreference[]> =
    new Map();

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
  createSession(session: Session): Session {
    this.sessions.set(session.id, session);
    return session;
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

  // Activity operations
  createActivity(activity: ActivityType): void {
    this.customActivities.set(activity.id, activity);
  }

  getActivity(activityId: string): ActivityType | undefined {
    return this.customActivities.get(activityId);
  }

  getCustomActivities(userId: string): ActivityType[] {
    return Array.from(this.customActivities.values()).filter(
      a => a.userId === userId
    );
  }

  updateActivity(activityId: string, updates: Partial<ActivityType>): void {
    const activity = this.customActivities.get(activityId);
    if (activity) {
      this.customActivities.set(activityId, { ...activity, ...updates });
    }
  }

  deleteActivity(activityId: string): void {
    this.customActivities.delete(activityId);
  }

  // Activity preference operations
  createActivityPreference(
    userId: string,
    typeId: string,
    preference?: Partial<UserActivityPreference>
  ): UserActivityPreference {
    const key = `${userId}-prefs`;
    const prefs = this.activityPreferences.get(key) || [];

    const now = new Date();
    const timestamp = createMockTimestamp(now);
    const newPref: UserActivityPreference = {
      typeId,
      userId,
      lastUsed: timestamp,
      useCount: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...preference,
    };

    // Check if already exists
    const existingIndex = prefs.findIndex(p => p.typeId === typeId);
    if (existingIndex >= 0) {
      prefs[existingIndex] = newPref;
    } else {
      prefs.push(newPref);
    }

    this.activityPreferences.set(key, prefs);
    return newPref;
  }

  getActivityPreference(
    userId: string,
    typeId: string
  ): UserActivityPreference | undefined {
    const key = `${userId}-prefs`;
    const prefs = this.activityPreferences.get(key) || [];
    return prefs.find(p => p.typeId === typeId);
  }

  getActivityPreferences(userId: string): UserActivityPreference[] {
    const key = `${userId}-prefs`;
    return this.activityPreferences.get(key) || [];
  }

  updateActivityPreference(userId: string, typeId: string): void {
    const key = `${userId}-prefs`;
    const prefs = this.activityPreferences.get(key) || [];
    const existingIndex = prefs.findIndex(p => p.typeId === typeId);

    if (existingIndex >= 0) {
      const existing = prefs[existingIndex];
      if (!existing) return; // Type guard

      const now = new Date();
      const updated: UserActivityPreference = {
        typeId: existing.typeId,
        userId: existing.userId,
        useCount: existing.useCount + 1,
        lastUsed: createMockTimestamp(now),
        createdAt: existing.createdAt,
        updatedAt: createMockTimestamp(now),
      };
      prefs[existingIndex] = updated;
    }

    this.activityPreferences.set(key, prefs);
  }

  deleteActivityPreference(userId: string, typeId: string): void {
    const key = `${userId}-prefs`;
    const prefs = this.activityPreferences.get(key) || [];
    this.activityPreferences.set(
      key,
      prefs.filter(p => p.typeId !== typeId)
    );
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
    this.customActivities.clear();
    this.activityPreferences.clear();
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
          id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...sessionData,
          createdAt: new Date(),
          updatedAt: new Date(),
          supportCount: sessionData.supportCount || 0,
          commentCount: sessionData.commentCount || 0,
          isArchived: sessionData.isArchived || false,
          tags: sessionData.tags || [],
          images: sessionData.images || [],
          showStartTime: sessionData.showStartTime !== false,
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

    // Activity Types API
    activityTypes: {
      getSystemTypes: jest.fn(async () => {
        // Return hardcoded system defaults
        return [
          {
            id: 'work',
            name: 'Work',
            category: 'productivity',
            icon: 'Briefcase',
            defaultColor: '#0066CC',
            isSystem: true,
            order: 1,
            description: 'Professional work and meetings',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'coding',
            name: 'Coding',
            category: 'productivity',
            icon: 'Code',
            defaultColor: '#5856D6',
            isSystem: true,
            order: 2,
            description: 'Software development and programming',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'side-project',
            name: 'Side Project',
            category: 'productivity',
            icon: 'Rocket',
            defaultColor: '#FF9500',
            isSystem: true,
            order: 3,
            description: 'Personal projects and side hustles',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'planning',
            name: 'Planning',
            category: 'productivity',
            icon: 'Target',
            defaultColor: '#32ADE6',
            isSystem: true,
            order: 4,
            description: 'Goal setting, planning, and strategy',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'study',
            name: 'Study',
            category: 'learning',
            icon: 'BookOpen',
            defaultColor: '#34C759',
            isSystem: true,
            order: 5,
            description: 'Academic learning and coursework',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'learning',
            name: 'Learning',
            category: 'learning',
            icon: 'GraduationCap',
            defaultColor: '#FFD60A',
            isSystem: true,
            order: 6,
            description: 'Skill development and online courses',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'reading',
            name: 'Reading',
            category: 'learning',
            icon: 'Book',
            defaultColor: '#FF2D55',
            isSystem: true,
            order: 7,
            description: 'Books, articles, and documentation',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'research',
            name: 'Research',
            category: 'learning',
            icon: 'FlaskConical',
            defaultColor: '#AF52DE',
            isSystem: true,
            order: 8,
            description: 'Investigation and analysis',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'creative',
            name: 'Creative',
            category: 'creative',
            icon: 'Palette',
            defaultColor: '#FF6482',
            isSystem: true,
            order: 9,
            description: 'Design, art, music, video production',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'writing',
            name: 'Writing',
            category: 'creative',
            icon: 'PenTool',
            defaultColor: '#AC8E68',
            isSystem: true,
            order: 10,
            description: 'Blog posts, documentation, journaling',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      }),

      getUserCustom: jest.fn(async (userId: string) => {
        return store.getCustomActivities(userId);
      }),

      getAll: jest.fn(async (userId: string) => {
        // Get system types inline
        const systemTypes = [
          {
            id: 'work',
            name: 'Work',
            category: 'productivity',
            icon: 'Briefcase',
            defaultColor: '#0066CC',
            isSystem: true,
            order: 1,
            description: 'Professional work and meetings',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'coding',
            name: 'Coding',
            category: 'productivity',
            icon: 'Code',
            defaultColor: '#5856D6',
            isSystem: true,
            order: 2,
            description: 'Software development and programming',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'side-project',
            name: 'Side Project',
            category: 'productivity',
            icon: 'Rocket',
            defaultColor: '#FF9500',
            isSystem: true,
            order: 3,
            description: 'Personal projects and side hustles',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'planning',
            name: 'Planning',
            category: 'productivity',
            icon: 'Target',
            defaultColor: '#32ADE6',
            isSystem: true,
            order: 4,
            description: 'Goal setting, planning, and strategy',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'study',
            name: 'Study',
            category: 'learning',
            icon: 'BookOpen',
            defaultColor: '#34C759',
            isSystem: true,
            order: 5,
            description: 'Academic learning and coursework',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'learning',
            name: 'Learning',
            category: 'learning',
            icon: 'GraduationCap',
            defaultColor: '#FFD60A',
            isSystem: true,
            order: 6,
            description: 'Skill development and online courses',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'reading',
            name: 'Reading',
            category: 'learning',
            icon: 'Book',
            defaultColor: '#FF2D55',
            isSystem: true,
            order: 7,
            description: 'Books, articles, and documentation',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'research',
            name: 'Research',
            category: 'learning',
            icon: 'FlaskConical',
            defaultColor: '#AF52DE',
            isSystem: true,
            order: 8,
            description: 'Investigation and analysis',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'creative',
            name: 'Creative',
            category: 'creative',
            icon: 'Palette',
            defaultColor: '#FF6482',
            isSystem: true,
            order: 9,
            description: 'Design, art, music, video production',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'writing',
            name: 'Writing',
            category: 'creative',
            icon: 'PenTool',
            defaultColor: '#AC8E68',
            isSystem: true,
            order: 10,
            description: 'Blog posts, documentation, journaling',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        const customTypes = store.getCustomActivities(userId);
        return [...systemTypes, ...customTypes].sort(
          (a, b) => a.order - b.order
        );
      }),

      create: jest.fn(async (userId: string, data: any) => {
        // Validate required fields
        if (
          !data.name ||
          !data.icon ||
          !data.defaultColor ||
          data.name.trim() === '' ||
          data.icon.trim() === '' ||
          data.defaultColor.trim() === ''
        ) {
          throw new Error('Name, icon, and color are required');
        }

        // Check max limit
        const custom = store.getCustomActivities(userId);
        if (custom.length >= 10) {
          throw new Error(
            'Maximum custom activities reached (10). Delete an existing custom activity to create a new one.'
          );
        }

        const newActivity: ActivityType = {
          id: `custom-${Date.now()}-${mockActivityIdCounter++}`,
          name: data.name,
          icon: data.icon,
          defaultColor: data.defaultColor,
          category: data.category || 'productivity',
          description: data.description || '',
          isSystem: false,
          userId: userId,
          order: 10 + custom.length + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        store.createActivity(newActivity);
        return newActivity;
      }),

      update: jest.fn(async (activityId: string, userId: string, data: any) => {
        // Check if is system activity
        if (activityId === 'work' || !activityId.includes('custom')) {
          throw new Error('Cannot update default activity types');
        }

        const activity = store.getActivity(activityId);
        if (!activity) {
          throw new Error('Activity not found');
        }

        const updated = {
          ...activity,
          ...data,
          updatedAt: new Date(),
        };

        store.updateActivity(activityId, updated);
        return updated;
      }),

      delete: jest.fn(async (activityId: string, userId: string) => {
        // Check if is system activity
        if (activityId === 'work' || !activityId.includes('custom')) {
          throw new Error('Cannot delete default activity types');
        }

        const activity = store.getActivity(activityId);
        if (!activity) {
          throw new Error('Activity not found');
        }

        store.deleteActivity(activityId);
        store.deleteActivityPreference(userId, activityId);
      }),
    },

    // Activity Preferences API
    activityPreferences: {
      getRecent: jest.fn(async (userId: string, limit: number = 5) => {
        const prefs = store.getActivityPreferences(userId);
        return prefs
          .sort((a, b) => b.lastUsed.toMillis() - a.lastUsed.toMillis())
          .slice(0, limit);
      }),

      getAll: jest.fn(async (userId: string) => {
        const prefs = store.getActivityPreferences(userId);
        return prefs.sort(
          (a, b) => b.lastUsed.toMillis() - a.lastUsed.toMillis()
        );
      }),

      update: jest.fn(async (typeId: string, userId?: string) => {
        // userId might not be provided, but we'll use it if available
        if (userId) {
          store.updateActivityPreference(userId, typeId);
        }
      }),
    },
  };
}
