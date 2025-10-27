/**
 * ActiveSession Repository
 *
 * Handles data access for active timer sessions.
 * Stores in users/{userId}/activeSession subcollection for better security.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  limit as limitFn,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ActiveSession } from '@/domain/entities/ActiveSession';
import { ActiveSessionMapper } from '../mappers/ActiveSessionMapper';

export class ActiveSessionRepository {
  private readonly mapper: ActiveSessionMapper;

  constructor() {
    this.mapper = new ActiveSessionMapper();
  }

  /**
   * Get active session for a user
   */
  async getActiveSession(userId: string): Promise<ActiveSession | null> {
    try {
      // Check subcollection: users/{userId}/activeSession
      const activeSessionRef = collection(db, `users/${userId}/activeSession`);
      const q = query(activeSessionRef, limitFn(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return null;
      }
      return this.mapper.toDomain(doc);
    } catch (_error) {
      console.error(`Error getting active session for user ${userId}:`, error);
      throw new Error(
        `Failed to get active session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Save active session
   */
  async saveActiveSession(session: ActiveSession): Promise<void> {
    try {
      const docRef = doc(
        db,
        `users/${session.userId}/activeSession`,
        session.id
      );
      const data = this.mapper.toFirestore(session);

      await setDoc(docRef, data);
    } catch (_error) {
      console.error(`Error saving active session ${session.id}:`, error);
      throw new Error(
        `Failed to save active session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete active session
   */
  async deleteActiveSession(userId: string, sessionId: string): Promise<void> {
    try {
      const docRef = doc(db, `users/${userId}/activeSession`, sessionId);
      await deleteDoc(docRef);
    } catch (_error) {
      console.error(`Error deleting active session ${sessionId}:`, error);
      throw new Error(
        `Failed to delete active session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clear all active sessions for a user (cleanup)
   */
  async clearActiveSession(userId: string): Promise<void> {
    try {
      const activeSessionRef = collection(db, `users/${userId}/activeSession`);
      const snapshot = await getDocs(activeSessionRef);

      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));

      await Promise.all(deletePromises);
    } catch (_error) {
      console.error(
        `Error clearing active sessions for user ${userId}:`,
        error
      );
      throw new Error(
        `Failed to clear active sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if user has an active session
   */
  async hasActiveSession(userId: string): Promise<boolean> {
    try {
      const session = await this.getActiveSession(userId);
      return session !== null;
    } catch (_error) {
      console.error(`Error checking active session for user ${userId}:`, error);
      return false;
    }
  }
}
