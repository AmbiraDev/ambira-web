/**
 * Shared utilities for Firebase API modules
 * Common helpers used across multiple domain modules
 */

import { Timestamp, DocumentData } from 'firebase/firestore';
import { handleError } from '@/lib/errorHandler';

/**
 * Legacy helper for backwards compatibility - wraps handleError
 * @deprecated Use handleError directly for better error context
 */
export const getErrorMessage = (
  error: unknown,
  defaultMessage: string
): string => {
  const apiError = handleError(error, 'Operation', {
    defaultMessage,
    silent: true,
  });
  return apiError.userMessage;
};

/**
 * Convert Firestore timestamp to JavaScript Date
 */
export const convertTimestamp = (
  timestamp: Timestamp | Date | string | number | unknown
): Date => {
  // Check if it's a Firestore Timestamp with toDate method
  if (
    timestamp &&
    typeof timestamp === 'object' &&
    'toDate' in timestamp &&
    typeof timestamp.toDate === 'function'
  ) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  // Fallback for strings, numbers, or other formats
  return new Date(timestamp as string | number);
};

/**
 * Convert JavaScript Date to Firestore Timestamp
 */
export const convertToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

/**
 * Remove undefined values from object
 * Firestore does not accept undefined values in documents
 */
export const removeUndefinedFields = <T extends Record<string, unknown>>(
  input: T
): Partial<T> => {
  const entries = Object.entries(input).filter(
    ([, value]) => value !== undefined
  );
  return Object.fromEntries(entries) as Partial<T>;
};

/**
 * Constants for private user fallbacks
 */
export const PRIVATE_USER_FALLBACK_NAME = 'Private User';
export const PRIVATE_USER_USERNAME_PREFIX = 'private';

/**
 * Build user details for social contexts, handling private/inaccessible users
 */
export const buildCommentUserDetails = (
  userId: string,
  userData: DocumentData | null
): {
  id: string;
  email: string;
  name: string;
  username: string;
  bio?: string;
  location?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
} => {
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
