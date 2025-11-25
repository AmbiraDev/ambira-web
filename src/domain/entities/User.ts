/**
 * User Domain Entity
 *
 * Represents a user in the Ambira system with core business logic.
 */

export type ProfileVisibility = 'everyone' | 'followers' | 'private'

export class User {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly name: string,
    public readonly email: string,
    public readonly createdAt: Date,
    public readonly bio?: string,
    public readonly location?: string,
    public readonly profilePicture?: string,
    public readonly followerCount: number = 0,
    public readonly followingCount: number = 0,
    public readonly profileVisibility: ProfileVisibility = 'everyone'
  ) {
    this.validateInvariants()
  }

  /**
   * Validates business rules
   */
  private validateInvariants(): void {
    if (!this.username || this.username.trim().length === 0) {
      throw new Error('Username cannot be empty')
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Name cannot be empty')
    }

    if (!this.email || !this.isValidEmail(this.email)) {
      throw new Error('Valid email is required')
    }

    if (this.followerCount < 0) {
      throw new Error('Follower count cannot be negative')
    }

    if (this.followingCount < 0) {
      throw new Error('Following count cannot be negative')
    }
  }

  /**
   * Simple email validation
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  /**
   * Business Logic: Check if profile is visible to a specific user
   */
  isVisibleTo(viewerId: string | null, isFollower: boolean = false): boolean {
    // Own profile is always visible
    if (viewerId === this.id) {
      return true
    }

    switch (this.profileVisibility) {
      case 'everyone':
        return true
      case 'followers':
        return isFollower
      case 'private':
        return false
      default:
        return false
    }
  }

  /**
   * Business Logic: Get display name (name or username)
   */
  getDisplayName(): string {
    return this.name || `@${this.username}`
  }

  /**
   * Business Logic: Get initials for avatar
   */
  getInitials(): string {
    return this.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  /**
   * Factory: Create user with updated follower count
   */
  withFollowerCount(count: number): User {
    if (count < 0) {
      throw new Error('Follower count cannot be negative')
    }

    return new User(
      this.id,
      this.username,
      this.name,
      this.email,
      this.createdAt,
      this.bio,
      this.location,
      this.profilePicture,
      count,
      this.followingCount,
      this.profileVisibility
    )
  }

  /**
   * Factory: Create user with updated following count
   */
  withFollowingCount(count: number): User {
    if (count < 0) {
      throw new Error('Following count cannot be negative')
    }

    return new User(
      this.id,
      this.username,
      this.name,
      this.email,
      this.createdAt,
      this.bio,
      this.location,
      this.profilePicture,
      this.followerCount,
      count,
      this.profileVisibility
    )
  }

  /**
   * Convert to plain object
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      username: this.username,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt.toISOString(),
      bio: this.bio,
      location: this.location,
      profilePicture: this.profilePicture,
      followerCount: this.followerCount,
      followingCount: this.followingCount,
      profileVisibility: this.profileVisibility,
    }
  }
}
