/**
 * Session Mapper
 *
 * Converts between Firestore documents and Session domain entities.
 */

import { DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { Session, SessionVisibility } from '@/domain/entities/Session';

export class SessionMapper {
  /**
   * Convert Firestore document to Session domain entity
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
      commentCount: session.commentCount
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
   * Convert multiple Firestore documents to Session entities
   */
  toDomainList(docs: DocumentSnapshot[]): Session[] {
    return docs.map(doc => this.toDomain(doc));
  }
}
