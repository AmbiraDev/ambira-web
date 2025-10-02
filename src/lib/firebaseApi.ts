import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentData,
  increment
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from './firebase';

// Helper function for safe error handling
const getErrorMessage = (error: any, defaultMessage: string): string => {
  if (!error) return defaultMessage;
  if (error?.message) return error.message;
  if (error?.toString) return error.toString();
  return defaultMessage;
};

import {
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
  AuthUser,
  UserProfile,
  UserStats,
  ActivityData,
  WeeklyActivity,
  ProjectBreakdown,
  PrivacySettings,
  UserSearchResult,
  SuggestedUser,
  Project,
  CreateProjectData,
  UpdateProjectData,
  ProjectStats,
  Task,
  CreateTaskData,
  UpdateTaskData,
  TaskStats,
  Session,
  CreateSessionData,
  SessionFormData,
  SessionFilters,
  SessionSort,
  SessionListResponse,
  Post,
  PostWithDetails,
  CreatePostData,
  UpdatePostData,
  PostSupport,
  FeedResponse,
  FeedFilters
} from '@/types';

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

// Helper function to convert Date to Firestore timestamp
const convertToTimestamp = (date: Date) => Timestamp.fromDate(date);

// Auth API methods
export const firebaseAuthApi = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const firebaseUser = userCredential.user;
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      let userData = userDoc.data();
      
      // If user profile doesn't exist (for demo user), create it
      if (!userData) {
        const demoUserData = {
          email: credentials.email,
          name: credentials.email === 'demo@ambira.com' ? 'Demo User' : 'New User',
          username: credentials.email === 'demo@ambira.com' ? 'demo' : credentials.email.split('@')[0],
          bio: credentials.email === 'demo@ambira.com' ? 'Welcome to Ambira! This is a demo account to explore the app.' : '',
          location: credentials.email === 'demo@ambira.com' ? 'San Francisco, CA' : '',
          profilePicture: null,
          followersCount: credentials.email === 'demo@ambira.com' ? 42 : 0,
          followingCount: credentials.email === 'demo@ambira.com' ? 28 : 0,
          totalHours: credentials.email === 'demo@ambira.com' ? 156.5 : 0,
          profileVisibility: 'everyone',
          activityVisibility: 'everyone',
          projectVisibility: 'everyone',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), demoUserData);
        userData = demoUserData;
      }
      
      const user: AuthUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: userData.name,
        username: userData.username,
        bio: userData.bio,
        location: userData.location,
        profilePicture: userData.profilePicture,
        createdAt: convertTimestamp(userData.createdAt),
        updatedAt: convertTimestamp(userData.updatedAt)
      };
      
      const token = await firebaseUser.getIdToken();
      
      return { user, token };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Login failed'));
    }
  },

  // Signup
  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
      const firebaseUser = userCredential.user;
      
      // Create user profile in Firestore
      const userData = {
        email: credentials.email,
        name: credentials.name,
        username: credentials.username,
        bio: '',
        location: '',
        profilePicture: null,
        followersCount: 0,
        followingCount: 0,
        totalHours: 0,
        profileVisibility: 'everyone',
        activityVisibility: 'everyone',
        projectVisibility: 'everyone',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: credentials.name
      });
      
      const user: AuthUser = {
        id: firebaseUser.uid,
        email: credentials.email,
        name: credentials.name,
        username: credentials.username,
        bio: '',
        location: '',
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const token = await firebaseUser.getIdToken();
      
      return { user, token };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Signup failed'));
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed');
    }
  },

  // Get current user
  getCurrentUser: async (token?: string): Promise<AuthUser> => {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }
      
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      let userData = userDoc.data();
      
      // If user profile doesn't exist, create a basic one
      if (!userData) {
        const basicUserData = {
          email: auth.currentUser.email!,
          name: auth.currentUser.displayName || 'New User',
          username: auth.currentUser.email!.split('@')[0],
          bio: '',
          location: '',
          profilePicture: auth.currentUser.photoURL || null,
          followersCount: 0,
          followingCount: 0,
          totalHours: 0,
          profileVisibility: 'everyone',
          activityVisibility: 'everyone',
          projectVisibility: 'everyone',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, 'users', auth.currentUser.uid), basicUserData);
        userData = basicUserData;
      }
      
      return {
        id: auth.currentUser.uid,
        email: auth.currentUser.email!,
        name: userData.name,
        username: userData.username,
        bio: userData.bio,
        location: userData.location,
        profilePicture: userData.profilePicture,
        createdAt: convertTimestamp(userData.createdAt),
        updatedAt: convertTimestamp(userData.updatedAt)
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get current user');
    }
  },

  // Verify token
  verifyToken: async (token: string): Promise<boolean> => {
    try {
      // Firebase handles token verification automatically
      // We just need to check if user is authenticated
      return !!auth.currentUser;
    } catch (error) {
      return false;
    }
  },

  // Auth state listener
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};

// User API methods
export const firebaseUserApi = {
  // Get user profile by username
  getUserProfile: async (username: string): Promise<UserProfile> => {
    try {
      const usersQuery = query(collection(db, 'users'), where('username', '==', username));
      const querySnapshot = await getDocs(usersQuery);
      
      if (querySnapshot.empty) {
        throw new Error('User not found');
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Check if current user is following this user
      let isFollowing = false;
      if (auth.currentUser) {
        const followDoc = await getDoc(doc(db, 'follows', `${auth.currentUser.uid}_${userDoc.id}`));
        isFollowing = followDoc.exists();
      }
      
      return {
        id: userDoc.id,
        username: userData.username,
        name: userData.name,
        bio: userData.bio,
        location: userData.location,
        profilePicture: userData.profilePicture,
        followersCount: userData.followersCount || 0,
        followingCount: userData.followingCount || 0,
        totalHours: userData.totalHours || 0,
        isFollowing,
        isPrivate: userData.profileVisibility === 'private',
        createdAt: convertTimestamp(userData.createdAt),
        updatedAt: convertTimestamp(userData.updatedAt)
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get user profile');
    }
  },

  // Update user profile
  updateProfile: async (data: Partial<{
    name: string;
    bio: string;
    location: string;
    profilePicture: string;
  }>): Promise<UserProfile> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), updateData);
      
      // Get updated profile
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data()!;
      
      return {
        id: auth.currentUser.uid,
        username: userData.username,
        name: userData.name,
        bio: userData.bio,
        location: userData.location,
        profilePicture: userData.profilePicture,
        followersCount: userData.followersCount || 0,
        followingCount: userData.followingCount || 0,
        totalHours: userData.totalHours || 0,
        isFollowing: false,
        isPrivate: userData.profileVisibility === 'private',
        createdAt: convertTimestamp(userData.createdAt),
        updatedAt: convertTimestamp(userData.updatedAt)
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  // Get user statistics
  getUserStats: async (userId: string): Promise<UserStats> => {
    try {
      // Compute stats from sessions collection
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', userId)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);

      let totalSeconds = 0;
      let weeklySeconds = 0;
      let monthlySeconds = 0;
      let sessionsThisWeek = 0;
      let sessionsThisMonth = 0;
      const sessionDurations: number[] = [];
      const hourBuckets: Record<number, number> = {};

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Sunday start
      weekStart.setHours(0, 0, 0, 0);

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      sessionsSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const duration = Number(data.duration) || 0; // seconds
        const start = convertTimestamp(data.startTime);
        totalSeconds += duration;
        sessionDurations.push(duration);

        // Most productive hour (by count)
        const h = new Date(start).getHours();
        hourBuckets[h] = (hourBuckets[h] || 0) + 1;

        if (start >= weekStart) {
          weeklySeconds += duration;
          sessionsThisWeek += 1;
        }
        if (start >= monthStart) {
          monthlySeconds += duration;
          sessionsThisMonth += 1;
        }
      });

      // Streaks: simple placeholder based on recent days with activity
      // Count consecutive days from today with at least one session
      const daysWithActivity = new Set<string>();
      sessionsSnapshot.forEach((docSnap) => {
        const start = convertTimestamp(docSnap.data().startTime);
        daysWithActivity.add(start.toISOString().substring(0, 10));
      });
      let currentStreak = 0;
      let cursor = new Date();
      cursor.setHours(0, 0, 0, 0);
      while (daysWithActivity.has(cursor.toISOString().substring(0, 10))) {
        currentStreak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      const longestStreak = Math.max(currentStreak, 0);

      // Average session duration (in minutes)
      const averageSessionDuration = sessionDurations.length
        ? Math.round((sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length) / 60)
        : 0;

      // Most productive hour (0-23)
      let mostProductiveHour = 0;
      let maxCount = -1;
      Object.entries(hourBuckets).forEach(([hourStr, count]) => {
        const hour = Number(hourStr);
        if (count > maxCount) {
          maxCount = count as number;
          mostProductiveHour = hour;
        }
      });

      return {
        totalHours: totalSeconds / 3600,
        weeklyHours: weeklySeconds / 3600,
        monthlyHours: monthlySeconds / 3600,
        currentStreak,
        longestStreak,
        sessionsThisWeek,
        sessionsThisMonth,
        averageSessionDuration,
        mostProductiveHour,
        favoriteProject: undefined,
      } as unknown as UserStats;
    } catch (error: any) {
      console.error('Failed to get user stats:', error);
      // Return default stats instead of throwing error
      return {
        totalHours: 0,
        sessionsThisWeek: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageSessionLength: 0,
        mostProductiveDay: 'Monday',
        totalSessions: 0,
        completedTasks: 0,
        activeProjects: 0
      };
    }
  },

  // Follow user
  followUser: async (userId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const batch = writeBatch(db);
      
      // Add follow relationship
      const followId = `${auth.currentUser.uid}_${userId}`;
      batch.set(doc(db, 'follows', followId), {
        followerId: auth.currentUser.uid,
        followingId: userId,
        createdAt: serverTimestamp()
      });
      
      // Update follower count
      const userRef = doc(db, 'users', userId);
      const followerRef = doc(db, 'users', auth.currentUser.uid);
      
      batch.update(userRef, {
        followersCount: increment(1),
        updatedAt: serverTimestamp()
      });
      
      batch.update(followerRef, {
        followingCount: increment(1),
        updatedAt: serverTimestamp()
      });
      
      await batch.commit();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to follow user');
    }
  },

  // Unfollow user
  unfollowUser: async (userId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const batch = writeBatch(db);
      
      // Remove follow relationship
      const followId = `${auth.currentUser.uid}_${userId}`;
      batch.delete(doc(db, 'follows', followId));
      
      // Update follower count
      const userRef = doc(db, 'users', userId);
      const followerRef = doc(db, 'users', auth.currentUser.uid);
      
      batch.update(userRef, {
        followersCount: increment(-1),
        updatedAt: serverTimestamp()
      });
      
      batch.update(followerRef, {
        followingCount: increment(-1),
        updatedAt: serverTimestamp()
      });
      
      await batch.commit();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to unfollow user');
    }
  },

  // Search users
  searchUsers: async (query: string, page: number = 1, limitCount: number = 20): Promise<{
    users: UserSearchResult[];
    totalCount: number;
    hasMore: boolean;
  }> => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '>=', query),
        where('username', '<=', query + '\uf8ff'),
        orderBy('username'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const users: UserSearchResult[] = [];
      
      querySnapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          username: userData.username,
          name: userData.name,
          bio: userData.bio,
          profilePicture: userData.profilePicture,
          followersCount: userData.followersCount || 0,
          isFollowing: false // Will be updated based on follow status
        });
      });
      
      return {
        users,
        totalCount: users.length,
        hasMore: users.length === limitCount
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search users');
    }
  },

  // Get suggested users
  getSuggestedUsers: async (limitCount: number = 10): Promise<SuggestedUser[]> => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('followersCount', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const suggestions: SuggestedUser[] = [];
      
      querySnapshot.forEach((doc, index) => {
        const userData = doc.data();
        suggestions.push({
          id: doc.id,
          username: userData.username,
          name: userData.name,
          bio: userData.bio,
          profilePicture: userData.profilePicture,
          followersCount: userData.followersCount || 0,
          reason: index < 3 ? 'popular_user' : 'similar_interests',
          isFollowing: false
        });
      });
      
      return suggestions;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get suggested users');
    }
  },

  // Get privacy settings
  getPrivacySettings: async (): Promise<PrivacySettings> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      
      return {
        profileVisibility: userData?.profileVisibility || 'everyone',
        activityVisibility: userData?.activityVisibility || 'everyone',
        projectVisibility: userData?.projectVisibility || 'everyone',
        blockedUsers: userData?.blockedUsers || []
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get privacy settings');
    }
  },

  // Update privacy settings
  updatePrivacySettings: async (settings: Partial<PrivacySettings>): Promise<PrivacySettings> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const updateData = {
        ...settings,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), updateData);
      
      return {
        profileVisibility: settings.profileVisibility || 'everyone',
        activityVisibility: settings.activityVisibility || 'everyone',
        projectVisibility: settings.projectVisibility || 'everyone',
        blockedUsers: settings.blockedUsers || []
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update privacy settings');
    }
  },

  // Check if username is available
  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    try {
      const usersQuery = query(collection(db, 'users'), where('username', '==', username));
      const querySnapshot = await getDocs(usersQuery);
      return querySnapshot.empty;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to check username availability');
    }
  }
};

// Project API methods
export const firebaseProjectApi = {
  // Get all user's projects
  getProjects: async (): Promise<Project[]> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const projectsQuery = query(
        collection(db, 'projects', auth.currentUser.uid, 'userProjects'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(projectsQuery);
      const projects: Project[] = [];
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          userId: auth.currentUser!.uid,
          name: data.name,
          description: data.description,
          icon: data.icon,
          color: data.color,
          weeklyTarget: data.weeklyTarget,
          totalTarget: data.totalTarget,
          status: data.status || 'active',
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt)
        });
      });
      
      return projects;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get projects');
    }
  },

  // Create new project
  createProject: async (data: CreateProjectData): Promise<Project> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const projectData = {
        ...data,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'projects', auth.currentUser.uid, 'userProjects'), projectData);
      
      return {
        id: docRef.id,
        userId: auth.currentUser.uid,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        weeklyTarget: data.weeklyTarget,
        totalTarget: data.totalTarget,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create project');
    }
  },

  // Update project
  updateProject: async (id: string, data: UpdateProjectData): Promise<Project> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'projects', auth.currentUser.uid, 'userProjects', id), updateData);
      
      // Get updated project
      const projectDoc = await getDoc(doc(db, 'projects', auth.currentUser.uid, 'userProjects', id));
      const projectData = projectDoc.data()!;
      
      return {
        id,
        userId: auth.currentUser.uid,
        name: projectData.name,
        description: projectData.description,
        icon: projectData.icon,
        color: projectData.color,
        weeklyTarget: projectData.weeklyTarget,
        totalTarget: projectData.totalTarget,
        status: projectData.status || 'active',
        createdAt: convertTimestamp(projectData.createdAt),
        updatedAt: convertTimestamp(projectData.updatedAt)
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update project');
    }
  },

  // Delete project
  deleteProject: async (id: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      await deleteDoc(doc(db, 'projects', auth.currentUser.uid, 'userProjects', id));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete project');
    }
  }
};

// Firebase Task API
export const firebaseTaskApi = {
  // Get tasks for a project
  getProjectTasks: async (projectId: string): Promise<Task[]> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      console.log('Firebase API: Getting tasks for project:', projectId, 'User:', auth.currentUser.uid);
      const tasksQuery = query(
        collection(db, 'projects', auth.currentUser.uid, 'userProjects', projectId, 'tasks'),
        orderBy('createdAt', 'desc')
      );
      
      const tasksSnapshot = await getDocs(tasksQuery);
      console.log('Firebase API: Found tasks:', tasksSnapshot.docs.length);
      
      const tasks = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
        completedAt: doc.data().completedAt ? convertTimestamp(doc.data().completedAt) : undefined,
      })) as Task[];
      
      console.log('Firebase API: Processed tasks:', tasks);
      return tasks;
    } catch (error: any) {
      console.error('Firebase API: Error getting project tasks:', error);
      throw new Error(getErrorMessage(error, 'Failed to get project tasks'));
    }
  },

  // Get all tasks (project tasks + unassigned tasks)
  getAllTasks: async (): Promise<Task[]> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Get unassigned tasks
      const unassignedQuery = query(
        collection(db, 'users', auth.currentUser.uid, 'tasks'),
        orderBy('createdAt', 'desc')
      );
      
      const unassignedSnapshot = await getDocs(unassignedQuery);
      const unassignedTasks = unassignedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        projectId: null, // Mark as unassigned
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
        completedAt: doc.data().completedAt ? convertTimestamp(doc.data().completedAt) : undefined,
      })) as Task[];
      
      // TODO: Also load project tasks
      // For now, just return unassigned tasks
      // In the future, we should also load tasks from all projects
      
      return unassignedTasks;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get all tasks');
    }
  },

  // Create a new task
  createTask: async (data: CreateTaskData): Promise<Task> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const taskData = {
        ...data,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: auth.currentUser.uid,
      };
      
      let docRef;
      
      if (data.projectId) {
        // Create task in project subcollection
        docRef = await addDoc(
          collection(db, 'projects', auth.currentUser.uid, 'userProjects', data.projectId, 'tasks'),
          taskData
        );
      } else {
        // Create unassigned task in user's tasks collection
        docRef = await addDoc(
          collection(db, 'users', auth.currentUser.uid, 'tasks'),
          taskData
        );
      }
      
      return {
        id: docRef.id,
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Task;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to create task'));
    }
  },

  // Update a task
  updateTask: async (id: string, data: UpdateTaskData, projectId?: string): Promise<Task> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
        completedAt: data.status === 'completed' ? serverTimestamp() : null,
      };
      
      let docRef;
      if (projectId) {
        // Update task in project subcollection
        docRef = doc(db, 'projects', auth.currentUser.uid, 'userProjects', projectId, 'tasks', id);
      } else {
        // Update unassigned task
        docRef = doc(db, 'users', auth.currentUser.uid, 'tasks', id);
      }
      
      await updateDoc(docRef, updateData);
      
      // Return updated task (would need to fetch from DB for complete data)
      return {
        id,
        ...data,
        updatedAt: new Date(),
        completedAt: data.status === 'completed' ? new Date() : undefined,
      } as Task;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to update task'));
    }
  },

  // Delete a task
  deleteTask: async (id: string, projectId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      await deleteDoc(
        doc(db, 'projects', auth.currentUser.uid, 'userProjects', projectId, 'tasks', id)
      );
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete task');
    }
  },

  // Bulk update tasks
  bulkUpdateTasks: async (update: BulkTaskUpdate, projectId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const batch = writeBatch(db);
      
      update.taskIds.forEach(taskId => {
        const taskRef = doc(db, 'projects', auth.currentUser.uid, 'userProjects', projectId, 'tasks', taskId);
        batch.update(taskRef, {
          status: update.status,
          updatedAt: serverTimestamp(),
          completedAt: update.status === 'completed' ? serverTimestamp() : null,
        });
      });
      
      await batch.commit();
    } catch (error: any) {
      console.error('Bulk update tasks error:', error);
      throw new Error(getErrorMessage(error, 'Failed to bulk update tasks'));
    }
  },

  // Get task statistics
  getTaskStats: async (projectId: string): Promise<TaskStats> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      // TODO: Implement proper task stats calculation
      // For now, return default stats
      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        averageCompletionTime: 0,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get task stats');
    }
  },
};

// Firebase Session API
export const firebaseSessionApi = {
  // Create a new session
  createSession: async (data: CreateSessionData): Promise<Session> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Get selected tasks
      const selectedTasks = [];
      if (data.taskIds && data.taskIds.length > 0) {
        // Fetch task data for each task ID
        for (const taskId of data.taskIds) {
          try {
            // Try to find task in project subcollections first
            const projectsQuery = query(
              collection(db, 'projects', auth.currentUser.uid, 'userProjects')
            );
            const projectsSnapshot = await getDocs(projectsQuery);
            
            let taskFound = false;
            for (const projectDoc of projectsSnapshot.docs) {
              const taskDoc = await getDoc(doc(db, 'projects', auth.currentUser.uid, 'userProjects', projectDoc.id, 'tasks', taskId));
              if (taskDoc.exists()) {
                const taskData = taskDoc.data();
                selectedTasks.push({
                  id: taskId,
                  projectId: projectDoc.id,
                  name: taskData.name,
                  status: taskData.status || 'active',
                  createdAt: convertTimestamp(taskData.createdAt),
                  updatedAt: convertTimestamp(taskData.updatedAt),
                  completedAt: taskData.completedAt ? convertTimestamp(taskData.completedAt) : undefined
                });
                taskFound = true;
                break;
              }
            }
            
            // If not found in projects, try unassigned tasks
            if (!taskFound) {
              const taskDoc = await getDoc(doc(db, 'users', auth.currentUser.uid, 'tasks', taskId));
              if (taskDoc.exists()) {
                const taskData = taskDoc.data();
                selectedTasks.push({
                  id: taskId,
                  projectId: null,
                  name: taskData.name,
                  status: taskData.status || 'active',
                  createdAt: convertTimestamp(taskData.createdAt),
                  updatedAt: convertTimestamp(taskData.updatedAt),
                  completedAt: taskData.completedAt ? convertTimestamp(taskData.completedAt) : undefined
                });
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch task ${taskId}:`, error);
          }
        }
      }

      const sessionData = {
        ...data,
        userId: auth.currentUser.uid,
        tasks: selectedTasks,
        visibility: data.visibility || 'private',
        showStartTime: data.showStartTime || false,
        hideTaskNames: data.hideTaskNames || false,
        publishToFeeds: data.publishToFeeds ?? true,
        isArchived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'sessions'), sessionData as any);

      const newSession: Session = {
        id: docRef.id,
        userId: auth.currentUser.uid,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        duration: data.duration,
        startTime: data.startTime,
        tasks: selectedTasks,
        tags: data.tags || [],
        visibility: sessionData.visibility,
        showStartTime: sessionData.showStartTime,
        hideTaskNames: sessionData.hideTaskNames,
        publishToFeeds: sessionData.publishToFeeds,
        howFelt: data.howFelt,
        privateNotes: data.privateNotes,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return newSession;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to create session'));
    }
  },

  // Create session and post if visibility allows
  createSessionWithPost: async (
    sessionData: CreateSessionData,
    postContent: string,
    visibility: 'everyone' | 'followers' | 'private'
  ): Promise<{ session: Session; post?: Post }> => {
    try {
      // Create session first
      const session = await firebaseSessionApi.createSession(sessionData);
      
      // Update session visibility
      await updateDoc(doc(db, 'sessions', session.id), {
        visibility,
        updatedAt: serverTimestamp()
      });

      let post: Post | undefined;
      
      // Create post if not private
      if (visibility !== 'private') {
        post = await firebasePostApi.createPost({
          sessionId: session.id,
          content: postContent,
          visibility
        });
      }

      return { session: { ...session, visibility }, post };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to create session with post'));
    }
  },

  // Save active timer session
  saveActiveSession: async (timerData: {
    startTime: Date;
    projectId: string;
    selectedTaskIds: string[];
    pausedDuration?: number;
    isPaused?: boolean;
  }): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;
      
      // Ensure user document exists first (Firestore requires parent docs for subcollections)
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        uid: userId,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Now save the active session
      const activeSessionRef = doc(db, 'users', userId, 'activeSession', 'current');
      
      await setDoc(activeSessionRef, {
        startTime: timerData.startTime,
        projectId: timerData.projectId,
        selectedTaskIds: timerData.selectedTaskIds,
        pausedDuration: timerData.pausedDuration || 0,
        isPaused: !!timerData.isPaused,
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      console.log('Active session saved successfully');
    } catch (error: any) {
      console.error('Failed to save active session:', error?.message || error);
      throw error;
    }
  },

  // Get active timer session
  getActiveSession: async (): Promise<{
    startTime: Date;
    projectId: string;
    selectedTaskIds: string[];
    pausedDuration: number;
    isPaused: boolean;
  } | null> => {
    try {
      if (!auth.currentUser) {
        return null;
      }

      const userId = auth.currentUser.uid;
      const activeSessionRef = doc(db, 'users', userId, 'activeSession', 'current');
      const activeSessionDoc = await getDoc(activeSessionRef);
      
      if (!activeSessionDoc.exists()) {
        return null;
      }

      const data = activeSessionDoc.data();
      
      // Validate data exists and has required fields
      if (!data || !data.startTime || !data.projectId) {
        console.warn('Active session data is incomplete');
        return null;
      }
      
      return {
        startTime: data.startTime.toDate(),
        projectId: data.projectId,
        selectedTaskIds: data.selectedTaskIds || [],
        pausedDuration: data.pausedDuration || 0,
        isPaused: !!data.isPaused
      };
    } catch (error: any) {
      // If it's a permission error or document doesn't exist, silently return null
      if (error?.code === 'permission-denied' || error?.code === 'not-found') {
        return null;
      }
      console.error('Failed to get active session:', error);
      return null;
    }
  },

  // Clear active session
  clearActiveSession: async (): Promise<void> => {
    try {
      if (!auth.currentUser) {
        return;
      }

      const userId = auth.currentUser.uid;
      const activeSessionRef = doc(db, 'users', userId, 'activeSession', 'current');
      await deleteDoc(activeSessionRef);
    } catch (error) {
      console.error('Failed to clear active session:', error);
    }
  },

  // Get user's sessions
  getSessions: async (
    page: number = 1,
    limitCount: number = 20,
    filters: SessionFilters = {}
  ): Promise<SessionListResponse> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      let sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('startTime', 'desc'),
        limit(limitCount)
      );

      if (filters.projectId) {
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('userId', '==', auth.currentUser.uid),
          where('projectId', '==', filters.projectId),
          orderBy('startTime', 'desc'),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(sessionsQuery);
      const sessions: Session[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          userId: data.userId,
          projectId: data.projectId,
          title: data.title,
          description: data.description,
          duration: data.duration,
          startTime: convertTimestamp(data.startTime),
          tasks: data.tasks || [],
          tags: data.tags || [],
          visibility: data.visibility || 'private',
          howFelt: data.howFelt,
          privateNotes: data.privateNotes,
          isArchived: data.isArchived || false,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt)
        });
      });

      return {
        sessions,
        totalCount: sessions.length,
        hasMore: querySnapshot.docs.length === limitCount
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get sessions'));
    }
  }
};

// Firebase Post API
export const firebasePostApi = {
  // Create a new post
  createPost: async (data: CreatePostData): Promise<Post> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const postData = {
        ...data,
        supportCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'posts'), postData);

      return {
        id: docRef.id,
        sessionId: data.sessionId,
        userId: auth.currentUser.uid,
        content: data.content,
        supportCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to create post'));
    }
  },

  // Get posts for feed
  getFeedPosts: async (
    limitCount: number = 20,
    cursor?: string,
    filters: FeedFilters = {}
  ): Promise<FeedResponse> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      let postsQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(limitCount + 1) // Get one extra to check if there are more
      );

      if (cursor) {
        const cursorDoc = await getDoc(doc(db, 'posts', cursor));
        if (cursorDoc.exists()) {
          postsQuery = query(
            collection(db, 'posts'),
            orderBy('createdAt', 'desc'),
            startAfter(cursorDoc),
            limit(limitCount + 1)
          );
        }
      }

      const querySnapshot = await getDocs(postsQuery);
      const posts: PostWithDetails[] = [];

      // Process posts in batches to populate user and session data
      const batchSize = 10;
      const postDocs = querySnapshot.docs.slice(0, limitCount);
      
      for (let i = 0; i < postDocs.length; i += batchSize) {
        const batch = postDocs.slice(i, i + batchSize);
        const batchPromises = batch.map(async (postDoc) => {
          const postData = postDoc.data();
          
          // Get user data
          const userDoc = await getDoc(doc(db, 'users', postData.userId));
          const userData = userDoc.data();
          
          // Get session data
          const sessionDoc = await getDoc(doc(db, 'sessions', postData.sessionId));
          const sessionData = sessionDoc.data();
          
          // Get project data
          let projectData = null;
          if (sessionData?.projectId) {
            const projectDoc = await getDoc(doc(db, 'projects', postData.userId, 'userProjects', sessionData.projectId));
            projectData = projectDoc.data();
          }

          // Check if current user has supported this post
          const supportDoc = await getDoc(doc(db, 'postSupports', `${auth.currentUser!.uid}_${postDoc.id}`));
          const isSupported = supportDoc.exists();

          return {
            id: postDoc.id,
            sessionId: postData.sessionId,
            userId: postData.userId,
            content: postData.content,
            supportCount: postData.supportCount || 0,
            commentCount: postData.commentCount || 0,
            isSupported,
            createdAt: convertTimestamp(postData.createdAt),
            updatedAt: convertTimestamp(postData.updatedAt),
            user: {
              id: userData?.id || postData.userId,
              email: userData?.email || '',
              name: userData?.name || 'Unknown User',
              username: userData?.username || 'unknown',
              bio: userData?.bio,
              location: userData?.location,
              profilePicture: userData?.profilePicture,
              createdAt: convertTimestamp(userData?.createdAt) || new Date(),
              updatedAt: convertTimestamp(userData?.updatedAt) || new Date()
            },
            session: sessionData ? {
              id: sessionData.id || postData.sessionId,
              userId: sessionData.userId || postData.userId,
              projectId: sessionData.projectId,
              title: sessionData.title,
              description: sessionData.description,
              duration: sessionData.duration,
              startTime: convertTimestamp(sessionData.startTime),
              tasks: sessionData.tasks || [],
              tags: sessionData.tags || [],
              visibility: sessionData.visibility || 'everyone',
              howFelt: sessionData.howFelt,
              privateNotes: sessionData.privateNotes,
              isArchived: sessionData.isArchived || false,
              createdAt: convertTimestamp(sessionData.createdAt) || new Date(),
              updatedAt: convertTimestamp(sessionData.updatedAt) || new Date()
            } : {} as Session,
            project: projectData ? {
              id: projectData.id || sessionData?.projectId,
              userId: projectData.userId || postData.userId,
              name: projectData.name,
              description: projectData.description,
              icon: projectData.icon,
              color: projectData.color,
              weeklyTarget: projectData.weeklyTarget,
              totalTarget: projectData.totalTarget,
              status: projectData.status || 'active',
              createdAt: convertTimestamp(projectData.createdAt) || new Date(),
              updatedAt: convertTimestamp(projectData.updatedAt) || new Date()
            } : {} as Project
          };
        });
        
        const batchResults = await Promise.all(batchPromises);
        posts.push(...batchResults);
      }

      const hasMore = querySnapshot.docs.length > limitCount;
      const nextCursor = hasMore ? querySnapshot.docs[limitCount - 1]?.id : undefined;

      return {
        posts,
        hasMore,
        nextCursor
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get feed posts'));
    }
  },

  // Support a post
  supportPost: async (postId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const batch = writeBatch(db);

      // Add support relationship
      const supportId = `${auth.currentUser.uid}_${postId}`;
      batch.set(doc(db, 'postSupports', supportId), {
        postId,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      // Increment support count
      const postRef = doc(db, 'posts', postId);
      batch.update(postRef, {
        supportCount: increment(1),
        updatedAt: serverTimestamp()
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to support post'));
    }
  },

  // Remove support from a post
  removeSupport: async (postId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const batch = writeBatch(db);

      // Remove support relationship
      const supportId = `${auth.currentUser.uid}_${postId}`;
      batch.delete(doc(db, 'postSupports', supportId));

      // Decrement support count
      const postRef = doc(db, 'posts', postId);
      batch.update(postRef, {
        supportCount: increment(-1),
        updatedAt: serverTimestamp()
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to remove support'));
    }
  },

  // Update post
  updatePost: async (postId: string, data: UpdatePostData): Promise<Post> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'posts', postId), updateData);

      // Get updated post
      const postDoc = await getDoc(doc(db, 'posts', postId));
      const postData = postDoc.data()!;

      return {
        id: postId,
        sessionId: postData.sessionId,
        userId: postData.userId,
        content: postData.content,
        supportCount: postData.supportCount || 0,
        commentCount: postData.commentCount || 0,
        createdAt: convertTimestamp(postData.createdAt),
        updatedAt: convertTimestamp(postData.updatedAt)
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to update post'));
    }
  },

  // Delete post
  deletePost: async (postId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Verify post belongs to user
      const postDoc = await getDoc(doc(db, 'posts', postId));
      const postData = postDoc.data();
      
      if (!postData || postData.userId !== auth.currentUser.uid) {
        throw new Error('Post not found or access denied');
      }

      await deleteDoc(doc(db, 'posts', postId));
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to delete post'));
    }
  },

  // Listen to real-time updates for support counts
  listenToPostUpdates: (postIds: string[], callback: (updates: Record<string, { supportCount: number; isSupported: boolean }>) => void) => {
    if (!auth.currentUser) return () => {};

    const unsubscribers: (() => void)[] = [];

    postIds.forEach(postId => {
      // Listen to post support count changes
      const postUnsubscribe = onSnapshot(
        doc(db, 'posts', postId),
        (postDoc) => {
          if (postDoc.exists()) {
            const postData = postDoc.data();
            callback({
              [postId]: {
                supportCount: postData.supportCount || 0,
                isSupported: false // Will be updated by support listener
              }
            });
          }
        },
        (error) => {
          console.error(`Error listening to post ${postId}:`, error);
        }
      );

      // Listen to user's support status for this post
      const supportUnsubscribe = onSnapshot(
        doc(db, 'postSupports', `${auth.currentUser!.uid}_${postId}`),
        (supportDoc) => {
          callback({
            [postId]: {
              supportCount: 0, // Will be updated by post listener
              isSupported: supportDoc.exists()
            }
          });
        },
        (error) => {
          // Ignore errors for support docs that don't exist
          if (error.code !== 'permission-denied') {
            console.error(`Error listening to support for post ${postId}:`, error);
          }
        }
      );

      unsubscribers.push(postUnsubscribe, supportUnsubscribe);
    });

    // Return cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  },

  // Get user's posts
  getUserPosts: async (userId: string, limitCount: number = 20): Promise<PostWithDetails[]> => {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(postsQuery);
      const posts: PostWithDetails[] = [];

      // Process posts to populate data
      for (const postDoc of querySnapshot.docs) {
        const postData = postDoc.data();
        
        // Get user data
        const userDoc = await getDoc(doc(db, 'users', postData.userId));
        const userData = userDoc.data();
        
        // Get session data
        const sessionDoc = await getDoc(doc(db, 'sessions', postData.sessionId));
        const sessionData = sessionDoc.data();
        
        // Get project data
        let projectData = null;
        if (sessionData?.projectId) {
          const projectDoc = await getDoc(doc(db, 'projects', postData.userId, 'userProjects', sessionData.projectId));
          projectData = projectDoc.data();
        }

        posts.push({
          id: postDoc.id,
          sessionId: postData.sessionId,
          userId: postData.userId,
          content: postData.content,
          supportCount: postData.supportCount || 0,
          commentCount: postData.commentCount || 0,
          isSupported: false, // Will be updated based on current user
          createdAt: convertTimestamp(postData.createdAt),
          updatedAt: convertTimestamp(postData.updatedAt),
          user: {
            id: userData?.id || postData.userId,
            email: userData?.email || '',
            name: userData?.name || 'Unknown User',
            username: userData?.username || 'unknown',
            bio: userData?.bio,
            location: userData?.location,
            profilePicture: userData?.profilePicture,
            createdAt: convertTimestamp(userData?.createdAt) || new Date(),
            updatedAt: convertTimestamp(userData?.updatedAt) || new Date()
          },
          session: sessionData ? {
            id: sessionData.id || postData.sessionId,
            userId: sessionData.userId || postData.userId,
            projectId: sessionData.projectId,
            title: sessionData.title,
            description: sessionData.description,
            duration: sessionData.duration,
            startTime: convertTimestamp(sessionData.startTime),
            tasks: sessionData.tasks || [],
            tags: sessionData.tags || [],
            visibility: sessionData.visibility || 'everyone',
            howFelt: sessionData.howFelt,
            privateNotes: sessionData.privateNotes,
            isArchived: sessionData.isArchived || false,
            createdAt: convertTimestamp(sessionData.createdAt) || new Date(),
            updatedAt: convertTimestamp(sessionData.updatedAt) || new Date()
          } : {} as Session,
          project: projectData ? {
            id: projectData.id || sessionData?.projectId,
            userId: projectData.userId || postData.userId,
            name: projectData.name,
            description: projectData.description,
            icon: projectData.icon,
            color: projectData.color,
            weeklyTarget: projectData.weeklyTarget,
            totalTarget: projectData.totalTarget,
            status: projectData.status || 'active',
            createdAt: convertTimestamp(projectData.createdAt) || new Date(),
            updatedAt: convertTimestamp(projectData.updatedAt) || new Date()
          } : {} as Project
        });
      }

      return posts;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get user posts'));
    }
  }
};

// Export combined API
export const firebaseApi = {
  auth: firebaseAuthApi,
  user: firebaseUserApi,
  project: firebaseProjectApi,
  task: firebaseTaskApi,
  session: firebaseSessionApi,
  post: firebasePostApi
};

// Note: increment is imported from firebase/firestore above
