/**
 * Feed Repository
 *
 * Handles specialized queries for feed functionality.
 * Extends SessionRepository with feed-specific logic.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit as limitFn,
  startAfter,
  getDocs,
  DocumentSnapshot,
  getDoc,
  doc as firestoreDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Session } from '@/domain/entities/Session';
import { SessionMapper } from '../mappers/SessionMapper';

export interface FeedResult {
  sessions: Session[];
  hasMore: boolean;
  nextCursor?: string;
}

export class FeedRepository {
  private readonly mapper: SessionMapper;
  private readonly collectionName = 'sessions';

  constructor() {
    this.mapper = new SessionMapper();
  }

  /**
   * Get feed sessions for followed users
   */
  async getFeedForFollowing(
    followingIds: string[],
    limit: number = 20,
    cursor?: string
  ): Promise<FeedResult> {
    try {
      if (followingIds.length === 0) {
        return { sessions: [], hasMore: false };
      }

      // Firestore 'in' queries are limited to 10 items
      // For following feed, we'll need to batch if >10
      const batches = this.chunkArray(followingIds, 10);
      const allDocs: DocumentSnapshot[] = [];

      for (const batchIds of batches) {
        let q = query(
          collection(db, this.collectionName),
          where('userId', 'in', batchIds),
          where('visibility', 'in', ['everyone', 'followers']),
          orderBy('createdAt', 'desc'),
          limitFn(limit + 1)
        );

        if (cursor) {
          const cursorDoc = await getDoc(
            firestoreDoc(db, this.collectionName, cursor)
          );
          if (cursorDoc.exists()) {
            q = query(q, startAfter(cursorDoc));
          }
        }

        const snapshot = await getDocs(q);
        allDocs.push(...snapshot.docs);
      }

      // Sort all docs by createdAt and take limit + 1
      allDocs.sort((a, b) => {
        const aData = a.data();
        const bData = b.data();
        const aTime = aData?.createdAt?.toMillis() || 0;
        const bTime = bData?.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });

      const limitedDocs = allDocs.slice(0, limit + 1);
      const hasMore = limitedDocs.length > limit;
      const sessions = await this.mapper.toDomainListEnriched(
        limitedDocs.slice(0, limit)
      );
      const nextCursor = hasMore ? limitedDocs[limit - 1]?.id : undefined;

      return { sessions, hasMore, nextCursor };
    } catch (error) {
      throw new Error(
        `Failed to get following feed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get public sessions (everyone)
   */
  async getPublicFeed(
    limit: number = 20,
    cursor?: string
  ): Promise<FeedResult> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('visibility', '==', 'everyone'),
        orderBy('createdAt', 'desc'),
        limitFn(limit + 1)
      );

      if (cursor) {
        const cursorDoc = await getDoc(
          firestoreDoc(db, this.collectionName, cursor)
        );
        if (cursorDoc.exists()) {
          q = query(q, startAfter(cursorDoc));
        }
      }

      const snapshot = await getDocs(q);
      const hasMore = snapshot.docs.length > limit;
      const sessions = await this.mapper.toDomainListEnriched(
        snapshot.docs.slice(0, limit)
      );
      const nextCursor = hasMore ? snapshot.docs[limit - 1]?.id : undefined;

      return { sessions, hasMore, nextCursor };
    } catch (error) {
      throw new Error(
        `Failed to get public feed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get feed for group members who are not followed
   */
  async getFeedForGroupMembersUnfollowed(
    groupMemberIds: string[],
    followingIds: string[],
    limit: number = 20,
    cursor?: string
  ): Promise<FeedResult> {
    try {
      // Get members that are not followed
      const unfollowedMemberIds = groupMemberIds.filter(
        memberId => !followingIds.includes(memberId)
      );

      if (unfollowedMemberIds.length === 0) {
        return { sessions: [], hasMore: false };
      }

      // Similar to following feed, but for unfollowed group members
      const batches = this.chunkArray(unfollowedMemberIds, 10);
      const allDocs: DocumentSnapshot[] = [];

      for (const batchIds of batches) {
        let q = query(
          collection(db, this.collectionName),
          where('userId', 'in', batchIds),
          where('visibility', '==', 'everyone'),
          orderBy('createdAt', 'desc'),
          limitFn(limit + 1)
        );

        if (cursor) {
          const cursorDoc = await getDoc(
            firestoreDoc(db, this.collectionName, cursor)
          );
          if (cursorDoc.exists()) {
            q = query(q, startAfter(cursorDoc));
          }
        }

        const snapshot = await getDocs(q);
        allDocs.push(...snapshot.docs);
      }

      // Sort and limit
      allDocs.sort((a, b) => {
        const aData = a.data();
        const bData = b.data();
        const aTime = aData?.createdAt?.toMillis() || 0;
        const bTime = bData?.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });

      const limitedDocs = allDocs.slice(0, limit + 1);
      const hasMore = limitedDocs.length > limit;
      const sessions = await this.mapper.toDomainListEnriched(
        limitedDocs.slice(0, limit)
      );
      const nextCursor = hasMore ? limitedDocs[limit - 1]?.id : undefined;

      return { sessions, hasMore, nextCursor };
    } catch (error) {
      throw new Error(
        `Failed to get group members feed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Helper: Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
