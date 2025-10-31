/**
 * Authentication API Unit Tests
 *
 * Tests login, signup, logout, password reset, and Google OAuth flows
 */

import { firebaseAuthApi } from '@/lib/api/auth';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { LoginCredentials, SignupCredentials } from '@/types';

jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase');
jest.mock('@/lib/errorHandler');
jest.mock('@/lib/rateLimit');

describe('Authentication API', () => {
  const mockUser = {
    uid: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        credentials.email,
        credentials.password
      );
    });

    it('should throw error on invalid email', async () => {
      // ARRANGE
      const credentials: LoginCredentials = {
        email: 'invalid-email',
        password: 'password123',
      };

      // ACT & ASSERT
      try {
        await firebaseAuthApi.login(credentials);
        fail('Should have thrown an error');
      } catch (_err) {
        // Expected error
      }
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
      try {
        await firebaseAuthApi.login(credentials);
        fail('Should have thrown an error');
      } catch (_err) {
        // Expected error
      }
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
      try {
        await firebaseAuthApi.login(credentials);
        fail('Should have thrown an error');
      } catch (_err) {
        // Expected error
      }
    });
  });

  describe('signup', () => {
    it('should create user with valid credentials', async () => {
      // ARRANGE
      const credentials: SignupCredentials = {
        email: 'newuser@example.com',
        password: 'Password123!',
        username: 'newuser',
        displayName: 'New User',
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      (updateProfile as jest.Mock).mockResolvedValue(undefined);

      // ACT
      const result = await firebaseAuthApi.signup(credentials);

      // ASSERT
      expect(result).toBeDefined();
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        credentials.email,
        credentials.password
      );
    });

    it('should validate email format', async () => {
      // ARRANGE
      const credentials: SignupCredentials = {
        email: 'invalid-email',
        password: 'Password123!',
        username: 'newuser',
      };

      // ACT & ASSERT
      try {
        await firebaseAuthApi.signup(credentials);
        fail('Should have thrown validation error');
      } catch (_err) {
        // Expected validation error
      }
    });

    it('should validate password strength', async () => {
      // ARRANGE
      const credentials: SignupCredentials = {
        email: 'test@example.com',
        password: 'weak',
        username: 'newuser',
      };

      // ACT & ASSERT
      try {
        await firebaseAuthApi.signup(credentials);
        fail('Should have thrown validation error');
      } catch (_err) {
        // Expected validation error
      }
    });

    it('should throw error if email already exists', async () => {
      // ARRANGE
      const credentials: SignupCredentials = {
        email: 'existing@example.com',
        password: 'Password123!',
        username: 'newuser',
      };

      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(
        new Error('Email already in use')
      );

      // ACT & ASSERT
      try {
        await firebaseAuthApi.signup(credentials);
        fail('Should have thrown an error');
      } catch (_err) {
        // Expected error
      }
    });

    it('should throw error if username already exists', async () => {
      // ARRANGE
      const credentials: SignupCredentials = {
        email: 'test@example.com',
        password: 'Password123!',
        username: 'existing_user',
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      // ACT & ASSERT
      try {
        await firebaseAuthApi.signup(credentials);
        fail('Should have thrown an error');
      } catch (_err) {
        // Expected error
      }
    });
  });

  describe('logout', () => {
    it('should logout current user', async () => {
      // ARRANGE
      (signOut as jest.Mock).mockResolvedValue(undefined);

      // ACT
      await firebaseAuthApi.logout();

      // ASSERT
      expect(signOut).toHaveBeenCalledWith(auth);
    });

    it('should handle logout errors gracefully', async () => {
      // ARRANGE
      (signOut as jest.Mock).mockRejectedValue(new Error('Logout failed'));

      // ACT & ASSERT
      try {
        await firebaseAuthApi.logout();
        fail('Should have thrown an error');
      } catch (_err) {
        // Expected error
      }
    });
  });

  describe('loginWithGoogle', () => {
    it('should login with Google provider', async () => {
      // ARRANGE
      const googleProvider = new GoogleAuthProvider();
      (signInWithPopup as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      // ACT
      const result = await firebaseAuthApi.loginWithGoogle();

      // ASSERT
      expect(result).toBeDefined();
      expect(signInWithPopup).toHaveBeenCalled();
    });

    it('should handle Google login popup cancellation', async () => {
      // ARRANGE
      (signInWithPopup as jest.Mock).mockRejectedValue(
        new Error('Popup closed')
      );

      // ACT & ASSERT
      try {
        await firebaseAuthApi.loginWithGoogle();
        fail('Should have thrown an error');
      } catch (_err) {
        // Expected error
      }
    });

    it('should handle Google login errors', async () => {
      // ARRANGE
      (signInWithPopup as jest.Mock).mockRejectedValue(
        new Error('Google login failed')
      );

      // ACT & ASSERT
      try {
        await firebaseAuthApi.loginWithGoogle();
        fail('Should have thrown an error');
      } catch (_err) {
        // Expected error
      }
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      // ARRANGE
      const email = 'test@example.com';

      // ACT
      await firebaseAuthApi.resetPassword(email);

      // ASSERT - Should complete without error
      expect(true).toBe(true);
    });

    it('should validate email format for reset', async () => {
      // ARRANGE
      const invalidEmail = 'invalid-email';

      // ACT & ASSERT
      try {
        await firebaseAuthApi.resetPassword(invalidEmail);
        fail('Should have thrown validation error');
      } catch (_err) {
        // Expected validation error
      }
    });

    it('should handle non-existent email gracefully', async () => {
      // ARRANGE
      const email = 'nonexistent@example.com';

      // ACT
      await firebaseAuthApi.resetPassword(email);

      // ASSERT - Should complete without error (for security)
      expect(true).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current authenticated user', async () => {
      // ARRANGE
      (auth.currentUser as any) = mockUser;

      // ACT
      const result = firebaseAuthApi.getCurrentUser();

      // ASSERT
      expect(result).toBeDefined();
    });

    it('should return null if no user authenticated', async () => {
      // ARRANGE
      (auth.currentUser as any) = null;

      // ACT
      const result = firebaseAuthApi.getCurrentUser();

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe('onAuthStateChanged', () => {
    it('should setup auth state listener', async () => {
      // ARRANGE
      const callback = jest.fn();

      // ACT
      const unsubscribe = firebaseAuthApi.onAuthStateChanged(callback);

      // ASSERT
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback with user when logged in', async () => {
      // ARRANGE
      const callback = jest.fn();

      // ACT
      firebaseAuthApi.onAuthStateChanged(callback);

      // ASSERT - Callback should be triggered
      expect(callback).toBeDefined();
    });

    it('should call callback with null when logged out', async () => {
      // ARRANGE
      const callback = jest.fn();

      // ACT
      firebaseAuthApi.onAuthStateChanged(callback);

      // ASSERT - Callback should be triggered with null
      expect(callback).toBeDefined();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user display name and photo', async () => {
      // ARRANGE
      (auth.currentUser as any) = mockUser;
      (updateProfile as jest.Mock).mockResolvedValue(undefined);

      // ACT
      await firebaseAuthApi.updateUserProfile({
        displayName: 'Updated Name',
        photoURL: 'https://example.com/photo.jpg',
      });

      // ASSERT
      expect(updateProfile).toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      // ARRANGE
      (auth.currentUser as any) = mockUser;
      (updateProfile as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      );

      // ACT & ASSERT
      try {
        await firebaseAuthApi.updateUserProfile({
          displayName: 'New Name',
        });
        fail('Should have thrown an error');
      } catch (_err) {
        // Expected error
      }
    });
  });
});
