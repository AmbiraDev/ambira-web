/**
 * Unit Tests for Challenge Progress Tracking
 * Tests getChallengeProgress and updateChallengeProgress functions
 */

import { firebaseChallengeApi } from '@/lib/api/challenges'
import type { Session } from '@/types'

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
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
  serverTimestamp: jest.fn(() => new Date()),
  increment: jest.fn((val: number) => val),
}))

jest.mock('@/lib/errorHandler', () => ({
  handleError: jest.fn(
    (_error: unknown, _context: string, options?: { defaultMessage?: string }) => ({
      userMessage:
        _error instanceof Error && _error.message === 'User not authenticated'
          ? 'User not authenticated'
          : options?.defaultMessage || 'handled error',
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
// TEST SUITE - GET CHALLENGE PROGRESS
// ============================================================================

describe.skip('firebaseChallengeApi.getChallengeProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { auth } = jest.requireMock('@/lib/firebase')
    auth.currentUser = { uid: 'test-user-123' }
  })

  // ==========================================================================
  // HAPPY PATH
  // ==========================================================================

  it('should return user progress for a challenge', async () => {
    // Arrange
    const { getDoc, getDocs } = jest.requireMock('firebase/firestore')

    getDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          userId: 'test-user-123',
          challengeId: 'challenge-123',
          progress: 75,
          isCompleted: false,
          updatedAt: new Date('2024-11-15'),
        }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          goalValue: 100,
          type: 'most-activity',
        }),
      })

    getDocs.mockResolvedValue({ size: 2 })

    // Act
    const progress = await firebaseChallengeApi.getChallengeProgress('challenge-123')

    // Assert
    expect(progress).toMatchObject({
      challengeId: 'challenge-123',
      userId: 'test-user-123',
      currentValue: 75,
      targetValue: 100,
      percentage: 75,
      rank: 3,
      isCompleted: false,
    })
  })

  it('should calculate percentage correctly', async () => {
    // Arrange
    const { getDoc, getDocs } = jest.requireMock('firebase/firestore')

    getDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ progress: 50, isCompleted: false }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ goalValue: 200 }),
      })

    getDocs.mockResolvedValue({ size: 0 })

    // Act
    const progress = await firebaseChallengeApi.getChallengeProgress('challenge-123')

    // Assert
    expect(progress?.percentage).toBe(25)
  })

  it('should cap percentage at 100', async () => {
    // Arrange
    const { getDoc, getDocs } = jest.requireMock('firebase/firestore')

    getDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ progress: 150, isCompleted: true }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ goalValue: 100 }),
      })

    getDocs.mockResolvedValue({ size: 0 })

    // Act
    const progress = await firebaseChallengeApi.getChallengeProgress('challenge-123')

    // Assert
    expect(progress?.percentage).toBe(100)
  })

  it('should return rank 1 for user with highest progress', async () => {
    // Arrange
    const { getDoc, getDocs } = jest.requireMock('firebase/firestore')

    getDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ progress: 100 }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ goalValue: 100 }),
      })

    getDocs.mockResolvedValue({ size: 0 })

    // Act
    const progress = await firebaseChallengeApi.getChallengeProgress('challenge-123')

    // Assert
    expect(progress?.rank).toBe(1)
  })

  it('should support checking other user progress with userId param', async () => {
    // Arrange
    const { getDoc, getDocs } = jest.requireMock('firebase/firestore')

    getDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ userId: 'other-user', progress: 50 }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ goalValue: 100 }),
      })

    getDocs.mockResolvedValue({ size: 0 })

    // Act
    const progress = await firebaseChallengeApi.getChallengeProgress(
      'challenge-123',
      'other-user'
    )

    // Assert
    expect(progress?.userId).toBe('other-user')
  })

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  it('should return null if user is not participating', async () => {
    // Arrange
    const { getDoc } = jest.requireMock('firebase/firestore')
    getDoc.mockResolvedValue({ exists: () => false })

    // Act
    const progress = await firebaseChallengeApi.getChallengeProgress('challenge-123')

    // Assert
    expect(progress).toBeNull()
  })

  it('should handle zero progress', async () => {
    // Arrange
    const { getDoc, getDocs } = jest.requireMock('firebase/firestore')

    getDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ progress: 0, isCompleted: false }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ goalValue: 100 }),
      })

    getDocs.mockResolvedValue({ size: 5 })

    // Act
    const progress = await firebaseChallengeApi.getChallengeProgress('challenge-123')

    // Assert
    expect(progress?.currentValue).toBe(0)
    expect(progress?.percentage).toBe(0)
    expect(progress?.rank).toBe(6)
  })

  it('should handle challenge with no goal value', async () => {
    // Arrange
    const { getDoc, getDocs } = jest.requireMock('firebase/firestore')

    getDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ progress: 50 }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ goalValue: undefined }),
      })

    getDocs.mockResolvedValue({ size: 0 })

    // Act
    const progress = await firebaseChallengeApi.getChallengeProgress('challenge-123')

    // Assert
    expect(progress?.targetValue).toBeUndefined()
    expect(progress?.percentage).toBe(0)
  })

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  it('should require authentication when userId not provided', async () => {
    // Arrange
    const { auth } = jest.requireMock('@/lib/firebase')
    auth.currentUser = null

    // Act & Assert
    await expect(
      firebaseChallengeApi.getChallengeProgress('challenge-123')
    ).rejects.toThrow('User not authenticated')
  })

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  it('should handle Firestore errors gracefully', async () => {
    // Arrange
    const { getDoc } = jest.requireMock('firebase/firestore')
    getDoc.mockRejectedValue(new Error('Firestore error'))

    // Act & Assert
    await expect(
      firebaseChallengeApi.getChallengeProgress('challenge-123')
    ).rejects.toThrow()
  })
})

// ============================================================================
// TEST SUITE - UPDATE CHALLENGE PROGRESS
// ============================================================================

describe.skip('firebaseChallengeApi.updateChallengeProgress', () => {
  let mockBatch: {
    set: jest.Mock
    update: jest.Mock
    delete: jest.Mock
    commit: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    const { auth } = jest.requireMock('@/lib/firebase')
    auth.currentUser = { uid: 'test-user-123' }

    mockBatch = {
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    }

    const { writeBatch } = jest.requireMock('firebase/firestore')
    writeBatch.mockReturnValue(mockBatch)
  })

  const createSessionData = (overrides: Partial<Session> = {}): Session => ({
    id: 'session-123',
    userId: 'test-user-123',
    activityId: 'coding',
    projectId: 'project-1',
    title: 'Coding Session',
    description: 'Working on features',
    duration: 7200,
    startTime: new Date('2025-11-15'),
    tags: [],
    visibility: 'everyone',
    isArchived: false,
    supportCount: 0,
    commentCount: 0,
    createdAt: new Date('2025-11-15'),
    updatedAt: new Date('2025-11-15'),
    ...overrides,
  })

  // ==========================================================================
  // HAPPY PATH
  // ==========================================================================

  it('should update progress for most-activity challenge', async () => {
    // Arrange
    const { getDocs, getDoc } = jest.requireMock('firebase/firestore')

    getDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            userId: 'test-user-123',
            challengeId: 'challenge-123',
            progress: 10,
            isCompleted: false,
          }),
          ref: {},
        },
      ],
    })

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        type: 'most-activity',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
        isActive: true,
        goalValue: 100,
      }),
    })

    // Act
    await firebaseChallengeApi.updateChallengeProgress(
      'test-user-123',
      createSessionData()
    )

    // Assert
    expect(mockBatch.update).toHaveBeenCalled()
    expect(mockBatch.commit).toHaveBeenCalled()
  })

  it('should update progress for longest-session challenge if session is longer', async () => {
    // Arrange
    const { getDocs, getDoc } = jest.requireMock('firebase/firestore')

    getDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            userId: 'test-user-123',
            challengeId: 'challenge-123',
            progress: 2,
            isCompleted: false,
          }),
          ref: {},
        },
      ],
    })

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        type: 'longest-session',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
        isActive: true,
        goalValue: 10,
      }),
    })

    // Act
    await firebaseChallengeApi.updateChallengeProgress(
      'test-user-123',
      createSessionData({ duration: 14400 })
    )

    // Assert
    expect(mockBatch.update).toHaveBeenCalled()
  })

  it('should not update longest-session if session is shorter', async () => {
    // Arrange
    const { getDocs, getDoc } = jest.requireMock('firebase/firestore')

    getDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            userId: 'test-user-123',
            challengeId: 'challenge-123',
            progress: 5,
            isCompleted: false,
          }),
          ref: {},
        },
      ],
    })

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        type: 'longest-session',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
        isActive: true,
      }),
    })

    // Act
    await firebaseChallengeApi.updateChallengeProgress(
      'test-user-123',
      createSessionData({ duration: 1800 })
    )

    // Assert
    expect(mockBatch.update).not.toHaveBeenCalled()
  })

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  it('should skip inactive challenges', async () => {
    // Arrange
    const { getDocs, getDoc } = jest.requireMock('firebase/firestore')

    getDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            userId: 'test-user-123',
            challengeId: 'challenge-123',
            progress: 10,
          }),
          ref: {},
        },
      ],
    })

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        type: 'most-activity',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
        isActive: false,
      }),
    })

    // Act
    await firebaseChallengeApi.updateChallengeProgress(
      'test-user-123',
      createSessionData()
    )

    // Assert
    expect(mockBatch.update).not.toHaveBeenCalled()
  })

  it('should skip sessions outside challenge period', async () => {
    // Arrange
    const { getDocs, getDoc } = jest.requireMock('firebase/firestore')

    getDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            userId: 'test-user-123',
            challengeId: 'challenge-123',
            progress: 10,
          }),
          ref: {},
        },
      ],
    })

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        type: 'most-activity',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
        isActive: true,
      }),
    })

    // Act
    await firebaseChallengeApi.updateChallengeProgress(
      'test-user-123',
      createSessionData({ startTime: new Date('2025-10-15') })
    )

    // Assert
    expect(mockBatch.update).not.toHaveBeenCalled()
  })

  it('should mark challenge as completed when goal reached', async () => {
    // Arrange
    const { getDocs, getDoc } = jest.requireMock('firebase/firestore')

    getDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            userId: 'test-user-123',
            challengeId: 'challenge-123',
            progress: 99.5,
            isCompleted: false,
          }),
          ref: {},
        },
      ],
    })

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        type: 'most-activity',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
        isActive: true,
        goalValue: 100,
      }),
    })

    // Act
    await firebaseChallengeApi.updateChallengeProgress(
      'test-user-123',
      createSessionData({ duration: 3600 })
    )

    // Assert
    expect(mockBatch.update).toHaveBeenCalled()
  })

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  it('should not throw errors to avoid breaking session creation', async () => {
    // Arrange
    const { getDocs } = jest.requireMock('firebase/firestore')
    getDocs.mockRejectedValue(new Error('Firestore error'))

    // Act & Assert
    await expect(
      firebaseChallengeApi.updateChallengeProgress(
        'test-user-123',
        createSessionData()
      )
    ).resolves.not.toThrow()
  })
})
