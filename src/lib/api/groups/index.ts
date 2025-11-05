/**
 * Groups API Module
 * Handles group management: CRUD operations, membership, and statistics
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { removeUndefinedFields, convertTimestamp } from '../shared/utils';

// Types
import type { Group, CreateGroupData, UpdateGroupData } from '@/types';

// ============================================================================
// GROUPS API
// ============================================================================

export const firebaseGroupApi = {
  /**
   * Get a group by ID
   */
  getGroup: async (groupId: string): Promise<Group | null> => {
    try {
      const docRef = doc(db, 'groups', groupId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      const memberIds = data.memberIds || [];
      return {
        id: docSnap.id,
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        category: data.category,
        type: data.type,
        privacySetting: data.privacySetting,
        location: data.location,
        adminUserIds: data.adminUserIds || [],
        memberIds: memberIds,
        memberCount: data.memberCount ?? memberIds.length,
        createdByUserId: data.createdByUserId,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as Group;
    } catch (_error) {
      throw new Error(
        typeof _error === 'string' ? _error : 'Failed to get group'
      );
    }
  },

  /**
   * Create a new group
   */
  createGroup: async (
    groupData: CreateGroupData,
    userId: string
  ): Promise<Group> => {
    try {
      const groupId = doc(db, 'groups').id;
      const now = serverTimestamp();

      const newGroup = {
        ...removeUndefinedFields(
          groupData as unknown as Record<string, unknown>
        ),
        adminUserIds: [userId],
        memberIds: [userId],
        memberCount: 1,
        createdByUserId: userId,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = doc(db, 'groups', groupId);
      await setDoc(docRef, newGroup);

      return {
        id: groupId,
        ...groupData,
        adminUserIds: [userId],
        memberIds: [userId],
        memberCount: 1,
        createdByUserId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Group;
    } catch (_error) {
      throw new Error('Failed to create group');
    }
  },

  /**
   * Update a group
   */
  updateGroup: async (
    groupId: string,
    updateData: UpdateGroupData
  ): Promise<void> => {
    try {
      const docRef = doc(db, 'groups', groupId);
      const updatePayload = {
        ...removeUndefinedFields(
          updateData as unknown as Record<string, unknown>
        ),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updatePayload);
    } catch (_error) {
      throw new Error('Failed to update group');
    }
  },

  /**
   * Delete a group
   */
  deleteGroup: async (groupId: string): Promise<void> => {
    try {
      const docRef = doc(db, 'groups', groupId);
      await deleteDoc(docRef);
    } catch (_error) {
      throw new Error('Failed to delete group');
    }
  },

  /**
   * Add a member to a group
   */
  addMember: async (groupId: string, userId: string): Promise<void> => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupSnap.data();
      const memberIds = groupData.memberIds || [];

      if (memberIds.includes(userId)) {
        throw new Error('User is already a member of this group');
      }

      await updateDoc(groupRef, {
        memberIds: [...memberIds, userId],
        updatedAt: serverTimestamp(),
      });
    } catch (_error) {
      throw new Error('Failed to add member');
    }
  },

  /**
   * Remove a member from a group
   */
  removeMember: async (groupId: string, userId: string): Promise<void> => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupSnap.data();
      const memberIds = groupData.memberIds || [];

      if (!memberIds.includes(userId)) {
        throw new Error('User is not a member of this group');
      }

      await updateDoc(groupRef, {
        memberIds: memberIds.filter((id: string) => id !== userId),
        updatedAt: serverTimestamp(),
      });
    } catch (_error) {
      throw new Error('Failed to remove member');
    }
  },

  /**
   * Join a group
   */
  joinGroup: async (groupId: string, userId: string): Promise<void> => {
    try {
      // Use GroupService for business logic
      const { GroupService } = await import(
        '@/features/groups/services/GroupService'
      );
      const groupService = new GroupService();
      await groupService.joinGroup(groupId, userId);
    } catch (_error) {
      throw new Error(
        typeof _error === 'string'
          ? _error
          : _error instanceof Error
            ? _error.message
            : 'Failed to join group'
      );
    }
  },

  /**
   * Leave a group
   */
  leaveGroup: async (groupId: string, userId: string): Promise<void> => {
    try {
      // Use GroupService for business logic
      const { GroupService } = await import(
        '@/features/groups/services/GroupService'
      );
      const groupService = new GroupService();
      await groupService.leaveGroup(groupId, userId);
    } catch (_error) {
      throw new Error(
        typeof _error === 'string'
          ? _error
          : _error instanceof Error
            ? _error.message
            : 'Failed to leave group'
      );
    }
  },

  /**
   * Get all groups for a user
   */
  getUserGroups: async (userId: string, limit?: number): Promise<Group[]> => {
    try {
      // Use GroupService for business logic
      const { GroupService } = await import(
        '@/features/groups/services/GroupService'
      );
      const groupService = new GroupService();
      const domainGroups = await groupService.getUserGroups(userId, limit);

      // Convert domain Group entities to API Group interface
      return domainGroups.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        imageUrl: g.imageUrl,
        category: g.category,
        type: 'other' as const, // Default type, not in domain entity
        privacySetting:
          g.privacy === 'approval-required' ? 'approval-required' : 'public',
        location: g.location,
        adminUserIds: Array.from(g.adminUserIds),
        memberIds: Array.from(g.memberIds),
        memberCount: g.getMemberCount(),
        createdByUserId: g.createdByUserId,
        createdAt: g.createdAt,
        updatedAt: g.createdAt, // Use createdAt as fallback
      }));
    } catch (_error) {
      throw new Error('Failed to get user groups');
    }
  },

  /**
   * Search groups by name or description
   */
  searchGroups: async (_query: string): Promise<Group[]> => {
    try {
      // Note: For production, implement proper text search
      // This is a placeholder implementation
      return [];
    } catch (_error) {
      throw new Error('Failed to search groups');
    }
  },

  /**
   * Get group analytics data for a time range
   */
  getGroupAnalytics: async (
    _groupId: string,
    _timeRange: 'week' | 'month' | 'year'
  ): Promise<{
    hoursData: Array<{ date: string; hours: number; members: number }>;
    membershipGrowth: Array<{ date: string; members: number }>;
  }> => {
    try {
      // Placeholder implementation
      // In production, this would fetch actual session data from Firestore
      return {
        hoursData: [],
        membershipGrowth: [],
      };
    } catch (_error) {
      throw new Error('Failed to get group analytics');
    }
  },
};
