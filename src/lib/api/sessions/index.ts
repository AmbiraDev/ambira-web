/**
 * Sessions API Module
 * Handles session/activity tracking: CRUD operations, feed, supports
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
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as limitFn,
  serverTimestamp,
  Timestamp,
  setDoc,
} from 'firebase/firestore';

// Local Firebase config
import { db, auth } from '@/lib/firebase';

// Error handling
import {
  handleError,
  isPermissionError,
  isNotFoundError,
  ErrorSeverity,
} from '@/lib/errorHandler';
import { checkRateLimit } from '@/lib/rateLimit';

// Error messages
import { ERROR_MESSAGES } from '@/config/errorMessages';

// Shared utilities
import { convertTimestamp, _removeUndefinedFields } from '../shared/utils';
import { fetchUserDataForSocialContext } from '../social/helpers';

// Import other API modules
import { firebasePostApi } from './posts';
import { firebaseChallengeApi } from '../challenges';

// Config
import { TIMEOUTS } from '@/config/constants';
import { TIMEOUT_ERRORS } from '@/config/errorMessages';

// Types
import type {
  Session,
  SessionWithDetails,
  CreateSessionData,
  SessionFilters,
  SessionListResponse,
  User,
  Project,
  Post,
  Activity,
} from '@/types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate and normalize project/activity status from Firestore
 * Ensures the status is one of the allowed values, falls back to 'active' if invalid
 *
 * @param status - The status value from Firestore (may be any string)
 * @returns A valid status value: 'active', 'completed', or 'archived'
 */
function normalizeStatus(status: unknown): 'active' | 'completed' | 'archived' {
  if (status === 'completed' || status === 'archived') {
    return status;
  }
  return 'active';
}

/**
 * Create a timeout promise that rejects after a specified duration
 * Used to prevent Firebase queries from hanging indefinitely
 *
 * @param ms - Timeout duration in milliseconds
 * @param errorMessage - Error message to throw on timeout
 * @returns Promise that rejects after the specified duration
 */
function createTimeout(ms: number, errorMessage: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms);
  });
}

/**
 * Wrap a Firebase query with timeout protection
 * Races the query against a timeout to prevent hanging requests
 *
 * @param queryPromise - The Firebase query promise to execute
 * @param timeoutMs - Timeout duration in milliseconds (default: TIMEOUTS.FIREBASE_QUERY)
 * @returns Promise that resolves with query result or rejects on timeout
 */
async function withTimeout<T>(
  queryPromise: Promise<T>,
  timeoutMs: number = TIMEOUTS.FIREBASE_QUERY
): Promise<T> {
  return Promise.race([
    queryPromise,
    createTimeout(timeoutMs, TIMEOUT_ERRORS.FIREBASE_QUERY),
  ]);
}

// ============================================================================
// PUBLIC API
// ============================================================================

export const firebaseSessionApi = {
  // Create a new session
  createSession: async (data: CreateSessionData): Promise<Session> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Rate limitFn session creation
      checkRateLimit(auth.currentUser.uid, 'SESSION_CREATE');

      // Prepare session data for Firestore
      const activityId = data.activityId || data.projectId || ''; // Support both for backwards compatibility
      const sessionData: unknown = {
        userId: auth.currentUser.uid,
        activityId: activityId, // New field
        projectId: activityId, // Keep for backwards compatibility
        title: data.title,
        description: data.description || '',
        duration: data.duration,
        startTime: Timestamp.fromDate(data.startTime),
        // tags removed - no longer used
        visibility: data.visibility || 'private',
        showStartTime: data.showStartTime || false,
        privateNotes: data.privateNotes || '',
        images: data.images || [],
        allowComments: data.allowComments !== false,
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
      } catch (_error) {
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
          }
        );
      } catch (_error) {
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
        // tags removed - no longer used
        visibility: sessionData.visibility,
        showStartTime: sessionData.showStartTime,
        howFelt: data.howFelt,
        privateNotes: data.privateNotes,
        images: data.images || [],
        allowComments: sessionData.allowComments,
        isArchived: false,
        // Social engagement fields (sessions ARE posts)
        supportCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return newSession;
    } catch (_error) {
      const apiError = handleError(error, 'Create session', {
        defaultMessage: ERROR_MESSAGES.SESSION_SAVE_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Create a session with an optional post based on visibility settings
   *
   * @param sessionData - The session data to create
   * @param postContent - The content for the post (if visibility is not private)
   * @param visibility - Who can see this session: 'everyone', 'followers', or 'private'
   * @returns Promise resolving to an object containing the created session and optional post
   * @throws Error if user is not authenticated or session creation fails
   */
  createSessionWithPost: async (
    sessionData: CreateSessionData,
    postContent: string,
    visibility: 'everyone' | 'followers' | 'private'
  ): Promise<{ session: Session; post?: Post }> => {
    try {
      // Create session first with the correct visibility
      const session = await firebaseSessionApi.createSession({
        ...sessionData,
        visibility,
      });

      let post: Post | undefined;

      // Create post if not private
      if (visibility !== 'private') {
        post = await firebasePostApi.createPost({
          sessionId: session.id,
          content: postContent,
          visibility,
        });
      }

      return { session, post };
    } catch (_error) {
      handleError(error, 'in createSessionWithPost', {
        severity: ErrorSeverity.ERROR,
      });
      const apiError = handleError(error, 'Create session with post', {
        defaultMessage: ERROR_MESSAGES.SESSION_SAVE_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Save the active timer session to Firestore for persistence across tabs/devices
   *
   * @param timerData - The timer data to save
   * @param timerData.startTime - When the timer started
   * @param timerData.projectId - The project being tracked
   * @param timerData.selectedTaskIds - Array of task IDs being tracked
   * @param timerData.pausedDuration - Total time paused in milliseconds (optional)
   * @param timerData.isPaused - Whether the timer is currently paused (optional)
   * @returns Promise that resolves when the session is saved
   * @throws Error if user is not authenticated or save fails
   */
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
    } catch (_error) {
      const apiError = handleError(error, 'Save active session');
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Retrieve the active timer session from Firestore
   *
   * @returns Promise resolving to the active session data or null if no active session exists
   */
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
    } catch (_error) {
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

  /**
   * Clear the active timer session from Firestore and broadcast cancellation to other tabs
   *
   * @returns Promise that resolves when the session is cleared
   * @throws Error if clearing the session fails (except for permission/not found errors)
   */
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
      } catch (_storageError) {
        // Ignore storage errors (e.g., in private browsing mode)
      }
    } catch (_error) {
      const apiError = handleError(error, 'Clear active session', {
        defaultMessage: 'Failed to clear active session',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Get sessions for a user with fully populated user and project data
   * Sessions are used as the primary content type (like posts on Strava)
   *
   * @param userId - The user ID whose sessions to retrieve
   * @param limitCount - Maximum number of sessions to return (default: 20)
   * @param isOwnProfile - Whether viewing own profile (shows all sessions including private)
   * @returns Promise resolving to array of sessions with user and project details
   * @throws Error if user is not authenticated or fetch fails
   */
  getUserSessions: async (
    userId: string,
    limitCount: number = 20,
    isOwnProfile: boolean = false
  ): Promise<SessionWithDetails[]> => {
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
          limitFn(limitCount)
        );
      } else {
        // Show only public sessions for other profiles
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('userId', '==', userId),
          where('visibility', '==', 'everyone'),
          orderBy('createdAt', 'desc'),
          limitFn(limitCount)
        );
      }

      const querySnapshot = await withTimeout(getDocs(sessionsQuery));
      const sessions: SessionWithDetails[] = [];

      // Get user data once (since all sessions are from the same user)
      const userDoc = await withTimeout(getDoc(doc(db, 'users', userId)));
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
          } catch (_error) {
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
              status: normalizeStatus(projectData.status),
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
          activityId: sessionData.activityId || sessionData.projectId || '',
          projectId: sessionData.projectId || sessionData.activityId || '',
          title: sessionData.title || 'Untitled Session',
          description: sessionData.description || '',
          duration: sessionData.duration || 0,
          startTime: convertTimestamp(sessionData.startTime) || new Date(),
          tags: sessionData.tags || [],
          visibility: sessionData.visibility || 'everyone',
          showStartTime: sessionData.showStartTime,
          howFelt: sessionData.howFelt,
          privateNotes: sessionData.privateNotes,
          isArchived: sessionData.isArchived || false,
          images: sessionData.images || [],
          allowComments: sessionData.allowComments !== false,
          supportCount: sessionData.supportCount || 0,
          commentCount: sessionData.commentCount || 0,
          createdAt: convertTimestamp(sessionData.createdAt) || new Date(),
          updatedAt: convertTimestamp(sessionData.updatedAt) || new Date(),
          user,
          project,
          activity: project,
        });
      }

      return sessions;
    } catch (_error) {
      handleError(error, 'get user sessions', {
        severity: ErrorSeverity.ERROR,
      });
      const apiError = handleError(error, 'Get user sessions', {
        defaultMessage: ERROR_MESSAGES.SESSION_LOAD_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Get the total count of sessions for a user
   *
   * @param userId - The user ID whose session count to retrieve
   * @param isOwnProfile - Whether viewing own profile (counts all sessions including private)
   * @returns Promise resolving to the session count (returns 0 on error)
   */
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

      const querySnapshot = await withTimeout(getDocs(sessionsQuery));
      return querySnapshot.size;
    } catch (_error) {
      handleError(error, 'get user sessions count', {
        severity: ErrorSeverity.ERROR,
      });
      return 0;
    }
  },

  /**
   * Get sessions for the authenticated user with optional filters
   *
   * @param page - Page number for pagination (default: 1)
   * @param limitCount - Maximum number of sessions per page (default: 20)
   * @param filters - Optional filters to apply (e.g., projectId)
   * @returns Promise resolving to sessions list with pagination metadata
   * @throws Error if user is not authenticated or fetch fails
   */
  getSessions: async (
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
        limitFn(limitCount)
      );

      if (filters.projectId) {
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('userId', '==', auth.currentUser.uid),
          where('projectId', '==', filters.projectId),
          orderBy('startTime', 'desc'),
          limitFn(limitCount)
        );
      }

      const querySnapshot = await withTimeout(getDocs(sessionsQuery));
      const sessions: Session[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          userId: data.userId,
          activityId: data.activityId || data.projectId || '',
          projectId: data.projectId || data.activityId || '',
          title: data.title,
          description: data.description,
          duration: data.duration,
          startTime: convertTimestamp(data.startTime),
          tags: data.tags || [],
          visibility: data.visibility || 'private',
          showStartTime: data.showStartTime,
          howFelt: data.howFelt,
          privateNotes: data.privateNotes,
          isArchived: data.isArchived || false,
          images: data.images || [],
          allowComments: data.allowComments !== false,
          supportCount: data.supportCount || 0,
          commentCount: data.commentCount || 0,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        });
      });

      return {
        sessions,
        totalCount: sessions.length,
        hasMore: querySnapshot.docs.length === limitCount,
      };
    } catch (_error) {
      const apiError = handleError(error, 'Get sessions', {
        defaultMessage: ERROR_MESSAGES.SESSION_LOAD_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Update an existing session with new data
   *
   * @param sessionId - The ID of the session to update
   * @param data - Partial session data with fields to update
   * @returns Promise that resolves when the session is updated
   * @throws Error if user is not authenticated, session not found, or permission denied
   */
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
      const updateData: unknown = {
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
      if (data.startTime !== undefined)
        updateData.startTime = Timestamp.fromDate(data.startTime);
      if (data.duration !== undefined) updateData.duration = data.duration;

      // Remove undefined values
      Object.keys(updateData).forEach(
        key => updateData[key] === undefined && delete updateData[key]
      );

      await updateDoc(sessionRef, updateData);
    } catch (_error) {
      const apiError = handleError(error, 'Update session', {
        defaultMessage: ERROR_MESSAGES.SESSION_UPDATE_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Delete a session permanently
   *
   * @param sessionId - The ID of the session to delete
   * @returns Promise that resolves when the session is deleted
   * @throws Error if user is not authenticated, session not found, or permission denied
   */
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
    } catch (_error) {
      const apiError = handleError(error, 'Delete session', {
        defaultMessage: ERROR_MESSAGES.SESSION_DELETE_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Get a single session by ID (basic data only, no populated details)
   *
   * @param sessionId - The ID of the session to retrieve
   * @returns Promise resolving to the session data
   * @throws Error if user is not authenticated, session not found, or permission denied
   */
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
        activityId: data.activityId || data.projectId || '',
        projectId: data.projectId || data.activityId || '',
        title: data.title,
        description: data.description,
        duration: data.duration,
        startTime: convertTimestamp(data.startTime),
        tags: data.tags || [],
        visibility: data.visibility || 'private',
        showStartTime: data.showStartTime,
        howFelt: data.howFelt,
        privateNotes: data.privateNotes,
        isArchived: data.isArchived || false,
        images: data.images || [],
        allowComments: data.allowComments !== false,
        supportCount: data.supportCount || 0,
        commentCount: data.commentCount || 0,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      };
    } catch (_error) {
      const apiError = handleError(error, 'Get session', {
        defaultMessage: ERROR_MESSAGES.SESSION_LOAD_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Get a single session with fully populated user and project details
   *
   * @param sessionId - The ID of the session to retrieve
   * @returns Promise resolving to the session with user, project, and support status
   * @throws Error if user is not authenticated, session not found, or permission denied
   */
  getSessionWithDetails: async (
    sessionId: string
  ): Promise<SessionWithDetails> => {
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
      let activity: Activity | null = null;
      if (data.projectId || data.activityId) {
        const activityId = data.activityId || data.projectId;
        const activityRef = doc(
          db,
          'projects',
          data.userId,
          'userProjects',
          activityId
        );
        const activityDoc = await getDoc(activityRef);
        if (activityDoc.exists()) {
          const activityData = activityDoc.data();
          activity = {
            id: activityDoc.id,
            userId: data.userId,
            name: activityData.name,
            description: activityData.description || '',
            color: activityData.color || '#007AFF',
            icon: activityData.icon || 'FolderIcon',
            status: normalizeStatus(activityData.status),
            createdAt: convertTimestamp(activityData.createdAt),
            updatedAt: convertTimestamp(activityData.updatedAt),
          };
        }
      }

      // Check if current user has supported this session
      const supportedBy = data.supportedBy || [];
      const isSupported = supportedBy.includes(auth.currentUser.uid);

      // Create default activity object
      const defaultActivity: Activity = {
        id: '',
        userId: data.userId,
        name: 'No Activity',
        description: '',
        color: '#007AFF',
        icon: 'FolderIcon',
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        id: sessionDoc.id,
        userId: data.userId,
        activityId: data.activityId || data.projectId || '',
        projectId: data.projectId || data.activityId || '',
        title: data.title,
        description: data.description,
        duration: data.duration,
        startTime: convertTimestamp(data.startTime),
        tags: data.tags || [],
        visibility: data.visibility || 'private',
        showStartTime: data.showStartTime,
        howFelt: data.howFelt,
        privateNotes: data.privateNotes,
        isArchived: data.isArchived || false,
        images: data.images || [],
        allowComments: data.allowComments !== false,
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
          createdAt: userData?.createdAt || new Date(),
          updatedAt: userData?.updatedAt || new Date(),
        },
        activity: activity || defaultActivity,
        project: activity || defaultActivity,
      };
    } catch (_error) {
      // Don't log permission errors - these are expected for private/restricted sessions
      const silent = isPermissionError(error);
      const apiError = handleError(error, 'Get session with details', {
        defaultMessage: ERROR_MESSAGES.SESSION_LOAD_FAILED,
        silent,
      });
      throw new Error(apiError.userMessage);
    }
  },
};

// Helper function to process post documents into PostWithDetails
