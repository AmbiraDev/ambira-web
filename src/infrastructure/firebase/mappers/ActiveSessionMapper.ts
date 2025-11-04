/**
 * ActiveSession Mapper
 *
 * Converts between Firestore documents and ActiveSession domain entities.
 */

import { DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { ActiveSession, TimerStatus } from '@/domain/entities/ActiveSession';

export class ActiveSessionMapper {
  /**
   * Convert Firestore document to ActiveSession domain entity
   */
  toDomain(doc: DocumentSnapshot): ActiveSession {
    const data = doc.data();
    if (!data) {
      throw new Error(`ActiveSession document ${doc.id} does not exist`);
    }

    return new ActiveSession(
      doc.id,
      data.userId,
      data.projectId,
      this.timestampToDate(data.startTime),
      (data.status as TimerStatus) || 'running',
      data.pausedDuration || 0,
      data.lastPausedAt ? this.timestampToDate(data.lastPausedAt) : undefined,
      data.activityId,
      data.title,
      data.description
    );
  }

  /**
   * Convert ActiveSession domain entity to Firestore document data
   */
  toFirestore(session: ActiveSession): Record<string, unknown> {
    const data: Record<string, unknown> = {
      userId: session.userId,
      projectId: session.projectId,
      startTime: Timestamp.fromDate(session.startTime),
      status: session.status,
      pausedDuration: session.pausedDuration,
    };

    // Add optional fields only if defined
    if (session.lastPausedAt) {
      data.lastPausedAt = Timestamp.fromDate(session.lastPausedAt);
    }

    if (session.activityId !== null && session.activityId !== undefined) {
      data.activityId = session.activityId;
    }

    if (session.title !== undefined) {
      data.title = session.title;
    }

    if (session.description !== undefined) {
      data.description = session.description;
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
}
