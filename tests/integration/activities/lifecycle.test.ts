/**
 * Integration Test: Activity Lifecycle Flow
 *
 * Tests the complete custom activity lifecycle:
 * - Create custom activity → appears in activity picker → used in session → tracked in preferences
 * - Edit custom activity → updates propagate to all references
 * - Delete custom activity → removes from picker and preferences
 * - Max 10 custom activities enforcement
 */

import {
  createTestQueryClient,
  createMockFirebaseApi,
  testFirebaseStore,
  resetFirebaseStore,
  createTestUser,
  createTestActivity,
  resetFactoryCounters,
} from '../__helpers__'
import { CACHE_KEYS } from '@/lib/queryClient'
import { ActivityType } from '@/types'

// Mock Firebase API
let mockFirebaseApi: any

jest.mock('@/lib/api/activityTypes', () => ({
  getSystemActivityTypes: () => mockFirebaseApi.activityTypes.getSystemTypes(),
  getUserCustomActivityTypes: (userId: string) =>
    mockFirebaseApi.activityTypes.getUserCustom(userId),
  getAllActivityTypes: (userId: string) => mockFirebaseApi.activityTypes.getAll(userId),
  createCustomActivityType: (userId: string, data: any) =>
    mockFirebaseApi.activityTypes.create(userId, data),
  updateCustomActivityType: (id: string, userId: string, data: any) =>
    mockFirebaseApi.activityTypes.update(id, userId, data),
  deleteCustomActivityType: (id: string, userId: string) =>
    mockFirebaseApi.activityTypes.delete(id, userId),
}))

describe('Integration: Activity Lifecycle Flow', () => {
  let queryClient: any
  let user: any
  let systemTypes: ActivityType[]

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

    // Load system activity types
    systemTypes = await mockFirebaseApi.activityTypes.getSystemTypes()
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('creates custom activity and appears in picker', async () => {
    // Arrange: No custom activities initially
    let customActivities = await mockFirebaseApi.activityTypes.getUserCustom(user.id)
    expect(customActivities).toHaveLength(0)

    // Act: Create custom activity
    const newActivity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Guitar Practice',
      icon: 'Music',
      defaultColor: '#FF6B6B',
      category: 'creative',
      description: 'Practice guitar and music theory',
    })

    // Assert: Activity created
    expect(newActivity).toBeDefined()
    expect(newActivity.name).toBe('Guitar Practice')
    expect(newActivity.isSystem).toBe(false)
    expect(newActivity.userId).toBe(user.id)

    // Assert: Appears in custom activities list
    customActivities = await mockFirebaseApi.activityTypes.getUserCustom(user.id)
    expect(customActivities).toHaveLength(1)
    expect(customActivities[0].name).toBe('Guitar Practice')

    // Assert: Appears in all activities list (combined with system)
    const allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)
    expect(allActivities.length).toBeGreaterThan(10) // System defaults + custom
    const guitarActivity = allActivities.find(
      (a: ActivityType) => a.id === newActivity.id && a.name === 'Guitar Practice'
    )
    expect(guitarActivity).toBeDefined()
  })

  it('edits custom activity and updates all references', async () => {
    // Arrange: Create custom activity
    const created = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Guitar Practice',
      icon: 'Music',
      defaultColor: '#FF6B6B',
    })

    // Simulate using the activity in a session
    testFirebaseStore.createActivityPreference(user.id, created.id)

    // Act: Update custom activity
    const updated = await mockFirebaseApi.activityTypes.update(created.id, user.id, {
      name: 'Electric Guitar Practice',
      defaultColor: '#FF0000',
    })

    // Assert: Activity updated
    expect(updated.name).toBe('Electric Guitar Practice')
    expect(updated.defaultColor).toBe('#FF0000')

    // Assert: Changes appear in list
    const customActivities = await mockFirebaseApi.activityTypes.getUserCustom(user.id)
    const updated_activity = customActivities.find((a: ActivityType) => a.id === created.id)
    expect(updated_activity?.name).toBe('Electric Guitar Practice')

    // Assert: Activity preference still references same activity
    const pref = testFirebaseStore.getActivityPreference(user.id, created.id)
    expect(pref).toBeDefined()
  })

  it('deletes custom activity and removes from preferences', async () => {
    // Arrange: Create custom activity
    const created = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Guitar Practice',
      icon: 'Music',
      defaultColor: '#FF6B6B',
    })

    // Create activity preference (simulating usage in session)
    testFirebaseStore.createActivityPreference(user.id, created.id)

    let prefs = testFirebaseStore.getActivityPreferences(user.id)
    expect(prefs).toHaveLength(1)

    // Act: Delete custom activity
    await mockFirebaseApi.activityTypes.delete(created.id, user.id)

    // Assert: Activity removed from custom list
    const customActivities = await mockFirebaseApi.activityTypes.getUserCustom(user.id)
    const deletedActivity = customActivities.find((a: ActivityType) => a.id === created.id)
    expect(deletedActivity).toBeUndefined()

    // Assert: Still in all activities (only system now)
    const allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)
    expect(allActivities).toHaveLength(10) // Only system defaults

    // Assert: Preference record deleted
    prefs = testFirebaseStore.getActivityPreferences(user.id)
    expect(prefs).toHaveLength(0)
  })

  it('enforces max 10 custom activities limit', async () => {
    // Arrange: Create 10 custom activities
    const customIds: string[] = []
    for (let i = 1; i <= 10; i++) {
      const activity = await mockFirebaseApi.activityTypes.create(user.id, {
        name: `Custom Activity ${i}`,
        icon: 'Activity',
        defaultColor: '#FF6B6B',
      })
      customIds.push(activity.id)
    }

    // Verify 10 created
    let customActivities = await mockFirebaseApi.activityTypes.getUserCustom(user.id)
    expect(customActivities).toHaveLength(10)

    // Act & Assert: Try to create 11th activity - should fail
    await expect(
      mockFirebaseApi.activityTypes.create(user.id, {
        name: 'Custom Activity 11',
        icon: 'Activity',
        defaultColor: '#FF6B6B',
      })
    ).rejects.toThrow(
      'Maximum custom activities reached (10). Delete an existing custom activity to create a new one.'
    )

    // Assert: Still only 10 activities
    customActivities = await mockFirebaseApi.activityTypes.getUserCustom(user.id)
    expect(customActivities).toHaveLength(10)

    // Act: Delete one activity
    await mockFirebaseApi.activityTypes.delete(customIds[0], user.id)

    // Assert: Can now create new activity (9 + 1 = 10)
    const newActivity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Custom Activity Replacement',
      icon: 'Activity',
      defaultColor: '#FF6B6B',
    })

    expect(newActivity).toBeDefined()

    // Assert: Still 10 total
    customActivities = await mockFirebaseApi.activityTypes.getUserCustom(user.id)
    expect(customActivities).toHaveLength(10)
  })

  it('maintains correct order of system defaults and custom activities', async () => {
    // Arrange: Create 2 custom activities
    const custom1 = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'First Custom',
      icon: 'Activity',
      defaultColor: '#FF6B6B',
    })

    const custom2 = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Second Custom',
      icon: 'Activity',
      defaultColor: '#FF6B6B',
    })

    // Act: Get all activities
    const allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)

    // Assert: System defaults come first (order 1-10)
    const systemActivities = allActivities.filter((a: ActivityType) => a.isSystem)
    const customActivities = allActivities.filter((a: ActivityType) => !a.isSystem)

    expect(systemActivities).toHaveLength(10)
    expect(customActivities).toHaveLength(2)

    // System activities should have lower order values
    const minSystemOrder = Math.min(...systemActivities.map((a: ActivityType) => a.order))
    const maxSystemOrder = Math.max(...systemActivities.map((a: ActivityType) => a.order))
    const minCustomOrder = Math.min(...customActivities.map((a: ActivityType) => a.order))

    expect(maxSystemOrder).toBeLessThan(minCustomOrder)
  })

  it('creates activity preference when activity is used in session', async () => {
    // Arrange: Create custom activity
    const activity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Guitar Practice',
      icon: 'Music',
      defaultColor: '#FF6B6B',
    })

    // Verify no preference exists
    let prefs = testFirebaseStore.getActivityPreferences(user.id)
    expect(prefs).toHaveLength(0)

    // Act: Create activity preference (simulating session creation)
    testFirebaseStore.createActivityPreference(user.id, activity.id)

    // Assert: Preference created
    prefs = testFirebaseStore.getActivityPreferences(user.id)
    expect(prefs).toHaveLength(1)
    expect(prefs[0]?.typeId).toBe(activity.id)
  })

  it('tracks activity usage count in preferences', async () => {
    // Arrange: Create custom activity
    const activity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Guitar Practice',
      icon: 'Music',
      defaultColor: '#FF6B6B',
    })

    // Act: Create multiple preferences to simulate repeated usage
    testFirebaseStore.createActivityPreference(user.id, activity.id)
    testFirebaseStore.updateActivityPreference(user.id, activity.id)
    testFirebaseStore.updateActivityPreference(user.id, activity.id)

    // Assert: Usage tracked
    const pref = testFirebaseStore.getActivityPreference(user.id, activity.id)
    expect(pref).toBeDefined()
    expect(pref?.useCount).toBe(3)
  })

  it('custom activities persist after user logout/login', async () => {
    // Arrange: Create custom activity
    const activity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Guitar Practice',
      icon: 'Music',
      defaultColor: '#FF6B6B',
    })

    // Act: Simulate logout/login by fetching again
    const customActivities = await mockFirebaseApi.activityTypes.getUserCustom(user.id)

    // Assert: Activity still exists
    expect(customActivities).toHaveLength(1)
    expect(customActivities[0].name).toBe('Guitar Practice')
  })

  it('cannot edit or delete system activity types', async () => {
    // Arrange: Get system activity
    const systemActivity = systemTypes.find((a) => a.id === 'work')
    expect(systemActivity).toBeDefined()

    // Act & Assert: Try to update system activity
    await expect(
      mockFirebaseApi.activityTypes.update('work', user.id, {
        name: 'Changed Work',
      })
    ).rejects.toThrow('Cannot update default activity types')

    // Act & Assert: Try to delete system activity
    await expect(mockFirebaseApi.activityTypes.delete('work', user.id)).rejects.toThrow(
      'Cannot delete default activity types'
    )
  })

  it('validates activity type fields on creation', async () => {
    // Act & Assert: Missing required fields
    await expect(
      mockFirebaseApi.activityTypes.create(user.id, {
        name: 'Test Activity',
        icon: '',
        defaultColor: '#FF6B6B',
      })
    ).rejects.toThrow()

    await expect(
      mockFirebaseApi.activityTypes.create(user.id, {
        name: '',
        icon: 'Music',
        defaultColor: '#FF6B6B',
      })
    ).rejects.toThrow()

    await expect(
      mockFirebaseApi.activityTypes.create(user.id, {
        name: 'Test Activity',
        icon: 'Music',
        defaultColor: '',
      })
    ).rejects.toThrow()
  })

  it('supports activity categories for organization', async () => {
    // Arrange: Create activities with different categories
    const productivity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Work Focus',
      icon: 'Briefcase',
      defaultColor: '#007AFF',
      category: 'productivity',
    })

    const learning = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Study Music',
      icon: 'BookOpen',
      defaultColor: '#34C759',
      category: 'learning',
    })

    const creative = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Digital Art',
      icon: 'Palette',
      defaultColor: '#FF2D55',
      category: 'creative',
    })

    // Act: Fetch all activities
    const allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)

    // Assert: Categories preserved
    const foundProductivity = allActivities.find((a: ActivityType) => a.id === productivity.id)
    const foundLearning = allActivities.find((a: ActivityType) => a.id === learning.id)
    const foundCreative = allActivities.find((a: ActivityType) => a.id === creative.id)

    expect(foundProductivity?.category).toBe('productivity')
    expect(foundLearning?.category).toBe('learning')
    expect(foundCreative?.category).toBe('creative')
  })
})
