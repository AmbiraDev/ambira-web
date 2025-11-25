/**
 * Group Repository
 *
 * Handles all data access for Groups.
 * Implements the Repository pattern for clean separation between domain and infrastructure.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as limitFn,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Group } from '@/domain/entities/Group'
import { GroupMapper } from '../mappers/GroupMapper'

export class GroupRepository {
  private readonly mapper: GroupMapper
  private readonly collectionName = 'groups'

  constructor() {
    this.mapper = new GroupMapper()
  }

  /**
   * Find group by ID
   */
  async findById(groupId: string): Promise<Group | null> {
    try {
      const docRef = doc(db, this.collectionName, groupId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return null
      }

      return this.mapper.toDomain(docSnap)
    } catch (_error) {
      throw new Error(
        `Failed to find group: ${_error instanceof Error ? _error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Find groups by member ID
   */
  async findByMemberId(userId: string, limit: number = 50): Promise<Group[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('memberIds', 'array-contains', userId),
        orderBy('createdAt', 'desc'),
        limitFn(limit)
      )

      const snapshot = await getDocs(q)
      return this.mapper.toDomainList(snapshot.docs)
    } catch (_error) {
      throw new Error(
        `Failed to find groups: ${_error instanceof Error ? _error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Find public groups
   */
  async findPublic(limit: number = 50): Promise<Group[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('privacy', '==', 'public'),
        orderBy('memberCount', 'desc'),
        limitFn(limit)
      )

      const snapshot = await getDocs(q)
      return this.mapper.toDomainList(snapshot.docs)
    } catch (_error) {
      throw new Error(
        `Failed to find public groups: ${_error instanceof Error ? _error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Save group (create or update)
   */
  async save(group: Group): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, group.id)
      const data = this.mapper.toFirestore(group)

      await setDoc(docRef, data, { merge: true })
    } catch (_error) {
      throw new Error(
        `Failed to save group: ${_error instanceof Error ? _error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Add member to group (updates group entity)
   */
  async addMember(groupId: string, userId: string): Promise<void> {
    try {
      // Firestore doesn't have array append in batches
      // We need to read first, then write
      const group = await this.findById(groupId)
      if (!group) {
        throw new Error('Group not found')
      }

      const updatedGroup = group.withAddedMember(userId)
      await this.save(updatedGroup)
    } catch (_error) {
      throw new Error(
        `Failed to add member: ${_error instanceof Error ? _error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Remove member from group (transactional with count update)
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    try {
      const batch = writeBatch(db)
      const groupRef = doc(db, this.collectionName, groupId)

      // Note: Firestore doesn't have array remove operator in batches
      // We need to read first, then write
      const group = await this.findById(groupId)
      if (!group) {
        throw new Error('Group not found')
      }

      const updatedGroup = group.withRemovedMember(userId)
      const data = this.mapper.toFirestore(updatedGroup)

      batch.set(groupRef, data)
      await batch.commit()
    } catch (_error) {
      throw new Error(
        `Failed to remove member: ${_error instanceof Error ? _error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Delete group
   */
  async delete(groupId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, groupId)
      await deleteDoc(docRef)
    } catch (_error) {
      throw new Error(
        `Failed to delete group: ${_error instanceof Error ? _error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Check if group exists
   */
  async exists(groupId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.collectionName, groupId)
      const docSnap = await getDoc(docRef)
      return docSnap.exists()
    } catch (_error) {
      return false
    }
  }

  /**
   * Get member count for a group
   */
  async getMemberCount(groupId: string): Promise<number> {
    try {
      const docRef = doc(db, this.collectionName, groupId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return 0
      }

      const data = docSnap.data()
      return data.memberCount || data.memberIds?.length || 0
    } catch (_error) {
      return 0
    }
  }
}
