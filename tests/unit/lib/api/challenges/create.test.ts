/**
 * Unit Tests for Challenge Creation
 * Tests createChallenge function with various scenarios
 */

import { firebaseChallengeApi } from '@/lib/api/challenges'
import type { CreateChallengeData } from '@/types'

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
  addDoc: jest.fn(),
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

describe.skip('firebaseChallengeApi.createChallenge', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { auth } = jest.requireMock('@/lib/firebase')
    auth.currentUser = { uid: 'test-user-123' }
  })

  // ==========================================================================
  // HAPPY PATH
  // ==========================================================================

  it('should create a challenge with valid data', async () => {
    // Arrange
    const { addDoc } = jest.requireMock('firebase/firestore')
    addDoc.mockResolvedValue({ id: 'challenge-123' })

    const challengeData: CreateChallengeData = {
      name: 'November Code Sprint',
      description: 'Code for 100 hours this month',
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 100,
    }

    // Act
    const result = await firebaseChallengeApi.createChallenge(challengeData)

    // Assert
    expect(result).toMatchObject({
      id: 'challenge-123',
      name: 'November Code Sprint',
      type: 'most-activity',
      participantCount: 0,
      isActive: true,
      createdByUserId: 'test-user-123',
    })
    expect(addDoc).toHaveBeenCalled()
  })

  it('should create a group challenge with valid group admin', async () => {
    // Arrange
    const { getDoc, addDoc } = jest.requireMock('firebase/firestore')

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        name: 'Test Group',
        adminUserIds: ['test-user-123', 'other-admin'],
      }),
    })

    addDoc.mockResolvedValue({ id: 'challenge-456' })

    const challengeData: CreateChallengeData = {
      name: 'Group Challenge',
      description: 'Team goal',
      type: 'group-goal',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 500,
      groupId: 'group-123',
    }

    // Act
    const result = await firebaseChallengeApi.createChallenge(challengeData)

    // Assert
    expect(result.groupId).toBe('group-123')
    expect(result.id).toBe('challenge-456')
    expect(getDoc).toHaveBeenCalled()
  })

  it('should set participantCount to 0 initially', async () => {
    // Arrange
    const { addDoc } = jest.requireMock('firebase/firestore')
    addDoc.mockResolvedValue({ id: 'challenge-789' })

    const challengeData: CreateChallengeData = {
      name: 'Test Challenge',
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 50,
    }

    // Act
    const result = await firebaseChallengeApi.createChallenge(challengeData)

    // Assert
    expect(result.participantCount).toBe(0)
  })

  it('should set isActive to true by default', async () => {
    // Arrange
    const { addDoc } = jest.requireMock('firebase/firestore')
    addDoc.mockResolvedValue({ id: 'challenge-active' })

    const challengeData: CreateChallengeData = {
      name: 'Active Challenge',
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 100,
    }

    // Act
    const result = await firebaseChallengeApi.createChallenge(challengeData)

    // Assert
    expect(result.isActive).toBe(true)
  })

  it('should handle optional fields correctly', async () => {
    // Arrange
    const { addDoc } = jest.requireMock('firebase/firestore')
    addDoc.mockResolvedValue({ id: 'challenge-minimal' })

    const challengeData: CreateChallengeData = {
      name: 'Minimal Challenge',
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 100,
    }

    // Act
    const result = await firebaseChallengeApi.createChallenge(challengeData)

    // Assert
    expect(result).toMatchObject({
      id: 'challenge-minimal',
      name: 'Minimal Challenge',
      participantCount: 0,
      isActive: true,
    })
  })

  it('should handle challenge with all optional fields', async () => {
    // Arrange
    const { getDoc, addDoc } = jest.requireMock('firebase/firestore')

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        name: 'Test Group',
        adminUserIds: ['test-user-123'],
      }),
    })

    addDoc.mockResolvedValue({ id: 'challenge-complete' })

    const challengeData: CreateChallengeData = {
      name: 'Complete Challenge',
      description: 'Full description',
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 100,
      groupId: 'group-123',
      rules: 'Challenge rules here',
      projectIds: ['project-1', 'project-2'],
      rewards: ['Badge and bragging rights'],
      category: 'productivity',
    }

    // Act
    const result = await firebaseChallengeApi.createChallenge(challengeData)

    // Assert
    expect(result).toMatchObject({
      id: 'challenge-complete',
      name: 'Complete Challenge',
      description: 'Full description',
      rules: 'Challenge rules here',
    })
  })

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  it('should require authentication', async () => {
    // Arrange
    const { auth } = jest.requireMock('@/lib/firebase')
    auth.currentUser = null

    const challengeData: CreateChallengeData = {
      name: 'Test Challenge',
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 100,
    }

    // Act & Assert
    await expect(firebaseChallengeApi.createChallenge(challengeData)).rejects.toThrow()
  })

  it('should verify group exists for group challenges', async () => {
    // Arrange
    const { getDoc } = jest.requireMock('firebase/firestore')

    getDoc.mockResolvedValue({
      exists: () => false,
      data: () => null,
    })

    const challengeData: CreateChallengeData = {
      name: 'Group Challenge',
      type: 'group-goal',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 500,
      groupId: 'non-existent-group',
    }

    // Act & Assert
    await expect(firebaseChallengeApi.createChallenge(challengeData)).rejects.toThrow()
  })

  it('should verify user is group admin for group challenges', async () => {
    // Arrange
    const { getDoc } = jest.requireMock('firebase/firestore')

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        name: 'Test Group',
        adminUserIds: ['other-admin', 'another-admin'],
      }),
    })

    const challengeData: CreateChallengeData = {
      name: 'Group Challenge',
      type: 'group-goal',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 500,
      groupId: 'group-123',
    }

    // Act & Assert
    await expect(firebaseChallengeApi.createChallenge(challengeData)).rejects.toThrow()
  })

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  it('should handle Firestore errors gracefully', async () => {
    // Arrange
    const { addDoc } = jest.requireMock('firebase/firestore')
    addDoc.mockRejectedValue(new Error('Firestore error'))

    const challengeData: CreateChallengeData = {
      name: 'Test Challenge',
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 100,
    }

    // Act & Assert
    await expect(firebaseChallengeApi.createChallenge(challengeData)).rejects.toThrow()
  })

  it('should handle network errors', async () => {
    // Arrange
    const { addDoc } = jest.requireMock('firebase/firestore')
    addDoc.mockRejectedValue(new Error('Network error'))

    const challengeData: CreateChallengeData = {
      name: 'Test Challenge',
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 100,
    }

    // Act & Assert
    await expect(firebaseChallengeApi.createChallenge(challengeData)).rejects.toThrow()
  })
})
