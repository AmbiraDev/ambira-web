/**
 * Group Service - Application Layer
 *
 * Orchestrates business workflows for groups.
 * Coordinates between repositories and domain services.
 */

import { Group } from '@/domain/entities/Group';
import { GroupRepository } from '@/infrastructure/firebase/repositories/GroupRepository';
import { UserRepository } from '@/infrastructure/firebase/repositories/UserRepository';
import { SessionRepository } from '@/infrastructure/firebase/repositories/SessionRepository';
import { LeaderboardCalculator } from '../domain/LeaderboardCalculator';
import {
  LeaderboardEntry,
  TimePeriod,
  GroupStats,
} from '../types/groups.types';
import {
  validateOrThrow,
  CreateGroupSchema,
  GroupMembershipSchema,
} from '@/lib/validation';

/**
 * Note: For now, we're using direct instantiation.
 * In the future, we can add DI (tsyringe) for better testability.
 */
export class GroupService {
  private readonly groupRepo: GroupRepository;
  private readonly userRepo: UserRepository;
  private readonly sessionRepo: SessionRepository;
  private readonly leaderboardCalc: LeaderboardCalculator;

  constructor() {
    this.groupRepo = new GroupRepository();
    this.userRepo = new UserRepository();
    this.sessionRepo = new SessionRepository();
    this.leaderboardCalc = new LeaderboardCalculator();
  }

  /**
   * Get group details by ID
   */
  async getGroupDetails(groupId: string): Promise<Group | null> {
    return this.groupRepo.findById(groupId);
  }

  /**
   * Get groups for a user
   */
  async getUserGroups(userId: string, limit?: number): Promise<Group[]> {
    return this.groupRepo.findByMemberId(userId, limit);
  }

  /**
   * Get public groups
   */
  async getPublicGroups(limit?: number): Promise<Group[]> {
    return this.groupRepo.findPublic(limit);
  }

  /**
   * Join a group
   */
  async joinGroup(data: unknown, userId: string): Promise<void> {
    // Validate input data
    const validated = validateOrThrow(GroupMembershipSchema, data);
    const groupId = validated.groupId;

    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Business rule: Check if already a member
    if (group.isMember(userId)) {
      throw new Error('Already a member of this group');
    }

    // Create updated group with new member
    const updatedGroup = group.withAddedMember(userId);

    // Save to repository
    await this.groupRepo.save(updatedGroup);
  }

  /**
   * Leave a group
   */
  async leaveGroup(data: unknown, userId: string): Promise<void> {
    // Validate input data
    const validated = validateOrThrow(GroupMembershipSchema, data);
    const groupId = validated.groupId;

    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Business rule: Check if member
    if (!group.isMember(userId)) {
      throw new Error('Not a member of this group');
    }

    // Business rule: Owner cannot leave
    if (group.isOwner(userId)) {
      throw new Error(
        'Group owner cannot leave. Please delete the group or transfer ownership first.'
      );
    }

    // Create updated group with member removed
    const updatedGroup = group.withRemovedMember(userId);

    // Save to repository
    await this.groupRepo.save(updatedGroup);
  }

  /**
   * Get group leaderboard
   */
  async getGroupLeaderboard(
    groupId: string,
    period: TimePeriod
  ): Promise<LeaderboardEntry[]> {
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Fetch all members (convert readonly array to mutable)
    const memberIds = Array.from(group.memberIds);
    const users = await this.userRepo.findByIds(memberIds);

    // Calculate date range based on period
    const dateRange = this.getDateRangeForPeriod(period);

    // Fetch sessions for all group members in the date range
    const sessions = await this.sessionRepo.findByUserIds(memberIds, {
      groupId: groupId,
      startDate: dateRange.start,
      endDate: dateRange.end,
    });

    // Calculate leaderboard using domain service
    return this.leaderboardCalc.calculate(users, sessions, period);
  }

  /**
   * Helper method to get date range for a time period
   */
  private getDateRangeForPeriod(period: TimePeriod): {
    start: Date;
    end: Date;
  } {
    const now = new Date();
    const end = now;
    let start: Date;

    switch (period) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;

      case 'week':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;

      case 'month':
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        break;

      case 'all-time':
        start = new Date(0); // Beginning of time
        break;

      default:
        start = new Date(now);
        start.setDate(start.getDate() - 7);
    }

    return { start, end };
  }

  /**
   * Get group stats
   */
  async getGroupStats(groupId: string): Promise<GroupStats> {
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Fetch all sessions for this group
    const allSessions = await this.sessionRepo.findByGroupId(groupId, 1000);

    // Calculate total hours
    const totalSeconds = allSessions.reduce(
      (sum, session) => sum + session.duration,
      0
    );
    const totalHours = totalSeconds / 3600;

    // Get sessions from the last week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSessions = allSessions.filter(s => s.createdAt >= weekAgo);

    // Count unique active members this week
    const activeMemberIds = new Set(recentSessions.map(s => s.userId));

    return {
      memberCount: group.getMemberCount(),
      totalSessions: allSessions.length,
      totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
      activeMembersThisWeek: activeMemberIds.size,
    };
  }

  /**
   * Check if user can join group
   */
  async canUserJoin(groupId: string, userId: string): Promise<boolean> {
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      return false;
    }

    // Cannot join if already a member
    if (group.isMember(userId)) {
      return false;
    }

    // Can join if group is public
    if (group.privacy === 'public') {
      return true;
    }

    // For approval-required groups, would need invitation logic
    return false;
  }

  /**
   * Check if user can invite to group
   */
  async canUserInvite(groupId: string, userId: string): Promise<boolean> {
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      return false;
    }

    return group.canUserInvite(userId);
  }

  /**
   * Create a new group
   */
  async createGroup(data: unknown, userId: string): Promise<Group> {
    // Validate input data
    const validated = validateOrThrow(CreateGroupSchema, data);

    // Generate ID for the group
    const groupId = this.generateGroupId();

    // Map 'other' category to 'learning' for domain compatibility
    const categoryForDomain =
      validated.category === 'other' ? 'learning' : validated.category;

    // Create domain group with creator as both member and admin
    const group = new Group(
      groupId,
      validated.name,
      validated.description,
      categoryForDomain as any,
      validated.privacySetting,
      [userId], // Creator is first member
      [userId], // Creator is first admin
      userId,
      new Date(),
      validated.location,
      validated.imageUrl
    );

    // Save to repository
    await this.groupRepo.save(group);

    return group;
  }

  /**
   * Generate a unique group ID
   */
  private generateGroupId(): string {
    // Simple ID generation using timestamp + random suffix
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
