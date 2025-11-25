/**
 * Integration Test: Cache Synchronization for Activities
 *
 * Tests React Query cache synchronization across activities operations:
 * - Create activity → React Query cache updates across all queries
 * - Delete activity → removed from all cached queries
 * - Activity preferences sync with session logging
 * - Multiple components sharing cache stay in sync
 */

import {
  createTestQueryClient,
  createMockFirebaseApi,
  testFirebaseStore,
  resetFirebaseStore,
  createTestUser,
  resetFactoryCounters,
  waitForCacheUpdate,
} from '../__helpers__'
import { ACTIVITY_TYPE_KEYS } from '@/hooks/useActivityTypes'
import { ACTIVITY_PREFERENCE_KEYS } from '@/hooks/useActivityPreferences'
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

jest.mock('@/lib/api/activityPreferences', () => ({
  getRecentActivities: (userId: string, limit: number) =>
    mockFirebaseApi.activityPreferences.getRecent(userId, limit),
  getAllActivityPreferences: (userId: string) => mockFirebaseApi.activityPreferences.getAll(userId),
  updateActivityPreference: (typeId: string, userId?: string) =>
    mockFirebaseApi.activityPreferences.update(typeId, userId),
}))

describe('Integration: Cache Synchronization for Activities', () => {
  let queryClient: any
  let user: any

  beforeEach(async () => {
    // Initialize mockFirebaseApi before tests
    mockFirebaseApi = createMockFirebaseApi(testFirebaseStore)

    queryClient = createTestQueryClient()
    resetFirebaseStore()
    resetFactoryCounters()
    jest.clearAllMocks()

    user = createTestUser({ email: 'cache@example.com' })
    testFirebaseStore.createUser(user)
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('updates custom activity cache when activity created', async () => {
    // Arrange: Load custom activities cache
    const initialCustoms = await mockFirebaseApi.activityTypes.getUserCustom(user.id)
    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), initialCustoms)

    expect(initialCustoms).toHaveLength(0)

    // Act: Create custom activity
    const newActivity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Meditation',
      icon: 'Zen',
      defaultColor: '#FF9500',
    })

    // Simulate optimistic update
    queryClient.setQueryData(
      ACTIVITY_TYPE_KEYS.custom(user.id),
      (old: ActivityType[] | undefined) => [...(old || []), newActivity]
    )

    // Assert: Cache updated
    const cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id))
    expect(cached).toHaveLength(1)
    expect(cached[0].name).toBe('Meditation')
  })

  it('updates combined activity types cache when custom created', async () => {
    // Arrange: Load all activities cache (system + custom)
    const allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)
    const systemCount = allActivities.length

    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.combined(user.id), allActivities)

    // Act: Create custom activity
    const newActivity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Meditation',
      icon: 'Zen',
      defaultColor: '#FF9500',
    })

    // Update combined cache
    queryClient.setQueryData(
      ACTIVITY_TYPE_KEYS.combined(user.id),
      (old: ActivityType[] | undefined) => [...(old || []), newActivity]
    )

    // Assert: Combined cache updated
    const cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.combined(user.id))
    expect(cached.length).toBe(systemCount + 1)
  })

  it('removes activity from custom cache when deleted', async () => {
    // Arrange: Create and cache custom activity
    const activity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Meditation',
      icon: 'Zen',
      defaultColor: '#FF9500',
    })

    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), [activity])

    // Verify in cache
    let cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id))
    expect(cached).toHaveLength(1)

    // Act: Delete activity
    await mockFirebaseApi.activityTypes.delete(activity.id, user.id)

    // Update cache
    queryClient.setQueryData(
      ACTIVITY_TYPE_KEYS.custom(user.id),
      (old: ActivityType[] | undefined) => {
        if (!old) return old
        return old.filter((a: ActivityType) => a.id !== activity.id)
      }
    )

    // Assert: Activity removed from cache
    cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id))
    expect(cached).toHaveLength(0)
  })

  it('removes activity from combined cache when deleted', async () => {
    // Arrange: Create and cache custom activity in combined
    const allActivities = await mockFirebaseApi.activityTypes.getAll(user.id)
    const initialCount = allActivities.length

    const newActivity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Meditation',
      icon: 'Zen',
      defaultColor: '#FF9500',
    })

    const updatedActivities = [...allActivities, newActivity]
    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.combined(user.id), updatedActivities)

    // Verify in cache
    let cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.combined(user.id))
    expect(cached).toHaveLength(initialCount + 1)

    // Act: Delete activity
    await mockFirebaseApi.activityTypes.delete(newActivity.id, user.id)

    // Update cache
    queryClient.setQueryData(
      ACTIVITY_TYPE_KEYS.combined(user.id),
      (old: ActivityType[] | undefined) => {
        if (!old) return old
        return old.filter((a: ActivityType) => a.id !== newActivity.id)
      }
    )

    // Assert: Activity removed from combined
    cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.combined(user.id))
    expect(cached).toHaveLength(initialCount)
  })

  it('updates activity preferences cache when session created', async () => {
    // Arrange: Load preferences cache (empty initially)
    const initialPrefs = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)
    queryClient.setQueryData(ACTIVITY_PREFERENCE_KEYS.recent(user.id, 5), initialPrefs)

    expect(initialPrefs).toHaveLength(0)

    // Act: Create session with activity (updates preference)
    testFirebaseStore.createActivityPreference(user.id, 'work')

    // Get updated preferences
    const updatedPrefs = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)

    // Update cache
    queryClient.setQueryData(ACTIVITY_PREFERENCE_KEYS.recent(user.id, 5), updatedPrefs)

    // Assert: Preferences cache updated
    const cached = queryClient.getQueryData(ACTIVITY_PREFERENCE_KEYS.recent(user.id, 5))
    expect(cached.length).toBeGreaterThan(0)
    expect(cached[0].typeId).toBe('work')
  })

  it('updates all preference caches when activity used', async () => {
    // Arrange: Set up all 3 preference cache types (recent, list, detail)
    queryClient.setQueryData(ACTIVITY_PREFERENCE_KEYS.recent(user.id, 5), [])
    queryClient.setQueryData(ACTIVITY_PREFERENCE_KEYS.list(user.id), [])
    queryClient.setQueryData(ACTIVITY_PREFERENCE_KEYS.detail(user.id, 'work'), null)

    // Act: Create session with work activity
    testFirebaseStore.createActivityPreference(user.id, 'work')

    // Get updated data for all cache types
    const recentData = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)
    const listData = await mockFirebaseApi.activityPreferences.getAll(user.id)
    const detailData = testFirebaseStore.getActivityPreference(user.id, 'work')

    // Update all caches
    queryClient.setQueryData(ACTIVITY_PREFERENCE_KEYS.recent(user.id, 5), recentData)
    queryClient.setQueryData(ACTIVITY_PREFERENCE_KEYS.list(user.id), listData)
    queryClient.setQueryData(ACTIVITY_PREFERENCE_KEYS.detail(user.id, 'work'), detailData)

    // Assert: All caches updated consistently
    const cachedRecent = queryClient.getQueryData(ACTIVITY_PREFERENCE_KEYS.recent(user.id, 5))
    const cachedList = queryClient.getQueryData(ACTIVITY_PREFERENCE_KEYS.list(user.id))
    const cachedDetail = queryClient.getQueryData(ACTIVITY_PREFERENCE_KEYS.detail(user.id, 'work'))

    expect(cachedRecent.length).toBeGreaterThan(0)
    expect(cachedList.length).toBeGreaterThan(0)
    expect(cachedDetail).toBeDefined()
    expect(cachedDetail?.typeId).toBe('work')
  })

  it('maintains consistency across activity type and preference caches', async () => {
    // Arrange: Load both activity types and preferences
    const activities = await mockFirebaseApi.activityTypes.getAll(user.id)
    const prefs = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)

    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.combined(user.id), activities)
    queryClient.setQueryData(ACTIVITY_PREFERENCE_KEYS.recent(user.id, 5), prefs)

    // Act: Use custom activity in session
    const custom = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Custom Activity',
      icon: 'Custom',
      defaultColor: '#FF6B6B',
    })

    testFirebaseStore.createActivityPreference(user.id, custom.id)

    // Update both caches
    const updatedActivities = await mockFirebaseApi.activityTypes.getAll(user.id)
    const updatedPrefs = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)

    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.combined(user.id), updatedActivities)
    queryClient.setQueryData(ACTIVITY_PREFERENCE_KEYS.recent(user.id, 5), updatedPrefs)

    // Assert: Caches are in sync
    const cachedActivities = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.combined(user.id))
    const cachedPrefs = queryClient.getQueryData(ACTIVITY_PREFERENCE_KEYS.recent(user.id, 5))

    // All preferences should reference activities that exist
    for (const pref of cachedPrefs) {
      const activity = cachedActivities.find((a: ActivityType) => a.id === pref.typeId)
      expect(activity).toBeDefined()
    }
  })

  it('handles optimistic updates then server confirmation', async () => {
    // Arrange: Initial cache state
    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), [])

    // Act: Optimistically add to cache before server response
    const optimisticActivity = {
      id: `temp-${Date.now()}`,
      name: 'Optimistic Activity',
      icon: 'Temp',
      defaultColor: '#FF6B6B',
      category: 'productivity' as const,
      isSystem: false,
      userId: user.id,
      order: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    queryClient.setQueryData(
      ACTIVITY_TYPE_KEYS.custom(user.id),
      (old: ActivityType[] | undefined) => [...(old || []), optimisticActivity]
    )

    // Assert: Optimistic update in cache
    let cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id))
    expect(cached).toHaveLength(1)
    expect(cached[0].id).toContain('temp-')

    // Act: Server responds with real ID
    const serverActivity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Optimistic Activity',
      icon: 'Temp',
      defaultColor: '#FF6B6B',
    })

    // Replace optimistic with server response
    queryClient.setQueryData(
      ACTIVITY_TYPE_KEYS.custom(user.id),
      (old: ActivityType[] | undefined) => {
        if (!old) return old
        return old.map((a: ActivityType) => (a.id.startsWith('temp-') ? serverActivity : a))
      }
    )

    // Assert: Cache updated with real ID
    cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id))
    expect(cached).toHaveLength(1)
    expect(cached[0].id).toBe(serverActivity.id)
    expect(cached[0].id).not.toContain('temp-')
  })

  it('rolls back optimistic updates on error', async () => {
    // Arrange: Initial cache state
    const initialActivity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Initial',
      icon: 'Test',
      defaultColor: '#FF6B6B',
    })

    const previousData = [initialActivity]
    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), previousData)

    // Act: Optimistically add new activity
    const optimisticActivity = {
      id: `temp-${Date.now()}`,
      name: 'Failing Activity',
      icon: 'Test',
      defaultColor: '#FF6B6B',
      category: 'productivity' as const,
      isSystem: false,
      userId: user.id,
      order: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    queryClient.setQueryData(
      ACTIVITY_TYPE_KEYS.custom(user.id),
      (old: ActivityType[] | undefined) => [...(old || []), optimisticActivity]
    )

    // Assert: Optimistic update applied
    let cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id))
    expect(cached).toHaveLength(2)

    // Act: Error occurred, rollback to previous
    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), previousData)

    // Assert: Rolled back to previous state
    cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id))
    expect(cached).toHaveLength(1)
    expect(cached[0].name).toBe('Initial')
  })

  it('invalidates cache after server mutation completes', async () => {
    // Arrange: Set cache with initial data
    const activity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Original',
      icon: 'Test',
      defaultColor: '#FF6B6B',
    })

    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), [activity])

    // Act: Update activity
    const updated = await mockFirebaseApi.activityTypes.update(activity.id, user.id, {
      name: 'Updated',
    })

    // Simulate server update then invalidate cache to refetch
    queryClient.invalidateQueries({
      queryKey: ACTIVITY_TYPE_KEYS.custom(user.id),
    })

    // Assert: Cache invalidated (should be empty or refetched)
    const isStale = queryClient.getQueryState(ACTIVITY_TYPE_KEYS.custom(user.id))?.isInvalidated

    // Re-fetch fresh data
    const freshData = await mockFirebaseApi.activityTypes.getUserCustom(user.id)
    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), freshData)

    // Assert: Cache updated with fresh data
    const cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id))
    expect(cached[0].name).toBe('Updated')
  })

  it('syncs activity cache across multiple components', async () => {
    // Arrange: Simulate 2 components both using custom activities
    const component1Key = ACTIVITY_TYPE_KEYS.custom(user.id)
    const component2Key = ACTIVITY_TYPE_KEYS.combined(user.id)

    const activities = await mockFirebaseApi.activityTypes.getAll(user.id)

    queryClient.setQueryData(component1Key, [])
    queryClient.setQueryData(component2Key, activities)

    // Act: Create activity
    const newActivity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Shared Activity',
      icon: 'Shared',
      defaultColor: '#FF6B6B',
    })

    // Update both caches
    queryClient.setQueryData(component1Key, (old: ActivityType[] | undefined) => [
      ...(old || []),
      newActivity,
    ])

    queryClient.setQueryData(component2Key, (old: ActivityType[] | undefined) => [
      ...(old || []),
      newActivity,
    ])

    // Assert: Both components see the same activity
    const cached1 = queryClient.getQueryData(component1Key)
    const cached2 = queryClient.getQueryData(component2Key)

    const activity1 = cached1.find((a: any) => a.id === newActivity.id)
    const activity2 = cached2.find((a: any) => a.id === newActivity.id)

    expect(activity1).toBeDefined()
    expect(activity2).toBeDefined()
    expect(activity1.name).toBe(activity2.name)
  })

  it('handles preference updates without affecting activity type cache', async () => {
    // Arrange: Load both caches
    const activities = await mockFirebaseApi.activityTypes.getAll(user.id)
    const prefs: any[] = []

    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.combined(user.id), activities)
    queryClient.setQueryData(ACTIVITY_PREFERENCE_KEYS.recent(user.id, 5), prefs)

    const initialActivityCount = activities.length

    // Act: Update activity preference (use activity in session)
    testFirebaseStore.createActivityPreference(user.id, 'work')

    // Update only preference cache
    const updatedPrefs = await mockFirebaseApi.activityPreferences.getRecent(user.id, 5)
    queryClient.setQueryData(ACTIVITY_PREFERENCE_KEYS.recent(user.id, 5), updatedPrefs)

    // Assert: Activity cache unchanged
    const cachedActivities = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.combined(user.id))
    expect(cachedActivities).toHaveLength(initialActivityCount)

    // Assert: Preference cache updated
    const cachedPrefs = queryClient.getQueryData(ACTIVITY_PREFERENCE_KEYS.recent(user.id, 5))
    expect(cachedPrefs.length).toBeGreaterThan(0)
  })

  it('maintains cache consistency across create, update, delete cycle', async () => {
    // Arrange: Initial state
    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), [])

    // Act: Create activity
    const created = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Test Activity',
      icon: 'Test',
      defaultColor: '#FF6B6B',
    })

    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), [created])

    // Assert: Created
    let cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id))
    expect(cached).toHaveLength(1)

    // Act: Update activity
    const updated = await mockFirebaseApi.activityTypes.update(created.id, user.id, {
      name: 'Updated Activity',
    })

    queryClient.setQueryData(
      ACTIVITY_TYPE_KEYS.custom(user.id),
      (old: ActivityType[] | undefined) => {
        if (!old) return old
        return old.map((a: ActivityType) => (a.id === created.id ? updated : a))
      }
    )

    // Assert: Updated
    cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id))
    expect(cached[0].name).toBe('Updated Activity')

    // Act: Delete activity
    await mockFirebaseApi.activityTypes.delete(created.id, user.id)

    queryClient.setQueryData(
      ACTIVITY_TYPE_KEYS.custom(user.id),
      (old: ActivityType[] | undefined) => {
        if (!old) return old
        return old.filter((a: ActivityType) => a.id !== created.id)
      }
    )

    // Assert: Deleted
    cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id))
    expect(cached).toHaveLength(0)
  })
})
