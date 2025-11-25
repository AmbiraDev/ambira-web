/**
 * useFeedViewedState Hook
 *
 * Tracks which sessions have been viewed by the user using localStorage.
 * This prevents "n new sessions" notification from repeatedly showing the same sessions.
 *
 * IMPLEMENTATION STRATEGY:
 * - Stores timestamp of most recent viewed session in localStorage
 * - Compares incoming sessions against this timestamp
 * - Updates timestamp when user dismisses notification or views sessions
 * - Clears on logout via clearFeedViewedState()
 *
 * KEY DECISIONS:
 * - Uses timestamp instead of session IDs for simpler logic and better UX
 * - New sessions = sessions created AFTER lastViewedSessionTime
 * - Updates on dismissal, not on scroll (simpler implementation, still effective)
 */

const FEED_VIEWED_KEY = 'ambira_lastViewedFeedTime'

/**
 * Get the timestamp of the last viewed feed session
 * Returns null if never viewed (first time user)
 */
export function getLastViewedFeedTime(): number | null {
  if (typeof window === 'undefined') {
    return null // SSR safety
  }

  const stored = localStorage.getItem(FEED_VIEWED_KEY)
  return stored ? parseInt(stored, 10) : null
}

/**
 * Update the last viewed feed time to now
 * Call this when user dismisses the "new sessions" notification
 */
export function updateLastViewedFeedTime(): void {
  if (typeof window === 'undefined') {
    return // SSR safety
  }

  const now = Date.now()
  localStorage.setItem(FEED_VIEWED_KEY, now.toString())
}

/**
 * Clear the last viewed feed time
 * Call this on logout
 */
export function clearFeedViewedState(): void {
  if (typeof window === 'undefined') {
    return // SSR safety
  }

  localStorage.removeItem(FEED_VIEWED_KEY)
}

/**
 * Count how many sessions are "new" (created after lastViewedTime)
 * A session is new if its createdAt timestamp is after the lastViewedTime
 *
 * @param sessions - Array of sessions to check
 * @param lastViewedTime - Timestamp of last viewed session, or null for first-time users
 * @returns Number of sessions newer than lastViewedTime
 */
export function countNewSessions(
  sessions: Array<{ createdAt?: number | { seconds?: number; nanoseconds?: number } | Date }>,
  lastViewedTime: number | null
): number {
  // First-time user: treat as no new sessions
  // (they'll see all content normally, not as "new")
  if (lastViewedTime === null) {
    return 0
  }

  return sessions.filter((session) => {
    // Extract timestamp from various Firestore formats
    let sessionTime = 0

    if (session.createdAt) {
      if (typeof session.createdAt === 'number') {
        // Already a timestamp
        sessionTime = session.createdAt
      } else if (session.createdAt instanceof Date) {
        // JavaScript Date
        sessionTime = session.createdAt.getTime()
      } else if (
        typeof session.createdAt === 'object' &&
        'seconds' in session.createdAt &&
        typeof session.createdAt.seconds === 'number'
      ) {
        // Firestore Timestamp object: { seconds, nanoseconds }
        sessionTime = session.createdAt.seconds * 1000
      }
    }

    // Session is new if created after lastViewedTime
    return sessionTime > lastViewedTime
  }).length
}
