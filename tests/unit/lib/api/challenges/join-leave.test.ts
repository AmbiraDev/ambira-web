/**
 * Unit Tests for Challenge Join/Leave Operations
 * Tests joinChallenge and leaveChallenge functions
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
const mockDoc = jest.fn()
const mockWriteBatch = jest.fn(() => ({
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
}))
const mockIncrement = jest.fn((val: number) => val)
const mockServerTimestamp = jest.fn(() => new Date())

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: mockDoc,
  getDoc: mockGetDoc,
  writeBatch: mockWriteBatch,
  increment: mockIncrement,
  serverTimestamp: mockServerTimestamp,
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
// TEST SUITE - JOIN CHALLENGE
// ============================================================================

describe('firebaseChallengeApi.joinChallenge', () => {
  let batchSet: jest.Mock
  let batchUpdate: jest.Mock
  let batchCommit: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.currentUser = { uid: 'test-user-123' }

    batchSet = jest.fn()
    batchUpdate = jest.fn()
    batchCommit = jest.fn().mockResolvedValue(undefined)

    mockWriteBatch.mockReturnValue({
      set: batchSet,
      update: batchUpdate,
      delete: jest.fn(),
      commit: batchCommit,
    })
  })

  // ==========================================================================
  // HAPPY PATH
  // ==========================================================================

  it('should allow user to join an active challenge', async () => {
    // Arrange
    const challengeId = 'challenge-123'

    // Mock participant doesn't exist (not already joined)
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => false,
      })
      // Mock challenge exists and is active
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: 'Test Challenge',
          type: 'most-activity',
          startDate: new Date('2025-11-01'),
          endDate: new Date('2025-12-31'),
          isActive: true,
          goalValue: 100,
        }),
      })

    // Act
    await firebaseChallengeApi.joinChallenge(challengeId)

    // Assert
    expect(batchSet).toHaveBeenCalled()
    expect(batchUpdate).toHaveBeenCalled()
    expect(batchCommit).toHaveBeenCalled()
  })

  it('should increment participant count when joining', async () => {
    // Arrange
    const challengeId = 'challenge-123'

    mockGetDoc.mockResolvedValueOnce({ exists: () => false }).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        name: 'Test Challenge',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-12-31'),
        isActive: true,
      }),
    })

    // Act
    await firebaseChallengeApi.joinChallenge(challengeId)

    // Assert
    expect(batchUpdate).toHaveBeenCalled()
    expect(mockIncrement).toHaveBeenCalledWith(1)
  })

  it('should create participant record with initial progress 0', async () => {
    // Arrange
    const challengeId = 'challenge-123'

    mockGetDoc.mockResolvedValueOnce({ exists: () => false }).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        name: 'Test Challenge',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-12-31'),
        isActive: true,
      }),
    })

    // Act
    await firebaseChallengeApi.joinChallenge(challengeId)

    // Assert
    expect(batchSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        challengeId: 'challenge-123',
        userId: 'test-user-123',
        progress: 0,
        isCompleted: false,
      })
    )
  })

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  it('should require authentication', async () => {
    // Arrange
    mockAuth.currentUser = null

    // Act & Assert
    await expect(firebaseChallengeApi.joinChallenge('challenge-123')).rejects.toThrow(
      'User not authenticated'
    )
  })

  it('should prevent joining if already participating', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        userId: 'test-user-123',
        challengeId: 'challenge-123',
        progress: 50,
      }),
    })

    // Act & Assert
    await expect(firebaseChallengeApi.joinChallenge('challenge-123')).rejects.toThrow(
      'Already participating in this challenge'
    )
  })

  it('should prevent joining non-existent challenge', async () => {
    // Arrange
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => false })

    // Act & Assert
    await expect(firebaseChallengeApi.joinChallenge('non-existent')).rejects.toThrow(
      'Challenge not found'
    )
  })

  it('should prevent joining inactive challenge', async () => {
    // Arrange
    mockGetDoc.mockResolvedValueOnce({ exists: () => false }).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        name: 'Inactive Challenge',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
        isActive: false,
      }),
    })

    // Act & Assert
    await expect(firebaseChallengeApi.joinChallenge('challenge-123')).rejects.toThrow(
      'Challenge is not active'
    )
  })

  it('should prevent joining ended challenge', async () => {
    // Arrange
    mockGetDoc.mockResolvedValueOnce({ exists: () => false }).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        name: 'Ended Challenge',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        isActive: true,
      }),
    })

    // Act & Assert
    await expect(firebaseChallengeApi.joinChallenge('challenge-123')).rejects.toThrow(
      'Challenge has ended'
    )
  })

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  it('should handle Firestore errors gracefully', async () => {
    // Arrange
    mockGetDoc.mockRejectedValue(new Error('Firestore error'))

    // Act & Assert
    await expect(firebaseChallengeApi.joinChallenge('challenge-123')).rejects.toThrow()
  })
})

// ============================================================================
// TEST SUITE - LEAVE CHALLENGE
// ============================================================================

describe('firebaseChallengeApi.leaveChallenge', () => {
  let batchDelete: jest.Mock
  let batchUpdate: jest.Mock
  let batchCommit: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.currentUser = { uid: 'test-user-123' }

    batchDelete = jest.fn()
    batchUpdate = jest.fn()
    batchCommit = jest.fn().mockResolvedValue(undefined)

    mockWriteBatch.mockReturnValue({
      set: jest.fn(),
      update: batchUpdate,
      delete: batchDelete,
      commit: batchCommit,
    })
  })

  // ==========================================================================
  // HAPPY PATH
  // ==========================================================================

  it('should allow user to leave a challenge they joined', async () => {
    // Arrange
    const challengeId = 'challenge-123'

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        userId: 'test-user-123',
        challengeId: 'challenge-123',
        progress: 50,
      }),
    })

    // Act
    await firebaseChallengeApi.leaveChallenge(challengeId)

    // Assert
    expect(batchDelete).toHaveBeenCalled()
    expect(batchUpdate).toHaveBeenCalled()
    expect(batchCommit).toHaveBeenCalled()
  })

  it('should decrement participant count when leaving', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        userId: 'test-user-123',
        challengeId: 'challenge-123',
      }),
    })

    // Act
    await firebaseChallengeApi.leaveChallenge('challenge-123')

    // Assert
    expect(batchUpdate).toHaveBeenCalled()
    expect(mockIncrement).toHaveBeenCalledWith(-1)
  })

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  it('should require authentication', async () => {
    // Arrange
    mockAuth.currentUser = null

    // Act & Assert
    await expect(firebaseChallengeApi.leaveChallenge('challenge-123')).rejects.toThrow(
      'User not authenticated'
    )
  })

  it('should prevent leaving challenge not participating in', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    })

    // Act & Assert
    await expect(firebaseChallengeApi.leaveChallenge('challenge-123')).rejects.toThrow(
      'Not participating in this challenge'
    )
  })

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  it('should handle Firestore errors gracefully', async () => {
    // Arrange
    mockGetDoc.mockRejectedValue(new Error('Firestore error'))

    // Act & Assert
    await expect(firebaseChallengeApi.leaveChallenge('challenge-123')).rejects.toThrow()
  })
})
