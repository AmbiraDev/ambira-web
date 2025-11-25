/**
 * Unit Tests for Challenge Creation
 * Tests createChallenge function with various scenarios
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { firebaseChallengeApi } from '@/lib/api/challenges'
import type { CreateChallengeData } from '@/types'

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

const mockAddDoc = jest.fn()
const mockGetDoc = jest.fn()
const mockDoc = jest.fn()
const mockCollection = jest.fn()
const mockServerTimestamp = jest.fn(() => new Date())

jest.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  addDoc: mockAddDoc,
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: mockServerTimestamp,
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

describe('firebaseChallengeApi.createChallenge', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.currentUser = { uid: 'test-user-123' }
  })

  // ==========================================================================
  // HAPPY PATH
  // ==========================================================================

  it('should create a challenge with valid data', async () => {
    // Arrange
    const challengeData: CreateChallengeData = {
      name: 'November Code Sprint',
      description: 'Code for 100 hours this month',
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 100,
    }

    mockAddDoc.mockResolvedValue({ id: 'challenge-123' })

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
    expect(mockAddDoc).toHaveBeenCalled()
  })

  it('should create a group challenge with valid group admin', async () => {
    // Arrange
    const challengeData: CreateChallengeData = {
      name: 'Group Challenge',
      description: 'Team goal',
      type: 'group-goal',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 500,
      groupId: 'group-123',
    }

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        name: 'Test Group',
        adminUserIds: ['test-user-123', 'other-admin'],
      }),
    })

    mockAddDoc.mockResolvedValue({ id: 'challenge-456' })

    // Act
    const result = await firebaseChallengeApi.createChallenge(challengeData)

    // Assert
    expect(result.groupId).toBe('group-123')
    expect(result.id).toBe('challenge-456')
    expect(mockGetDoc).toHaveBeenCalled()
  })

  it('should set participantCount to 0 initially', async () => {
    // Arrange
    const challengeData: CreateChallengeData = {
      name: 'Test Challenge',
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 50,
    }

    mockAddDoc.mockResolvedValue({ id: 'challenge-789' })

    // Act
    const result = await firebaseChallengeApi.createChallenge(challengeData)

    // Assert
    expect(result.participantCount).toBe(0)
  })

  it('should set isActive to true by default', async () => {
    // Arrange
    const challengeData: CreateChallengeData = {
      name: 'Active Challenge',
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 100,
    }

    mockAddDoc.mockResolvedValue({ id: 'challenge-active' })

    // Act
    const result = await firebaseChallengeApi.createChallenge(challengeData)

    // Assert
    expect(result.isActive).toBe(true)
  })

  it('should create challenge with different types', async () => {
    // Arrange
    const types = ['most-activity', 'fastest-effort', 'longest-session', 'group-goal'] as const

    for (const type of types) {
      const challengeData: CreateChallengeData = {
        name: `${type} Challenge`,
        type,
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
        goalValue: 100,
      }

      mockAddDoc.mockResolvedValue({ id: `challenge-${type}` })

      // Act
      const result = await firebaseChallengeApi.createChallenge(challengeData)

      // Assert
      expect(result.type).toBe(type)
    }
  })

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  it('should require authentication', async () => {
    // Arrange
    mockAuth.currentUser = null

    const challengeData: CreateChallengeData = {
      name: 'Test Challenge',
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 100,
    }

    // Act & Assert
    await expect(firebaseChallengeApi.createChallenge(challengeData)).rejects.toThrow(
      'User not authenticated'
    )
  })

  it('should verify group exists for group challenges', async () => {
    // Arrange
    const challengeData: CreateChallengeData = {
      name: 'Group Challenge',
      type: 'group-goal',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 500,
      groupId: 'non-existent-group',
    }

    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => null,
    })

    // Act & Assert
    await expect(firebaseChallengeApi.createChallenge(challengeData)).rejects.toThrow(
      'Group not found'
    )
  })

  it('should verify user is group admin for group challenges', async () => {
    // Arrange
    const challengeData: CreateChallengeData = {
      name: 'Group Challenge',
      type: 'group-goal',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 500,
      groupId: 'group-123',
    }

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        name: 'Test Group',
        adminUserIds: ['other-admin', 'another-admin'], // Current user not in list
      }),
    })

    // Act & Assert
    await expect(firebaseChallengeApi.createChallenge(challengeData)).rejects.toThrow(
      'Only group admins can create challenges'
    )
  })

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  it('should handle optional fields correctly', async () => {
    // Arrange
    const challengeData: CreateChallengeData = {
      name: 'Minimal Challenge',
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 100,
      // Optional fields omitted
    }

    mockAddDoc.mockResolvedValue({ id: 'challenge-minimal' })

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
      rewards: 'Badge and bragging rights',
      category: 'productivity',
    }

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        name: 'Test Group',
        adminUserIds: ['test-user-123'],
      }),
    })

    mockAddDoc.mockResolvedValue({ id: 'challenge-complete' })

    // Act
    const result = await firebaseChallengeApi.createChallenge(challengeData)

    // Assert
    expect(result).toMatchObject({
      id: 'challenge-complete',
      name: 'Complete Challenge',
      description: 'Full description',
      rules: 'Challenge rules here',
      rewards: 'Badge and bragging rights',
      category: 'productivity',
    })
  })

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  it('should handle Firestore errors gracefully', async () => {
    // Arrange
    const challengeData: CreateChallengeData = {
      name: 'Test Challenge',
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 100,
    }

    mockAddDoc.mockRejectedValue(new Error('Firestore error'))

    // Act & Assert
    await expect(firebaseChallengeApi.createChallenge(challengeData)).rejects.toThrow()
  })

  it('should handle network errors', async () => {
    // Arrange
    const challengeData: CreateChallengeData = {
      name: 'Test Challenge',
      type: 'most-activity',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-30'),
      goalValue: 100,
    }

    mockAddDoc.mockRejectedValue(new Error('Network error'))

    // Act & Assert
    await expect(firebaseChallengeApi.createChallenge(challengeData)).rejects.toThrow()
  })
})
