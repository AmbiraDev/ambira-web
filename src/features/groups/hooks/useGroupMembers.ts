/**
 * useGroupMembers Hook
 *
 * Fetches and manages group member data with their profiles.
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

export interface GroupMember {
  id: string;
  name: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  joinedAt: Date;
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      // Fetch group memberships
      const membershipsRef = collection(db, 'groupMemberships');
      const q = query(
        membershipsRef,
        where('groupId', '==', groupId),
        where('status', '==', 'active')
      );

      const membershipsSnapshot = await getDocs(q);

      // Fetch user details for each member
      const memberPromises = membershipsSnapshot.docs.map(
        async membershipDoc => {
          const membershipData = membershipDoc.data();
          const userId = membershipData.userId;

          try {
            const userDoc = await getDoc(doc(db, 'users', userId));

            if (!userDoc.exists()) {
              return null;
            }

            const userData = userDoc.data();

            return {
              id: userId,
              name: userData.name || 'Unknown User',
              username: userData.username || 'unknown',
              email: userData.email || '',
              profilePicture: userData.profilePicture,
              bio: userData.bio,
              joinedAt: membershipData.joinedAt?.toDate() || new Date(),
            } as GroupMember;
          } catch (_err) {
            // Failed to fetch user
            console.error('Failed to fetch user:', _err);
            return null;
          }
        }
      );

      const members = await Promise.all(memberPromises);

      // Filter out null values (deleted/inaccessible users)
      return members.filter((member): member is GroupMember => member !== null);
    },
    staleTime: STANDARD_CACHE_TIMES.MEDIUM, // 5 minutes
    enabled: !!groupId,
  });
}
