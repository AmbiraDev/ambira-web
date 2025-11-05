/**
 * Fast Following IDs Fetcher
 *
 * Optimized function to fetch ONLY the IDs of users you're following.
 * This is much faster than fetching full user objects since we only need
 * to check if someone is in the following list, not display their info.
 */

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Get just the IDs of users that this user is following
 * Returns a Set for O(1) lookup performance
 */
export async function getFollowingIds(userId: string): Promise<Set<string>> {
  try {
    const followingIds: string[] = [];

    // Try new social_graph structure first (faster)
    try {
      const outboundRef = collection(db, `social_graph/${userId}/outbound`);
      const outboundSnapshot = await getDocs(outboundRef);

      if (!outboundSnapshot.empty) {
        // Just get the document IDs - no need to read data
        return new Set(outboundSnapshot.docs.map(doc => doc.id));
      }
    } catch (_socialGraphError) {
      // If social_graph doesn't exist, continue to fallback
    }

    // Fallback to old follows collection
    const followingQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', userId)
    );
    const followingSnapshot = await getDocs(followingQuery);

    followingSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.followingId) {
        followingIds.push(data.followingId);
      }
    });

    return new Set(followingIds);
  } catch (_err) {
    return new Set(); // Return empty set on error
  }
}
