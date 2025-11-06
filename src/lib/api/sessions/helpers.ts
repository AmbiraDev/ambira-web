/**
 * Sessions module helper functions
 * Shared utilities for session operations
 */

import {
  doc,
  getDoc,
  DocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';

import { db, auth } from '@/lib/firebase';
import {
  handleError,
  isPermissionError,
  isNotFoundError,
  ErrorSeverity,
} from '@/lib/errorHandler';
import { convertTimestamp } from '../shared/utils';
import type { SessionWithDetails, Activity, Session } from '@/types';
import { getAllActivityTypes } from '../activityTypes';

/**
 * Get the activity ID from a session, checking both new and legacy fields
 * Ensures backward compatibility with sessions created before the activityId migration
 *
 * @param session - Session object (can be partial with just activityId/projectId)
 * @returns The activity ID or 'unassigned' if neither field exists
 */
export function getSessionActivityId(
  session: Pick<Session, 'activityId' | 'projectId'>
): string {
  return session.activityId || session.projectId || 'unassigned';
}

export const populateSessionsWithDetails = async (
  sessionDocs: DocumentSnapshot[]
): Promise<SessionWithDetails[]> => {
  const sessions: SessionWithDetails[] = [];
  const batchSize = 10;

  // Cache activity types to avoid fetching multiple times
  // Key: userId, Value: Map of activityId to activity data
  const activityCache = new Map<string, Map<string, DocumentData>>();

  // Helper to get or fetch activities for a user
  const getActivitiesForUser = async (
    userId: string
  ): Promise<Map<string, DocumentData>> => {
    if (!activityCache.has(userId)) {
      const allActivityTypes = await getAllActivityTypes(userId);

      const activityMap = new Map<string, DocumentData>();

      allActivityTypes.forEach(at => {
        activityMap.set(at.id, {
          id: at.id,
          name: at.name,
          icon: at.icon,
          color: at.defaultColor,
          description: at.description || '',
          status: 'active',
          isDefault: at.isSystem,
        });
      });

      activityCache.set(userId, activityMap);
    }

    return activityCache.get(userId)!;
  };

  for (let i = 0; i < sessionDocs.length; i += batchSize) {
    const batch = sessionDocs.slice(i, i + batchSize);
    const batchPromises = batch.map(async sessionDoc => {
      const sessionDataRaw = sessionDoc.data();

      // Skip if session data doesn't exist
      if (!sessionDataRaw) {
        return null;
      }

      // Type assertion to help TypeScript understand sessionData is non-null after check
      const sessionData = sessionDataRaw as DocumentData;

      // Get user data - skip session if user has been deleted or is inaccessible
      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', sessionData.userId));
      } catch (_error) {
        // Handle permission errors for deleted users
        if (isPermissionError(_error) || isNotFoundError(_error)) {
          return null;
        }
        // Re-throw other errors
        throw _error;
      }

      if (!userDoc.exists()) {
        // User no longer exists - skip session
        return null;
      }
      const userData = userDoc.data() as DocumentData | undefined;

      // Get activity data (check both activityId and projectId for backwards compatibility)
      let activityData: DocumentData | null = null;
      const activityId = sessionData.activityId || sessionData.projectId;

      if (activityId) {
        try {
          // Fetch all activities for this user (cached)
          const userActivities = await getActivitiesForUser(sessionData.userId);
          activityData = userActivities.get(activityId) || null;
        } catch (_error) {
          handleError(
            _error,
            `Fetch activities for user ${sessionData.userId}`,
            {
              severity: ErrorSeverity.WARNING,
            }
          );
        }
      }

      // Check if current user has supported this session
      const supportedBy = sessionData.supportedBy || [];
      const isSupported = supportedBy.includes(auth.currentUser!.uid);

      // Build activity object
      // If activityData exists, use it. Otherwise, provide a friendly fallback based on the activityId
      const finalActivity: Activity = activityData
        ? {
            id: activityData.id || activityId || '',
            userId: sessionData.userId,
            name: activityData.name || 'Unknown Activity',
            description: activityData.description || '',
            icon: activityData.icon || 'flat-color-icons:briefcase',
            color: activityData.color || '#0066CC',
            status: activityData.status || 'active',
            isDefault: activityData.isDefault || false,
            createdAt: activityData.createdAt
              ? convertTimestamp(activityData.createdAt)
              : new Date(),
            updatedAt: activityData.updatedAt
              ? convertTimestamp(activityData.updatedAt)
              : new Date(),
          }
        : ({
            id: activityId || '',
            userId: sessionData.userId,
            // If activityId matches a known system default name, display it capitalized
            // Otherwise show "Unknown Activity"
            name: activityId
              ? activityId.charAt(0).toUpperCase() +
                activityId.slice(1).replace(/-/g, ' ')
              : 'Unknown Activity',
            description: '',
            icon: 'flat-color-icons:briefcase',
            color: '#0066CC',
            status: 'active',
            isDefault: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Activity);

      // Build the session with full details
      const session: SessionWithDetails = {
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
        images: sessionData.images || [],
        allowComments: sessionData.allowComments !== false,
        isArchived: sessionData.isArchived || false,
        supportCount: sessionData.supportCount || 0,
        supportedBy: supportedBy,
        commentCount: sessionData.commentCount || 0,
        isSupported,
        createdAt: convertTimestamp(sessionData.createdAt),
        updatedAt: convertTimestamp(sessionData.updatedAt),
        user: {
          id: sessionData.userId,
          email: userData?.email || '',
          name: userData?.name || 'Unknown User',
          username: userData?.username || 'unknown',
          bio: userData?.bio,
          location: userData?.location,
          profilePicture: userData?.profilePicture,
          createdAt: convertTimestamp(userData?.createdAt) || new Date(),
          updatedAt: convertTimestamp(userData?.updatedAt) || new Date(),
        },
        activity: finalActivity,
        project: finalActivity,
      };

      return session;
    });

    const batchResults = await Promise.all(batchPromises);
    // Filter out null values (sessions from deleted users)
    const validSessions = batchResults.filter(
      (session): session is SessionWithDetails => session !== null
    );
    sessions.push(...validSessions);
  }

  return sessions;
};

// Helper function to check if username already exists
