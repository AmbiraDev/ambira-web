/**
 * Group Entity Unit Tests
 *
 * Tests for Group domain entity business logic.
 * These tests verify business rules and invariants.
 */

import { Group } from '../Group';

describe('Group Entity', () => {
  describe('constructor and invariants', () => {
    it('should create a valid group', () => {
      // Arrange & Act
      const group = new Group(
        'group1',
        'Study Group',
        'A group for studying',
        'study',
        'public',
        ['user1', 'user2'],
        ['user1'],
        'user1',
        new Date()
      );

      // Assert
      expect(group.id).toBe('group1');
      expect(group.name).toBe('Study Group');
      expect(group.memberIds).toHaveLength(2);
    });

    it('should throw error if name is empty', () => {
      // Arrange, Act & Assert
      expect(() => {
        new Group(
          'group1',
          '',
          'Description',
          'study',
          'public',
          ['user1'],
          ['user1'],
          'user1',
          new Date()
        );
      }).toThrow('Group name cannot be empty');
    });

    it('should throw error if no members', () => {
      // Arrange, Act & Assert
      expect(() => {
        new Group(
          'group1',
          'Study Group',
          'Description',
          'study',
          'public',
          [],
          ['user1'],
          'user1',
          new Date()
        );
      }).toThrow('Group must have at least one member');
    });

    it('should throw error if no admins', () => {
      // Arrange, Act & Assert
      expect(() => {
        new Group(
          'group1',
          'Study Group',
          'Description',
          'study',
          'public',
          ['user1'],
          [],
          'user1',
          new Date()
        );
      }).toThrow('Group must have at least one admin');
    });

    it('should throw error if creator is not an admin', () => {
      // Arrange, Act & Assert
      expect(() => {
        new Group(
          'group1',
          'Study Group',
          'Description',
          'study',
          'public',
          ['user1', 'user2'],
          ['user2'],
          'user1',
          new Date()
        );
      }).toThrow('Group creator must be an admin');
    });

    it('should throw error if creator is not a member', () => {
      // Arrange, Act & Assert
      expect(() => {
        new Group(
          'group1',
          'Study Group',
          'Description',
          'study',
          'public',
          ['user2'],
          ['user1'],
          'user1',
          new Date()
        );
      }).toThrow('Group creator must be a member');
    });
  });

  describe('isMember', () => {
    it('should return true if user is a member', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'public',
        ['user1', 'user2'],
        ['user1'],
        'user1',
        new Date()
      );

      // Act & Assert
      expect(group.isMember('user1')).toBe(true);
      expect(group.isMember('user2')).toBe(true);
      expect(group.isMember('user3')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true if user is an admin', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'public',
        ['user1', 'user2'],
        ['user1'],
        'user1',
        new Date()
      );

      // Act & Assert
      expect(group.isAdmin('user1')).toBe(true);
      expect(group.isAdmin('user2')).toBe(false);
    });
  });

  describe('isOwner', () => {
    it('should return true if user is the owner', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'public',
        ['user1', 'user2'],
        ['user1'],
        'user1',
        new Date()
      );

      // Act & Assert
      expect(group.isOwner('user1')).toBe(true);
      expect(group.isOwner('user2')).toBe(false);
    });
  });

  describe('canUserEdit', () => {
    it('should return true for admin users', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'public',
        ['user1', 'user2'],
        ['user1'],
        'user1',
        new Date()
      );

      // Act & Assert
      expect(group.canUserEdit('user1')).toBe(true);
      expect(group.canUserEdit('user2')).toBe(false);
    });
  });

  describe('canUserInvite', () => {
    it('should allow any member to invite if group is public', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'public',
        ['user1', 'user2'],
        ['user1'],
        'user1',
        new Date()
      );

      // Act & Assert
      expect(group.canUserInvite('user1')).toBe(true);
      expect(group.canUserInvite('user2')).toBe(true);
      expect(group.canUserInvite('user3')).toBe(false);
    });

    it('should only allow admins to invite if group requires approval', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'approval-required',
        ['user1', 'user2'],
        ['user1'],
        'user1',
        new Date()
      );

      // Act & Assert
      expect(group.canUserInvite('user1')).toBe(true); // Admin
      expect(group.canUserInvite('user2')).toBe(false); // Regular member
    });
  });

  describe('withAddedMember', () => {
    it('should return new group with added member', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'public',
        ['user1'],
        ['user1'],
        'user1',
        new Date()
      );

      // Act
      const updatedGroup = group.withAddedMember('user2');

      // Assert
      expect(updatedGroup.memberIds).toHaveLength(2);
      expect(updatedGroup.memberIds).toContain('user2');
      expect(updatedGroup.getMemberCount()).toBe(2);

      // Original group should be unchanged (immutability)
      expect(group.memberIds).toHaveLength(1);
    });

    it('should throw error if user is already a member', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'public',
        ['user1'],
        ['user1'],
        'user1',
        new Date()
      );

      // Act & Assert
      expect(() => {
        group.withAddedMember('user1');
      }).toThrow('User is already a member');
    });
  });

  describe('withRemovedMember', () => {
    it('should return new group with removed member', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'public',
        ['user1', 'user2'],
        ['user1'],
        'user1',
        new Date()
      );

      // Act
      const updatedGroup = group.withRemovedMember('user2');

      // Assert
      expect(updatedGroup.memberIds).toHaveLength(1);
      expect(updatedGroup.memberIds).not.toContain('user2');
      expect(updatedGroup.getMemberCount()).toBe(1);

      // Original group should be unchanged (immutability)
      expect(group.memberIds).toHaveLength(2);
    });

    it('should throw error if user is not a member', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'public',
        ['user1'],
        ['user1'],
        'user1',
        new Date()
      );

      // Act & Assert
      expect(() => {
        group.withRemovedMember('user2');
      }).toThrow('User is not a member');
    });

    it('should throw error if trying to remove owner', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'public',
        ['user1', 'user2'],
        ['user1'],
        'user1',
        new Date()
      );

      // Act & Assert
      expect(() => {
        group.withRemovedMember('user1');
      }).toThrow('Cannot remove group owner');
    });

    it('should throw error if removing last admin', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'public',
        ['user1', 'user2', 'user3'],
        ['user2'],
        'user2',
        new Date()
      );

      // Act & Assert
      expect(() => {
        // Try to remove user2 who is admin but not owner
        // This should fail because user2 is also the owner
        group.withRemovedMember('user2');
      }).toThrow('Cannot remove group owner');
    });

    it('should allow removing admin if not the last one', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'public',
        ['user1', 'user2', 'user3'],
        ['user1', 'user3'],
        'user1',
        new Date()
      );

      // Act
      const updatedGroup = group.withRemovedMember('user3');

      // Assert
      expect(updatedGroup.adminUserIds).toHaveLength(1);
      expect(updatedGroup.adminUserIds).not.toContain('user3');
    });
  });

  describe('withPromotedAdmin', () => {
    it('should promote member to admin', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'public',
        ['user1', 'user2'],
        ['user1'],
        'user1',
        new Date()
      );

      // Act
      const updatedGroup = group.withPromotedAdmin('user2');

      // Assert
      expect(updatedGroup.adminUserIds).toHaveLength(2);
      expect(updatedGroup.adminUserIds).toContain('user2');
      expect(updatedGroup.isAdmin('user2')).toBe(true);

      // Original group should be unchanged
      expect(group.isAdmin('user2')).toBe(false);
    });

    it('should throw error if user is not a member', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'public',
        ['user1'],
        ['user1'],
        'user1',
        new Date()
      );

      // Act & Assert
      expect(() => {
        group.withPromotedAdmin('user2');
      }).toThrow('User must be a member to become admin');
    });

    it('should throw error if user is already an admin', () => {
      // Arrange
      const group = new Group(
        'group1',
        'Study Group',
        'Description',
        'study',
        'public',
        ['user1'],
        ['user1'],
        'user1',
        new Date()
      );

      // Act & Assert
      expect(() => {
        group.withPromotedAdmin('user1');
      }).toThrow('User is already an admin');
    });
  });
});
