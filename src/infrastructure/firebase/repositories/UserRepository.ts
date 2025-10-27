/**
 * User Repository
 *
 * Handles all data access for Users.
 * Implements the Repository pattern for clean separation between domain and infrastructure.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as limitFn,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/domain/entities/User';
import { UserMapper } from '../mappers/UserMapper';

export class UserRepository {
  private readonly mapper: UserMapper;
  private readonly collectionName = 'users';

  constructor() {
    this.mapper = new UserMapper();
  }

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, this.collectionName, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.mapper.toDomain(docSnap);
    } catch (error) {
      console.error(`Error finding user ${userId}:`, error);
      throw new Error(`Failed to find user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('username', '==', username),
        limitFn(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return null;
      }
      return this.mapper.toDomain(doc);
    } catch (error) {
      console.error(`Error finding user by username ${username}:`, error);
      throw new Error(`Failed to find user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find multiple users by IDs
   */
  async findByIds(userIds: string[]): Promise<User[]> {
    try {
      if (userIds.length === 0) {
        return [];
      }

      // Firestore 'in' queries are limited to 10 items
      // If we have more, we need to batch the requests
      const batchSize = 10;
      const batches: Promise<User[]>[] = [];

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batchIds = userIds.slice(i, i + batchSize);
        const batchPromise = this.fetchUserBatch(batchIds);
        batches.push(batchPromise);
      }

      const results = await Promise.all(batches);
      return results.flat();
    } catch (error) {
      console.error('Error finding users by IDs:', error);
      throw new Error(`Failed to find users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper method to fetch a batch of users (max 10)
   */
  private async fetchUserBatch(userIds: string[]): Promise<User[]> {
    const q = query(
      collection(db, this.collectionName),
      where('__name__', 'in', userIds)
    );

    const snapshot = await getDocs(q);
    return this.mapper.toDomainList(snapshot.docs);
  }

  /**
   * Search users by username (prefix match)
   */
  async searchByUsername(prefix: string, limit: number = 20): Promise<User[]> {
    try {
      // Firestore doesn't support full text search
      // This is a simple prefix match using range queries
      const q = query(
        collection(db, this.collectionName),
        where('username', '>=', prefix),
        where('username', '<=', prefix + '\uf8ff'),
        orderBy('username'),
        limitFn(limit)
      );

      const snapshot = await getDocs(q);
      return this.mapper.toDomainList(snapshot.docs);
    } catch (error) {
      console.error(`Error searching users by username prefix ${prefix}:`, error);
      throw new Error(`Failed to search users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save user (create or update)
   */
  async save(user: User): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, user.id);
      const data = this.mapper.toFirestore(user);

      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error(`Error saving user ${user.id}:`, error);
      throw new Error(`Failed to save user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update follower count
   */
  async updateFollowerCount(userId: string, delta: number): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, userId);
      await updateDoc(docRef, {
        followerCount: increment(delta)
      });
    } catch (error) {
      console.error(`Error updating follower count for user ${userId}:`, error);
      throw new Error(`Failed to update follower count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update following count
   */
  async updateFollowingCount(userId: string, delta: number): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, userId);
      await updateDoc(docRef, {
        followingCount: increment(delta)
      });
    } catch (error) {
      console.error(`Error updating following count for user ${userId}:`, error);
      throw new Error(`Failed to update following count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if user exists
   */
  async exists(userId: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.collectionName, userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error(`Error checking if user ${userId} exists:`, error);
      return false;
    }
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const user = await this.findByUsername(username);
      return user === null;
    } catch (error) {
      console.error(`Error checking username availability for ${username}:`, error);
      return false;
    }
  }
}
