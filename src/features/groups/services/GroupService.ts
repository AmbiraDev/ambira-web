/**
 * Group Service - Application Layer
 *
 * Orchestrates business workflows for groups.
 * Coordinates between repositories and domain services.
 */

import { Group } from '@/domain/entities/Group';
import { GroupRepository } from '@/infrastructure/firebase/repositories/GroupRepository';
import { LeaderboardCalculator } from '../domain/LeaderboardCalculator';
import { LeaderboardEntry, TimePeriod, GroupStats } from '../types/groups.types';

/**
 * Note: For now, we're using direct instantiation.
 * In the future, we can add DI (tsyringe) for better testability.
 */
export class GroupService {
  private readonly groupRepo: GroupRepository;
  private readonly leaderboardCalc: LeaderboardCalculator;

  constructor() {
    this.groupRepo = new GroupRepository();
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
  async joinGroup(groupId: string, userId: string): Promise<void> {
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
  async leaveGroup(groupId: string, userId: string): Promise<void> {
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
      throw new Error('Group owner cannot leave. Please delete the group or transfer ownership first.');
    }

    // Create updated group with member removed
    const updatedGroup = group.withRemovedMember(userId);

    // Save to repository
    await this.groupRepo.save(updatedGroup);
  }

  /**
   * Get group leaderboard
   *
   * Note: This needs SessionRepository and UserRepository which we'll create next.
   * For now, this is a placeholder that shows the structure.
   */
  async getGroupLeaderboard(
    groupId: string,
    period: TimePeriod
  ): Promise<LeaderboardEntry[]> {
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // TODO: Implement when SessionRepository and UserRepository are ready
    // const sessions = await sessionRepo.findByUserIdsAndPeriod(group.memberIds, period);
    // const users = await userRepo.findByIds(group.memberIds);
    // return this.leaderboardCalc.calculate(users, sessions, period);

    // Placeholder return
    return [];
  }

  /**
   * Get group stats
   */
  async getGroupStats(groupId: string): Promise<GroupStats> {
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // TODO: Implement when SessionRepository is ready
    // For now return basic stats
    return {
      memberCount: group.getMemberCount(),
      totalSessions: 0,
      totalHours: 0,
      activeMembersThisWeek: 0
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
}
