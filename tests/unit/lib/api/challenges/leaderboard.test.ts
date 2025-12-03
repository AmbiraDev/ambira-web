/**
 * Unit Tests for Challenge Leaderboard
 * Tests getChallengeLeaderboard and ranking logic
 */

import { firebaseChallengeApi } from '@/lib/api/challenges'

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
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  increment: jest.fn((val: number) => val),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
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

jest.mock('@/config/errorMessages', () => ({
  ERROR_MESSAGES: {
    UNKNOWN_ERROR: 'Something went wrong. Please try again.',
    CHALLENGE_LOAD_FAILED: 'Failed to load challenge details. Please refresh.',
    CHALLENGE_JOIN_FAILED: 'Failed to join challenge. Please try again.',
    CHALLENGE_LEAVE_FAILED: 'Failed to leave challenge. Please try again.',
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
  removeUndefinedFields: (obj: Record<string, unknown>) => {
    return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined))
  },
}))

// ============================================================================
// TEST SUITE
// ============================================================================

describe.skip('firebaseChallengeApi.getChallengeLeaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { auth } = jest.requireMock('@/lib/firebase')
    auth.currentUser = { uid: 'test-user-123' }
  })

  // ==========================================================================
  // HAPPY PATH
  // ==========================================================================

  it('should return leaderboard with ranked participants', async () => {
    // Arrange
    const { getDocs, getDoc } = jest.requireMock('firebase/firestore')

    const participantDocs = [
      {
        data: () => ({
          userId: 'user-1',
          challengeId: 'challenge-123',
          progress: 100,
          isCompleted: true,
        }),
      },
      {
        data: () => ({
          userId: 'user-2',
          challengeId: 'challenge-123',
          progress: 75,
          isCompleted: false,
        }),
      },
      {
        data: () => ({
          userId: 'user-3',
          challengeId: 'challenge-123',
          progress: 50,
          isCompleted: false,
        }),
      },
    ]

    getDocs.mockResolvedValue({ docs: participantDocs })

    getDoc.mockResolvedValue({
      data: () => ({
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }),
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

  it('should include user details in leaderboard entries', async () => {
    // Arrange
    const { getDocs, getDoc } = jest.requireMock('firebase/firestore')

    getDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            userId: 'user-1',
            progress: 100,
          }),
        },
      ],
    })

    getDoc.mockResolvedValue({
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
    const { getDocs, getDoc } = jest.requireMock('firebase/firestore')

    getDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            userId: 'user-1',
            progress: 100,
            isCompleted: true,
            completedAt: new Date('2024-11-15'),
          }),
        },
        {
          data: () => ({
            userId: 'user-2',
            progress: 75,
            isCompleted: false,
          }),
        },
      ],
    })

    getDoc.mockResolvedValue({
      data: () => ({
        email: 'test@test.com',
        name: 'Test',
        username: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
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
    const { getDocs } = jest.requireMock('firebase/firestore')
    getDocs.mockResolvedValue({ docs: [] })

    // Act
    const leaderboard = await firebaseChallengeApi.getChallengeLeaderboard('challenge-123')

    // Assert
    expect(leaderboard.challengeId).toBe('challenge-123')
    expect(leaderboard.entries).toEqual([])
  })

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  it('should handle participants with zero progress', async () => {
    // Arrange
    const { getDocs, getDoc } = jest.requireMock('firebase/firestore')

    getDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            userId: 'user-1',
            progress: 0,
          }),
        },
      ],
    })

    getDoc.mockResolvedValue({
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
    const { getDocs, getDoc } = jest.requireMock('firebase/firestore')

    getDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            userId: 'user-1',
            progress: 100,
          }),
        },
        {
          data: () => ({
            userId: 'deleted-user',
            progress: 75,
          }),
        },
      ],
    })

    let callCount = 0
    getDoc.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({
          data: () => ({
            email: 'user1@test.com',
            name: 'User One',
            username: 'user1',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        })
      }
      // Second call returns no user data
      return Promise.resolve({
        data: () => null,
      })
    })

    // Act
    const leaderboard = await firebaseChallengeApi.getChallengeLeaderboard('challenge-123')

    // Assert - Only user-1 should appear since user-2 has no data
    expect(leaderboard.entries).toHaveLength(1)
    expect(leaderboard.entries[0]?.userId).toBe('user-1')
  })

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  it('should handle Firestore errors gracefully', async () => {
    // Arrange
    const { getDocs } = jest.requireMock('firebase/firestore')
    getDocs.mockRejectedValue(new Error('Firestore error'))

    // Act & Assert
    await expect(
      firebaseChallengeApi.getChallengeLeaderboard('challenge-123')
    ).rejects.toThrow()
  })

  it('should handle errors loading individual user data', async () => {
    // Arrange
    const { getDocs, getDoc } = jest.requireMock('firebase/firestore')

    getDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            userId: 'user-1',
            progress: 100,
          }),
        },
        {
          data: () => ({
            userId: 'user-2',
            progress: 75,
          }),
        },
      ],
    })

    let callCount = 0
    getDoc.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({
          data: () => ({
            email: 'user1@test.com',
            name: 'User One',
            username: 'user1',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        })
      }
      // Second call throws an error
      return Promise.reject(new Error('Failed to load user'))
    })

    // Act
    const leaderboard = await firebaseChallengeApi.getChallengeLeaderboard('challenge-123')

    // Assert - Should still return successful entries
    expect(leaderboard.entries).toHaveLength(1)
    expect(leaderboard.entries[0]?.userId).toBe('user-1')
  })
})
