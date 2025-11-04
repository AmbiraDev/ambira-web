/**
 * Group validation schemas
 *
 * Validates group creation, updates, and membership with proper type safety
 * and input sanitization.
 */

import * as v from 'valibot';
import {
  UuidSchema,
  NonEmptyStringSchema,
  OptionalStringSchema,
  UrlSchema,
} from '../utils/common-schemas';

/**
 * Group category options
 */
export const GroupCategorySchema = v.picklist(
  ['work', 'study', 'side-project', 'learning', 'other'],
  'Invalid group category'
);

/**
 * Group type options
 */
export const GroupTypeSchema = v.picklist(
  ['just-for-fun', 'professional', 'competitive', 'other'],
  'Invalid group type'
);

/**
 * Privacy setting options
 */
export const GroupPrivacySchema = v.picklist(
  ['public', 'approval-required'],
  'Invalid privacy setting'
);

/**
 * Schema for creating a new group
 */
export const CreateGroupSchema = v.object({
  // Required fields
  name: v.pipe(
    v.string('Group name is required'),
    v.nonEmpty('Group name cannot be empty'),
    v.minLength(3, 'Group name must be at least 3 characters'),
    v.maxLength(100, 'Group name cannot exceed 100 characters'),
    v.transform(str => str.trim())
  ),
  description: v.pipe(
    v.string('Description is required'),
    v.nonEmpty('Description cannot be empty'),
    v.minLength(10, 'Description must be at least 10 characters'),
    v.maxLength(1000, 'Description cannot exceed 1000 characters'),
    v.transform(str => str.trim())
  ),
  category: GroupCategorySchema,
  type: GroupTypeSchema,
  privacySetting: GroupPrivacySchema,

  // Optional fields
  icon: v.optional(NonEmptyStringSchema),
  color: v.optional(
    v.pipe(
      v.string(),
      v.regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code')
    )
  ),
  location: OptionalStringSchema,
  imageUrl: v.optional(UrlSchema),
  bannerUrl: v.optional(UrlSchema),
});

/**
 * Schema for updating an existing group
 */
export const UpdateGroupSchema = v.object({
  name: v.optional(
    v.pipe(
      v.string(),
      v.nonEmpty('Group name cannot be empty'),
      v.minLength(3, 'Group name must be at least 3 characters'),
      v.maxLength(100, 'Group name cannot exceed 100 characters'),
      v.transform(str => str.trim())
    )
  ),
  description: v.optional(
    v.pipe(
      v.string(),
      v.nonEmpty('Description cannot be empty'),
      v.minLength(10, 'Description must be at least 10 characters'),
      v.maxLength(1000, 'Description cannot exceed 1000 characters'),
      v.transform(str => str.trim())
    )
  ),
  category: v.optional(GroupCategorySchema),
  type: v.optional(GroupTypeSchema),
  privacySetting: v.optional(GroupPrivacySchema),
  icon: v.optional(NonEmptyStringSchema),
  color: v.optional(v.pipe(v.string(), v.regex(/^#[0-9A-F]{6}$/i))),
  location: OptionalStringSchema,
  imageUrl: v.optional(UrlSchema),
  bannerUrl: v.optional(UrlSchema),
});

/**
 * Schema for group membership operations
 */
export const GroupMembershipSchema = v.object({
  groupId: UuidSchema,
  userId: v.optional(UuidSchema), // Optional if operating on current user
});

/**
 * Schema for group role assignment
 */
export const GroupRoleSchema = v.object({
  groupId: UuidSchema,
  userId: UuidSchema,
  role: v.picklist(['admin', 'member'], 'Invalid role'),
});

/**
 * Schema for group filters
 */
export const GroupFiltersSchema = v.object({
  category: v.optional(GroupCategorySchema),
  type: v.optional(GroupTypeSchema),
  privacySetting: v.optional(GroupPrivacySchema),
  location: v.optional(v.string()),
  search: v.optional(v.string()),
  userId: v.optional(UuidSchema), // Filter groups by member
});

/**
 * Schema for group sort options
 */
export const GroupSortSchema = v.object({
  field: v.picklist(['name', 'memberCount', 'createdAt', 'updatedAt']),
  direction: v.picklist(['asc', 'desc']),
});

/**
 * Schema for group invitation
 */
export const GroupInviteSchema = v.object({
  groupId: UuidSchema,
  userIds: v.pipe(
    v.array(UuidSchema),
    v.minLength(1, 'Must invite at least one user'),
    v.maxLength(50, 'Cannot invite more than 50 users at once')
  ),
  message: v.optional(
    v.pipe(
      v.string(),
      v.maxLength(500, 'Invitation message cannot exceed 500 characters'),
      v.transform(str => str.trim())
    )
  ),
});

// Type exports
export type CreateGroupInput = v.InferInput<typeof CreateGroupSchema>;
export type CreateGroupData = v.InferOutput<typeof CreateGroupSchema>;

export type UpdateGroupInput = v.InferInput<typeof UpdateGroupSchema>;
export type UpdateGroupData = v.InferOutput<typeof UpdateGroupSchema>;

export type GroupMembershipInput = v.InferInput<typeof GroupMembershipSchema>;
export type GroupMembershipData = v.InferOutput<typeof GroupMembershipSchema>;

export type GroupRoleInput = v.InferInput<typeof GroupRoleSchema>;
export type GroupRoleData = v.InferOutput<typeof GroupRoleSchema>;

export type GroupFiltersInput = v.InferInput<typeof GroupFiltersSchema>;
export type GroupFilters = v.InferOutput<typeof GroupFiltersSchema>;

export type GroupSortInput = v.InferInput<typeof GroupSortSchema>;
export type GroupSort = v.InferOutput<typeof GroupSortSchema>;

export type GroupInviteInput = v.InferInput<typeof GroupInviteSchema>;
export type GroupInviteData = v.InferOutput<typeof GroupInviteSchema>;
