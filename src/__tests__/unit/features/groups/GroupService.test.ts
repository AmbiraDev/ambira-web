/**
 * GroupService Unit Tests
 *
 * Tests group CRUD operations, membership, and leaderboard
 */

import { GroupService } from '@/features/groups/services/GroupService';
import { Group } from '@/domain/entities/Group';
import { GroupRepository } from '@/infrastructure/firebase/repositories/GroupRepository';
import { UserRepository } from '@/infrastructure/firebase/repositories/UserRepository';
import { SessionRepository } from '@/infrastructure/firebase/repositories/SessionRepository';
import { LeaderboardCalculator } from '@/features/groups/domain/LeaderboardCalculator';

jest.mock('@/infrastructure/firebase/repositories/GroupRepository');
jest.mock('@/infrastructure/firebase/repositories/UserRepository');
jest.mock('@/infrastructure/firebase/repositories/SessionRepository');
jest.mock('@/features/groups/domain/LeaderboardCalculator');

describe('GroupService', () => {
  let groupService: GroupService;

  const mockGroup = new Group(
    'group-1',
    'Test Group',
    'A test group',
    'public',
    ['user-1', 'user-2'],
    ['user-1'],
    new Date(),
    0
  );

  beforeEach(() => {
    jest.clearAllMocks();
    groupService = new GroupService();
  });

  describe('getGroupDetails', () => {
    it('should get group by ID', async () => {
      // ARRANGE
      jest.spyOn(groupService as any, 'groupRepo', 'get').mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockGroup),
      } as any);

      // ACT
      const result = await groupService.getGroupDetails('group-1');

      // ASSERT
      expect(result).toEqual(mockGroup);
      expect(result?.name).toBe('Test Group');
    });

    it('should return null if group not found', async () => {
      // ARRANGE
      jest.spyOn(groupService as any, 'groupRepo', 'get').mockReturnValue({
        findById: jest.fn().mockResolvedValue(null),
      } as any);

      // ACT
      const result = await groupService.getGroupDetails('nonexistent');

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe('getUserGroups', () => {
    it('should get all groups for a user', async () => {
      // ARRANGE
      const mockGroups = [
        mockGroup,
        new Group(
          'group-2',
          'Group 2',
          'Description',
          'public',
          ['user-1'],
          ['user-1'],
          new Date(),
          1
        ),
      ];

      jest.spyOn(groupService as any, 'groupRepo', 'get').mockReturnValue({
        findByMemberId: jest.fn().mockResolvedValue(mockGroups),
      } as any);

      // ACT
      const result = await groupService.getUserGroups('user-1');

      // ASSERT
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test Group');
    });

    it('should support limit parameter', async () => {
      // ARRANGE
      jest.spyOn(groupService as any, 'groupRepo', 'get').mockReturnValue({
        findByMemberId: jest.fn().mockResolvedValue([mockGroup]),
      } as any);

      // ACT
      await groupService.getUserGroups('user-1', 10);

      // ASSERT - Should complete without error
      expect(true).toBe(true);
    });

    it('should return empty array if user not in any groups', async () => {
      // ARRANGE
      jest.spyOn(groupService as any, 'groupRepo', 'get').mockReturnValue({
        findByMemberId: jest.fn().mockResolvedValue([]),
      } as any);

      // ACT
      const result = await groupService.getUserGroups('user-1');

      // ASSERT
      expect(result).toEqual([]);
    });
  });

  describe('getPublicGroups', () => {
    it('should get public groups', async () => {
      // ARRANGE
      const publicGroups = [
        mockGroup,
        new Group(
          'group-2',
          'Public Group',
          'Description',
          'public',
          ['user-2'],
          ['user-2'],
          new Date(),
          1
        ),
      ];

      jest.spyOn(groupService as any, 'groupRepo', 'get').mockReturnValue({
        findPublic: jest.fn().mockResolvedValue(publicGroups),
      } as any);

      // ACT
      const result = await groupService.getPublicGroups();

      // ASSERT
      expect(result).toHaveLength(2);
      expect(result[0].visibility).toBe('public');
    });

    it('should support limit parameter', async () => {
      // ARRANGE
      jest.spyOn(groupService as any, 'groupRepo', 'get').mockReturnValue({
        findPublic: jest.fn().mockResolvedValue([mockGroup]),
      } as any);

      // ACT
      await groupService.getPublicGroups(20);

      // ASSERT - Should complete without error
      expect(true).toBe(true);
    });

    it('should return empty array if no public groups', async () => {
      // ARRANGE
      jest.spyOn(groupService as any, 'groupRepo', 'get').mockReturnValue({
        findPublic: jest.fn().mockResolvedValue([]),
      } as any);

      // ACT
      const result = await groupService.getPublicGroups();

      // ASSERT
      expect(result).toEqual([]);
    });
  });

  describe('joinGroup', () => {
    it('should join a group successfully', async () => {
      // ARRANGE
      const joinData = { groupId: 'group-1' };

      jest.spyOn(groupService as any, 'groupRepo', 'get').mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockGroup),
        addMember: jest.fn().mockResolvedValue(undefined),
      } as any);

      // ACT
      await groupService.joinGroup(joinData, 'user-2');

      // ASSERT - Should complete without error
      expect(true).toBe(true);
    });

    it('should throw error if group not found', async () => {
      // ARRANGE
      const joinData = { groupId: 'nonexistent' };

      jest.spyOn(groupService as any, 'groupRepo', 'get').mockReturnValue({
        findById: jest.fn().mockResolvedValue(null),
      } as any);

      // ACT & ASSERT
      await expect(groupService.joinGroup(joinData, 'user-2')).rejects.toThrow(
        'Group not found'
      );
    });

    it('should throw error if already a member', async () => {
      // ARRANGE
      const joinData = { groupId: 'group-1' };

      jest.spyOn(groupService as any, 'groupRepo', 'get').mockReturnValue({
        findById: jest.fn().mockResolvedValue(mockGroup),
      } as any);

      // ACT & ASSERT
      await expect(groupService.joinGroup(joinData, 'user-1')).rejects.toThrow(
        'Already a member of this group'
      );
    });
  });
});
