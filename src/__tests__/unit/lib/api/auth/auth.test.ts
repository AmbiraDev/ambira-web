/**
 * Authentication API Unit Tests
 *
 * Tests login, signup, logout, password reset, and Google OAuth flows
 */

// Setup environment variables before importing firebase
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';

// Mock Firebase modules BEFORE any imports that depend on them
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
  setPersistence: jest.fn(() => Promise.resolve()),
  browserLocalPersistence: {},
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({
    addScope: jest.fn(),
    setCustomParameters: jest.fn(),
  })),
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Only call callback if it's a function (not during import)
    if (typeof callback === 'function') {
      callback(null);
    }
    return jest.fn();
  }),
  getRedirectResult: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
}));

jest.mock('@/lib/errorHandler', () => ({
  handleError: jest.fn(error => ({
    userMessage: error instanceof Error ? error.message : 'An error occurred',
    technicalMessage:
      error instanceof Error ? error.message : 'An error occurred',
    severity: 'ERROR',
  })),
  ErrorSeverity: {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    CRITICAL: 'CRITICAL',
  },
}));

jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn(),
  RateLimitError: class RateLimitError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'RateLimitError';
    }
  },
}));

jest.mock('@/lib/api/shared/utils', () => ({
  convertTimestamp: jest.fn(val => {
    if (val instanceof Date) return val;
    if (val?.toDate) return val.toDate();
    return new Date();
  }),
  removeUndefinedFields: jest.fn(obj => obj),
}));

jest.mock('@/lib/debug', () => ({
  debug: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock @/lib/firebase with an inline auth object
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
  storage: {},
  isFirebaseInitialized: true,
}));

// Now we can safely import modules that depend on Firebase
import { firebaseAuthApi } from '@/lib/api/auth';
import { auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { getDoc, setDoc, getDocs } from 'firebase/firestore';
import type { LoginCredentials, SignupCredentials } from '@/types';

describe('Authentication API', () => {
  const mockUser = {
    uid: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    getIdToken: jest.fn(() => Promise.resolve('mock-token')),
  };

  const mockUserData = {
    name: 'Test User',
    username: 'testuser',
    bio: '',
    location: '',
    profilePicture: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as any).currentUser = null;

    // Setup default mocks
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockUserData,
    });

    (getDocs as jest.Mock).mockResolvedValue({
      empty: true,
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      // ARRANGE
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      // ACT
      const result = await firebaseAuthApi.login(credentials);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBe('mock-token');
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
    });

    it('should throw error on wrong password', async () => {
      // ARRANGE
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(
        new Error('Wrong password')
      );

      // ACT & ASSERT
      await expect(firebaseAuthApi.login(credentials)).rejects.toThrow();
    });

    it('should throw error for non-existent user', async () => {
      // ARRANGE
      const credentials: LoginCredentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );

      // ACT & ASSERT
      await expect(firebaseAuthApi.login(credentials)).rejects.toThrow();
    });
  });

  describe('signup', () => {
    it('should create user with valid credentials', async () => {
      // ARRANGE
      const credentials: SignupCredentials = {
        email: 'newuser@example.com',
        password: 'Password123!',
        username: 'newuser',
        name: 'New User',
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      // ACT
      const result = await firebaseAuthApi.signup(credentials);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBe('mock-token');
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      // ARRANGE
      const credentials: SignupCredentials = {
        email: 'existing@example.com',
        password: 'Password123!',
        username: 'newuser',
        name: 'New User',
      };

      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(
        new Error('Email already in use')
      );

      // ACT & ASSERT
      await expect(firebaseAuthApi.signup(credentials)).rejects.toThrow();
    });

    it('should throw error if username already exists', async () => {
      // ARRANGE
      const credentials: SignupCredentials = {
        email: 'test@example.com',
        password: 'Password123!',
        username: 'existing_user',
        name: 'New User',
      };

      // Mock username check to return that username exists
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
      });

      // ACT & ASSERT
      await expect(firebaseAuthApi.signup(credentials)).rejects.toThrow(
        'username is already taken'
      );
    });
  });

  describe('logout', () => {
    it('should logout current user', async () => {
      // ARRANGE
      (signOut as jest.Mock).mockResolvedValue(undefined);

      // ACT
      await firebaseAuthApi.logout();

      // ASSERT
      expect(signOut).toHaveBeenCalled();
    });

    it('should handle logout errors gracefully', async () => {
      // ARRANGE
      (signOut as jest.Mock).mockRejectedValue(new Error('Logout failed'));

      // ACT & ASSERT
      await expect(firebaseAuthApi.logout()).rejects.toThrow();
    });
  });

  describe('signInWithGoogle', () => {
    it('should login with Google provider', async () => {
      // ARRANGE
      (signInWithPopup as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      // ACT
      const result = await firebaseAuthApi.signInWithGoogle();

      // ASSERT
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBe('mock-token');
      expect(signInWithPopup).toHaveBeenCalled();
    });

    it('should handle Google login popup cancellation', async () => {
      // ARRANGE
      const popupError = Object.assign(new Error('Popup closed'), {
        code: 'auth/popup-closed-by-user',
      });
      (signInWithPopup as jest.Mock).mockRejectedValue(popupError);

      // ACT & ASSERT
      await expect(firebaseAuthApi.signInWithGoogle()).rejects.toThrow(
        'Sign-in was cancelled'
      );
    });

    it('should handle Google login errors', async () => {
      // ARRANGE
      (signInWithPopup as jest.Mock).mockRejectedValue(
        new Error('Google login failed')
      );

      // ACT & ASSERT
      await expect(firebaseAuthApi.signInWithGoogle()).rejects.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current authenticated user', async () => {
      // ARRANGE
      (auth as any).currentUser = mockUser;

      // ACT
      const result = await firebaseAuthApi.getCurrentUser();

      // ASSERT
      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.uid);
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw error if no user authenticated', async () => {
      // ARRANGE
      (auth as any).currentUser = null;

      // ACT & ASSERT
      await expect(firebaseAuthApi.getCurrentUser()).rejects.toThrow(
        'No authenticated user'
      );
    });
  });

  describe('onAuthStateChanged', () => {
    it('should setup auth state listener', () => {
      // ARRANGE
      const callback = jest.fn();

      // ACT
      const unsubscribe = firebaseAuthApi.onAuthStateChanged(callback);

      // ASSERT
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
