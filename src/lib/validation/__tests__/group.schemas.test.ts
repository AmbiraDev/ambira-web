/**
 * Tests for group validation schemas
 */

import { validate } from '../utils/validate';
import {
  CreateGroupSchema,
  UpdateGroupSchema,
  GroupMembershipSchema,
  GroupRoleSchema,
  GroupFiltersSchema,
  GroupSortSchema,
  GroupInviteSchema,
} from '../schemas/group.schemas';

describe('Group Schemas', () => {
  describe('CreateGroupSchema', () => {
    it('should validate valid group data with all required fields', () => {
      const input = {
        name: 'Productivity Masters',
        description: 'A group for people who want to improve their productivity and build better work habits.',
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(input.name);
        expect(result.data.description).toBe(input.description);
        expect(result.data.category).toBe(input.category);
        expect(result.data.type).toBe(input.type);
        expect(result.data.privacySetting).toBe(input.privacySetting);
      }
    });

    it('should validate group with all optional fields', () => {
      const input = {
        name: 'Study Group',
        description: 'Group for studying together and sharing knowledge.',
        category: 'study' as const,
        type: 'just-for-fun' as const,
        privacySetting: 'approval-required' as const,
        icon: '📚',
        color: '#007AFF',
        location: 'San Francisco, CA',
        imageUrl: 'https://example.com/image.jpg',
        bannerUrl: 'https://example.com/banner.jpg',
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.icon).toBe(input.icon);
        expect(result.data.color).toBe(input.color);
        expect(result.data.location).toBe(input.location);
        expect(result.data.imageUrl).toBe(input.imageUrl);
        expect(result.data.bannerUrl).toBe(input.bannerUrl);
      }
    });

    it('should fail for missing name', () => {
      const input = {
        description: 'Test description that is long enough',
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map((e) => e.path);
        expect(paths).toContain('name');
      }
    });

    it('should fail for missing description', () => {
      const input = {
        name: 'Test Group',
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map((e) => e.path);
        expect(paths).toContain('description');
      }
    });

    it('should fail for missing category', () => {
      const input = {
        name: 'Test Group',
        description: 'Test description that is long enough',
        type: 'professional' as const,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map((e) => e.path);
        expect(paths).toContain('category');
      }
    });

    it('should fail for missing type', () => {
      const input = {
        name: 'Test Group',
        description: 'Test description that is long enough',
        category: 'work' as const,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map((e) => e.path);
        expect(paths).toContain('type');
      }
    });

    it('should fail for missing privacySetting', () => {
      const input = {
        name: 'Test Group',
        description: 'Test description that is long enough',
        category: 'work' as const,
        type: 'professional' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map((e) => e.path);
        expect(paths).toContain('privacySetting');
      }
    });

    it('should fail for name shorter than 3 characters', () => {
      const input = {
        name: 'AB', // Too short
        description: 'Test description that is long enough',
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('name');
      }
    });

    it('should allow name at exactly 3 characters', () => {
      const input = {
        name: 'ABC',
        description: 'Test description that is long enough',
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(true);
    });

    it('should fail for name exceeding 100 characters', () => {
      const input = {
        name: 'A'.repeat(101),
        description: 'Test description that is long enough',
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('name');
      }
    });

    it('should allow name at exactly 100 characters', () => {
      const input = {
        name: 'A'.repeat(100),
        description: 'Test description that is long enough',
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(true);
    });

    it('should fail for description shorter than 10 characters', () => {
      const input = {
        name: 'Test Group',
        description: 'Short', // Too short
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('description');
      }
    });

    it('should allow description at exactly 10 characters', () => {
      const input = {
        name: 'Test Group',
        description: '1234567890', // Exactly 10
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(true);
    });

    it('should fail for description exceeding 1000 characters', () => {
      const input = {
        name: 'Test Group',
        description: 'A'.repeat(1001),
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('description');
      }
    });

    it('should allow description at exactly 1000 characters', () => {
      const input = {
        name: 'Test Group',
        description: 'A'.repeat(1000),
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(true);
    });

    it('should validate all category enum values', () => {
      const categories = ['work', 'study', 'side-project', 'learning', 'other'] as const;

      categories.forEach((category) => {
        const input = {
          name: 'Test Group',
          description: 'Test description that is long enough',
          category,
          type: 'professional' as const,
          privacySetting: 'public' as const,
        };

        const result = validate(CreateGroupSchema, input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.category).toBe(category);
        }
      });
    });

    it('should fail for invalid category', () => {
      const input = {
        name: 'Test Group',
        description: 'Test description that is long enough',
        category: 'invalid-category' as any,
        type: 'professional' as const,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('category');
      }
    });

    it('should validate all type enum values', () => {
      const types = ['just-for-fun', 'professional', 'competitive', 'other'] as const;

      types.forEach((type) => {
        const input = {
          name: 'Test Group',
          description: 'Test description that is long enough',
          category: 'work' as const,
          type,
          privacySetting: 'public' as const,
        };

        const result = validate(CreateGroupSchema, input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe(type);
        }
      });
    });

    it('should fail for invalid type', () => {
      const input = {
        name: 'Test Group',
        description: 'Test description that is long enough',
        category: 'work' as const,
        type: 'invalid-type' as any,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('type');
      }
    });

    it('should validate all privacySetting enum values', () => {
      const privacySettings = ['public', 'approval-required'] as const;

      privacySettings.forEach((privacySetting) => {
        const input = {
          name: 'Test Group',
          description: 'Test description that is long enough',
          category: 'work' as const,
          type: 'professional' as const,
          privacySetting,
        };

        const result = validate(CreateGroupSchema, input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.privacySetting).toBe(privacySetting);
        }
      });
    });

    it('should fail for invalid privacySetting', () => {
      const input = {
        name: 'Test Group',
        description: 'Test description that is long enough',
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'private' as any,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('privacySetting');
      }
    });

    it('should fail for invalid color format', () => {
      const input = {
        name: 'Test Group',
        description: 'Test description that is long enough',
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
        color: 'invalid-color',
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('color');
      }
    });

    it('should validate valid hex color', () => {
      const input = {
        name: 'Test Group',
        description: 'Test description that is long enough',
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
        color: '#FF3B30',
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(true);
    });

    it('should fail for invalid URL format', () => {
      const input = {
        name: 'Test Group',
        description: 'Test description that is long enough',
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
        imageUrl: 'not-a-valid-url',
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('imageUrl');
      }
    });

    it('should validate valid URLs', () => {
      const input = {
        name: 'Test Group',
        description: 'Test description that is long enough',
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
        imageUrl: 'https://example.com/image.jpg',
        bannerUrl: 'https://example.com/banner.png',
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(true);
    });

    it('should trim name and description whitespace', () => {
      const input = {
        name: '  Test Group  ',
        description: '  Test description that is long enough  ',
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
      };

      const result = validate(CreateGroupSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Group');
        expect(result.data.description).toBe('Test description that is long enough');
      }
    });
  });

  describe('UpdateGroupSchema', () => {
    it('should validate partial update with name only', () => {
      const input = {
        name: 'Updated Group Name',
      };

      const result = validate(UpdateGroupSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(input.name);
      }
    });

    it('should validate empty update object', () => {
      const input = {};

      const result = validate(UpdateGroupSchema, input);

      expect(result.success).toBe(true);
    });

    it('should validate multiple fields updated together', () => {
      const input = {
        name: 'Updated Name',
        description: 'Updated description is long enough now',
        category: 'learning' as const,
        type: 'competitive' as const,
        privacySetting: 'approval-required' as const,
        color: '#34C759',
        location: 'New York, NY',
      };

      const result = validate(UpdateGroupSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
        expect(result.data.category).toBe('learning');
      }
    });

    it('should fail for name shorter than 3 characters', () => {
      const input = {
        name: 'AB',
      };

      const result = validate(UpdateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('name');
      }
    });

    it('should fail for description shorter than 10 characters', () => {
      const input = {
        description: 'Short',
      };

      const result = validate(UpdateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('description');
      }
    });

    it('should fail for invalid category', () => {
      const input = {
        category: 'invalid' as any,
      };

      const result = validate(UpdateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('category');
      }
    });

    it('should fail for invalid type', () => {
      const input = {
        type: 'invalid' as any,
      };

      const result = validate(UpdateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('type');
      }
    });

    it('should fail for invalid privacySetting', () => {
      const input = {
        privacySetting: 'invalid' as any,
      };

      const result = validate(UpdateGroupSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('privacySetting');
      }
    });

    it('should trim name and description whitespace', () => {
      const input = {
        name: '  Updated Name  ',
        description: '  Updated description is long enough  ',
      };

      const result = validate(UpdateGroupSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
        expect(result.data.description).toBe('Updated description is long enough');
      }
    });
  });

  describe('GroupMembershipSchema', () => {
    it('should validate groupId only', () => {
      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = validate(GroupMembershipSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupId).toBe(input.groupId);
      }
    });

    it('should validate groupId with optional userId', () => {
      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '660e8400-e29b-41d4-a716-446655440001',
      };

      const result = validate(GroupMembershipSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupId).toBe(input.groupId);
        expect(result.data.userId).toBe(input.userId);
      }
    });

    it('should fail for missing groupId', () => {
      const input = {};

      const result = validate(GroupMembershipSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map((e) => e.path);
        expect(paths).toContain('groupId');
      }
    });

    it('should fail for invalid groupId', () => {
      const input = {
        groupId: 'not-a-uuid',
      };

      const result = validate(GroupMembershipSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('groupId');
      }
    });
  });

  describe('GroupRoleSchema', () => {
    it('should validate admin role', () => {
      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '660e8400-e29b-41d4-a716-446655440001',
        role: 'admin' as const,
      };

      const result = validate(GroupRoleSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('admin');
      }
    });

    it('should validate member role', () => {
      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '660e8400-e29b-41d4-a716-446655440001',
        role: 'member' as const,
      };

      const result = validate(GroupRoleSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('member');
      }
    });

    it('should fail for invalid role', () => {
      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '660e8400-e29b-41d4-a716-446655440001',
        role: 'owner' as any,
      };

      const result = validate(GroupRoleSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('role');
      }
    });

    it('should fail for missing required fields', () => {
      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = validate(GroupRoleSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.errors.map((e) => e.path);
        expect(paths).toContain('userId');
        expect(paths).toContain('role');
      }
    });
  });

  describe('GroupFiltersSchema', () => {
    it('should validate empty filters', () => {
      const input = {};

      const result = validate(GroupFiltersSchema, input);

      expect(result.success).toBe(true);
    });

    it('should validate all filters together', () => {
      const input = {
        category: 'work' as const,
        type: 'professional' as const,
        privacySetting: 'public' as const,
        location: 'San Francisco',
        search: 'productivity',
        userId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = validate(GroupFiltersSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('work');
        expect(result.data.type).toBe('professional');
        expect(result.data.location).toBe('San Francisco');
      }
    });

    it('should fail for invalid category', () => {
      const input = {
        category: 'invalid' as any,
      };

      const result = validate(GroupFiltersSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('category');
      }
    });
  });

  describe('GroupSortSchema', () => {
    it('should validate sort by name', () => {
      const input = {
        field: 'name' as const,
        direction: 'asc' as const,
      };

      const result = validate(GroupSortSchema, input);

      expect(result.success).toBe(true);
    });

    it('should validate sort by memberCount', () => {
      const input = {
        field: 'memberCount' as const,
        direction: 'desc' as const,
      };

      const result = validate(GroupSortSchema, input);

      expect(result.success).toBe(true);
    });

    it('should validate sort by createdAt', () => {
      const input = {
        field: 'createdAt' as const,
        direction: 'desc' as const,
      };

      const result = validate(GroupSortSchema, input);

      expect(result.success).toBe(true);
    });

    it('should validate sort by updatedAt', () => {
      const input = {
        field: 'updatedAt' as const,
        direction: 'asc' as const,
      };

      const result = validate(GroupSortSchema, input);

      expect(result.success).toBe(true);
    });

    it('should fail for invalid field', () => {
      const input = {
        field: 'invalid' as any,
        direction: 'asc' as const,
      };

      const result = validate(GroupSortSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('field');
      }
    });
  });

  describe('GroupInviteSchema', () => {
    it('should validate invite with single user', () => {
      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        userIds: ['660e8400-e29b-41d4-a716-446655440001'],
      };

      const result = validate(GroupInviteSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userIds).toHaveLength(1);
      }
    });

    it('should validate invite with multiple users', () => {
      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        userIds: [
          '660e8400-e29b-41d4-a716-446655440001',
          '660e8400-e29b-41d4-a716-446655440002',
          '660e8400-e29b-41d4-a716-446655440003',
        ],
      };

      const result = validate(GroupInviteSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userIds).toHaveLength(3);
      }
    });

    it('should validate invite with message', () => {
      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        userIds: ['660e8400-e29b-41d4-a716-446655440001'],
        message: 'Join our productivity group!',
      };

      const result = validate(GroupInviteSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe(input.message);
      }
    });

    it('should fail for empty userIds array', () => {
      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        userIds: [],
      };

      const result = validate(GroupInviteSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('userIds');
      }
    });

    it('should fail for more than 50 users', () => {
      // Generate 51 valid UUIDs by padding the index properly
      const userIds = Array.from(
        { length: 51 },
        (_, i) => `${String(i).padStart(8, '0')}-e29b-41d4-a716-446655440000`
      );

      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        userIds,
      };

      const result = validate(GroupInviteSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Should fail on array length validation
        expect(result.errors[0].path).toBe('userIds');
      }
    });

    it('should allow exactly 50 users', () => {
      const userIds = Array.from(
        { length: 50 },
        (_, i) => `${String(i).padStart(8, '0')}-e29b-41d4-a716-446655440000`
      );

      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        userIds,
      };

      const result = validate(GroupInviteSchema, input);

      expect(result.success).toBe(true);
    });

    it('should fail for message exceeding 500 characters', () => {
      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        userIds: ['660e8400-e29b-41d4-a716-446655440001'],
        message: 'A'.repeat(501),
      };

      const result = validate(GroupInviteSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('message');
      }
    });

    it('should allow message at exactly 500 characters', () => {
      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        userIds: ['660e8400-e29b-41d4-a716-446655440001'],
        message: 'A'.repeat(500),
      };

      const result = validate(GroupInviteSchema, input);

      expect(result.success).toBe(true);
    });

    it('should trim message whitespace', () => {
      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        userIds: ['660e8400-e29b-41d4-a716-446655440001'],
        message: '  Join our group!  ',
      };

      const result = validate(GroupInviteSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe('Join our group!');
      }
    });

    it('should fail for invalid UUID in userIds', () => {
      const input = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        userIds: ['not-a-uuid'],
      };

      const result = validate(GroupInviteSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].path).toBe('userIds.0');
      }
    });
  });
});
