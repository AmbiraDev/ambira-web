/**
 * useUserLevel Hook
 *
 * Fetches user's total hours and calculates their level.
 * Uses Firebase sessions to compute total logged hours.
 */

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { calculateLevel, LevelInfo } from '@/lib/utils/levelCalculator'

interface UseUserLevelResult {
  levelInfo: LevelInfo | null
  isLoading: boolean
  error: Error | null
}

export function useUserLevel(userId: string | undefined): UseUserLevelResult {
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchTotalHours = async () => {
      try {
        setIsLoading(true)

        // Query all sessions for this user
        const sessionsQuery = query(collection(db, 'sessions'), where('userId', '==', userId))

        const snapshot = await getDocs(sessionsQuery)

        // Calculate total hours from all sessions
        let totalSeconds = 0
        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          // Duration is stored in seconds
          if (data.duration && typeof data.duration === 'number') {
            totalSeconds += data.duration
          }
        })

        const totalHours = totalSeconds / 3600
        const level = calculateLevel(totalHours)

        setLevelInfo(level)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user level'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchTotalHours()
  }, [userId])

  return { levelInfo, isLoading, error }
}
