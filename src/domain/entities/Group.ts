/**
 * Group Domain Entity
 *
 * Represents a group in the Focumo system with its core business logic.
 * This entity is independent of infrastructure concerns (database, API, etc.)
 */

export type GroupCategory = 'work' | 'study' | 'side-project' | 'learning'
export type GroupPrivacy = 'public' | 'approval-required'

export class Group {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly category: GroupCategory,
    public readonly privacy: GroupPrivacy,
    public readonly memberIds: readonly string[],
    public readonly adminUserIds: readonly string[],
    public readonly createdByUserId: string,
    public readonly createdAt: Date,
    public readonly location?: string,
    public readonly imageUrl?: string,
    public readonly memberCount?: number
  ) {
    this.validateInvariants()
  }

  /**
   * Validates business rules that must always be true
   */
  private validateInvariants(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Group name cannot be empty')
    }

    if (this.memberIds.length === 0) {
      throw new Error('Group must have at least one member')
    }

    if (this.adminUserIds.length === 0) {
      throw new Error('Group must have at least one admin')
    }

    // Creator must be an admin and member
    if (!this.adminUserIds.includes(this.createdByUserId)) {
      throw new Error('Group creator must be an admin')
    }

    if (!this.memberIds.includes(this.createdByUserId)) {
      throw new Error('Group creator must be a member')
    }
  }

  /**
   * Business Logic: Check if user is a member
   */
  isMember(userId: string): boolean {
    return this.memberIds.includes(userId)
  }

  /**
   * Business Logic: Check if user is an admin
   */
  isAdmin(userId: string): boolean {
    return this.adminUserIds.includes(userId)
  }

  /**
   * Business Logic: Check if user is the owner/creator
   */
  isOwner(userId: string): boolean {
    return this.createdByUserId === userId
  }

  /**
   * Business Logic: Get member count (from cache or array length)
   */
  getMemberCount(): number {
    return this.memberCount ?? this.memberIds.length
  }

  /**
   * Business Logic: Check if user can edit group settings
   */
  canUserEdit(userId: string): boolean {
    return this.isAdmin(userId) || this.isOwner(userId)
  }

  /**
   * Business Logic: Check if user can invite others
   */
  canUserInvite(userId: string): boolean {
    // Members can invite if group is public
    if (this.privacy === 'public' && this.isMember(userId)) {
      return true
    }

    // Otherwise only admins can invite
    return this.isAdmin(userId)
  }

  /**
   * Factory: Create a new Group instance with added member
   * Returns a new immutable Group instance
   */
  withAddedMember(userId: string): Group {
    if (this.isMember(userId)) {
      throw new Error('User is already a member')
    }

    return new Group(
      this.id,
      this.name,
      this.description,
      this.category,
      this.privacy,
      [...this.memberIds, userId],
      this.adminUserIds,
      this.createdByUserId,
      this.createdAt,
      this.location,
      this.imageUrl,
      (this.memberCount ?? this.memberIds.length) + 1
    )
  }

  /**
   * Factory: Create a new Group instance with removed member
   * Returns a new immutable Group instance
   */
  withRemovedMember(userId: string): Group {
    if (!this.isMember(userId)) {
      throw new Error('User is not a member')
    }

    if (this.isOwner(userId)) {
      throw new Error('Cannot remove group owner')
    }

    // Remove from members and admins
    const newMemberIds = this.memberIds.filter((id) => id !== userId)
    const newAdminIds = this.adminUserIds.filter((id) => id !== userId)

    if (newAdminIds.length === 0) {
      throw new Error('Cannot remove last admin')
    }

    return new Group(
      this.id,
      this.name,
      this.description,
      this.category,
      this.privacy,
      newMemberIds,
      newAdminIds,
      this.createdByUserId,
      this.createdAt,
      this.location,
      this.imageUrl,
      (this.memberCount ?? this.memberIds.length) - 1
    )
  }

  /**
   * Factory: Promote member to admin
   */
  withPromotedAdmin(userId: string): Group {
    if (!this.isMember(userId)) {
      throw new Error('User must be a member to become admin')
    }

    if (this.isAdmin(userId)) {
      throw new Error('User is already an admin')
    }

    return new Group(
      this.id,
      this.name,
      this.description,
      this.category,
      this.privacy,
      this.memberIds,
      [...this.adminUserIds, userId],
      this.createdByUserId,
      this.createdAt,
      this.location,
      this.imageUrl,
      this.memberCount
    )
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      privacy: this.privacy,
      memberIds: Array.from(this.memberIds),
      adminUserIds: Array.from(this.adminUserIds),
      createdByUserId: this.createdByUserId,
      createdAt: this.createdAt.toISOString(),
      location: this.location,
      imageUrl: this.imageUrl,
      memberCount: this.getMemberCount(),
    }
  }
}
