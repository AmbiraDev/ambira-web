/**
 * Session Repository
 *
 * Handles all data access for Sessions.
 * Implements the Repository pattern for clean separation between domain and infrastructure.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as limitFn,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Session } from '@/domain/entities/Session';
import { SessionMapper } from '../mappers/SessionMapper';

export class SessionRepository {
  private readonly mapper: SessionMapper;
  private readonly collectionName = 'sessions';

  constructor() {
    this.mapper = new SessionMapper();
  }

  /**
   * Find session by ID
   */
  async findById(sessionId: string): Promise<Session | null> {
    try {
      const docRef = doc(db, this.collectionName, sessionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.mapper.toDomain(docSnap);
    } catch (_error) {
      console.error(`Error finding session ${sessionId}:`, error);
      throw new Error(
        `Failed to find session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find sessions by user ID
   */
  async findByUserId(userId: string, limit: number = 50): Promise<Session[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limitFn(limit)
      );

      const snapshot = await getDocs(q);
      return this.mapper.toDomainListEnriched(snapshot.docs);
    } catch (_error) {
      console.error(`Error finding sessions for user ${userId}:`, error);
      throw new Error(
        `Failed to find sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find sessions by project ID
   */
  async findByProjectId(
    projectId: string,
    limit: number = 50
  ): Promise<Session[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc'),
        limitFn(limit)
      );

      const snapshot = await getDocs(q);
      return this.mapper.toDomainList(snapshot.docs);
    } catch (_error) {
      console.error(`Error finding sessions for project ${projectId}:`, error);
      throw new Error(
        `Failed to find sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find sessions by group ID
   */
  async findByGroupId(groupId: string, limit: number = 50): Promise<Session[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'desc'),
        limitFn(limit)
      );

      const snapshot = await getDocs(q);
      return this.mapper.toDomainListEnriched(snapshot.docs);
    } catch (_error) {
      console.error(`Error finding sessions for group ${groupId}:`, error);
      throw new Error(
        `Failed to find sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find sessions by multiple user IDs (for group leaderboards)
   */
  async findByUserIds(
    userIds: string[],
    options?: {
      groupId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<Session[]> {
    try {
      if (userIds.length === 0) {
        return [];
      }

      // Firestore 'in' queries are limited to 10 items
      // If we have more, we need to batch the requests
      const batchSize = 10;
      const batches: Promise<Session[]>[] = [];

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batchUserIds = userIds.slice(i, i + batchSize);
        const batchPromise = this.fetchSessionBatch(batchUserIds, options);
        batches.push(batchPromise);
      }

      const results = await Promise.all(batches);
      return results.flat();
    } catch (_error) {
      console.error('Error finding sessions by user IDs:', error);
      throw new Error(
        `Failed to find sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Helper method to fetch a batch of sessions (max 10 users)
   */
  private async fetchSessionBatch(
    userIds: string[],
    options?: {
      groupId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<Session[]> {
    let q = query(
      collection(db, this.collectionName),
      where('userId', 'in', userIds)
    );

    // Add optional filters
    if (options?.groupId) {
      q = query(q, where('groupId', '==', options.groupId));
    }

    if (options?.startDate) {
      q = query(
        q,
        where('createdAt', '>=', Timestamp.fromDate(options.startDate))
      );
    }

    if (options?.endDate) {
      q = query(
        q,
        where('createdAt', '<=', Timestamp.fromDate(options.endDate))
      );
    }

    // Add ordering and limit
    q = query(q, orderBy('createdAt', 'desc'));

    if (options?.limit) {
      q = query(q, limitFn(options.limit));
    }

    const snapshot = await getDocs(q);
    return this.mapper.toDomainList(snapshot.docs);
  }

  /**
   * Find public sessions (for feed)
   */
  async findPublic(limit: number = 50): Promise<Session[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('visibility', '==', 'everyone'),
        orderBy('createdAt', 'desc'),
        limitFn(limit)
      );

      const snapshot = await getDocs(q);
      return this.mapper.toDomainList(snapshot.docs);
    } catch (_error) {
      console.error('Error finding public sessions:', error);
      throw new Error(
        `Failed to find public sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Save session (create or update)
   */
  async save(session: Session): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, session.id);
      const data = this.mapper.toFirestore(session);

      await setDoc(docRef, data, { merge: true });
    } catch (_error) {
      console.error(`Error saving session ${session.id}:`, error);
      throw new Error(
        `Failed to save session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update support count
   */
  async updateSupportCount(sessionId: string, delta: number): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, sessionId);
      await updateDoc(docRef, {
        supportCount: increment(delta),
      });
    } catch (_error) {
      console.error(
        `Error updating support count for session ${sessionId}:`,
        error
      );
      throw new Error(
        `Failed to update support count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update comment count
   */
  async updateCommentCount(sessionId: string, delta: number): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, sessionId);
      await updateDoc(docRef, {
        commentCount: increment(delta),
      });
    } catch (_error) {
      console.error(
        `Error updating comment count for session ${sessionId}:`,
        error
      );
      throw new Error(
        `Failed to update comment count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete session
   */
  async delete(sessionId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, sessionId);
      await deleteDoc(docRef);
    } catch (_error) {
      console.error(`Error deleting session ${sessionId}:`, error);
      throw new Error(
        `Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if session exists
   */
  async exists(sessionId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.collectionName, sessionId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (_error) {
      console.error(`Error checking if session ${sessionId} exists:`, error);
      return false;
    }
  }

  /**
   * Get total session count for a user
   */
  async getSessionCount(userId: string): Promise<number> {
    try {
      const sessions = await this.findByUserId(userId, 1000); // Max limit
      return sessions.length;
    } catch (_error) {
      console.error(`Error getting session count for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Get total hours for a user
   */
  async getTotalHours(userId: string): Promise<number> {
    try {
      const sessions = await this.findByUserId(userId, 1000); // Max limit
      const totalSeconds = sessions.reduce(
        (sum, session) => sum + session.duration,
        0
      );
      return totalSeconds / 3600; // Convert to hours
    } catch (_error) {
      console.error(`Error getting total hours for user ${userId}:`, error);
      return 0;
    }
  }
}
