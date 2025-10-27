/**
 * Authentication API Module
 * Handles user authentication operations: login, signup, Google OAuth, and session management
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  limit as limitFn,
  serverTimestamp,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  getRedirectResult,
} from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { handleError, ErrorSeverity } from '@/lib/errorHandler';
import { checkRateLimit, RateLimitError } from '@/lib/rateLimit';
import { convertTimestamp } from '../shared/utils';
import type {
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
  AuthUser,
} from '@/types';

/**
 * Check if a username already exists in Firestore
 */
const checkUsernameExists = async (username: string): Promise<boolean> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('usernameLower', '==', username.toLowerCase()),
      limitFn(1)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    const _apiError = handleError(error, 'Check username availability', {
      severity: ErrorSeverity.WARNING,
    });
    // If there's an error checking, allow the signup to proceed
    // Firebase Auth will handle duplicate emails
    return false;
  }
};

/**
 * Check if an email already exists in Firestore
 * Note: Firebase Auth is the primary check for email uniqueness
 */
const _checkEmailExistsInFirestore = async (
  email: string
): Promise<boolean> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('email', '==', email.toLowerCase()),
      limitFn(1)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    const _apiError = handleError(error, 'Check email availability', {
      severity: ErrorSeverity.WARNING,
    });
    return false;
  }
};

/**
 * Generate a unique username from an email and optional display name
 */
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
  const emailParts = email.split('@');
  const emailPart = emailParts[0];
  if (!emailPart) {
    throw new Error('Invalid email format');
  }
  const baseUsername = emailPart
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

/**
 * Authentication API
 * All authentication-related operations
 */
export const firebaseAuthApi = {
  /**
   * Login with email and password
   */
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

      // If user profile doesn't exist, create it
      if (!userData) {
        const newUserData = {
          email: credentials.email,
          name: 'New User',
          username: credentials.email.split('@')[0],
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
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
        userData = newUserData;
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

  /**
   * Sign up a new user with email and password
   */
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

  /**
   * Sign in with Google OAuth
   */
  signInWithGoogle: async (): Promise<AuthResponse> => {
    try {
      const provider = new GoogleAuthProvider();
      // Add scopes for better user info
      provider.addScope('profile');
      provider.addScope('email');

      // Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      let userCredential;

      try {
        // Use popup for better UX and to avoid cross-origin issues
        userCredential = await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        console.error('[signInWithGoogle] Popup error:', popupError);
        console.error('[signInWithGoogle] Error code:', popupError.code);
        console.error('[signInWithGoogle] Error message:', popupError.message);

        // Handle specific error codes
        if (popupError.code === 'auth/popup-blocked') {
          throw new Error(
            'Popup was blocked by your browser. Please allow popups for this site.'
          );
        } else if (popupError.code === 'auth/popup-closed-by-user') {
          throw new Error('Sign-in was cancelled.');
        } else if (popupError.code === 'auth/cancelled-popup-request') {
          throw new Error('Sign-in was cancelled.');
        } else if (popupError.code === 'auth/unauthorized-domain') {
          throw new Error(
            'This domain is not authorized for Google Sign-in. Please contact support.'
          );
        } else if (popupError.code === 'auth/network-request-failed') {
          throw new Error(
            'Network error. Please check your internet connection and try again.'
          );
        }
        // Re-throw if it's a different error
        throw popupError;
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
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);

      // Special case: if redirect is in progress, pass through without modification
      if (error.message === 'REDIRECT_IN_PROGRESS') {
        throw error;
      }

      // If the error is already a custom Error with a message, re-throw it as-is
      if (error instanceof Error && !(error as any).code) {
        throw error;
      }

      // Provide more specific error messages for Firebase errors
      if (error.message && error.message.includes('Firebase Console')) {
        throw error;
      }

      const apiError = handleError(error, 'Google sign-in', {
        defaultMessage:
          'Google sign-in failed. Please check that Google authentication is enabled in Firebase Console.',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Logout current user
   */
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

  /**
   * Get current authenticated user
   */
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

  /**
   * Verify authentication token
   */
  verifyToken: async (_token: string): Promise<boolean> => {
    try {
      // Firebase handles token verification automatically
      // We just need to check if user is authenticated
      return !!auth.currentUser;
    } catch (_error) {
      return false;
    }
  },

  /**
   * Handle Google redirect result (for mobile OAuth flow)
   */
  handleGoogleRedirectResult: async (): Promise<AuthResponse | null> => {
    try {
      const result = await getRedirectResult(auth);

      if (result) {
        const _credential = GoogleAuthProvider.credentialFromResult(result);
      }

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
    } catch (error: unknown) {
      console.error('[handleGoogleRedirectResult] ERROR:', error);
      console.error('[handleGoogleRedirectResult] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      const apiError = handleError(error, 'Google sign-in redirect', {
        defaultMessage: 'Google sign-in failed. Please try again.',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Listen to authentication state changes
   */
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Check if username is available for signup
   */
  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    const exists = await checkUsernameExists(username);
    return !exists; // Return true if available (username does not exist)
  },
};
