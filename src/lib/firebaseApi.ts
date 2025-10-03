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
  increment,
  runTransaction
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
  User,
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
  BulkTaskUpdate,
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
  FeedFilters,
  Comment,
  CommentWithDetails,
  CreateCommentData,
  UpdateCommentData,
  CommentLike,
  CommentsResponse,
  Notification,
  Group,
  CreateGroupData,
  UpdateGroupData,
  GroupFilters,
  GroupMembership,
  GroupStats,
  GroupLeaderboard,
  GroupLeaderboardEntry,
  Challenge,
  CreateChallengeData,
  UpdateChallengeData,
  ChallengeFilters,
  ChallengeParticipant,
  ChallengeProgress,
  ChallengeLeaderboard,
  ChallengeLeaderboardEntry,
  ChallengeStats
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

// Helper function to manage social graph and friendship counts transactionally
const updateSocialGraph = async (currentUserId: string, targetUserId: string, action: 'follow' | 'unfollow') => {
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);

  const currentUserSocialGraphRef = doc(db, `social_graph/${currentUserId}/outbound`, targetUserId);
  const targetUserSocialGraphRef = doc(db, `social_graph/${targetUserId}/inbound`, currentUserId);

  try {
    await runTransaction(db, async (transaction) => {
      // ALL READS MUST HAPPEN FIRST before any writes
      const currentUserDoc = await transaction.get(currentUserRef);
      const targetUserDoc = await transaction.get(targetUserRef);
      const isFollowing = (await transaction.get(currentUserSocialGraphRef)).exists();
      const mutualCheckRef = doc(db, `social_graph/${targetUserId}/outbound`, currentUserId);
      const isMutualOrWasMutual = (await transaction.get(mutualCheckRef)).exists();

      if (!currentUserDoc.exists() || !targetUserDoc.exists()) {
        throw new Error('One or both users not found.');
      }

      const currentUserData = currentUserDoc.data();
      const targetUserData = targetUserDoc.data();

      if (action === 'follow' && isFollowing) return;
      if (action === 'unfollow' && !isFollowing) return;

      const now = new Date();
      const currentUserUpdate: any = { updatedAt: now };
      const targetUserUpdate: any = { updatedAt: now };

      // NOW DO ALL WRITES
      if (action === 'follow') {
        transaction.set(currentUserSocialGraphRef, { id: targetUserId, type: 'outbound', user: targetUserData, createdAt: now });
        transaction.set(targetUserSocialGraphRef, { id: currentUserId, type: 'inbound', user: currentUserData, createdAt: now });

        currentUserUpdate.outboundFriendshipCount = increment(1);
        targetUserUpdate.inboundFriendshipCount = increment(1);

        // Check for mutual friendship (using pre-read value)
        if (isMutualOrWasMutual) {
          currentUserUpdate.mutualFriendshipCount = increment(1);
          targetUserUpdate.mutualFriendshipCount = increment(1);
        }
      } else { // unfollow
        transaction.delete(currentUserSocialGraphRef);
        transaction.delete(targetUserSocialGraphRef);

        currentUserUpdate.outboundFriendshipCount = increment(-1);
        targetUserUpdate.inboundFriendshipCount = increment(-1);

        // Check for mutual friendship (using pre-read value)
        if (isMutualOrWasMutual) {
          currentUserUpdate.mutualFriendshipCount = increment(-1);
          targetUserUpdate.mutualFriendshipCount = increment(-1);
        }
      }

      transaction.update(currentUserRef, currentUserUpdate);
      transaction.update(targetUserRef, targetUserUpdate);
    });
  } catch (error: any) {
    throw new Error(error.message || `Failed to ${action} user.`);
  }
};

const PRIVATE_USER_FALLBACK_NAME = 'Private User';
const PRIVATE_USER_USERNAME_PREFIX = 'private';

const fetchUserDataForSocialContext = async (userId: string): Promise<DocumentData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }
    return userDoc.data();
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.code === 'not-found') {
      return null;
    }
    throw error;
  }
};

const buildCommentUserDetails = (userId: string, userData: DocumentData | null): User => {
  const fallbackUsername = `${PRIVATE_USER_USERNAME_PREFIX}-${userId.slice(0, 6)}`;
  const createdAt = userData?.createdAt ? convertTimestamp(userData.createdAt) : new Date();
  const updatedAt = userData?.updatedAt ? convertTimestamp(userData.updatedAt) : new Date();

  return {
    id: userId,
    email: userData?.email || '',
    name: userData?.name || PRIVATE_USER_FALLBACK_NAME,
    username: userData?.username || fallbackUsername,
    bio: userData?.bio,
    location: userData?.location,
    profilePicture: userData?.profilePicture,
    createdAt,
    updatedAt
  };
};

// Remove keys with undefined values. Firestore does not accept undefined in documents
const removeUndefinedFields = <T extends Record<string, any>>(input: T): T => {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as T;
};

// Helper function to populate sessions with user and project data
const populateSessionsWithDetails = async (sessionDocs: any[]): Promise<SessionWithDetails[]> => {
  const sessions: SessionWithDetails[] = [];
  const batchSize = 10;

  for (let i = 0; i < sessionDocs.length; i += batchSize) {
    const batch = sessionDocs.slice(i, i + batchSize);
    const batchPromises = batch.map(async (sessionDoc) => {
      const sessionData = sessionDoc.data();

      // Get user data
      const userDoc = await getDoc(doc(db, 'users', sessionData.userId));
      const userData = userDoc.data();

      // Get project data
      let projectData = null;
      const projectId = sessionData.projectId;
      if (projectId) {
        try {
          const projectDoc = await getDoc(doc(db, 'projects', sessionData.userId, 'userProjects', projectId));
          if (projectDoc.exists()) {
            projectData = projectDoc.data();
          }
        } catch (error) {
          console.error(`Error fetching project ${projectId}:`, error);
        }
      }

      // Check if current user has supported this session
      const supportDoc = await getDoc(doc(db, 'sessionSupports', `${auth.currentUser!.uid}_${sessionDoc.id}`));
      const isSupported = supportDoc.exists();

      // Build the session with full details
      const session: SessionWithDetails = {
        id: sessionDoc.id,
        userId: sessionData.userId,
        projectId: sessionData.projectId || '',
        title: sessionData.title || 'Untitled Session',
        description: sessionData.description || '',
        duration: sessionData.duration || 0,
        startTime: convertTimestamp(sessionData.startTime) || new Date(),
        tasks: sessionData.tasks || [],
        tags: sessionData.tags || [],
        visibility: sessionData.visibility || 'everyone',
        showStartTime: sessionData.showStartTime,
        hideTaskNames: sessionData.hideTaskNames,
        howFelt: sessionData.howFelt,
        privateNotes: sessionData.privateNotes,
        isArchived: sessionData.isArchived || false,
        supportCount: sessionData.supportCount || 0,
        commentCount: sessionData.commentCount || 0,
        isSupported,
        createdAt: convertTimestamp(sessionData.createdAt),
        updatedAt: convertTimestamp(sessionData.updatedAt),
        user: {
          id: sessionData.userId,
          email: userData?.email || '',
          name: userData?.name || 'Unknown User',
          username: userData?.username || 'unknown',
          bio: userData?.bio,
          location: userData?.location,
          profilePicture: userData?.profilePicture,
          createdAt: convertTimestamp(userData?.createdAt) || new Date(),
          updatedAt: convertTimestamp(userData?.updatedAt) || new Date()
        },
        project: projectData ? {
          id: projectId!,
          userId: sessionData.userId,
          name: projectData.name || 'Unknown Project',
          description: projectData.description || '',
          icon: projectData.icon || '📁',
          color: projectData.color || '#64748B',
          weeklyTarget: projectData.weeklyTarget,
          totalTarget: projectData.totalTarget,
          status: projectData.status || 'active',
          createdAt: convertTimestamp(projectData.createdAt) || new Date(),
          updatedAt: convertTimestamp(projectData.updatedAt) || new Date()
        } : {
          id: projectId || 'unknown',
          userId: sessionData.userId,
          name: 'Unknown Project',
          description: '',
          icon: '📁',
          color: '#64748B',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        } as Project
      };

      return session;
    });

    const batchResults = await Promise.all(batchPromises);
    sessions.push(...batchResults);
  }

  return sessions;
};

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
        inboundFriendshipCount: 0,
        outboundFriendshipCount: 0,
        mutualFriendshipCount: 0,
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
        profilePicture: undefined,
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
      const isOwnProfile = auth.currentUser?.uid === userDoc.id;
      
      // Check privacy settings
      const profileVisibility = userData.profileVisibility || 'everyone';
      
      // If profile is private and not the owner, deny access
      if (!isOwnProfile && profileVisibility === 'private') {
        throw new Error('This profile is private');
      }
      
      // Check if current user is following this user
      let isFollowing = false;
      if (auth.currentUser && !isOwnProfile) {
        const followDoc = await getDoc(doc(db, 'follows', `${auth.currentUser.uid}_${userDoc.id}`));
        isFollowing = followDoc.exists();
      }
      
      // If profile is followers-only, check if current user is a follower
      if (!isOwnProfile && profileVisibility === 'followers' && !isFollowing) {
        throw new Error('This profile is only visible to followers');
      }
      
      // Ensure follower/following counts are accurate
      // For OWN profile, always recalc from follows to avoid stale zeros across ports/domains
      // For others' profiles, recalc only if missing to reduce reads
      let followersCount = userData.followersCount || 0;
      let followingCount = userData.followingCount || 0;

      const shouldRecalculate = isOwnProfile || userData.followersCount === undefined || userData.followingCount === undefined;
      if (shouldRecalculate) {
        try {
          // Count followers (people who follow this user)
          const followersQuery = query(
            collection(db, 'follows'),
            where('followingId', '==', userDoc.id)
          );
          const followersSnapshot = await getDocs(followersQuery);
          followersCount = followersSnapshot.size;
          
          // Count following (people this user follows)
          const followingQuery = query(
            collection(db, 'follows'),
            where('followerId', '==', userDoc.id)
          );
          const followingSnapshot = await getDocs(followingQuery);
          followingCount = followingSnapshot.size;
          
          // Update the user document with correct counts
          // For own profile, always update to keep counts fresh
          // For others, update if they were missing
          if (isOwnProfile || userData.followersCount === undefined || userData.followingCount === undefined) {
            await updateDoc(doc(db, 'users', userDoc.id), {
              followersCount,
              followingCount,
              updatedAt: serverTimestamp()
            });
          }
        } catch (error) {
          console.warn('Failed to recalculate follower counts:', error);
          // Keep the default values if recalculation fails
        }
      }
      
      return {
        id: userDoc.id,
        username: userData.username,
        name: userData.name,
        bio: userData.bio,
        location: userData.location,
        profilePicture: userData.profilePicture,
        followersCount,
        followingCount,
        totalHours: userData.totalHours || 0,
        isFollowing,
        isPrivate: profileVisibility === 'private',
        createdAt: convertTimestamp(userData.createdAt),
        updatedAt: convertTimestamp(userData.updatedAt)
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get user profile');
    }
  },

  // Get user by ID (for loading group admins, etc.)
  getUserById: async (userId: string): Promise<User> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();

      return {
        id: userDoc.id,
        username: userData.username || '',
        name: userData.name || 'Unknown User',
        email: userData.email || '',
        bio: userData.bio,
        location: userData.location,
        profilePicture: userData.profilePicture,
        createdAt: convertTimestamp(userData.createdAt),
        updatedAt: convertTimestamp(userData.updatedAt)
      };
    } catch (error: any) {
      console.error('Failed to get user by ID:', error);
      throw new Error(error.message || 'Failed to get user');
    }
  },

  // Get daily activity for a given year (hours and sessions per day)
  getUserDailyActivity: async (userId: string, year: number): Promise<ActivityData[]> => {
    try {
      const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        where('startTime', '>=', Timestamp.fromDate(startOfYear)),
        where('startTime', '<=', Timestamp.fromDate(endOfYear))
      );

      const snapshot = await getDocs(sessionsQuery);

      const dayToTotals: Record<string, { seconds: number; sessions: number }> = {};

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const start: Date = convertTimestamp(data.startTime);
        const dateStr = start.toISOString().substring(0, 10);
        const durationSeconds = Number(data.duration) || 0;

        if (!dayToTotals[dateStr]) {
          dayToTotals[dateStr] = { seconds: 0, sessions: 0 };
        }
        dayToTotals[dateStr].seconds += durationSeconds;
        dayToTotals[dateStr].sessions += 1;
      });

      // Generate full year range with zeros where no data
      const results: ActivityData[] = [];
      for (let d = new Date(startOfYear); d <= endOfYear; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().substring(0, 10);
        const item = dayToTotals[dateStr];
        results.push({
          date: dateStr,
          hours: item ? item.seconds / 3600 : 0,
          sessions: item ? item.sessions : 0,
        });
      }

      return results;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get daily activity');
    }
  },

  // Get weekly activity for past N weeks (default 12)
  getUserWeeklyActivity: async (userId: string, numberOfWeeks: number = 12): Promise<WeeklyActivity[]> => {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - numberOfWeeks * 7);

      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        where('startTime', '>=', Timestamp.fromDate(start)),
        where('startTime', '<=', Timestamp.fromDate(end))
      );

      const snapshot = await getDocs(sessionsQuery);

      // Buckets keyed by ISO week number within the range
      const weekToTotals: Record<string, { seconds: number; sessions: number }> = {};

      const getWeekKey = (date: Date): string => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return `${d.getUTCFullYear()}-W${weekNo}`;
      };

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const startTime: Date = convertTimestamp(data.startTime);
        const key = getWeekKey(startTime);
        const durationSeconds = Number(data.duration) || 0;
        if (!weekToTotals[key]) weekToTotals[key] = { seconds: 0, sessions: 0 };
        weekToTotals[key].seconds += durationSeconds;
        weekToTotals[key].sessions += 1;
      });

      // Generate continuous sequence of weeks
      const results: WeeklyActivity[] = [];
      const iter = new Date(start);
      for (let i = 0; i < numberOfWeeks; i++) {
        const key = getWeekKey(iter);
        const item = weekToTotals[key];
        results.push({
          week: key,
          hours: item ? item.seconds / 3600 : 0,
          sessions: item ? item.sessions : 0,
        });
        iter.setDate(iter.getDate() + 7);
      }

      return results;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get weekly activity');
    }
  },

  // Get project breakdown (hours per project) for a given year
  getUserProjectBreakdown: async (userId: string, year?: number): Promise<ProjectBreakdown[]> => {
    try {
      let sessionsQueryBase = query(
        collection(db, 'sessions'),
        where('userId', '==', userId)
      );

      if (year) {
        const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
        sessionsQueryBase = query(
          collection(db, 'sessions'),
          where('userId', '==', userId),
          where('startTime', '>=', Timestamp.fromDate(startOfYear)),
          where('startTime', '<=', Timestamp.fromDate(endOfYear))
        );
      }

      const snapshot = await getDocs(sessionsQueryBase);

      // Aggregate seconds per projectId
      const projectToSeconds: Record<string, number> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const projectId = data.projectId || 'unknown';
        const durationSeconds = Number(data.duration) || 0;
        projectToSeconds[projectId] = (projectToSeconds[projectId] || 0) + durationSeconds;
      });

      const totalSeconds = Object.values(projectToSeconds).reduce((a, b) => a + b, 0) || 1;

      const results: ProjectBreakdown[] = [];
      // For each project, fetch project details for name/color
      for (const [projectId, seconds] of Object.entries(projectToSeconds)) {
        let name = 'Unknown Project';
        let color = '#64748B';
        try {
          const projectDoc = await getDoc(doc(db, 'projects', userId, 'userProjects', projectId));
          const proj = projectDoc.data();
          if (proj) {
            name = proj.name || name;
            color = proj.color || color;
          }
        } catch {}

        const hours = seconds / 3600;
        const percentage = (seconds / totalSeconds) * 100;
        results.push({ projectId, projectName: name, hours, percentage, color });
      }

      // Sort by hours desc
      results.sort((a, b) => b.hours - a.hours);
      return results;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get project breakdown');
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
        totalSessions: sessionsSnapshot.size,
        completedTasks: 0, // TODO: Implement task completion tracking
        activeProjects: 0, // TODO: Implement active project tracking
        averageSessionLength: averageSessionDuration,
        mostProductiveDay: 'Monday', // TODO: Calculate from actual data
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
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    await updateSocialGraph(auth.currentUser.uid, userId, 'follow');
  },

  // Unfollow user
  unfollowUser: async (userId: string): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    await updateSocialGraph(auth.currentUser.uid, userId, 'unfollow');
  },

  // Get followers for a user
  getFollowers: async (userId: string): Promise<User[]> => {
    try {
      // Get all inbound connections (people who follow this user)
      const inboundRef = collection(db, `social_graph/${userId}/inbound`);
      const inboundSnapshot = await getDocs(inboundRef);

      if (inboundSnapshot.empty) {
        return [];
      }

      // Get user details for all followers
      const followerIds = inboundSnapshot.docs.map(doc => doc.id);
      const followers: User[] = [];

      for (const followerId of followerIds) {
        const userDoc = await getDoc(doc(db, 'users', followerId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          followers.push({
            id: userDoc.id,
            username: userData.username,
            email: userData.email,
            name: userData.name,
            bio: userData.bio || '',
            profilePicture: userData.profilePicture,
            followersCount: userData.followersCount || 0,
            followingCount: userData.followingCount || 0,
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          });
        }
      }

      return followers;
    } catch (error: any) {
      console.error('Error fetching followers:', error);
      throw new Error(error.message || 'Failed to fetch followers');
    }
  },

  // Get following for a user
  getFollowing: async (userId: string): Promise<User[]> => {
    try {
      // Get all outbound connections (people this user follows)
      const outboundRef = collection(db, `social_graph/${userId}/outbound`);
      const outboundSnapshot = await getDocs(outboundRef);

      if (outboundSnapshot.empty) {
        return [];
      }

      // Get user details for all following
      const followingIds = outboundSnapshot.docs.map(doc => doc.id);
      const following: User[] = [];

      for (const followingId of followingIds) {
        const userDoc = await getDoc(doc(db, 'users', followingId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          following.push({
            id: userDoc.id,
            username: userData.username,
            email: userData.email,
            name: userData.name,
            bio: userData.bio || '',
            profilePicture: userData.profilePicture,
            followersCount: userData.followersCount || 0,
            followingCount: userData.followingCount || 0,
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          });
        }
      }

      return following;
    } catch (error: any) {
      console.error('Error fetching following:', error);
      throw new Error(error.message || 'Failed to fetch following');
    }
  },

  // Sync follower counts for a user (recalculate from follows collection)
  syncFollowerCounts: async (userId: string): Promise<{ followersCount: number; followingCount: number }> => {
    try {
      // Count followers (people who follow this user)
      const followersQuery = query(
        collection(db, 'follows'),
        where('followingId', '==', userId)
      );
      const followersSnapshot = await getDocs(followersQuery);
      const followersCount = followersSnapshot.size;
      
      // Count following (people this user follows)
      const followingQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', userId)
      );
      const followingSnapshot = await getDocs(followingQuery);
      const followingCount = followingSnapshot.size;
      
      // Update the user document with correct counts
      await updateDoc(doc(db, 'users', userId), {
        followersCount,
        followingCount,
        updatedAt: serverTimestamp()
      });
      
      return { followersCount, followingCount };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sync follower counts');
    }
  },

  // Search users by username and name (case-insensitive, prefix match)
  searchUsers: async (searchTerm: string, page: number = 1, limitCount: number = 20): Promise<{
    users: UserSearchResult[];
    totalCount: number;
    hasMore: boolean;
  }> => {
    try {
      const term = (searchTerm || '').trim();
      if (!term) {
        return { users: [], totalCount: 0, hasMore: false };
      }

      // 1) Search by username prefix
      const usernameQ = query(
        collection(db, 'users'),
        orderBy('username'),
        where('username', '>=', term),
        where('username', '<=', term + '\uf8ff'),
        limit(limitCount)
      );

      // 2) Search by name prefix (requires 'name' field present)
      const nameQ = query(
        collection(db, 'users'),
        orderBy('name'),
        where('name', '>=', term),
        where('name', '<=', term + '\uf8ff'),
        limit(limitCount)
      );

      const [usernameSnap, nameSnap] = await Promise.all([
        getDocs(usernameQ),
        getDocs(nameQ),
      ]);

      // Merge and de-duplicate results, prefer username matches first
      const byId: Record<string, UserSearchResult> = {};
      const pushDoc = (docSnap: any) => {
        const userData = docSnap.data();
        byId[docSnap.id] = {
          id: docSnap.id,
          username: userData.username,
          name: userData.name,
          bio: userData.bio,
          profilePicture: userData.profilePicture,
          followersCount: userData.followersCount || 0,
          isFollowing: false,
        } as UserSearchResult;
      };

      usernameSnap.forEach(pushDoc);
      nameSnap.forEach((d) => {
        if (!byId[d.id]) pushDoc(d);
      });

      // Convert to array and apply a basic relevance sort: exact prefix on username > name > others
      const users = Object.values(byId).sort((a, b) => {
        const t = term.toLowerCase();
        const aUser = a.username?.toLowerCase() || '';
        const bUser = b.username?.toLowerCase() || '';
        const aName = a.name?.toLowerCase() || '';
        const bName = b.name?.toLowerCase() || '';

        const aScore = (aUser.startsWith(t) ? 2 : 0) + (aName.startsWith(t) ? 1 : 0);
        const bScore = (bUser.startsWith(t) ? 2 : 0) + (bName.startsWith(t) ? 1 : 0);
        return bScore - aScore;
      }).slice(0, limitCount);

      return { users, totalCount: users.length, hasMore: users.length === limitCount };
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
      
      const projectData = removeUndefinedFields({
        ...data,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
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
      
      const updateData = removeUndefinedFields({
        ...data,
        updatedAt: serverTimestamp()
      });
      
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

      // Prepare session data for Firestore
      const sessionData = {
        userId: auth.currentUser.uid,
        projectId: data.projectId,
        title: data.title,
        description: data.description || '',
        duration: data.duration,
        startTime: Timestamp.fromDate(data.startTime),
        tasks: selectedTasks,
        tags: data.tags || [],
        visibility: data.visibility || 'private',
        showStartTime: data.showStartTime || false,
        hideTaskNames: data.hideTaskNames || false,
        publishToFeeds: data.publishToFeeds ?? true,
        howFelt: data.howFelt,
        privateNotes: data.privateNotes || '',
        isArchived: false,
        // Social engagement fields (sessions ARE posts)
        supportCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'sessions'), sessionData);

      // Update challenge progress for this session
      try {
        await firebaseChallengeApi.updateChallengeProgress(auth.currentUser.uid, {
          ...sessionData,
          id: docRef.id,
          startTime: data.startTime,
          tasks: selectedTasks
        });
      } catch (error) {
        console.warn('Failed to update challenge progress:', error);
        // Don't fail session creation if challenge update fails
      }

      // Return session with proper structure
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
        // Social engagement fields (sessions ARE posts)
        supportCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Session created successfully:', newSession);
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
      console.log('Creating session with post:', { sessionData, postContent, visibility });
      
      // Create session first with the correct visibility
      const session = await firebaseSessionApi.createSession({
        ...sessionData,
        visibility
      });
      
      console.log('Session created:', session);

      let post: Post | undefined;
      
      // Create post if not private
      if (visibility !== 'private') {
        console.log('Creating post for session:', session.id);
        post = await firebasePostApi.createPost({
          sessionId: session.id,
          content: postContent,
          visibility
        });
        console.log('Post created:', post);
      }

      return { session, post };
    } catch (error: any) {
      console.error('Error in createSessionWithPost:', error);
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

  // Get user's sessions with populated data (for display as posts)
  getUserSessions: async (
    userId: string, 
    limitCount: number = 20, 
    isOwnProfile: boolean = false
  ): Promise<Array<Session & { user: User; project: Project }>> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      let sessionsQuery;
      
      if (isOwnProfile) {
        // Show all sessions for own profile
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } else {
        // Show only public sessions for other profiles
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('userId', '==', userId),
          where('visibility', '==', 'everyone'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(sessionsQuery);
      const sessions: Array<Session & { user: User; project: Project }> = [];

      // Get user data once (since all sessions are from the same user)
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      const user: User = {
        id: userId,
        email: userData?.email || '',
        name: userData?.name || 'Unknown User',
        username: userData?.username || 'unknown',
        bio: userData?.bio,
        location: userData?.location,
        profilePicture: userData?.profilePicture,
        createdAt: convertTimestamp(userData?.createdAt) || new Date(),
        updatedAt: convertTimestamp(userData?.updatedAt) || new Date()
      };

      // Process each session
      for (const sessionDoc of querySnapshot.docs) {
        const sessionData = sessionDoc.data();
        
        // Get project data
        let projectData = null;
        const projectId = sessionData.projectId;
        if (projectId) {
          try {
            const projectDoc = await getDoc(doc(db, 'projects', userId, 'userProjects', projectId));
            if (projectDoc.exists()) {
              projectData = projectDoc.data();
            }
          } catch (error) {
            console.error(`Error fetching project ${projectId}:`, error);
          }
        }

        const project: Project = projectData ? {
          id: projectId,
          userId: userId,
          name: projectData.name || 'Unknown Project',
          description: projectData.description || '',
          icon: projectData.icon || '📁',
          color: projectData.color || '#64748B',
          weeklyTarget: projectData.weeklyTarget,
          totalTarget: projectData.totalTarget,
          status: projectData.status || 'active',
          createdAt: convertTimestamp(projectData.createdAt) || new Date(),
          updatedAt: convertTimestamp(projectData.updatedAt) || new Date()
        } : {
          id: projectId || 'unknown',
          userId: userId,
          name: 'Unknown Project',
          description: '',
          icon: '📁',
          color: '#64748B',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        sessions.push({
          id: sessionDoc.id,
          userId: sessionData.userId,
          projectId: sessionData.projectId || '',
          title: sessionData.title || 'Untitled Session',
          description: sessionData.description || '',
          duration: sessionData.duration || 0,
          startTime: convertTimestamp(sessionData.startTime) || new Date(),
          tasks: sessionData.tasks || [],
          tags: sessionData.tags || [],
          visibility: sessionData.visibility || 'everyone',
          showStartTime: sessionData.showStartTime,
          hideTaskNames: sessionData.hideTaskNames,
          publishToFeeds: sessionData.publishToFeeds,
          howFelt: sessionData.howFelt,
          privateNotes: sessionData.privateNotes,
          isArchived: sessionData.isArchived || false,
          createdAt: convertTimestamp(sessionData.createdAt) || new Date(),
          updatedAt: convertTimestamp(sessionData.updatedAt) || new Date(),
          user,
          project
        });
      }

      console.log(`Found ${sessions.length} sessions for user ${userId}`);
      return sessions;
    } catch (error: any) {
      console.error('Failed to get user sessions:', error);
      throw new Error(getErrorMessage(error, 'Failed to get user sessions'));
    }
  },

  // Get count of user's sessions (for profile stats)
  getUserSessionsCount: async (userId: string, isOwnProfile: boolean = false): Promise<number> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      let sessionsQuery;
      
      if (isOwnProfile) {
        // Count all sessions for own profile
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('userId', '==', userId)
        );
      } else {
        // Count only public sessions for other profiles
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('userId', '==', userId),
          where('visibility', '==', 'everyone')
        );
      }

      const querySnapshot = await getDocs(sessionsQuery);
      return querySnapshot.size;
    } catch (error: any) {
      console.error('Failed to get user sessions count:', error);
      return 0;
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
  },

  // Delete a session
  deleteSession: async (sessionId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists() || sessionDoc.data().userId !== auth.currentUser.uid) {
        throw new Error('Session not found or permission denied');
      }

      await deleteDoc(sessionRef);
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to delete session'));
    }
  }
};

// Helper function to process post documents into PostWithDetails
const processPosts = async (postDocs: any[]): Promise<PostWithDetails[]> => {
  const posts: PostWithDetails[] = [];
  const batchSize = 10;

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
      let projectId = sessionData?.projectId;
      if (projectId) {
        try {
          const projectDoc = await getDoc(doc(db, 'projects', postData.userId, 'userProjects', projectId));
          if (projectDoc.exists()) {
            projectData = projectDoc.data();
          }
        } catch (error) {
          console.error(`Error fetching project ${projectId}:`, error);
        }
      }

      // Check if current user has supported this post
      const supportDoc = auth.currentUser ? await getDoc(doc(db, 'postSupports', `${auth.currentUser.uid}_${postDoc.id}`)) : null;
      const isSupported = supportDoc?.exists() || false;

      // Build the post with full details
      const post: PostWithDetails = {
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
          id: postData.userId,
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
          id: postData.sessionId,
          userId: postData.userId,
          projectId: sessionData.projectId || '',
          title: sessionData.title || 'Untitled Session',
          description: sessionData.description || '',
          duration: sessionData.duration || 0,
          startTime: convertTimestamp(sessionData.startTime) || new Date(),
          tasks: sessionData.tasks || [],
          tags: sessionData.tags || [],
          visibility: sessionData.visibility || 'everyone',
          showStartTime: sessionData.showStartTime,
          hideTaskNames: sessionData.hideTaskNames,
          publishToFeeds: sessionData.publishToFeeds,
          howFelt: sessionData.howFelt,
          privateNotes: sessionData.privateNotes,
          isArchived: sessionData.isArchived || false,
          createdAt: convertTimestamp(sessionData.createdAt) || new Date(),
          updatedAt: convertTimestamp(sessionData.updatedAt) || new Date()
        } : {
          id: postData.sessionId,
          userId: postData.userId,
          projectId: '',
          title: 'Session Not Found',
          description: '',
          duration: 0,
          startTime: new Date(),
          tasks: [],
          tags: [],
          visibility: 'everyone',
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date()
        } as Session,
        project: projectData ? {
          id: projectId!,
          userId: postData.userId,
          name: projectData.name || 'Unknown Project',
          description: projectData.description || '',
          icon: projectData.icon || '📁',
          color: projectData.color || '#64748B',
          weeklyTarget: projectData.weeklyTarget,
          totalTarget: projectData.totalTarget,
          status: projectData.status || 'active',
          createdAt: convertTimestamp(projectData.createdAt) || new Date(),
          updatedAt: convertTimestamp(projectData.updatedAt) || new Date()
        } : {
          id: projectId || 'unknown',
          userId: postData.userId,
          name: 'Unknown Project',
          description: '',
          icon: '📁',
          color: '#64748B',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        } as Project
      };

      return post;
    });

    const batchResults = await Promise.all(batchPromises);
    posts.push(...batchResults);
  }

  return posts;
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
        userId: auth.currentUser.uid,
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

  // Get sessions for feed (Strava-like - sessions are the content)
  getFeedSessions: async (
    limitCount: number = 20,
    cursor?: string,
    filters: FeedFilters = {}
  ): Promise<FeedResponse> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      let sessionsQuery;
      const { type = 'recent', userId, projectId } = filters;

      // Handle different feed types - fetch from sessions collection
      if (type === 'following') {
        // Get list of users the current user is following
        const followingQuery = query(
          collection(db, 'follows'),
          where('followerId', '==', auth.currentUser.uid)
        );
        const followingSnapshot = await getDocs(followingQuery);
        const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);

        // Include current user's sessions too
        followingIds.push(auth.currentUser.uid);

        // If not following anyone yet, return empty feed
        if (followingIds.length === 1 && followingIds[0] === auth.currentUser.uid) {
          // Only show current user's sessions
          sessionsQuery = query(
            collection(db, 'sessions'),
            where('userId', '==', auth.currentUser.uid),
            where('visibility', 'in', ['everyone', 'followers']),
            orderBy('createdAt', 'desc'),
            limit(limitCount + 1)
          );
        } else {
          // Fetch sessions from followed users
          // Due to Firestore limitations, fetch all and filter
          sessionsQuery = query(
            collection(db, 'sessions'),
            where('visibility', 'in', ['everyone', 'followers']),
            orderBy('createdAt', 'desc'),
            limit(limitCount * 3) // Fetch more to account for filtering
          );
        }

        if (cursor) {
          const cursorDoc = await getDoc(doc(db, 'sessions', cursor));
          if (cursorDoc.exists()) {
            if (followingIds.length === 1) {
              sessionsQuery = query(
                collection(db, 'sessions'),
                where('userId', '==', auth.currentUser.uid),
                where('visibility', 'in', ['everyone', 'followers']),
                orderBy('createdAt', 'desc'),
                startAfter(cursorDoc),
                limit(limitCount + 1)
              );
            } else {
              sessionsQuery = query(
                collection(db, 'sessions'),
                where('visibility', 'in', ['everyone', 'followers']),
                orderBy('createdAt', 'desc'),
                startAfter(cursorDoc),
                limit(limitCount * 3)
              );
            }
          }
        }

        const querySnapshot = await getDocs(sessionsQuery);
        // Filter to only sessions from followed users
        const filteredDocs = querySnapshot.docs.filter(doc =>
          followingIds.includes(doc.data().userId)
        ).slice(0, limitCount + 1);

        const sessions = await populateSessionsWithDetails(filteredDocs.slice(0, limitCount));
        const hasMore = filteredDocs.length > limitCount;
        const nextCursor = hasMore ? filteredDocs[limitCount - 1]?.id : undefined;

        return { sessions, hasMore, nextCursor };

      } else if (type === 'trending') {
        // Trending: fetch recent public sessions
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        sessionsQuery = query(
          collection(db, 'sessions'),
          where('visibility', '==', 'everyone'),
          where('createdAt', '>=', sevenDaysAgo),
          orderBy('createdAt', 'desc'),
          limit(100) // Fetch more for sorting
        );

        const querySnapshot = await getDocs(sessionsQuery);

        // For trending, we'd ideally sort by engagement, but since sessions don't have
        // support/comment counts directly, we'll just show recent public sessions
        // In a production app, you'd maintain engagement scores on sessions
        const sessionDocs = querySnapshot.docs;

        // Apply cursor if provided
        let startIndex = 0;
        if (cursor) {
          startIndex = sessionDocs.findIndex(doc => doc.id === cursor) + 1;
        }

        const paginatedDocs = sessionDocs.slice(startIndex, startIndex + limitCount + 1);
        const sessions = await populateSessionsWithDetails(paginatedDocs.slice(0, limitCount));
        const hasMore = paginatedDocs.length > limitCount;
        const nextCursor = hasMore ? paginatedDocs[limitCount - 1]?.id : undefined;

        return { sessions, hasMore, nextCursor };

      } else {
        // Recent: default chronological feed of public sessions
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('visibility', '==', 'everyone'),
          orderBy('createdAt', 'desc'),
          limit(limitCount + 1)
        );

        if (cursor) {
          const cursorDoc = await getDoc(doc(db, 'sessions', cursor));
          if (cursorDoc.exists()) {
            sessionsQuery = query(
              collection(db, 'sessions'),
              where('visibility', '==', 'everyone'),
              orderBy('createdAt', 'desc'),
              startAfter(cursorDoc),
              limit(limitCount + 1)
            );
          }
        }
      }

      const querySnapshot = await getDocs(sessionsQuery);
      const sessionDocs = querySnapshot.docs.slice(0, limitCount);

      const sessions = await populateSessionsWithDetails(sessionDocs);
      const hasMore = querySnapshot.docs.length > limitCount;
      const nextCursor = hasMore ? querySnapshot.docs[limitCount - 1]?.id : undefined;

      return {
        sessions,
        hasMore,
        nextCursor
      };
    } catch (error: any) {
      console.error('Error in getFeedSessions:', error);
      throw new Error(getErrorMessage(error, 'Failed to get feed sessions'));
    }
  },

  // Support a session (like/kudos)
  supportSession: async (sessionId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const batch = writeBatch(db);

      // Add support relationship
      const supportId = `${auth.currentUser.uid}_${sessionId}`;
      batch.set(doc(db, 'sessionSupports', supportId), {
        sessionId,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      // Increment support count on the session
      const sessionRef = doc(db, 'sessions', sessionId);
      batch.update(sessionRef, {
        supportCount: increment(1),
        updatedAt: serverTimestamp()
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to support session'));
    }
  },

  // Remove support from a session
  removeSupportFromSession: async (sessionId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const batch = writeBatch(db);

      // Remove support relationship
      const supportId = `${auth.currentUser.uid}_${sessionId}`;
      batch.delete(doc(db, 'sessionSupports', supportId));

      // Decrement support count on the session
      const sessionRef = doc(db, 'sessions', sessionId);
      batch.update(sessionRef, {
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

  // Listen to real-time updates for session support counts
  listenToSessionUpdates: (sessionIds: string[], callback: (updates: Record<string, { supportCount: number; isSupported: boolean }>) => void) => {
    if (!auth.currentUser) return () => {};

    const unsubscribers: (() => void)[] = [];

    sessionIds.forEach(sessionId => {
      // Listen to session support count changes
      const sessionUnsubscribe = onSnapshot(
        doc(db, 'sessions', sessionId),
        (sessionDoc) => {
          if (sessionDoc.exists()) {
            const sessionData = sessionDoc.data();
            callback({
              [sessionId]: {
                supportCount: sessionData.supportCount || 0,
                isSupported: false // Will be updated by support listener
              }
            });
          }
        },
        (error) => {
          console.error(`Error listening to session ${sessionId}:`, error);
        }
      );

      // Listen to user's support status for this session
      const supportUnsubscribe = onSnapshot(
        doc(db, 'sessionSupports', `${auth.currentUser!.uid}_${sessionId}`),
        (supportDoc) => {
          callback({
            [sessionId]: {
              supportCount: 0, // Will be updated by session listener
              isSupported: supportDoc.exists()
            }
          });
        },
        (error) => {
          // Ignore errors for support docs that don't exist
          if (error.code !== 'permission-denied') {
            console.error(`Error listening to support for session ${sessionId}:`, error);
          }
        }
      );

      unsubscribers.push(sessionUnsubscribe, supportUnsubscribe);
    });

    // Return cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  },

  // Get user's posts
  getUserPosts: async (userId: string, limitCount: number = 20, isOwnProfile: boolean = false): Promise<PostWithDetails[]> => {
    try {
      let postsQuery;
      
      if (isOwnProfile) {
        // Show all posts for own profile
        postsQuery = query(
          collection(db, 'posts'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } else {
        // Show only public posts for other profiles
        postsQuery = query(
          collection(db, 'posts'),
          where('userId', '==', userId),
          where('visibility', '==', 'everyone'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

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
        let projectId = sessionData?.projectId;
        if (projectId) {
          try {
            const projectDoc = await getDoc(doc(db, 'projects', postData.userId, 'userProjects', projectId));
            if (projectDoc.exists()) {
              projectData = projectDoc.data();
            }
          } catch (error) {
            console.error(`Error fetching project ${projectId}:`, error);
          }
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
            id: postData.userId,
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
            id: postData.sessionId,
            userId: postData.userId,
            projectId: sessionData.projectId || '',
            title: sessionData.title || 'Untitled Session',
            description: sessionData.description || '',
            duration: sessionData.duration || 0,
            startTime: convertTimestamp(sessionData.startTime) || new Date(),
            tasks: sessionData.tasks || [],
            tags: sessionData.tags || [],
            visibility: sessionData.visibility || 'everyone',
            showStartTime: sessionData.showStartTime,
            hideTaskNames: sessionData.hideTaskNames,
            publishToFeeds: sessionData.publishToFeeds,
            howFelt: sessionData.howFelt,
            privateNotes: sessionData.privateNotes,
            isArchived: sessionData.isArchived || false,
            createdAt: convertTimestamp(sessionData.createdAt) || new Date(),
            updatedAt: convertTimestamp(sessionData.updatedAt) || new Date()
          } : {
            id: postData.sessionId,
            userId: postData.userId,
            projectId: '',
            title: 'Session Not Found',
            description: '',
            duration: 0,
            startTime: new Date(),
            tasks: [],
            tags: [],
            visibility: 'everyone',
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date()
          } as Session,
          project: projectData ? {
            id: projectId!,
            userId: postData.userId,
            name: projectData.name || 'Unknown Project',
            description: projectData.description || '',
            icon: projectData.icon || '📁',
            color: projectData.color || '#64748B',
            weeklyTarget: projectData.weeklyTarget,
            totalTarget: projectData.totalTarget,
            status: projectData.status || 'active',
            createdAt: convertTimestamp(projectData.createdAt) || new Date(),
            updatedAt: convertTimestamp(projectData.updatedAt) || new Date()
          } : {
            id: projectId || 'unknown',
            userId: postData.userId,
            name: 'Unknown Project',
            description: '',
            icon: '📁',
            color: '#64748B',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          } as Project
        });
      }

      return posts;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get user posts'));
    }
  }
};

// Firebase Comment API
export const firebaseCommentApi = {
  // Create a comment
  createComment: async (data: CreateCommentData): Promise<CommentWithDetails> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;
      
      // Extract mentions from content
      const mentionRegex = /@(\w+)/g;
      const mentions = [...data.content.matchAll(mentionRegex)].map(match => match[1]);
      
      const commentData = {
        sessionId: data.sessionId,
        userId,
        parentId: data.parentId,
        content: data.content,
        likeCount: 0,
        replyCount: 0,
        isEdited: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'comments'), commentData);

      // Increment comment count on session
      const sessionRef = doc(db, 'sessions', data.sessionId);
      await updateDoc(sessionRef, {
        commentCount: increment(1)
      });
      
      // If this is a reply, increment reply count on parent comment
      if (data.parentId) {
        const parentCommentRef = doc(db, 'comments', data.parentId);
        await updateDoc(parentCommentRef, {
          replyCount: increment(1)
        });
      }
      
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      // Create notifications for mentions
      if (mentions.length > 0) {
        // Get users by username
        const usersQuery = query(
          collection(db, 'users'),
          where('username', 'in', mentions)
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        const notificationPromises = usersSnapshot.docs.map(async (userDoc) => {
          const mentionedUserId = userDoc.id;
          if (mentionedUserId !== userId) {
            // Create notification
            await addDoc(collection(db, 'notifications'), {
              userId: mentionedUserId,
              type: 'mention',
              title: 'New mention',
              message: `${userData?.name} mentioned you in a comment`,
              linkUrl: `/posts/${data.postId}`,
              actorId: userId,
              postId: data.postId,
              commentId: docRef.id,
              isRead: false,
              createdAt: serverTimestamp()
            });
          }
        });
        
        await Promise.all(notificationPromises);
      }
      
      // Create notification for post owner (if not commenting on own post)
      if (!data.parentId) {
        const postDoc = await getDoc(postRef);
        const postData = postDoc.data();
        
        if (postData && postData.userId !== userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: postData.userId,
            type: 'comment',
            title: 'New comment',
            message: `${userData?.name} commented on your post`,
            linkUrl: `/posts/${data.postId}`,
            actorId: userId,
            postId: data.postId,
            commentId: docRef.id,
            isRead: false,
            createdAt: serverTimestamp()
          });
        }
      } else {
        // Create notification for parent comment owner (if replying to someone else)
        const parentCommentDoc = await getDoc(doc(db, 'comments', data.parentId));
        const parentCommentData = parentCommentDoc.data();
        
        if (parentCommentData && parentCommentData.userId !== userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: parentCommentData.userId,
            type: 'reply',
            title: 'New reply',
            message: `${userData?.name} replied to your comment`,
            linkUrl: `/posts/${data.postId}`,
            actorId: userId,
            postId: data.postId,
            commentId: docRef.id,
            isRead: false,
            createdAt: serverTimestamp()
          });
        }
      }
      
      return {
        id: docRef.id,
        postId: data.postId,
        userId,
        parentId: data.parentId,
        content: data.content,
        likeCount: 0,
        replyCount: 0,
        isLiked: false,
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: buildCommentUserDetails(userId, userData || null)
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to create comment'));
    }
  },

  // Update a comment
  updateComment: async (commentId: string, data: UpdateCommentData): Promise<Comment> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const commentRef = doc(db, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (!commentDoc.exists()) {
        throw new Error('Comment not found');
      }
      
      const commentData = commentDoc.data();
      
      if (commentData.userId !== auth.currentUser.uid) {
        throw new Error('Not authorized to edit this comment');
      }
      
      await updateDoc(commentRef, {
        content: data.content,
        isEdited: true,
        updatedAt: serverTimestamp()
      });
      
      return {
        id: commentId,
        ...commentData,
        content: data.content,
        isEdited: true,
        createdAt: convertTimestamp(commentData.createdAt),
        updatedAt: new Date()
      } as Comment;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to update comment'));
    }
  },

  // Delete a comment
  deleteComment: async (commentId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const commentRef = doc(db, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (!commentDoc.exists()) {
        throw new Error('Comment not found');
      }
      
      const commentData = commentDoc.data();
      
      if (commentData.userId !== auth.currentUser.uid) {
        throw new Error('Not authorized to delete this comment');
      }
      
      // Delete all replies to this comment
      const repliesQuery = query(
        collection(db, 'comments'),
        where('parentId', '==', commentId)
      );
      const repliesSnapshot = await getDocs(repliesQuery);
      
      const batch = writeBatch(db);
      
      repliesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      batch.delete(commentRef);
      
      await batch.commit();

      // Decrement comment count on session
      const sessionRef = doc(db, 'sessions', commentData.sessionId);
      await updateDoc(sessionRef, {
        commentCount: increment(-1 - repliesSnapshot.size) // -1 for the comment itself, and -repliesSnapshot.size for replies
      });
      
      // If this is a reply, decrement reply count on parent comment
      if (commentData.parentId) {
        const parentCommentRef = doc(db, 'comments', commentData.parentId);
        await updateDoc(parentCommentRef, {
          replyCount: increment(-1)
        });
      }
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to delete comment'));
    }
  },

  // Like a comment
  likeComment: async (commentId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;
      const likeId = `${userId}_${commentId}`;
      const likeRef = doc(db, 'commentLikes', likeId);
      
      const likeDoc = await getDoc(likeRef);
      
      if (likeDoc.exists()) {
        throw new Error('Already liked this comment');
      }
      
      await setDoc(likeRef, {
        commentId,
        userId,
        createdAt: serverTimestamp()
      });
      
      // Increment like count on comment
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        likeCount: increment(1)
      });
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to like comment'));
    }
  },

  // Unlike a comment
  unlikeComment: async (commentId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;
      const likeId = `${userId}_${commentId}`;
      const likeRef = doc(db, 'commentLikes', likeId);
      
      const likeDoc = await getDoc(likeRef);
      
      if (!likeDoc.exists()) {
        throw new Error('Comment not liked');
      }
      
      await deleteDoc(likeRef);
      
      // Decrement like count on comment
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        likeCount: increment(-1)
      });
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to unlike comment'));
    }
  },

  // Get comments for a post (with pagination)
  // Get comments for a session (sessions ARE posts in the new architecture)
  getSessionComments: async (
    sessionId: string,
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<CommentsResponse> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;

      // Get top-level comments (no parentId)
      let q;

      if (lastDoc) {
        q = query(
          collection(db, 'comments'),
          where('sessionId', '==', sessionId),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(limitCount + 1)
        );
      } else {
        q = query(
          collection(db, 'comments'),
          where('sessionId', '==', sessionId),
          orderBy('createdAt', 'desc'),
          limit(limitCount + 1)
        );
      }

      const snapshot = await getDocs(q);

      // Filter for top-level comments only (no parentId)
      const topLevelDocs = snapshot.docs.filter(doc => !doc.data().parentId);

      const hasMore = topLevelDocs.length > limitCount;
      const docs = hasMore ? topLevelDocs.slice(0, -1) : topLevelDocs;

      // Get all comment likes for current user in one query
      const commentIds = docs.map(d => d.id);
      let likedCommentIds = new Set<string>();
      if (commentIds.length > 0) {
        const likesQuery = query(
          collection(db, 'commentLikes'),
          where('userId', '==', userId),
          where('commentId', 'in', commentIds)
        );
        const likesSnapshot = await getDocs(likesQuery);
        likedCommentIds = new Set(likesSnapshot.docs.map(d => d.data().commentId));
      }

      // Build comments with user details
      const comments: CommentWithDetails[] = await Promise.all(
        docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();

          const userData = await fetchUserDataForSocialContext(data.userId);

          return {
            id: docSnapshot.id,
            sessionId: data.sessionId,
            userId: data.userId,
            parentId: data.parentId,
            content: data.content,
            likeCount: data.likeCount || 0,
            replyCount: data.replyCount || 0,
            isLiked: likedCommentIds.has(docSnapshot.id),
            isEdited: data.isEdited || false,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            user: buildCommentUserDetails(data.userId, userData)
          };
        })
      );

      return {
        comments,
        hasMore
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get session comments'));
    }
  },

  getPostComments: async (
    postId: string,
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<CommentsResponse> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;

      // Get top-level comments (no parentId)
      // Note: Firestore doesn't support querying for undefined, so we check for both null and absence
      let q;

      if (lastDoc) {
        q = query(
          collection(db, 'comments'),
          where('postId', '==', postId),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(limitCount + 1)
        );
      } else {
        q = query(
          collection(db, 'comments'),
          where('postId', '==', postId),
          orderBy('createdAt', 'desc'),
          limit(limitCount + 1)
        );
      }
      
      const snapshot = await getDocs(q);
      
      // Filter for top-level comments only (no parentId)
      const topLevelDocs = snapshot.docs.filter(doc => !doc.data().parentId);
      
      const hasMore = topLevelDocs.length > limitCount;
      const docs = hasMore ? topLevelDocs.slice(0, -1) : topLevelDocs;
      
      // Get all comment likes for current user in one query
      const commentIds = docs.map(d => d.id);
      let likedCommentIds = new Set<string>();
      if (commentIds.length > 0) {
        const likesQuery = query(
          collection(db, 'commentLikes'),
          where('userId', '==', userId),
          where('commentId', 'in', commentIds)
        );
        const likesSnapshot = await getDocs(likesQuery);
        likedCommentIds = new Set(likesSnapshot.docs.map(d => d.data().commentId));
      }
      
      // Build comments with user details
      const comments: CommentWithDetails[] = await Promise.all(
        docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          
          const userData = await fetchUserDataForSocialContext(data.userId);

          return {
            id: docSnapshot.id,
            postId: data.postId,
            userId: data.userId,
            parentId: data.parentId,
            content: data.content,
            likeCount: data.likeCount || 0,
            replyCount: data.replyCount || 0,
            isLiked: likedCommentIds.has(docSnapshot.id),
            isEdited: data.isEdited || false,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            user: buildCommentUserDetails(data.userId, userData)
          };
        })
      );
      
      return {
        comments,
        hasMore,
        nextCursor: hasMore ? docs[docs.length - 1].id : undefined
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get comments'));
    }
  },

  // Get replies for a comment
  getReplies: async (commentId: string): Promise<CommentWithDetails[]> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;
      
      const q = query(
        collection(db, 'comments'),
        where('parentId', '==', commentId),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(q);
      
      // Get all comment likes for current user in one query
      const commentIds = snapshot.docs.map(d => d.id);
      let likedCommentIds = new Set<string>();
      if (commentIds.length > 0) {
        const likesQuery = query(
          collection(db, 'commentLikes'),
          where('userId', '==', userId),
          where('commentId', 'in', commentIds)
        );
        const likesSnapshot = await getDocs(likesQuery);
        likedCommentIds = new Set(likesSnapshot.docs.map(d => d.data().commentId));
      }
      
      const replies: CommentWithDetails[] = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          
          const userData = await fetchUserDataForSocialContext(data.userId);

          return {
            id: docSnapshot.id,
            postId: data.postId,
            userId: data.userId,
            parentId: data.parentId,
            content: data.content,
            likeCount: data.likeCount || 0,
            replyCount: data.replyCount || 0,
            isLiked: likedCommentIds.has(docSnapshot.id),
            isEdited: data.isEdited || false,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            user: buildCommentUserDetails(data.userId, userData)
          };
        })
      );
      
      return replies;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get replies'));
    }
  }
};

// ==================== GROUP API ====================

const firebaseGroupApi = {
  // Create a new group
  createGroup: async (data: CreateGroupData, userId: string): Promise<Group> => {
    try {
      const groupData = {
        ...data,
        createdByUserId: userId,
        adminUserIds: [userId],
        memberIds: [userId],
        memberCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'groups'), groupData);
      
      // Create membership record
      await addDoc(collection(db, 'groupMemberships'), {
        groupId: docRef.id,
        userId,
        role: 'admin',
        status: 'active',
        joinedAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        ...data,
        createdByUserId: userId,
        adminUserIds: [userId],
        memberIds: [userId],
        memberCount: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to create group'));
    }
  },

  // Get a group by ID
  getGroup: async (groupId: string): Promise<Group | null> => {
    try {
      const docRef = doc(db, 'groups', groupId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        bannerUrl: data.bannerUrl,
        location: data.location,
        category: data.category,
        type: data.type,
        privacySetting: data.privacySetting,
        memberCount: data.memberCount,
        adminUserIds: data.adminUserIds,
        memberIds: data.memberIds,
        createdByUserId: data.createdByUserId,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt)
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get group'));
    }
  },

  // Update a group
  updateGroup: async (groupId: string, data: UpdateGroupData): Promise<Group> => {
    try {
      const docRef = doc(db, 'groups', groupId);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
      
      // Get updated group
      const updatedGroup = await firebaseGroupApi.getGroup(groupId);
      if (!updatedGroup) {
        throw new Error('Group not found after update');
      }

      return updatedGroup;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to update group'));
    }
  },

  // Delete a group
  deleteGroup: async (groupId: string): Promise<void> => {
    try {
      // Delete group memberships first
      const membershipsQuery = query(
        collection(db, 'groupMemberships'),
        where('groupId', '==', groupId)
      );
      const membershipsSnapshot = await getDocs(membershipsQuery);
      
      const batch = writeBatch(db);
      membershipsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Delete the group
      const groupRef = doc(db, 'groups', groupId);
      batch.delete(groupRef);
      
      await batch.commit();
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to delete group'));
    }
  },

  // Search groups with filters
  searchGroups: async (filters: GroupFilters = {}, limitCount: number = 20): Promise<Group[]> => {
    try {
      const baseConstraints = filters.privacySetting
        ? [where('privacySetting', '==', filters.privacySetting)]
        : [where('privacySetting', 'in', ['public', 'approval-required'])];

      let q = query(
        collection(db, 'groups'),
        ...baseConstraints,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      // Apply additional filters
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }

      const querySnapshot = await getDocs(q);
      const groups: Group[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const group: Group = {
          id: doc.id,
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          bannerUrl: data.bannerUrl,
          location: data.location,
          category: data.category,
          type: data.type,
          privacySetting: data.privacySetting,
          memberCount: data.memberCount,
          adminUserIds: data.adminUserIds,
          memberIds: data.memberIds,
          createdByUserId: data.createdByUserId,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt)
        };

        // Apply search filter in memory (for text search)
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          if (group.name.toLowerCase().includes(searchLower) || 
              group.description.toLowerCase().includes(searchLower)) {
            groups.push(group);
          }
        } else {
          groups.push(group);
        }
      });

      return groups;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to search groups'));
    }
  },

  // Join a group
  joinGroup: async (groupId: string, userId: string): Promise<void> => {
    try {
      const group = await firebaseGroupApi.getGroup(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is already a member
      if (group.memberIds.includes(userId)) {
        throw new Error('User is already a member of this group');
      }

      const batch = writeBatch(db);

      // Add user to group
      const groupRef = doc(db, 'groups', groupId);
      batch.update(groupRef, {
        memberIds: [...group.memberIds, userId],
        memberCount: increment(1),
        updatedAt: serverTimestamp()
      });

      // Create membership record
      const membershipData = {
        groupId,
        userId,
        role: 'member',
        status: group.privacySetting === 'public' ? 'active' : 'pending',
        joinedAt: serverTimestamp()
      };

      const membershipRef = doc(collection(db, 'groupMemberships'));
      batch.set(membershipRef, membershipData);

      await batch.commit();
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to join group'));
    }
  },

  // Leave a group
  leaveGroup: async (groupId: string, userId: string): Promise<void> => {
    try {
      const group = await firebaseGroupApi.getGroup(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is an admin
      if (group.adminUserIds.includes(userId) && group.adminUserIds.length === 1) {
        throw new Error('Cannot leave group as the only admin. Transfer ownership or delete the group.');
      }

      const batch = writeBatch(db);

      // Remove user from group
      const groupRef = doc(db, 'groups', groupId);
      batch.update(groupRef, {
        memberIds: group.memberIds.filter(id => id !== userId),
        adminUserIds: group.adminUserIds.filter(id => id !== userId),
        memberCount: increment(-1),
        updatedAt: serverTimestamp()
      });

      // Update membership status
      const membershipsQuery = query(
        collection(db, 'groupMemberships'),
        where('groupId', '==', groupId),
        where('userId', '==', userId)
      );
      const membershipsSnapshot = await getDocs(membershipsQuery);
      
      membershipsSnapshot.forEach((doc) => {
        batch.update(doc.ref, { status: 'left' });
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to leave group'));
    }
  },

  // Get group members
  getGroupMembers: async (groupId: string): Promise<User[]> => {
    try {
      const membershipsQuery = query(
        collection(db, 'groupMemberships'),
        where('groupId', '==', groupId),
        where('status', '==', 'active')
      );
      const membershipsSnapshot = await getDocs(membershipsQuery);
      
      const userIds = membershipsSnapshot.docs.map(doc => doc.data().userId);
      
      if (userIds.length === 0) {
        return [];
      }

      // Get user details
      const users: User[] = [];
      for (const userId of userIds) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          users.push({
            id: userDoc.id,
            email: userData.email,
            name: userData.name,
            username: userData.username,
            bio: userData.bio,
            location: userData.location,
            profilePicture: userData.profilePicture,
            createdAt: convertTimestamp(userData.createdAt),
            updatedAt: convertTimestamp(userData.updatedAt)
          });
        }
      }

      return users;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get group members'));
    }
  },

  // Get user's groups
  getUserGroups: async (userId: string): Promise<Group[]> => {
    try {
      const membershipsQuery = query(
        collection(db, 'groupMemberships'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const membershipsSnapshot = await getDocs(membershipsQuery);
      
      const groupIds = membershipsSnapshot.docs.map(doc => doc.data().groupId);
      
      if (groupIds.length === 0) {
        return [];
      }

      // Get group details
      const groups: Group[] = [];
      for (const groupId of groupIds) {
        const group = await firebaseGroupApi.getGroup(groupId);
        if (group) {
          groups.push(group);
        }
      }

      return groups;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get user groups'));
    }
  },

  // Get group statistics
  getGroupStats: async (groupId: string): Promise<GroupStats> => {
    try {
      // This would typically involve complex aggregations
      // For now, return basic stats
      const group = await firebaseGroupApi.getGroup(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      return {
        totalMembers: group.memberCount,
        totalPosts: 0, // Would need to count posts
        totalHours: 0, // Would need to aggregate session hours
        weeklyHours: 0,
        monthlyHours: 0,
        activeMembers: group.memberCount,
        topProjects: []
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get group stats'));
    }
  }
};

// Note: increment is imported from firebase/firestore above

// Challenge API methods
export const firebaseChallengeApi = {
  // Create a new challenge (group admins only)
  createChallenge: async (data: CreateChallengeData): Promise<Challenge> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // If groupId is provided, verify user is admin
      if (data.groupId) {
        const groupDoc = await getDoc(doc(db, 'groups', data.groupId));
        if (!groupDoc.exists()) {
          throw new Error('Group not found');
        }
        const groupData = groupDoc.data();
        if (!groupData.adminUserIds.includes(auth.currentUser.uid)) {
          throw new Error('Only group admins can create challenges');
        }
      }

      const challengeData = {
        ...data,
        createdByUserId: auth.currentUser.uid,
        participantCount: 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'challenges'), challengeData);
      
      return {
        id: docRef.id,
        ...data,
        createdByUserId: auth.currentUser.uid,
        participantCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create challenge');
    }
  },

  // Get challenge by ID
  getChallenge: async (challengeId: string): Promise<Challenge> => {
    try {
      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
      
      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const data = challengeDoc.data();
      return {
        id: challengeDoc.id,
        groupId: data.groupId,
        name: data.name,
        description: data.description,
        type: data.type,
        goalValue: data.goalValue,
        startDate: convertTimestamp(data.startDate),
        endDate: convertTimestamp(data.endDate),
        participantCount: data.participantCount || 0,
        createdByUserId: data.createdByUserId,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        rules: data.rules,
        projectIds: data.projectIds,
        isActive: data.isActive !== false,
        rewards: data.rewards
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get challenge');
    }
  },

  // Get challenges with filters
  getChallenges: async (filters: ChallengeFilters = {}): Promise<Challenge[]> => {
    try {
      // Start with a simple query to avoid complex index requirements
      let challengesQuery = query(collection(db, 'challenges'), orderBy('createdAt', 'desc'));

      // Apply simple filters first
      if (filters.groupId) {
        challengesQuery = query(collection(db, 'challenges'), where('groupId', '==', filters.groupId), orderBy('createdAt', 'desc'));
      } else if (filters.type) {
        challengesQuery = query(collection(db, 'challenges'), where('type', '==', filters.type), orderBy('createdAt', 'desc'));
      }

      const snapshot = await getDocs(challengesQuery);
      const challenges: Challenge[] = [];
      const now = new Date();

      for (const challengeDoc of snapshot.docs) {
        const data = challengeDoc.data();
        
        // Apply client-side filtering for complex conditions
        const startDate = convertTimestamp(data.startDate);
        const endDate = convertTimestamp(data.endDate);
        const isActive = data.isActive !== false;

        // Filter by status (client-side to avoid complex queries)
        if (filters.status === 'active') {
          if (!(now >= startDate && now <= endDate && isActive)) {
            continue;
          }
        } else if (filters.status === 'upcoming') {
          if (!(now < startDate && isActive)) {
            continue;
          }
        } else if (filters.status === 'completed') {
          if (!(now > endDate || !isActive)) {
            continue;
          }
        }

        // Filter by type (if not already filtered at query level)
        if (filters.type && !filters.groupId && data.type !== filters.type) {
          continue;
        }

        // If filtering by participation, check if current user is participating
        if (filters.isParticipating && auth.currentUser) {
          try {
            const participantDoc = await getDoc(
              doc(db, 'challengeParticipants', `${auth.currentUser.uid}_${challengeDoc.id}`)
            );
            if (!participantDoc.exists()) {
              continue;
            }
          } catch (error) {
            // If we can't check participation, skip this challenge
            console.warn('Failed to check participation for challenge:', challengeDoc.id, error);
            continue;
          }
        }

        challenges.push({
          id: challengeDoc.id,
          groupId: data.groupId,
          name: data.name,
          description: data.description,
          type: data.type,
          goalValue: data.goalValue,
          startDate,
          endDate,
          participantCount: data.participantCount || 0,
          createdByUserId: data.createdByUserId,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          rules: data.rules,
          projectIds: data.projectIds,
          isActive,
          rewards: data.rewards
        });
      }

      return challenges;
    } catch (error: any) {
      console.error('Error in getChallenges:', error);
      throw new Error(error.message || 'Failed to get challenges');
    }
  },

  // Join a challenge
  joinChallenge: async (challengeId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const participantId = `${auth.currentUser.uid}_${challengeId}`;
      
      // Check if already participating
      const existingParticipant = await getDoc(doc(db, 'challengeParticipants', participantId));
      if (existingParticipant.exists()) {
        throw new Error('Already participating in this challenge');
      }

      // Check if challenge exists and is active
      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const challengeData = challengeDoc.data();
      const now = new Date();
      const startDate = convertTimestamp(challengeData.startDate);
      const endDate = convertTimestamp(challengeData.endDate);

      if (!challengeData.isActive) {
        throw new Error('Challenge is not active');
      }
      if (now > endDate) {
        throw new Error('Challenge has ended');
      }

      const batch = writeBatch(db);

      // Add participant
      batch.set(doc(db, 'challengeParticipants', participantId), {
        challengeId,
        userId: auth.currentUser.uid,
        joinedAt: serverTimestamp(),
        progress: 0,
        isCompleted: false
      });

      // Update participant count
      batch.update(doc(db, 'challenges', challengeId), {
        participantCount: increment(1),
        updatedAt: serverTimestamp()
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to join challenge');
    }
  },

  // Leave a challenge
  leaveChallenge: async (challengeId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const participantId = `${auth.currentUser.uid}_${challengeId}`;
      
      // Check if participating
      const participantDoc = await getDoc(doc(db, 'challengeParticipants', participantId));
      if (!participantDoc.exists()) {
        throw new Error('Not participating in this challenge');
      }

      const batch = writeBatch(db);

      // Remove participant
      batch.delete(doc(db, 'challengeParticipants', participantId));

      // Update participant count
      batch.update(doc(db, 'challenges', challengeId), {
        participantCount: increment(-1),
        updatedAt: serverTimestamp()
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to leave challenge');
    }
  },

  // Get challenge leaderboard
  getChallengeLeaderboard: async (challengeId: string): Promise<ChallengeLeaderboard> => {
    try {
      // Get all participants for this challenge
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('challengeId', '==', challengeId),
        orderBy('progress', 'desc')
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const entries: ChallengeLeaderboardEntry[] = [];

      let rank = 1;
      for (const participantDoc of participantsSnapshot.docs) {
        const participantData = participantDoc.data();
        
        // Get user data
        try {
          const userDoc = await getDoc(doc(db, 'users', participantData.userId));
          const userData = userDoc.data();
          
          if (userData) {
            entries.push({
              userId: participantData.userId,
              user: {
                id: participantData.userId,
                email: userData.email || '',
                name: userData.name || 'Unknown User',
                username: userData.username || 'unknown',
                bio: userData.bio,
                location: userData.location,
                profilePicture: userData.profilePicture,
                createdAt: convertTimestamp(userData.createdAt) || new Date(),
                updatedAt: convertTimestamp(userData.updatedAt) || new Date()
              },
              progress: participantData.progress || 0,
              rank,
              isCompleted: participantData.isCompleted || false,
              completedAt: participantData.completedAt ? convertTimestamp(participantData.completedAt) : undefined
            });
            rank++;
          }
        } catch (error) {
          console.warn(`Failed to load user data for participant ${participantData.userId}:`, error);
        }
      }

      return {
        challengeId,
        entries,
        lastUpdated: new Date()
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get challenge leaderboard');
    }
  },

  // Get user's progress in a challenge
  getChallengeProgress: async (challengeId: string, userId?: string): Promise<ChallengeProgress | null> => {
    try {
      const targetUserId = userId || auth.currentUser?.uid;
      if (!targetUserId) {
        throw new Error('User not authenticated');
      }

      const participantId = `${targetUserId}_${challengeId}`;
      const participantDoc = await getDoc(doc(db, 'challengeParticipants', participantId));
      
      if (!participantDoc.exists()) {
        return null;
      }

      const participantData = participantDoc.data();
      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
      const challengeData = challengeDoc.data();

      // Calculate percentage based on challenge type and goal
      let percentage = 0;
      if (challengeData?.goalValue && participantData.progress) {
        percentage = Math.min((participantData.progress / challengeData.goalValue) * 100, 100);
      }

      // Get rank by counting participants with higher progress
      const higherProgressQuery = query(
        collection(db, 'challengeParticipants'),
        where('challengeId', '==', challengeId),
        where('progress', '>', participantData.progress || 0)
      );
      const higherProgressSnapshot = await getDocs(higherProgressQuery);
      const rank = higherProgressSnapshot.size + 1;

      return {
        challengeId,
        userId: targetUserId,
        currentValue: participantData.progress || 0,
        targetValue: challengeData?.goalValue,
        percentage,
        rank,
        isCompleted: participantData.isCompleted || false,
        lastUpdated: convertTimestamp(participantData.updatedAt) || new Date()
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get challenge progress');
    }
  },

  // Update challenge progress (called when sessions are logged)
  updateChallengeProgress: async (userId: string, sessionData: any): Promise<void> => {
    try {
      // Get all active challenges the user is participating in
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('userId', '==', userId)
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const batch = writeBatch(db);

      for (const participantDoc of participantsSnapshot.docs) {
        const participantData = participantDoc.data();
        const challengeId = participantData.challengeId;

        // Get challenge details
        const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
        if (!challengeDoc.exists()) continue;

        const challengeData = challengeDoc.data();
        const now = new Date();
        const startDate = convertTimestamp(challengeData.startDate);
        const endDate = convertTimestamp(challengeData.endDate);
        const sessionStart = convertTimestamp(sessionData.startTime);

        // Skip if challenge is not active or session is outside challenge period
        if (!challengeData.isActive || sessionStart < startDate || sessionStart > endDate) {
          continue;
        }

        // Skip if challenge has specific projects and session project is not included
        if (challengeData.projectIds && challengeData.projectIds.length > 0) {
          if (!challengeData.projectIds.includes(sessionData.projectId)) {
            continue;
          }
        }

        // Calculate progress increment based on challenge type
        let progressIncrement = 0;
        switch (challengeData.type) {
          case 'most-activity':
            progressIncrement = sessionData.duration / 3600; // Convert seconds to hours
            break;
          case 'fastest-effort':
            // Tasks per hour ratio
            const tasksCompleted = sessionData.tasks?.length || 0;
            const hours = sessionData.duration / 3600;
            if (hours > 0) {
              const currentRatio = tasksCompleted / hours;
              // Update if this is better than current best
              if (currentRatio > (participantData.progress || 0)) {
                progressIncrement = currentRatio - (participantData.progress || 0);
              }
            }
            break;
          case 'longest-session':
            // Update if this session is longer than current best
            const sessionHours = sessionData.duration / 3600;
            if (sessionHours > (participantData.progress || 0)) {
              progressIncrement = sessionHours - (participantData.progress || 0);
            }
            break;
          case 'group-goal':
            progressIncrement = sessionData.duration / 3600; // Contribute hours to group goal
            break;
        }

        if (progressIncrement > 0) {
          const newProgress = (participantData.progress || 0) + progressIncrement;
          const isCompleted = challengeData.goalValue ? newProgress >= challengeData.goalValue : false;

          const updateData: any = {
            progress: newProgress,
            updatedAt: serverTimestamp()
          };

          if (isCompleted && !participantData.isCompleted) {
            updateData.isCompleted = true;
            updateData.completedAt = serverTimestamp();
          }

          batch.update(participantDoc.ref, updateData);
        }
      }

      await batch.commit();
    } catch (error: any) {
      console.error('Failed to update challenge progress:', error);
      // Don't throw error to avoid breaking session creation
    }
  },

  // Get challenge statistics
  getChallengeStats: async (challengeId: string): Promise<ChallengeStats> => {
    try {
      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const challengeData = challengeDoc.data();
      const endDate = convertTimestamp(challengeData.endDate);
      const now = new Date();
      const timeRemaining = Math.max(0, endDate.getTime() - now.getTime());
      const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

      // Get all participants
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('challengeId', '==', challengeId)
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const totalParticipants = participantsSnapshot.size;
      let completedParticipants = 0;
      let totalProgress = 0;

      participantsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isCompleted) {
          completedParticipants++;
        }
        totalProgress += data.progress || 0;
      });

      const averageProgress = totalParticipants > 0 ? totalProgress / totalParticipants : 0;

      // Get top performers (top 3)
      const leaderboard = await firebaseChallengeApi.getChallengeLeaderboard(challengeId);
      const topPerformers = leaderboard.entries.slice(0, 3);

      return {
        totalParticipants,
        completedParticipants,
        averageProgress,
        topPerformers,
        timeRemaining: Math.floor(timeRemaining / 1000), // Convert to seconds
        daysRemaining
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get challenge stats');
    }
  },

  // Update challenge (admin only)
  updateChallenge: async (challengeId: string, data: UpdateChallengeData): Promise<Challenge> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const challengeData = challengeDoc.data();

      // Check if user is admin (challenge creator or group admin)
      let isAdmin = challengeData.createdByUserId === auth.currentUser.uid;
      
      if (!isAdmin && challengeData.groupId) {
        const groupDoc = await getDoc(doc(db, 'groups', challengeData.groupId));
        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          isAdmin = groupData.adminUserIds.includes(auth.currentUser.uid);
        }
      }

      if (!isAdmin) {
        throw new Error('Only challenge creators or group admins can update challenges');
      }

      const updateData = removeUndefinedFields({
        ...data,
        updatedAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'challenges', challengeId), updateData);

      // Return updated challenge
      return await firebaseChallengeApi.getChallenge(challengeId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update challenge');
    }
  },

  // Delete challenge (admin only)
  deleteChallenge: async (challengeId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const challengeData = challengeDoc.data();

      // Check if user is admin
      let isAdmin = challengeData.createdByUserId === auth.currentUser.uid;
      
      if (!isAdmin && challengeData.groupId) {
        const groupDoc = await getDoc(doc(db, 'groups', challengeData.groupId));
        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          isAdmin = groupData.adminUserIds.includes(auth.currentUser.uid);
        }
      }

      if (!isAdmin) {
        throw new Error('Only challenge creators or group admins can delete challenges');
      }

      const batch = writeBatch(db);

      // Delete challenge
      batch.delete(doc(db, 'challenges', challengeId));

      // Delete all participants
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('challengeId', '==', challengeId)
      );
      const participantsSnapshot = await getDocs(participantsQuery);
      
      participantsSnapshot.forEach((participantDoc) => {
        batch.delete(participantDoc.ref);
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete challenge');
    }
  },

  // Search challenges with filters and limit
  searchChallenges: async (filters: ChallengeFilters = {}, limitCount: number = 50): Promise<Challenge[]> => {
    try {
      // Use getChallenges but apply limit
      let challengesQuery = query(
        collection(db, 'challenges'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      // Apply simple filters
      if (filters.groupId) {
        challengesQuery = query(
          collection(db, 'challenges'),
          where('groupId', '==', filters.groupId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } else if (filters.type) {
        challengesQuery = query(
          collection(db, 'challenges'),
          where('type', '==', filters.type),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(challengesQuery);
      const challenges: Challenge[] = [];
      const now = new Date();

      for (const challengeDoc of snapshot.docs) {
        const data = challengeDoc.data();
        
        // Apply client-side filtering for complex conditions
        const startDate = convertTimestamp(data.startDate);
        const endDate = convertTimestamp(data.endDate);
        const isActive = data.isActive !== false;

        // Filter by status (client-side)
        if (filters.status === 'active') {
          if (!(now >= startDate && now <= endDate && isActive)) {
            continue;
          }
        } else if (filters.status === 'upcoming') {
          if (!(now < startDate && isActive)) {
            continue;
          }
        } else if (filters.status === 'completed') {
          if (!(now > endDate || !isActive)) {
            continue;
          }
        }

        challenges.push({
          id: challengeDoc.id,
          groupId: data.groupId,
          name: data.name,
          description: data.description,
          type: data.type,
          goalValue: data.goalValue,
          startDate,
          endDate,
          participantCount: data.participantCount || 0,
          createdByUserId: data.createdByUserId,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          rules: data.rules,
          projectIds: data.projectIds,
          isActive,
          rewards: data.rewards,
          category: data.category
        });
      }

      return challenges;
    } catch (error: any) {
      console.error('Error in searchChallenges:', error);
      throw new Error(error.message || 'Failed to search challenges');
    }
  },

  // Get challenges that a user is participating in
  getUserChallenges: async (userId: string): Promise<Challenge[]> => {
    try {
      // Get all challenge participations for this user
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('userId', '==', userId)
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const challenges: Challenge[] = [];

      // Fetch each challenge
      for (const participantDoc of participantsSnapshot.docs) {
        const participantData = participantDoc.data();
        const challengeId = participantData.challengeId;

        try {
          const challenge = await firebaseChallengeApi.getChallenge(challengeId);
          challenges.push(challenge);
        } catch (error) {
          console.warn(`Failed to load challenge ${challengeId}:`, error);
        }
      }

      // Sort by most recent first
      challenges.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return challenges;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get user challenges');
    }
  }
};

// Import additional types for streak and achievement
import type {
  StreakData,
  StreakDay,
  StreakStats,
  Achievement,
  AchievementType,
  UserAchievementData,
  AchievementProgress
} from '@/types';

// Streak API methods
export const firebaseStreakApi = {
  // Get user's streak data
  getStreakData: async (userId: string): Promise<StreakData> => {
    try {
      const streakDoc = await getDoc(doc(db, 'streaks', userId));
      
      if (!streakDoc.exists()) {
        // Initialize streak data if it doesn't exist
        const initialStreak: StreakData = {
          userId,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(0),
          totalStreakDays: 0,
          streakHistory: [],
          isPublic: true
        };
        await setDoc(doc(db, 'streaks', userId), {
          ...initialStreak,
          lastActivityDate: Timestamp.fromDate(initialStreak.lastActivityDate)
        });
        return initialStreak;
      }

      const data = streakDoc.data();
      return {
        userId: data.userId,
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
        lastActivityDate: convertTimestamp(data.lastActivityDate),
        totalStreakDays: data.totalStreakDays || 0,
        streakHistory: data.streakHistory || [],
        isPublic: data.isPublic !== false
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get streak data'));
    }
  },

  // Get streak stats with calculated fields
  getStreakStats: async (userId: string): Promise<StreakStats> => {
    try {
      const streakData = await firebaseStreakApi.getStreakData(userId);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastActivity = new Date(
        streakData.lastActivityDate.getFullYear(),
        streakData.lastActivityDate.getMonth(),
        streakData.lastActivityDate.getDate()
      );
      
      const daysSinceActivity = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      const streakAtRisk = daysSinceActivity >= 1;
      
      // Calculate next milestone
      const milestones = [7, 30, 100, 365, 500, 1000];
      const nextMilestone = milestones.find(m => m > streakData.currentStreak) || milestones[milestones.length - 1];

      return {
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        totalStreakDays: streakData.totalStreakDays,
        lastActivityDate: streakData.lastActivityDate.getTime() === 0 ? null : streakData.lastActivityDate,
        streakAtRisk,
        nextMilestone
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get streak stats'));
    }
  },

  // Update streak after session completion
  updateStreak: async (userId: string, sessionDate: Date): Promise<StreakData> => {
    try {
      const streakData = await firebaseStreakApi.getStreakData(userId);
      
      const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
      const lastActivityDay = new Date(
        streakData.lastActivityDate.getFullYear(),
        streakData.lastActivityDate.getMonth(),
        streakData.lastActivityDate.getDate()
      );
      
      const daysDiff = Math.floor((sessionDay.getTime() - lastActivityDay.getTime()) / (1000 * 60 * 60 * 24));
      
      let newCurrentStreak = streakData.currentStreak;
      let newLongestStreak = streakData.longestStreak;
      let newTotalStreakDays = streakData.totalStreakDays;
      
      if (daysDiff === 0) {
        // Same day, no change to streak
      } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        newCurrentStreak += 1;
        newTotalStreakDays += 1;
        if (newCurrentStreak > newLongestStreak) {
          newLongestStreak = newCurrentStreak;
        }
      } else if (daysDiff > 1) {
        // Streak broken, reset to 1
        newCurrentStreak = 1;
        newTotalStreakDays += 1;
      }
      
      // Update streak history (keep last 365 days)
      const dateStr = sessionDay.toISOString().split('T')[0];
      const existingDayIndex = streakData.streakHistory.findIndex(d => d.date === dateStr);
      
      let newHistory = [...streakData.streakHistory];
      if (existingDayIndex >= 0) {
        newHistory[existingDayIndex].sessionCount += 1;
      } else {
        newHistory.push({
          date: dateStr,
          hasActivity: true,
          sessionCount: 1,
          totalMinutes: 0
        });
      }
      
      // Keep only last 365 days
      newHistory = newHistory.slice(-365);
      
      const updatedStreak: StreakData = {
        ...streakData,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: sessionDate,
        totalStreakDays: newTotalStreakDays,
        streakHistory: newHistory
      };
      
      await setDoc(doc(db, 'streaks', userId), {
        ...updatedStreak,
        lastActivityDate: Timestamp.fromDate(sessionDate)
      });
      
      return updatedStreak;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to update streak'));
    }
  },

  // Toggle streak visibility
  toggleStreakVisibility: async (userId: string): Promise<boolean> => {
    try {
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        throw new Error('Unauthorized');
      }
      
      const streakData = await firebaseStreakApi.getStreakData(userId);
      const newVisibility = !streakData.isPublic;
      
      await updateDoc(doc(db, 'streaks', userId), {
        isPublic: newVisibility
      });
      
      return newVisibility;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to toggle streak visibility'));
    }
  },

  // Admin only: Restore streak
  restoreStreak: async (userId: string, streakValue: number): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('Unauthorized');
      }
      
      // TODO: Add admin check
      
      await updateDoc(doc(db, 'streaks', userId), {
        currentStreak: streakValue,
        lastActivityDate: Timestamp.fromDate(new Date())
      });
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to restore streak'));
    }
  }
};

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, { name: string; description: string; icon: string; targetValue?: number }> = {
  'streak-7': { name: '7 Day Streak', description: 'Complete sessions for 7 days in a row', icon: '🔥', targetValue: 7 },
  'streak-30': { name: '30 Day Streak', description: 'Complete sessions for 30 days in a row', icon: '🔥', targetValue: 30 },
  'streak-100': { name: '100 Day Streak', description: 'Complete sessions for 100 days in a row', icon: '🔥', targetValue: 100 },
  'streak-365': { name: 'Year Streak', description: 'Complete sessions for 365 days in a row', icon: '🔥', targetValue: 365 },
  'hours-10': { name: 'First 10 Hours', description: 'Log 10 hours of work', icon: '⏱️', targetValue: 10 },
  'hours-50': { name: '50 Hours', description: 'Log 50 hours of work', icon: '⏱️', targetValue: 50 },
  'hours-100': { name: '100 Hours', description: 'Log 100 hours of work', icon: '⏱️', targetValue: 100 },
  'hours-500': { name: '500 Hours', description: 'Log 500 hours of work', icon: '⏱️', targetValue: 500 },
  'hours-1000': { name: '1000 Hours', description: 'Log 1000 hours of work', icon: '⏱️', targetValue: 1000 },
  'tasks-50': { name: '50 Tasks', description: 'Complete 50 tasks', icon: '✅', targetValue: 50 },
  'tasks-100': { name: '100 Tasks', description: 'Complete 100 tasks', icon: '✅', targetValue: 100 },
  'tasks-500': { name: '500 Tasks', description: 'Complete 500 tasks', icon: '✅', targetValue: 500 },
  'tasks-1000': { name: '1000 Tasks', description: 'Complete 1000 tasks', icon: '✅', targetValue: 1000 },
  'challenge-complete': { name: 'Challenge Complete', description: 'Complete a challenge', icon: '🏆' },
  'challenge-winner': { name: 'Challenge Winner', description: 'Win a challenge', icon: '👑' },
  'personal-record-session': { name: 'Personal Record', description: 'Complete your longest session', icon: '🎯' },
  'personal-record-day': { name: 'Best Day Ever', description: 'Complete your most productive day', icon: '🌟' },
  'early-bird': { name: 'Early Bird', description: 'Complete a session before 6 AM', icon: '🌅' },
  'night-owl': { name: 'Night Owl', description: 'Complete a session after 10 PM', icon: '🦉' },
  'weekend-warrior': { name: 'Weekend Warrior', description: 'Complete 10 weekend sessions', icon: '💪' },
  'consistency-king': { name: 'Consistency King', description: 'Complete sessions for 30 consecutive days', icon: '👑' }
};

// Achievement API methods
export const firebaseAchievementApi = {
  // Get user's achievements
  getUserAchievements: async (userId: string): Promise<Achievement[]> => {
    try {
      const achievementsQuery = query(
        collection(db, 'achievements'),
        where('userId', '==', userId),
        orderBy('earnedAt', 'desc')
      );
      
      const snapshot = await getDocs(achievementsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        earnedAt: convertTimestamp(doc.data().earnedAt)
      } as Achievement));
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get achievements'));
    }
  },

  // Get achievement progress for all achievement types
  getAchievementProgress: async (userId: string): Promise<AchievementProgress[]> => {
    try {
      const [achievements, userData] = await Promise.all([
        firebaseAchievementApi.getUserAchievements(userId),
        firebaseAchievementApi.getUserAchievementData(userId)
      ]);
      
      const unlockedTypes = new Set(achievements.map(a => a.type));
      const progress: AchievementProgress[] = [];
      
      // Streak achievements
      const streakAchievements: AchievementType[] = ['streak-7', 'streak-30', 'streak-100', 'streak-365'];
      streakAchievements.forEach(type => {
        const def = ACHIEVEMENT_DEFINITIONS[type];
        const isUnlocked = unlockedTypes.has(type);
        const achievement = achievements.find(a => a.type === type);
        
        progress.push({
          type,
          name: def.name,
          description: def.description,
          icon: def.icon,
          currentValue: userData.currentStreak,
          targetValue: def.targetValue || 0,
          percentage: Math.min(100, (userData.currentStreak / (def.targetValue || 1)) * 100),
          isUnlocked,
          unlockedAt: achievement?.earnedAt
        });
      });
      
      // Hour achievements
      const hourAchievements: AchievementType[] = ['hours-10', 'hours-50', 'hours-100', 'hours-500', 'hours-1000'];
      hourAchievements.forEach(type => {
        const def = ACHIEVEMENT_DEFINITIONS[type];
        const isUnlocked = unlockedTypes.has(type);
        const achievement = achievements.find(a => a.type === type);
        
        progress.push({
          type,
          name: def.name,
          description: def.description,
          icon: def.icon,
          currentValue: userData.totalHours,
          targetValue: def.targetValue || 0,
          percentage: Math.min(100, (userData.totalHours / (def.targetValue || 1)) * 100),
          isUnlocked,
          unlockedAt: achievement?.earnedAt
        });
      });
      
      // Task achievements
      const taskAchievements: AchievementType[] = ['tasks-50', 'tasks-100', 'tasks-500', 'tasks-1000'];
      taskAchievements.forEach(type => {
        const def = ACHIEVEMENT_DEFINITIONS[type];
        const isUnlocked = unlockedTypes.has(type);
        const achievement = achievements.find(a => a.type === type);
        
        progress.push({
          type,
          name: def.name,
          description: def.description,
          icon: def.icon,
          currentValue: userData.totalTasks,
          targetValue: def.targetValue || 0,
          percentage: Math.min(100, (userData.totalTasks / (def.targetValue || 1)) * 100),
          isUnlocked,
          unlockedAt: achievement?.earnedAt
        });
      });
      
      return progress;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get achievement progress'));
    }
  },

  // Get user data for achievement checking
  getUserAchievementData: async (userId: string): Promise<UserAchievementData> => {
    try {
      const [streakData, userStats] = await Promise.all([
        firebaseStreakApi.getStreakData(userId),
        firebaseUserApi.getUserStats(userId)
      ]);
      
      // Get task count
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', userId),
        where('status', '==', 'completed')
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      
      // Get session stats
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        orderBy('duration', 'desc'),
        limit(1)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const longestSession = sessionsSnapshot.docs[0]?.data()?.duration || 0;
      
      return {
        userId,
        totalHours: userStats.totalHours,
        totalTasks: tasksSnapshot.size,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        totalSessions: userStats.sessionsThisMonth, // Approximate
        longestSession: Math.floor(longestSession / 60),
        mostHoursInDay: 0, // TODO: Calculate from daily stats
        challengesCompleted: 0, // TODO: Get from challenges
        challengesWon: 0 // TODO: Get from challenges
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get user achievement data'));
    }
  },

  // Check and award new achievements after session
  checkAchievements: async (userId: string, sessionId?: string): Promise<Achievement[]> => {
    try {
      const [existingAchievements, userData] = await Promise.all([
        firebaseAchievementApi.getUserAchievements(userId),
        firebaseAchievementApi.getUserAchievementData(userId)
      ]);
      
      const unlockedTypes = new Set(existingAchievements.map(a => a.type));
      const newAchievements: Achievement[] = [];
      
      // Check streak achievements
      if (userData.currentStreak >= 7 && !unlockedTypes.has('streak-7')) {
        newAchievements.push(await firebaseAchievementApi.awardAchievement(userId, 'streak-7', sessionId));
      }
      if (userData.currentStreak >= 30 && !unlockedTypes.has('streak-30')) {
        newAchievements.push(await firebaseAchievementApi.awardAchievement(userId, 'streak-30', sessionId));
      }
      if (userData.currentStreak >= 100 && !unlockedTypes.has('streak-100')) {
        newAchievements.push(await firebaseAchievementApi.awardAchievement(userId, 'streak-100', sessionId));
      }
      if (userData.currentStreak >= 365 && !unlockedTypes.has('streak-365')) {
        newAchievements.push(await firebaseAchievementApi.awardAchievement(userId, 'streak-365', sessionId));
      }
      
      // Check hour achievements
      if (userData.totalHours >= 10 && !unlockedTypes.has('hours-10')) {
        newAchievements.push(await firebaseAchievementApi.awardAchievement(userId, 'hours-10', sessionId));
      }
      if (userData.totalHours >= 50 && !unlockedTypes.has('hours-50')) {
        newAchievements.push(await firebaseAchievementApi.awardAchievement(userId, 'hours-50', sessionId));
      }
      if (userData.totalHours >= 100 && !unlockedTypes.has('hours-100')) {
        newAchievements.push(await firebaseAchievementApi.awardAchievement(userId, 'hours-100', sessionId));
      }
      if (userData.totalHours >= 500 && !unlockedTypes.has('hours-500')) {
        newAchievements.push(await firebaseAchievementApi.awardAchievement(userId, 'hours-500', sessionId));
      }
      if (userData.totalHours >= 1000 && !unlockedTypes.has('hours-1000')) {
        newAchievements.push(await firebaseAchievementApi.awardAchievement(userId, 'hours-1000', sessionId));
      }
      
      // Check task achievements
      if (userData.totalTasks >= 50 && !unlockedTypes.has('tasks-50')) {
        newAchievements.push(await firebaseAchievementApi.awardAchievement(userId, 'tasks-50', sessionId));
      }
      if (userData.totalTasks >= 100 && !unlockedTypes.has('tasks-100')) {
        newAchievements.push(await firebaseAchievementApi.awardAchievement(userId, 'tasks-100', sessionId));
      }
      if (userData.totalTasks >= 500 && !unlockedTypes.has('tasks-500')) {
        newAchievements.push(await firebaseAchievementApi.awardAchievement(userId, 'tasks-500', sessionId));
      }
      if (userData.totalTasks >= 1000 && !unlockedTypes.has('tasks-1000')) {
        newAchievements.push(await firebaseAchievementApi.awardAchievement(userId, 'tasks-1000', sessionId));
      }
      
      // Check time-based achievements if recent session provided
      if (userData.recentSession) {
        const sessionHour = userData.recentSession.startTime.getHours();
        
        if (sessionHour < 6 && !unlockedTypes.has('early-bird')) {
          newAchievements.push(await firebaseAchievementApi.awardAchievement(userId, 'early-bird', sessionId));
        }
        
        if (sessionHour >= 22 && !unlockedTypes.has('night-owl')) {
          newAchievements.push(await firebaseAchievementApi.awardAchievement(userId, 'night-owl', sessionId));
        }
      }
      
      return newAchievements;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to check achievements'));
    }
  },

  // Award an achievement
  awardAchievement: async (userId: string, type: AchievementType, sessionId?: string): Promise<Achievement> => {
    try {
      const def = ACHIEVEMENT_DEFINITIONS[type];
      const achievementData = {
        userId,
        type,
        name: def.name,
        description: def.description,
        icon: def.icon,
        earnedAt: serverTimestamp(),
        sessionId: sessionId || null,
        isShared: false
      };
      
      const docRef = await addDoc(collection(db, 'achievements'), achievementData);
      
      // Create notification
      await addDoc(collection(db, 'notifications'), {
        userId,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: `You earned the "${def.name}" achievement!`,
        linkUrl: `/profile/${userId}?tab=achievements`,
        isRead: false,
        createdAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...achievementData,
        earnedAt: new Date()
      } as Achievement;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to award achievement'));
    }
  },

  // Share achievement to feed
  shareAchievement: async (achievementId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const achievementDoc = await getDoc(doc(db, 'achievements', achievementId));
      if (!achievementDoc.exists()) {
        throw new Error('Achievement not found');
      }
      
      const achievement = achievementDoc.data() as Achievement;
      if (achievement.userId !== auth.currentUser.uid) {
        throw new Error('Unauthorized');
      }
      
      // Create a post about the achievement
      await addDoc(collection(db, 'posts'), {
        userId: auth.currentUser.uid,
        type: 'achievement',
        content: `Just unlocked the "${achievement.name}" achievement! ${achievement.icon}`,
        achievementId,
        visibility: 'everyone',
        supportCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Mark achievement as shared
      await updateDoc(doc(db, 'achievements', achievementId), {
        isShared: true
      });
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to share achievement'));
    }
  }
};

// Firebase Notification API
export const firebaseNotificationApi = {
  // Create a notification
  createNotification: async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> => {
    try {
      const notificationData = {
        ...notification,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'notifications'), notificationData);
      
      return {
        id: docRef.id,
        ...notification,
        createdAt: new Date()
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create notification');
    }
  },

  // Get notifications for a user
  getUserNotifications: async (userId: string, limit: number = 50): Promise<Notification[]> => {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );

      const snapshot = await getDocs(notificationsQuery);
      const notifications: Notification[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          isRead: data.isRead || false,
          createdAt: convertTimestamp(data.createdAt)
        });
      });

      return notifications;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get notifications');
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark notification as read');
    }
  },

  // Mark all notifications as read for a user
  markAllAsRead: async (userId: string): Promise<void> => {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(notificationsQuery);
      const batch = writeBatch(db);

      snapshot.forEach((doc) => {
        batch.update(doc.ref, {
          isRead: true,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark all notifications as read');
    }
  },

  // Delete a notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete notification');
    }
  },

  // Get unread notification count
  getUnreadCount: async (userId: string): Promise<number> => {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(notificationsQuery);
      return snapshot.size;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get unread count');
    }
  }
};

// Challenge Notification Helper Functions
export const challengeNotifications = {
  // Notify when a user completes a challenge
  notifyCompletion: async (challengeId: string, userId: string, challengeName: string, challengeType: string): Promise<void> => {
    try {
      const notification: Omit<Notification, 'id' | 'createdAt'> = {
        userId,
        type: 'challenge_completed',
        title: '🏆 Challenge Completed!',
        message: `Congratulations! You've completed the "${challengeName}" challenge.`,
        data: {
          challengeId,
          challengeName,
          challengeType
        } as ChallengeNotificationData,
        isRead: false
      };

      await firebaseNotificationApi.createNotification(notification);
    } catch (error) {
      console.error('Failed to send completion notification:', error);
    }
  },

  // Notify other participants when someone joins a challenge
  notifyParticipantJoined: async (challengeId: string, newParticipantId: string, newParticipantName: string, challengeName: string): Promise<void> => {
    try {
      // Get all other participants
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('challengeId', '==', challengeId)
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const batch = writeBatch(db);

      participantsSnapshot.forEach((participantDoc) => {
        const participantData = participantDoc.data();
        
        // Don't notify the person who just joined
        if (participantData.userId !== newParticipantId) {
          const notificationRef = doc(collection(db, 'notifications'));
          batch.set(notificationRef, {
            userId: participantData.userId,
            type: 'challenge_joined',
            title: '👋 New Challenger!',
            message: `${newParticipantName} joined the "${challengeName}" challenge.`,
            data: {
              challengeId,
              challengeName,
              participantId: newParticipantId,
              participantName: newParticipantName
            } as ChallengeNotificationData,
            isRead: false,
            createdAt: serverTimestamp()
          });
        }
      });

      await batch.commit();
    } catch (error) {
      console.error('Failed to send participant joined notifications:', error);
    }
  },

  // Notify all participants when challenge is ending soon
  notifyEndingSoon: async (challengeId: string, challengeName: string, daysRemaining: number): Promise<void> => {
    try {
      // Get all participants
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('challengeId', '==', challengeId)
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const batch = writeBatch(db);

      participantsSnapshot.forEach((participantDoc) => {
        const participantData = participantDoc.data();
        
        const notificationRef = doc(collection(db, 'notifications'));
        batch.set(notificationRef, {
          userId: participantData.userId,
          type: 'challenge_ending',
          title: '⏰ Challenge Ending Soon!',
          message: `The "${challengeName}" challenge ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Make your final push!`,
          data: {
            challengeId,
            challengeName,
            daysRemaining
          } as ChallengeNotificationData,
          isRead: false,
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Failed to send ending soon notifications:', error);
    }
  },

  // Notify when a new challenge is created in a group
  notifyNewChallenge: async (challengeId: string, challengeName: string, challengeType: string, groupId: string, creatorName: string): Promise<void> => {
    try {
      // Get all group members
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) return;

      const groupData = groupDoc.data();
      const memberIds = groupData.memberUserIds || [];
      const batch = writeBatch(db);

      memberIds.forEach((memberId: string) => {
        // Don't notify the creator
        if (memberId !== groupData.createdByUserId) {
          const notificationRef = doc(collection(db, 'notifications'));
          batch.set(notificationRef, {
            userId: memberId,
            type: 'challenge_created',
            title: '🎯 New Challenge Available!',
            message: `${creatorName} created a new "${challengeName}" challenge in your group.`,
            data: {
              challengeId,
              challengeName,
              challengeType,
              groupId,
              groupName: groupData.name
            } as ChallengeNotificationData,
            isRead: false,
            createdAt: serverTimestamp()
          });
        }
      });

      await batch.commit();
    } catch (error) {
      console.error('Failed to send new challenge notifications:', error);
    }
  },

  // Notify when rank changes significantly (moved up 3+ positions)
  notifyRankChange: async (challengeId: string, userId: string, challengeName: string, newRank: number, previousRank: number): Promise<void> => {
    try {
      // Only notify for significant improvements (moved up 3+ positions)
      if (previousRank - newRank >= 3) {
        const notification: Omit<Notification, 'id' | 'createdAt'> = {
          userId,
          type: 'challenge_rank_changed',
          title: '📈 Rank Improved!',
          message: `You moved up to #${newRank} in the "${challengeName}" challenge!`,
          data: {
            challengeId,
            challengeName,
            rank: newRank,
            previousRank
          } as ChallengeNotificationData,
          isRead: false
        };

        await firebaseNotificationApi.createNotification(notification);
      }
    } catch (error) {
      console.error('Failed to send rank change notification:', error);
    }
  },

  // Notify when reaching milestones (25%, 50%, 75%, 90% of goal)
  notifyMilestone: async (challengeId: string, userId: string, challengeName: string, progress: number, goalValue: number): Promise<void> => {
    try {
      const percentage = (progress / goalValue) * 100;
      const milestones = [25, 50, 75, 90];
      
      for (const milestone of milestones) {
        if (percentage >= milestone && percentage < milestone + 5) { // 5% buffer to avoid duplicate notifications
          const notification: Omit<Notification, 'id' | 'createdAt'> = {
            userId,
            type: 'challenge_milestone',
            title: `🎯 ${milestone}% Complete!`,
            message: `You're ${milestone}% of the way through the "${challengeName}" challenge. Keep going!`,
            data: {
              challengeId,
              challengeName,
              progress,
              goalValue
            } as ChallengeNotificationData,
            isRead: false
          };

          await firebaseNotificationApi.createNotification(notification);
          break; // Only send one milestone notification at a time
        }
      }
    } catch (error) {
      console.error('Failed to send milestone notification:', error);
    }
  }
};

// Export combined API (moved to end to include all APIs)
export const firebaseApi = {
  auth: firebaseAuthApi,
  user: firebaseUserApi,
  project: firebaseProjectApi,
  task: firebaseTaskApi,
  session: firebaseSessionApi,
  post: firebasePostApi,
  comment: firebaseCommentApi,
  group: firebaseGroupApi,
  streak: firebaseStreakApi,
  achievement: firebaseAchievementApi,
  challenge: firebaseChallengeApi,
  notification: firebaseNotificationApi
};