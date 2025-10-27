/**
 * Session Domain Entity
 *
 * Represents a work/study session in the Ambira system.
 * Sessions ARE the primary content type (like Strava activities).
 */

export type SessionVisibility = 'everyone' | 'followers' | 'private';

// User data for populated sessions
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  username: string;
  bio?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Activity data for populated sessions
export interface SessionActivity {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  status: 'active' | 'completed' | 'archived';
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Session {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly projectId: string,
    public readonly activityId: string | null,
    public readonly duration: number, // in seconds
    public readonly createdAt: Date,
    public readonly title?: string,
    public readonly description?: string,
    public readonly visibility: SessionVisibility = 'everyone',
    public readonly supportCount: number = 0,
    public readonly commentCount: number = 0,
    public readonly groupIds: readonly string[] = [],
    // Enriched data (populated for feed/display)
    public readonly user?: SessionUser,
    public readonly activity?: SessionActivity,
    public readonly project?: SessionActivity, // Backwards compatibility
    public readonly images?: readonly string[],
    public readonly isSupported?: boolean,
    public readonly supportedBy?: readonly string[],
    public readonly allowComments?: boolean,
    public readonly updatedAt?: Date,
    public readonly startTime?: Date,
    public readonly tags?: readonly string[],
    public readonly showStartTime?: boolean,
    public readonly howFelt?: string,
    public readonly privateNotes?: string,
    public readonly isArchived?: boolean
  ) {
    this.validateInvariants();
  }

  /**
   * Validates business rules
   */
  private validateInvariants(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('Session must have a user ID');
    }

    if (!this.projectId || this.projectId.trim().length === 0) {
      throw new Error('Session must have a project ID');
    }

    if (this.duration < 0) {
      throw new Error('Duration cannot be negative');
    }

    if (this.supportCount < 0) {
      throw new Error('Support count cannot be negative');
    }

    if (this.commentCount < 0) {
      throw new Error('Comment count cannot be negative');
    }
  }

  /**
   * Business Logic: Get duration in hours
   */
  getDurationInHours(): number {
    return this.duration / 3600;
  }

  /**
   * Business Logic: Get duration in minutes
   */
  getDurationInMinutes(): number {
    return this.duration / 60;
  }

  /**
   * Business Logic: Format duration as human-readable string
   */
  getFormattedDuration(): string {
    const hours = Math.floor(this.duration / 3600);
    const minutes = Math.floor((this.duration % 3600) / 60);

    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    return `${minutes}m`;
  }

  /**
   * Business Logic: Check if session is visible to a user
   */
  isVisibleTo(viewerId: string | null, isFollower: boolean = false): boolean {
    // Own sessions are always visible
    if (viewerId === this.userId) {
      return true;
    }

    switch (this.visibility) {
      case 'everyone':
        return true;
      case 'followers':
        return isFollower;
      case 'private':
        return false;
      default:
        return false;
    }
  }

  /**
   * Business Logic: Check if session is long (>1 hour)
   */
  isLongSession(): boolean {
    return this.duration >= 3600;
  }

  /**
   * Business Logic: Check if session belongs to a group
   */
  belongsToGroup(groupId: string): boolean {
    return this.groupIds.includes(groupId);
  }

  /**
   * Factory: Create session with incremented support count
   */
  withIncrementedSupport(): Session {
    return new Session(
      this.id,
      this.userId,
      this.projectId,
      this.activityId,
      this.duration,
      this.createdAt,
      this.title,
      this.description,
      this.visibility,
      this.supportCount + 1,
      this.commentCount,
      this.groupIds
    );
  }

  /**
   * Factory: Create session with decremented support count
   */
  withDecrementedSupport(): Session {
    if (this.supportCount === 0) {
      throw new Error('Support count cannot be negative');
    }

    return new Session(
      this.id,
      this.userId,
      this.projectId,
      this.activityId,
      this.duration,
      this.createdAt,
      this.title,
      this.description,
      this.visibility,
      this.supportCount - 1,
      this.commentCount,
      this.groupIds
    );
  }

  /**
   * Factory: Create session with incremented comment count
   */
  withIncrementedComments(): Session {
    return new Session(
      this.id,
      this.userId,
      this.projectId,
      this.activityId,
      this.duration,
      this.createdAt,
      this.title,
      this.description,
      this.visibility,
      this.supportCount,
      this.commentCount + 1,
      this.groupIds
    );
  }

  /**
   * Convert to plain object
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      userId: this.userId,
      projectId: this.projectId,
      activityId: this.activityId,
      duration: this.duration,
      createdAt: this.createdAt.toISOString(),
      title: this.title,
      description: this.description,
      visibility: this.visibility,
      supportCount: this.supportCount,
      commentCount: this.commentCount,
      groupIds: Array.from(this.groupIds),
    };
  }
}
