/**
 * Sessions module helper functions
 * Shared utilities for session operations
 */

import { doc, getDoc } from 'firebase/firestore';

import { db, auth } from '@/lib/firebase';
import {
  handleError,
  isPermissionError,
  isNotFoundError,
  ErrorSeverity,
} from '@/lib/errorHandler';
import { convertTimestamp } from '../shared/utils';
import type { SessionWithDetails } from '@/types';
import { DEFAULT_ACTIVITIES } from '@/types';

export const populateSessionsWithDetails = async (
  sessionDocs: any[]
): Promise<SessionWithDetails[]> => {
  const sessions: SessionWithDetails[] = [];
  const batchSize = 10;

  for (let i = 0; i < sessionDocs.length; i += batchSize) {
    const batch = sessionDocs.slice(i, i + batchSize);
    const batchPromises = batch.map(async sessionDoc => {
      const sessionData = sessionDoc.data();

      // Get user data - skip session if user has been deleted or is inaccessible
      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', sessionData.userId));
      } catch (error) {
        // Handle permission errors for deleted users
        if (isPermissionError(error) || isNotFoundError(error)) {
          return null;
        }
        // Re-throw other errors
        throw error;
      }

      if (!userDoc.exists()) {
        // User no longer exists - skip session
        return null;
      }
      const userData = userDoc.data();

      // Get activity data (check both activityId and projectId for backwards compatibility)
      let activityData: any = null;
      const activityId = sessionData.activityId || sessionData.projectId;

      if (activityId) {
        // First, check if it's a default activity
        const defaultActivity = DEFAULT_ACTIVITIES.find(
          a => a.id === activityId
        );

        if (defaultActivity) {
          activityData = {
            id: defaultActivity.id,
            name: defaultActivity.name,
            icon: defaultActivity.icon,
            color: defaultActivity.color,
            description: '',
            status: 'active',
            isDefault: true,
          };
        } else {
          // If not a default activity, try to fetch from custom activities collection
          try {
            const activityDoc = await getDoc(
              doc(
                db,
                'projects',
                sessionData.userId,
                'userProjects',
                activityId
              )
            );
            if (activityDoc.exists()) {
              activityData = activityDoc.data();
            }
          } catch (error) {
            handleError(error, `Fetch activity ${activityId}`, {
              severity: ErrorSeverity.WARNING,
            });
          }
        }
      }

      // Check if current user has supported this session
      const supportedBy = sessionData.supportedBy || [];
      const isSupported = supportedBy.includes(auth.currentUser!.uid);

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
        activity: activityData
          ? {
              id: activityData.id || activityId || '',
              userId: sessionData.userId,
              name: activityData.name || 'Unknown Activity',
              description: activityData.description || '',
              icon: activityData.icon || 'flat-color-icons:briefcase',
              color: activityData.color || '#007AFF',
              status: activityData.status || 'active',
              isDefault: activityData.isDefault || false,
              createdAt: activityData.createdAt
                ? convertTimestamp(activityData.createdAt)
                : new Date(),
              updatedAt: activityData.updatedAt
                ? convertTimestamp(activityData.updatedAt)
                : new Date(),
            }
          : {
              id: activityId || '',
              userId: sessionData.userId,
              name: 'Unknown Activity',
              description: '',
              icon: 'flat-color-icons:briefcase',
              color: '#007AFF',
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
        project: activityData
          ? {
              id: activityData.id || activityId || '',
              userId: sessionData.userId,
              name: activityData.name || 'Unknown Activity',
              description: activityData.description || '',
              icon: activityData.icon || 'flat-color-icons:briefcase',
              color: activityData.color || '#007AFF',
              status: activityData.status || 'active',
              isDefault: activityData.isDefault || false,
              createdAt: activityData.createdAt
                ? convertTimestamp(activityData.createdAt)
                : new Date(),
              updatedAt: activityData.updatedAt
                ? convertTimestamp(activityData.updatedAt)
                : new Date(),
            }
          : {
              id: activityId || '',
              userId: sessionData.userId,
              name: 'Unknown Activity',
              description: '',
              icon: 'flat-color-icons:briefcase',
              color: '#007AFF',
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
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
