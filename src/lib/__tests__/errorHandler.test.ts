/**
 * Tests for error handler utility
 */

import {
  handleError,
  createApiError,
  isPermissionError,
  isNotFoundError,
  isAuthError,
  isNetworkError,
  withNullOnError,
} from '../errorHandler';

describe('errorHandler', () => {
  describe('createApiError', () => {
    it('creates error from Firebase auth error', () => {
      const firebaseError = {
        code: 'auth/invalid-email',
        message: 'The email address is badly formatted.',
      };

      const apiError = createApiError(firebaseError, 'Login');

      expect(apiError.code).toBe('auth/invalid-email');
      expect(apiError.message).toContain('Login');
      expect(apiError.userMessage).toBe('Please enter a valid email address.');
    });

    it('creates error from Firestore error', () => {
      const firestoreError = {
        code: 'permission-denied',
        message: 'Missing or insufficient permissions.',
      };

      const apiError = createApiError(firestoreError, 'Fetch user');

      expect(apiError.code).toBe('permission-denied');
      expect(apiError.userMessage).toBe(
        "You don't have permission to perform this action."
      );
    });

    it('creates error from generic Error', () => {
      const error = new Error('Something went wrong');

      const apiError = createApiError(error, 'Operation');

      expect(apiError.code).toBe('unknown');
      expect(apiError.message).toContain('Operation');
      expect(apiError.userMessage).toBe('An error occurred. Please try again.');
    });

    it('uses default message when error code is unknown', () => {
      const error = { code: 'unknown-error', message: 'Unknown' };
      const defaultMessage = 'Custom default message';

      const apiError = createApiError(error, 'Operation', defaultMessage);

      expect(apiError.userMessage).toBe(defaultMessage);
    });
  });

  describe('handleError', () => {
    it('handles error and returns ApiError', () => {
      const error = {
        code: 'auth/user-not-found',
        message: 'User not found',
      };

      const apiError = handleError(error, 'Login', {
        silent: true, // Don't log during tests
      });

      expect(apiError.code).toBe('auth/user-not-found');
      expect(apiError.userMessage).toContain('No account found');
    });

    it('respects custom default message', () => {
      const error = new Error('Unknown error');

      const apiError = handleError(error, 'Custom operation', {
        defaultMessage: 'Custom error message',
        silent: true,
      });

      expect(apiError.userMessage).toBe('Custom error message');
    });
  });

  describe('isPermissionError', () => {
    it('detects permission-denied error', () => {
      const error = { code: 'permission-denied' };
      expect(isPermissionError(error)).toBe(true);
    });

    it('detects auth/unauthorized error', () => {
      const error = { code: 'auth/unauthorized' };
      expect(isPermissionError(error)).toBe(true);
    });

    it('returns false for other errors', () => {
      const error = { code: 'not-found' };
      expect(isPermissionError(error)).toBe(false);
    });
  });

  describe('isNotFoundError', () => {
    it('detects not-found error', () => {
      const error = { code: 'not-found' };
      expect(isNotFoundError(error)).toBe(true);
    });

    it('detects storage/object-not-found error', () => {
      const error = { code: 'storage/object-not-found' };
      expect(isNotFoundError(error)).toBe(true);
    });

    it('returns false for other errors', () => {
      const error = { code: 'permission-denied' };
      expect(isNotFoundError(error)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('detects unauthenticated error', () => {
      const error = { code: 'unauthenticated' };
      expect(isAuthError(error)).toBe(true);
    });

    it('detects auth/ prefixed errors', () => {
      const error = { code: 'auth/invalid-credential' };
      expect(isAuthError(error)).toBe(true);
    });

    it('returns false for other errors', () => {
      const error = { code: 'not-found' };
      expect(isAuthError(error)).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('detects unavailable error', () => {
      const error = { code: 'unavailable' };
      expect(isNetworkError(error)).toBe(true);
    });

    it('detects network-related message', () => {
      const error = new Error('Network connection failed');
      expect(isNetworkError(error)).toBe(true);
    });

    it('returns false for other errors', () => {
      const error = { code: 'not-found' };
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe('withNullOnError', () => {
    it('returns result on success', async () => {
      const operation = async () => 'success';

      const result = await withNullOnError(operation, 'Test', {
        silent: true,
      });

      expect(result).toBe('success');
    });

    it('returns null on permission error when configured', async () => {
      const operation = async () => {
        throw { code: 'permission-denied' };
      };

      const result = await withNullOnError(operation, 'Test', {
        nullOnPermissionDenied: true,
        silent: true,
      });

      expect(result).toBeNull();
    });

    it('returns null on not-found error when configured', async () => {
      const operation = async () => {
        throw { code: 'not-found' };
      };

      const result = await withNullOnError(operation, 'Test', {
        nullOnNotFound: true,
        silent: true,
      });

      expect(result).toBeNull();
    });

    it('throws on other errors', async () => {
      const operation = async () => {
        throw new Error('Test error');
      };

      await expect(
        withNullOnError(operation, 'Test', {
          silent: true,
        })
      ).rejects.toThrow();
    });

    it('does not return null when not configured', async () => {
      const operation = async () => {
        throw { code: 'permission-denied' };
      };

      await expect(
        withNullOnError(operation, 'Test', {
          silent: true,
        })
      ).rejects.toThrow();
    });
  });
});
