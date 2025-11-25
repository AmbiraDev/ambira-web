/**
 * Feed Service - Application Layer
 *
 * Orchestrates feed workflows and business logic.
 * Coordinates between repositories to build different feed types.
 */

import { FeedRepository, FeedResult } from '@/infrastructure/firebase/repositories/FeedRepository'
import { SocialGraphRepository } from '@/infrastructure/firebase/repositories/SocialGraphRepository'
import { SessionRepository } from '@/infrastructure/firebase/repositories/SessionRepository'

export type FeedType =
  | 'following'
  | 'trending'
  | 'all'
  | 'user'
  | 'group'
  | 'recent'
  | 'group-members-unfollowed'

export interface FeedFilters {
  type?: FeedType
  userId?: string
  groupId?: string
}

export interface FeedOptions {
  limit?: number
  cursor?: string
}

export class FeedService {
  private readonly feedRepo: FeedRepository
  private readonly socialGraphRepo: SocialGraphRepository
  private readonly sessionRepo: SessionRepository

  constructor() {
    this.feedRepo = new FeedRepository()
    this.socialGraphRepo = new SocialGraphRepository()
    this.sessionRepo = new SessionRepository()
  }

  /**
   * Get feed based on filters
   */
  async getFeed(
    currentUserId: string,
    filters: FeedFilters = {},
    options: FeedOptions = {}
  ): Promise<FeedResult> {
    const { type = 'following' } = filters
    const { limit = 20, cursor } = options

    switch (type) {
      case 'following':
        return this.getFollowingFeed(currentUserId, limit, cursor)

      case 'trending':
      case 'all':
      case 'recent':
        return this.getPublicFeed(limit, cursor)

      case 'user':
        if (!filters.userId) {
          throw new Error('userId required for user feed')
        }
        return this.getUserFeed(filters.userId, limit, cursor)

      case 'group':
        if (!filters.groupId) {
          throw new Error('groupId required for group feed')
        }
        return this.getGroupFeed(filters.groupId, limit, cursor)

      case 'group-members-unfollowed':
        return this.getGroupMembersUnfollowedFeed(currentUserId, limit, cursor)

      default:
        throw new Error(`Unknown feed type: ${type}`)
    }
  }

  /**
   * Get feed from users the current user is following
   * Note: Always includes the current user's own posts (like Instagram)
   */
  private async getFollowingFeed(
    currentUserId: string,
    limit: number,
    cursor?: string
  ): Promise<FeedResult> {
    // Get list of following
    const followingIds = await this.socialGraphRepo.getFollowingIds(currentUserId)

    // Always include current user's own posts in their following feed
    // This ensures newly posted sessions appear immediately (like Instagram)
    const userIdsToInclude = [...followingIds, currentUserId]

    // Remove duplicates in case user is somehow following themselves
    const uniqueUserIds = Array.from(new Set(userIdsToInclude))

    // Fetch sessions from followed users + current user
    return this.feedRepo.getFeedForFollowing(uniqueUserIds, limit, cursor)
  }

  /**
   * Get public feed (all sessions with everyone visibility)
   */
  private async getPublicFeed(limit: number, cursor?: string): Promise<FeedResult> {
    return this.feedRepo.getPublicFeed(limit, cursor)
  }

  /**
   * Get feed for a specific user
   */
  private async getUserFeed(userId: string, limit: number, _cursor?: string): Promise<FeedResult> {
    // Use SessionRepository's findByUserId method
    const sessions = await this.sessionRepo.findByUserId(userId, limit)

    // For now, we don't have pagination cursor support in SessionRepository
    // This would need to be enhanced for proper pagination
    return {
      sessions,
      hasMore: sessions.length >= limit,
      nextCursor: sessions.length >= limit ? sessions[sessions.length - 1]?.id : undefined,
    }
  }

  /**
   * Get feed for a specific group
   */
  private async getGroupFeed(
    groupId: string,
    limit: number,
    _cursor?: string
  ): Promise<FeedResult> {
    // Use SessionRepository's findByGroupId method
    const sessions = await this.sessionRepo.findByGroupId(groupId, limit)

    return {
      sessions,
      hasMore: sessions.length >= limit,
      nextCursor: sessions.length >= limit ? sessions[sessions.length - 1]?.id : undefined,
    }
  }

  /**
   * Get feed from group members who are not followed
   */
  private async getGroupMembersUnfollowedFeed(
    currentUserId: string,
    limit: number,
    cursor?: string
  ): Promise<FeedResult> {
    // Get all group member IDs
    const groupMemberIds = await this.socialGraphRepo.getGroupMemberIds(currentUserId)

    if (groupMemberIds.length === 0) {
      return { sessions: [], hasMore: false }
    }

    // Get following IDs
    const followingIds = await this.socialGraphRepo.getFollowingIds(currentUserId)

    // Fetch sessions from unfollowed group members
    return this.feedRepo.getFeedForGroupMembersUnfollowed(
      groupMemberIds,
      followingIds,
      limit,
      cursor
    )
  }

  /**
   * Refresh feed (invalidate cache - handled by React Query in hooks layer)
   */
  async refreshFeed(currentUserId: string, filters: FeedFilters = {}): Promise<FeedResult> {
    // Simply re-fetch with no cursor
    return this.getFeed(currentUserId, filters, { limit: 20 })
  }
}
