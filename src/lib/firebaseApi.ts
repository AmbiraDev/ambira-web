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
  runTransaction,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, auth, storage } from './firebase';
import {
  handleError,
  withErrorHandling,
  withNullOnError,
  isPermissionError,
  isNotFoundError,
  ErrorSeverity,
} from './errorHandler';
import { checkRateLimit, RateLimitError } from './rateLimit';

// Legacy helper for backwards compatibility - now wraps handleError
const getErrorMessage = (error: any, defaultMessage: string): string => {
  const apiError = handleError(error, 'Operation', {
    defaultMessage,
    silent: true,
  });
  return apiError.userMessage;
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
  ChallengeStats,
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
const updateSocialGraph = async (
  currentUserId: string,
  targetUserId: string,
  action: 'follow' | 'unfollow'
) => {
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);

  const currentUserSocialGraphRef = doc(
    db,
    `social_graph/${currentUserId}/outbound`,
    targetUserId
  );
  const targetUserSocialGraphRef = doc(
    db,
    `social_graph/${targetUserId}/inbound`,
    currentUserId
  );

  try {
    await runTransaction(db, async transaction => {
      // ALL READS MUST HAPPEN FIRST before any writes
      const currentUserDoc = await transaction.get(currentUserRef);
      const targetUserDoc = await transaction.get(targetUserRef);
      const isFollowing = (
        await transaction.get(currentUserSocialGraphRef)
      ).exists();
      const mutualCheckRef = doc(
        db,
        `social_graph/${targetUserId}/outbound`,
        currentUserId
      );
      const isMutualOrWasMutual = (
        await transaction.get(mutualCheckRef)
      ).exists();

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
        transaction.set(currentUserSocialGraphRef, {
          id: targetUserId,
          type: 'outbound',
          user: targetUserData,
          createdAt: now,
        });
        transaction.set(targetUserSocialGraphRef, {
          id: currentUserId,
          type: 'inbound',
          user: currentUserData,
          createdAt: now,
        });

        currentUserUpdate.outboundFriendshipCount = increment(1);
        currentUserUpdate.followingCount = increment(1);
        targetUserUpdate.inboundFriendshipCount = increment(1);
        targetUserUpdate.followersCount = increment(1);

        // Check for mutual friendship (using pre-read value)
        if (isMutualOrWasMutual) {
          currentUserUpdate.mutualFriendshipCount = increment(1);
          targetUserUpdate.mutualFriendshipCount = increment(1);
        }
      } else {
        // unfollow
        transaction.delete(currentUserSocialGraphRef);
        transaction.delete(targetUserSocialGraphRef);

        currentUserUpdate.outboundFriendshipCount = increment(-1);
        currentUserUpdate.followingCount = increment(-1);
        targetUserUpdate.inboundFriendshipCount = increment(-1);
        targetUserUpdate.followersCount = increment(-1);

        // Check for mutual friendship (using pre-read value)
        if (isMutualOrWasMutual) {
          currentUserUpdate.mutualFriendshipCount = increment(-1);
          targetUserUpdate.mutualFriendshipCount = increment(-1);
        }
      }

      transaction.update(currentUserRef, currentUserUpdate);
      transaction.update(targetUserRef, targetUserUpdate);
    });

    // Create notification for follow action (outside transaction)
    if (action === 'follow') {
      try {
        const currentUserData = await getDoc(currentUserRef);
        const userData = currentUserData.data();

        await addDoc(collection(db, 'notifications'), {
          userId: targetUserId,
          type: 'follow',
          title: 'New follower',
          message: `${userData?.name || 'Someone'} started following you`,
          linkUrl: `/profile/${userData?.username}`,
          actorId: currentUserId,
          actorName: userData?.name,
          actorUsername: userData?.username,
          actorProfilePicture: userData?.profilePicture,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      } catch (notifError) {
        // Log error but don't fail the follow action
        handleError(notifError, 'create follow notification', {
          severity: ErrorSeverity.ERROR,
          silent: true,
        });
      }
    }
  } catch (error) {
    const apiError = handleError(
      error,
      `${action.charAt(0).toUpperCase() + action.slice(1)} user`
    );
    throw new Error(apiError.userMessage);
  }
};

const PRIVATE_USER_FALLBACK_NAME = 'Private User';
const PRIVATE_USER_USERNAME_PREFIX = 'private';

const fetchUserDataForSocialContext = async (
  userId: string
): Promise<DocumentData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }
    return userDoc.data();
  } catch (error) {
    if (isPermissionError(error) || isNotFoundError(error)) {
      return null;
    }
    const apiError = handleError(error, 'Fetch user data');
    throw new Error(apiError.userMessage);
  }
};

const buildCommentUserDetails = (
  userId: string,
  userData: DocumentData | null
): User => {
  const fallbackUsername = `${PRIVATE_USER_USERNAME_PREFIX}-${userId.slice(0, 6)}`;
  const createdAt = userData?.createdAt
    ? convertTimestamp(userData.createdAt)
    : new Date();
  const updatedAt = userData?.updatedAt
    ? convertTimestamp(userData.updatedAt)
    : new Date();

  return {
    id: userId,
    email: userData?.email || '',
    name: userData?.name || PRIVATE_USER_FALLBACK_NAME,
    username: userData?.username || fallbackUsername,
    bio: userData?.bio,
    location: userData?.location,
    profilePicture: userData?.profilePicture,
    createdAt,
    updatedAt,
  };
};

// Remove keys with undefined values. Firestore does not accept undefined in documents
const removeUndefinedFields = <T extends Record<string, any>>(input: T): T => {
  const entries = Object.entries(input).filter(
    ([, value]) => value !== undefined
  );
  return Object.fromEntries(entries) as T;
};

// Helper function to populate sessions with user and project data
const populateSessionsWithDetails = async (
  sessionDocs: any[]
): Promise<SessionWithDetails[]> => {
  const sessions: SessionWithDetails[] = [];
  const batchSize = 10;

  for (let i = 0; i < sessionDocs.length; i += batchSize) {
    const batch = sessionDocs.slice(i, i + batchSize);
    const batchPromises = batch.map(async sessionDoc => {
      const sessionData = sessionDoc.data();

      // Get user data - skip session if user has been deleted or is inaccessible
      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', sessionData.userId));
      } catch (error) {
        // Handle permission errors for deleted users
        if (isPermissionError(error) || isNotFoundError(error)) {
          console.warn(
            `Skipping session ${sessionDoc.id} - user ${sessionData.userId} is inaccessible or deleted`
          );
          return null;
        }
        // Re-throw other errors
        throw error;
      }

      if (!userDoc.exists()) {
        console.warn(
          `Skipping session ${sessionDoc.id} - user ${sessionData.userId} no longer exists`
        );
        return null;
      }
      const userData = userDoc.data();

      // Get project data
      let projectData = null;
      const projectId = sessionData.projectId;
      if (projectId) {
        try {
          const projectDoc = await getDoc(
            doc(db, 'projects', sessionData.userId, 'userProjects', projectId)
          );
          if (projectDoc.exists()) {
            projectData = projectDoc.data();
          }
        } catch (error) {
          handleError(error, `Fetch project ${projectId}`, {
            severity: ErrorSeverity.WARNING,
          });
        }
      }

      // Check if current user has supported this session
      const supportedBy = sessionData.supportedBy || [];
      const isSupported = supportedBy.includes(auth.currentUser!.uid);

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
        images: sessionData.images || [],
        isArchived: sessionData.isArchived || false,
        supportCount: sessionData.supportCount || 0,
        supportedBy: supportedBy,
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
          updatedAt: convertTimestamp(userData?.updatedAt) || new Date(),
        },
        project: projectData
          ? {
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
              updatedAt: convertTimestamp(projectData.updatedAt) || new Date(),
            }
          : ({
              id: projectId || 'unknown',
              userId: sessionData.userId,
              name: 'Unknown Project',
              description: '',
              icon: '📁',
              color: '#64748B',
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Project),
      };

      return session;
    });

    const batchResults = await Promise.all(batchPromises);
    // Filter out null values (sessions from deleted users)
    const validSessions = batchResults.filter(
      (session): session is SessionWithDetails => session !== null
    );
    sessions.push(...validSessions);
  }

  return sessions;
};

// Helper function to check if username already exists
const checkUsernameExists = async (username: string): Promise<boolean> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('usernameLower', '==', username.toLowerCase()),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    const apiError = handleError(error, 'Check username availability', {
      severity: ErrorSeverity.WARNING,
    });
    // If there's an error checking, allow the signup to proceed
    // Firebase Auth will handle duplicate emails
    console.warn('Error checking username availability:', apiError.userMessage);
    return false;
  }
};

// Helper function to check if email already exists in Firestore
// Note: Firebase Auth is the primary check for email uniqueness
const checkEmailExistsInFirestore = async (email: string): Promise<boolean> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('email', '==', email.toLowerCase()),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    const apiError = handleError(error, 'Check email availability', {
      severity: ErrorSeverity.WARNING,
    });
    // If there's an error checking, allow the signup to proceed
    // Firebase Auth will handle duplicate emails
    console.warn('Error checking email availability:', apiError.userMessage);
    return false;
  }
};

// Helper function to generate a unique username from an email
const generateUniqueUsername = async (
  email: string,
  displayName?: string
): Promise<string> => {
  // Try using display name first if provided
  if (displayName) {
    const baseUsername = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    if (baseUsername.length >= 3) {
      // Try the base username first
      if (!(await checkUsernameExists(baseUsername))) {
        return baseUsername;
      }

      // Try with numbers appended
      for (let i = 1; i <= 999; i++) {
        const candidate = `${baseUsername}${i}`;
        if (!(await checkUsernameExists(candidate))) {
          return candidate;
        }
      }
    }
  }

  // Fall back to email-based username
  const baseUsername = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);

  // Try the base username first
  if (baseUsername.length >= 3 && !(await checkUsernameExists(baseUsername))) {
    return baseUsername;
  }

  // Try with numbers appended
  for (let i = 1; i <= 9999; i++) {
    const candidate = `${baseUsername}${i}`;
    if (!(await checkUsernameExists(candidate))) {
      return candidate;
    }
  }

  // Last resort: use a random string
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  return `user_${randomSuffix}`;
};

// Auth API methods
export const firebaseAuthApi = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      // Rate limit login attempts by email
      checkRateLimit(credentials.email, 'AUTH_LOGIN');

      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      const firebaseUser = userCredential.user;

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      let userData = userDoc.data();

      // If user profile doesn't exist (for demo user), create it
      if (!userData) {
        const demoUserData = {
          email: credentials.email,
          name:
            credentials.email === 'demo@ambira.com' ? 'Demo User' : 'New User',
          username:
            credentials.email === 'demo@ambira.com'
              ? 'demo'
              : credentials.email.split('@')[0],
          bio:
            credentials.email === 'demo@ambira.com'
              ? 'Welcome to Ambira! This is a demo account to explore the app.'
              : '',
          location:
            credentials.email === 'demo@ambira.com' ? 'San Francisco, CA' : '',
          profilePicture: null,
          followersCount: credentials.email === 'demo@ambira.com' ? 42 : 0,
          followingCount: credentials.email === 'demo@ambira.com' ? 28 : 0,
          totalHours: credentials.email === 'demo@ambira.com' ? 156.5 : 0,
          profileVisibility: 'everyone',
          activityVisibility: 'everyone',
          projectVisibility: 'everyone',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
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
        updatedAt: convertTimestamp(userData.updatedAt),
      };

      const token = await firebaseUser.getIdToken();

      return { user, token };
    } catch (error) {
      // Re-throw rate limit errors as-is
      if (error instanceof RateLimitError) {
        throw error;
      }
      const apiError = handleError(error, 'Login', {
        defaultMessage: 'Login failed',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Signup
  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    try {
      // Rate limit signup attempts by email
      checkRateLimit(credentials.email, 'AUTH_SIGNUP');

      // Validate username uniqueness BEFORE creating Firebase Auth user
      const usernameExists = await checkUsernameExists(credentials.username);
      if (usernameExists) {
        throw new Error(
          'This username is already taken. Please choose a different username.'
        );
      }

      // Create Firebase Auth user (this will throw if email already exists)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      const firebaseUser = userCredential.user;

      // Create user profile in Firestore
      const userData = {
        email: credentials.email,
        name: credentials.name,
        username: credentials.username,
        usernameLower: credentials.username.toLowerCase(),
        nameLower: credentials.name.toLowerCase(),
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
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: credentials.name,
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
        updatedAt: new Date(),
      };

      const token = await firebaseUser.getIdToken();

      return { user, token };
    } catch (error) {
      // Re-throw rate limit errors as-is
      if (error instanceof RateLimitError) {
        throw error;
      }
      const apiError = handleError(error, 'Signup', {
        defaultMessage: 'Signup failed',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Sign in with Google
  signInWithGoogle: async (): Promise<AuthResponse> => {
    try {
      const provider = new GoogleAuthProvider();
      // Add scopes for better user info
      provider.addScope('profile');
      provider.addScope('email');

      // Detect if user is on mobile device
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      let userCredential;

      if (isMobile) {
        // Use redirect for mobile devices (more reliable)
        await signInWithRedirect(auth, provider);
        // Redirect happens here - the user will be redirected to Google
        // The result will be handled by getRedirectResult in AuthContext
        return { user: null as any, token: '' }; // This won't be reached, but TypeScript needs it
      } else {
        // Use popup for desktop (better UX)
        try {
          userCredential = await signInWithPopup(auth, provider);
        } catch (popupError: any) {
          // If popup was blocked or failed, provide helpful error
          if (popupError.code === 'auth/popup-blocked') {
            throw new Error(
              'Popup was blocked. Please allow popups for this site and try again.'
            );
          } else if (popupError.code === 'auth/popup-closed-by-user') {
            throw new Error('Sign-in was cancelled.');
          } else if (popupError.code === 'auth/configuration-not-found') {
            throw new Error(
              'Google Sign-in is not configured. Please enable Google authentication in Firebase Console.'
            );
          } else if (popupError.code === 'auth/unauthorized-domain') {
            throw new Error(
              'This domain is not authorized for Google Sign-in. Please add it to authorized domains in Firebase Console.'
            );
          }
          // Re-throw if it's a different error
          throw popupError;
        }
      }

      const firebaseUser = userCredential.user;

      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      let userData = userDoc.data();

      // If user profile doesn't exist, create it
      if (!userData) {
        // Generate a unique username using the helper function
        const username = await generateUniqueUsername(
          firebaseUser.email!,
          firebaseUser.displayName || undefined
        );

        userData = {
          email: firebaseUser.email!,
          name: firebaseUser.displayName || 'New User',
          username: username,
          usernameLower: username.toLowerCase(),
          nameLower: (firebaseUser.displayName || 'New User').toLowerCase(),
          bio: '',
          location: '',
          profilePicture: firebaseUser.photoURL || null,
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
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
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
        updatedAt: convertTimestamp(userData.updatedAt),
      };

      const token = await firebaseUser.getIdToken();

      return { user, token };
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      // Provide more specific error messages
      if (error.message && error.message.includes('Firebase Console')) {
        throw error; // Re-throw our custom error messages
      }

      const apiError = handleError(error, 'Google sign-in', {
        defaultMessage:
          'Google sign-in failed. Please check that Google authentication is enabled in Firebase Console.',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      const apiError = handleError(error, 'Logout', {
        defaultMessage: 'Logout failed',
      });
      throw new Error(apiError.userMessage);
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
          updatedAt: serverTimestamp(),
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
        updatedAt: convertTimestamp(userData.updatedAt),
      };
    } catch (error) {
      const apiError = handleError(error, 'Get current user', {
        defaultMessage: 'Failed to get current user',
      });
      throw new Error(apiError.userMessage);
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
  // Handle Google redirect result (for mobile)
  handleGoogleRedirectResult: async (): Promise<AuthResponse | null> => {
    try {
      const result = await getRedirectResult(auth);

      if (!result) {
        // No redirect result (user didn't come from redirect flow)
        return null;
      }

      const firebaseUser = result.user;

      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      let userData = userDoc.data();

      // If user profile doesn't exist, create it
      if (!userData) {
        // Generate a unique username using the helper function
        const username = await generateUniqueUsername(
          firebaseUser.email!,
          firebaseUser.displayName || undefined
        );

        userData = {
          email: firebaseUser.email!,
          name: firebaseUser.displayName || 'New User',
          username: username,
          usernameLower: username.toLowerCase(),
          nameLower: (firebaseUser.displayName || 'New User').toLowerCase(),
          bio: '',
          location: '',
          profilePicture: firebaseUser.photoURL || null,
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
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
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
        updatedAt: convertTimestamp(userData.updatedAt),
      };

      const token = await firebaseUser.getIdToken();

      return { user, token };
    } catch (error: any) {
      console.error('Google redirect result error:', error);

      const apiError = handleError(error, 'Google sign-in redirect', {
        defaultMessage: 'Google sign-in failed. Please try again.',
      });
      throw new Error(apiError.userMessage);
    }
  },

  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  // Check if username is available (for signup validation)
  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    const exists = await checkUsernameExists(username);
    return !exists; // Return true if available (username does not exist)
  },
};

// User API methods
export const firebaseUserApi = {
  // Get user profile by username
  getUserProfile: async (username: string): Promise<UserProfile> => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '==', username)
      );
      const querySnapshot = await getDocs(usersQuery);

      if (querySnapshot.empty) {
        // Don't log "not found" as an error - it's expected user behavior
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
        const socialGraphDoc = await getDoc(
          doc(db, `social_graph/${auth.currentUser.uid}/outbound`, userDoc.id)
        );
        isFollowing = socialGraphDoc.exists();
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

      const shouldRecalculate =
        isOwnProfile ||
        userData.followersCount === undefined ||
        userData.followingCount === undefined;
      if (shouldRecalculate) {
        try {
          // Count followers (people who follow this user) using social_graph
          const inboundRef = collection(
            db,
            `social_graph/${userDoc.id}/inbound`
          );
          const inboundSnapshot = await getDocs(inboundRef);
          followersCount = inboundSnapshot.size;

          // Count following (people this user follows) using social_graph
          const outboundRef = collection(
            db,
            `social_graph/${userDoc.id}/outbound`
          );
          const outboundSnapshot = await getDocs(outboundRef);
          followingCount = outboundSnapshot.size;

          // Update the user document with correct counts
          // For own profile, always update to keep counts fresh
          // For others, update if they were missing
          if (
            isOwnProfile ||
            userData.followersCount === undefined ||
            userData.followingCount === undefined
          ) {
            await updateDoc(doc(db, 'users', userDoc.id), {
              followersCount,
              followingCount,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (error) {
          handleError(error, 'Recalculate follower counts', {
            severity: ErrorSeverity.WARNING,
          });
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
        updatedAt: convertTimestamp(userData.updatedAt),
      };
    } catch (error) {
      // Don't log "not found" and privacy errors - these are expected user flows
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to get user profile';
      const isExpectedError =
        errorMessage === 'User not found' ||
        errorMessage === 'This profile is private' ||
        errorMessage === 'This profile is only visible to followers';

      if (!isExpectedError) {
        handleError(error, 'Get user profile', {
          defaultMessage: 'Failed to get user profile',
        });
      }

      throw error;
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
        updatedAt: convertTimestamp(userData.updatedAt),
      };
    } catch (error) {
      // Handle permission errors for deleted users gracefully
      if (isPermissionError(error)) {
        throw new Error('User not found');
      }
      const apiError = handleError(error, 'Get user by ID', {
        defaultMessage: 'Failed to get user',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get daily activity for a given year (hours and sessions per day)
  getUserDailyActivity: async (
    userId: string,
    year: number
  ): Promise<ActivityData[]> => {
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

      const dayToTotals: Record<string, { seconds: number; sessions: number }> =
        {};

      snapshot.forEach(docSnap => {
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
      for (
        let d = new Date(startOfYear);
        d <= endOfYear;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().substring(0, 10);
        const item = dayToTotals[dateStr];
        results.push({
          date: dateStr,
          hours: item ? item.seconds / 3600 : 0,
          sessions: item ? item.sessions : 0,
        });
      }

      return results;
    } catch (error) {
      const apiError = handleError(error, 'Get daily activity', {
        defaultMessage: 'Failed to get daily activity',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get weekly activity for past N weeks (default 12)
  getUserWeeklyActivity: async (
    userId: string,
    numberOfWeeks: number = 12
  ): Promise<WeeklyActivity[]> => {
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
      const weekToTotals: Record<
        string,
        { seconds: number; sessions: number }
      > = {};

      const getWeekKey = (date: Date): string => {
        const d = new Date(
          Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
        );
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil(
          ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
        );
        return `${d.getUTCFullYear()}-W${weekNo}`;
      };

      snapshot.forEach(docSnap => {
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
    } catch (error) {
      const apiError = handleError(error, 'Get weekly activity', {
        defaultMessage: 'Failed to get weekly activity',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get project breakdown (hours per project) for a given year
  getUserProjectBreakdown: async (
    userId: string,
    year?: number
  ): Promise<ProjectBreakdown[]> => {
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
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const projectId = data.projectId || 'unknown';
        const durationSeconds = Number(data.duration) || 0;
        projectToSeconds[projectId] =
          (projectToSeconds[projectId] || 0) + durationSeconds;
      });

      const totalSeconds =
        Object.values(projectToSeconds).reduce((a, b) => a + b, 0) || 1;

      const results: ProjectBreakdown[] = [];
      // For each project, fetch project details for name/color
      for (const [projectId, seconds] of Object.entries(projectToSeconds)) {
        let name = 'Unknown Project';
        let color = '#64748B';
        try {
          const projectDoc = await getDoc(
            doc(db, 'projects', userId, 'userProjects', projectId)
          );
          const proj = projectDoc.data();
          if (proj) {
            name = proj.name || name;
            color = proj.color || color;
          }
        } catch {}

        const hours = seconds / 3600;
        const percentage = (seconds / totalSeconds) * 100;
        results.push({
          projectId,
          projectName: name,
          hours,
          percentage,
          color,
        });
      }

      // Sort by hours desc
      results.sort((a, b) => b.hours - a.hours);
      return results;
    } catch (error) {
      const apiError = handleError(error, 'Get project breakdown', {
        defaultMessage: 'Failed to get project breakdown',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Upload profile picture to Firebase Storage
  uploadProfilePicture: async (file: File): Promise<string> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error(
          'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.'
        );
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.');
      }

      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `profile_${timestamp}.${fileExtension}`;

      // Create storage reference
      const storageRef = ref(
        storage,
        `profile-pictures/${auth.currentUser.uid}/${fileName}`
      );

      // Upload file
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedBy: auth.currentUser.uid,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      const apiError = handleError(error, 'Upload profile picture', {
        defaultMessage: 'Failed to upload profile picture',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Delete old profile picture from Firebase Storage
  deleteProfilePicture: async (profilePictureUrl: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Only delete if it's a Firebase Storage URL
      if (!profilePictureUrl.includes('firebasestorage.googleapis.com')) {
        return; // Skip deletion for external URLs (e.g., Google profile photos)
      }

      // Extract the storage path from the URL
      const storageRef = ref(storage, profilePictureUrl);

      // Delete the file (will fail silently if file doesn't exist)
      try {
        await deleteObject(storageRef);
      } catch (error) {
        // Ignore errors if file doesn't exist
        if (!isNotFoundError(error)) {
          handleError(error, 'Delete old profile picture', {
            severity: ErrorSeverity.WARNING,
          });
        }
      }
    } catch (error) {
      handleError(error, 'in deleteProfilePicture', {
        severity: ErrorSeverity.WARNING,
      });
      // Don't throw error - this is a cleanup operation
    }
  },

  // Update user profile
  updateProfile: async (
    data: Partial<{
      name: string;
      bio: string;
      tagline: string;
      pronouns: string;
      location: string;
      website: string;
      profilePicture: string;
      socialLinks: {
        twitter?: string;
        github?: string;
        linkedin?: string;
      };
      profileVisibility: 'everyone' | 'followers' | 'private';
      activityVisibility: 'everyone' | 'followers' | 'private';
      projectVisibility: 'everyone' | 'followers' | 'private';
    }>
  ): Promise<UserProfile> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Strip undefined values to avoid Firestore errors
      const cleanData: Record<string, any> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanData[key] = value;
        }
      });

      // Add lowercase fields for searchability
      if (cleanData.name) {
        cleanData.nameLower = cleanData.name.toLowerCase();
      }

      const updateData = {
        ...cleanData,
        updatedAt: serverTimestamp(),
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
        updatedAt: convertTimestamp(userData.updatedAt),
      };
    } catch (error) {
      const apiError = handleError(error, 'Update profile', {
        defaultMessage: 'Failed to update profile',
      });
      throw new Error(apiError.userMessage);
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

      sessionsSnapshot.forEach(docSnap => {
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
      sessionsSnapshot.forEach(docSnap => {
        const start = convertTimestamp(docSnap.data().startTime);
        daysWithActivity.add(start.toISOString().substring(0, 10));
      });
      let currentStreak = 0;
      const cursor = new Date();
      cursor.setHours(0, 0, 0, 0);
      while (daysWithActivity.has(cursor.toISOString().substring(0, 10))) {
        currentStreak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      const longestStreak = Math.max(currentStreak, 0);

      // Average session duration (in minutes)
      const averageSessionDuration = sessionDurations.length
        ? Math.round(
            sessionDurations.reduce((a, b) => a + b, 0) /
              sessionDurations.length /
              60
          )
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
    } catch (error) {
      handleError(error, 'get user stats', { severity: ErrorSeverity.ERROR });
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
        activeProjects: 0,
      };
    }
  },

  // Follow user
  followUser: async (userId: string): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    // Rate limit follow actions
    checkRateLimit(auth.currentUser.uid, 'FOLLOW');
    await updateSocialGraph(auth.currentUser.uid, userId, 'follow');
  },

  // Unfollow user
  unfollowUser: async (userId: string): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    // Rate limit unfollow actions (uses same limit as follow)
    checkRateLimit(auth.currentUser.uid, 'FOLLOW');
    await updateSocialGraph(auth.currentUser.uid, userId, 'unfollow');
  },

  // Check if current user is following another user
  isFollowing: async (
    currentUserId: string,
    targetUserId: string
  ): Promise<boolean> => {
    try {
      const socialGraphDoc = await getDoc(
        doc(db, `social_graph/${currentUserId}/outbound`, targetUserId)
      );
      return socialGraphDoc.exists();
    } catch (error) {
      handleError(error, 'checking follow status', {
        severity: ErrorSeverity.ERROR,
      });
      return false;
    }
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
    } catch (error) {
      handleError(error, 'fetching followers', {
        severity: ErrorSeverity.ERROR,
      });
      const apiError = handleError(error, 'Fetch followers', {
        defaultMessage: 'Failed to fetch followers',
      });
      throw new Error(apiError.userMessage);
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
    } catch (error) {
      handleError(error, 'fetching following', {
        severity: ErrorSeverity.ERROR,
      });
      const apiError = handleError(error, 'Fetch following', {
        defaultMessage: 'Failed to fetch following',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Sync follower counts for a user (recalculate from follows collection)
  syncFollowerCounts: async (
    userId: string
  ): Promise<{ followersCount: number; followingCount: number }> => {
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
        updatedAt: serverTimestamp(),
      });

      return { followersCount, followingCount };
    } catch (error) {
      const apiError = handleError(error, 'Sync follower counts', {
        defaultMessage: 'Failed to sync follower counts',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Search users by username and name (case-insensitive, prefix match)
  searchUsers: async (
    searchTerm: string,
    page: number = 1,
    limitCount: number = 20
  ): Promise<{
    users: UserSearchResult[];
    totalCount: number;
    hasMore: boolean;
  }> => {
    try {
      // Rate limit search operations
      if (auth.currentUser) {
        checkRateLimit(auth.currentUser.uid, 'SEARCH');
      }

      const term = (searchTerm || '').trim();
      if (!term) {
        return { users: [], totalCount: 0, hasMore: false };
      }

      // Convert search term to lowercase for case-insensitive search
      const termLower = term.toLowerCase();

      // 1) Search by username prefix (case-insensitive)
      const usernameQ = query(
        collection(db, 'users'),
        orderBy('usernameLower'),
        where('usernameLower', '>=', termLower),
        where('usernameLower', '<=', termLower + '\uf8ff'),
        limit(limitCount)
      );

      // 2) Search by name prefix (case-insensitive)
      const nameQ = query(
        collection(db, 'users'),
        orderBy('nameLower'),
        where('nameLower', '>=', termLower),
        where('nameLower', '<=', termLower + '\uf8ff'),
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
          followersCount:
            userData.inboundFriendshipCount || userData.followersCount || 0,
          isFollowing: false,
        } as UserSearchResult;
      };

      usernameSnap.forEach(pushDoc);
      nameSnap.forEach(d => {
        if (!byId[d.id]) pushDoc(d);
      });

      // Convert to array and apply a basic relevance sort: exact prefix on username > name > others
      let users = Object.values(byId)
        .sort((a, b) => {
          const t = term.toLowerCase();
          const aUser = a.username?.toLowerCase() || '';
          const bUser = b.username?.toLowerCase() || '';
          const aName = a.name?.toLowerCase() || '';
          const bName = b.name?.toLowerCase() || '';

          const aScore =
            (aUser.startsWith(t) ? 2 : 0) + (aName.startsWith(t) ? 1 : 0);
          const bScore =
            (bUser.startsWith(t) ? 2 : 0) + (bName.startsWith(t) ? 1 : 0);
          return bScore - aScore;
        })
        .slice(0, limitCount);

      // Check if current user is following each user
      if (auth.currentUser) {
        const followingChecks = await Promise.all(
          users.map(async user => {
            if (user.id === auth.currentUser!.uid) {
              return { ...user, isFollowing: false }; // Don't check for own profile
            }
            const socialGraphDoc = await getDoc(
              doc(db, `social_graph/${auth.currentUser!.uid}/outbound`, user.id)
            );
            return { ...user, isFollowing: socialGraphDoc.exists() };
          })
        );
        users = followingChecks;
      }

      return {
        users,
        totalCount: users.length,
        hasMore: users.length === limitCount,
      };
    } catch (error) {
      const apiError = handleError(error, 'Search users', {
        defaultMessage: 'Failed to search users',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get suggested users
  getSuggestedUsers: async (
    limitCount: number = 10
  ): Promise<SuggestedUser[]> => {
    try {
      if (!auth.currentUser) {
        return [];
      }

      // Get users with public profiles - fetch more to account for filtering
      const usersQuery = query(
        collection(db, 'users'),
        where('profileVisibility', '==', 'everyone'),
        limit(limitCount * 3) // Get more to filter out current user and following
      );

      const querySnapshot = await getDocs(usersQuery);
      const allUsers: Array<{ id: string; data: any; followersCount: number }> =
        [];

      // Get list of users we're already following
      const followingList = await firebaseUserApi.getFollowing(
        auth.currentUser.uid
      );
      const followingIds = new Set(followingList.map(u => u.id));

      // Collect all eligible users
      querySnapshot.forEach(doc => {
        const userData = doc.data();

        // Skip current user and users we're already following
        if (doc.id === auth.currentUser?.uid || followingIds.has(doc.id)) {
          return;
        }

        allUsers.push({
          id: doc.id,
          data: userData,
          followersCount: userData.followersCount || 0,
        });
      });

      // Sort by followers count (popular users first) but include everyone
      allUsers.sort((a, b) => b.followersCount - a.followersCount);

      // Take only the limit we need
      const suggestions: SuggestedUser[] = allUsers
        .slice(0, limitCount)
        .map((user, index) => ({
          id: user.id,
          username: user.data.username,
          name: user.data.name,
          bio: user.data.bio,
          profilePicture: user.data.profilePicture,
          followersCount: user.followersCount,
          reason:
            user.followersCount > 10 ? 'popular_user' : 'similar_interests',
          isFollowing: false,
        }));

      return suggestions;
    } catch (error) {
      handleError(error, 'getting suggested users', {
        severity: ErrorSeverity.ERROR,
      });
      const apiError = handleError(error, 'Get suggested users', {
        defaultMessage: 'Failed to get suggested users',
      });
      throw new Error(apiError.userMessage);
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
        blockedUsers: userData?.blockedUsers || [],
      };
    } catch (error) {
      const apiError = handleError(error, 'Get privacy settings', {
        defaultMessage: 'Failed to get privacy settings',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Update privacy settings
  updatePrivacySettings: async (
    settings: Partial<PrivacySettings>
  ): Promise<PrivacySettings> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const updateData = {
        ...settings,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'users', auth.currentUser.uid), updateData);

      return {
        profileVisibility: settings.profileVisibility || 'everyone',
        activityVisibility: settings.activityVisibility || 'everyone',
        projectVisibility: settings.projectVisibility || 'everyone',
        blockedUsers: settings.blockedUsers || [],
      };
    } catch (error) {
      const apiError = handleError(error, 'Update privacy settings', {
        defaultMessage: 'Failed to update privacy settings',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Check if username is available
  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '==', username),
        limit(1)
      );
      const querySnapshot = await getDocs(usersQuery);
      return querySnapshot.empty;
    } catch (error) {
      // Handle Firebase permission errors gracefully
      if (isPermissionError(error)) {
        handleError(error, 'Check username availability', {
          severity: ErrorSeverity.WARNING,
        });
        // In case of permission error, assume username is available to allow registration to proceed
        // The actual uniqueness will be enforced by Firebase Auth and server-side validation
        return true;
      }
      const apiError = handleError(error, 'Check username availability');
      throw new Error(
        apiError.userMessage ||
          'Unable to verify username availability. Please try again.'
      );
    }
  },

  // Migration: Add lowercase fields to existing users
  migrateUsersToLowercase: async (): Promise<{
    success: number;
    failed: number;
    total: number;
  }> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const usersQuery = query(collection(db, 'users'), limit(500));
      const querySnapshot = await getDocs(usersQuery);

      let success = 0;
      let failed = 0;
      const total = querySnapshot.size;

      console.log(`Starting migration for ${total} users...`);

      for (const userDoc of querySnapshot.docs) {
        try {
          const userData = userDoc.data();
          const updates: any = { updatedAt: serverTimestamp() };

          if (userData.username && !userData.usernameLower) {
            updates.usernameLower = userData.username.toLowerCase();
          }

          if (userData.name && !userData.nameLower) {
            updates.nameLower = userData.name.toLowerCase();
          }

          // Only update if there are new fields to add
          if (Object.keys(updates).length > 1) {
            await updateDoc(doc(db, 'users', userDoc.id), updates);
            success++;
            console.log(`Migrated user ${userDoc.id} (${userData.username})`);
          }
        } catch (error) {
          failed++;
          console.error(`Failed to migrate user ${userDoc.id}:`, error);
        }
      }

      const result = { success, failed, total };
      console.log('Migration complete:', result);
      return result;
    } catch (error) {
      const apiError = handleError(error, 'Migrate users to lowercase', {
        defaultMessage: 'Failed to migrate users',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Delete user account and all associated data
  deleteAccount: async (): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      const userId = auth.currentUser.uid;
      console.log(`Starting account deletion for user ${userId}`);

      // 1. Delete all user's sessions
      console.log('Deleting sessions...');
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', userId)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessionDeletes = sessionsSnapshot.docs.map(doc =>
        deleteDoc(doc.ref)
      );
      await Promise.all(sessionDeletes);
      console.log(`Deleted ${sessionsSnapshot.size} sessions`);

      // 2. Delete all user's comments
      console.log('Deleting comments...');
      const commentsQuery = query(
        collection(db, 'comments'),
        where('userId', '==', userId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const commentDeletes = commentsSnapshot.docs.map(doc =>
        deleteDoc(doc.ref)
      );
      await Promise.all(commentDeletes);
      console.log(`Deleted ${commentsSnapshot.size} comments`);

      // 3. Delete all follow relationships where user is follower or following
      console.log('Deleting follow relationships...');
      const followsAsFollowerQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', userId)
      );
      const followsAsFollowingQuery = query(
        collection(db, 'follows'),
        where('followingId', '==', userId)
      );
      const [followsAsFollowerSnapshot, followsAsFollowingSnapshot] =
        await Promise.all([
          getDocs(followsAsFollowerQuery),
          getDocs(followsAsFollowingQuery),
        ]);
      const followDeletes = [
        ...followsAsFollowerSnapshot.docs.map(doc => deleteDoc(doc.ref)),
        ...followsAsFollowingSnapshot.docs.map(doc => deleteDoc(doc.ref)),
      ];
      await Promise.all(followDeletes);
      console.log(
        `Deleted ${followsAsFollowerSnapshot.size + followsAsFollowingSnapshot.size} follow relationships`
      );

      // 4. Delete user's projects and their tasks
      console.log('Deleting projects and tasks...');
      const projectsRef = collection(db, 'projects', userId, 'userProjects');
      const projectsSnapshot = await getDocs(projectsRef);

      for (const projectDoc of projectsSnapshot.docs) {
        // Delete tasks in each project
        const tasksRef = collection(
          db,
          'projects',
          userId,
          'userProjects',
          projectDoc.id,
          'tasks'
        );
        const tasksSnapshot = await getDocs(tasksRef);
        const taskDeletes = tasksSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(taskDeletes);

        // Delete the project
        await deleteDoc(projectDoc.ref);
      }
      console.log(`Deleted ${projectsSnapshot.size} projects and their tasks`);

      // 5. Delete user's streak data
      console.log('Deleting streak data...');
      try {
        const streakRef = doc(db, 'streaks', userId);
        await deleteDoc(streakRef);
        console.log('Deleted streak data');
      } catch (error) {
        console.log('No streak data to delete or error:', error);
      }

      // 6. Delete user's active session data
      console.log('Deleting active session data...');
      try {
        const activeSessionRef = doc(
          db,
          'users',
          userId,
          'activeSession',
          'current'
        );
        await deleteDoc(activeSessionRef);
        console.log('Deleted active session data');
      } catch (error) {
        console.log('No active session data to delete or error:', error);
      }

      // 7. Delete profile picture from storage if it exists
      console.log('Deleting profile picture...');
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.data();
        if (userData?.profilePicture) {
          const storageRef = ref(storage, `profile-pictures/${userId}`);
          await deleteObject(storageRef);
          console.log('Deleted profile picture from storage');
        }
      } catch (error) {
        console.log('No profile picture to delete or error:', error);
      }

      // 8. Delete the user document from Firestore
      console.log('Deleting user document...');
      await deleteDoc(doc(db, 'users', userId));
      console.log('Deleted user document');

      // 9. Finally, delete the Firebase Auth user
      console.log('Deleting Firebase Auth user...');
      await auth.currentUser.delete();
      console.log('Account deletion complete');
    } catch (error) {
      const apiError = handleError(error, 'Delete account', {
        defaultMessage:
          'Failed to delete account. Please try logging out and back in, then try again.',
      });
      throw new Error(apiError.userMessage);
    }
  },
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
          updatedAt: convertTimestamp(data.updatedAt),
        });
      });

      return projects;
    } catch (error) {
      const apiError = handleError(error, 'Get projects', {
        defaultMessage: 'Failed to get projects',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Create new project
  createProject: async (data: CreateProjectData): Promise<Project> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Rate limit project creation
      checkRateLimit(auth.currentUser.uid, 'PROJECT_CREATE');

      const projectData = removeUndefinedFields({
        ...data,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const docRef = await addDoc(
        collection(db, 'projects', auth.currentUser.uid, 'userProjects'),
        projectData
      );

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
        updatedAt: new Date(),
      };
    } catch (error) {
      const apiError = handleError(error, 'Create project', {
        defaultMessage: 'Failed to create project',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Update project
  updateProject: async (
    id: string,
    data: UpdateProjectData
  ): Promise<Project> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const updateData = removeUndefinedFields({
        ...data,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(
        doc(db, 'projects', auth.currentUser.uid, 'userProjects', id),
        updateData
      );

      // Get updated project
      const projectDoc = await getDoc(
        doc(db, 'projects', auth.currentUser.uid, 'userProjects', id)
      );
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
        updatedAt: convertTimestamp(projectData.updatedAt),
      };
    } catch (error) {
      const apiError = handleError(error, 'Update project', {
        defaultMessage: 'Failed to update project',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Delete project
  deleteProject: async (id: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      await deleteDoc(
        doc(db, 'projects', auth.currentUser.uid, 'userProjects', id)
      );
    } catch (error) {
      const apiError = handleError(error, 'Delete project', {
        defaultMessage: 'Failed to delete project',
      });
      throw new Error(apiError.userMessage);
    }
  },
};

// Firebase Task API
export const firebaseTaskApi = {
  // Get tasks for a project
  getProjectTasks: async (projectId: string): Promise<Task[]> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      console.log(
        'Firebase API: Getting tasks for project:',
        projectId,
        'User:',
        auth.currentUser.uid
      );
      const tasksQuery = query(
        collection(
          db,
          'projects',
          auth.currentUser.uid,
          'userProjects',
          projectId,
          'tasks'
        ),
        orderBy('createdAt', 'desc')
      );

      const tasksSnapshot = await getDocs(tasksQuery);
      console.log('Firebase API: Found tasks:', tasksSnapshot.docs.length);

      const tasks = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
        completedAt: doc.data().completedAt
          ? convertTimestamp(doc.data().completedAt)
          : undefined,
      })) as Task[];

      console.log('Firebase API: Processed tasks:', tasks);
      return tasks;
    } catch (error) {
      handleError(error, 'Firebase API: getting project tasks', {
        severity: ErrorSeverity.ERROR,
      });
      const apiError = handleError(error, 'Get project tasks', {
        defaultMessage: 'Failed to get project tasks',
      });
      throw new Error(apiError.userMessage);
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
        completedAt: doc.data().completedAt
          ? convertTimestamp(doc.data().completedAt)
          : undefined,
      })) as Task[];

      // TODO: Also load project tasks
      // For now, just return unassigned tasks
      // In the future, we should also load tasks from all projects

      return unassignedTasks;
    } catch (error) {
      const apiError = handleError(error, 'Get all tasks', {
        defaultMessage: 'Failed to get all tasks',
      });
      throw new Error(apiError.userMessage);
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
          collection(
            db,
            'projects',
            auth.currentUser.uid,
            'userProjects',
            data.projectId,
            'tasks'
          ),
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
    } catch (error) {
      const apiError = handleError(error, 'Create task', {
        defaultMessage: 'Failed to create task',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Update a task
  updateTask: async (
    id: string,
    data: UpdateTaskData,
    projectId?: string
  ): Promise<Task> => {
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
        docRef = doc(
          db,
          'projects',
          auth.currentUser.uid,
          'userProjects',
          projectId,
          'tasks',
          id
        );
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
    } catch (error) {
      const apiError = handleError(error, 'Update task', {
        defaultMessage: 'Failed to update task',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Delete a task
  deleteTask: async (id: string, projectId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      await deleteDoc(
        doc(
          db,
          'projects',
          auth.currentUser.uid,
          'userProjects',
          projectId,
          'tasks',
          id
        )
      );
    } catch (error) {
      const apiError = handleError(error, 'Delete task', {
        defaultMessage: 'Failed to delete task',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Bulk update tasks
  bulkUpdateTasks: async (
    update: BulkTaskUpdate,
    projectId: string
  ): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const batch = writeBatch(db);

      update.taskIds.forEach(taskId => {
        const taskRef = doc(
          db,
          'projects',
          auth.currentUser.uid,
          'userProjects',
          projectId,
          'tasks',
          taskId
        );
        batch.update(taskRef, {
          status: update.status,
          updatedAt: serverTimestamp(),
          completedAt: update.status === 'completed' ? serverTimestamp() : null,
        });
      });

      await batch.commit();
    } catch (error) {
      handleError(error, 'Bulk update tasks error', {
        severity: ErrorSeverity.ERROR,
      });
      const apiError = handleError(error, 'Bulk update tasks', {
        defaultMessage: 'Failed to bulk update tasks',
      });
      throw new Error(apiError.userMessage);
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
    } catch (error) {
      const apiError = handleError(error, 'Get task stats', {
        defaultMessage: 'Failed to get task stats',
      });
      throw new Error(apiError.userMessage);
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

      // Rate limit session creation
      checkRateLimit(auth.currentUser.uid, 'SESSION_CREATE');

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
              const taskDoc = await getDoc(
                doc(
                  db,
                  'projects',
                  auth.currentUser.uid,
                  'userProjects',
                  projectDoc.id,
                  'tasks',
                  taskId
                )
              );
              if (taskDoc.exists()) {
                const taskData = taskDoc.data();
                selectedTasks.push({
                  id: taskId,
                  projectId: projectDoc.id,
                  name: taskData.name,
                  status: taskData.status || 'active',
                  createdAt: convertTimestamp(taskData.createdAt),
                  updatedAt: convertTimestamp(taskData.updatedAt),
                  completedAt: taskData.completedAt
                    ? convertTimestamp(taskData.completedAt)
                    : undefined,
                });
                taskFound = true;
                break;
              }
            }

            // If not found in projects, try unassigned tasks
            if (!taskFound) {
              const taskDoc = await getDoc(
                doc(db, 'users', auth.currentUser.uid, 'tasks', taskId)
              );
              if (taskDoc.exists()) {
                const taskData = taskDoc.data();
                selectedTasks.push({
                  id: taskId,
                  projectId: null,
                  name: taskData.name,
                  status: taskData.status || 'active',
                  createdAt: convertTimestamp(taskData.createdAt),
                  updatedAt: convertTimestamp(taskData.updatedAt),
                  completedAt: taskData.completedAt
                    ? convertTimestamp(taskData.completedAt)
                    : undefined,
                });
              }
            }
          } catch (error) {
            handleError(error, `Fetch task ${taskId}`, {
              severity: ErrorSeverity.WARNING,
            });
          }
        }
      }

      // Prepare session data for Firestore
      const activityId = data.activityId || data.projectId; // Support both for backwards compatibility
      const sessionData: any = {
        userId: auth.currentUser.uid,
        activityId: activityId, // New field
        projectId: activityId, // Keep for backwards compatibility
        title: data.title,
        description: data.description || '',
        duration: data.duration,
        startTime: Timestamp.fromDate(data.startTime),
        tasks: selectedTasks,
        // tags removed - no longer used
        visibility: data.visibility || 'private',
        showStartTime: data.showStartTime || false,
        hideTaskNames: data.hideTaskNames || false,
        publishToFeeds: data.publishToFeeds ?? true,
        privateNotes: data.privateNotes || '',
        images: data.images || [],
        isArchived: false,
        // Social engagement fields (sessions ARE posts)
        supportCount: 0,
        supportedBy: [], // Initialize empty array for user IDs who support this session
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only add howFelt if it's defined (Firestore doesn't allow undefined values)
      if (data.howFelt !== undefined) {
        sessionData.howFelt = data.howFelt;
      }

      const docRef = await addDoc(collection(db, 'sessions'), sessionData);

      // CRITICAL: Clear active session immediately after creating the session
      // This ensures the timer is stopped even if the user navigates away
      try {
        await firebaseSessionApi.clearActiveSession();
        console.log('✅ Active session cleared after creating session');
      } catch (error) {
        handleError(error, 'clear active session', {
          severity: ErrorSeverity.WARNING,
        });
        // Don't fail session creation if clearing active session fails
      }

      // Update challenge progress for this session
      try {
        await firebaseChallengeApi.updateChallengeProgress(
          auth.currentUser.uid,
          {
            ...sessionData,
            id: docRef.id,
            startTime: data.startTime,
            tasks: selectedTasks,
          }
        );
      } catch (error) {
        handleError(error, 'update challenge progress', {
          severity: ErrorSeverity.WARNING,
        });
        // Don't fail session creation if challenge update fails
      }

      // Return session with proper structure
      const newSession: Session = {
        id: docRef.id,
        userId: auth.currentUser.uid,
        activityId: activityId,
        projectId: activityId, // Backwards compatibility
        title: data.title,
        description: data.description,
        duration: data.duration,
        startTime: data.startTime,
        tasks: selectedTasks,
        // tags removed - no longer used
        visibility: sessionData.visibility,
        showStartTime: sessionData.showStartTime,
        hideTaskNames: sessionData.hideTaskNames,
        publishToFeeds: sessionData.publishToFeeds,
        howFelt: data.howFelt,
        privateNotes: data.privateNotes,
        images: data.images || [],
        isArchived: false,
        // Social engagement fields (sessions ARE posts)
        supportCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('Session created successfully:', newSession);
      return newSession;
    } catch (error) {
      const apiError = handleError(error, 'Create session', {
        defaultMessage: 'Failed to create session',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Create session and post if visibility allows
  createSessionWithPost: async (
    sessionData: CreateSessionData,
    postContent: string,
    visibility: 'everyone' | 'followers' | 'private'
  ): Promise<{ session: Session; post?: Post }> => {
    try {
      console.log('Creating session with post:', {
        sessionData,
        postContent,
        visibility,
      });

      // Create session first with the correct visibility
      const session = await firebaseSessionApi.createSession({
        ...sessionData,
        visibility,
      });

      console.log('Session created:', session);

      let post: Post | undefined;

      // Create post if not private
      if (visibility !== 'private') {
        console.log('Creating post for session:', session.id);
        post = await firebasePostApi.createPost({
          sessionId: session.id,
          content: postContent,
          visibility,
        });
        console.log('Post created:', post);
      }

      return { session, post };
    } catch (error) {
      handleError(error, 'in createSessionWithPost', {
        severity: ErrorSeverity.ERROR,
      });
      const apiError = handleError(error, 'Create session with post', {
        defaultMessage: 'Failed to create session with post',
      });
      throw new Error(apiError.userMessage);
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
      await setDoc(
        userRef,
        {
          uid: userId,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Save the active session
      const activeSessionRef = doc(
        db,
        'users',
        userId,
        'activeSession',
        'current'
      );
      await setDoc(activeSessionRef, {
        startTime: Timestamp.fromDate(timerData.startTime),
        projectId: timerData.projectId,
        selectedTaskIds: timerData.selectedTaskIds,
        pausedDuration: timerData.pausedDuration || 0,
        isPaused: !!timerData.isPaused,
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      console.log('Active session saved successfully');
    } catch (error) {
      const apiError = handleError(error, 'Save active session');
      throw new Error(apiError.userMessage);
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
      const activeSessionRef = doc(
        db,
        'users',
        userId,
        'activeSession',
        'current'
      );
      const activeSessionDoc = await getDoc(activeSessionRef);

      if (!activeSessionDoc.exists()) {
        return null;
      }

      const data = activeSessionDoc.data();

      // Validate data exists and has required fields
      if (!data || !data.startTime || !data.projectId) {
        handleError(
          new Error('Active session data is incomplete'),
          'Get active session',
          { severity: ErrorSeverity.WARNING }
        );
        return null;
      }

      return {
        startTime: data.startTime.toDate(),
        projectId: data.projectId,
        selectedTaskIds: data.selectedTaskIds || [],
        pausedDuration: data.pausedDuration || 0,
        isPaused: !!data.isPaused,
      };
    } catch (error) {
      // If it's a permission error or document doesn't exist, silently return null
      if (isPermissionError(error) || isNotFoundError(error)) {
        return null;
      }
      handleError(error, 'Get active session', {
        severity: ErrorSeverity.ERROR,
      });
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
      const activeSessionRef = doc(
        db,
        'users',
        userId,
        'activeSession',
        'current'
      );

      // Delete the document immediately to prevent race conditions
      // This is atomic and prevents any in-flight auto-save from restoring the session
      await deleteDoc(activeSessionRef);

      console.log('Active session deleted successfully');

      // Broadcast cancellation to other tabs using localStorage event
      try {
        const event = {
          type: 'session-cancelled',
          timestamp: Date.now(),
          userId: userId,
        };
        localStorage.setItem('timer-event', JSON.stringify(event));
        // Remove immediately to trigger the event
        localStorage.removeItem('timer-event');
      } catch (storageError) {
        // Ignore storage errors (e.g., in private browsing mode)
        console.warn('Failed to broadcast session cancellation:', storageError);
      }
    } catch (error) {
      const apiError = handleError(error, 'Clear active session', {
        defaultMessage: 'Failed to clear active session',
      });
      throw new Error(apiError.userMessage);
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
        updatedAt: convertTimestamp(userData?.updatedAt) || new Date(),
      };

      // Process each session
      for (const sessionDoc of querySnapshot.docs) {
        const sessionData = sessionDoc.data();

        // Get project data
        let projectData = null;
        const projectId = sessionData.projectId;
        if (projectId) {
          try {
            const projectDoc = await getDoc(
              doc(db, 'projects', userId, 'userProjects', projectId)
            );
            if (projectDoc.exists()) {
              projectData = projectDoc.data();
            }
          } catch (error) {
            handleError(error, `Fetch project ${projectId}`, {
              severity: ErrorSeverity.WARNING,
            });
          }
        }

        const project: Project = projectData
          ? {
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
              updatedAt: convertTimestamp(projectData.updatedAt) || new Date(),
            }
          : {
              id: projectId || 'unknown',
              userId: userId,
              name: 'Unknown Project',
              description: '',
              icon: '📁',
              color: '#64748B',
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
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
          images: sessionData.images || [],
          createdAt: convertTimestamp(sessionData.createdAt) || new Date(),
          updatedAt: convertTimestamp(sessionData.updatedAt) || new Date(),
          user,
          project,
        });
      }

      console.log(`Found ${sessions.length} sessions for user ${userId}`);
      return sessions;
    } catch (error) {
      handleError(error, 'get user sessions', {
        severity: ErrorSeverity.ERROR,
      });
      const apiError = handleError(error, 'Get user sessions', {
        defaultMessage: 'Failed to get user sessions',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get count of user's sessions (for profile stats)
  getUserSessionsCount: async (
    userId: string,
    isOwnProfile: boolean = false
  ): Promise<number> => {
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
    } catch (error) {
      handleError(error, 'get user sessions count', {
        severity: ErrorSeverity.ERROR,
      });
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
          updatedAt: convertTimestamp(data.updatedAt),
        });
      });

      return {
        sessions,
        totalCount: sessions.length,
        hasMore: querySnapshot.docs.length === limitCount,
      };
    } catch (error) {
      const apiError = handleError(error, 'Get sessions', {
        defaultMessage: 'Failed to get sessions',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Update a session
  updateSession: async (
    sessionId: string,
    data: Partial<CreateSessionData>
  ): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (
        !sessionDoc.exists() ||
        sessionDoc.data().userId !== auth.currentUser.uid
      ) {
        throw new Error('Session not found or permission denied');
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.projectId !== undefined) updateData.projectId = data.projectId;
      if (data.visibility !== undefined)
        updateData.visibility = data.visibility;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.howFelt !== undefined) updateData.howFelt = data.howFelt;
      if (data.privateNotes !== undefined)
        updateData.privateNotes = data.privateNotes;
      if (data.images !== undefined) updateData.images = data.images;
      if (data.allowComments !== undefined)
        updateData.allowComments = data.allowComments;

      // Remove undefined values
      Object.keys(updateData).forEach(
        key => updateData[key] === undefined && delete updateData[key]
      );

      await updateDoc(sessionRef, updateData);
    } catch (error) {
      const apiError = handleError(error, 'Update session', {
        defaultMessage: 'Failed to update session',
      });
      throw new Error(apiError.userMessage);
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

      if (
        !sessionDoc.exists() ||
        sessionDoc.data().userId !== auth.currentUser.uid
      ) {
        throw new Error('Session not found or permission denied');
      }

      await deleteDoc(sessionRef);
    } catch (error) {
      const apiError = handleError(error, 'Delete session', {
        defaultMessage: 'Failed to delete session',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get a single session by ID
  getSession: async (sessionId: string): Promise<Session> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }

      const data = sessionDoc.data();

      // Check if user has permission to view
      if (data.userId !== auth.currentUser.uid) {
        throw new Error('Permission denied');
      }

      return {
        id: sessionDoc.id,
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
        images: data.images || [],
        supportCount: data.supportCount || 0,
        commentCount: data.commentCount || 0,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      };
    } catch (error) {
      const apiError = handleError(error, 'Get session', {
        defaultMessage: 'Failed to get session',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get a single session with full details (user and project info)
  getSessionWithDetails: async (sessionId: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }

      const data = sessionDoc.data();

      // Get user data
      const userData = await fetchUserDataForSocialContext(data.userId);

      // Get project data
      let project = null;
      if (data.projectId) {
        const projectRef = doc(
          db,
          'projects',
          data.userId,
          'userProjects',
          data.projectId
        );
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          project = {
            id: projectDoc.id,
            userId: data.userId,
            name: projectData.name,
            description: projectData.description || '',
            color: projectData.color || '#007AFF',
            icon: projectData.icon || 'FolderIcon',
            status: projectData.status || 'active',
            totalTime: projectData.totalTime || 0,
            sessionCount: projectData.sessionCount || 0,
            isArchived: projectData.isArchived || false,
            createdAt: convertTimestamp(projectData.createdAt),
            updatedAt: convertTimestamp(projectData.updatedAt),
          };
        }
      }

      // Check if current user has supported this session
      const supportedBy = data.supportedBy || [];
      const isSupported = supportedBy.includes(auth.currentUser.uid);

      return {
        id: sessionDoc.id,
        userId: data.userId,
        projectId: data.projectId || '',
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
        images: data.images || [],
        supportCount: data.supportCount || 0,
        supportedBy: supportedBy,
        commentCount: data.commentCount || 0,
        isSupported,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        user: {
          id: data.userId,
          name: userData?.name || 'Unknown User',
          username: userData?.username || '',
          email: userData?.email || '',
          profilePicture: userData?.profilePicture,
          bio: userData?.bio,
          location: userData?.location,
          totalHours: userData?.totalHours || 0,
          profileVisibility: userData?.profileVisibility || 'everyone',
          activityVisibility: userData?.activityVisibility || 'everyone',
          projectVisibility: userData?.projectVisibility || 'everyone',
          createdAt: userData?.createdAt || new Date(),
          updatedAt: userData?.updatedAt || new Date(),
        },
        project: project || {
          id: '',
          userId: data.userId,
          name: 'No Project',
          description: '',
          color: '#007AFF',
          icon: 'FolderIcon',
          status: 'active',
          totalTime: 0,
          sessionCount: 0,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    } catch (error) {
      // Don't log permission errors - these are expected for private/restricted sessions
      const silent = isPermissionError(error);
      const apiError = handleError(error, 'Get session with details', {
        defaultMessage: 'Failed to get session with details',
        silent,
      });
      throw new Error(apiError.userMessage);
    }
  },
};

// Helper function to process post documents into PostWithDetails
const processPosts = async (postDocs: any[]): Promise<PostWithDetails[]> => {
  const posts: PostWithDetails[] = [];
  const batchSize = 10;

  for (let i = 0; i < postDocs.length; i += batchSize) {
    const batch = postDocs.slice(i, i + batchSize);
    const batchPromises = batch.map(async postDoc => {
      const postData = postDoc.data();

      // Get user data
      const userDoc = await getDoc(doc(db, 'users', postData.userId));
      const userData = userDoc.data();

      // Get session data
      const sessionDoc = await getDoc(doc(db, 'sessions', postData.sessionId));
      const sessionData = sessionDoc.data();

      // Get project data
      let projectData = null;
      const projectId = sessionData?.projectId;
      if (projectId) {
        try {
          const projectDoc = await getDoc(
            doc(db, 'projects', postData.userId, 'userProjects', projectId)
          );
          if (projectDoc.exists()) {
            projectData = projectDoc.data();
          }
        } catch (error) {
          handleError(error, `Fetch project ${projectId}`, {
            severity: ErrorSeverity.WARNING,
          });
        }
      }

      // Check if current user has supported this post
      const supportDoc = auth.currentUser
        ? await getDoc(
            doc(db, 'postSupports', `${auth.currentUser.uid}_${postDoc.id}`)
          )
        : null;
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
          updatedAt: convertTimestamp(userData?.updatedAt) || new Date(),
        },
        session: sessionData
          ? {
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
              updatedAt: convertTimestamp(sessionData.updatedAt) || new Date(),
            }
          : ({
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
              updatedAt: new Date(),
            } as Session),
        project: projectData
          ? {
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
              updatedAt: convertTimestamp(projectData.updatedAt) || new Date(),
            }
          : ({
              id: projectId || 'unknown',
              userId: postData.userId,
              name: 'Unknown Project',
              description: '',
              icon: '📁',
              color: '#64748B',
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Project),
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
        updatedAt: serverTimestamp(),
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
        updatedAt: new Date(),
      };
    } catch (error) {
      const apiError = handleError(error, 'Create post', {
        defaultMessage: 'Failed to create post',
      });
      throw new Error(apiError.userMessage);
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
      const { type = 'recent', userId, projectId, groupId } = filters;

      // Handle different feed types - fetch from sessions collection
      if (type === 'group' && groupId) {
        // Group: fetch sessions from group members
        const membershipsQuery = query(
          collection(db, 'groupMemberships'),
          where('groupId', '==', groupId),
          where('status', '==', 'active')
        );
        const membershipsSnapshot = await getDocs(membershipsQuery);
        const memberIds = membershipsSnapshot.docs.map(
          doc => doc.data().userId
        );

        if (memberIds.length === 0) {
          return { sessions: [], hasMore: false, nextCursor: undefined };
        }

        // Fetch sessions from group members
        // Due to Firestore limitations, fetch all and filter
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('visibility', 'in', ['everyone', 'followers']),
          orderBy('createdAt', 'desc'),
          limit(limitCount * 3) // Fetch more to account for filtering
        );

        if (cursor) {
          const cursorDoc = await getDoc(doc(db, 'sessions', cursor));
          if (cursorDoc.exists()) {
            sessionsQuery = query(
              collection(db, 'sessions'),
              where('visibility', 'in', ['everyone', 'followers']),
              orderBy('createdAt', 'desc'),
              startAfter(cursorDoc),
              limit(limitCount * 3)
            );
          }
        }

        const querySnapshot = await getDocs(sessionsQuery);
        // Filter to only sessions from group members
        const filteredDocs = querySnapshot.docs
          .filter(doc => memberIds.includes(doc.data().userId))
          .slice(0, limitCount + 1);

        const sessions = await populateSessionsWithDetails(
          filteredDocs.slice(0, limitCount)
        );
        const hasMore = filteredDocs.length > limitCount;
        const nextCursor = hasMore
          ? filteredDocs[limitCount - 1]?.id
          : undefined;

        return { sessions, hasMore, nextCursor };
      } else if (type === 'following') {
        // Get list of users the current user is following
        const followingQuery = query(
          collection(db, 'follows'),
          where('followerId', '==', auth.currentUser.uid)
        );
        const followingSnapshot = await getDocs(followingQuery);
        const followingIds = followingSnapshot.docs.map(
          doc => doc.data().followingId
        );

        // Include current user's sessions too
        followingIds.push(auth.currentUser.uid);

        // If not following anyone yet, return empty feed
        if (
          followingIds.length === 1 &&
          followingIds[0] === auth.currentUser.uid
        ) {
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
        const filteredDocs = querySnapshot.docs
          .filter(doc => followingIds.includes(doc.data().userId))
          .slice(0, limitCount + 1);

        const sessions = await populateSessionsWithDetails(
          filteredDocs.slice(0, limitCount)
        );
        const hasMore = filteredDocs.length > limitCount;
        const nextCursor = hasMore
          ? filteredDocs[limitCount - 1]?.id
          : undefined;

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

        const paginatedDocs = sessionDocs.slice(
          startIndex,
          startIndex + limitCount + 1
        );
        const sessions = await populateSessionsWithDetails(
          paginatedDocs.slice(0, limitCount)
        );
        const hasMore = paginatedDocs.length > limitCount;
        const nextCursor = hasMore
          ? paginatedDocs[limitCount - 1]?.id
          : undefined;

        return { sessions, hasMore, nextCursor };
      } else if (type === 'user') {
        // User: fetch sessions for a specific user
        const targetUserId = userId || auth.currentUser.uid;

        sessionsQuery = query(
          collection(db, 'sessions'),
          where('userId', '==', targetUserId),
          orderBy('createdAt', 'desc'),
          limit(limitCount + 1)
        );

        if (cursor) {
          const cursorDoc = await getDoc(doc(db, 'sessions', cursor));
          if (cursorDoc.exists()) {
            sessionsQuery = query(
              collection(db, 'sessions'),
              where('userId', '==', targetUserId),
              orderBy('createdAt', 'desc'),
              startAfter(cursorDoc),
              limit(limitCount + 1)
            );
          }
        }

        const querySnapshot = await getDocs(sessionsQuery);
        const sessionDocs = querySnapshot.docs.slice(0, limitCount);
        const sessions = await populateSessionsWithDetails(sessionDocs);
        const hasMore = querySnapshot.docs.length > limitCount;
        const nextCursor = hasMore
          ? sessionDocs[sessionDocs.length - 1]?.id
          : undefined;

        return {
          sessions,
          hasMore,
          nextCursor,
        };
      } else if (type === 'all') {
        // All: chronological feed of all public sessions (not filtering anyone out)
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('visibility', 'in', ['everyone', 'followers']),
          orderBy('createdAt', 'desc'),
          limit(limitCount + 1)
        );

        if (cursor) {
          const cursorDoc = await getDoc(doc(db, 'sessions', cursor));
          if (cursorDoc.exists()) {
            sessionsQuery = query(
              collection(db, 'sessions'),
              where('visibility', 'in', ['everyone', 'followers']),
              orderBy('createdAt', 'desc'),
              startAfter(cursorDoc),
              limit(limitCount + 1)
            );
          }
        }

        const querySnapshot = await getDocs(sessionsQuery);
        const sessionDocs = querySnapshot.docs.slice(0, limitCount);
        const sessions = await populateSessionsWithDetails(sessionDocs);
        const hasMore = querySnapshot.docs.length > limitCount;
        const nextCursor = hasMore
          ? sessionDocs[sessionDocs.length - 1]?.id
          : undefined;

        return {
          sessions,
          hasMore,
          nextCursor,
        };
      } else {
        // Recent: default chronological feed of public sessions (excluding followed users)
        // Get list of users the current user is following to exclude them
        const followingQuery = query(
          collection(db, 'follows'),
          where('followerId', '==', auth.currentUser.uid)
        );
        const followingSnapshot = await getDocs(followingQuery);
        const followingIds = followingSnapshot.docs.map(
          doc => doc.data().followingId
        );

        // Also exclude current user's own posts
        followingIds.push(auth.currentUser.uid);

        // Fetch more sessions to account for filtering
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('visibility', '==', 'everyone'),
          orderBy('createdAt', 'desc'),
          limit(limitCount * 3)
        );

        if (cursor) {
          const cursorDoc = await getDoc(doc(db, 'sessions', cursor));
          if (cursorDoc.exists()) {
            sessionsQuery = query(
              collection(db, 'sessions'),
              where('visibility', '==', 'everyone'),
              orderBy('createdAt', 'desc'),
              startAfter(cursorDoc),
              limit(limitCount * 3)
            );
          }
        }

        const querySnapshot = await getDocs(sessionsQuery);

        // Filter out sessions from followed users and current user
        const filteredDocs = querySnapshot.docs
          .filter(doc => !followingIds.includes(doc.data().userId))
          .slice(0, limitCount + 1);

        const sessions = await populateSessionsWithDetails(
          filteredDocs.slice(0, limitCount)
        );
        const hasMore = filteredDocs.length > limitCount;
        const nextCursor = hasMore
          ? filteredDocs[limitCount - 1]?.id
          : undefined;

        return {
          sessions,
          hasMore,
          nextCursor,
        };
      }
    } catch (error) {
      handleError(error, 'in getFeedSessions', {
        severity: ErrorSeverity.ERROR,
      });
      const apiError = handleError(error, 'Get feed sessions', {
        defaultMessage: 'Failed to get feed sessions',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Support a session (like/kudos)
  supportSession: async (sessionId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Rate limit support actions
      checkRateLimit(auth.currentUser.uid, 'SUPPORT');

      const sessionRef = doc(db, 'sessions', sessionId);

      // Use transaction to safely add user ID to supportedBy array
      await runTransaction(db, async transaction => {
        const sessionDoc = await transaction.get(sessionRef);

        if (!sessionDoc.exists()) {
          throw new Error('Session not found');
        }

        const sessionData = sessionDoc.data();
        const supportedBy = sessionData.supportedBy || [];

        // Check if user already supported this session
        if (supportedBy.includes(auth.currentUser!.uid)) {
          return; // Already supported, do nothing
        }

        // Add user ID to supportedBy array and update supportCount
        transaction.update(sessionRef, {
          supportedBy: [...supportedBy, auth.currentUser!.uid],
          supportCount: supportedBy.length + 1,
          updatedAt: serverTimestamp(),
        });
      });

      // Create notification for support action (outside transaction)
      try {
        const sessionDoc = await getDoc(sessionRef);
        const sessionData = sessionDoc.data();

        // Only notify if supporting someone else's session
        if (sessionData && sessionData.userId !== auth.currentUser.uid) {
          const currentUserDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          const userData = currentUserDoc.data();

          await addDoc(collection(db, 'notifications'), {
            userId: sessionData.userId,
            type: 'support',
            title: 'New support',
            message: `${userData?.name || 'Someone'} supported your session`,
            linkUrl: `/sessions/${sessionId}`,
            actorId: auth.currentUser.uid,
            sessionId: sessionId,
            isRead: false,
            createdAt: serverTimestamp(),
          });
        }
      } catch (notifError) {
        // Log error but don't fail the support action
        handleError(notifError, 'create support notification', {
          severity: ErrorSeverity.ERROR,
          silent: true,
        });
      }
    } catch (error) {
      const apiError = handleError(error, 'Support session', {
        defaultMessage: 'Failed to support session',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Remove support from a session
  removeSupportFromSession: async (sessionId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const sessionRef = doc(db, 'sessions', sessionId);

      // Use transaction to safely remove user ID from supportedBy array
      await runTransaction(db, async transaction => {
        const sessionDoc = await transaction.get(sessionRef);

        if (!sessionDoc.exists()) {
          throw new Error('Session not found');
        }

        const sessionData = sessionDoc.data();
        const supportedBy = sessionData.supportedBy || [];

        // Check if user has supported this session
        if (!supportedBy.includes(auth.currentUser!.uid)) {
          return; // Not supported, do nothing
        }

        // Remove user ID from supportedBy array and update supportCount
        const newSupportedBy = supportedBy.filter(
          (id: string) => id !== auth.currentUser!.uid
        );
        transaction.update(sessionRef, {
          supportedBy: newSupportedBy,
          supportCount: newSupportedBy.length,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      const apiError = handleError(error, 'Remove support', {
        defaultMessage: 'Failed to remove support',
      });
      throw new Error(apiError.userMessage);
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
        updatedAt: serverTimestamp(),
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
        updatedAt: convertTimestamp(postData.updatedAt),
      };
    } catch (error) {
      const apiError = handleError(error, 'Update post', {
        defaultMessage: 'Failed to update post',
      });
      throw new Error(apiError.userMessage);
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
    } catch (error) {
      const apiError = handleError(error, 'Delete post', {
        defaultMessage: 'Failed to delete post',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Listen to real-time updates for session support counts
  listenToSessionUpdates: (
    sessionIds: string[],
    callback: (
      updates: Record<string, { supportCount: number; isSupported: boolean }>
    ) => void
  ) => {
    if (!auth.currentUser) return () => {};

    const unsubscribers: (() => void)[] = [];
    const currentUserId = auth.currentUser.uid;

    sessionIds.forEach(sessionId => {
      // Listen to session support count changes and support status
      const sessionUnsubscribe = onSnapshot(
        doc(db, 'sessions', sessionId),
        sessionDoc => {
          if (sessionDoc.exists()) {
            const sessionData = sessionDoc.data();
            const supportedBy = sessionData.supportedBy || [];
            callback({
              [sessionId]: {
                supportCount: sessionData.supportCount || 0,
                isSupported: supportedBy.includes(currentUserId),
              },
            });
          }
        },
        error => {
          handleError(error, `Listen to session ${sessionId}`, {
            severity: ErrorSeverity.ERROR,
          });
        }
      );

      unsubscribers.push(sessionUnsubscribe);
    });

    // Return cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  },

  // Get user's posts
  getUserPosts: async (
    userId: string,
    limitCount: number = 20,
    isOwnProfile: boolean = false
  ): Promise<PostWithDetails[]> => {
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
        const sessionDoc = await getDoc(
          doc(db, 'sessions', postData.sessionId)
        );
        const sessionData = sessionDoc.data();

        // Get project data
        let projectData = null;
        const projectId = sessionData?.projectId;
        if (projectId) {
          try {
            const projectDoc = await getDoc(
              doc(db, 'projects', postData.userId, 'userProjects', projectId)
            );
            if (projectDoc.exists()) {
              projectData = projectDoc.data();
            }
          } catch (error) {
            handleError(error, `Fetch project ${projectId}`, {
              severity: ErrorSeverity.WARNING,
            });
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
            updatedAt: convertTimestamp(userData?.updatedAt) || new Date(),
          },
          session: sessionData
            ? {
                id: postData.sessionId,
                userId: postData.userId,
                projectId: sessionData.projectId || '',
                title: sessionData.title || 'Untitled Session',
                description: sessionData.description || '',
                duration: sessionData.duration || 0,
                startTime:
                  convertTimestamp(sessionData.startTime) || new Date(),
                tasks: sessionData.tasks || [],
                tags: sessionData.tags || [],
                visibility: sessionData.visibility || 'everyone',
                showStartTime: sessionData.showStartTime,
                hideTaskNames: sessionData.hideTaskNames,
                publishToFeeds: sessionData.publishToFeeds,
                howFelt: sessionData.howFelt,
                privateNotes: sessionData.privateNotes,
                isArchived: sessionData.isArchived || false,
                createdAt:
                  convertTimestamp(sessionData.createdAt) || new Date(),
                updatedAt:
                  convertTimestamp(sessionData.updatedAt) || new Date(),
              }
            : ({
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
                updatedAt: new Date(),
              } as Session),
          project: projectData
            ? {
                id: projectId!,
                userId: postData.userId,
                name: projectData.name || 'Unknown Project',
                description: projectData.description || '',
                icon: projectData.icon || '📁',
                color: projectData.color || '#64748B',
                weeklyTarget: projectData.weeklyTarget,
                totalTarget: projectData.totalTarget,
                status: projectData.status || 'active',
                createdAt:
                  convertTimestamp(projectData.createdAt) || new Date(),
                updatedAt:
                  convertTimestamp(projectData.updatedAt) || new Date(),
              }
            : ({
                id: projectId || 'unknown',
                userId: postData.userId,
                name: 'Unknown Project',
                description: '',
                icon: '📁',
                color: '#64748B',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
              } as Project),
        });
      }

      return posts;
    } catch (error) {
      const apiError = handleError(error, 'Get user posts', {
        defaultMessage: 'Failed to get user posts',
      });
      throw new Error(apiError.userMessage);
    }
  },
};

// Firebase Comment API
export const firebaseCommentApi = {
  // Create a comment
  createComment: async (
    data: CreateCommentData
  ): Promise<CommentWithDetails> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Rate limit comment creation
      checkRateLimit(auth.currentUser.uid, 'COMMENT');

      const userId = auth.currentUser.uid;

      // Extract mentions from content
      const mentionRegex = /@(\w+)/g;
      const mentions = [...data.content.matchAll(mentionRegex)].map(
        match => match[1]
      );

      const commentData: any = {
        sessionId: data.sessionId,
        userId,
        content: data.content,
        likeCount: 0,
        replyCount: 0,
        isEdited: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only add parentId if it exists
      if (data.parentId) {
        commentData.parentId = data.parentId;
      }

      const docRef = await addDoc(collection(db, 'comments'), commentData);

      // Increment comment count on session
      const sessionRef = doc(db, 'sessions', data.sessionId);
      await updateDoc(sessionRef, {
        commentCount: increment(1),
      });

      // If this is a reply, increment reply count on parent comment
      if (data.parentId) {
        const parentCommentRef = doc(db, 'comments', data.parentId);
        await updateDoc(parentCommentRef, {
          replyCount: increment(1),
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

        const notificationPromises = usersSnapshot.docs.map(async userDoc => {
          const mentionedUserId = userDoc.id;
          if (mentionedUserId !== userId) {
            // Create notification
            await addDoc(collection(db, 'notifications'), {
              userId: mentionedUserId,
              type: 'mention',
              title: 'New mention',
              message: `${userData?.name} mentioned you in a comment`,
              linkUrl: `/sessions/${data.sessionId}`,
              actorId: userId,
              actorName: userData?.name,
              actorUsername: userData?.username,
              actorProfilePicture: userData?.profilePicture,
              sessionId: data.sessionId,
              commentId: docRef.id,
              isRead: false,
              createdAt: serverTimestamp(),
            });
          }
        });

        await Promise.all(notificationPromises);
      }

      // Create notification for session owner (if not commenting on own session)
      if (!data.parentId) {
        const sessionDoc = await getDoc(sessionRef);
        const sessionData = sessionDoc.data();

        if (sessionData && sessionData.userId !== userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: sessionData.userId,
            type: 'comment',
            title: 'New comment',
            message: `${userData?.name} commented on your session`,
            linkUrl: `/sessions/${data.sessionId}`,
            actorId: userId,
            actorName: userData?.name,
            actorUsername: userData?.username,
            actorProfilePicture: userData?.profilePicture,
            sessionId: data.sessionId,
            commentId: docRef.id,
            isRead: false,
            createdAt: serverTimestamp(),
          });
        }
      } else {
        // Create notification for parent comment owner (if replying to someone else)
        const parentCommentDoc = await getDoc(
          doc(db, 'comments', data.parentId)
        );
        const parentCommentData = parentCommentDoc.data();

        if (parentCommentData && parentCommentData.userId !== userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: parentCommentData.userId,
            type: 'reply',
            title: 'New reply',
            message: `${userData?.name} replied to your comment`,
            linkUrl: `/sessions/${data.sessionId}`,
            actorId: userId,
            actorName: userData?.name,
            actorUsername: userData?.username,
            actorProfilePicture: userData?.profilePicture,
            sessionId: data.sessionId,
            commentId: docRef.id,
            isRead: false,
            createdAt: serverTimestamp(),
          });
        }
      }

      return {
        id: docRef.id,
        sessionId: data.sessionId,
        userId,
        parentId: data.parentId,
        content: data.content,
        likeCount: 0,
        replyCount: 0,
        isLiked: false,
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: buildCommentUserDetails(userId, userData || null),
      };
    } catch (error) {
      const apiError = handleError(error, 'Create comment', {
        defaultMessage: 'Failed to create comment',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Update a comment
  updateComment: async (
    commentId: string,
    data: UpdateCommentData
  ): Promise<Comment> => {
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
        updatedAt: serverTimestamp(),
      });

      return {
        id: commentId,
        ...commentData,
        content: data.content,
        isEdited: true,
        createdAt: convertTimestamp(commentData.createdAt),
        updatedAt: new Date(),
      } as Comment;
    } catch (error) {
      const apiError = handleError(error, 'Update comment', {
        defaultMessage: 'Failed to update comment',
      });
      throw new Error(apiError.userMessage);
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

      repliesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      batch.delete(commentRef);

      await batch.commit();

      // Decrement comment count on session
      const sessionRef = doc(db, 'sessions', commentData.sessionId);
      await updateDoc(sessionRef, {
        commentCount: increment(-1 - repliesSnapshot.size), // -1 for the comment itself, and -repliesSnapshot.size for replies
      });

      // If this is a reply, decrement reply count on parent comment
      if (commentData.parentId) {
        const parentCommentRef = doc(db, 'comments', commentData.parentId);
        await updateDoc(parentCommentRef, {
          replyCount: increment(-1),
        });
      }
    } catch (error) {
      const apiError = handleError(error, 'Delete comment', {
        defaultMessage: 'Failed to delete comment',
      });
      throw new Error(apiError.userMessage);
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
        createdAt: serverTimestamp(),
      });

      // Increment like count on comment
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        likeCount: increment(1),
      });
    } catch (error) {
      const apiError = handleError(error, 'Like comment', {
        defaultMessage: 'Failed to like comment',
      });
      throw new Error(apiError.userMessage);
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
        likeCount: increment(-1),
      });
    } catch (error) {
      const apiError = handleError(error, 'Unlike comment', {
        defaultMessage: 'Failed to unlike comment',
      });
      throw new Error(apiError.userMessage);
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
        likedCommentIds = new Set(
          likesSnapshot.docs.map(d => d.data().commentId)
        );
      }

      // Build comments with user details
      const comments: CommentWithDetails[] = await Promise.all(
        docs.map(async docSnapshot => {
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
            user: buildCommentUserDetails(data.userId, userData),
          };
        })
      );

      return {
        comments,
        hasMore,
      };
    } catch (error) {
      // Handle permission errors gracefully - return empty comments
      if (isPermissionError(error)) {
        // Don't log permission errors - they're expected for restricted sessions
        return {
          comments: [],
          hasMore: false,
        };
      }

      // For other errors, log and throw with appropriate message
      const apiError = handleError(error, 'Get session comments', {
        defaultMessage: 'Failed to get session comments',
      });
      throw new Error(apiError.userMessage);
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
        likedCommentIds = new Set(
          likesSnapshot.docs.map(d => d.data().commentId)
        );
      }

      // Build comments with user details
      const comments: CommentWithDetails[] = await Promise.all(
        docs.map(async docSnapshot => {
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
            user: buildCommentUserDetails(data.userId, userData),
          };
        })
      );

      return {
        comments,
        hasMore,
        nextCursor: hasMore ? docs[docs.length - 1].id : undefined,
      };
    } catch (error) {
      const apiError = handleError(error, 'Get comments', {
        defaultMessage: 'Failed to get comments',
      });
      throw new Error(apiError.userMessage);
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
        likedCommentIds = new Set(
          likesSnapshot.docs.map(d => d.data().commentId)
        );
      }

      const replies: CommentWithDetails[] = await Promise.all(
        snapshot.docs.map(async docSnapshot => {
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
            user: buildCommentUserDetails(data.userId, userData),
          };
        })
      );

      return replies;
    } catch (error) {
      const apiError = handleError(error, 'Get replies', {
        defaultMessage: 'Failed to get replies',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get top comments sorted by like count
  getTopComments: async (
    sessionId: string,
    limitCount: number = 2
  ): Promise<CommentWithDetails[]> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;

      // Get top-level comments sorted by likeCount
      const q = query(
        collection(db, 'comments'),
        where('sessionId', '==', sessionId),
        orderBy('likeCount', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);

      // Filter for top-level comments only (no parentId)
      const topLevelDocs = snapshot.docs.filter(doc => !doc.data().parentId);

      // Get all comment likes for current user in one query
      const commentIds = topLevelDocs.map(d => d.id);
      let likedCommentIds = new Set<string>();
      if (commentIds.length > 0) {
        const likesQuery = query(
          collection(db, 'commentLikes'),
          where('userId', '==', userId),
          where('commentId', 'in', commentIds)
        );
        const likesSnapshot = await getDocs(likesQuery);
        likedCommentIds = new Set(
          likesSnapshot.docs.map(d => d.data().commentId)
        );
      }

      // Build comments with user details
      const comments: CommentWithDetails[] = await Promise.all(
        topLevelDocs.map(async docSnapshot => {
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
            user: buildCommentUserDetails(data.userId, userData),
          };
        })
      );

      return comments;
    } catch (error) {
      // Handle permission errors gracefully - return empty array
      if (isPermissionError(error)) {
        return [];
      }

      // For other errors, throw with appropriate message
      const apiError = handleError(error, 'Get top comments', {
        defaultMessage: 'Failed to get top comments',
      });
      throw new Error(apiError.userMessage);
    }
  },
};

// ==================== GROUP API ====================

const firebaseGroupApi = {
  // Create a new group
  createGroup: async (
    data: CreateGroupData,
    userId: string
  ): Promise<Group> => {
    try {
      const groupData = {
        ...data,
        createdByUserId: userId,
        adminUserIds: [userId],
        memberIds: [userId],
        memberCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'groups'), groupData);

      // Create membership record
      await addDoc(collection(db, 'groupMemberships'), {
        groupId: docRef.id,
        userId,
        role: 'admin',
        status: 'active',
        joinedAt: serverTimestamp(),
      });

      return {
        id: docRef.id,
        ...data,
        createdByUserId: userId,
        adminUserIds: [userId],
        memberIds: [userId],
        memberCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      const apiError = handleError(error, 'Create group', {
        defaultMessage: 'Failed to create group',
      });
      throw new Error(apiError.userMessage);
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
        updatedAt: convertTimestamp(data.updatedAt),
      };
    } catch (error) {
      const apiError = handleError(error, 'Get group', {
        defaultMessage: 'Failed to get group',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Update a group
  updateGroup: async (
    groupId: string,
    data: UpdateGroupData
  ): Promise<Group> => {
    try {
      const docRef = doc(db, 'groups', groupId);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);

      // Get updated group
      const updatedGroup = await firebaseGroupApi.getGroup(groupId);
      if (!updatedGroup) {
        throw new Error('Group not found after update');
      }

      return updatedGroup;
    } catch (error) {
      const apiError = handleError(error, 'Update group', {
        defaultMessage: 'Failed to update group',
      });
      throw new Error(apiError.userMessage);
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
      membershipsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete the group
      const groupRef = doc(db, 'groups', groupId);
      batch.delete(groupRef);

      await batch.commit();
    } catch (error) {
      const apiError = handleError(error, 'Delete group', {
        defaultMessage: 'Failed to delete group',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Search groups with filters
  searchGroups: async (
    filters: GroupFilters = {},
    limitCount: number = 20
  ): Promise<Group[]> => {
    try {
      const baseConstraints = filters.privacySetting
        ? [where('privacySetting', '==', filters.privacySetting)]
        : [where('privacySetting', 'in', ['public', 'approval-required'])];

      let q = query(
        collection(db, 'groups'),
        ...baseConstraints,
        orderBy('memberCount', 'desc'),
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

      querySnapshot.forEach(doc => {
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
          updatedAt: convertTimestamp(data.updatedAt),
        };

        // Apply search filter in memory (for text search)
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          if (
            group.name.toLowerCase().includes(searchLower) ||
            group.description.toLowerCase().includes(searchLower)
          ) {
            groups.push(group);
          }
        } else {
          groups.push(group);
        }
      });

      return groups;
    } catch (error) {
      const apiError = handleError(error, 'Search groups', {
        defaultMessage: 'Failed to search groups',
      });
      throw new Error(apiError.userMessage);
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
      if (group.memberIds && group.memberIds.includes(userId)) {
        throw new Error('User is already a member of this group');
      }

      const batch = writeBatch(db);

      // Add user to group - ensure memberIds exists and is an array
      const groupRef = doc(db, 'groups', groupId);
      const currentMemberIds = group.memberIds || [];
      batch.update(groupRef, {
        memberIds: [...currentMemberIds, userId],
        memberCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      // Create membership record
      const membershipData: Record<string, any> = {
        groupId,
        userId,
        role: 'member',
        status: group.privacySetting === 'public' ? 'active' : 'pending',
        joinedAt: serverTimestamp(),
      };

      const membershipRef = doc(collection(db, 'groupMemberships'));
      batch.set(membershipRef, membershipData);

      await batch.commit();
    } catch (error) {
      const apiError = handleError(error, 'Join group', {
        defaultMessage: 'Failed to join group',
      });
      throw new Error(apiError.userMessage);
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
      if (
        group.adminUserIds.includes(userId) &&
        group.adminUserIds.length === 1
      ) {
        throw new Error(
          'Cannot leave group as the only admin. Transfer ownership or delete the group.'
        );
      }

      const batch = writeBatch(db);

      // Remove user from group
      const groupRef = doc(db, 'groups', groupId);
      batch.update(groupRef, {
        memberIds: group.memberIds.filter(id => id !== userId),
        adminUserIds: group.adminUserIds.filter(id => id !== userId),
        memberCount: increment(-1),
        updatedAt: serverTimestamp(),
      });

      // Update membership status
      const membershipsQuery = query(
        collection(db, 'groupMemberships'),
        where('groupId', '==', groupId),
        where('userId', '==', userId)
      );
      const membershipsSnapshot = await getDocs(membershipsQuery);

      membershipsSnapshot.forEach(doc => {
        batch.update(doc.ref, { status: 'left' });
      });

      await batch.commit();
    } catch (error) {
      const apiError = handleError(error, 'Leave group', {
        defaultMessage: 'Failed to leave group',
      });
      throw new Error(apiError.userMessage);
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
            updatedAt: convertTimestamp(userData.updatedAt),
          });
        }
      }

      return users;
    } catch (error) {
      const apiError = handleError(error, 'Get group members', {
        defaultMessage: 'Failed to get group members',
      });
      throw new Error(apiError.userMessage);
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
    } catch (error) {
      const apiError = handleError(error, 'Get user groups', {
        defaultMessage: 'Failed to get user groups',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get group statistics
  getGroupStats: async (groupId: string): Promise<GroupStats> => {
    try {
      const group = await firebaseGroupApi.getGroup(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Calculate date ranges
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get all sessions for group members
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where(
          'userId',
          'in',
          group.memberIds.length > 0 ? group.memberIds.slice(0, 10) : ['dummy']
        )
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);

      let totalHours = 0;
      let weeklyHours = 0;
      let monthlyHours = 0;
      const totalSessions = sessionsSnapshot.size;
      const projectHours: {
        [key: string]: { hours: number; name: string; memberCount: number };
      } = {};
      const activeMemberIds = new Set<string>();

      sessionsSnapshot.forEach(doc => {
        const data = doc.data();
        const hours = data.duration / 3600;
        totalHours += hours;

        const sessionDate = data.createdAt?.toDate() || new Date(0);
        if (sessionDate >= oneWeekAgo) {
          weeklyHours += hours;
        }
        if (sessionDate >= oneMonthAgo) {
          monthlyHours += hours;
          activeMemberIds.add(data.userId);
        }

        // Track project hours
        if (data.projectId) {
          if (!projectHours[data.projectId]) {
            projectHours[data.projectId] = {
              hours: 0,
              name: 'Project',
              memberCount: 0,
            };
          }
          projectHours[data.projectId].hours += hours;
        }
      });

      // Convert project hours to array and sort
      const topProjects = Object.entries(projectHours)
        .map(([projectId, data]) => ({
          projectId,
          projectName: data.name,
          hours: data.hours,
          memberCount: 1,
        }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 10);

      return {
        totalMembers: group.memberCount,
        totalPosts: 0,
        totalSessions,
        totalHours,
        weeklyHours,
        monthlyHours,
        activeMembers: activeMemberIds.size,
        topProjects,
      };
    } catch (error) {
      const apiError = handleError(error, 'Get group stats', {
        defaultMessage: 'Failed to get group stats',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get group analytics data for charts
  getGroupAnalytics: async (
    groupId: string,
    timeRange: 'week' | 'month' | 'year' = 'month'
  ) => {
    try {
      const group = await firebaseGroupApi.getGroup(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      const now = new Date();
      let startDate: Date;
      const intervals: { start: Date; end: Date; label: string }[] = [];

      // Calculate time range and intervals
      if (timeRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        // Daily intervals for the week
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          intervals.push({
            start: new Date(date.setHours(0, 0, 0, 0)),
            end: new Date(date.setHours(23, 59, 59, 999)),
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          });
        }
      } else if (timeRange === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Weekly intervals for the month
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(
            now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000
          );
          const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
          intervals.push({
            start: weekStart,
            end: weekEnd,
            label: `Week ${4 - i}`,
          });
        }
      } else {
        // year
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        // Monthly intervals for the year
        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date(now);
          monthDate.setMonth(monthDate.getMonth() - i);
          monthDate.setDate(1);
          intervals.push({
            start: new Date(monthDate.setHours(0, 0, 0, 0)),
            end: new Date(
              monthDate.getFullYear(),
              monthDate.getMonth() + 1,
              0,
              23,
              59,
              59,
              999
            ),
            label: monthDate.toLocaleDateString('en-US', { month: 'short' }),
          });
        }
      }

      // Get sessions for the time range
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where(
          'userId',
          'in',
          group.memberIds.length > 0 ? group.memberIds.slice(0, 10) : ['dummy']
        ),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'asc')
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);

      // Calculate hours per interval
      const hoursData = intervals.map(interval => {
        let hours = 0;
        const members = new Set<string>();

        sessionsSnapshot.forEach(doc => {
          const data = doc.data();
          const sessionDate = data.createdAt?.toDate() || new Date(0);

          if (sessionDate >= interval.start && sessionDate <= interval.end) {
            hours += data.duration / 3600;
            members.add(data.userId);
          }
        });

        return {
          date: interval.label,
          hours: parseFloat(hours.toFixed(1)),
          members: members.size,
        };
      });

      // Get membership growth data
      const membershipsQuery = query(
        collection(db, 'groupMemberships'),
        where('groupId', '==', groupId),
        where('status', '==', 'active'),
        orderBy('joinedAt', 'asc')
      );
      const membershipsSnapshot = await getDocs(membershipsQuery);

      const membershipGrowth = intervals.map(interval => {
        let memberCount = 0;
        membershipsSnapshot.forEach(doc => {
          const data = doc.data();
          const joinDate = data.joinedAt?.toDate() || new Date(0);
          if (joinDate <= interval.end) {
            memberCount++;
          }
        });

        return {
          date: interval.label,
          members: memberCount,
        };
      });

      return {
        hoursData,
        membershipGrowth,
      };
    } catch (error) {
      const apiError = handleError(error, 'Get group analytics', {
        defaultMessage: 'Failed to get group analytics',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get group leaderboard
  getGroupLeaderboard: async (
    groupId: string,
    timePeriod: 'today' | 'week' | 'month' | 'year' = 'week'
  ): Promise<
    Array<{
      user: User;
      totalHours: number;
      sessionCount: number;
      rank: number;
    }>
  > => {
    try {
      const group = await firebaseGroupApi.getGroup(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Calculate date range based on time period
      const now = new Date();
      let startDate: Date;

      switch (timePeriod) {
        case 'today':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Firestore 'in' queries are limited to 10 items, so we need to batch
      const memberIds = group.memberIds || [];
      if (memberIds.length === 0) {
        return [];
      }

      const userHoursMap = new Map<
        string,
        { totalHours: number; sessionCount: number }
      >();

      // Process members in batches of 10
      for (let i = 0; i < memberIds.length; i += 10) {
        const batch = memberIds.slice(i, Math.min(i + 10, memberIds.length));

        const sessionsQuery = query(
          collection(db, 'sessions'),
          where('userId', 'in', batch),
          where('startTime', '>=', Timestamp.fromDate(startDate))
        );

        const sessionsSnapshot = await getDocs(sessionsQuery);

        sessionsSnapshot.forEach(doc => {
          const data = doc.data();
          const userId = data.userId;
          const hours = (data.duration || 0) / 3600; // Convert seconds to hours

          const current = userHoursMap.get(userId) || {
            totalHours: 0,
            sessionCount: 0,
          };
          userHoursMap.set(userId, {
            totalHours: current.totalHours + hours,
            sessionCount: current.sessionCount + 1,
          });
        });
      }

      // Get user details and create leaderboard entries
      const leaderboardPromises = memberIds.map(async userId => {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          return null;
        }

        const userData = userDoc.data();
        const user: User = {
          id: userDoc.id,
          email: userData.email || '',
          name: userData.name || 'Unknown User',
          username: userData.username || 'unknown',
          bio: userData.bio,
          location: userData.location,
          profilePicture: userData.profilePicture,
          createdAt: convertTimestamp(userData.createdAt) || new Date(),
          updatedAt: convertTimestamp(userData.updatedAt) || new Date(),
        };

        const stats = userHoursMap.get(userId) || {
          totalHours: 0,
          sessionCount: 0,
        };

        return {
          user,
          totalHours: stats.totalHours,
          sessionCount: stats.sessionCount,
          rank: 0, // Will be set after sorting
        };
      });

      const leaderboard = (await Promise.all(leaderboardPromises))
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .sort((a, b) => b.totalHours - a.totalHours)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      return leaderboard;
    } catch (error) {
      const apiError = handleError(error, 'Get group leaderboard', {
        defaultMessage: 'Failed to get group leaderboard',
      });
      throw new Error(apiError.userMessage);
    }
  },
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
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'challenges'), challengeData);

      return {
        id: docRef.id,
        ...data,
        createdByUserId: auth.currentUser.uid,
        participantCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      const apiError = handleError(error, 'Create challenge', {
        defaultMessage: 'Failed to create challenge',
      });
      throw new Error(apiError.userMessage);
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
        rewards: data.rewards,
      };
    } catch (error) {
      const apiError = handleError(error, 'Get challenge', {
        defaultMessage: 'Failed to get challenge',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get challenges with filters
  getChallenges: async (
    filters: ChallengeFilters = {}
  ): Promise<Challenge[]> => {
    try {
      // Start with a simple query to avoid complex index requirements
      let challengesQuery = query(
        collection(db, 'challenges'),
        orderBy('createdAt', 'desc')
      );

      // Apply simple filters first
      if (filters.groupId) {
        challengesQuery = query(
          collection(db, 'challenges'),
          where('groupId', '==', filters.groupId),
          orderBy('createdAt', 'desc')
        );
      } else if (filters.type) {
        challengesQuery = query(
          collection(db, 'challenges'),
          where('type', '==', filters.type),
          orderBy('createdAt', 'desc')
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
              doc(
                db,
                'challengeParticipants',
                `${auth.currentUser.uid}_${challengeDoc.id}`
              )
            );
            if (!participantDoc.exists()) {
              continue;
            }
          } catch (error) {
            // If we can't check participation, skip this challenge
            handleError(
              error,
              `Check participation for challenge ${challengeDoc.id}`,
              { severity: ErrorSeverity.WARNING }
            );
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
        });
      }

      return challenges;
    } catch (error) {
      handleError(error, 'in getChallenges', { severity: ErrorSeverity.ERROR });
      const apiError = handleError(error, 'Get challenges', {
        defaultMessage: 'Failed to get challenges',
      });
      throw new Error(apiError.userMessage);
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
      const existingParticipant = await getDoc(
        doc(db, 'challengeParticipants', participantId)
      );
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
        isCompleted: false,
      });

      // Update participant count
      batch.update(doc(db, 'challenges', challengeId), {
        participantCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      const apiError = handleError(error, 'Join challenge', {
        defaultMessage: 'Failed to join challenge',
      });
      throw new Error(apiError.userMessage);
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
      const participantDoc = await getDoc(
        doc(db, 'challengeParticipants', participantId)
      );
      if (!participantDoc.exists()) {
        throw new Error('Not participating in this challenge');
      }

      const batch = writeBatch(db);

      // Remove participant
      batch.delete(doc(db, 'challengeParticipants', participantId));

      // Update participant count
      batch.update(doc(db, 'challenges', challengeId), {
        participantCount: increment(-1),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      const apiError = handleError(error, 'Leave challenge', {
        defaultMessage: 'Failed to leave challenge',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get challenge leaderboard
  getChallengeLeaderboard: async (
    challengeId: string
  ): Promise<ChallengeLeaderboard> => {
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
          const userDoc = await getDoc(
            doc(db, 'users', participantData.userId)
          );
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
                updatedAt: convertTimestamp(userData.updatedAt) || new Date(),
              },
              progress: participantData.progress || 0,
              rank,
              isCompleted: participantData.isCompleted || false,
              completedAt: participantData.completedAt
                ? convertTimestamp(participantData.completedAt)
                : undefined,
            });
            rank++;
          }
        } catch (error) {
          handleError(
            error,
            `Load user data for participant ${participantData.userId}`,
            { severity: ErrorSeverity.WARNING }
          );
        }
      }

      return {
        challengeId,
        entries,
        lastUpdated: new Date(),
      };
    } catch (error) {
      const apiError = handleError(error, 'Get challenge leaderboard', {
        defaultMessage: 'Failed to get challenge leaderboard',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get user's progress in a challenge
  getChallengeProgress: async (
    challengeId: string,
    userId?: string
  ): Promise<ChallengeProgress | null> => {
    try {
      const targetUserId = userId || auth.currentUser?.uid;
      if (!targetUserId) {
        throw new Error('User not authenticated');
      }

      const participantId = `${targetUserId}_${challengeId}`;
      const participantDoc = await getDoc(
        doc(db, 'challengeParticipants', participantId)
      );

      if (!participantDoc.exists()) {
        return null;
      }

      const participantData = participantDoc.data();
      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
      const challengeData = challengeDoc.data();

      // Calculate percentage based on challenge type and goal
      let percentage = 0;
      if (challengeData?.goalValue && participantData.progress) {
        percentage = Math.min(
          (participantData.progress / challengeData.goalValue) * 100,
          100
        );
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
        lastUpdated: convertTimestamp(participantData.updatedAt) || new Date(),
      };
    } catch (error) {
      const apiError = handleError(error, 'Get challenge progress', {
        defaultMessage: 'Failed to get challenge progress',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Update challenge progress (called when sessions are logged)
  updateChallengeProgress: async (
    userId: string,
    sessionData: any
  ): Promise<void> => {
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
        if (
          !challengeData.isActive ||
          sessionStart < startDate ||
          sessionStart > endDate
        ) {
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
                progressIncrement =
                  currentRatio - (participantData.progress || 0);
              }
            }
            break;
          case 'longest-session':
            // Update if this session is longer than current best
            const sessionHours = sessionData.duration / 3600;
            if (sessionHours > (participantData.progress || 0)) {
              progressIncrement =
                sessionHours - (participantData.progress || 0);
            }
            break;
          case 'group-goal':
            progressIncrement = sessionData.duration / 3600; // Contribute hours to group goal
            break;
        }

        if (progressIncrement > 0) {
          const newProgress =
            (participantData.progress || 0) + progressIncrement;
          const isCompleted = challengeData.goalValue
            ? newProgress >= challengeData.goalValue
            : false;

          const updateData: any = {
            progress: newProgress,
            updatedAt: serverTimestamp(),
          };

          if (isCompleted && !participantData.isCompleted) {
            updateData.isCompleted = true;
            updateData.completedAt = serverTimestamp();
          }

          batch.update(participantDoc.ref, updateData);
        }
      }

      await batch.commit();
    } catch (error) {
      handleError(error, 'update challenge progress', {
        severity: ErrorSeverity.ERROR,
      });
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

      participantsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.isCompleted) {
          completedParticipants++;
        }
        totalProgress += data.progress || 0;
      });

      const averageProgress =
        totalParticipants > 0 ? totalProgress / totalParticipants : 0;

      // Get top performers (top 3)
      const leaderboard =
        await firebaseChallengeApi.getChallengeLeaderboard(challengeId);
      const topPerformers = leaderboard.entries.slice(0, 3);

      return {
        totalParticipants,
        completedParticipants,
        averageProgress,
        topPerformers,
        timeRemaining: Math.floor(timeRemaining / 1000), // Convert to seconds
        daysRemaining,
      };
    } catch (error) {
      const apiError = handleError(error, 'Get challenge stats', {
        defaultMessage: 'Failed to get challenge stats',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Update challenge (admin only)
  updateChallenge: async (
    challengeId: string,
    data: UpdateChallengeData
  ): Promise<Challenge> => {
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
        throw new Error(
          'Only challenge creators or group admins can update challenges'
        );
      }

      const updateData = removeUndefinedFields({
        ...data,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'challenges', challengeId), updateData);

      // Return updated challenge
      return await firebaseChallengeApi.getChallenge(challengeId);
    } catch (error) {
      const apiError = handleError(error, 'Update challenge', {
        defaultMessage: 'Failed to update challenge',
      });
      throw new Error(apiError.userMessage);
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
        throw new Error(
          'Only challenge creators or group admins can delete challenges'
        );
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

      participantsSnapshot.forEach(participantDoc => {
        batch.delete(participantDoc.ref);
      });

      await batch.commit();
    } catch (error) {
      const apiError = handleError(error, 'Delete challenge', {
        defaultMessage: 'Failed to delete challenge',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Search challenges with filters and limit
  searchChallenges: async (
    filters: ChallengeFilters = {},
    limitCount: number = 50
  ): Promise<Challenge[]> => {
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
          category: data.category,
        });
      }

      return challenges;
    } catch (error) {
      handleError(error, 'in searchChallenges', {
        severity: ErrorSeverity.ERROR,
      });
      const apiError = handleError(error, 'Search challenges', {
        defaultMessage: 'Failed to search challenges',
      });
      throw new Error(apiError.userMessage);
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
          const challenge =
            await firebaseChallengeApi.getChallenge(challengeId);
          challenges.push(challenge);
        } catch (error) {
          handleError(error, `Load challenge ${challengeId}`, {
            severity: ErrorSeverity.WARNING,
          });
        }
      }

      // Sort by most recent first
      challenges.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return challenges;
    } catch (error) {
      const apiError = handleError(error, 'Get user challenges', {
        defaultMessage: 'Failed to get user challenges',
      });
      throw new Error(apiError.userMessage);
    }
  },
};

// Import additional types for streak and achievement
import type {
  StreakData,
  StreakDay,
  StreakStats,
  Achievement,
  AchievementType,
  UserAchievementData,
  AchievementProgress,
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
          isPublic: true,
        };
        await setDoc(doc(db, 'streaks', userId), {
          ...initialStreak,
          lastActivityDate: Timestamp.fromDate(initialStreak.lastActivityDate),
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
        isPublic: data.isPublic !== false,
      };
    } catch (error) {
      const apiError = handleError(error, 'Get streak data', {
        defaultMessage: 'Failed to get streak data',
      });
      throw new Error(apiError.userMessage);
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

      const daysSinceActivity = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
      const streakAtRisk = daysSinceActivity >= 1;

      // Calculate next milestone
      const milestones = [7, 30, 100, 365, 500, 1000];
      const nextMilestone =
        milestones.find(m => m > streakData.currentStreak) ||
        milestones[milestones.length - 1];

      return {
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        totalStreakDays: streakData.totalStreakDays,
        lastActivityDate:
          streakData.lastActivityDate.getTime() === 0
            ? null
            : streakData.lastActivityDate,
        streakAtRisk,
        nextMilestone,
      };
    } catch (error) {
      const apiError = handleError(error, 'Get streak stats', {
        defaultMessage: 'Failed to get streak stats',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Update streak after session completion
  updateStreak: async (
    userId: string,
    sessionDate: Date
  ): Promise<StreakData> => {
    try {
      const streakData = await firebaseStreakApi.getStreakData(userId);

      const sessionDay = new Date(
        sessionDate.getFullYear(),
        sessionDate.getMonth(),
        sessionDate.getDate()
      );
      const lastActivityDay = new Date(
        streakData.lastActivityDate.getFullYear(),
        streakData.lastActivityDate.getMonth(),
        streakData.lastActivityDate.getDate()
      );

      const daysDiff = Math.floor(
        (sessionDay.getTime() - lastActivityDay.getTime()) /
          (1000 * 60 * 60 * 24)
      );

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
      const existingDayIndex = streakData.streakHistory.findIndex(
        d => d.date === dateStr
      );

      let newHistory = [...streakData.streakHistory];
      if (existingDayIndex >= 0) {
        newHistory[existingDayIndex].sessionCount += 1;
      } else {
        newHistory.push({
          date: dateStr,
          hasActivity: true,
          sessionCount: 1,
          totalMinutes: 0,
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
        streakHistory: newHistory,
      };

      await setDoc(doc(db, 'streaks', userId), {
        ...updatedStreak,
        lastActivityDate: Timestamp.fromDate(sessionDate),
      });

      return updatedStreak;
    } catch (error) {
      const apiError = handleError(error, 'Update streak', {
        defaultMessage: 'Failed to update streak',
      });
      throw new Error(apiError.userMessage);
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
        isPublic: newVisibility,
      });

      return newVisibility;
    } catch (error) {
      const apiError = handleError(error, 'Toggle streak visibility', {
        defaultMessage: 'Failed to toggle streak visibility',
      });
      throw new Error(apiError.userMessage);
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
        lastActivityDate: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      const apiError = handleError(error, 'Restore streak', {
        defaultMessage: 'Failed to restore streak',
      });
      throw new Error(apiError.userMessage);
    }
  },
};

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: Record<
  AchievementType,
  { name: string; description: string; icon: string; targetValue?: number }
> = {
  'streak-7': {
    name: '7 Day Streak',
    description: 'Complete sessions for 7 days in a row',
    icon: '🔥',
    targetValue: 7,
  },
  'streak-30': {
    name: '30 Day Streak',
    description: 'Complete sessions for 30 days in a row',
    icon: '🔥',
    targetValue: 30,
  },
  'streak-100': {
    name: '100 Day Streak',
    description: 'Complete sessions for 100 days in a row',
    icon: '🔥',
    targetValue: 100,
  },
  'streak-365': {
    name: 'Year Streak',
    description: 'Complete sessions for 365 days in a row',
    icon: '🔥',
    targetValue: 365,
  },
  'hours-10': {
    name: 'First 10 Hours',
    description: 'Log 10 hours of work',
    icon: '⏱️',
    targetValue: 10,
  },
  'hours-50': {
    name: '50 Hours',
    description: 'Log 50 hours of work',
    icon: '⏱️',
    targetValue: 50,
  },
  'hours-100': {
    name: '100 Hours',
    description: 'Log 100 hours of work',
    icon: '⏱️',
    targetValue: 100,
  },
  'hours-500': {
    name: '500 Hours',
    description: 'Log 500 hours of work',
    icon: '⏱️',
    targetValue: 500,
  },
  'hours-1000': {
    name: '1000 Hours',
    description: 'Log 1000 hours of work',
    icon: '⏱️',
    targetValue: 1000,
  },
  'tasks-50': {
    name: '50 Tasks',
    description: 'Complete 50 tasks',
    icon: '✅',
    targetValue: 50,
  },
  'tasks-100': {
    name: '100 Tasks',
    description: 'Complete 100 tasks',
    icon: '✅',
    targetValue: 100,
  },
  'tasks-500': {
    name: '500 Tasks',
    description: 'Complete 500 tasks',
    icon: '✅',
    targetValue: 500,
  },
  'tasks-1000': {
    name: '1000 Tasks',
    description: 'Complete 1000 tasks',
    icon: '✅',
    targetValue: 1000,
  },
  'challenge-complete': {
    name: 'Challenge Complete',
    description: 'Complete a challenge',
    icon: '🏆',
  },
  'challenge-winner': {
    name: 'Challenge Winner',
    description: 'Win a challenge',
    icon: '👑',
  },
  'personal-record-session': {
    name: 'Personal Record',
    description: 'Complete your longest session',
    icon: '🎯',
  },
  'personal-record-day': {
    name: 'Best Day Ever',
    description: 'Complete your most productive day',
    icon: '🌟',
  },
  'early-bird': {
    name: 'Early Bird',
    description: 'Complete a session before 6 AM',
    icon: '🌅',
  },
  'night-owl': {
    name: 'Night Owl',
    description: 'Complete a session after 10 PM',
    icon: '🦉',
  },
  'weekend-warrior': {
    name: 'Weekend Warrior',
    description: 'Complete 10 weekend sessions',
    icon: '💪',
  },
  'consistency-king': {
    name: 'Consistency King',
    description: 'Complete sessions for 30 consecutive days',
    icon: '👑',
  },
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
      return snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
            earnedAt: convertTimestamp(doc.data().earnedAt),
          }) as Achievement
      );
    } catch (error) {
      const apiError = handleError(error, 'Get achievements', {
        defaultMessage: 'Failed to get achievements',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get achievement progress for all achievement types
  getAchievementProgress: async (
    userId: string
  ): Promise<AchievementProgress[]> => {
    try {
      const [achievements, userData] = await Promise.all([
        firebaseAchievementApi.getUserAchievements(userId),
        firebaseAchievementApi.getUserAchievementData(userId),
      ]);

      const unlockedTypes = new Set(achievements.map(a => a.type));
      const progress: AchievementProgress[] = [];

      // Streak achievements
      const streakAchievements: AchievementType[] = [
        'streak-7',
        'streak-30',
        'streak-100',
        'streak-365',
      ];
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
          percentage: Math.min(
            100,
            (userData.currentStreak / (def.targetValue || 1)) * 100
          ),
          isUnlocked,
          unlockedAt: achievement?.earnedAt,
        });
      });

      // Hour achievements
      const hourAchievements: AchievementType[] = [
        'hours-10',
        'hours-50',
        'hours-100',
        'hours-500',
        'hours-1000',
      ];
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
          percentage: Math.min(
            100,
            (userData.totalHours / (def.targetValue || 1)) * 100
          ),
          isUnlocked,
          unlockedAt: achievement?.earnedAt,
        });
      });

      // Task achievements
      const taskAchievements: AchievementType[] = [
        'tasks-50',
        'tasks-100',
        'tasks-500',
        'tasks-1000',
      ];
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
          percentage: Math.min(
            100,
            (userData.totalTasks / (def.targetValue || 1)) * 100
          ),
          isUnlocked,
          unlockedAt: achievement?.earnedAt,
        });
      });

      return progress;
    } catch (error) {
      const apiError = handleError(error, 'Get achievement progress', {
        defaultMessage: 'Failed to get achievement progress',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get user data for achievement checking
  getUserAchievementData: async (
    userId: string
  ): Promise<UserAchievementData> => {
    try {
      const [streakData, userStats] = await Promise.all([
        firebaseStreakApi.getStreakData(userId),
        firebaseUserApi.getUserStats(userId),
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
        challengesWon: 0, // TODO: Get from challenges
      };
    } catch (error) {
      const apiError = handleError(error, 'Get user achievement data', {
        defaultMessage: 'Failed to get user achievement data',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Check and award new achievements after session
  checkAchievements: async (
    userId: string,
    sessionId?: string
  ): Promise<Achievement[]> => {
    try {
      const [existingAchievements, userData] = await Promise.all([
        firebaseAchievementApi.getUserAchievements(userId),
        firebaseAchievementApi.getUserAchievementData(userId),
      ]);

      const unlockedTypes = new Set(existingAchievements.map(a => a.type));
      const newAchievements: Achievement[] = [];

      // Check streak achievements
      if (userData.currentStreak >= 7 && !unlockedTypes.has('streak-7')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'streak-7',
            sessionId
          )
        );
      }
      if (userData.currentStreak >= 30 && !unlockedTypes.has('streak-30')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'streak-30',
            sessionId
          )
        );
      }
      if (userData.currentStreak >= 100 && !unlockedTypes.has('streak-100')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'streak-100',
            sessionId
          )
        );
      }
      if (userData.currentStreak >= 365 && !unlockedTypes.has('streak-365')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'streak-365',
            sessionId
          )
        );
      }

      // Check hour achievements
      if (userData.totalHours >= 10 && !unlockedTypes.has('hours-10')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'hours-10',
            sessionId
          )
        );
      }
      if (userData.totalHours >= 50 && !unlockedTypes.has('hours-50')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'hours-50',
            sessionId
          )
        );
      }
      if (userData.totalHours >= 100 && !unlockedTypes.has('hours-100')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'hours-100',
            sessionId
          )
        );
      }
      if (userData.totalHours >= 500 && !unlockedTypes.has('hours-500')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'hours-500',
            sessionId
          )
        );
      }
      if (userData.totalHours >= 1000 && !unlockedTypes.has('hours-1000')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'hours-1000',
            sessionId
          )
        );
      }

      // Check task achievements
      if (userData.totalTasks >= 50 && !unlockedTypes.has('tasks-50')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'tasks-50',
            sessionId
          )
        );
      }
      if (userData.totalTasks >= 100 && !unlockedTypes.has('tasks-100')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'tasks-100',
            sessionId
          )
        );
      }
      if (userData.totalTasks >= 500 && !unlockedTypes.has('tasks-500')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'tasks-500',
            sessionId
          )
        );
      }
      if (userData.totalTasks >= 1000 && !unlockedTypes.has('tasks-1000')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'tasks-1000',
            sessionId
          )
        );
      }

      // Check time-based achievements if recent session provided
      if (userData.recentSession) {
        const sessionHour = userData.recentSession.startTime.getHours();

        if (sessionHour < 6 && !unlockedTypes.has('early-bird')) {
          newAchievements.push(
            await firebaseAchievementApi.awardAchievement(
              userId,
              'early-bird',
              sessionId
            )
          );
        }

        if (sessionHour >= 22 && !unlockedTypes.has('night-owl')) {
          newAchievements.push(
            await firebaseAchievementApi.awardAchievement(
              userId,
              'night-owl',
              sessionId
            )
          );
        }
      }

      return newAchievements;
    } catch (error) {
      const apiError = handleError(error, 'Check achievements', {
        defaultMessage: 'Failed to check achievements',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Award an achievement
  awardAchievement: async (
    userId: string,
    type: AchievementType,
    sessionId?: string
  ): Promise<Achievement> => {
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
        isShared: false,
      };

      const docRef = await addDoc(
        collection(db, 'achievements'),
        achievementData
      );

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        userId,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: `You earned the "${def.name}" achievement!`,
        linkUrl: `/profile/${userId}?tab=achievements`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      return {
        id: docRef.id,
        ...achievementData,
        earnedAt: new Date(),
      } as Achievement;
    } catch (error) {
      const apiError = handleError(error, 'Award achievement', {
        defaultMessage: 'Failed to award achievement',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Share achievement to feed
  shareAchievement: async (achievementId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const achievementDoc = await getDoc(
        doc(db, 'achievements', achievementId)
      );
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
        updatedAt: serverTimestamp(),
      });

      // Mark achievement as shared
      await updateDoc(doc(db, 'achievements', achievementId), {
        isShared: true,
      });
    } catch (error) {
      const apiError = handleError(error, 'Share achievement', {
        defaultMessage: 'Failed to share achievement',
      });
      throw new Error(apiError.userMessage);
    }
  },
};

// Firebase Notification API
export const firebaseNotificationApi = {
  // Create a notification
  createNotification: async (
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<Notification> => {
    try {
      const notificationData = {
        ...notification,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, 'notifications'),
        notificationData
      );

      return {
        id: docRef.id,
        ...notification,
        createdAt: new Date(),
      };
    } catch (error) {
      const apiError = handleError(error, 'Create notification', {
        defaultMessage: 'Failed to create notification',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get notifications for a user
  getUserNotifications: async (
    userId: string,
    limit: number = 50
  ): Promise<Notification[]> => {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );

      const snapshot = await getDocs(notificationsQuery);
      const notifications: Notification[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          isRead: data.isRead || false,
          createdAt: convertTimestamp(data.createdAt),
        });
      });

      return notifications;
    } catch (error) {
      const apiError = handleError(error, 'Get notifications', {
        defaultMessage: 'Failed to get notifications',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      const apiError = handleError(error, 'Mark notification as read', {
        defaultMessage: 'Failed to mark notification as read',
      });
      throw new Error(apiError.userMessage);
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

      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          isRead: true,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (error) {
      const apiError = handleError(error, 'Mark all notifications as read', {
        defaultMessage: 'Failed to mark all notifications as read',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Delete a notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      const apiError = handleError(error, 'Delete notification', {
        defaultMessage: 'Failed to delete notification',
      });
      throw new Error(apiError.userMessage);
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
    } catch (error) {
      const apiError = handleError(error, 'Get unread count', {
        defaultMessage: 'Failed to get unread count',
      });
      throw new Error(apiError.userMessage);
    }
  },
};

// Challenge Notification Helper Functions
export const challengeNotifications = {
  // Notify when a user completes a challenge
  notifyCompletion: async (
    challengeId: string,
    userId: string,
    challengeName: string,
    challengeType: string
  ): Promise<void> => {
    try {
      const notification: Omit<Notification, 'id' | 'createdAt'> = {
        userId,
        type: 'challenge_completed',
        title: '🏆 Challenge Completed!',
        message: `Congratulations! You've completed the "${challengeName}" challenge.`,
        data: {
          challengeId,
          challengeName,
          challengeType,
        } as ChallengeNotificationData,
        isRead: false,
      };

      await firebaseNotificationApi.createNotification(notification);
    } catch (error) {
      handleError(error, 'send completion notification', {
        severity: ErrorSeverity.ERROR,
      });
    }
  },

  // Notify other participants when someone joins a challenge
  notifyParticipantJoined: async (
    challengeId: string,
    newParticipantId: string,
    newParticipantName: string,
    challengeName: string
  ): Promise<void> => {
    try {
      // Get all other participants
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('challengeId', '==', challengeId)
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const batch = writeBatch(db);

      participantsSnapshot.forEach(participantDoc => {
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
              participantName: newParticipantName,
            } as ChallengeNotificationData,
            isRead: false,
            createdAt: serverTimestamp(),
          });
        }
      });

      await batch.commit();
    } catch (error) {
      handleError(error, 'send participant joined notifications', {
        severity: ErrorSeverity.ERROR,
      });
    }
  },

  // Notify all participants when challenge is ending soon
  notifyEndingSoon: async (
    challengeId: string,
    challengeName: string,
    daysRemaining: number
  ): Promise<void> => {
    try {
      // Get all participants
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('challengeId', '==', challengeId)
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const batch = writeBatch(db);

      participantsSnapshot.forEach(participantDoc => {
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
            daysRemaining,
          } as ChallengeNotificationData,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (error) {
      handleError(error, 'send ending soon notifications', {
        severity: ErrorSeverity.ERROR,
      });
    }
  },

  // Notify when a new challenge is created in a group
  notifyNewChallenge: async (
    challengeId: string,
    challengeName: string,
    challengeType: string,
    groupId: string,
    creatorName: string
  ): Promise<void> => {
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
              groupName: groupData.name,
            } as ChallengeNotificationData,
            isRead: false,
            createdAt: serverTimestamp(),
          });
        }
      });

      await batch.commit();
    } catch (error) {
      handleError(error, 'send new challenge notifications', {
        severity: ErrorSeverity.ERROR,
      });
    }
  },

  // Notify when rank changes significantly (moved up 3+ positions)
  notifyRankChange: async (
    challengeId: string,
    userId: string,
    challengeName: string,
    newRank: number,
    previousRank: number
  ): Promise<void> => {
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
            previousRank,
          } as ChallengeNotificationData,
          isRead: false,
        };

        await firebaseNotificationApi.createNotification(notification);
      }
    } catch (error) {
      handleError(error, 'send rank change notification', {
        severity: ErrorSeverity.ERROR,
      });
    }
  },

  // Notify when reaching milestones (25%, 50%, 75%, 90% of goal)
  notifyMilestone: async (
    challengeId: string,
    userId: string,
    challengeName: string,
    progress: number,
    goalValue: number
  ): Promise<void> => {
    try {
      const percentage = (progress / goalValue) * 100;
      const milestones = [25, 50, 75, 90];

      for (const milestone of milestones) {
        if (percentage >= milestone && percentage < milestone + 5) {
          // 5% buffer to avoid duplicate notifications
          const notification: Omit<Notification, 'id' | 'createdAt'> = {
            userId,
            type: 'challenge_milestone',
            title: `🎯 ${milestone}% Complete!`,
            message: `You're ${milestone}% of the way through the "${challengeName}" challenge. Keep going!`,
            data: {
              challengeId,
              challengeName,
              progress,
              goalValue,
            } as ChallengeNotificationData,
            isRead: false,
          };

          await firebaseNotificationApi.createNotification(notification);
          break; // Only send one milestone notification at a time
        }
      }
    } catch (error) {
      handleError(error, 'send milestone notification', {
        severity: ErrorSeverity.ERROR,
      });
    }
  },
};

// Activity API (alias for Project API for new naming convention)
export const firebaseActivityApi = firebaseProjectApi;

// Export combined API (moved to end to include all APIs)
export const firebaseApi = {
  auth: firebaseAuthApi,
  user: firebaseUserApi,
  project: firebaseProjectApi,
  activity: firebaseActivityApi, // New alias
  task: firebaseTaskApi,
  session: firebaseSessionApi,
  post: firebasePostApi,
  comment: firebaseCommentApi,
  group: firebaseGroupApi,
  streak: firebaseStreakApi,
  achievement: firebaseAchievementApi,
  challenge: firebaseChallengeApi,
  notification: firebaseNotificationApi,
};
