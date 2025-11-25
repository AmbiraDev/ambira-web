/**
 * Integration Test: Activity Picker Flow
 *
 * Tests the activity picker workflow:
 * - Load picker → shows recent activities → select activity → creates session
 * - Create new activity from picker → activity immediately available
 * - Recent activities update based on usage
 */

import {
  createTestQueryClient,
  createMockFirebaseApi,
  testFirebaseStore,
  resetFirebaseStore,
  createTestUser,
  createTestSession,
  resetFactoryCounters,
  waitForCacheUpdate,
} from '../__helpers__'
import { CACHE_KEYS } from '@/lib/queryClient'
import { UserActivityPreference, ActivityType } from '@/types'

// Mock Firebase API
let mockFirebaseApi: any

jest.mock('@/lib/api/activityTypes', () => ({
  getSystemActivityTypes: () => mockFirebaseApi.activityTypes.getSystemTypes(),
  getUserCustomActivityTypes: (userId: string) =>
    mockFirebaseApi.activityTypes.getUserCustom(userId),
  getAllActivityTypes: (userId: string) => mockFirebaseApi.activityTypes.getAll(userId),
  createCustomActivityType: (userId: string, data: any) =>
    mockFirebaseApi.activityTypes.create(userId, data),
}))

jest.mock('@/lib/api/activityPreferences', () => ({
  getRecentActivities: (userId: string, limit: number) =>
    mockFirebaseApi.activityPreferences.getRecent(userId, limit),
  getAllActivityPreferences: (userId: string) => mockFirebaseApi.activityPreferences.getAll(userId),
}))

describe('Integration: Activity Picker Flow', () => {
  let queryClient: any
  let user: any
  const DEFAULT_ACTIVITY_IDS = ['work', 'coding', 'side-project', 'planning', 'study']

  beforeEach(async () => {
    // Initialize mockFirebaseApi before tests
    mockFirebaseApi = createMockFirebaseApi(testFirebaseStore)

    queryClient = createTestQueryClient()
    resetFirebaseStore()
    resetFactoryCounters()
    jest.clearAllMocks()

    // Setup test data
    user = createTestUser({ email: 'test@example.com' })
    testFirebaseStore.createUser(user)
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('loads picker with system activities available', async () => {
    // Act: Get all activities for picker
    const allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)

    // Assert: Picker has system activities
    expect(allActivities.length).toBeGreaterThanOrEqual(10)

    const workActivity = allActivities.find((a: ActivityType) => a.id === 'work')
    const codingActivity = allActivities.find((a: ActivityType) => a.id === 'coding')

    expect(workActivity).toBeDefined()
    expect(codingActivity).toBeDefined()
  })

  it('shows recent activities when picker loads', async () => {
    // Arrange: Create activity preferences to simulate past usage
    testFirebaseStore.createActivityPreference(user.id, 'work')
    testFirebaseStore.createActivityPreference(user.id, 'coding')
    testFirebaseStore.createActivityPreference(user.id, 'study')

    // Act: Get recent activities (top 5)
    const recentActivities = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)

    // Assert: Recent activities shown
    expect(recentActivities.length).toBeGreaterThan(0)
    expect(recentActivities.length).toBeLessThanOrEqual(5)

    const activityIds = recentActivities.map((p: UserActivityPreference) => p.typeId)
    expect(activityIds).toContain('work')
    expect(activityIds).toContain('coding')
    expect(activityIds).toContain('study')
  })

  it('shows vertical list of all activities in picker', async () => {
    // Arrange: Create some custom activities
    const custom1 = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Guitar Practice',
      icon: 'Music',
      defaultColor: '#FF6B6B',
    })

    const custom2 = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Reading',
      icon: 'Book',
      defaultColor: '#34C759',
    })

    // Act: Get all activities for vertical list
    const allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)

    // Assert: Vertical list includes system + custom
    expect(allActivities.length).toBeGreaterThan(10)

    const guitarActivity = allActivities.find((a: ActivityType) => a.id === custom1.id)
    const readingActivity = allActivities.find((a: ActivityType) => a.id === custom2.id)

    expect(guitarActivity).toBeDefined()
    expect(readingActivity).toBeDefined()
  })

  it('selects activity and updates cache optimistically', async () => {
    // Arrange: Set up cache with initial state
    const allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)
    queryClient.setQueryData(['activityTypes', 'combined', user.id], allActivities)

    // Act: User selects activity (optimistically update preferences)
    testFirebaseStore.createActivityPreference(user.id, 'work')

    // Simulate optimistic update
    const recentActivities = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)
    queryClient.setQueryData(['activityPreferences', 'recent', user.id], recentActivities)

    // Assert: Cache updated with selected activity
    const cachedRecent = queryClient.getQueryData(['activityPreferences', 'recent', user.id])
    expect(cachedRecent).toBeDefined()
    expect(cachedRecent[0].typeId).toBe('work')
  })

  it('creates session with selected activity', async () => {
    // Arrange: Activity selected from picker
    const projectId = 'project-1'
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

    // Act: Create session with selected activity
    const session = testFirebaseStore.createSession({
      id: `session-${Date.now()}`,
      userId: user.id,
      projectId,
      activityId: 'work',
      title: 'Morning work session',
      description: 'Focused work on project',
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

    // Create activity preference (simulating session completion updating preference)
    testFirebaseStore.createActivityPreference(user.id, 'work')

    // Assert: Session created with activity
    expect(session).toBeDefined()
    expect(session.activityId).toBe('work')

    // Assert: Activity preference updated
    const pref = testFirebaseStore.getActivityPreference(user.id, 'work')
    expect(pref).toBeDefined()
  })

  it('creates new activity from picker and immediately available', async () => {
    // Arrange: Picker is open
    let allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)
    const initialCount = allActivities.length

    // Act: User creates new activity from picker
    const newActivity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Meditation',
      icon: 'Zen',
      defaultColor: '#FF9500',
      category: 'creative',
    })

    // Assert: New activity created
    expect(newActivity).toBeDefined()

    // Assert: Immediately available in picker
    allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)
    expect(allActivities.length).toBe(initialCount + 1)

    const createdActivity = allActivities.find((a: ActivityType) => a.id === newActivity.id)
    expect(createdActivity).toBeDefined()
    expect(createdActivity?.name).toBe('Meditation')
  })

  it('recent activities update after selecting activity', async () => {
    // Arrange: No usage history
    let recentActivities = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)
    expect(recentActivities).toHaveLength(0)

    // Act: User selects work activity (first time)
    testFirebaseStore.createActivityPreference(user.id, 'work')

    // Assert: Activity now in recent
    recentActivities = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)
    expect(recentActivities.length).toBeGreaterThan(0)
    expect(recentActivities[0].typeId).toBe('work')

    // Wait to ensure different timestamp
    await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 10))

    // Act: User selects coding activity (first time)
    testFirebaseStore.createActivityPreference(user.id, 'coding')

    // Assert: Coding now first (most recent)
    recentActivities = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)
    expect(recentActivities[0].typeId).toBe('coding')
    expect(recentActivities.length).toBeGreaterThanOrEqual(1)
  })

  it('recent activities sorted by lastUsed timestamp', async () => {
    // Arrange: Create multiple preferences with different last used times
    testFirebaseStore.createActivityPreference(user.id, 'work')

    // Simulate time passing
    await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 10))
    testFirebaseStore.createActivityPreference(user.id, 'coding')

    // Simulate more time passing
    await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 10))
    testFirebaseStore.createActivityPreference(user.id, 'study')

    // Act: Get recent activities
    const recentActivities = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)

    // Assert: Sorted by most recent (study should be first)
    expect(recentActivities.length).toBeGreaterThanOrEqual(3)
    expect(recentActivities[0].typeId).toBe('study')
  })

  it('recent activities limited to 5 in horizontal bar', async () => {
    // Arrange: Create 8 preferences
    const activityIds = [
      'work',
      'coding',
      'study',
      'learning',
      'reading',
      'planning',
      'side-project',
      'research',
    ]
    for (const activityId of activityIds) {
      testFirebaseStore.createActivityPreference(user.id, activityId)
      await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 5))
    }

    // Act: Get top 5 recent activities
    const recentActivities = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)

    // Assert: Only 5 returned (most recent)
    expect(recentActivities).toHaveLength(5)
  })

  it('picker respects custom activity custom properties', async () => {
    // Arrange: Create custom activity with specific properties
    const custom = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Advanced Meditation',
      icon: 'Yoga',
      defaultColor: '#FF1744',
      category: 'learning',
      description: 'Advanced meditation and mindfulness practice',
    })

    // Act: Get activity from picker
    const allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)
    const pickerActivity = allActivities.find((a: ActivityType) => a.id === custom.id)

    // Assert: All properties available in picker
    expect(pickerActivity?.name).toBe('Advanced Meditation')
    expect(pickerActivity?.icon).toBe('Yoga')
    expect(pickerActivity?.defaultColor).toBe('#FF1744')
    expect(pickerActivity?.category).toBe('learning')
    expect(pickerActivity?.description).toBe('Advanced meditation and mindfulness practice')
  })

  it('fallback to popular defaults when user has no recent activities', async () => {
    // Arrange: No activity preferences
    const recentActivities = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)
    expect(recentActivities).toHaveLength(0)

    // Act: Get all activities (picker shows all if no recent)
    const allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)

    // Assert: System defaults available as fallback
    const defaultActivities = allActivities
      .filter((a: ActivityType) => a.isSystem)
      .sort((a: ActivityType, b: ActivityType) => a.order - b.order)
      .slice(0, 5) // Top 5 system defaults

    expect(defaultActivities).toHaveLength(5)
    const defaultIds = defaultActivities.map((a: ActivityType) => a.id)
    expect(defaultIds).toContain('work')
    expect(defaultIds).toContain('coding')
  })

  it('handles rapid activity selections without conflicts', async () => {
    // Arrange: Picker is open
    const activities = ['work', 'coding', 'study']

    // Act: Rapid selections
    for (const activityId of activities) {
      testFirebaseStore.createActivityPreference(user.id, activityId)
    }

    // Assert: All selections recorded without conflicts
    const recentActivities = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)
    expect(recentActivities.length).toBeGreaterThanOrEqual(3)

    const recentIds = recentActivities.map((p: UserActivityPreference) => p.typeId)
    for (const activityId of activities) {
      expect(recentIds).toContain(activityId)
    }
  })

  it('supports custom activity descriptions in picker', async () => {
    // Arrange: Create custom activities with descriptions
    const guitar = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Guitar',
      icon: 'Music',
      defaultColor: '#FF6B6B',
      description: 'Acoustic and electric guitar practice',
    })

    const piano = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Piano',
      icon: 'Music',
      defaultColor: '#9C27B0',
      description: 'Classical and modern piano practice',
    })

    // Act: Get activities from picker
    const allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)

    // Assert: Descriptions available for display
    const guitarActivity = allActivities.find((a: ActivityType) => a.id === guitar.id)
    const pianoActivity = allActivities.find((a: ActivityType) => a.id === piano.id)

    expect(guitarActivity?.description).toBe('Acoustic and electric guitar practice')
    expect(pianoActivity?.description).toBe('Classical and modern piano practice')
  })
})
