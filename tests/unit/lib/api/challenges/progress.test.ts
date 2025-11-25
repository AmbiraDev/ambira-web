/**
 * Unit Tests for Challenge Progress Tracking
 * Tests getChallengeProgress and updateChallengeProgress functions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { firebaseChallengeApi } from '@/lib/api/challenges'
import type { Session } from '@/types'

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
const mockWriteBatch = jest.fn()

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  query: jest.fn(),
  where: jest.fn(),
  writeBatch: mockWriteBatch,
  serverTimestamp: jest.fn(() => new Date()),
}))

jest.mock('@/lib/errorHandler', () => ({
  handleError: jest.fn(
    (
      _error: unknown,
      _context: string,
      options?: { defaultMessage?: string; severity?: string }
    ) => ({
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
// TEST SUITE - GET CHALLENGE PROGRESS
// ============================================================================

describe('firebaseChallengeApi.getChallengeProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.currentUser = { uid: 'test-user-123' }
  })

  // ==========================================================================
  // HAPPY PATH
  // ==========================================================================

  it('should return user progress for a challenge', async () => {
    // Arrange
    const participantData = {
      userId: 'test-user-123',
      challengeId: 'challenge-123',
      progress: 75,
      isCompleted: false,
      updatedAt: new Date('2024-11-15'),
    }

    const challengeData = {
      goalValue: 100,
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
    }

    mockGetDoc
      // Participant doc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => participantData,
      })
      // Challenge doc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => challengeData,
      })

    // Mock higher progress query
    mockGetDocs.mockResolvedValue({ size: 2 }) // 2 users with higher progress

    // Act
    const progress = await firebaseChallengeApi.getChallengeProgress('challenge-123')

    // Assert
    expect(progress).toMatchObject({
      challengeId: 'challenge-123',
      userId: 'test-user-123',
      currentValue: 75,
      targetValue: 100,
      percentage: 75,
      rank: 3, // 2 with higher progress + 1 = rank 3
      isCompleted: false,
    })
  })

  it('should calculate percentage correctly', async () => {
    // Arrange
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          progress: 50,
          isCompleted: false,
        }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          goalValue: 200,
        }),
      })

    mockGetDocs.mockResolvedValue({ size: 0 })

    // Act
    const progress = await firebaseChallengeApi.getChallengeProgress('challenge-123')

    // Assert
    expect(progress?.percentage).toBe(25) // 50/200 = 25%
  })

  it('should cap percentage at 100', async () => {
    // Arrange
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          progress: 150,
          isCompleted: true,
        }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          goalValue: 100,
        }),
      })

    mockGetDocs.mockResolvedValue({ size: 0 })

    // Act
    const progress = await firebaseChallengeApi.getChallengeProgress('challenge-123')

    // Assert
    expect(progress?.percentage).toBe(100) // Capped at 100%
  })

  it('should return rank 1 for user with highest progress', async () => {
    // Arrange
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ progress: 100 }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ goalValue: 100 }),
      })

    mockGetDocs.mockResolvedValue({ size: 0 }) // No one with higher progress

    // Act
    const progress = await firebaseChallengeApi.getChallengeProgress('challenge-123')

    // Assert
    expect(progress?.rank).toBe(1)
  })

  it('should support checking other user progress with userId param', async () => {
    // Arrange
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          userId: 'other-user',
          progress: 50,
        }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ goalValue: 100 }),
      })

    mockGetDocs.mockResolvedValue({ size: 0 })

    // Act
    const progress = await firebaseChallengeApi.getChallengeProgress('challenge-123', 'other-user')

    // Assert
    expect(progress?.userId).toBe('other-user')
  })

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  it('should return null if user is not participating', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    })

    // Act
    const progress = await firebaseChallengeApi.getChallengeProgress('challenge-123')

    // Assert
    expect(progress).toBeNull()
  })

  it('should handle zero progress', async () => {
    // Arrange
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          progress: 0,
          isCompleted: false,
        }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ goalValue: 100 }),
      })

    mockGetDocs.mockResolvedValue({ size: 5 })

    // Act
    const progress = await firebaseChallengeApi.getChallengeProgress('challenge-123')

    // Assert
    expect(progress?.currentValue).toBe(0)
    expect(progress?.percentage).toBe(0)
    expect(progress?.rank).toBe(6) // 5 users ahead
  })

  it('should handle challenge with no goal value', async () => {
    // Arrange
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ progress: 50 }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ goalValue: undefined }),
      })

    mockGetDocs.mockResolvedValue({ size: 0 })

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
    mockAuth.currentUser = null

    // Act & Assert
    await expect(firebaseChallengeApi.getChallengeProgress('challenge-123')).rejects.toThrow(
      'User not authenticated'
    )
  })

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  it('should handle Firestore errors gracefully', async () => {
    // Arrange
    mockGetDoc.mockRejectedValue(new Error('Firestore error'))

    // Act & Assert
    await expect(firebaseChallengeApi.getChallengeProgress('challenge-123')).rejects.toThrow()
  })
})

// ============================================================================
// TEST SUITE - UPDATE CHALLENGE PROGRESS
// ============================================================================

describe('firebaseChallengeApi.updateChallengeProgress', () => {
  let batchUpdate: jest.Mock
  let batchCommit: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.currentUser = { uid: 'test-user-123' }

    batchUpdate = jest.fn()
    batchCommit = jest.fn().mockResolvedValue(undefined)

    mockWriteBatch.mockReturnValue({
      set: jest.fn(),
      update: batchUpdate,
      delete: jest.fn(),
      commit: batchCommit,
    })
  })

  // ==========================================================================
  // HAPPY PATH - MOST ACTIVITY
  // ==========================================================================

  it('should update progress for most-activity challenge', async () => {
    // Arrange
    const sessionData: Session = {
      id: 'session-123',
      userId: 'test-user-123',
      activityId: 'coding',
      projectId: 'project-1',
      title: 'Coding Session',
      description: 'Working on features',
      duration: 7200, // 2 hours in seconds
      startTime: new Date('2025-11-15'),
      tags: [],
      visibility: 'everyone',
      isArchived: false,
      supportCount: 0,
      commentCount: 0,
      createdAt: new Date('2025-11-15'),
      updatedAt: new Date('2025-11-15'),
    }

    const participantDocs = [
      {
        id: 'test-user-123_challenge-123',
        data: () => ({
          userId: 'test-user-123',
          challengeId: 'challenge-123',
          progress: 10, // 10 hours already
          isCompleted: false,
        }),
        ref: {},
      },
    ]

    mockGetDocs.mockResolvedValueOnce({
      docs: participantDocs,
    })

    mockGetDoc.mockResolvedValue({
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
    await firebaseChallengeApi.updateChallengeProgress('test-user-123', sessionData)

    // Assert
    expect(batchUpdate).toHaveBeenCalled()
    expect(batchCommit).toHaveBeenCalled()
  })

  // ==========================================================================
  // HAPPY PATH - LONGEST SESSION
  // ==========================================================================

  it('should update progress for longest-session challenge only if session is longer', async () => {
    // Arrange
    const sessionData: Session = {
      id: 'session-123',
      userId: 'test-user-123',
      activityId: 'coding',
      projectId: 'project-1',
      title: 'Long Session',
      description: 'Marathon coding',
      duration: 14400, // 4 hours
      startTime: new Date('2025-11-15'),
      tags: [],
      visibility: 'everyone',
      isArchived: false,
      supportCount: 0,
      commentCount: 0,
      createdAt: new Date('2025-11-15'),
      updatedAt: new Date('2025-11-15'),
    }

    const participantDocs = [
      {
        id: 'test-user-123_challenge-123',
        data: () => ({
          userId: 'test-user-123',
          challengeId: 'challenge-123',
          progress: 2, // Current longest is 2 hours
          isCompleted: false,
        }),
        ref: {},
      },
    ]

    mockGetDocs.mockResolvedValueOnce({ docs: participantDocs })

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        type: 'longest-session',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
        isActive: true,
        goalValue: 10, // 10 hours target
      }),
    })

    // Act
    await firebaseChallengeApi.updateChallengeProgress('test-user-123', sessionData)

    // Assert - Should update to 4 hours (new longest)
    expect(batchUpdate).toHaveBeenCalled()
  })

  it('should not update longest-session if session is shorter than current best', async () => {
    // Arrange
    const sessionData: Session = {
      id: 'session-123',
      userId: 'test-user-123',
      activityId: 'coding',
      projectId: 'project-1',
      title: 'Short Session',
      description: 'Quick work',
      duration: 1800, // 0.5 hours
      startTime: new Date('2025-11-15'),
      tags: [],
      visibility: 'everyone',
      isArchived: false,
      supportCount: 0,
      commentCount: 0,
      createdAt: new Date('2025-11-15'),
      updatedAt: new Date('2025-11-15'),
    }

    const participantDocs = [
      {
        id: 'test-user-123_challenge-123',
        data: () => ({
          userId: 'test-user-123',
          challengeId: 'challenge-123',
          progress: 5, // Current longest is 5 hours
          isCompleted: false,
        }),
        ref: {},
      },
    ]

    mockGetDocs.mockResolvedValueOnce({ docs: participantDocs })

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        type: 'longest-session',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
        isActive: true,
      }),
    })

    // Act
    await firebaseChallengeApi.updateChallengeProgress('test-user-123', sessionData)

    // Assert - Should not update (no commit needed)
    expect(batchUpdate).not.toHaveBeenCalled()
  })

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  it('should skip inactive challenges', async () => {
    // Arrange
    const sessionData: Session = {
      id: 'session-123',
      userId: 'test-user-123',
      activityId: 'coding',
      projectId: 'project-1',
      title: 'Session',
      description: 'Work',
      duration: 3600,
      startTime: new Date('2025-11-15'),
      tags: [],
      visibility: 'everyone',
      isArchived: false,
      supportCount: 0,
      commentCount: 0,
      createdAt: new Date('2025-11-15'),
      updatedAt: new Date('2025-11-15'),
    }

    const participantDocs = [
      {
        id: 'test-user-123_challenge-123',
        data: () => ({
          userId: 'test-user-123',
          challengeId: 'challenge-123',
          progress: 10,
        }),
        ref: {},
      },
    ]

    mockGetDocs.mockResolvedValueOnce({ docs: participantDocs })

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        type: 'most-activity',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
        isActive: false, // INACTIVE
      }),
    })

    // Act
    await firebaseChallengeApi.updateChallengeProgress('test-user-123', sessionData)

    // Assert - Should not update
    expect(batchUpdate).not.toHaveBeenCalled()
  })

  it('should skip sessions outside challenge period', async () => {
    // Arrange
    const sessionData: Session = {
      id: 'session-123',
      userId: 'test-user-123',
      activityId: 'coding',
      projectId: 'project-1',
      title: 'Session',
      description: 'Work',
      duration: 3600,
      startTime: new Date('2025-10-15'), // Before challenge start
      tags: [],
      visibility: 'everyone',
      isArchived: false,
      supportCount: 0,
      commentCount: 0,
      createdAt: new Date('2025-10-15'),
      updatedAt: new Date('2025-10-15'),
    }

    const participantDocs = [
      {
        id: 'test-user-123_challenge-123',
        data: () => ({
          userId: 'test-user-123',
          challengeId: 'challenge-123',
          progress: 10,
        }),
        ref: {},
      },
    ]

    mockGetDocs.mockResolvedValueOnce({ docs: participantDocs })

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        type: 'most-activity',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
        isActive: true,
      }),
    })

    // Act
    await firebaseChallengeApi.updateChallengeProgress('test-user-123', sessionData)

    // Assert - Should not update
    expect(batchUpdate).not.toHaveBeenCalled()
  })

  it('should mark challenge as completed when goal reached', async () => {
    // Arrange
    const sessionData: Session = {
      id: 'session-123',
      userId: 'test-user-123',
      activityId: 'coding',
      projectId: 'project-1',
      title: 'Session',
      description: 'Final push',
      duration: 3600, // 1 hour
      startTime: new Date('2025-11-15'),
      tags: [],
      visibility: 'everyone',
      isArchived: false,
      supportCount: 0,
      commentCount: 0,
      createdAt: new Date('2025-11-15'),
      updatedAt: new Date('2025-11-15'),
    }

    const participantDocs = [
      {
        id: 'test-user-123_challenge-123',
        data: () => ({
          userId: 'test-user-123',
          challengeId: 'challenge-123',
          progress: 99.5, // Almost at goal
          isCompleted: false,
        }),
        ref: {},
      },
    ]

    mockGetDocs.mockResolvedValueOnce({ docs: participantDocs })

    mockGetDoc.mockResolvedValue({
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
    await firebaseChallengeApi.updateChallengeProgress('test-user-123', sessionData)

    // Assert - Should mark as completed
    expect(batchUpdate).toHaveBeenCalled()
  })

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  it('should not throw errors to avoid breaking session creation', async () => {
    // Arrange
    const sessionData: Session = {
      id: 'session-123',
      userId: 'test-user-123',
      activityId: 'coding',
      projectId: 'project-1',
      title: 'Session',
      description: 'Work',
      duration: 3600,
      startTime: new Date('2025-11-15'),
      tags: [],
      visibility: 'everyone',
      isArchived: false,
      supportCount: 0,
      commentCount: 0,
      createdAt: new Date('2025-11-15'),
      updatedAt: new Date('2025-11-15'),
    }

    mockGetDocs.mockRejectedValue(new Error('Firestore error'))

    // Act & Assert - Should not throw
    await expect(
      firebaseChallengeApi.updateChallengeProgress('test-user-123', sessionData)
    ).resolves.not.toThrow()
  })
})
