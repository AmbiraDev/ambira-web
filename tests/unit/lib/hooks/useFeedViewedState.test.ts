/**
 * Tests for useFeedViewedState utility
 * Validates localStorage tracking of last viewed feed sessions
 */

import {
  getLastViewedFeedTime,
  updateLastViewedFeedTime,
  clearFeedViewedState,
  countNewSessions,
} from '@/lib/hooks/useFeedViewedState'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useFeedViewedState', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('getLastViewedFeedTime', () => {
    it('should return null when localStorage is empty', () => {
      const result = getLastViewedFeedTime()
      expect(result).toBeNull()
    })

    it('should return stored timestamp', () => {
      const testTime = 1700000000000
      localStorage.setItem('ambira_lastViewedFeedTime', testTime.toString())

      const result = getLastViewedFeedTime()
      expect(result).toBe(testTime)
    })

    it('should parse stored string as number', () => {
      localStorage.setItem('ambira_lastViewedFeedTime', '1700000000000')

      const result = getLastViewedFeedTime()
      expect(typeof result).toBe('number')
      expect(result).toBe(1700000000000)
    })
  })

  describe('updateLastViewedFeedTime', () => {
    it('should store current timestamp in localStorage', () => {
      const beforeTime = Date.now()
      updateLastViewedFeedTime()
      const afterTime = Date.now()

      const stored = parseInt(localStorage.getItem('ambira_lastViewedFeedTime') || '0', 10)

      expect(stored).toBeGreaterThanOrEqual(beforeTime)
      expect(stored).toBeLessThanOrEqual(afterTime)
    })

    it('should overwrite previous timestamp', () => {
      localStorage.setItem('ambira_lastViewedFeedTime', '1700000000000')
      const newTime = Date.now()
      updateLastViewedFeedTime()

      const stored = parseInt(localStorage.getItem('ambira_lastViewedFeedTime') || '0', 10)
      expect(stored).toBeGreaterThan(1700000000000)
      expect(stored).toBeGreaterThanOrEqual(newTime)
    })
  })

  describe('clearFeedViewedState', () => {
    it('should remove localStorage entry', () => {
      localStorage.setItem('ambira_lastViewedFeedTime', '1700000000000')
      clearFeedViewedState()

      expect(localStorage.getItem('ambira_lastViewedFeedTime')).toBeNull()
    })

    it('should be idempotent (safe to call multiple times)', () => {
      localStorage.setItem('ambira_lastViewedFeedTime', '1700000000000')
      clearFeedViewedState()
      clearFeedViewedState() // Should not error

      expect(localStorage.getItem('ambira_lastViewedFeedTime')).toBeNull()
    })
  })

  describe('countNewSessions', () => {
    const baseTime = 1700000000000

    it('should return 0 for first-time users (null lastViewedTime)', () => {
      const sessions = [
        { createdAt: baseTime },
        { createdAt: baseTime + 1000 },
        { createdAt: baseTime + 2000 },
      ]

      const count = countNewSessions(sessions, null)
      expect(count).toBe(0)
    })

    it('should count sessions created after lastViewedTime', () => {
      const lastViewed = baseTime
      const sessions = [
        { createdAt: baseTime + 5000 }, // new
        { createdAt: baseTime + 3000 }, // new
        { createdAt: baseTime }, // not new (equal)
        { createdAt: baseTime - 1000 }, // not new
      ]

      const count = countNewSessions(sessions, lastViewed)
      expect(count).toBe(2)
    })

    it('should handle Date objects', () => {
      const lastViewed = baseTime
      const sessions = [
        { createdAt: new Date(baseTime + 5000) }, // new
        { createdAt: new Date(baseTime - 1000) }, // not new
      ]

      const count = countNewSessions(sessions, lastViewed)
      expect(count).toBe(1)
    })

    it('should handle Firestore Timestamp objects', () => {
      const lastViewed = baseTime
      const sessions = [
        { createdAt: { seconds: baseTime / 1000 + 5, nanoseconds: 0 } }, // new
        { createdAt: { seconds: baseTime / 1000 - 1, nanoseconds: 0 } }, // not new
      ]

      const count = countNewSessions(sessions, lastViewed)
      expect(count).toBe(1)
    })

    it('should handle missing createdAt gracefully', () => {
      const lastViewed = baseTime
      const sessions = [
        { createdAt: baseTime + 5000 },
        {} as any, // no createdAt
        { createdAt: baseTime - 1000 },
      ]

      const count = countNewSessions(sessions, lastViewed)
      expect(count).toBe(1)
    })

    it('should handle empty sessions array', () => {
      const count = countNewSessions([], baseTime)
      expect(count).toBe(0)
    })

    it('should handle zero sessions newer than lastViewedTime', () => {
      const lastViewed = baseTime
      const sessions = [{ createdAt: baseTime - 5000 }, { createdAt: baseTime - 3000 }]

      const count = countNewSessions(sessions, lastViewed)
      expect(count).toBe(0)
    })

    it('should use > comparison (not >=)', () => {
      const lastViewed = baseTime
      const sessions = [
        { createdAt: baseTime + 1 }, // new
        { createdAt: baseTime }, // not new (equal)
        { createdAt: baseTime - 1 }, // not new
      ]

      const count = countNewSessions(sessions, lastViewed)
      expect(count).toBe(1)
    })
  })

  describe('Integration scenario: Full workflow', () => {
    it('should track first view and detect subsequent new sessions', () => {
      // Step 1: First time user - no lastViewedTime
      let lastViewed = getLastViewedFeedTime()
      expect(lastViewed).toBeNull()

      // Step 2: User views initial sessions (in the past)
      const initialTime = Date.now() - 10000
      localStorage.setItem('ambira_lastViewedFeedTime', initialTime.toString())

      // Step 3: New sessions arrive (in the future relative to initialTime)
      const newSessions = [
        { createdAt: initialTime + 5000 }, // new (5 seconds after initial)
        { createdAt: initialTime + 3000 }, // new (3 seconds after initial)
      ]

      lastViewed = getLastViewedFeedTime()
      expect(lastViewed).not.toBeNull()

      const newCount = countNewSessions(newSessions, lastViewed)
      expect(newCount).toBe(2)

      // Step 4: User dismisses notification (updates lastViewedTime to now)
      const dismissTime = Date.now() + 10000 // Set time far in the future
      localStorage.setItem('ambira_lastViewedFeedTime', dismissTime.toString())

      // Step 5: Check again - no new sessions (because dismissTime is after all session times)
      lastViewed = getLastViewedFeedTime()
      const subsequentCount = countNewSessions(newSessions, lastViewed)
      expect(subsequentCount).toBe(0)
    })

    it('should clear on logout', () => {
      updateLastViewedFeedTime()
      expect(getLastViewedFeedTime()).not.toBeNull()

      clearFeedViewedState()
      expect(getLastViewedFeedTime()).toBeNull()
    })
  })
})
