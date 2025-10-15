/**
 * Comprehensive tests for Google Sign-In functionality
 * Tests both mobile redirect flow and desktop popup flow
 */

import { firebaseAuthApi } from '@/lib/firebaseApi';
import { auth } from '@/lib/firebase';
import {
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
} from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: jest.fn(() => ({
    addScope: jest.fn(),
  })),
  signInWithRedirect: jest.fn(),
  signInWithPopup: jest.fn(),
  getRedirectResult: jest.fn(),
  getAuth: jest.fn(() => ({
    config: {
      authDomain: 'strava-but-productive.firebaseapp.com',
    },
  })),
  onAuthStateChanged: jest.fn(),
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    fromDate: jest.fn((date) => date),
  },
}));

describe('Google Sign-In - Mobile Detection', () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
    });
    jest.clearAllMocks();
  });

  test('should detect iPhone as mobile', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      writable: true,
    });

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    expect(isMobile).toBe(true);
  });

  test('should detect Android as mobile', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
      writable: true,
    });

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    expect(isMobile).toBe(true);
  });

  test('should detect Safari as needing redirect', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
      writable: true,
    });

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    expect(isSafari).toBe(true);
  });

  test('should NOT detect Chrome as Safari', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      writable: true,
    });

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    expect(isSafari).toBe(false);
  });

  test('should detect desktop Chrome as non-mobile', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      writable: true,
    });

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    expect(isMobile).toBe(false);
  });
});

describe('Google Sign-In - Redirect Flow (Mobile)', () => {
  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    // Set mobile user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
    });
    jest.clearAllMocks();
  });

  test('should use redirect flow for mobile devices', async () => {
    const mockSignInWithRedirect = signInWithRedirect as jest.Mock;
    mockSignInWithRedirect.mockResolvedValue(undefined);

    try {
      await firebaseAuthApi.signInWithGoogle();
    } catch (error: any) {
      // Should throw REDIRECT_IN_PROGRESS
      expect(error.message).toBe('REDIRECT_IN_PROGRESS');
    }

    expect(mockSignInWithRedirect).toHaveBeenCalled();
    expect(signInWithPopup).not.toHaveBeenCalled();
  });

  test('should handle redirect errors gracefully', async () => {
    const mockSignInWithRedirect = signInWithRedirect as jest.Mock;
    mockSignInWithRedirect.mockRejectedValue({
      code: 'auth/unauthorized-domain',
      message: 'Unauthorized domain',
    });

    await expect(firebaseAuthApi.signInWithGoogle()).rejects.toThrow();
  });

  test('should log mobile detection information', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const mockSignInWithRedirect = signInWithRedirect as jest.Mock;
    mockSignInWithRedirect.mockResolvedValue(undefined);

    try {
      await firebaseAuthApi.signInWithGoogle();
    } catch (error: any) {
      // Expected REDIRECT_IN_PROGRESS
    }

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[signInWithGoogle]'),
      expect.anything()
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      '[signInWithGoogle] Is mobile or Safari?',
      true
    );
  });
});

describe('Google Sign-In - Popup Flow (Desktop)', () => {
  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    // Set desktop Chrome user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
    });
    jest.clearAllMocks();
  });

  test('should use popup flow for desktop Chrome', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
      getIdToken: jest.fn().mockResolvedValue('test-token'),
    };

    const mockSignInWithPopup = signInWithPopup as jest.Mock;
    mockSignInWithPopup.mockResolvedValue({
      user: mockUser,
    });

    // Mock Firestore getDoc
    const { getDoc } = require('firebase/firestore');
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        bio: '',
        location: '',
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });

    const result = await firebaseAuthApi.signInWithGoogle();

    expect(mockSignInWithPopup).toHaveBeenCalled();
    expect(signInWithRedirect).not.toHaveBeenCalled();
    expect(result.user.email).toBe('test@example.com');
  });

  test('should fall back to redirect if popup is blocked', async () => {
    const mockSignInWithPopup = signInWithPopup as jest.Mock;
    mockSignInWithPopup.mockRejectedValue({
      code: 'auth/popup-blocked',
      message: 'Popup blocked',
    });

    const mockSignInWithRedirect = signInWithRedirect as jest.Mock;
    mockSignInWithRedirect.mockResolvedValue(undefined);

    try {
      await firebaseAuthApi.signInWithGoogle();
    } catch (error: any) {
      expect(error.message).toBe('REDIRECT_IN_PROGRESS');
    }

    expect(mockSignInWithPopup).toHaveBeenCalled();
    expect(mockSignInWithRedirect).toHaveBeenCalled();
  });

  test('should throw error if popup is cancelled by user', async () => {
    const mockSignInWithPopup = signInWithPopup as jest.Mock;
    mockSignInWithPopup.mockRejectedValue({
      code: 'auth/popup-closed-by-user',
      message: 'Popup closed',
    });

    await expect(firebaseAuthApi.signInWithGoogle()).rejects.toThrow(
      'Sign-in was cancelled.'
    );
  });
});

describe('Google Sign-In - Redirect Result Handling', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should handle successful redirect result', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
      getIdToken: jest.fn().mockResolvedValue('test-token'),
    };

    const mockGetRedirectResult = getRedirectResult as jest.Mock;
    mockGetRedirectResult.mockResolvedValue({
      user: mockUser,
    });

    // Mock Firestore getDoc
    const { getDoc } = require('firebase/firestore');
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        bio: '',
        location: '',
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });

    const result = await firebaseAuthApi.handleGoogleRedirectResult();

    expect(result).not.toBeNull();
    expect(result?.user.email).toBe('test@example.com');
    expect(result?.user.username).toBe('testuser');
  });

  test('should return null when no redirect result', async () => {
    const mockGetRedirectResult = getRedirectResult as jest.Mock;
    mockGetRedirectResult.mockResolvedValue(null);

    const result = await firebaseAuthApi.handleGoogleRedirectResult();

    expect(result).toBeNull();
  });

  test('should create new user profile if not exists', async () => {
    const mockUser = {
      uid: 'new-user-uid',
      email: 'newuser@example.com',
      displayName: 'New User',
      photoURL: 'https://example.com/photo.jpg',
      getIdToken: jest.fn().mockResolvedValue('test-token'),
    };

    const mockGetRedirectResult = getRedirectResult as jest.Mock;
    mockGetRedirectResult.mockResolvedValue({
      user: mockUser,
    });

    // Mock Firestore - user doesn't exist
    const { getDoc, setDoc, query, getDocs } = require('firebase/firestore');
    getDoc.mockResolvedValue({
      exists: () => false,
      data: () => null,
    });

    // Mock username check query - no existing users
    getDocs.mockResolvedValue({
      empty: true,
      docs: [],
    });

    const result = await firebaseAuthApi.handleGoogleRedirectResult();

    expect(setDoc).toHaveBeenCalled();
    expect(result).not.toBeNull();
    expect(result?.user.email).toBe('newuser@example.com');
  });

  test('should handle redirect result errors', async () => {
    const mockGetRedirectResult = getRedirectResult as jest.Mock;
    mockGetRedirectResult.mockRejectedValue({
      code: 'auth/unauthorized-domain',
      message: 'Unauthorized domain',
    });

    await expect(
      firebaseAuthApi.handleGoogleRedirectResult()
    ).rejects.toThrow();
  });

  test('should log detailed information for debugging', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const mockGetRedirectResult = getRedirectResult as jest.Mock;
    mockGetRedirectResult.mockResolvedValue(null);

    await firebaseAuthApi.handleGoogleRedirectResult();

    expect(consoleSpy).toHaveBeenCalledWith(
      '[handleGoogleRedirectResult] Starting...'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      '[handleGoogleRedirectResult] Current URL:',
      expect.any(String)
    );
  });
});

describe('Google Sign-In - Error Scenarios', () => {
  test('should handle configuration-not-found error', async () => {
    const mockSignInWithPopup = signInWithPopup as jest.Mock;
    mockSignInWithPopup.mockRejectedValue({
      code: 'auth/configuration-not-found',
      message: 'Configuration not found',
    });

    await expect(firebaseAuthApi.signInWithGoogle()).rejects.toThrow(
      'Google Sign-in is not configured'
    );
  });

  test('should handle unauthorized-domain error', async () => {
    const mockSignInWithPopup = signInWithPopup as jest.Mock;
    mockSignInWithPopup.mockRejectedValue({
      code: 'auth/unauthorized-domain',
      message: 'Unauthorized domain',
    });

    await expect(firebaseAuthApi.signInWithGoogle()).rejects.toThrow(
      'This domain is not authorized for Google Sign-in'
    );
  });

  test('should log all errors with detailed information', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error');
    const mockSignInWithRedirect = signInWithRedirect as jest.Mock;

    // Set mobile user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      writable: true,
    });

    mockSignInWithRedirect.mockRejectedValue({
      code: 'auth/test-error',
      message: 'Test error message',
    });

    try {
      await firebaseAuthApi.signInWithGoogle();
    } catch (error) {
      // Expected
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[signInWithGoogle] Redirect error:',
      expect.any(Object)
    );
  });
});
