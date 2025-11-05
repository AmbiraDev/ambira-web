/**
 * Integration Test: Group Join/Leave Flow
 * Tests: Complete join/leave workflow with cache updates
 */

import { GroupService } from '@/features/groups/services/GroupService';
import { Group } from '@/domain/entities/Group';

// Mock the repositories
jest.mock('@/infrastructure/firebase/repositories/GroupRepository', () => ({
  GroupRepository: jest.fn().mockImplementation(() => ({
    findById: jest.fn(),
    save: jest.fn(),
    getUserGroups: jest.fn(),
    getPublicGroups: jest.fn(),
  })),
}));

jest.mock('@/infrastructure/firebase/repositories/UserRepository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    findById: jest.fn(),
  })),
}));

jest.mock('@/infrastructure/firebase/repositories/SessionRepository', () => ({
  SessionRepository: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
  })),
}));

describe('Group Join/Leave Flow Integration', () => {
  let groupService: GroupService;
  let mockRepository: {
    findById: jest.Mock;
    save: jest.Mock;
    getUserGroups: jest.Mock;
    getPublicGroups: jest.Mock;
  };

  const createMockGroup = (
    id: string,
    memberIds: string[] = [],
    adminUserIds: string[] = []
  ): Group => {
    return new Group({
      id,
      name: 'Test Group',
      description: 'Test Description',
      category: 'learning',
      privacy: 'public',
      adminUserIds: new Set(adminUserIds.length > 0 ? adminUserIds : ['admin']),
      memberIds: new Set(memberIds),
      createdByUserId: 'admin',
      createdAt: new Date(),
      location: 'Seattle, WA',
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    groupService = new GroupService();
    // Access the private groupRepo property using type assertion
    mockRepository = (groupService as { groupRepo: typeof mockRepository })
      .groupRepo;
  });

  describe('Join Group Flow', () => {
    it('should successfully join a group', async () => {
      // Arrange
      const userId = 'user-123';
      const groupId = 'group-456';
      const existingMembers = ['user-1', 'user-2'];
      const group = createMockGroup(groupId, existingMembers, ['admin']);

      mockRepository.findById.mockResolvedValue(group);
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      await groupService.joinGroup({ groupId }, userId);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(groupId);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);

      // Verify the saved group has the new member
      const savedGroup = mockRepository.save.mock.calls[0][0] as Group;
      expect(savedGroup.memberIds.has(userId)).toBe(true);
      expect(savedGroup.getMemberCount()).toBe(existingMembers.length + 1);
    });

    it('should throw error when user is already a member', async () => {
      // Arrange
      const userId = 'user-123';
      const groupId = 'group-456';
      const existingMembers = ['user-1', userId]; // User already a member
      const group = createMockGroup(groupId, existingMembers, ['admin']);

      mockRepository.findById.mockResolvedValue(group);

      // Act & Assert
      await expect(groupService.joinGroup({ groupId }, userId)).rejects.toThrow(
        'User is already a member of this group'
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when group does not exist', async () => {
      // Arrange
      const userId = 'user-123';
      const groupId = 'non-existent-group';

      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(groupService.joinGroup({ groupId }, userId)).rejects.toThrow(
        'Group not found'
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should validate input parameters', async () => {
      // Arrange
      const userId = 'user-123';
      const invalidGroupId = ''; // Empty group ID

      // Act & Assert
      await expect(
        groupService.joinGroup({ groupId: invalidGroupId }, userId)
      ).rejects.toThrow();

      expect(mockRepository.findById).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Leave Group Flow', () => {
    it('should successfully leave a group', async () => {
      // Arrange
      const userId = 'user-123';
      const groupId = 'group-456';
      const existingMembers = ['user-1', userId, 'user-2'];
      const group = createMockGroup(groupId, existingMembers, ['admin']);

      mockRepository.findById.mockResolvedValue(group);
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      await groupService.leaveGroup({ groupId }, userId);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(groupId);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);

      // Verify the saved group no longer has the user
      const savedGroup = mockRepository.save.mock.calls[0][0] as Group;
      expect(savedGroup.memberIds.has(userId)).toBe(false);
      expect(savedGroup.getMemberCount()).toBe(existingMembers.length - 1);
    });

    it('should throw error when user is not a member', async () => {
      // Arrange
      const userId = 'user-123';
      const groupId = 'group-456';
      const existingMembers = ['user-1', 'user-2']; // User not a member
      const group = createMockGroup(groupId, existingMembers, ['admin']);

      mockRepository.findById.mockResolvedValue(group);

      // Act & Assert
      await expect(
        groupService.leaveGroup({ groupId }, userId)
      ).rejects.toThrow('User is not a member of this group');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should prevent group owner from leaving', async () => {
      // Arrange
      const ownerId = 'owner-123';
      const groupId = 'group-456';
      const existingMembers = [ownerId, 'user-1'];
      const group = createMockGroup(groupId, existingMembers, [ownerId]);
      // Set the owner as createdByUserId
      Object.defineProperty(group, 'createdByUserId', {
        value: ownerId,
        writable: true,
      });

      mockRepository.findById.mockResolvedValue(group);

      // Act & Assert
      await expect(
        groupService.leaveGroup({ groupId }, ownerId)
      ).rejects.toThrow('Group owner cannot leave the group');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when group does not exist', async () => {
      // Arrange
      const userId = 'user-123';
      const groupId = 'non-existent-group';

      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        groupService.leaveGroup({ groupId }, userId)
      ).rejects.toThrow('Group not found');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Can User Join Check', () => {
    it('should return true for public groups when user is not a member', async () => {
      // Arrange
      const userId = 'user-123';
      const groupId = 'group-456';
      const existingMembers = ['user-1', 'user-2'];
      const group = createMockGroup(groupId, existingMembers, ['admin']);

      mockRepository.findById.mockResolvedValue(group);

      // Act
      const canJoin = await groupService.canUserJoin(groupId, userId);

      // Assert
      expect(canJoin).toBe(true);
    });

    it('should return false when user is already a member', async () => {
      // Arrange
      const userId = 'user-123';
      const groupId = 'group-456';
      const existingMembers = ['user-1', userId];
      const group = createMockGroup(groupId, existingMembers, ['admin']);

      mockRepository.findById.mockResolvedValue(group);

      // Act
      const canJoin = await groupService.canUserJoin(groupId, userId);

      // Assert
      expect(canJoin).toBe(false);
    });

    it('should return false when group does not exist', async () => {
      // Arrange
      const userId = 'user-123';
      const groupId = 'non-existent-group';

      mockRepository.findById.mockResolvedValue(null);

      // Act
      const canJoin = await groupService.canUserJoin(groupId, userId);

      // Assert
      expect(canJoin).toBe(false);
    });
  });

  describe('Join/Leave Sequence', () => {
    it('should handle join -> leave sequence correctly', async () => {
      // Arrange
      const userId = 'user-123';
      const groupId = 'group-456';
      const existingMembers = ['user-1', 'user-2'];
      let group = createMockGroup(groupId, existingMembers, ['admin']);

      // Setup mocks for join
      mockRepository.findById.mockResolvedValue(group);
      mockRepository.save.mockImplementation((savedGroup: Group) => {
        group = savedGroup;
        return Promise.resolve();
      });

      // Act: Join
      await groupService.joinGroup({ groupId }, userId);

      // Assert: User is now a member
      expect(group.memberIds.has(userId)).toBe(true);
      const memberCountAfterJoin = group.getMemberCount();
      expect(memberCountAfterJoin).toBe(existingMembers.length + 1);

      // Reset mocks and update findById to return updated group
      mockRepository.findById.mockResolvedValue(group);

      // Act: Leave
      await groupService.leaveGroup({ groupId }, userId);

      // Assert: User is no longer a member
      expect(group.memberIds.has(userId)).toBe(false);
      expect(group.getMemberCount()).toBe(existingMembers.length);
    });

    it('should prevent double-joining', async () => {
      // Arrange
      const userId = 'user-123';
      const groupId = 'group-456';
      const existingMembers = ['user-1', 'user-2'];
      let group = createMockGroup(groupId, existingMembers, ['admin']);

      mockRepository.findById.mockImplementation(() => {
        // Always return current state
        return Promise.resolve(group);
      });
      mockRepository.save.mockImplementation((savedGroup: Group) => {
        group = savedGroup;
        return Promise.resolve();
      });

      // Act: First join
      await groupService.joinGroup({ groupId }, userId);

      // Assert: First join succeeds
      expect(group.memberIds.has(userId)).toBe(true);

      // Act & Assert: Second join should fail
      await expect(groupService.joinGroup({ groupId }, userId)).rejects.toThrow(
        'User is already a member of this group'
      );
    });

    it('should prevent double-leaving', async () => {
      // Arrange
      const userId = 'user-123';
      const groupId = 'group-456';
      const existingMembers = ['user-1', userId];
      let group = createMockGroup(groupId, existingMembers, ['admin']);

      mockRepository.findById.mockImplementation(() => {
        return Promise.resolve(group);
      });
      mockRepository.save.mockImplementation((savedGroup: Group) => {
        group = savedGroup;
        return Promise.resolve();
      });

      // Act: First leave
      await groupService.leaveGroup({ groupId }, userId);

      // Assert: First leave succeeds
      expect(group.memberIds.has(userId)).toBe(false);

      // Act & Assert: Second leave should fail
      await expect(
        groupService.leaveGroup({ groupId }, userId)
      ).rejects.toThrow('User is not a member of this group');
    });
  });

  describe('Member Count Updates', () => {
    it('should correctly increment member count when joining', async () => {
      // Arrange
      const userId = 'user-123';
      const groupId = 'group-456';
      const existingMembers = ['user-1', 'user-2'];
      const group = createMockGroup(groupId, existingMembers, ['admin']);

      mockRepository.findById.mockResolvedValue(group);
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      await groupService.joinGroup({ groupId }, userId);

      // Assert
      const savedGroup = mockRepository.save.mock.calls[0][0] as Group;
      expect(savedGroup.getMemberCount()).toBe(3);
    });

    it('should correctly decrement member count when leaving', async () => {
      // Arrange
      const userId = 'user-123';
      const groupId = 'group-456';
      const existingMembers = ['user-1', userId, 'user-2'];
      const group = createMockGroup(groupId, existingMembers, ['admin']);

      mockRepository.findById.mockResolvedValue(group);
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      await groupService.leaveGroup({ groupId }, userId);

      // Assert
      const savedGroup = mockRepository.save.mock.calls[0][0] as Group;
      expect(savedGroup.getMemberCount()).toBe(2);
    });
  });
});
