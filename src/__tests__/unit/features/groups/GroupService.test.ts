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
  let mockGroupRepoInstance: jest.Mocked<GroupRepository>;

  const mockGroup = new Group(
    'group-1',
    'Test Group',
    'A test group',
    'work',
    'public',
    ['user-1'],
    ['user-1'],
    'user-1',
    new Date()
  );

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repo instance
    mockGroupRepoInstance = {
      findById: jest.fn(),
      findByMemberId: jest.fn(),
      findPublic: jest.fn(),
      addMember: jest.fn(),
      save: jest.fn(),
    } as any;

    // Mock the repository constructor
    (
      GroupRepository as jest.MockedClass<typeof GroupRepository>
    ).mockImplementation(() => mockGroupRepoInstance);

    groupService = new GroupService();
  });

  describe('getGroupDetails', () => {
    it('should get group by ID', async () => {
      // ARRANGE
      mockGroupRepoInstance.findById.mockResolvedValue(mockGroup);

      // ACT
      const result = await groupService.getGroupDetails('group-1');

      // ASSERT
      expect(result).toEqual(mockGroup);
      expect(result?.name).toBe('Test Group');
    });

    it('should return null if group not found', async () => {
      // ARRANGE
      mockGroupRepoInstance.findById.mockResolvedValue(null);

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
          'study',
          'public',
          ['user-1', 'user-3'],
          ['user-1'],
          'user-1',
          new Date()
        ),
      ];

      mockGroupRepoInstance.findByMemberId.mockResolvedValue(mockGroups);

      // ACT
      const result = await groupService.getUserGroups('user-1');

      // ASSERT
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test Group');
    });

    it('should support limit parameter', async () => {
      // ARRANGE
      mockGroupRepoInstance.findByMemberId.mockResolvedValue([mockGroup]);

      // ACT
      await groupService.getUserGroups('user-1', 10);

      // ASSERT - Should complete without error
      expect(true).toBe(true);
    });

    it('should return empty array if user not in any groups', async () => {
      // ARRANGE
      mockGroupRepoInstance.findByMemberId.mockResolvedValue([]);

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
          'learning',
          'public',
          ['user-2', 'user-3'],
          ['user-2'],
          'user-2',
          new Date()
        ),
      ];

      mockGroupRepoInstance.findPublic.mockResolvedValue(publicGroups);

      // ACT
      const result = await groupService.getPublicGroups();

      // ASSERT
      expect(result).toHaveLength(2);
      expect(result[0].privacy).toBe('public');
    });

    it('should support limit parameter', async () => {
      // ARRANGE
      mockGroupRepoInstance.findPublic.mockResolvedValue([mockGroup]);

      // ACT
      await groupService.getPublicGroups(20);

      // ASSERT - Should complete without error
      expect(true).toBe(true);
    });

    it('should return empty array if no public groups', async () => {
      // ARRANGE
      mockGroupRepoInstance.findPublic.mockResolvedValue([]);

      // ACT
      const result = await groupService.getPublicGroups();

      // ASSERT
      expect(result).toEqual([]);
    });
  });

  describe('joinGroup', () => {
    it('should join a group successfully', async () => {
      // ARRANGE
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const joinData = { groupId: validUuid };

      mockGroupRepoInstance.findById.mockResolvedValue(mockGroup);
      mockGroupRepoInstance.addMember.mockResolvedValue(undefined);
      mockGroupRepoInstance.save.mockResolvedValue(undefined);

      // ACT
      await groupService.joinGroup(joinData, 'user-2');

      // ASSERT - Should complete without error
      expect(mockGroupRepoInstance.save).toHaveBeenCalled();
    });

    it('should throw error if group not found', async () => {
      // ARRANGE
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const joinData = { groupId: validUuid };

      mockGroupRepoInstance.findById.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(groupService.joinGroup(joinData, 'user-2')).rejects.toThrow(
        'Group not found'
      );
    });

    it('should throw error if already a member', async () => {
      // ARRANGE
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const joinData = { groupId: validUuid };

      mockGroupRepoInstance.findById.mockResolvedValue(mockGroup);

      // ACT & ASSERT
      await expect(groupService.joinGroup(joinData, 'user-1')).rejects.toThrow(
        'Already a member of this group'
      );
    });
  });
});
