/**
 * useGroupLeaderboard Hook
 *
 * Fetches and manages group leaderboard data based on member activity.
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

export interface LeaderboardEntry {
  userId: string;
  name: string;
  username: string;
  profilePicture?: string;
  totalHours: number;
  sessionCount: number;
  rank: number;
}

export function useGroupLeaderboard(
  groupId: string,
  timeframe: 'week' | 'month' | 'allTime' = 'allTime'
) {
  return useQuery({
    queryKey: ['group-leaderboard', groupId, timeframe],
    queryFn: async () => {
      // Fetch group memberships
      const membershipsRef = collection(db, 'groupMemberships');
      const membershipsQuery = query(
        membershipsRef,
        where('groupId', '==', groupId),
        where('status', '==', 'active')
      );

      const membershipsSnapshot = await getDocs(membershipsQuery);
      const memberIds = membershipsSnapshot.docs.map(doc => doc.data().userId);

      if (memberIds.length === 0) {
        return [];
      }

      // Calculate date range based on timeframe
      let startDate: Date | undefined;
      const now = new Date();

      if (timeframe === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeframe === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Fetch sessions for each member
      const leaderboardPromises = memberIds.map(async userId => {
        try {
          // Fetch user data
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (!userDoc.exists()) {
            return null;
          }

          const userData = userDoc.data();

          // Fetch sessions
          const sessionsRef = collection(db, 'sessions');
          let sessionsQuery = query(sessionsRef, where('userId', '==', userId));

          // Add date filter if needed
          if (startDate) {
            sessionsQuery = query(
              sessionsRef,
              where('userId', '==', userId),
              where('createdAt', '>=', startDate)
            );
          }

          const sessionsSnapshot = await getDocs(sessionsQuery);

          // Calculate total hours and session count
          let totalSeconds = 0;
          let sessionCount = 0;

          sessionsSnapshot.docs.forEach(sessionDoc => {
            const sessionData = sessionDoc.data();
            totalSeconds += sessionData.duration || 0;
            sessionCount++;
          });

          const totalHours = totalSeconds / 3600;

          return {
            userId,
            name: userData.name || 'Unknown User',
            username: userData.username || 'unknown',
            profilePicture: userData.profilePicture,
            totalHours,
            sessionCount,
            rank: 0, // Will be set after sorting
          } as LeaderboardEntry;
        } catch (error) {
          console.warn(
            `Failed to fetch leaderboard data for user ${userId}:`,
            error
          );
          return null;
        }
      });

      const leaderboardData = await Promise.all(leaderboardPromises);

      // Filter out null values and sort by total hours
      const validEntries = leaderboardData
        .filter((entry): entry is LeaderboardEntry => entry !== null)
        .sort((a, b) => b.totalHours - a.totalHours);

      // Assign ranks
      validEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return validEntries;
    },
    staleTime: STANDARD_CACHE_TIMES.SHORT, // 1 minute - leaderboard data changes frequently
    enabled: !!groupId,
  });
}
