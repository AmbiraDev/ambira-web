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
        memberIds: data.memberIds || [],
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as Group;
    } catch (error) {
      console.error('Error getting group:', error);
      throw new Error(
        typeof error === 'string' ? error : 'Failed to get group'
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
        ...removeUndefinedFields(groupData),
        adminUserIds: [userId],
        memberIds: [userId],
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
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Group;
    } catch (error) {
      console.error('Error creating group:', error);
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
        ...removeUndefinedFields(updateData),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updatePayload);
    } catch (error) {
      console.error('Error updating group:', error);
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
    } catch (error) {
      console.error('Error deleting group:', error);
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
    } catch (error) {
      console.error('Error adding member to group:', error);
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
    } catch (error) {
      console.error('Error removing member from group:', error);
      throw new Error('Failed to remove member');
    }
  },

  /**
   * Join a group (alias for addMember)
   */
  joinGroup: async (groupId: string, userId: string): Promise<void> => {
    return firebaseGroupApi.addMember(groupId, userId);
  },

  /**
   * Leave a group (alias for removeMember)
   */
  leaveGroup: async (groupId: string, userId: string): Promise<void> => {
    return firebaseGroupApi.removeMember(groupId, userId);
  },

  /**
   * Get all groups for a user
   */
  getUserGroups: async (userId: string): Promise<Group[]> => {
    try {
      const groupsRef = doc(db, 'groups');
      // Note: This is a simplified version. For production, consider implementing
      // a more efficient query that filters groups by memberIds array-contains
      return [];
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw new Error('Failed to get user groups');
    }
  },

  /**
   * Search groups by name or description
   */
  searchGroups: async (query: string): Promise<Group[]> => {
    try {
      // Note: For production, implement proper text search
      // This is a placeholder implementation
      return [];
    } catch (error) {
      console.error('Error searching groups:', error);
      throw new Error('Failed to search groups');
    }
  },

  /**
   * Get group analytics data for a time range
   */
  getGroupAnalytics: async (
    groupId: string,
    timeRange: 'week' | 'month' | 'year'
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
    } catch (error) {
      console.error('Error getting group analytics:', error);
      throw new Error('Failed to get group analytics');
    }
  },
};
