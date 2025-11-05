/**
 * useFollowing Hook
 *
 * Fetches the list of users that a given user is following.
 */

import { useQuery } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { STANDARD_CACHE_TIMES } from '@/lib/react-query';

export interface FollowingUser {
  id: string;
  name: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
}

export function useFollowing(userId: string) {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      // Try new social_graph structure first
      try {
        const outboundRef = collection(db, `social_graph/${userId}/outbound`);
        const outboundSnapshot = await getDocs(outboundRef);

        if (!outboundSnapshot.empty) {
          // Fetch user details for each following
          const followingPromises = outboundSnapshot.docs.map(
            async followingDoc => {
              const followingId = followingDoc.id;

              try {
                const userDoc = await getDoc(doc(db, 'users', followingId));

                if (!userDoc.exists()) {
                  return null;
                }

                const userData = userDoc.data();

                return {
                  id: followingId,
                  name: userData.name || 'Unknown User',
                  username: userData.username || 'unknown',
                  email: userData.email || '',
                  profilePicture: userData.profilePicture,
                  bio: userData.bio,
                } as FollowingUser;
              } catch (_err) {
                // Failed to fetch following user
                return null;
              }
            }
          );

          const following = await Promise.all(followingPromises);
          return following.filter(
            (user): user is FollowingUser => user !== null
          );
        }
      } catch (_err) {
        // If social_graph doesn't exist, fall through to old follows collection
      }

      // Fallback to old follows collection
      const followsRef = collection(db, 'follows');
      const followsQuery = query(followsRef, where('followerId', '==', userId));
      const followsSnapshot = await getDocs(followsQuery);

      const followingPromises = followsSnapshot.docs.map(async followDoc => {
        const followingId = followDoc.data().followingId;

        try {
          const userDoc = await getDoc(doc(db, 'users', followingId));

          if (!userDoc.exists()) {
            return null;
          }

          const userData = userDoc.data();

          return {
            id: followingId,
            name: userData.name || 'Unknown User',
            username: userData.username || 'unknown',
            email: userData.email || '',
            profilePicture: userData.profilePicture,
            bio: userData.bio,
          } as FollowingUser;
        } catch (_err) {
          // Failed to fetch following user
          return null;
        }
      });

      const following = await Promise.all(followingPromises);
      return following.filter((user): user is FollowingUser => user !== null);
    },
    staleTime: STANDARD_CACHE_TIMES.MEDIUM, // 5 minutes
    enabled: !!userId,
  });
}
