/**
 * Session Service - Business Logic Layer
 *
 * Orchestrates business workflows for sessions.
 * No React dependencies - pure TypeScript for testability.
 */

import { firebaseApi } from '@/lib/api';
import { Session, SessionWithDetails, SessionFilters } from '@/types';

export class SessionService {
  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    try {
      return await firebaseApi.session.getSession(sessionId);
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Get session with populated user and activity details
   */
  async getSessionWithDetails(sessionId: string): Promise<SessionWithDetails | null> {
    try {
      return await firebaseApi.session.getSessionWithDetails(sessionId);
    } catch (error) {
      console.error('Error getting session with details:', error);
      return null;
    }
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(
    userId: string,
    filters?: SessionFilters
  ): Promise<Session[]> {
    try {
      const result = await firebaseApi.session.getSessions(1, 100, {
        userId,
        ...filters,
      });
      return result.sessions;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    return firebaseApi.session.deleteSession(sessionId);
  }

  /**
   * Support (like) a session
   */
  async supportSession(sessionId: string): Promise<void> {
    return firebaseApi.post.supportSession(sessionId);
  }

  /**
   * Remove support from a session
   */
  async unsupportSession(sessionId: string): Promise<void> {
    return firebaseApi.post.removeSupportFromSession(sessionId);
  }

  /**
   * Update session
   */
  async updateSession(sessionId: string, data: Partial<Session>): Promise<void> {
    return firebaseApi.session.updateSession(sessionId, data);
  }
}

export interface SupportSessionData {
  sessionId: string;
  action: 'support' | 'unsupport';
}
