/**
 * Unit Tests for Challenge Leaderboard
 * Tests getChallengeLeaderboard and ranking logic
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { firebaseChallengeApi } from '@/lib/api/challenges'

// ============================================================================
// MOCKS
// ============================================================================

const mockAuth = {
  currentUser: { uid: 'test-user-123' },
}

const mockDb = {}

jest.mock('@/lib/firebase', () => ({
  auth: mockAuth,
  db: mockDb,
}))

const mockGetDoc = jest.fn()
const mockGetDocs = jest.fn()
const mockQuery = jest.fn((..._args) => ({}))
const mockWhere = jest.fn((..._args) => ({}))
const mockOrderBy = jest.fn((..._args) => ({}))
const mockCollection = jest.fn(() => ({}))
const mockDoc = jest.fn((collectionPath: string, docId: string) => ({
  id: docId,
  path: `${collectionPath}/${docId}`,
}))

jest.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
}))

jest.mock('@/lib/errorHandler', () => ({
  handleError: jest.fn(
    (_error: unknown, _context: string, options?: { defaultMessage?: string }) => ({
      userMessage: options?.defaultMessage || 'handled error',
    })
  ),
  ErrorSeverity: {
    ERROR: 'ERROR',
    WARNING: 'WARNING',
  },
}))

jest.mock('@/lib/api/shared/utils', () => ({
  convertTimestamp: (value: unknown) => {
    if (value instanceof Date) return value
    if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
      return (value as { toDate: () => Date }).toDate()
    }
    return new Date()
  },
}))

// ============================================================================
// TEST SUITE
// ============================================================================

describe('firebaseChallengeApi.getChallengeLeaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.currentUser = { uid: 'test-user-123' }
  })

  // ==========================================================================
  // HAPPY PATH
  // ==========================================================================

  it('should return leaderboard with ranked participants', async () => {
    // Arrange
    const participantDocs = [
      {
        id: 'user1_challenge',
        data: () => ({
          userId: 'user-1',
          challengeId: 'challenge-123',
          progress: 100,
          isCompleted: true,
        }),
      },
      {
        id: 'user2_challenge',
        data: () => ({
          userId: 'user-2',
          challengeId: 'challenge-123',
          progress: 75,
          isCompleted: false,
        }),
      },
      {
        id: 'user3_challenge',
        data: () => ({
          userId: 'user-3',
          challengeId: 'challenge-123',
          progress: 50,
          isCompleted: false,
        }),
      },
    ]

    mockGetDocs.mockResolvedValue({
      docs: participantDocs,
    })

    // Mock user docs for each participant
    mockGetDoc.mockImplementation(async (ref: { id: string; path: string }) => {
      // Extract user ID from path
      const userId = ref.path.split('/').pop() || ref.id
      const userMap: Record<string, unknown> = {
        'user-1': {
          email: 'user1@test.com',
          name: 'User One',
          username: 'user1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        'user-2': {
          email: 'user2@test.com',
          name: 'User Two',
          username: 'user2',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        'user-3': {
          email: 'user3@test.com',
          name: 'User Three',
          username: 'user3',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      }

      return {
        exists: () => !!userMap[userId],
        data: () => userMap[userId],
      }
    })

    // Act
    const leaderboard = await firebaseChallengeApi.getChallengeLeaderboard('challenge-123')

    // Assert
    expect(leaderboard.challengeId).toBe('challenge-123')
    expect(leaderboard.entries).toHaveLength(3)
    expect(leaderboard.entries[0]?.rank).toBe(1)
    expect(leaderboard.entries[1]?.rank).toBe(2)
    expect(leaderboard.entries[2]?.rank).toBe(3)
  })

  it('should order participants by progress descending', async () => {
    // Arrange
    const participantDocs = [
      {
        id: 'user1_challenge',
        data: () => ({
          userId: 'user-1',
          progress: 150,
        }),
      },
      {
        id: 'user2_challenge',
        data: () => ({
          userId: 'user-2',
          progress: 200,
        }),
      },
      {
        id: 'user3_challenge',
        data: () => ({
          userId: 'user-3',
          progress: 100,
        }),
      },
    ]

    mockGetDocs.mockResolvedValue({ docs: participantDocs })

    mockGetDoc.mockImplementation(async (ref: { id: string; path: string }) => {
      const userId = ref.path.split('/').pop() || ref.id
      return {
        exists: () => true,
        data: () => ({
          email: `${userId}@test.com`,
          name: userId,
          username: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      }
    })

    // Act
    const leaderboard = await firebaseChallengeApi.getChallengeLeaderboard('challenge-123')

    // Assert
    expect(leaderboard.entries[0]?.userId).toBe('user-1')
    expect(leaderboard.entries[0]?.progress).toBe(150)
  })

  it('should include user details in leaderboard entries', async () => {
    // Arrange
    const participantDocs = [
      {
        id: 'user1_challenge',
        data: () => ({
          userId: 'user-1',
          progress: 100,
        }),
      },
    ]

    mockGetDocs.mockResolvedValue({ docs: participantDocs })

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        bio: 'Test bio',
        location: 'Test City',
        profilePicture: 'https://example.com/pic.jpg',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      }),
    })

    // Act
    const leaderboard = await firebaseChallengeApi.getChallengeLeaderboard('challenge-123')

    // Assert
    expect(leaderboard.entries[0]?.user).toMatchObject({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      bio: 'Test bio',
      location: 'Test City',
      profilePicture: 'https://example.com/pic.jpg',
    })
  })

  it('should include completion status in entries', async () => {
    // Arrange
    const participantDocs = [
      {
        id: 'user1_challenge',
        data: () => ({
          userId: 'user-1',
          progress: 100,
          isCompleted: true,
          completedAt: new Date('2024-11-15'),
        }),
      },
      {
        id: 'user2_challenge',
        data: () => ({
          userId: 'user-2',
          progress: 75,
          isCompleted: false,
        }),
      },
    ]

    mockGetDocs.mockResolvedValue({ docs: participantDocs })

    mockGetDoc.mockImplementation(async (ref: unknown) => {
      const userId = (ref as { id: string }).id
      return {
        exists: () => true,
        data: () => ({
          email: `${userId}@test.com`,
          name: userId,
          username: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      }
    })

    // Act
    const leaderboard = await firebaseChallengeApi.getChallengeLeaderboard('challenge-123')

    // Assert
    expect(leaderboard.entries[0]?.isCompleted).toBe(true)
    expect(leaderboard.entries[0]?.completedAt).toBeInstanceOf(Date)
    expect(leaderboard.entries[1]?.isCompleted).toBe(false)
    expect(leaderboard.entries[1]?.completedAt).toBeUndefined()
  })

  it('should return empty leaderboard for challenge with no participants', async () => {
    // Arrange
    mockGetDocs.mockResolvedValue({ docs: [] })

    // Act
    const leaderboard = await firebaseChallengeApi.getChallengeLeaderboard('challenge-123')

    // Assert
    expect(leaderboard.challengeId).toBe('challenge-123')
    expect(leaderboard.entries).toEqual([])
  })

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  it('should handle ties in progress correctly', async () => {
    // Arrange
    const participantDocs = [
      {
        id: 'user1_challenge',
        data: () => ({
          userId: 'user-1',
          progress: 100,
        }),
      },
      {
        id: 'user2_challenge',
        data: () => ({
          userId: 'user-2',
          progress: 100,
        }),
      },
      {
        id: 'user3_challenge',
        data: () => ({
          userId: 'user-3',
          progress: 50,
        }),
      },
    ]

    mockGetDocs.mockResolvedValue({ docs: participantDocs })

    mockGetDoc.mockImplementation(async (ref: { id: string; path: string }) => {
      const userId = ref.path.split('/').pop() || ref.id
      return {
        exists: () => true,
        data: () => ({
          email: `${userId}@test.com`,
          name: userId,
          username: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      }
    })

    // Act
    const leaderboard = await firebaseChallengeApi.getChallengeLeaderboard('challenge-123')

    // Assert - Both tied users should have ranks 1 and 2, third should be rank 3
    expect(leaderboard.entries[0]?.rank).toBe(1)
    expect(leaderboard.entries[1]?.rank).toBe(2)
    expect(leaderboard.entries[2]?.rank).toBe(3)
  })

  it('should handle participants with zero progress', async () => {
    // Arrange
    const participantDocs = [
      {
        id: 'user1_challenge',
        data: () => ({
          userId: 'user-1',
          progress: 0,
        }),
      },
    ]

    mockGetDocs.mockResolvedValue({ docs: participantDocs })

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        email: 'user1@test.com',
        name: 'User One',
        username: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    })

    // Act
    const leaderboard = await firebaseChallengeApi.getChallengeLeaderboard('challenge-123')

    // Assert
    expect(leaderboard.entries[0]?.progress).toBe(0)
    expect(leaderboard.entries[0]?.rank).toBe(1)
  })

  it('should skip participants with missing user data', async () => {
    // Arrange
    const participantDocs = [
      {
        id: 'user1_challenge',
        data: () => ({
          userId: 'user-1',
          progress: 100,
        }),
      },
      {
        id: 'user2_challenge',
        data: () => ({
          userId: 'deleted-user',
          progress: 75,
        }),
      },
    ]

    mockGetDocs.mockResolvedValue({ docs: participantDocs })

    mockGetDoc.mockImplementation(async (ref: { id: string; path: string }) => {
      const userId = ref.path.split('/').pop() || ref.id
      if (userId === 'deleted-user') {
        return {
          exists: () => false,
          data: () => null,
        }
      }
      return {
        exists: () => true,
        data: () => ({
          email: 'user1@test.com',
          name: 'User One',
          username: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      }
    })

    // Act
    const leaderboard = await firebaseChallengeApi.getChallengeLeaderboard('challenge-123')

    // Assert - Only user-1 should appear
    expect(leaderboard.entries).toHaveLength(1)
    expect(leaderboard.entries[0]?.userId).toBe('user-1')
  })

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  it('should handle Firestore errors gracefully', async () => {
    // Arrange
    mockGetDocs.mockRejectedValue(new Error('Firestore error'))

    // Act & Assert
    await expect(firebaseChallengeApi.getChallengeLeaderboard('challenge-123')).rejects.toThrow()
  })

  it('should handle errors loading individual user data', async () => {
    // Arrange
    const participantDocs = [
      {
        id: 'user1_challenge',
        data: () => ({
          userId: 'user-1',
          progress: 100,
        }),
      },
      {
        id: 'user2_challenge',
        data: () => ({
          userId: 'user-2',
          progress: 75,
        }),
      },
    ]

    mockGetDocs.mockResolvedValue({ docs: participantDocs })

    // First user loads successfully, second fails
    let callCount = 0
    mockGetDoc.mockImplementation(async () => {
      callCount++
      if (callCount === 1) {
        return {
          exists: () => true,
          data: () => ({
            email: 'user1@test.com',
            name: 'User One',
            username: 'user1',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        }
      }
      throw new Error('Failed to load user')
    })

    // Act
    const leaderboard = await firebaseChallengeApi.getChallengeLeaderboard('challenge-123')

    // Assert - Should still return successful entries
    expect(leaderboard.entries).toHaveLength(1)
    expect(leaderboard.entries[0]?.userId).toBe('user-1')
  })
})
