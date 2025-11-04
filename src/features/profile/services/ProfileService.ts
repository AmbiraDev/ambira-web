/**
 * Profile Service - Application Layer
 *
 * Orchestrates profile-related workflows.
 * Coordinates between repositories and domain services.
 */

import { User } from '@/domain/entities/User';
import { Session } from '@/domain/entities/Session';
import { UserRepository } from '@/infrastructure/firebase/repositories/UserRepository';
import { SessionRepository } from '@/infrastructure/firebase/repositories/SessionRepository';
import { SocialGraphRepository } from '@/infrastructure/firebase/repositories/SocialGraphRepository';
import {
  ProfileStatsCalculator,
  TimePeriod,
  ChartDataPoint,
  ProfileStats,
} from '../domain/ProfileStatsCalculator';

export class ProfileService {
  private readonly userRepo: UserRepository;
  private readonly sessionRepo: SessionRepository;
  private readonly socialGraphRepo: SocialGraphRepository;
  private readonly statsCalc: ProfileStatsCalculator;

  constructor() {
    this.userRepo = new UserRepository();
    this.sessionRepo = new SessionRepository();
    this.socialGraphRepo = new SocialGraphRepository();
    this.statsCalc = new ProfileStatsCalculator();
  }

  /**
   * Get user profile by username
   */
  async getProfileByUsername(username: string): Promise<User | null> {
    return this.userRepo.findByUsername(username);
  }

  /**
   * Get user profile by ID
   */
  async getProfileById(userId: string): Promise<User | null> {
    return this.userRepo.findById(userId);
  }

  /**
   * Get user's sessions
   */
  async getUserSessions(
    userId: string,
    limit: number = 50
  ): Promise<Session[]> {
    return this.sessionRepo.findByUserId(userId, limit);
  }

  /**
   * Get chart data for profile
   */
  async getChartData(
    userId: string,
    period: TimePeriod,
    activityId: string = 'all'
  ): Promise<ChartDataPoint[]> {
    // Fetch user's sessions
    const sessions = await this.sessionRepo.findByUserId(userId, 1000);

    // Filter by activity if specified
    const filteredSessions = this.statsCalc.filterSessionsByActivity(
      sessions,
      activityId
    );

    // Calculate chart data
    return this.statsCalc.calculateChartData(filteredSessions, period);
  }

  /**
   * Get profile statistics
   */
  async getProfileStats(userId: string): Promise<ProfileStats> {
    const sessions = await this.sessionRepo.findByUserId(userId, 1000);
    return this.statsCalc.calculateStats(sessions);
  }

  /**
   * Get user's followers
   */
  async getFollowers(userId: string): Promise<string[]> {
    return this.socialGraphRepo.getFollowerIds(userId);
  }

  /**
   * Get user's following
   */
  async getFollowing(userId: string): Promise<string[]> {
    return this.socialGraphRepo.getFollowingIds(userId);
  }

  /**
   * Check if current user follows target user
   */
  async isFollowing(
    currentUserId: string,
    targetUserId: string
  ): Promise<boolean> {
    return this.socialGraphRepo.isFollowing(currentUserId, targetUserId);
  }

  /**
   * Follow a user
   */
  async followUser(currentUserId: string, targetUserId: string): Promise<void> {
    // Business rule: Can't follow yourself
    if (currentUserId === targetUserId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if already following
    const isAlreadyFollowing = await this.socialGraphRepo.isFollowing(
      currentUserId,
      targetUserId
    );
    if (isAlreadyFollowing) {
      throw new Error('Already following this user');
    }

    // Note: The actual follow operation would need a FollowRepository
    // For now, this is a placeholder showing the structure
    // In reality, you'd create a Follow entity and use a FollowRepository
    throw new Error(
      'Follow operation not yet implemented in clean architecture'
    );
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(
    currentUserId: string,
    targetUserId: string
  ): Promise<void> {
    // Business rule: Can't unfollow yourself
    if (currentUserId === targetUserId) {
      throw new Error('Cannot unfollow yourself');
    }

    // Check if actually following
    const isFollowing = await this.socialGraphRepo.isFollowing(
      currentUserId,
      targetUserId
    );
    if (!isFollowing) {
      throw new Error('Not following this user');
    }

    // Note: The actual unfollow operation would need a FollowRepository
    // For now, this is a placeholder showing the structure
    throw new Error(
      'Unfollow operation not yet implemented in clean architecture'
    );
  }

  /**
   * Check if profile is visible to viewer
   */
  async canViewProfile(
    profileUser: User,
    viewerId: string | null
  ): Promise<boolean> {
    // Own profile is always visible
    if (viewerId === profileUser.id) {
      return true;
    }

    // Check visibility based on profile settings
    switch (profileUser.profileVisibility) {
      case 'everyone':
        return true;

      case 'followers':
        if (!viewerId) return false;
        return this.socialGraphRepo.isFollowing(viewerId, profileUser.id);

      case 'private':
        return false;

      default:
        return false;
    }
  }

  /**
   * Get top activities for a user
   */
  async getTopActivities(
    userId: string,
    limit: number = 5
  ): Promise<Array<{ id: string; hours: number; sessions: number }>> {
    const sessions = await this.sessionRepo.findByUserId(userId, 1000);
    return this.statsCalc.getTopActivities(sessions, limit);
  }
}
