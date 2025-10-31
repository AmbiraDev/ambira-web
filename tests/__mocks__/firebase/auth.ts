/**
 * Mock implementation of Firebase Authentication for testing
 */

import type { User, UserCredential, Auth } from 'firebase/auth';

// Mock user state
let mockCurrentUser: User | null = null;
const authStateListeners: Array<(user: User | null) => void> = [];

// Mock user factory
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    uid: overrides.uid || `mock-uid-${Date.now()}`,
    email: overrides.email || 'test@example.com',
    emailVerified: overrides.emailVerified || false,
    displayName: overrides.displayName || 'Test User',
    photoURL: overrides.photoURL || null,
    phoneNumber: overrides.phoneNumber || null,
    isAnonymous: overrides.isAnonymous || false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [],
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: jest.fn().mockResolvedValue(undefined),
    getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
    getIdTokenResult: jest.fn().mockResolvedValue({
      token: 'mock-id-token',
      claims: {},
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      issuedAtTime: new Date().toISOString(),
      signInProvider: 'password',
      authTime: new Date().toISOString(),
    }),
    reload: jest.fn().mockResolvedValue(undefined),
    toJSON: jest.fn(() => ({ uid: overrides.uid || 'mock-uid' })),
    providerId: 'firebase',
    ...overrides,
  } as User;
}

// Mock user credential factory
function createMockUserCredential(user: User): UserCredential {
  return {
    user,
    providerId: 'password',
    operationType: 'signIn',
  };
}

// Notify all auth state listeners
function notifyAuthStateListeners(user: User | null) {
  mockCurrentUser = user;
  authStateListeners.forEach(listener => listener(user));
}

// Mock Auth functions
export const mockAuth = {
  currentUser: mockCurrentUser,

  signInWithEmailAndPassword: jest
    .fn()
    .mockImplementation(async (auth: Auth, email: string, password: string) => {
      if (password === 'wrong-password') {
        throw new Error('auth/wrong-password');
      }
      if (email === 'notfound@example.com') {
        throw new Error('auth/user-not-found');
      }

      const user = createMockUser({ email });
      notifyAuthStateListeners(user);
      return createMockUserCredential(user);
    }),

  createUserWithEmailAndPassword: jest
    .fn()
    .mockImplementation(async (auth: Auth, email: string, password: string) => {
      if (email === 'existing@example.com') {
        throw new Error('auth/email-already-in-use');
      }
      if (password.length < 6) {
        throw new Error('auth/weak-password');
      }

      const user = createMockUser({ email });
      notifyAuthStateListeners(user);
      return createMockUserCredential(user);
    }),

  signInWithPopup: jest
    .fn()
    .mockImplementation(async (_auth: Auth, _provider: unknown) => {
      const user = createMockUser({
        email: 'google@example.com',
        displayName: 'Google User',
      });
      notifyAuthStateListeners(user);
      return createMockUserCredential(user);
    }),

  signInWithRedirect: jest.fn().mockResolvedValue(undefined),

  getRedirectResult: jest.fn().mockResolvedValue(null),

  signOut: jest.fn().mockImplementation(async () => {
    notifyAuthStateListeners(null);
  }),

  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),

  sendEmailVerification: jest.fn().mockResolvedValue(undefined),

  updateProfile: jest
    .fn()
    .mockImplementation(async (user: User, profile: Partial<User>) => {
      if (mockCurrentUser) {
        Object.assign(mockCurrentUser, profile);
        notifyAuthStateListeners(mockCurrentUser);
      }
    }),

  updateEmail: jest
    .fn()
    .mockImplementation(async (user: User, newEmail: string) => {
      if (mockCurrentUser) {
        // Create a new user object with updated email since email is read-only
        const updatedUser = createMockUser({
          ...mockCurrentUser,
          email: newEmail,
        });
        notifyAuthStateListeners(updatedUser);
      }
    }),

  updatePassword: jest.fn().mockResolvedValue(undefined),

  deleteUser: jest.fn().mockImplementation(async () => {
    notifyAuthStateListeners(null);
  }),

  onAuthStateChanged: jest
    .fn()
    .mockImplementation((auth: Auth, callback: (user: User | null) => void) => {
      authStateListeners.push(callback);
      // Immediately call with current user
      callback(mockCurrentUser);

      // Return unsubscribe function
      return () => {
        const index = authStateListeners.indexOf(callback);
        if (index > -1) {
          authStateListeners.splice(index, 1);
        }
      };
    }),

  // Google Auth Provider
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({
    providerId: 'google.com',
    addScope: jest.fn(),
    setCustomParameters: jest.fn(),
  })),

  // Utility functions for testing
  _setCurrentUser: (user: User | null) => {
    notifyAuthStateListeners(user);
  },

  _getCurrentUser: () => mockCurrentUser,

  _clearAuthState: () => {
    mockCurrentUser = null;
    authStateListeners.length = 0;
  },

  _reset: () => {
    mockCurrentUser = null;
    authStateListeners.length = 0;
    mockAuth.signInWithEmailAndPassword.mockClear();
    mockAuth.createUserWithEmailAndPassword.mockClear();
    mockAuth.signInWithPopup.mockClear();
    mockAuth.signOut.mockClear();
    mockAuth.sendPasswordResetEmail.mockClear();
    mockAuth.onAuthStateChanged.mockClear();
  },
};

// Export individual functions for jest.mock
export const signInWithEmailAndPassword = mockAuth.signInWithEmailAndPassword;
export const createUserWithEmailAndPassword =
  mockAuth.createUserWithEmailAndPassword;
export const signInWithPopup = mockAuth.signInWithPopup;
export const signInWithRedirect = mockAuth.signInWithRedirect;
export const getRedirectResult = mockAuth.getRedirectResult;
export const signOut = mockAuth.signOut;
export const sendPasswordResetEmail = mockAuth.sendPasswordResetEmail;
export const sendEmailVerification = mockAuth.sendEmailVerification;
export const updateProfile = mockAuth.updateProfile;
export const updateEmail = mockAuth.updateEmail;
export const updatePassword = mockAuth.updatePassword;
export const deleteUser = mockAuth.deleteUser;
export const onAuthStateChanged = mockAuth.onAuthStateChanged;
export const GoogleAuthProvider = mockAuth.GoogleAuthProvider;
