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
  SessionListResponse
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
      throw new Error(error.message || 'Login failed');
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
      throw new Error(error.message || 'Signup failed');
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
      // For now, return default stats since we don't have activity data yet
      // TODO: Implement proper activity tracking and stats calculation
      
      // Get activities for the current year (with error handling)
      let activitiesSnapshot;
      try {
        const currentYear = new Date().getFullYear();
        const activitiesQuery = query(
          collection(db, 'activities', userId, 'daily'),
          where('date', '>=', new Date(currentYear, 0, 1)),
          where('date', '<=', new Date(currentYear, 11, 31))
        );
        
        activitiesSnapshot = await getDocs(activitiesQuery);
      } catch (error) {
        // If activities collection doesn't exist or has permission issues, use empty snapshot
        console.log('No activities data found, using default stats');
        activitiesSnapshot = { forEach: () => {}, empty: true };
      }
      let totalHours = 0;
      let weeklyHours = 0;
      let monthlyHours = 0;
      let currentStreak = 0;
      let longestStreak = 0;
      let sessionsThisWeek = 0;
      let sessionsThisMonth = 0;
      
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      activitiesSnapshot.forEach(doc => {
        const data = doc.data();
        const hours = data.hours || 0;
        const sessions = data.sessions || 0;
        const date = convertTimestamp(data.date);
        
        totalHours += hours;
        
        if (date >= weekStart) {
          weeklyHours += hours;
          sessionsThisWeek += sessions;
        }
        
        if (date >= monthStart) {
          monthlyHours += hours;
          sessionsThisMonth += sessions;
        }
      });
      
      // Calculate streaks (simplified)
      currentStreak = Math.min(30, Math.floor(totalHours / 2)); // Mock calculation
      longestStreak = Math.max(currentStreak, 45); // Mock calculation
      
      return {
        totalHours,
        weeklyHours,
        monthlyHours,
        currentStreak,
        longestStreak,
        sessionsThisWeek,
        sessionsThisMonth,
        averageSessionDuration: sessionsThisMonth > 0 ? (monthlyHours * 60) / sessionsThisMonth : 0,
        mostProductiveHour: 14, // Mock data
        favoriteProject: {
          id: '1',
          name: 'Web Development',
          hours: totalHours * 0.6
        }
      };
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
      
      const tasksQuery = query(
        collection(db, 'projects', auth.currentUser.uid, 'userProjects', projectId, 'tasks'),
        orderBy('createdAt', 'desc')
      );
      
      const tasksSnapshot = await getDocs(tasksQuery);
      return tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
        completedAt: doc.data().completedAt ? convertTimestamp(doc.data().completedAt) : undefined,
      })) as Task[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get project tasks');
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
        status: 'pending',
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
      throw new Error(error.message || 'Failed to create task');
    }
  },

  // Update a task
  updateTask: async (id: string, data: UpdateTaskData, projectId: string): Promise<Task> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
        completedAt: data.status === 'completed' ? serverTimestamp() : null,
      };
      
      await updateDoc(
        doc(db, 'projects', auth.currentUser.uid, 'userProjects', projectId, 'tasks', id),
        updateData
      );
      
      // Return updated task (would need to fetch from DB for complete data)
      return {
        id,
        ...data,
        updatedAt: new Date(),
        completedAt: data.status === 'completed' ? new Date() : undefined,
      } as Task;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update task');
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
      throw new Error(error.message || 'Failed to bulk update tasks');
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

// Export combined API
export const firebaseApi = {
  auth: firebaseAuthApi,
  user: firebaseUserApi,
  project: firebaseProjectApi,
  task: firebaseTaskApi
};

// Note: increment is imported from firebase/firestore above
