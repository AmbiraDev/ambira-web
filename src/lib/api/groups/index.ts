/**
 * Groups API Module
 *
 * Provides backward compatibility API for groups operations.
 * Acts as a bridge between legacy firebaseApi usage and the new clean architecture.
 *
 * For new code, prefer using:
 * - useGroupDetails, useUserGroups, usePublicGroups from '@/features/groups/hooks/useGroups'
 * - useJoinGroup, useLeaveGroup from '@/features/groups/hooks/useGroupMutations'
 */

import { GroupService } from '@/features/groups/services/GroupService';
import { GroupRepository } from '@/infrastructure/firebase/repositories/GroupRepository';
import { Group as DomainGroup } from '@/domain/entities/Group';
import { Group, UpdateGroupData, CreateGroupData } from '@/types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { removeUndefinedFields } from '../shared/utils';

// Singleton instances
const groupService = new GroupService();
const groupRepository = new GroupRepository();

/**
 * Convert domain Group entity to UI Group interface
 */
function adaptDomainGroupToUI(domainGroup: DomainGroup): Group {
  return {
    id: domainGroup.id,
    name: domainGroup.name,
    description: domainGroup.description,
    category: domainGroup.category,
    type: 'professional', // Default type
    privacySetting:
      domainGroup.privacy === 'public' ? 'public' : 'approval-required',
    memberCount: domainGroup.getMemberCount(),
    adminUserIds: Array.from(domainGroup.adminUserIds),
    memberIds: Array.from(domainGroup.memberIds),
    createdByUserId: domainGroup.createdByUserId,
    createdAt: domainGroup.createdAt,
    updatedAt: domainGroup.createdAt,
    imageUrl: domainGroup.imageUrl,
    location: domainGroup.location,
    // Optional fields - add defaults if needed by UI layer
    icon: undefined,
    color: undefined,
    bannerUrl: undefined,
  };
}

/**
 * Get group by ID
 */
async function getGroup(groupId: string): Promise<Group | null> {
  const domainGroup = await groupService.getGroupDetails(groupId);
  if (!domainGroup) return null;
  return adaptDomainGroupToUI(domainGroup);
}

/**
 * Get groups for a user
 */
async function getUserGroups(userId: string, limit?: number): Promise<Group[]> {
  const domainGroups = await groupService.getUserGroups(userId, limit);
  return domainGroups.map(adaptDomainGroupToUI);
}

/**
 * Get public groups
 */
async function getPublicGroups(limit?: number): Promise<Group[]> {
  const domainGroups = await groupService.getPublicGroups(limit);
  return domainGroups.map(adaptDomainGroupToUI);
}

/**
 * Update group
 *
 * Note: This is a direct Firestore update, bypassing the domain layer.
 * For new code, consider adding proper update methods to GroupService.
 */
async function updateGroup(
  groupId: string,
  data: UpdateGroupData
): Promise<void> {
  try {
    const groupRef = doc(db, 'groups', groupId);

    // Remove undefined fields to prevent Firestore errors
    const cleanData = removeUndefinedFields({
      ...data,
      updatedAt: new Date(),
    });

    await updateDoc(groupRef, cleanData);
  } catch (error) {
    console.error(`Error updating group ${groupId}:`, error);
    throw new Error(
      `Failed to update group: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Join a group
 */
async function joinGroup(groupId: string, userId: string): Promise<void> {
  return groupService.joinGroup(groupId, userId);
}

/**
 * Leave a group
 */
async function leaveGroup(groupId: string, userId: string): Promise<void> {
  return groupService.leaveGroup(groupId, userId);
}

/**
 * Check if user can join group
 */
async function canUserJoin(groupId: string, userId: string): Promise<boolean> {
  return groupService.canUserJoin(groupId, userId);
}

/**
 * Check if user can invite to group
 */
async function canUserInvite(
  groupId: string,
  userId: string
): Promise<boolean> {
  return groupService.canUserInvite(groupId, userId);
}

/**
 * Create a new group
 */
async function createGroup(
  data: CreateGroupData,
  userId: string
): Promise<Group> {
  try {
    // Generate unique group ID
    const groupId = uuidv4();

    // Map UI data to domain entity
    const domainGroup = new DomainGroup(
      groupId,
      data.name,
      data.description,
      data.category,
      data.privacySetting === 'public' ? 'public' : 'approval-required',
      [userId], // Start with creator as member
      [userId], // Creator is admin
      userId,
      new Date(),
      data.location,
      data.imageUrl
    );

    // Save to repository
    await groupRepository.save(domainGroup);

    // Return adapted UI format
    return adaptDomainGroupToUI(domainGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    throw new Error(
      `Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Combined groups API object
 */
export const firebaseGroupApi = {
  getGroup,
  getUserGroups,
  getPublicGroups,
  createGroup,
  updateGroup,
  joinGroup,
  leaveGroup,
  canUserJoin,
  canUserInvite,
} as const;
