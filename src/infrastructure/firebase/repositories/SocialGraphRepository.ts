/**
 * Social Graph Repository
 *
 * Handles queries for social relationships (follows, group memberships).
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export class SocialGraphRepository {
  /**
   * Get list of users that a user is following
   */
  async getFollowingIds(userId: string): Promise<string[]> {
    try {
      let followingIds: string[] = [];

      // Try new social_graph structure first
      try {
        const outboundRef = collection(db, `social_graph/${userId}/outbound`);
        const outboundSnapshot = await getDocs(outboundRef);

        if (!outboundSnapshot.empty) {
          followingIds = outboundSnapshot.docs.map(doc => doc.id);
          return followingIds;
        }
      } catch (__socialGraphError) {
        // If social_graph doesn't exist, fall through to legacy follows
      }

      // Fallback to old follows collection
      const followingQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', userId)
      );
      const followingSnapshot = await getDocs(followingQuery);

      followingIds = followingSnapshot.docs.map(doc => {
        const data = doc.data();
        return data.followingId;
      });

      return followingIds;
    } catch (error) {
      console.error(`Error getting following IDs for user ${userId}:`, error);
      throw new Error(
        `Failed to get following IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get list of followers for a user
   */
  async getFollowerIds(userId: string): Promise<string[]> {
    try {
      let followerIds: string[] = [];

      // Try new social_graph structure first
      try {
        const inboundRef = collection(db, `social_graph/${userId}/inbound`);
        const inboundSnapshot = await getDocs(inboundRef);

        if (!inboundSnapshot.empty) {
          followerIds = inboundSnapshot.docs.map(doc => doc.id);
          return followerIds;
        }
      } catch (__socialGraphError) {
        // If social_graph doesn't exist, fall through to legacy follows
      }

      // Fallback to old follows collection
      const followersQuery = query(
        collection(db, 'follows'),
        where('followingId', '==', userId)
      );
      const followersSnapshot = await getDocs(followersQuery);

      followerIds = followersSnapshot.docs.map(doc => {
        const data = doc.data();
        return data.followerId;
      });

      return followerIds;
    } catch (error) {
      console.error(`Error getting follower IDs for user ${userId}:`, error);
      throw new Error(
        `Failed to get follower IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all group member IDs for groups a user belongs to
   */
  async getGroupMemberIds(userId: string): Promise<string[]> {
    try {
      // Get user's groups
      const membershipsQuery = query(
        collection(db, 'groupMemberships'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const membershipsSnapshot = await getDocs(membershipsQuery);
      const groupIds = membershipsSnapshot.docs.map(doc => doc.data().groupId);

      if (groupIds.length === 0) {
        return [];
      }

      // Get all members from those groups (batch queries due to 'in' limitation)
      const allMemberIds = new Set<string>();

      // Process in batches of 10 (Firestore 'in' limit)
      for (let i = 0; i < groupIds.length; i += 10) {
        const batchGroupIds = groupIds.slice(i, i + 10);

        const groupMembershipsQuery = query(
          collection(db, 'groupMemberships'),
          where('groupId', 'in', batchGroupIds),
          where('status', '==', 'active')
        );

        const groupMembershipsSnapshot = await getDocs(groupMembershipsQuery);
        groupMembershipsSnapshot.docs.forEach(doc => {
          const memberId = doc.data().userId;
          // Don't include the user themselves
          if (memberId !== userId) {
            allMemberIds.add(memberId);
          }
        });
      }

      return Array.from(allMemberIds);
    } catch (error) {
      console.error(
        `Error getting group member IDs for user ${userId}:`,
        error
      );
      throw new Error(
        `Failed to get group member IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if user A follows user B
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const followingIds = await this.getFollowingIds(followerId);
      return followingIds.includes(followingId);
    } catch (error) {
      console.error(
        `Error checking if ${followerId} follows ${followingId}:`,
        error
      );
      return false;
    }
  }
}
