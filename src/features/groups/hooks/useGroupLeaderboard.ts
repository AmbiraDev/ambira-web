/**
 * useGroupLeaderboard Hook
 *
 * Fetches and manages group leaderboard data based on member activity.
 *
 * OPTIMIZATION: Uses batched queries to avoid N+1 query problem
 * - Batches user document fetches (max 10 IDs per query using 'in' operator)
 * - Batches session queries (max 10 user IDs per query using 'in' operator)
 * - For 50 members: ~5 user queries + ~5 session queries = ~10 reads (vs 100+ before)
 */

import { useQuery } from '@tanstack/react-query'
import { collection, query, where, getDocs, getDoc, doc, documentId } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { debug } from '@/lib/debug'
import { STANDARD_CACHE_TIMES } from '@/lib/react-query'

export interface LeaderboardEntry {
  userId: string
  name: string
  username: string
  profilePicture?: string
  totalHours: number
  sessionCount: number
  rank: number
}

/**
 * Splits an array into chunks of specified size
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function useGroupLeaderboard(
  groupId: string,
  timeframe: 'week' | 'month' | 'allTime' = 'allTime'
) {
  return useQuery({
    queryKey: ['group-leaderboard', groupId, timeframe],
    queryFn: async () => {
      // Fetch group document to get member IDs
      const groupDoc = await getDoc(doc(db, 'groups', groupId))

      if (!groupDoc.exists()) {
        return []
      }

      const groupData = groupDoc.data()
      const memberIds = groupData.memberIds || []

      if (memberIds.length === 0) {
        return []
      }

      // Calculate date range based on timeframe
      let startDate: Date | undefined
      const now = new Date()

      if (timeframe === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (timeframe === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      // OPTIMIZATION 1: Batch fetch user documents
      // Firestore 'in' operator supports max 10 values per query
      // Split memberIds into chunks of 10 and fetch in parallel
      const userChunks = chunkArray(memberIds, 10)
      const userBatchPromises = userChunks.map(async (chunk) => {
        const usersRef = collection(db, 'users')
        const usersQuery = query(usersRef, where(documentId(), 'in', chunk))
        const snapshot = await getDocs(usersQuery)
        return snapshot.docs
      })

      const userDocsArrays = await Promise.all(userBatchPromises)
      const allUserDocs = userDocsArrays.flat()

      // Create a map of userId -> userData for fast lookup
      const userDataMap = new Map(allUserDocs.map((doc) => [doc.id, doc.data()]))

      // OPTIMIZATION 2: Batch fetch sessions for all members
      // Split memberIds into chunks of 10 and fetch sessions in parallel
      const sessionChunks = chunkArray(memberIds, 10)
      const sessionBatchPromises = sessionChunks.map(async (chunk) => {
        const sessionsRef = collection(db, 'sessions')

        // Build query with userId filter and optional date filter
        let sessionsQuery = query(sessionsRef, where('userId', 'in', chunk))

        if (startDate) {
          sessionsQuery = query(
            sessionsRef,
            where('userId', 'in', chunk),
            where('createdAt', '>=', startDate)
          )
        }

        const snapshot = await getDocs(sessionsQuery)
        return snapshot.docs
      })

      const sessionDocsArrays = await Promise.all(sessionBatchPromises)
      const allSessionDocs = sessionDocsArrays.flat()

      // Group sessions by userId for aggregation
      const sessionsByUser = new Map<string, any[]>()
      allSessionDocs.forEach((doc) => {
        const sessionData = doc.data()
        const userId = sessionData.userId

        if (!sessionsByUser.has(userId)) {
          sessionsByUser.set(userId, [])
        }
        sessionsByUser.get(userId)!.push(sessionData)
      })

      // Build leaderboard entries from batched data
      const leaderboardEntries: LeaderboardEntry[] = []

      for (const userId of memberIds) {
        try {
          const userData = userDataMap.get(userId)

          // Skip if user doesn't exist
          if (!userData) {
            continue
          }

          const userSessions = sessionsByUser.get(userId) || []

          // Calculate total hours and session count
          let totalSeconds = 0
          let sessionCount = 0

          userSessions.forEach((sessionData) => {
            totalSeconds += sessionData.duration || 0
            sessionCount++
          })

          const totalHours = totalSeconds / 3600

          leaderboardEntries.push({
            userId,
            name: userData.name || 'Unknown User',
            username: userData.username || 'unknown',
            profilePicture: userData.profilePicture,
            totalHours,
            sessionCount,
            rank: 0, // Will be set after sorting
          })
        } catch (err) {
          // Failed to process leaderboard data for user - skip and continue
          debug.warn(
            `Failed to fetch leaderboard data for user ${userId}:`,
            err instanceof Error ? err.message : String(err)
          )
          continue
        }
      }

      // Sort by total hours (descending)
      leaderboardEntries.sort((a, b) => b.totalHours - a.totalHours)

      // Assign ranks
      leaderboardEntries.forEach((entry, index) => {
        entry.rank = index + 1
      })

      return leaderboardEntries
    },
    staleTime: STANDARD_CACHE_TIMES.SHORT, // 1 minute - leaderboard data changes frequently
    enabled: !!groupId,
  })
}
