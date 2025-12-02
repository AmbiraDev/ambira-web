/**
 * Unit Tests for Challenge Join/Leave Operations
 * Tests joinChallenge and leaveChallenge functions
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
// TEST SUITE - JOIN CHALLENGE
// ============================================================================

describe.skip('firebaseChallengeApi.joinChallenge', () => {
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

    // Create fresh batch mock for each test
    mockBatch = {
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    }

    const { writeBatch } = jest.requireMock('firebase/firestore')
    writeBatch.mockReturnValue(mockBatch)
  })

  // ==========================================================================
  // HAPPY PATH
  // ==========================================================================

  it('should allow user to join an active challenge', async () => {
    // Arrange
    const { getDoc } = jest.requireMock('firebase/firestore')

    getDoc
      .mockResolvedValueOnce({ exists: () => false })
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
    await firebaseChallengeApi.joinChallenge('challenge-123')

    // Assert
    expect(mockBatch.set).toHaveBeenCalled()
    expect(mockBatch.update).toHaveBeenCalled()
    expect(mockBatch.commit).toHaveBeenCalled()
  })

  it('should create participant record with initial progress 0', async () => {
    // Arrange
    const { getDoc } = jest.requireMock('firebase/firestore')

    getDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: 'Test Challenge',
          startDate: new Date('2025-11-01'),
          endDate: new Date('2025-12-31'),
          isActive: true,
        }),
      })

    // Act
    await firebaseChallengeApi.joinChallenge('challenge-123')

    // Assert
    expect(mockBatch.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        challengeId: 'challenge-123',
        userId: 'test-user-123',
        progress: 0,
        isCompleted: false,
      })
    )
  })

  it('should increment participant count when joining', async () => {
    // Arrange
    const { getDoc, increment } = jest.requireMock('firebase/firestore')

    getDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: 'Test Challenge',
          startDate: new Date('2025-11-01'),
          endDate: new Date('2025-12-31'),
          isActive: true,
        }),
      })

    // Act
    await firebaseChallengeApi.joinChallenge('challenge-123')

    // Assert
    expect(increment).toHaveBeenCalledWith(1)
    expect(mockBatch.update).toHaveBeenCalled()
  })

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  it('should require authentication', async () => {
    // Arrange
    const { auth } = jest.requireMock('@/lib/firebase')
    auth.currentUser = null

    // Act & Assert
    await expect(firebaseChallengeApi.joinChallenge('challenge-123')).rejects.toThrow()
  })

  it('should prevent joining if already participating', async () => {
    // Arrange
    const { getDoc } = jest.requireMock('firebase/firestore')

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        userId: 'test-user-123',
        challengeId: 'challenge-123',
        progress: 50,
      }),
    })

    // Act & Assert
    await expect(firebaseChallengeApi.joinChallenge('challenge-123')).rejects.toThrow()
  })

  it('should prevent joining non-existent challenge', async () => {
    // Arrange
    const { getDoc } = jest.requireMock('firebase/firestore')

    getDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => false })

    // Act & Assert
    await expect(firebaseChallengeApi.joinChallenge('non-existent')).rejects.toThrow()
  })

  it('should prevent joining inactive challenge', async () => {
    // Arrange
    const { getDoc } = jest.requireMock('firebase/firestore')

    getDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: 'Inactive Challenge',
          startDate: new Date('2025-11-01'),
          endDate: new Date('2025-11-30'),
          isActive: false,
        }),
      })

    // Act & Assert
    await expect(firebaseChallengeApi.joinChallenge('challenge-123')).rejects.toThrow()
  })

  it('should prevent joining ended challenge', async () => {
    // Arrange
    const { getDoc } = jest.requireMock('firebase/firestore')

    getDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: 'Ended Challenge',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          isActive: true,
        }),
      })

    // Act & Assert
    await expect(firebaseChallengeApi.joinChallenge('challenge-123')).rejects.toThrow()
  })

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  it('should handle Firestore errors gracefully', async () => {
    // Arrange
    const { getDoc } = jest.requireMock('firebase/firestore')
    getDoc.mockRejectedValue(new Error('Firestore error'))

    // Act & Assert
    await expect(firebaseChallengeApi.joinChallenge('challenge-123')).rejects.toThrow()
  })
})

// ============================================================================
// TEST SUITE - LEAVE CHALLENGE
// ============================================================================

describe.skip('firebaseChallengeApi.leaveChallenge', () => {
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

    // Create fresh batch mock for each test
    mockBatch = {
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    }

    const { writeBatch } = jest.requireMock('firebase/firestore')
    writeBatch.mockReturnValue(mockBatch)
  })

  // ==========================================================================
  // HAPPY PATH
  // ==========================================================================

  it('should allow user to leave a challenge they joined', async () => {
    // Arrange
    const { getDoc } = jest.requireMock('firebase/firestore')

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        userId: 'test-user-123',
        challengeId: 'challenge-123',
        progress: 50,
      }),
    })

    // Act
    await firebaseChallengeApi.leaveChallenge('challenge-123')

    // Assert
    expect(mockBatch.delete).toHaveBeenCalled()
    expect(mockBatch.update).toHaveBeenCalled()
    expect(mockBatch.commit).toHaveBeenCalled()
  })

  it('should decrement participant count when leaving', async () => {
    // Arrange
    const { getDoc, increment } = jest.requireMock('firebase/firestore')

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        userId: 'test-user-123',
        challengeId: 'challenge-123',
      }),
    })

    // Act
    await firebaseChallengeApi.leaveChallenge('challenge-123')

    // Assert
    expect(increment).toHaveBeenCalledWith(-1)
    expect(mockBatch.update).toHaveBeenCalled()
  })

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  it('should require authentication', async () => {
    // Arrange
    const { auth } = jest.requireMock('@/lib/firebase')
    auth.currentUser = null

    // Act & Assert
    await expect(firebaseChallengeApi.leaveChallenge('challenge-123')).rejects.toThrow()
  })

  it('should prevent leaving challenge not participating in', async () => {
    // Arrange
    const { getDoc } = jest.requireMock('firebase/firestore')

    getDoc.mockResolvedValue({
      exists: () => false,
    })

    // Act & Assert
    await expect(firebaseChallengeApi.leaveChallenge('challenge-123')).rejects.toThrow()
  })

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  it('should handle Firestore errors gracefully', async () => {
    // Arrange
    const { getDoc } = jest.requireMock('firebase/firestore')
    getDoc.mockRejectedValue(new Error('Firestore error'))

    // Act & Assert
    await expect(firebaseChallengeApi.leaveChallenge('challenge-123')).rejects.toThrow()
  })
})
