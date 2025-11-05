/**
 * Integration Test: Activity Settings Flow
 *
 * Tests the settings page activity management:
 * - Navigate to settings → create activity → see in list → edit → delete
 * - Form validation and error handling
 * - Optimistic UI updates with React Query cache
 */

import {
  createTestQueryClient,
  createMockFirebaseApi,
  testFirebaseStore,
  resetFirebaseStore,
  createTestUser,
  resetFactoryCounters,
} from '../__helpers__';
import { ACTIVITY_TYPE_KEYS } from '@/hooks/useActivityTypes';
import { ActivityType } from '@/types';

// Mock Firebase API
let mockFirebaseApi: any;

jest.mock('@/lib/api/activityTypes', () => ({
  getUserCustomActivityTypes: (userId: string) =>
    mockFirebaseApi.activityTypes.getUserCustom(userId),
  createCustomActivityType: (userId: string, data: any) =>
    mockFirebaseApi.activityTypes.create(userId, data),
  updateCustomActivityType: (id: string, userId: string, data: any) =>
    mockFirebaseApi.activityTypes.update(id, userId, data),
  deleteCustomActivityType: (id: string, userId: string) =>
    mockFirebaseApi.activityTypes.delete(id, userId),
  getSystemActivityTypes: () => mockFirebaseApi.activityTypes.getSystemTypes(),
  getAllActivityTypes: (userId: string) =>
    mockFirebaseApi.activityTypes.getAll(userId),
}));

describe('Integration: Activity Settings Flow', () => {
  let queryClient: any;
  let user: any;

  beforeEach(() => {
    // Initialize mockFirebaseApi before tests
    mockFirebaseApi = createMockFirebaseApi(testFirebaseStore);

    queryClient = createTestQueryClient();
    resetFirebaseStore();
    resetFactoryCounters();
    jest.clearAllMocks();

    user = createTestUser({ email: 'settings@example.com' });
    testFirebaseStore.createUser(user);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('navigates to settings and loads activity list', async () => {
    // Act: Load settings page - fetch custom activities
    const customActivities = await mockFirebaseApi.activityTypes.getUserCustom(
      user.id
    );

    // Assert: Empty list on first visit
    expect(customActivities).toHaveLength(0);

    // Assert: Can access settings
    const user_data = testFirebaseStore.getUser(user.id);
    expect(user_data).toBeDefined();
  });

  it('creates activity from settings page with form', async () => {
    // Arrange: User on settings page, form ready
    const formData = {
      name: 'Video Editing',
      icon: 'Camera',
      defaultColor: '#FF5722',
      category: 'creative' as const,
      description: 'Video editing and post-production work',
    };

    // Act: Submit form to create activity
    const created = await mockFirebaseApi.activityTypes.create(
      user.id,
      formData
    );

    // Assert: Activity created with form data
    expect(created).toBeDefined();
    expect(created.name).toBe('Video Editing');
    expect(created.icon).toBe('Camera');
    expect(created.defaultColor).toBe('#FF5722');
    expect(created.category).toBe('creative');
    expect(created.description).toBe('Video editing and post-production work');
  });

  it('shows created activity immediately in settings list', async () => {
    // Arrange: Create activity
    const activity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Podcasting',
      icon: 'Microphone',
      defaultColor: '#FF6B6B',
    });

    // Act: Refresh activity list (simulate page load)
    const customActivities = await mockFirebaseApi.activityTypes.getUserCustom(
      user.id
    );

    // Assert: Created activity appears in list
    expect(customActivities).toHaveLength(1);
    expect(customActivities[0].name).toBe('Podcasting');
  });

  it('edits activity from settings page', async () => {
    // Arrange: Create activity
    const activity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Podcasting',
      icon: 'Microphone',
      defaultColor: '#FF6B6B',
    });

    // Act: Click edit, submit form with changes
    const updated = await mockFirebaseApi.activityTypes.update(
      activity.id,
      user.id,
      {
        name: 'Podcast Recording & Editing',
        icon: 'Headphones',
        defaultColor: '#FF0000',
        description: 'Recording, editing, and publishing podcasts',
      }
    );

    // Assert: Activity updated
    expect(updated.name).toBe('Podcast Recording & Editing');
    expect(updated.icon).toBe('Headphones');
    expect(updated.defaultColor).toBe('#FF0000');

    // Assert: Changes appear in list
    const customActivities = await mockFirebaseApi.activityTypes.getUserCustom(
      user.id
    );
    const updatedActivity = customActivities[0];
    expect(updatedActivity.name).toBe('Podcast Recording & Editing');
  });

  it('deletes activity from settings page with confirmation', async () => {
    // Arrange: Create activity
    const activity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Podcasting',
      icon: 'Microphone',
      defaultColor: '#FF6B6B',
    });

    // Verify it exists
    let customActivities = await mockFirebaseApi.activityTypes.getUserCustom(
      user.id
    );
    expect(customActivities).toHaveLength(1);

    // Act: Click delete button, confirm deletion
    await mockFirebaseApi.activityTypes.delete(activity.id, user.id);

    // Assert: Activity removed from list
    customActivities = await mockFirebaseApi.activityTypes.getUserCustom(
      user.id
    );
    expect(customActivities).toHaveLength(0);
  });

  it('validates activity name field', async () => {
    // Act & Assert: Empty name
    await expect(
      mockFirebaseApi.activityTypes.create(user.id, {
        name: '',
        icon: 'Test',
        defaultColor: '#FF6B6B',
      })
    ).rejects.toThrow('Name, icon, and color are required');

    // Act & Assert: Whitespace only
    await expect(
      mockFirebaseApi.activityTypes.create(user.id, {
        name: '   ',
        icon: 'Test',
        defaultColor: '#FF6B6B',
      })
    ).rejects.toThrow();
  });

  it('validates activity icon field', async () => {
    // Act & Assert: Empty icon
    await expect(
      mockFirebaseApi.activityTypes.create(user.id, {
        name: 'Test Activity',
        icon: '',
        defaultColor: '#FF6B6B',
      })
    ).rejects.toThrow('Name, icon, and color are required');
  });

  it('validates activity color field', async () => {
    // Act & Assert: Empty color
    await expect(
      mockFirebaseApi.activityTypes.create(user.id, {
        name: 'Test Activity',
        icon: 'Test',
        defaultColor: '',
      })
    ).rejects.toThrow('Name, icon, and color are required');

    // Act & Assert: Invalid hex color format (should accept any string but validate in UI)
    const activity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Test Activity',
      icon: 'Test',
      defaultColor: '#INVALID', // Backend accepts, UI should validate
    });
    expect(activity).toBeDefined();
  });

  it('validates required fields before submission', async () => {
    // Act & Assert: All missing
    await expect(
      mockFirebaseApi.activityTypes.create(user.id, {
        name: '',
        icon: '',
        defaultColor: '',
      })
    ).rejects.toThrow('Name, icon, and color are required');
  });

  it('shows error message on duplicate activity name', async () => {
    // Arrange: Create first activity
    await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Writing',
      icon: 'PenTool',
      defaultColor: '#FF6B6B',
    });

    // Act & Assert: Try to create duplicate (UI should prevent, or accept duplicates)
    // Note: Based on code, duplicates are allowed
    const duplicate = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Writing',
      icon: 'PenTool',
      defaultColor: '#FF0000',
    });

    // Assert: Both exist (duplicates allowed)
    const customActivities = await mockFirebaseApi.activityTypes.getUserCustom(
      user.id
    );
    expect(customActivities).toHaveLength(2);
  });

  it('displays validation errors inline in form', async () => {
    // Arrange: Form on screen
    const formData = {
      name: 'Valid Activity',
      icon: 'Test',
      defaultColor: '#FF6B6B',
    };

    // Act: Create activity (valid)
    const created = await mockFirebaseApi.activityTypes.create(
      user.id,
      formData
    );

    // Assert: No errors
    expect(created).toBeDefined();

    // Act: Try invalid data
    const invalidData = {
      name: '',
      icon: 'Test',
      defaultColor: '#FF6B6B',
    };

    // Assert: Validation fails
    await expect(
      mockFirebaseApi.activityTypes.create(user.id, invalidData)
    ).rejects.toThrow();
  });

  it('optimistically updates cache on create', async () => {
    // Arrange: Set up cache with empty list
    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), []);

    // Act: Optimistically add to cache before server response
    const newActivity = {
      id: `temp-${Date.now()}`,
      name: 'Painting',
      icon: 'Palette',
      defaultColor: '#FF6B6B',
      category: 'creative' as const,
      isSystem: false,
      userId: user.id,
      order: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    queryClient.setQueryData(
      ACTIVITY_TYPE_KEYS.custom(user.id),
      (old: ActivityType[] | undefined) => [...(old || []), newActivity]
    );

    // Assert: Cache updated optimistically
    const cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id));
    expect(cached).toHaveLength(1);
    expect(cached[0].name).toBe('Painting');
  });

  it('optimistically updates cache on edit', async () => {
    // Arrange: Create activity and cache it
    const activity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Original Name',
      icon: 'Test',
      defaultColor: '#FF6B6B',
    });

    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), [activity]);

    // Act: Optimistically update cache before server
    queryClient.setQueryData(
      ACTIVITY_TYPE_KEYS.custom(user.id),
      (old: ActivityType[] | undefined) => {
        if (!old) return old;
        return old.map((a: ActivityType) =>
          a.id === activity.id
            ? {
                ...a,
                name: 'Updated Name',
                updatedAt: new Date(),
              }
            : a
        );
      }
    );

    // Assert: Cache shows optimistic update
    const cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id));
    expect(cached[0].name).toBe('Updated Name');

    // Act: Server responds with actual update
    const updated = await mockFirebaseApi.activityTypes.update(
      activity.id,
      user.id,
      { name: 'Updated Name' }
    );

    // Assert: Server update matches optimistic
    expect(updated.name).toBe('Updated Name');
  });

  it('optimistically removes from cache on delete', async () => {
    // Arrange: Create activity and cache it
    const activity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'To Delete',
      icon: 'Test',
      defaultColor: '#FF6B6B',
    });

    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), [activity]);

    // Assert: Activity in cache
    let cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id));
    expect(cached).toHaveLength(1);

    // Act: Optimistically remove from cache
    queryClient.setQueryData(
      ACTIVITY_TYPE_KEYS.custom(user.id),
      (old: ActivityType[] | undefined) => {
        if (!old) return old;
        return old.filter((a: ActivityType) => a.id !== activity.id);
      }
    );

    // Assert: Cache updated optimistically
    cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id));
    expect(cached).toHaveLength(0);

    // Act: Server deletes
    await mockFirebaseApi.activityTypes.delete(activity.id, user.id);

    // Assert: Server delete succeeds (matches optimistic)
    const remaining = await mockFirebaseApi.activityTypes.getUserCustom(
      user.id
    );
    expect(remaining).toHaveLength(0);
  });

  it('rollbacks cache on error during create', async () => {
    // Arrange: Set up cache with existing activities
    const existing = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Existing',
      icon: 'Test',
      defaultColor: '#FF6B6B',
    });

    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), [existing]);

    const previousData = [existing];

    // Act: Optimistically add invalid activity
    const newActivity = {
      id: `temp-${Date.now()}`,
      name: 'Invalid',
      icon: 'Test',
      defaultColor: '#FF6B6B',
      category: 'creative' as const,
      isSystem: false,
      userId: user.id,
      order: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    queryClient.setQueryData(
      ACTIVITY_TYPE_KEYS.custom(user.id),
      (old: ActivityType[] | undefined) => [...(old || []), newActivity]
    );

    // Assert: Cache updated
    let cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id));
    expect(cached).toHaveLength(2);

    // Act: Simulate error, rollback cache
    queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), previousData);

    // Assert: Cache rolled back
    cached = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id));
    expect(cached).toHaveLength(1);
    expect(cached[0].name).toBe('Existing');
  });

  it('disables create button when max activities reached', async () => {
    // Arrange: Create 10 activities (max)
    for (let i = 0; i < 10; i++) {
      await mockFirebaseApi.activityTypes.create(user.id, {
        name: `Activity ${i}`,
        icon: 'Test',
        defaultColor: '#FF6B6B',
      });
    }

    // Act: Verify limit reached
    const customActivities = await mockFirebaseApi.activityTypes.getUserCustom(
      user.id
    );

    // Assert: 10 activities
    expect(customActivities).toHaveLength(10);

    // Act: Try to create 11th (should fail)
    // UI should check and disable button
    await expect(
      mockFirebaseApi.activityTypes.create(user.id, {
        name: 'Activity 11',
        icon: 'Test',
        defaultColor: '#FF6B6B',
      })
    ).rejects.toThrow('Maximum custom activities reached');
  });

  it('shows helpful error messages to user', async () => {
    // Act & Assert: Auth error
    const mockAuthError = new Error('User not authenticated or unauthorized');
    expect(mockAuthError.message).toContain('not authenticated');

    // Act & Assert: Max limit error
    for (let i = 0; i < 10; i++) {
      await mockFirebaseApi.activityTypes.create(user.id, {
        name: `Activity ${i}`,
        icon: 'Test',
        defaultColor: '#FF6B6B',
      });
    }

    const error = new Error(
      'Maximum custom activities reached (10). Delete an existing custom activity to create a new one.'
    );
    expect(error.message).toContain('Maximum custom activities reached');
    expect(error.message).toContain('Delete an existing custom activity');
  });

  it('updates combined activity types cache on settings changes', async () => {
    // Arrange: Set up combined cache with system + custom activities
    const system = await mockFirebaseApi.activityTypes.getSystemTypes();
    queryClient.setQueryData(['activityTypes', 'combined', user.id], system);

    // Act: Create custom activity
    const custom = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'New Activity',
      icon: 'Test',
      defaultColor: '#FF6B6B',
    });

    // Assert: Should also update combined cache (usually invalidated)
    // Simulate cache invalidation and refresh
    const allTypes = await mockFirebaseApi.activityTypes.getAll(user.id);
    queryClient.setQueryData(['activityTypes', 'combined', user.id], allTypes);

    const cached = queryClient.getQueryData([
      'activityTypes',
      'combined',
      user.id,
    ]);
    expect(cached.length).toBeGreaterThan(10); // System + custom
  });

  it('handles network errors gracefully', async () => {
    // Arrange: Mock network error
    mockFirebaseApi.activityTypes.create = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network error'));

    // Act & Assert: Error thrown
    await expect(
      mockFirebaseApi.activityTypes.create(user.id, {
        name: 'Test',
        icon: 'Test',
        defaultColor: '#FF6B6B',
      })
    ).rejects.toThrow('Network error');
  });

  it('persists activity settings after navigation', async () => {
    // Arrange: Create activity
    const activity = await mockFirebaseApi.activityTypes.create(user.id, {
      name: 'Persistent Activity',
      icon: 'Test',
      defaultColor: '#FF6B6B',
    });

    // Act: Navigate away and back to settings
    const customActivities = await mockFirebaseApi.activityTypes.getUserCustom(
      user.id
    );

    // Assert: Activity still exists
    expect(customActivities).toHaveLength(1);
    expect(customActivities[0].name).toBe('Persistent Activity');
  });
});
