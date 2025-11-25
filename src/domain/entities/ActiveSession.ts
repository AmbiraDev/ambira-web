/**
 * ActiveSession Domain Entity
 *
 * Represents an active timer session that is currently running or paused.
 * Contains business rules for timer state and duration calculations.
 */

export type TimerStatus = 'running' | 'paused'

export class ActiveSession {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly projectId: string,
    public readonly startTime: Date,
    public readonly status: TimerStatus,
    public readonly pausedDuration: number = 0, // Total paused time in seconds
    public readonly lastPausedAt?: Date,
    public readonly activityId?: string | null,
    public readonly title?: string,
    public readonly description?: string
  ) {
    this.validateInvariants()
  }

  /**
   * Validates business rules
   */
  private validateInvariants(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('Active session must have a user ID')
    }

    if (!this.projectId || this.projectId.trim().length === 0) {
      throw new Error('Active session must have a project ID')
    }

    if (this.pausedDuration < 0) {
      throw new Error('Paused duration cannot be negative')
    }

    if (this.status === 'paused' && !this.lastPausedAt) {
      throw new Error('Paused sessions must have lastPausedAt timestamp')
    }

    // Business rule: Max session duration is 24 hours
    const currentDuration = this.getCurrentDuration()
    const MAX_DURATION = 24 * 60 * 60 // 24 hours in seconds

    if (currentDuration > MAX_DURATION) {
      throw new Error('Session duration cannot exceed 24 hours')
    }
  }

  /**
   * Business Logic: Get current elapsed time in seconds
   */
  getCurrentDuration(now: Date = new Date()): number {
    const elapsedMs = now.getTime() - this.startTime.getTime()
    const elapsedSeconds = Math.floor(elapsedMs / 1000)

    // Subtract paused duration
    return Math.max(0, elapsedSeconds - this.pausedDuration)
  }

  /**
   * Business Logic: Get formatted duration (HH:MM:SS)
   */
  getFormattedDuration(now: Date = new Date()): string {
    const totalSeconds = this.getCurrentDuration(now)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  /**
   * Business Logic: Check if session is too old (>24 hours)
   */
  isTooOld(now: Date = new Date()): boolean {
    const ageMs = now.getTime() - this.startTime.getTime()
    const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours
    return ageMs > MAX_AGE_MS
  }

  /**
   * Business Logic: Check if session should be auto-saved
   */
  needsAutoSave(lastAutoSave: Date | null, now: Date = new Date()): boolean {
    if (!lastAutoSave) return true

    const timeSinceLastSave = now.getTime() - lastAutoSave.getTime()
    const AUTO_SAVE_INTERVAL_MS = 30 * 1000 // 30 seconds

    return timeSinceLastSave >= AUTO_SAVE_INTERVAL_MS
  }

  /**
   * Factory: Create paused session
   */
  withPause(pausedAt: Date = new Date()): ActiveSession {
    if (this.status === 'paused') {
      throw new Error('Session is already paused')
    }

    return new ActiveSession(
      this.id,
      this.userId,
      this.projectId,
      this.startTime,
      'paused',
      this.pausedDuration,
      pausedAt,
      this.activityId,
      this.title,
      this.description
    )
  }

  /**
   * Factory: Create resumed session
   */
  withResume(resumedAt: Date = new Date()): ActiveSession {
    if (this.status === 'running') {
      throw new Error('Session is already running')
    }

    if (!this.lastPausedAt) {
      throw new Error('Cannot resume session without lastPausedAt')
    }

    // Calculate additional paused duration
    const pausedMs = resumedAt.getTime() - this.lastPausedAt.getTime()
    const additionalPausedSeconds = Math.floor(pausedMs / 1000)
    const newPausedDuration = this.pausedDuration + additionalPausedSeconds

    return new ActiveSession(
      this.id,
      this.userId,
      this.projectId,
      this.startTime,
      'running',
      newPausedDuration,
      undefined, // Clear lastPausedAt
      this.activityId,
      this.title,
      this.description
    )
  }

  /**
   * Factory: Create session with updated metadata
   */
  withMetadata(title?: string, description?: string): ActiveSession {
    return new ActiveSession(
      this.id,
      this.userId,
      this.projectId,
      this.startTime,
      this.status,
      this.pausedDuration,
      this.lastPausedAt,
      this.activityId,
      title ?? this.title,
      description ?? this.description
    )
  }

  /**
   * Factory: Create session with adjusted start time
   */
  withAdjustedStartTime(newStartTime: Date): ActiveSession {
    return new ActiveSession(
      this.id,
      this.userId,
      this.projectId,
      newStartTime,
      this.status,
      this.pausedDuration,
      this.lastPausedAt,
      this.activityId,
      this.title,
      this.description
    )
  }

  /**
   * Convert to completed Session data
   */
  toCompletedSessionData(endedAt: Date = new Date()): {
    userId: string
    projectId: string
    activityId: string | null
    duration: number
    startTime: Date
    endedAt: Date
    title?: string
    description?: string
  } {
    return {
      userId: this.userId,
      projectId: this.projectId,
      activityId: this.activityId || null,
      duration: this.getCurrentDuration(endedAt),
      startTime: this.startTime,
      endedAt,
      title: this.title,
      description: this.description,
    }
  }

  /**
   * Convert to plain object
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      userId: this.userId,
      projectId: this.projectId,
      startTime: this.startTime.toISOString(),
      status: this.status,
      pausedDuration: this.pausedDuration,
      lastPausedAt: this.lastPausedAt?.toISOString(),
      activityId: this.activityId,
      title: this.title,
      description: this.description,
      currentDuration: this.getCurrentDuration(),
    }
  }
}
