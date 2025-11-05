/**
 * User API Module
 * Handles user profile operations: CRUD, stats, privacy, search, social graph
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Firebase imports
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as limitFn,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

// Local Firebase config
import { db, auth, storage } from '@/lib/firebase';

// Error handling
import {
  handleError,
  isPermissionError,
  isNotFoundError,
  ErrorSeverity,
} from '@/lib/errorHandler';

// Rate limiting
import { checkRateLimit } from '@/lib/rateLimit';

// Error messages
import { ERROR_MESSAGES } from '@/config/errorMessages';

// Shared utilities
import { convertTimestamp } from '../shared/utils';
import { safeNumber } from '@/lib/utils';

// Social helpers
import { updateSocialGraph } from '../social/helpers';

// Types
import type {
  User,
  UserProfile,
  UserStats,
  ActivityData,
  WeeklyActivity,
  ProjectBreakdown,
  PrivacySettings,
  UserSearchResult,
  SuggestedUser,
} from '@/types';

export const firebaseUserApi = {
  /**
   * Get user profile by username with privacy checks and follower count recalculation
   *
   * @param username - The username of the user to retrieve
   * @returns Promise resolving to the user profile with social stats
   * @throws Error if user not found, profile is private, or access is denied
   */
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
      if (!userDoc) {
        throw new Error('User not found');
      }
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
        } catch (_err) {
          // Handle permission errors silently - this is expected for privacy-protected data
          if (!isPermissionError(_err)) {
            handleError(_err, 'Recalculate follower counts', {
              severity: ErrorSeverity.WARNING,
            });
          }
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
    } catch (_err) {
      // Don't log "not found" and privacy errors - these are expected user flows
      const errorMessage =
        _err instanceof Error ? _err.message : 'Failed to get user profile';
      const isExpectedError =
        errorMessage === 'User not found' ||
        errorMessage === 'This profile is private' ||
        errorMessage === 'This profile is only visible to followers';

      if (!isExpectedError) {
        handleError(_err, 'Get user profile', {
          defaultMessage: ERROR_MESSAGES.PROFILE_LOAD_FAILED,
        });
      }

      throw _err;
    }
  },

  /**
   * Get user by ID for internal references (e.g., group admins, challenge participants)
   *
   * @param userId - The user ID to retrieve
   * @returns Promise resolving to the user data
   * @throws Error if user not found or permission denied
   */
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
    } catch (_error) {
      // Handle permission errors for deleted users gracefully
      if (isPermissionError(_error)) {
        throw new Error('User not found');
      }
      const apiError = handleError(_error, 'Get user by ID', {
        defaultMessage: 'Failed to get user',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Get daily activity data for a user for a specific year
   * Returns hours and session count for each day of the year
   *
   * @param userId - The user ID whose activity to retrieve
   * @param year - The year to get activity for
   * @returns Promise resolving to array of daily activity data (365/366 entries)
   * @throws Error if fetch fails
   */
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
        const durationSeconds = safeNumber(data.duration, 0);

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
    } catch (_error) {
      const apiError = handleError(_error, 'Get daily activity', {
        defaultMessage: 'Failed to get daily activity',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Get weekly activity data for a user for the past N weeks
   *
   * @param userId - The user ID whose activity to retrieve
   * @param numberOfWeeks - Number of weeks to retrieve (default: 12)
   * @returns Promise resolving to array of weekly activity data
   * @throws Error if fetch fails
   */
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
        const durationSeconds = safeNumber(data.duration, 0);
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
    } catch (_error) {
      const apiError = handleError(_error, 'Get weekly activity', {
        defaultMessage: 'Failed to get weekly activity',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Get project breakdown showing time distribution across projects
   *
   * @param userId - The user ID whose project breakdown to retrieve
   * @param year - Optional year to filter by (omit for all-time)
   * @returns Promise resolving to array of project breakdowns with hours and percentages
   * @throws Error if fetch fails
   */
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
        const durationSeconds = safeNumber(data.duration, 0);
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
    } catch (_error) {
      const apiError = handleError(_error, 'Get project breakdown', {
        defaultMessage: 'Failed to get project breakdown',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Upload a profile picture to Firebase Storage
   *
   * @param file - The image file to upload (JPEG, PNG, GIF, or WebP, max 5MB)
   * @returns Promise resolving to the download URL of the uploaded image
   * @throws Error if user is not authenticated, file is invalid, or upload fails
   */
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
    } catch (_error) {
      const apiError = handleError(_error, 'Upload profile picture', {
        defaultMessage: 'Failed to upload profile picture',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Delete a profile picture from Firebase Storage
   * Only deletes Firebase Storage URLs, skips external URLs (e.g., Google profile photos)
   *
   * @param profilePictureUrl - The URL of the profile picture to delete
   * @returns Promise that resolves when the picture is deleted (errors are handled gracefully)
   */
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
      } catch (_error) {
        // Ignore errors if file doesn't exist
        if (!isNotFoundError(_error)) {
          handleError(_error, 'Delete old profile picture', {
            severity: ErrorSeverity.WARNING,
          });
        }
      }
    } catch (_error) {
      handleError(_error, 'in deleteProfilePicture', {
        severity: ErrorSeverity.WARNING,
      });
      // Don't throw error - this is a cleanup operation
    }
  },

  /**
   * Update the authenticated user's profile information
   *
   * @param data - Partial profile data with fields to update
   * @returns Promise resolving to the updated user profile
   * @throws Error if user is not authenticated or update fails
   */
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
      const cleanData: Record<string, unknown> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanData[key] = value;
        }
      });

      // Add lowercase fields for searchability
      if (cleanData.name && typeof cleanData.name === 'string') {
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
    } catch (_error) {
      const apiError = handleError(_error, 'Update profile', {
        defaultMessage: ERROR_MESSAGES.PROFILE_UPDATE_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Get comprehensive statistics for a user including hours, streaks, and productivity metrics
   *
   * @param userId - The user ID whose stats to retrieve
   * @returns Promise resolving to user stats (returns default stats on error)
   */
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
      };
    } catch (_error) {
      handleError(_error, 'get user stats', { severity: ErrorSeverity.ERROR });
      // Return default stats instead of throwing error
      return {
        totalHours: 0,
        weeklyHours: 0,
        monthlyHours: 0,
        sessionsThisWeek: 0,
        sessionsThisMonth: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageSessionDuration: 0,
        mostProductiveHour: 0,
        favoriteProject: undefined,
      };
    }
  },

  /**
   * Follow a user and update the social graph
   *
   * @param userId - The ID of the user to follow
   * @returns Promise that resolves when the follow is complete
   * @throws Error if user is not authenticated, rate limit exceeded, or follow fails
   */
  followUser: async (userId: string): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    // Rate limitFn follow actions
    checkRateLimit(auth.currentUser.uid, 'FOLLOW');
    await updateSocialGraph(auth.currentUser.uid, userId, 'follow');
  },

  /**
   * Unfollow a user and update the social graph
   *
   * @param userId - The ID of the user to unfollow
   * @returns Promise that resolves when the unfollow is complete
   * @throws Error if user is not authenticated, rate limit exceeded, or unfollow fails
   */
  unfollowUser: async (userId: string): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    // Rate limitFn unfollow actions (uses same limitFn as follow)
    checkRateLimit(auth.currentUser.uid, 'FOLLOW');
    await updateSocialGraph(auth.currentUser.uid, userId, 'unfollow');
  },

  /**
   * Check if the current user is following a target user
   *
   * @param currentUserId - The ID of the current user
   * @param targetUserId - The ID of the target user to check
   * @returns Promise resolving to true if following, false otherwise
   */
  isFollowing: async (
    currentUserId: string,
    targetUserId: string
  ): Promise<boolean> => {
    try {
      const socialGraphDoc = await getDoc(
        doc(db, `social_graph/${currentUserId}/outbound`, targetUserId)
      );
      return socialGraphDoc.exists();
    } catch (_error) {
      handleError(_error, 'checking follow status', {
        severity: ErrorSeverity.ERROR,
      });
      return false;
    }
  },

  /**
   * Get all followers for a user (people who follow this user)
   * Supports both new social_graph structure and legacy follows collection
   *
   * @param userId - The user ID whose followers to retrieve
   * @returns Promise resolving to array of follower users (empty array on error)
   * @throws Error if fetch fails (except permission errors which return empty array)
   */
  getFollowers: async (userId: string): Promise<User[]> => {
    try {
      let followerIds: string[] = [];

      // Try new social_graph structure first
      try {
        const inboundRef = collection(db, `social_graph/${userId}/inbound`);
        const inboundSnapshot = await getDocs(inboundRef);

        if (!inboundSnapshot.empty) {
          followerIds = inboundSnapshot.docs.map(doc => doc.id);
        }
      } catch (_socialGraphError) {
        // If social_graph doesn't exist or has permission issues, continue to fallback
      }

      // Fallback to old follows collection if no followers found via social_graph
      if (followerIds.length === 0) {
        const followersQuery = query(
          collection(db, 'follows'),
          where('followingId', '==', userId)
        );
        const followersSnapshot = await getDocs(followersQuery);

        followerIds = followersSnapshot.docs.map(doc => {
          const data = doc.data();
          return data.followerId;
        });
      }

      if (followerIds.length === 0) {
        return [];
      }

      // Get user details for all followers
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
        } else {
        }
      }

      return followers;
    } catch (_error) {
      // Handle permission errors silently for privacy-protected data
      if (isPermissionError(_error)) {
        return [];
      }
      const apiError = handleError(_error, 'Fetch followers', {
        defaultMessage: ERROR_MESSAGES.PROFILE_LOAD_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Get all users that a user is following
   * Supports both new social_graph structure and legacy follows collection
   *
   * @param userId - The user ID whose following list to retrieve
   * @returns Promise resolving to array of following users (empty array on error)
   * @throws Error if fetch fails (except permission errors which return empty array)
   */
  getFollowing: async (userId: string): Promise<User[]> => {
    try {
      let followingIds: string[] = [];

      // Try new social_graph structure first
      try {
        const outboundRef = collection(db, `social_graph/${userId}/outbound`);
        const outboundSnapshot = await getDocs(outboundRef);

        if (!outboundSnapshot.empty) {
          followingIds = outboundSnapshot.docs.map(doc => doc.id);
        }
      } catch (_socialGraphError) {
        // If social_graph doesn't exist or has permission issues, continue to fallback
      }

      // Fallback to old follows collection if no following found via social_graph
      if (followingIds.length === 0) {
        const followingQuery = query(
          collection(db, 'follows'),
          where('followerId', '==', userId)
        );
        const followingSnapshot = await getDocs(followingQuery);

        followingIds = followingSnapshot.docs.map(doc => {
          const data = doc.data();
          return data.followingId;
        });
      }

      if (followingIds.length === 0) {
        return [];
      }

      // Get user details for all following
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
        } else {
        }
      }

      return following;
    } catch (_error) {
      // Handle permission errors silently for privacy-protected data
      if (isPermissionError(_error)) {
        return [];
      }
      const apiError = handleError(_error, 'Fetch following', {
        defaultMessage: ERROR_MESSAGES.PROFILE_LOAD_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Recalculate and sync follower/following counts from the follows collection
   * Useful for fixing stale or incorrect counts
   *
   * @param userId - The user ID whose counts to sync
   * @returns Promise resolving to the updated follower and following counts
   * @throws Error if sync fails
   */
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
    } catch (_error) {
      const apiError = handleError(_error, 'Sync follower counts', {
        defaultMessage: 'Failed to sync follower counts',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Search for users by username or name (case-insensitive prefix matching)
   *
   * @param searchTerm - The search term to match against username/name
   * @param page - Page number for pagination (default: 1)
   * @param limitCount - Maximum number of results to return (default: 20)
   * @returns Promise resolving to search results with pagination metadata
   * @throws Error if rate limit exceeded or search fails
   */
  searchUsers: async (
    searchTerm: string,
    limitCount: number = 20
  ): Promise<{
    users: UserSearchResult[];
    totalCount: number;
    hasMore: boolean;
  }> => {
    try {
      // Rate limitFn search operations
      if (auth.currentUser) {
        checkRateLimit(auth.currentUser.uid, 'SEARCH');
      }

      const term = (searchTerm || '').trim();
      if (!term) {
        return { users: [], totalCount: 0, hasMore: false };
      }

      // Convert search term to lowercase for case-insensitive search
      const termLower = term.toLowerCase();

      // Get all users and filter client-side for guaranteed results
      // This ensures search works even if lowercase fields are missing or indexes aren't deployed
      const usersQuery = query(collection(db, 'users'), limitFn(1000)); // Increased limit for better results
      const querySnapshot = await getDocs(usersQuery);

      // Merge and de-duplicate results, prefer username matches first
      const byId: Record<string, UserSearchResult> = {};
      querySnapshot.forEach(docSnap => {
        const userData = docSnap.data();
        const username = (userData.username || '').toLowerCase();
        const name = (userData.name || '').toLowerCase();

        // Only include users whose username or name contains the search term
        if (username.includes(termLower) || name.includes(termLower)) {
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
        }
      });

      // Convert to array and apply a basic relevance sort: exact prefix on username > name > others
      let users = Object.values(byId)
        .sort((a, b) => {
          const t = termLower;
          const aUser = a.username?.toLowerCase() || '';
          const bUser = b.username?.toLowerCase() || '';
          const aName = a.name?.toLowerCase() || '';
          const bName = b.name?.toLowerCase() || '';

          // Prioritize exact prefix matches, then contains matches
          const aScore =
            (aUser.startsWith(t) ? 4 : 0) +
            (aName.startsWith(t) ? 2 : 0) +
            (aUser.includes(t) ? 1 : 0) +
            (aName.includes(t) ? 0.5 : 0);
          const bScore =
            (bUser.startsWith(t) ? 4 : 0) +
            (bName.startsWith(t) ? 2 : 0) +
            (bUser.includes(t) ? 1 : 0) +
            (bName.includes(t) ? 0.5 : 0);
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
    } catch (_error) {
      const apiError = handleError(_error, 'Search users', {
        defaultMessage: 'Failed to search users',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Get suggested users to follow based on popularity
   * Filters out current user and users already being followed
   *
   * @param limitCount - Maximum number of suggestions to return (default: 10)
   * @returns Promise resolving to array of suggested users with follow reasons
   * @throws Error if fetch fails (returns empty array on error)
   */
  getSuggestedUsers: async (
    limitCount: number = 10
  ): Promise<SuggestedUser[]> => {
    try {
      if (!auth.currentUser) {
        return [];
      }

      // Get list of users we're already following directly from social_graph
      const outboundRef = collection(
        db,
        `social_graph/${auth.currentUser.uid}/outbound`
      );
      const outboundSnapshot = await getDocs(outboundRef);
      const followingIds = new Set(outboundSnapshot.docs.map(doc => doc.id));
      followingIds.add(auth.currentUser.uid); // Also exclude current user

      // Also check old follows collection for backward compatibility if social_graph is empty
      if (followingIds.size === 1) {
        // Only current user in set
        const followingQuery = query(
          collection(db, 'follows'),
          where('followerId', '==', auth.currentUser.uid)
        );
        const followingSnapshot = await getDocs(followingQuery);
        followingSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.followingId) {
            followingIds.add(data.followingId);
          }
        });
      }

      // Query users ordered by popularity (follower count descending)
      // Fetch a reasonable buffer to account for already-followed users
      // If we need 5 suggestions and user follows ~20 people, fetching 30 should be sufficient
      const fetchLimit = Math.min(limitCount * 5, 50); // 5x multiplier, max 50
      const usersQuery = query(
        collection(db, 'users'),
        where('profileVisibility', '==', 'everyone'),
        orderBy('followersCount', 'desc'),
        limitFn(fetchLimit)
      );

      const querySnapshot = await getDocs(usersQuery);
      const suggestions: SuggestedUser[] = [];

      // Filter and collect until we have enough suggestions
      for (const doc of querySnapshot.docs) {
        if (suggestions.length >= limitCount) {
          break;
        }

        // Skip users we're already following or current user
        if (followingIds.has(doc.id)) {
          continue;
        }

        const userData = doc.data();
        suggestions.push({
          id: doc.id,
          username: userData.username,
          name: userData.name,
          bio: userData.bio,
          profilePicture: userData.profilePicture,
          followersCount: userData.followersCount || 0,
          reason:
            (userData.followersCount || 0) > 10
              ? 'popular_user'
              : 'similar_interests',
          isFollowing: false,
        });
      }

      return suggestions;
    } catch (_error) {
      handleError(_error, 'getting suggested users', {
        severity: ErrorSeverity.ERROR,
      });
      const apiError = handleError(_error, 'Get suggested users', {
        defaultMessage: 'Failed to get suggested users',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Get privacy settings for the authenticated user
   *
   * @returns Promise resolving to the user's privacy settings
   * @throws Error if user is not authenticated or fetch fails
   */
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
    } catch (_error) {
      const apiError = handleError(_error, 'Get privacy settings', {
        defaultMessage: 'Failed to get privacy settings',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Update privacy settings for the authenticated user
   *
   * @param settings - Partial privacy settings with fields to update
   * @returns Promise resolving to the updated privacy settings
   * @throws Error if user is not authenticated or update fails
   */
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
    } catch (_error) {
      const apiError = handleError(_error, 'Update privacy settings', {
        defaultMessage: 'Failed to update privacy settings',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Check if a username is available (not already taken)
   *
   * @param username - The username to check
   * @returns Promise resolving to true if available, false if taken
   * @throws Error if check fails
   */
  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '==', username),
        limitFn(1)
      );
      const querySnapshot = await getDocs(usersQuery);
      return querySnapshot.empty;
    } catch (_error) {
      // Handle Firebase permission errors gracefully
      if (isPermissionError(_error)) {
        handleError(_error, 'Check username availability', {
          severity: ErrorSeverity.WARNING,
        });
        // In case of permission error, assume username is available to allow registration to proceed
        // The actual uniqueness will be enforced by Firebase Auth and server-side validation
        return true;
      }
      const apiError = handleError(_error, 'Check username availability');
      throw new Error(
        apiError.userMessage ||
          'Unable to verify username availability. Please try again.'
      );
    }
  },

  /**
   * Migration utility: Add lowercase username and name fields for search functionality
   * Should only be run once as a data migration
   *
   * @returns Promise resolving to migration statistics (success, failed, total counts)
   * @throws Error if user is not authenticated or migration fails
   */
  migrateUsersToLowercase: async (): Promise<{
    success: number;
    failed: number;
    total: number;
  }> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const usersQuery = query(collection(db, 'users'), limitFn(500));
      const querySnapshot = await getDocs(usersQuery);

      let success = 0;
      let failed = 0;
      const total = querySnapshot.size;

      for (const userDoc of querySnapshot.docs) {
        try {
          const userData = userDoc.data();
          const updates: DocumentData = {
            updatedAt: serverTimestamp(),
          };

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
          }
        } catch (_error) {
          failed++;
        }
      }

      const result = { success, failed, total };
      return result;
    } catch (_error) {
      const apiError = handleError(_error, 'Migrate users to lowercase', {
        defaultMessage: 'Failed to migrate users',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Delete user account and all associated data permanently
   * Includes sessions, comments, follows, projects, tasks, streaks, and profile picture
   *
   * @returns Promise that resolves when account is completely deleted
   * @throws Error if user is not authenticated or deletion fails
   */
  deleteAccount: async (): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      const userId = auth.currentUser.uid;

      // 1. Delete all user's sessions
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', userId)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessionDeletes = sessionsSnapshot.docs.map(doc =>
        deleteDoc(doc.ref)
      );
      await Promise.all(sessionDeletes);

      // 2. Delete all user's comments
      const commentsQuery = query(
        collection(db, 'comments'),
        where('userId', '==', userId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const commentDeletes = commentsSnapshot.docs.map(doc =>
        deleteDoc(doc.ref)
      );
      await Promise.all(commentDeletes);

      // 3. Delete all follow relationships where user is follower or following
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

      // 4. Delete user's projects and their tasks
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

      // 5. Delete user's streak data
      try {
        const streakRef = doc(db, 'streaks', userId);
        await deleteDoc(streakRef);
      } catch (_error) {}

      // 6. Delete user's active session data
      try {
        const activeSessionRef = doc(
          db,
          'users',
          userId,
          'activeSession',
          'current'
        );
        await deleteDoc(activeSessionRef);
      } catch (_error) {}

      // 7. Delete profile picture from storage if it exists
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.data();
        if (userData?.profilePicture) {
          const storageRef = ref(storage, `profile-pictures/${userId}`);
          await deleteObject(storageRef);
        }
      } catch (_error) {}

      // 8. Delete the user document from Firestore
      await deleteDoc(doc(db, 'users', userId));

      // 9. Finally, delete the Firebase Auth user
      await auth.currentUser.delete();
    } catch (_error) {
      const apiError = handleError(_error, 'Delete account', {
        defaultMessage:
          'Failed to delete account. Please try logging out and back in, then try again.',
      });
      throw new Error(apiError.userMessage);
    }
  },
};
