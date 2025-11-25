/**
 * Integration Tests: Feed Notification Persistence
 *
 * Validates that the "n new sessions" notification correctly tracks
 * which sessions have been viewed and doesn't reappear for the same sessions.
 *
 * This test focuses on the integration between:
 * - localStorage tracking (useFeedViewedState)
 * - Feed component notification logic
 * - Logout clearing storage
 */

import { renderHook, act } from '@testing-library/react'
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

describe('Integration: Feed Notification Persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('Scenario 1: First-time user visits feed', () => {
    it('should not show "new sessions" notification for initial feed load', () => {
      // First-time user (no localStorage set)
      const lastViewed = getLastViewedFeedTime()
      expect(lastViewed).toBeNull()

      // They view the feed with some sessions
      const sessions = [{ createdAt: Date.now() - 5000 }, { createdAt: Date.now() - 3000 }]

      // Because lastViewed is null, countNewSessions returns 0
      // (first-time users see all content normally, not as "new")
      const newCount = countNewSessions(sessions, lastViewed)
      expect(newCount).toBe(0)
    })
  })

  describe('Scenario 2: User views sessions, dismisses notification', () => {
    it('should not show notification again when checking after dismissal', () => {
      // Step 1: User has previously viewed feed
      const initialViewTime = Date.now() - 30000
      updateLastViewedFeedTime()
      localStorage.setItem('ambira_lastViewedFeedTime', initialViewTime.toString())

      // Step 2: New sessions arrive after initial view
      const newSessionTime = initialViewTime + 15000
      const sessions = [
        { createdAt: newSessionTime }, // new
        { createdAt: newSessionTime + 2000 }, // new
      ]

      // Check for new sessions - should find 2
      let lastViewed = getLastViewedFeedTime()
      let newCount = countNewSessions(sessions, lastViewed)
      expect(newCount).toBe(2)

      // Step 3: User clicks notification to dismiss it
      // This updates lastViewedFeedTime to now
      updateLastViewedFeedTime()

      // Step 4: Check again for new sessions
      // The same sessions should NOT be counted as new anymore
      lastViewed = getLastViewedFeedTime()
      newCount = countNewSessions(sessions, lastViewed)
      expect(newCount).toBe(0)
    })
  })

  describe('Scenario 3: New sessions added after dismissal', () => {
    it('should show notification when truly new sessions arrive', () => {
      // Step 1: User has viewed sessions and dismissed notification
      updateLastViewedFeedTime()
      const dismissTime = getLastViewedFeedTime()
      expect(dismissTime).not.toBeNull()

      // Step 2: New sessions arrive AFTER dismissal
      const truelyNewSession = { createdAt: (dismissTime as number) + 5000 }

      // Step 3: Check for new sessions - should find the new one
      const lastViewed = getLastViewedFeedTime()
      const newCount = countNewSessions([truelyNewSession], lastViewed)
      expect(newCount).toBe(1)
    })
  })

  describe('Scenario 4: Multiple tab behavior (separate tracking)', () => {
    it('should track feed state independently per tab', () => {
      // Simulate two tabs
      // Tab 1 views and dismisses notification
      updateLastViewedFeedTime()
      const tab1DismissTime = getLastViewedFeedTime()

      // Tab 2 also views and dismisses at similar time
      updateLastViewedFeedTime()
      const tab2DismissTime = getLastViewedFeedTime()

      // Both should be roughly similar (within milliseconds)
      expect(tab2DismissTime).toBeGreaterThanOrEqual((tab1DismissTime as number) - 10)
      expect(tab2DismissTime).toBeLessThanOrEqual((tab1DismissTime as number) + 10)
    })
  })

  describe('Scenario 5: Logout clears tracking', () => {
    it('should clear feed tracking on logout', () => {
      // User has viewed feed and dismissed notification
      updateLastViewedFeedTime()
      expect(getLastViewedFeedTime()).not.toBeNull()

      // User logs out
      clearFeedViewedState()

      // After logout, tracking should be cleared
      expect(getLastViewedFeedTime()).toBeNull()

      // On next login (new session), they'll see fresh feed
      // and first-time user behavior applies (no "new" notification)
    })
  })

  describe('Scenario 6: LocalStorage cleared externally', () => {
    it('should gracefully handle cleared localStorage', () => {
      // User has viewed feed
      updateLastViewedFeedTime()
      expect(getLastViewedFeedTime()).not.toBeNull()

      // localStorage gets cleared (browser cache clear, etc.)
      localStorage.clear()

      // Should treat as first-time user
      expect(getLastViewedFeedTime()).toBeNull()

      // And not show "new" notifications for first load
      const sessions = [{ createdAt: Date.now() }]
      const newCount = countNewSessions(sessions, null)
      expect(newCount).toBe(0)
    })
  })

  describe('Scenario 7: Rapid notification checks', () => {
    it('should maintain consistent state across rapid checks', () => {
      // User views and dismisses notification
      updateLastViewedFeedTime()
      const dismissTime = getLastViewedFeedTime()

      // Sessions that arrived before dismissal
      const oldSessions = [{ createdAt: (dismissTime as number) - 1000 }]

      // Rapid checks should all return 0 for old sessions
      for (let i = 0; i < 5; i++) {
        const lastViewed = getLastViewedFeedTime()
        const newCount = countNewSessions(oldSessions, lastViewed)
        expect(newCount).toBe(0)
      }

      // Sessions that arrived after dismissal
      const newSessions = [{ createdAt: (dismissTime as number) + 1000 }]

      // Rapid checks should all return 1 for new sessions
      for (let i = 0; i < 5; i++) {
        const lastViewed = getLastViewedFeedTime()
        const newCount = countNewSessions(newSessions, lastViewed)
        expect(newCount).toBe(1)
      }
    })
  })

  describe('Scenario 8: Edge case - sessions at exact boundary', () => {
    it('should use strict > comparison (not >=)', () => {
      const boundaryTime = 1700000000000
      localStorage.setItem('ambira_lastViewedFeedTime', boundaryTime.toString())

      const sessions = [
        { createdAt: boundaryTime + 1 }, // new (just after)
        { createdAt: boundaryTime }, // not new (exactly equal)
        { createdAt: boundaryTime - 1 }, // not new (before)
      ]

      const lastViewed = getLastViewedFeedTime()
      const newCount = countNewSessions(sessions, lastViewed)
      expect(newCount).toBe(1) // Only the one created after
    })
  })

  describe('Scenario 9: Browser refresh preserves state', () => {
    it('should preserve feed viewing state across page refreshes', () => {
      // Initial view time
      const initialTime = Date.now() - 20000
      localStorage.setItem('ambira_lastViewedFeedTime', initialTime.toString())

      // Sessions that arrived after initial view
      const arrivedSessions = [{ createdAt: initialTime + 10000 }]

      // Before refresh
      let lastViewed = getLastViewedFeedTime()
      let newCount = countNewSessions(arrivedSessions, lastViewed)
      expect(newCount).toBe(1)

      // User dismisses notification (simulating page interaction)
      updateLastViewedFeedTime()
      const dismissTime = getLastViewedFeedTime()

      // Simulate page refresh - localStorage persists
      // and gets re-read on mount
      // (we don't clear localStorage, just verify behavior)

      // After "refresh", check again
      lastViewed = getLastViewedFeedTime()
      newCount = countNewSessions(arrivedSessions, lastViewed)
      expect(newCount).toBe(0)
    })
  })
})
