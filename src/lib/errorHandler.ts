/**
 * Centralized error handling utility for Firebase API operations
 * Provides standardized error responses and user-friendly messages
 */

import { FirebaseError } from 'firebase/app';

/**
 * Standard error response interface
 */
export interface ApiError {
  code: string;
  message: string;
  userMessage: string;
  originalError?: unknown;
}

/**
 * Error severity levels for logging
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Firebase error code to user-friendly message mapping
 */
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'auth/email-already-in-use': 'This email is already registered. Please sign in or use a different email.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
  'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found with this email. Please check your email or sign up.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password. Please try again.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',

  // Firestore errors
  'permission-denied': 'You don\'t have permission to perform this action.',
  'not-found': 'The requested resource was not found.',
  'already-exists': 'This resource already exists.',
  'resource-exhausted': 'Too many requests. Please try again later.',
  'failed-precondition': 'Operation cannot be completed. Please refresh and try again.',
  'aborted': 'Operation was cancelled. Please try again.',
  'out-of-range': 'Invalid value provided.',
  'unimplemented': 'This feature is not yet available.',
  'internal': 'An internal error occurred. Please try again later.',
  'unavailable': 'Service is temporarily unavailable. Please try again later.',
  'data-loss': 'Data error occurred. Please contact support.',
  'unauthenticated': 'Please sign in to continue.',
  'deadline-exceeded': 'Request timed out. Please try again.',
  'cancelled': 'Operation was cancelled.',

  // Storage errors
  'storage/unauthorized': 'You don\'t have permission to access this file.',
  'storage/canceled': 'Upload was cancelled.',
  'storage/unknown': 'An error occurred while uploading. Please try again.',
  'storage/object-not-found': 'File not found.',
  'storage/bucket-not-found': 'Storage bucket not configured. Please contact support.',
  'storage/quota-exceeded': 'Storage quota exceeded. Please contact support.',
  'storage/unauthenticated': 'Please sign in to upload files.',
  'storage/retry-limit-exceeded': 'Upload failed after multiple attempts. Please try again later.',
  'storage/invalid-checksum': 'File validation failed. Please try uploading again.',
};

/**
 * Extract error code from various error types
 */
function getErrorCode(error: unknown): string {
  if (!error) return 'unknown';

  // Firebase error
  if (typeof error === 'object' && 'code' in error) {
    return (error as FirebaseError).code || 'unknown';
  }

  // Generic Error
  if (error instanceof Error && 'code' in error) {
    return (error as any).code || 'unknown';
  }

  return 'unknown';
}

/**
 * Extract error message from various error types
 */
function getErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }

  return 'An unknown error occurred';
}

/**
 * Get user-friendly message for error code
 */
function getUserFriendlyMessage(code: string, defaultMessage?: string): string {
  const message = FIREBASE_ERROR_MESSAGES[code];
  if (message) return message;

  // Try to extract the error type from code (e.g., 'auth/user-not-found' -> 'user-not-found')
  const parts = code.split('/');
  if (parts.length > 1) {
    const subCode = parts.slice(1).join('/');
    const subMessage = FIREBASE_ERROR_MESSAGES[subCode];
    if (subMessage) return subMessage;
  }

  return defaultMessage || 'An error occurred. Please try again.';
}

/**
 * Create standardized API error object
 */
export function createApiError(
  error: unknown,
  context: string,
  defaultMessage?: string
): ApiError {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);
  const userMessage = getUserFriendlyMessage(code, defaultMessage);

  return {
    code,
    message: `${context}: ${message}`,
    userMessage,
    originalError: error,
  };
}

/**
 * Log error with appropriate severity
 */
export function logError(
  apiError: ApiError,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  additionalContext?: Record<string, unknown>
): void {
  // Only log errors in development or for critical errors
  if (process.env.NODE_ENV === 'development' || severity === ErrorSeverity.CRITICAL) {
    const logMethod = severity === ErrorSeverity.ERROR || severity === ErrorSeverity.CRITICAL
      ? console.error
      : severity === ErrorSeverity.WARNING
      ? console.warn
      : console.log;

    // Log as a single string to avoid object logging which triggers intercept-console-error
    const errorMessage = `[API Error] ${JSON.stringify({
      code: apiError.code,
      message: apiError.message,
      userMessage: apiError.userMessage,
      severity,
      ...additionalContext,
    })}`;

    logMethod(errorMessage);

    // Log original error for debugging
    if (apiError.originalError && severity === ErrorSeverity.CRITICAL) {
      const originalErrorMsg = apiError.originalError instanceof Error
        ? apiError.originalError.message
        : String(apiError.originalError);
      console.error(`[Original Error] ${originalErrorMsg}`);
    }
  }
}

/**
 * Handle error with logging and return standardized error
 */
export function handleError(
  error: unknown,
  context: string,
  options: {
    defaultMessage?: string;
    severity?: ErrorSeverity;
    logContext?: Record<string, unknown>;
    silent?: boolean; // Don't log to console
  } = {}
): ApiError {
  const apiError = createApiError(error, context, options.defaultMessage);

  if (!options.silent) {
    logError(apiError, options.severity || ErrorSeverity.ERROR, options.logContext);
  }

  return apiError;
}

/**
 * Check if error is a permission denied error
 */
export function isPermissionError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === 'permission-denied' || code === 'auth/unauthorized';
}

/**
 * Check if error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === 'not-found' || code === 'storage/object-not-found';
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === 'unauthenticated' || code.startsWith('auth/');
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const code = getErrorCode(error);
  const message = getErrorMessage(error).toLowerCase();
  return (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    code === 'auth/network-request-failed' ||
    message.includes('network') ||
    message.includes('connection')
  );
}

/**
 * Wrapper for async operations with standardized error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  options: {
    defaultMessage?: string;
    severity?: ErrorSeverity;
    logContext?: Record<string, unknown>;
    silent?: boolean;
    onError?: (error: ApiError) => void;
  } = {}
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const apiError = handleError(error, context, options);

    if (options.onError) {
      options.onError(apiError);
    }

    throw new Error(apiError.userMessage);
  }
}

/**
 * Wrapper for operations that should return null on specific errors
 */
export async function withNullOnError<T>(
  operation: () => Promise<T>,
  context: string,
  options: {
    nullOnPermissionDenied?: boolean;
    nullOnNotFound?: boolean;
    silent?: boolean;
  } = {}
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const shouldReturnNull =
      (options.nullOnPermissionDenied && isPermissionError(error)) ||
      (options.nullOnNotFound && isNotFoundError(error));

    if (shouldReturnNull) {
      if (!options.silent && process.env.NODE_ENV === 'development') {
        console.log(`[${context}] Returning null for expected error:`, getErrorCode(error));
      }
      return null;
    }

    const apiError = handleError(error, context);
    throw new Error(apiError.userMessage);
  }
}
