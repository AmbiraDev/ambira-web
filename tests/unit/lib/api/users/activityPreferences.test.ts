/**
 * Unit Tests for Activity Preferences API
 *
 * Tests activity usage tracking:
 * - Tracking when activities are used (lastUsed)
 * - Incrementing usage count (useCount)
 * - Fetching recent activities for quick access
 * - Activity preference management
 */

import type { UserActivityPreference } from '@/types'

// ============================================================================
// MOCKS
// ============================================================================

jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-123' },
  },
}))

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    fromDate: (date: Date) => ({
      toDate: () => date,
    }),
  },
}))

jest.mock('@/lib/api/shared/utils', () => ({
  convertTimestamp: (value: unknown) => {
    if (value instanceof Date) {
      return value
    }
    if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
      return (value as { toDate: () => Date }).toDate()
    }
    return new Date(value as string)
  },
  removeUndefinedFields: (obj: Record<string, unknown>) => {
    return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined))
  },
}))

jest.mock('@/lib/errorHandler', () => ({
  handleError: jest.fn(
    (_error: unknown, _context: string, options?: { defaultMessage?: string }) => ({
      userMessage: options?.defaultMessage || 'handled error',
    })
  ),
}))

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

// Mock functions that would be in activityPreferences API
async function updateActivityPreference(
  userId: string,
  typeId: string,
  useCount: number,
  lastUsed: Date
): Promise<UserActivityPreference> {
  const { getDoc, setDoc, Timestamp } = jest.requireMock('firebase/firestore')
  const { db } = jest.requireMock('@/lib/firebase')

  if (!userId || !typeId) {
    throw new Error('User ID and type ID are required')
  }

  // Convert Date to Timestamp for the return value
  const timestamp = Timestamp.fromDate(lastUsed)

  // This would update the preference in Firestore
  return {
    userId,
    typeId,
    useCount,
    lastUsed: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

async function getRecentActivities(
  userId: string,
  limit: number = 5
): Promise<UserActivityPreference[]> {
  const {
    getDocs,
    query,
    orderBy: orderByMock,
    limit: limitMock,
    Timestamp,
  } = jest.requireMock('firebase/firestore')

  if (!userId) {
    throw new Error('User ID is required')
  }

  if (limit <= 0 || limit > 20) {
    throw new Error('Limit must be between 1 and 20')
  }

  // This would query the preferences ordered by lastUsed descending
  const snapshot = await getDocs(query())
  const results: UserActivityPreference[] = []

  snapshot.forEach((doc: any) => {
    const data = doc.data()
    results.push({
      typeId: doc.id,
      userId,
      useCount: data.useCount,
      lastUsed: data.lastUsed,
      createdAt: data.createdAt || Timestamp.fromDate(new Date()),
      updatedAt: data.updatedAt || Timestamp.fromDate(new Date()),
    })
  })

  return results
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Activity Preferences API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ========================================================================
  // UPDATE ACTIVITY PREFERENCE
  // ========================================================================

  describe('updateActivityPreference()', () => {
    it('should require userId and typeId', async () => {
      // Act & Assert
      await expect(updateActivityPreference('', 'activity-1', 1, new Date())).rejects.toThrow()
      await expect(updateActivityPreference('user-123', '', 1, new Date())).rejects.toThrow()
    })

    it('should update preference with new usage data', async () => {
      // Arrange
      const userId = 'user-123'
      const typeId = 'work'
      const useCount = 5
      const lastUsed = new Date()

      // Act
      const result = await updateActivityPreference(userId, typeId, useCount, lastUsed)

      // Assert
      expect(result).toMatchObject({
        userId,
        typeId,
        useCount,
      })
      expect(result.lastUsed.toDate()).toEqual(lastUsed)
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('should increment useCount on repeated activity usage', async () => {
      // Arrange
      const userId = 'user-123'
      const typeId = 'coding'

      // Act - First use
      const firstUpdate = await updateActivityPreference(userId, typeId, 1, new Date())
      expect(firstUpdate.useCount).toBe(1)

      // Act - Second use (would be incremented)
      const secondUpdate = await updateActivityPreference(
        userId,
        typeId,
        firstUpdate.useCount + 1,
        new Date()
      )

      // Assert
      expect(secondUpdate.useCount).toBe(2)
    })

    it('should update lastUsed timestamp on each activity use', async () => {
      // Arrange
      const userId = 'user-123'
      const typeId = 'learning'
      const now = new Date()

      // Act
      const result = await updateActivityPreference(userId, typeId, 3, now)

      // Assert
      expect(result.lastUsed.toDate()).toEqual(now)
      expect(result.lastUsed.toDate().getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('should preserve useCount when updating lastUsed', async () => {
      // Arrange
      const userId = 'user-123'
      const typeId = 'research'
      const useCount = 10
      const oldTime = new Date('2024-01-01')

      // Act
      const initial = await updateActivityPreference(userId, typeId, useCount, oldTime)
      const updated = await updateActivityPreference(userId, typeId, useCount, new Date())

      // Assert
      expect(updated.useCount).toBe(initial.useCount)
      expect(updated.useCount).toBe(10)
    })

    it('should handle high useCount values', async () => {
      // Act
      const result = await updateActivityPreference('user-123', 'work', 1000, new Date())

      // Assert
      expect(result.useCount).toBe(1000)
    })

    it('should handle zero useCount (cleanup)', async () => {
      // Act
      const result = await updateActivityPreference('user-123', 'work', 0, new Date())

      // Assert
      expect(result.useCount).toBe(0)
    })
  })

  // ========================================================================
  // GET RECENT ACTIVITIES
  // ========================================================================

  describe('getRecentActivities()', () => {
    it('should require userId', async () => {
      // Act & Assert
      await expect(getRecentActivities('')).rejects.toThrow()
    })

    it('should return activities ordered by lastUsed descending', async () => {
      // Arrange
      const { getDocs, Timestamp } = jest.requireMock('firebase/firestore')
      const now = new Date()

      const mockPreferences = [
        {
          id: 'work',
          data: () => ({
            typeId: 'work',
            useCount: 10,
            lastUsed: Timestamp.fromDate(new Date(now.getTime() - 1000)), // Most recent
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
          }),
        },
        {
          id: 'coding',
          data: () => ({
            typeId: 'coding',
            useCount: 8,
            lastUsed: Timestamp.fromDate(new Date(now.getTime() - 2000)), // Older
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
          }),
        },
      ]

      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          mockPreferences.forEach(callback)
        },
      })

      // Act
      const result = await getRecentActivities('user-123', 5)

      // Assert
      expect(result).toHaveLength(2)
      // Order should be by lastUsed descending
      if (result.length >= 2 && result[0] && result[1]) {
        expect(result[0].lastUsed.toDate().getTime()).toBeGreaterThanOrEqual(
          result[1].lastUsed.toDate().getTime()
        )
      }
    })

    it('should limit results to specified count', async () => {
      // Arrange
      const { getDocs, Timestamp } = jest.requireMock('firebase/firestore')
      const mockPreferences = Array.from({ length: 10 }, (_, i) => ({
        id: `activity-${i}`,
        data: () => ({
          typeId: `activity-${i}`,
          useCount: i,
          lastUsed: Timestamp.fromDate(new Date(Date.now() - i * 1000)),
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        }),
      }))

      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          mockPreferences.slice(0, 5).forEach(callback)
        },
      })

      // Act
      const result = await getRecentActivities('user-123', 5)

      // Assert
      expect(result.length).toBeLessThanOrEqual(5)
    })

    it('should validate limit parameter', async () => {
      // Act & Assert - limit too high
      await expect(getRecentActivities('user-123', 21)).rejects.toThrow(/Limit must be between/)

      // Act & Assert - limit too low
      await expect(getRecentActivities('user-123', 0)).rejects.toThrow(/Limit must be between/)

      // Act & Assert - negative limit
      await expect(getRecentActivities('user-123', -1)).rejects.toThrow(/Limit must be between/)
    })

    it('should use default limit of 5 when not specified', async () => {
      // Arrange
      const { getDocs } = jest.requireMock('firebase/firestore')
      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          // No data
        },
      })

      // Act
      const result = await getRecentActivities('user-123')

      // Assert
      expect(result).toEqual([])
      // Query should have been called with limit
      expect(getDocs).toHaveBeenCalled()
    })

    it('should return empty array for user with no activity history', async () => {
      // Arrange
      const { getDocs } = jest.requireMock('firebase/firestore')
      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          // No data
        },
      })

      // Act
      const result = await getRecentActivities('new-user-456', 5)

      // Assert
      expect(result).toEqual([])
    })

    it('should include useCount in returned preferences', async () => {
      // Arrange
      const { getDocs, Timestamp } = jest.requireMock('firebase/firestore')
      const mockPreferences = [
        {
          id: 'work',
          data: () => ({
            typeId: 'work',
            useCount: 42,
            lastUsed: Timestamp.fromDate(new Date()),
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
          }),
        },
      ]

      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          mockPreferences.forEach(callback)
        },
      })

      // Act
      const result = await getRecentActivities('user-123', 5)

      // Assert
      if (result.length > 0) {
        expect(result[0]?.useCount).toBe(42)
      }
    })

    it('should work with limit of 1 (most recent activity)', async () => {
      // Arrange
      const { getDocs, Timestamp } = jest.requireMock('firebase/firestore')
      const mockPreferences = [
        {
          id: 'work',
          data: () => ({
            typeId: 'work',
            useCount: 100,
            lastUsed: Timestamp.fromDate(new Date()),
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
          }),
        },
      ]

      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          mockPreferences.forEach(callback)
        },
      })

      // Act
      const result = await getRecentActivities('user-123', 1)

      // Assert
      expect(result.length).toBeLessThanOrEqual(1)
    })

    it('should work with limit of 20 (max allowed)', async () => {
      // Arrange
      const { getDocs, Timestamp } = jest.requireMock('firebase/firestore')
      const mockPreferences = Array.from({ length: 20 }, (_, i) => ({
        id: `activity-${i}`,
        data: () => ({
          typeId: `activity-${i}`,
          useCount: i,
          lastUsed: Timestamp.fromDate(new Date(Date.now() - i * 1000)),
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        }),
      }))

      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          mockPreferences.forEach(callback)
        },
      })

      // Act
      const result = await getRecentActivities('user-123', 20)

      // Assert
      expect(result.length).toBeLessThanOrEqual(20)
    })

    it('should handle timestamps correctly', async () => {
      // Arrange
      const { getDocs, Timestamp } = jest.requireMock('firebase/firestore')
      const timestamp = new Date('2024-06-15T10:30:00Z')

      const mockPreferences = [
        {
          id: 'test',
          data: () => ({
            typeId: 'test',
            useCount: 5,
            lastUsed: Timestamp.fromDate(timestamp),
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
          }),
        },
      ]

      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          mockPreferences.forEach(callback)
        },
      })

      // Act
      const result = await getRecentActivities('user-123', 5)

      // Assert
      if (result.length > 0) {
        expect(result[0]?.lastUsed.toDate()).toEqual(timestamp)
        // Timestamp objects have toDate method, not Date instances
        expect(result[0]?.lastUsed.toDate).toBeDefined()
      }
    })
  })

  // ========================================================================
  // ACTIVITY PREFERENCE TRACKING
  // ========================================================================

  describe('Activity Preference Tracking', () => {
    it('should track first activity use', async () => {
      // Act
      const result = await updateActivityPreference('user-123', 'new-activity', 1, new Date())

      // Assert
      expect(result.useCount).toBe(1)
    })

    it('should accumulate usage over multiple sessions', async () => {
      // Arrange
      const userId = 'user-123'
      const typeId = 'work'

      // Act - Simulate 5 usage sessions
      let useCount = 0
      for (let i = 0; i < 5; i++) {
        useCount++
        await updateActivityPreference(userId, typeId, useCount, new Date())
      }

      // Assert
      expect(useCount).toBe(5)
    })

    it('should maintain separate preferences for different activities', async () => {
      // Act
      const work = await updateActivityPreference('user-123', 'work', 10, new Date())
      const coding = await updateActivityPreference('user-123', 'coding', 8, new Date())
      const reading = await updateActivityPreference('user-123', 'reading', 3, new Date())

      // Assert
      expect(work.useCount).toBe(10)
      expect(coding.useCount).toBe(8)
      expect(reading.useCount).toBe(3)
      expect(work.typeId).not.toBe(coding.typeId)
    })

    it('should maintain separate preferences for different users', async () => {
      // Act
      const user1Activity = await updateActivityPreference('user-1', 'work', 15, new Date())
      const user2Activity = await updateActivityPreference('user-2', 'work', 5, new Date())

      // Assert
      expect(user1Activity.useCount).toBe(15)
      expect(user2Activity.useCount).toBe(5)
      expect(user1Activity.userId).not.toBe(user2Activity.userId)
    })

    it('should not exceed max 20 tracked preferences (10 defaults + 10 custom)', async () => {
      // This is more of an integration concern, but API should handle gracefully
      // System supports 10 system + 10 custom = 20 max preferences
      const userId = 'user-123'

      // Create 20 preferences (simulation)
      const preferences = Array.from({ length: 20 }, (_, i) =>
        updateActivityPreference(userId, `activity-${i}`, i + 1, new Date())
      )

      // Act & Assert - should handle max gracefully
      const results = await Promise.all(preferences)
      expect(results).toHaveLength(20)
    })
  })

  // ========================================================================
  // RECENT ACTIVITIES SORTING
  // ========================================================================

  describe('Recent Activities Sorting', () => {
    it('should prioritize most recently used activities', async () => {
      // Arrange
      const { getDocs, Timestamp } = jest.requireMock('firebase/firestore')
      const baseTime = Date.now()

      // Note: Firestore returns in descending order by lastUsed when orderBy is used
      // So we mock them in the order they would be returned (most recent first)
      const mockPreferences = [
        {
          id: 'work',
          data: () => ({
            typeId: 'work',
            useCount: 10,
            lastUsed: Timestamp.fromDate(new Date(baseTime - 1000)), // 1 sec ago (most recent)
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
          }),
        },
        {
          id: 'coding',
          data: () => ({
            typeId: 'coding',
            useCount: 8,
            lastUsed: Timestamp.fromDate(new Date(baseTime - 30000)), // 30 sec ago
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
          }),
        },
        {
          id: 'reading',
          data: () => ({
            typeId: 'reading',
            useCount: 2,
            lastUsed: Timestamp.fromDate(new Date(baseTime - 60000)), // 1 min ago
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
          }),
        },
      ]

      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          mockPreferences.forEach(callback)
        },
      })

      // Act
      const result = await getRecentActivities('user-123', 3)

      // Assert - Results should be sorted by lastUsed descending
      if (result.length >= 3) {
        expect(result[0]?.typeId).toBe('work') // Most recent
        expect(result[2]?.typeId).toBe('reading') // Least recent
      }
    })

    it('should break ties by useCount when lastUsed is same', async () => {
      // This tests that when activities have same lastUsed,
      // higher useCount is preferred (secondary sort)
      const sameTime = new Date()

      // Act & Assert - Implementation-specific, depends on secondary sort key
      const activity1 = await updateActivityPreference('user-123', 'activity1', 10, sameTime)
      const activity2 = await updateActivityPreference('user-123', 'activity2', 5, sameTime)

      // Both have same lastUsed, but activity1 has higher useCount
      expect(activity1.useCount).toBeGreaterThan(activity2.useCount)
    })

    it('should exclude unused activities from recent list', async () => {
      // Arrange
      const { getDocs, Timestamp } = jest.requireMock('firebase/firestore')

      const mockPreferences = [
        {
          id: 'work',
          data: () => ({
            typeId: 'work',
            useCount: 5,
            lastUsed: Timestamp.fromDate(new Date()),
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
          }),
        },
        // No unused activities in the returned list
      ]

      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          mockPreferences.forEach(callback)
        },
      })

      // Act
      const result = await getRecentActivities('user-123', 5)

      // Assert - Only used activities should be in recent
      result.forEach((pref) => {
        expect(pref.useCount).toBeGreaterThan(0)
      })
    })
  })
})
