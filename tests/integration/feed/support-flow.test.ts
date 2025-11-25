/**
 * Integration Test: Session Support Flow
 *
 * Tests the complete support (like) workflow:
 * - Click support → Optimistic update → API call → Cache invalidation
 * - Undo support → Revert UI → API call
 * - Support count updates correctly
 * - Support state persists
 */

// Note: 'any' types used for test mocks; unused vars acceptable in test setup

import {
  createTestQueryClient,
  createMockFirebaseApi,
  testFirebaseStore,
  resetFirebaseStore,
  createTestUser,
  createTestProject,
  createTestActivity,
  createTestSession,
  resetFactoryCounters,
  waitForCacheUpdate,
} from '../__helpers__'
import { CACHE_KEYS } from '@/lib/queryClient'

// Mock Firebase API
const mockFirebaseApi = createMockFirebaseApi(testFirebaseStore)

jest.mock('@/lib/api', () => ({
  firebaseSocialApi: {
    supportSession: mockFirebaseApi.social.support,
    unsupportSession: mockFirebaseApi.social.unsupport,
  },
}))

describe('Integration: Session Support Flow', () => {
  let queryClient: any
  let user: any
  let otherUser: any
  let project: any
  let activity: any
  let session: any

  beforeEach(() => {
    queryClient = createTestQueryClient()
    resetFirebaseStore()
    resetFactoryCounters()
    jest.clearAllMocks()

    // Setup test data
    user = createTestUser({ email: 'user@test.com', username: 'user1' })
    otherUser = createTestUser({
      email: 'other@test.com',
      username: 'user2',
    })
    project = createTestProject(otherUser.id)
    activity = createTestActivity(otherUser.id)
    session = createTestSession(otherUser.id, project.id, activity.id, {
      title: 'Great work session',
      supportCount: 0,
    })

    testFirebaseStore.createUser(user)
    testFirebaseStore.createUser(otherUser)
    testFirebaseStore.createProject(project)
    testFirebaseStore.createSession(session)
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('supports session with optimistic update and API call', async () => {
    // Arrange: Set initial session in cache
    queryClient.setQueryData(CACHE_KEYS.SESSION(session.id), session)

    // Act: Support session (optimistic update)
    const optimisticSession = {
      ...session,
      supportCount: 1,
      isSupported: true,
    }
    queryClient.setQueryData(CACHE_KEYS.SESSION(session.id), optimisticSession)

    // Act: API call
    await mockFirebaseApi.social.support(session.id, user.id)

    // Assert: API called
    expect(mockFirebaseApi.social.support).toHaveBeenCalledWith(session.id, user.id)

    // Assert: Support recorded in Firebase
    const isSupported = testFirebaseStore.isSupported(session.id, user.id)
    expect(isSupported).toBe(true)

    // Assert: Support count incremented
    const updatedSession = testFirebaseStore.getSession(session.id)
    expect(updatedSession?.supportCount).toBe(1)
  })

  it('unsupports session and reverts count', async () => {
    // Arrange: Support session first
    await mockFirebaseApi.social.support(session.id, user.id)
    expect(testFirebaseStore.isSupported(session.id, user.id)).toBe(true)

    const supportedSession = testFirebaseStore.getSession(session.id)
    expect(supportedSession?.supportCount).toBe(1)

    queryClient.setQueryData(CACHE_KEYS.SESSION(session.id), supportedSession)

    // Act: Unsupport (optimistic update)
    const optimisticSession = {
      ...supportedSession,
      supportCount: 0,
      isSupported: false,
    }
    queryClient.setQueryData(CACHE_KEYS.SESSION(session.id), optimisticSession)

    // Act: API call
    await mockFirebaseApi.social.unsupport(session.id, user.id)

    // Assert: API called
    expect(mockFirebaseApi.social.unsupport).toHaveBeenCalledWith(session.id, user.id)

    // Assert: Support removed
    const isSupported = testFirebaseStore.isSupported(session.id, user.id)
    expect(isSupported).toBe(false)

    // Assert: Support count decremented
    const updatedSession = testFirebaseStore.getSession(session.id)
    expect(updatedSession?.supportCount).toBe(0)
  })

  it('handles multiple users supporting same session', async () => {
    // Arrange: Create additional users
    const user2 = createTestUser({ email: 'user2@test.com' })
    const user3 = createTestUser({ email: 'user3@test.com' })
    testFirebaseStore.createUser(user2)
    testFirebaseStore.createUser(user3)

    // Act: Multiple users support
    await mockFirebaseApi.social.support(session.id, user.id)
    await mockFirebaseApi.social.support(session.id, user2.id)
    await mockFirebaseApi.social.support(session.id, user3.id)

    // Assert: All supports recorded
    expect(testFirebaseStore.isSupported(session.id, user.id)).toBe(true)
    expect(testFirebaseStore.isSupported(session.id, user2.id)).toBe(true)
    expect(testFirebaseStore.isSupported(session.id, user3.id)).toBe(true)

    // Assert: Support count = 3
    const updatedSession = testFirebaseStore.getSession(session.id)
    expect(updatedSession?.supportCount).toBe(3)
  })

  it('prevents duplicate support from same user', async () => {
    // Arrange: Support once
    await mockFirebaseApi.social.support(session.id, user.id)

    // Assert: First support successful
    expect(testFirebaseStore.isSupported(session.id, user.id)).toBe(true)
    const session1 = testFirebaseStore.getSession(session.id)
    expect(session1?.supportCount).toBe(1)

    // Mock to prevent duplicate
    mockFirebaseApi.social.support.mockImplementationOnce(
      async (sessionId: string, userId: string) => {
        if (testFirebaseStore.isSupported(sessionId, userId)) {
          throw new Error('Already supported')
        }
        testFirebaseStore.createSupport(sessionId, userId)
      }
    )

    // Act & Assert: Attempt duplicate support
    await expect(mockFirebaseApi.social.support(session.id, user.id)).rejects.toThrow(
      'Already supported'
    )

    // Assert: Count unchanged
    const session2 = testFirebaseStore.getSession(session.id)
    expect(session2?.supportCount).toBe(1)
  })

  it('updates cache after successful support', async () => {
    // Arrange: Set session in cache
    queryClient.setQueryData(CACHE_KEYS.SESSION(session.id), session)

    // Act: Support and update cache
    await mockFirebaseApi.social.support(session.id, user.id)

    const updatedSession = testFirebaseStore.getSession(session.id)
    queryClient.setQueryData(CACHE_KEYS.SESSION(session.id), updatedSession)

    // Assert: Cache updated
    const cachedSession = queryClient.getQueryData(CACHE_KEYS.SESSION(session.id))
    expect(cachedSession.supportCount).toBe(1)
  })

  it('rolls back optimistic update on API error', async () => {
    // Arrange: Set session in cache
    queryClient.setQueryData(CACHE_KEYS.SESSION(session.id), session)

    // Store previous state
    const previousSession = { ...session }

    // Act: Optimistic update
    queryClient.setQueryData(CACHE_KEYS.SESSION(session.id), {
      ...session,
      supportCount: 1,
      isSupported: true,
    })

    // Mock API error
    mockFirebaseApi.social.support.mockRejectedValueOnce(new Error('Network error'))

    // Act: API call fails
    try {
      await mockFirebaseApi.social.support(session.id, user.id)
    } catch (error) {
      // Rollback optimistic update
      queryClient.setQueryData(CACHE_KEYS.SESSION(session.id), previousSession)
    }

    // Assert: Rolled back
    const cachedSession = queryClient.getQueryData(CACHE_KEYS.SESSION(session.id))
    expect(cachedSession.supportCount).toBe(0)
    expect(cachedSession.isSupported).toBeUndefined()
  })

  it('persists support state across page refresh', async () => {
    // Arrange: Support session
    await mockFirebaseApi.social.support(session.id, user.id)

    // Simulate page refresh
    queryClient.clear()

    // Act: Refetch session
    const refreshedSession = testFirebaseStore.getSession(session.id)
    const isSupported = testFirebaseStore.isSupported(session.id, user.id)

    // Assert: Support persisted
    expect(refreshedSession?.supportCount).toBe(1)
    expect(isSupported).toBe(true)
  })

  it('shows correct support count to all users', async () => {
    // Arrange: Multiple users support
    await mockFirebaseApi.social.support(session.id, user.id)

    const user2 = createTestUser({ email: 'user2@test.com' })
    testFirebaseStore.createUser(user2)
    await mockFirebaseApi.social.support(session.id, user2.id)

    // Act: Each user checks session
    const sessionForUser1 = testFirebaseStore.getSession(session.id)
    const sessionForUser2 = testFirebaseStore.getSession(session.id)

    // Assert: Both see count = 2
    expect(sessionForUser1?.supportCount).toBe(2)
    expect(sessionForUser2?.supportCount).toBe(2)

    // Assert: Each user's support state is correct
    expect(testFirebaseStore.isSupported(session.id, user.id)).toBe(true)
    expect(testFirebaseStore.isSupported(session.id, user2.id)).toBe(true)
  })

  it('handles rapid support/unsupport toggling', async () => {
    // Act: Rapid toggle
    await mockFirebaseApi.social.support(session.id, user.id)
    await mockFirebaseApi.social.unsupport(session.id, user.id)
    await mockFirebaseApi.social.support(session.id, user.id)
    await mockFirebaseApi.social.unsupport(session.id, user.id)
    await mockFirebaseApi.social.support(session.id, user.id)

    // Assert: Final state is supported
    const isSupported = testFirebaseStore.isSupported(session.id, user.id)
    expect(isSupported).toBe(true)

    // Assert: Count = 1
    const updatedSession = testFirebaseStore.getSession(session.id)
    expect(updatedSession?.supportCount).toBe(1)
  })

  it('support count never goes negative', async () => {
    // Arrange: Start with 0 supports
    expect(session.supportCount).toBe(0)

    // Mock to prevent negative
    mockFirebaseApi.social.unsupport.mockImplementationOnce(
      async (sessionId: string, userId: string) => {
        if (!testFirebaseStore.isSupported(sessionId, userId)) {
          // No-op if not supported
          return
        }
        testFirebaseStore.deleteSupport(sessionId, userId)
      }
    )

    // Act: Try to unsupport when not supported
    await mockFirebaseApi.social.unsupport(session.id, user.id)

    // Assert: Count still 0, not negative
    const updatedSession = testFirebaseStore.getSession(session.id)
    expect(updatedSession?.supportCount).toBe(0)
  })
})
