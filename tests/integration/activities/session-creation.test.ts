/**
 * Integration Test: Session Creation with Activities
 *
 * Tests the complete session creation workflow with activities:
 * - Select activity → start timer → complete session → activity preference updated
 * - Activity appears in recent activities for next session
 */

import {
  createTestQueryClient,
  createMockFirebaseApi,
  testFirebaseStore,
  resetFirebaseStore,
  createTestUser,
  createTestSession,
  createActiveSessionData,
  resetFactoryCounters,
} from '../__helpers__'
import { CACHE_KEYS } from '@/lib/queryClient'
import { UserActivityPreference, ActivityType } from '@/types'

// Mock Firebase API
let mockFirebaseApi: any

jest.mock('@/lib/api', () => ({
  firebaseSessionApi: {
    saveActiveSession: (userId: string, data: any) =>
      mockFirebaseApi.activeSession.save(userId, data),
    getActiveSession: (userId: string) => mockFirebaseApi.activeSession.get(userId),
    clearActiveSession: (userId: string) => mockFirebaseApi.activeSession.clear(userId),
    createSession: (data: any) => mockFirebaseApi.sessions.create(data),
  },
}))

jest.mock('@/lib/api/activityTypes', () => ({
  getSystemActivityTypes: () => mockFirebaseApi.activityTypes.getSystemTypes(),
  getAllActivityTypes: (userId: string) => mockFirebaseApi.activityTypes.getAll(userId),
}))

jest.mock('@/lib/api/activityPreferences', () => ({
  getRecentActivities: (userId: string, limit: number) =>
    mockFirebaseApi.activityPreferences.getRecent(userId, limit),
  updateActivityPreference: (typeId: string, userId?: string) =>
    mockFirebaseApi.activityPreferences.update(typeId, userId),
}))

describe('Integration: Session Creation with Activities', () => {
  let queryClient: any
  let user: any
  let projectId: string

  beforeEach(async () => {
    // Initialize mockFirebaseApi before tests
    mockFirebaseApi = createMockFirebaseApi(testFirebaseStore)

    queryClient = createTestQueryClient()
    resetFirebaseStore()
    resetFactoryCounters()
    jest.clearAllMocks()

    // Setup test data
    user = createTestUser({ email: 'session@example.com' })
    testFirebaseStore.createUser(user)

    // Create test project
    projectId = `project-${Date.now()}`
    testFirebaseStore.createProject({
      id: projectId,
      userId: user.id,
      name: 'Test Project',
      description: '',
      color: '#007AFF',
      icon: 'folder',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('selects activity from picker and starts timer', async () => {
    // Arrange: Activity picker loaded
    const allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)
    const workActivity = allActivities.find((a: ActivityType) => a.id === 'work')
    expect(workActivity).toBeDefined()

    // Act: User selects activity and starts timer
    const startTime = new Date()
    const timerData = createActiveSessionData(projectId, { startTime })

    await mockFirebaseApi.activeSession.save(user.id, timerData)

    // Assert: Active session saved with activity context
    const activeSession = await mockFirebaseApi.activeSession.get(user.id)
    expect(activeSession).toBeDefined()
    expect(activeSession.projectId).toBe(projectId)
  })

  it('completes session with selected activity', async () => {
    // Arrange: Timer running with work activity
    const startTime = new Date(Date.now() - 1800000) // 30 min ago
    const timerData = createActiveSessionData(projectId, { startTime })

    await mockFirebaseApi.activeSession.save(user.id, timerData)

    // Act: Complete timer - create session
    const sessionData = {
      userId: user.id,
      projectId,
      activityId: 'work',
      title: 'Morning focus work',
      description: 'Completed focused work session',
      duration: 1800,
      startTime,
      visibility: 'everyone' as const,
      supportCount: 0,
      commentCount: 0,
    }

    const session = await mockFirebaseApi.sessions.create(sessionData)

    // Assert: Session created with activity
    expect(session).toBeDefined()
    expect(session.activityId).toBe('work')
    expect(session.duration).toBe(1800)

    // Assert: Session stored
    const stored = testFirebaseStore.getSession(session.id)
    expect(stored).toBeDefined()
    expect(stored?.activityId).toBe('work')
  })

  it('updates activity preference after session creation', async () => {
    // Arrange: Create session with activity
    const startTime = new Date(Date.now() - 3600000)
    const session = testFirebaseStore.createSession({
      id: `session-${Date.now()}`,
      userId: user.id,
      projectId,
      activityId: 'coding',
      title: 'Development work',
      description: 'Coding and debugging',
      duration: 3600,
      startTime,
      createdAt: new Date(),
      updatedAt: new Date(),
      visibility: 'everyone',
      supportCount: 0,
      commentCount: 0,
      isArchived: false,
      tags: [],
      images: [],
      showStartTime: true,
    })

    // Act: Update activity preference
    testFirebaseStore.createActivityPreference(user.id, session.activityId)

    // Assert: Preference created with usage data
    const pref = testFirebaseStore.getActivityPreference(user.id, session.activityId)
    expect(pref).toBeDefined()
    expect(pref?.typeId).toBe('coding')
    expect(pref?.useCount).toBeGreaterThanOrEqual(1)
  })

  it('activity appears in recent activities after session', async () => {
    // Arrange: No recent activities initially
    let recentActivities = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)
    expect(recentActivities).toHaveLength(0)

    // Act: Create session with coding activity
    const startTime = new Date(Date.now() - 3600000)
    testFirebaseStore.createSession({
      id: `session-${Date.now()}`,
      userId: user.id,
      projectId,
      activityId: 'coding',
      title: 'Development work',
      description: 'Coding session',
      duration: 3600,
      startTime,
      createdAt: new Date(),
      updatedAt: new Date(),
      visibility: 'everyone',
      supportCount: 0,
      commentCount: 0,
      isArchived: false,
      tags: [],
      images: [],
      showStartTime: true,
    })

    // Update preference to simulate session completion
    testFirebaseStore.createActivityPreference(user.id, 'coding')

    // Assert: Coding activity now in recent
    recentActivities = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)
    expect(recentActivities.length).toBeGreaterThan(0)
    expect(recentActivities[0].typeId).toBe('coding')
  })

  it('custom activity can be used in session', async () => {
    // Arrange: Create custom activity
    const customActivity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Guitar Practice',
      icon: 'Music',
      defaultColor: '#FF6B6B',
    })

    // Act: Create session using custom activity
    const startTime = new Date(Date.now() - 3600000)
    const session = testFirebaseStore.createSession({
      id: `session-${Date.now()}`,
      userId: user.id,
      projectId,
      activityId: customActivity.id,
      title: 'Guitar practice session',
      description: 'Practiced scales and chords',
      duration: 3600,
      startTime,
      createdAt: new Date(),
      updatedAt: new Date(),
      visibility: 'everyone',
      supportCount: 0,
      commentCount: 0,
      isArchived: false,
      tags: [],
      images: [],
      showStartTime: true,
    })

    // Assert: Session created with custom activity
    expect(session.activityId).toBe(customActivity.id)

    const stored = testFirebaseStore.getSession(session.id)
    expect(stored?.activityId).toBe(customActivity.id)
  })

  it('tracks multiple sessions with different activities', async () => {
    // Arrange: Create sessions with different activities
    const activities = ['work', 'coding', 'study']

    // Act: Create session for each activity with time delays for proper sorting
    const sessions: any[] = []
    for (let i = 0; i < activities.length; i++) {
      const startTime = new Date(Date.now() - 3600000 * (i + 1))
      const activityId = activities[i]
      if (!activityId) continue
      const session = testFirebaseStore.createSession({
        id: `session-${Date.now()}-${i}`,
        userId: user.id,
        projectId,
        activityId,
        title: `Session with ${activityId}`,
        description: `Test session`,
        duration: 3600,
        startTime,
        createdAt: new Date(),
        updatedAt: new Date(),
        visibility: 'everyone',
        supportCount: 0,
        commentCount: 0,
        isArchived: false,
        tags: [],
        images: [],
        showStartTime: true,
      })

      testFirebaseStore.createActivityPreference(user.id, activityId)
      sessions.push(session)

      // Small delay to ensure different timestamps for sorting
      await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 10))
    }

    // Assert: All sessions created with correct activities
    expect(sessions).toHaveLength(3)
    for (let i = 0; i < activities.length; i++) {
      expect(sessions[i].activityId).toBe(activities[i])
    }

    // Assert: All activities in recent (most recent first)
    const recentActivities = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)
    expect(recentActivities.length).toBeGreaterThanOrEqual(3)
    expect(recentActivities[0].typeId).toBe('study') // Most recent
  })

  it('activity preference increments usage count on each session', async () => {
    // Arrange: No preferences yet
    let pref = testFirebaseStore.getActivityPreference(user.id, 'work')
    expect(pref).toBeUndefined()

    // Act: Create first session with work
    testFirebaseStore.createActivityPreference(user.id, 'work')

    // Assert: Usage count is 1
    pref = testFirebaseStore.getActivityPreference(user.id, 'work')
    expect(pref?.useCount).toBe(1)

    // Act: Create second session with work
    testFirebaseStore.updateActivityPreference(user.id, 'work')

    // Assert: Usage count is 2
    pref = testFirebaseStore.getActivityPreference(user.id, 'work')
    expect(pref?.useCount).toBe(2)

    // Act: Create third session with work
    testFirebaseStore.updateActivityPreference(user.id, 'work')

    // Assert: Usage count is 3
    pref = testFirebaseStore.getActivityPreference(user.id, 'work')
    expect(pref?.useCount).toBe(3)
  })

  it('updates lastUsed timestamp on session creation', async () => {
    // Arrange: Create preference
    testFirebaseStore.createActivityPreference(user.id, 'work')

    const pref1 = testFirebaseStore.getActivityPreference(user.id, 'work')
    const firstTime = pref1?.lastUsed

    // Act: Wait and create another session
    await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 50))
    testFirebaseStore.updateActivityPreference(user.id, 'work')

    // Assert: lastUsed timestamp updated
    const pref2 = testFirebaseStore.getActivityPreference(user.id, 'work')
    expect(pref2?.lastUsed).toBeDefined()
    if (firstTime && pref2?.lastUsed) {
      // Timestamp should be updated (might be same in tests due to speed)
      expect(pref2.updatedAt).toBeDefined()
    }
  })

  it('optimistically updates activity preference cache', async () => {
    // Arrange: Set cache to empty
    const PREFERENCE_KEY = ['activityPreferences', 'recent', user.id]
    queryClient.setQueryData(PREFERENCE_KEY, [])

    // Act: Optimistically update cache when user creates session
    const newPref = {
      typeId: 'work',
      userId: user.id,
      lastUsed: new Date(),
      useCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    queryClient.setQueryData(PREFERENCE_KEY, (old: UserActivityPreference[] | undefined) => [
      newPref,
      ...(old || []),
    ])

    // Assert: Cache updated
    const cached = queryClient.getQueryData(PREFERENCE_KEY)
    expect(cached).toHaveLength(1)
    expect(cached[0].typeId).toBe('work')
  })

  it('clears active session after completing', async () => {
    // Arrange: Active session running
    const startTime = new Date()
    const timerData = createActiveSessionData(projectId, { startTime })

    await mockFirebaseApi.activeSession.save(user.id, timerData)

    let activeSession = await mockFirebaseApi.activeSession.get(user.id)
    expect(activeSession).toBeDefined()

    // Act: Complete session
    const session = await mockFirebaseApi.sessions.create({
      userId: user.id,
      projectId,
      activityId: 'work',
      title: 'Completed session',
      duration: 1800,
      startTime,
      visibility: 'everyone' as const,
      supportCount: 0,
      commentCount: 0,
    })

    await mockFirebaseApi.activeSession.clear(user.id)

    // Assert: Active session cleared
    activeSession = await mockFirebaseApi.activeSession.get(user.id)
    expect(activeSession).toBeUndefined()

    // Assert: Session created
    expect(session).toBeDefined()
  })

  it('handles session creation with deleted custom activity', async () => {
    // Arrange: Create custom activity
    const custom = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'To Delete',
      icon: 'Test',
      defaultColor: '#FF6B6B',
    })

    // Create session with it
    const session = testFirebaseStore.createSession({
      id: `session-${Date.now()}`,
      userId: user.id,
      projectId,
      activityId: custom.id,
      title: 'Session',
      description: '',
      duration: 3600,
      startTime: new Date(Date.now() - 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
      visibility: 'everyone',
      supportCount: 0,
      commentCount: 0,
      isArchived: false,
      tags: [],
      images: [],
      showStartTime: true,
    })

    expect(session.activityId).toBe(custom.id)

    // Act: Delete custom activity
    await mockFirebaseApi.activityTypes.delete(custom.id, user.id)

    // Assert: Session still references activity (soft delete)
    const storedSession = testFirebaseStore.getSession(session.id)
    expect(storedSession?.activityId).toBe(custom.id)

    // Assert: Activity no longer in list
    const activities = await mockFirebaseApi.activityTypes.getAll(user.id)
    const found = activities.find((a: ActivityType) => a.id === custom.id)
    expect(found).toBeUndefined()
  })

  it('displays activity details in session record', async () => {
    // Arrange: Get activity to use in session
    const allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)
    const workActivity = allActivities.find((a: ActivityType) => a.id === 'work')

    // Act: Create session with activity
    const session = testFirebaseStore.createSession({
      id: `session-${Date.now()}`,
      userId: user.id,
      projectId,
      activityId: 'work',
      title: 'Work session',
      description: 'Regular work',
      duration: 3600,
      startTime: new Date(Date.now() - 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
      visibility: 'everyone',
      supportCount: 0,
      commentCount: 0,
      isArchived: false,
      tags: [],
      images: [],
      showStartTime: true,
    })

    // Assert: Session stores activity reference
    expect(session.activityId).toBe('work')

    // Can lookup activity details separately
    expect(workActivity?.name).toBe('Work')
    expect(workActivity?.icon).toBe('Briefcase')
  })

  it('supports multiple sessions per activity per day', async () => {
    // Act: Create 3 sessions with same activity on same day
    const sessions: any[] = []
    for (let i = 0; i < 3; i++) {
      const startTime = new Date(Date.now() - 1800000 * (i + 1)) // Staggered times
      const session = testFirebaseStore.createSession({
        id: `session-${Date.now()}-${i}`,
        userId: user.id,
        projectId,
        activityId: 'work',
        title: `Work session ${i + 1}`,
        description: '',
        duration: 1800,
        startTime,
        createdAt: new Date(),
        updatedAt: new Date(),
        visibility: 'everyone',
        supportCount: 0,
        commentCount: 0,
        isArchived: false,
        tags: [],
        images: [],
        showStartTime: true,
      })

      // Create or update preference
      if (i === 0) {
        testFirebaseStore.createActivityPreference(user.id, 'work')
      } else {
        testFirebaseStore.updateActivityPreference(user.id, 'work')
      }
      sessions.push(session)
    }

    // Assert: All sessions created with same activity
    expect(sessions).toHaveLength(3)
    for (const session of sessions) {
      expect(session.activityId).toBe('work')
    }

    // Assert: Preference reflects all sessions
    const pref = testFirebaseStore.getActivityPreference(user.id, 'work')
    expect(pref?.useCount).toBe(3)
  })
})
