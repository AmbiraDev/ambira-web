/**
 * Timer Service - Application Layer
 *
 * Orchestrates timer workflows and business logic.
 * Coordinates between repositories to manage active sessions.
 */

import { ActiveSession } from '@/domain/entities/ActiveSession';
import { Session } from '@/domain/entities/Session';
import { ActiveSessionRepository } from '@/infrastructure/firebase/repositories/ActiveSessionRepository';
import { SessionRepository } from '@/infrastructure/firebase/repositories/SessionRepository';

export interface StartTimerData {
  userId: string;
  projectId: string;
  activityId?: string | null;
  title?: string;
  description?: string;
}

export interface CompleteTimerData {
  title?: string;
  description?: string;
  visibility?: 'everyone' | 'followers' | 'private';
  groupIds?: string[];
}

export class TimerService {
  private readonly activeSessionRepo: ActiveSessionRepository;
  private readonly sessionRepo: SessionRepository;

  constructor() {
    this.activeSessionRepo = new ActiveSessionRepository();
    this.sessionRepo = new SessionRepository();
  }

  /**
   * Start a new timer
   */
  async startTimer(data: StartTimerData): Promise<ActiveSession> {
    // Business rule: Can't start a timer if one is already active
    const existingSession = await this.activeSessionRepo.getActiveSession(data.userId);
    if (existingSession) {
      throw new Error('An active timer already exists. Please stop or complete the current session first.');
    }

    // Create new active session
    const sessionId = this.generateSessionId();
    const activeSession = new ActiveSession(
      sessionId,
      data.userId,
      data.projectId,
      new Date(),
      'running',
      0,
      undefined,
      data.activityId,
      data.title,
      data.description
    );

    // Save to repository
    await this.activeSessionRepo.saveActiveSession(activeSession);

    return activeSession;
  }

  /**
   * Get current active session
   */
  async getActiveSession(userId: string): Promise<ActiveSession | null> {
    const session = await this.activeSessionRepo.getActiveSession(userId);

    // Business rule: If session is too old (>24 hours), auto-complete it
    if (session && session.isTooOld()) {
      await this.autoCompleteSession(session);
      return null;
    }

    return session;
  }

  /**
   * Pause active timer
   */
  async pauseTimer(userId: string): Promise<ActiveSession> {
    const activeSession = await this.activeSessionRepo.getActiveSession(userId);

    if (!activeSession) {
      throw new Error('No active timer to pause');
    }

    if (activeSession.status === 'paused') {
      throw new Error('Timer is already paused');
    }

    // Create paused session
    const pausedSession = activeSession.withPause();

    // Save updated session
    await this.activeSessionRepo.saveActiveSession(pausedSession);

    return pausedSession;
  }

  /**
   * Resume paused timer
   */
  async resumeTimer(userId: string): Promise<ActiveSession> {
    const activeSession = await this.activeSessionRepo.getActiveSession(userId);

    if (!activeSession) {
      throw new Error('No active timer to resume');
    }

    if (activeSession.status === 'running') {
      throw new Error('Timer is already running');
    }

    // Create resumed session
    const resumedSession = activeSession.withResume();

    // Save updated session
    await this.activeSessionRepo.saveActiveSession(resumedSession);

    return resumedSession;
  }

  /**
   * Complete and save timer as session
   */
  async completeTimer(
    userId: string,
    data: CompleteTimerData = {}
  ): Promise<Session> {
    const activeSession = await this.activeSessionRepo.getActiveSession(userId);

    if (!activeSession) {
      throw new Error('No active timer to complete');
    }

    // Convert to completed session data
    const completedData = activeSession.toCompletedSessionData();

    // Create Session entity
    const session = new Session(
      activeSession.id,
      completedData.userId,
      completedData.projectId,
      completedData.activityId,
      completedData.duration,
      completedData.startTime,
      data.title || completedData.title,
      data.description || completedData.description,
      data.visibility || 'everyone',
      0, // supportCount
      0, // commentCount
      data.groupIds || []
    );

    // Save as completed session
    await this.sessionRepo.save(session);

    // Delete active session
    await this.activeSessionRepo.deleteActiveSession(userId, activeSession.id);

    return session;
  }

  /**
   * Stop timer without saving (discard)
   */
  async stopTimer(userId: string): Promise<void> {
    const activeSession = await this.activeSessionRepo.getActiveSession(userId);

    if (!activeSession) {
      throw new Error('No active timer to stop');
    }

    // Delete active session
    await this.activeSessionRepo.deleteActiveSession(userId, activeSession.id);
  }

  /**
   * Update timer metadata
   */
  async updateTimerMetadata(
    userId: string,
    title?: string,
    description?: string
  ): Promise<ActiveSession> {
    const activeSession = await this.activeSessionRepo.getActiveSession(userId);

    if (!activeSession) {
      throw new Error('No active timer to update');
    }

    // Create updated session
    const updatedSession = activeSession.withMetadata(title, description);

    // Save updated session
    await this.activeSessionRepo.saveActiveSession(updatedSession);

    return updatedSession;
  }

  /**
   * Auto-save active session (periodic persistence)
   */
  async autoSaveSession(userId: string): Promise<void> {
    const activeSession = await this.activeSessionRepo.getActiveSession(userId);

    if (!activeSession) {
      return; // Nothing to save
    }

    // Simply re-save the session (updates timestamp)
    await this.activeSessionRepo.saveActiveSession(activeSession);
  }

  /**
   * Auto-complete stale session (internal helper)
   */
  private async autoCompleteSession(session: ActiveSession): Promise<void> {
    try {
      // Complete session with default visibility
      const completedData = session.toCompletedSessionData();

      const completedSession = new Session(
        session.id,
        completedData.userId,
        completedData.projectId,
        completedData.activityId,
        completedData.duration,
        completedData.startTime,
        completedData.title,
        completedData.description,
        'everyone',
        0,
        0,
        []
      );

      await this.sessionRepo.save(completedSession);
      await this.activeSessionRepo.deleteActiveSession(session.userId, session.id);
    } catch (error) {
      console.error('Error auto-completing stale session:', error);
      // Don't throw - this is a background cleanup operation
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
