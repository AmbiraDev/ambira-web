/**
 * Session Mapper
 *
 * Converts between Firestore documents and Session domain entities.
 */

import {
  DocumentSnapshot,
  Timestamp,
  getDoc,
  doc as firestoreDoc,
} from 'firebase/firestore';
import {
  Session,
  SessionVisibility,
  SessionUser,
  SessionActivity,
} from '@/domain/entities/Session';
import { db, auth } from '@/lib/firebase';
import { DEFAULT_ACTIVITIES } from '@/types';

export class SessionMapper {
  /**
   * Convert Firestore document to Session domain entity (without enrichment)
   */
  toDomain(doc: DocumentSnapshot): Session {
    const data = doc.data();
    if (!data) {
      throw new Error(`Session document ${doc.id} does not exist`);
    }

    return new Session(
      doc.id,
      data.userId,
      data.projectId,
      data.activityId || null,
      data.duration,
      this.timestampToDate(data.createdAt),
      data.title,
      data.description,
      (data.visibility as SessionVisibility) || 'everyone',
      data.supportCount || 0,
      data.commentCount || 0,
      data.groupIds || []
    );
  }

  /**
   * Convert Firestore document to enriched Session domain entity (with user/activity data)
   * Returns null if user data cannot be fetched (deleted/inaccessible users)
   */
  async toDomainEnriched(doc: DocumentSnapshot): Promise<Session | null> {
    const data = doc.data();
    if (!data) {
      throw new Error(`Session document ${doc.id} does not exist`);
    }

    // Fetch user data - REQUIRED, skip session if user is inaccessible
    let user: SessionUser | undefined;
    try {
      const userDoc = await getDoc(firestoreDoc(db, 'users', data.userId));
      if (!userDoc.exists()) {
        // User does not exist - skip session
        return null;
      }

      const userData = userDoc.data();
      user = {
        id: data.userId,
        email: userData.email || '',
        name: userData.name || 'Unknown User',
        username: userData.username || 'unknown',
        bio: userData.bio,
        profilePicture: userData.profilePicture,
        createdAt: this.timestampToDate(userData.createdAt),
        updatedAt: this.timestampToDate(userData.updatedAt),
      };
    } catch (error) {
      // If we can't fetch the user (permissions, deleted, etc), skip this session
      return null;
    }

    // Fetch activity data
    let activity: SessionActivity | undefined;
    const activityId = data.activityId || data.projectId;

    if (activityId) {
      // Check if it's a default activity first
      const defaultActivity = DEFAULT_ACTIVITIES.find(a => a.id === activityId);

      if (defaultActivity) {
        activity = {
          id: defaultActivity.id,
          userId: data.userId,
          name: defaultActivity.name,
          description: '',
          icon: defaultActivity.icon,
          color: defaultActivity.color,
          status: 'active' as const,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else {
        // Fetch custom activity
        try {
          const activityDoc = await getDoc(
            firestoreDoc(
              db,
              'projects',
              data.userId,
              'userProjects',
              activityId
            )
          );
          if (activityDoc.exists()) {
            const activityData = activityDoc.data();
            activity = {
              id: activityId,
              userId: data.userId,
              name: activityData.name || 'Unknown Activity',
              description: activityData.description || '',
              icon: activityData.icon || 'flat-color-icons:briefcase',
              color: activityData.color || '#007AFF',
              status: activityData.status || 'active',
              isDefault: false,
              createdAt: this.timestampToDate(activityData.createdAt),
              updatedAt: this.timestampToDate(activityData.updatedAt),
            };
          }
        } catch (error) {
          // Failed to fetch activity - use default
        }
      }
    }

    // Check if current user has supported this session
    const supportedBy = data.supportedBy || [];
    const isSupported = auth.currentUser
      ? supportedBy.includes(auth.currentUser.uid)
      : false;

    return new Session(
      doc.id,
      data.userId,
      data.projectId,
      data.activityId || null,
      data.duration,
      this.timestampToDate(data.createdAt),
      data.title,
      data.description,
      (data.visibility as SessionVisibility) || 'everyone',
      data.supportCount || 0,
      data.commentCount || 0,
      data.groupIds || [],
      // Enriched data
      user,
      activity,
      activity, // project (backwards compatibility)
      data.images || [],
      isSupported,
      supportedBy,
      data.allowComments !== false,
      this.timestampToDate(data.updatedAt),
      this.timestampToDate(data.startTime),
      data.tags || [],
      data.showStartTime,
      data.howFelt,
      data.privateNotes,
      data.isArchived || false
    );
  }

  /**
   * Convert Session domain entity to Firestore document data
   */
  toFirestore(session: Session): Record<string, unknown> {
    const data: Record<string, unknown> = {
      userId: session.userId,
      projectId: session.projectId,
      duration: session.duration,
      createdAt: Timestamp.fromDate(session.createdAt),
      visibility: session.visibility,
      supportCount: session.supportCount,
      commentCount: session.commentCount,
    };

    // Add optional fields only if defined
    if (session.activityId !== null && session.activityId !== undefined) {
      data.activityId = session.activityId;
    }

    if (session.title !== undefined) {
      data.title = session.title;
    }

    if (session.description !== undefined) {
      data.description = session.description;
    }

    if (session.groupIds && session.groupIds.length > 0) {
      data.groupIds = Array.from(session.groupIds);
    }

    return data;
  }

  /**
   * Convert Firestore Timestamp to Date
   */
  private timestampToDate(timestamp: Timestamp | Date | undefined): Date {
    if (!timestamp) {
      return new Date();
    }

    if (timestamp instanceof Date) {
      return timestamp;
    }

    return timestamp.toDate();
  }

  /**
   * Convert multiple Firestore documents to Session entities (without enrichment)
   */
  toDomainList(docs: DocumentSnapshot[]): Session[] {
    return docs.map(doc => this.toDomain(doc));
  }

  /**
   * Convert multiple Firestore documents to enriched Session entities (with user/activity data)
   * Processes in batches for performance
   */
  async toDomainListEnriched(docs: DocumentSnapshot[]): Promise<Session[]> {
    const sessions: Session[] = [];
    const batchSize = 10;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(doc =>
          this.toDomainEnriched(doc).catch(error => {
            // Failed to enrich session - return null to filter out
            return null;
          })
        )
      );

      // Filter out null values (failed enrichments)
      const validSessions = batchResults.filter(
        (session): session is Session => session !== null
      );
      sessions.push(...validSessions);
    }

    return sessions;
  }
}
