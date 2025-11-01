/**
 * Group Factory
 * Creates mock groups for testing
 */

import type { Group, GroupMembership } from '@/types';

let groupIdCounter = 0;
let membershipIdCounter = 0;

export function createMockGroup(overrides: Partial<Group> = {}): Group {
  const id = overrides.id || `group-${Date.now()}-${++groupIdCounter}`;
  const adminUserId = overrides.createdByUserId || `user-${Date.now()}`;

  return {
    id,
    name: overrides.name || 'Test Group',
    description: overrides.description || 'A test group description',
    icon: overrides.icon,
    color: overrides.color || '#0066CC',
    imageUrl: overrides.imageUrl,
    bannerUrl: overrides.bannerUrl,
    location: overrides.location,
    category: overrides.category || 'work',
    type: overrides.type || 'just-for-fun',
    privacySetting: overrides.privacySetting || 'public',
    memberCount: overrides.memberCount || 1,
    adminUserIds: overrides.adminUserIds || [adminUserId],
    memberIds: overrides.memberIds || [adminUserId],
    createdByUserId: adminUserId,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
}

export function createMockGroupMembership(
  overrides: Partial<GroupMembership> = {}
): GroupMembership {
  return {
    id: overrides.id || `membership-${Date.now()}-${++membershipIdCounter}`,
    groupId: overrides.groupId || `group-${Date.now()}`,
    userId: overrides.userId || `user-${Date.now()}`,
    role: overrides.role || 'member',
    joinedAt: overrides.joinedAt || new Date(),
    status: overrides.status || 'active',
  };
}

export function createMockGroupBatch(
  count: number,
  baseOverrides: Partial<Group> = {}
): Group[] {
  return Array.from({ length: count }, (_, i) =>
    createMockGroup({ ...baseOverrides, name: `Group ${i + 1}` })
  );
}

export function resetGroupFactory() {
  groupIdCounter = 0;
  membershipIdCounter = 0;
}
