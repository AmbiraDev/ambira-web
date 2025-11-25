/**
 * Tests for sessions helpers - activity population
 */

import { populateSessionsWithDetails } from '@/lib/api/sessions/helpers'
import { getAllActivityTypes } from '@/lib/api/activityTypes'
import { doc, getDoc } from 'firebase/firestore'
import type { DocumentSnapshot, DocumentData } from 'firebase/firestore'

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-user-id',
    },
  },
}))

// Mock activityTypes
jest.mock('@/lib/api/activityTypes')

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    fromDate: jest.fn((date: Date) => date),
    now: jest.fn(() => new Date()),
  },
}))

const mockGetAllActivityTypes = getAllActivityTypes as jest.MockedFunction<
  typeof getAllActivityTypes
>
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>

describe('populateSessionsWithDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should populate sessions with default activity names (e.g., Coding)', async () => {
    // Arrange: Mock activity types including "Coding"
    mockGetAllActivityTypes.mockResolvedValue([
      {
        id: 'coding',
        name: 'Coding',
        category: 'productivity',
        icon: 'flat-color-icons:electronics',
        defaultColor: '#5856D6',
        isSystem: true,
        order: 2,
        description: 'Software development and programming',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'work',
        name: 'Work',
        category: 'productivity',
        icon: 'flat-color-icons:briefcase',
        defaultColor: '#0066CC',
        isSystem: true,
        order: 1,
        description: 'Professional work and meetings',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    // Mock user document
    const mockUserDoc = {
      exists: () => true,
      data: () => ({
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as DocumentSnapshot<DocumentData>

    mockGetDoc.mockResolvedValue(mockUserDoc)

    // Mock session document
    const mockSessionDoc = {
      id: 'session-1',
      data: () => ({
        userId: 'test-user-id',
        activityId: 'coding',
        title: 'Evening Work Session',
        description: '',
        duration: 300, // 5 minutes
        startTime: new Date(),
        tags: [],
        visibility: 'everyone',
        supportedBy: [],
        supportCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as DocumentSnapshot<DocumentData>

    // Act: Populate sessions
    const result = await populateSessionsWithDetails([mockSessionDoc])

    // Assert: Check that activity is properly populated
    expect(result).toHaveLength(1)
    expect(result[0]?.activity).toBeDefined()
    expect(result[0]?.activity.name).toBe('Coding')
    expect(result[0]?.activity.id).toBe('coding')
    expect(result[0]?.activity.icon).toBe('flat-color-icons:electronics')
    expect(result[0]?.activity.color).toBe('#5856D6')
  })

  it('should populate sessions with Work activity', async () => {
    // Arrange
    mockGetAllActivityTypes.mockResolvedValue([
      {
        id: 'work',
        name: 'Work',
        category: 'productivity',
        icon: 'flat-color-icons:briefcase',
        defaultColor: '#0066CC',
        isSystem: true,
        order: 1,
        description: 'Professional work and meetings',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    const mockUserDoc = {
      exists: () => true,
      data: () => ({
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as DocumentSnapshot<DocumentData>

    mockGetDoc.mockResolvedValue(mockUserDoc)

    const mockSessionDoc = {
      id: 'session-2',
      data: () => ({
        userId: 'test-user-id',
        activityId: 'work',
        title: 'Work Session',
        description: '',
        duration: 0,
        startTime: new Date(),
        tags: [],
        visibility: 'everyone',
        supportedBy: [],
        supportCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as DocumentSnapshot<DocumentData>

    // Act
    const result = await populateSessionsWithDetails([mockSessionDoc])

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0]?.activity.name).toBe('Work')
    expect(result[0]?.activity.id).toBe('work')
  })

  it('should use projectId as fallback when activityId is not present', async () => {
    // Arrange
    mockGetAllActivityTypes.mockResolvedValue([
      {
        id: 'coding',
        name: 'Coding',
        category: 'productivity',
        icon: 'flat-color-icons:electronics',
        defaultColor: '#5856D6',
        isSystem: true,
        order: 2,
        description: 'Software development and programming',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    const mockUserDoc = {
      exists: () => true,
      data: () => ({
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as DocumentSnapshot<DocumentData>

    mockGetDoc.mockResolvedValue(mockUserDoc)

    // Session with projectId but no activityId (backward compatibility)
    const mockSessionDoc = {
      id: 'session-3',
      data: () => ({
        userId: 'test-user-id',
        projectId: 'coding', // Using projectId instead of activityId
        title: 'Legacy Session',
        description: '',
        duration: 300,
        startTime: new Date(),
        tags: [],
        visibility: 'everyone',
        supportedBy: [],
        supportCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as DocumentSnapshot<DocumentData>

    // Act
    const result = await populateSessionsWithDetails([mockSessionDoc])

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0]?.activity.name).toBe('Coding')
    expect(result[0]?.activity.id).toBe('coding')
  })
})
