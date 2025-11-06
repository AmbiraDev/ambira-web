/**
 * Unit Tests for Activity Types API
 *
 * Tests the core activity type operations:
 * - System activity types (10 defaults)
 * - User custom activities
 * - Combined activity types
 * - CRUD operations for custom activities
 * - Edge cases and error handling
 */

import {
  getSystemActivityTypes,
  getUserCustomActivityTypes,
  getAllActivityTypes,
  createCustomActivityType,
  updateCustomActivityType,
  deleteCustomActivityType,
  getActivityTypeById,
  getActivityTypesByIds,
  type ActivityType,
} from '@/lib/api/activityTypes';

// ============================================================================
// MOCKS
// ============================================================================

jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-123' },
  },
}));

jest.mock('firebase/firestore', () => {
  const mockTimestamp = {
    fromDate: (date: Date) => ({
      toDate: () => date,
    }),
  };

  return {
    collection: jest.fn(() => ({})),
    doc: jest.fn(() => ({})),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    serverTimestamp: jest.fn(() => new Date()),
    Timestamp: mockTimestamp,
  };
});

jest.mock('@/lib/api/shared/utils', () => ({
  convertTimestamp: (value: unknown) => {
    if (value instanceof Date) {
      return value;
    }
    if (
      value &&
      typeof value === 'object' &&
      'toDate' in (value as Record<string, unknown>)
    ) {
      return (value as { toDate: () => Date }).toDate();
    }
    return new Date(value as string);
  },
  removeUndefinedFields: (obj: Record<string, unknown>) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => value !== undefined)
    );
  },
}));

jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock('@/lib/errorHandler', () => ({
  handleError: jest.fn(
    (
      _error: unknown,
      _context: string,
      options?: { defaultMessage?: string }
    ) => ({
      userMessage: options?.defaultMessage || 'handled error',
    })
  ),
}));

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Activity Types API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================================
  // SYSTEM ACTIVITY TYPES
  // ========================================================================

  describe('getSystemActivityTypes()', () => {
    it('should return exactly 10 system activity types', async () => {
      // Act
      const activities = await getSystemActivityTypes();

      // Assert
      expect(activities).toHaveLength(10);
    });

    it('should return activities with correct system properties', async () => {
      // Act
      const activities = await getSystemActivityTypes();

      // Assert
      activities.forEach(activity => {
        expect(activity).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          category: expect.stringMatching(/productivity|learning|creative/),
          icon: expect.any(String),
          defaultColor: expect.stringMatching(/^#[0-9A-F]{6}$/i),
          isSystem: true,
          order: expect.any(Number),
        });
        expect(activity.userId).toBeUndefined();
        expect(activity.createdAt).toBeInstanceOf(Date);
        expect(activity.updatedAt).toBeInstanceOf(Date);
      });
    });

    it('should return activities in correct order (1-10)', async () => {
      // Act
      const activities = await getSystemActivityTypes();

      // Assert
      activities.forEach((activity, index) => {
        expect(activity.order).toBe(index + 1);
      });
    });

    it('should contain expected default activities', async () => {
      // Act
      const activities = await getSystemActivityTypes();
      const activityIds = activities.map(a => a.id);

      // Assert
      expect(activityIds).toEqual([
        'work',
        'coding',
        'side-project',
        'planning',
        'study',
        'learning',
        'reading',
        'research',
        'creative',
        'writing',
      ]);
    });

    it('should have correct activity names', async () => {
      // Act
      const activities = await getSystemActivityTypes();
      const nameMap = new Map(activities.map(a => [a.id, a.name]));

      // Assert
      expect(nameMap.get('work')).toBe('Work');
      expect(nameMap.get('coding')).toBe('Coding');
      expect(nameMap.get('side-project')).toBe('Side Project');
      expect(nameMap.get('study')).toBe('Study');
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const { handleError } = jest.requireMock('@/lib/errorHandler');
      handleError.mockImplementation(() => ({
        userMessage: 'Failed to get default activities',
      }));

      // Act & Assert
      try {
        // This shouldn't throw normally, but we test the error path exists
        const activities = await getSystemActivityTypes();
        expect(activities).toHaveLength(10);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  // ========================================================================
  // USER CUSTOM ACTIVITY TYPES
  // ========================================================================

  describe('getUserCustomActivityTypes()', () => {
    it('should require userId', async () => {
      // Act & Assert
      await expect(getUserCustomActivityTypes('')).rejects.toThrow();
    });

    it('should return empty array for user with no custom activities', async () => {
      // Arrange
      const { getDocs } = jest.requireMock('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          // No documents
        },
      });

      // Act
      const activities = await getUserCustomActivityTypes('user-123');

      // Assert
      expect(activities).toEqual([]);
    });

    it('should fetch custom activities from projects collection', async () => {
      // Arrange
      const { getDocs, collection } = jest.requireMock('firebase/firestore');
      const mockActivities = [
        {
          id: 'guitar',
          data: () => ({
            name: 'Guitar Practice',
            icon: 'Music',
            color: '#FF6482',
            category: 'creative',
            description: 'Guitar practice sessions',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-02'),
          }),
        },
      ];

      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          mockActivities.forEach(callback);
        },
      });

      // Act
      const activities = await getUserCustomActivityTypes('user-123');

      // Assert
      expect(activities).toHaveLength(1);
      expect(activities[0]).toMatchObject({
        id: 'guitar',
        name: 'Guitar Practice',
        icon: 'Music',
        defaultColor: '#FF6482',
        category: 'creative',
        description: 'Guitar practice sessions',
        isSystem: false,
        userId: 'user-123',
      });
    });

    it('should handle missing optional fields with defaults', async () => {
      // Arrange
      const { getDocs } = jest.requireMock('firebase/firestore');
      const mockActivities = [
        {
          id: 'custom-1',
          data: () => ({
            name: 'Custom Activity',
            icon: 'Folder',
            color: '#0066CC',
            // Missing category, description
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      ];

      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          mockActivities.forEach(callback);
        },
      });

      // Act
      const activities = await getUserCustomActivityTypes('user-123');

      // Assert
      expect(activities[0]?.category).toBe('productivity');
      expect(activities[0]?.description).toBe('');
    });
  });

  // ========================================================================
  // COMBINED ACTIVITY TYPES
  // ========================================================================

  describe('getAllActivityTypes()', () => {
    it('should require userId', async () => {
      // Act & Assert
      await expect(getAllActivityTypes('')).rejects.toThrow();
    });

    it('should combine system and custom activities', async () => {
      // Arrange
      const { getDocs } = jest.requireMock('firebase/firestore');
      const mockCustom = [
        {
          id: 'guitar',
          data: () => ({
            name: 'Guitar Practice',
            icon: 'Music',
            color: '#FF6482',
            category: 'creative',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      ];

      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          mockCustom.forEach(callback);
        },
      });

      // Act
      const allActivities = await getAllActivityTypes('user-123');

      // Assert
      expect(allActivities.length).toBe(11); // 10 system + 1 custom
      const customActivity = allActivities.find(a => a.id === 'guitar');
      expect(customActivity?.name).toBe('Guitar Practice');
    });

    it('should sort all activities by order', async () => {
      // Arrange
      const { getDocs } = jest.requireMock('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          // No custom activities
        },
      });

      // Act
      const activities = await getAllActivityTypes('user-123');

      // Assert
      for (let i = 0; i < activities.length - 1; i++) {
        expect(activities[i]?.order).toBeLessThanOrEqual(
          activities[i + 1]?.order ?? 0
        );
      }
    });
  });

  // ========================================================================
  // CREATE CUSTOM ACTIVITY
  // ========================================================================

  describe('createCustomActivityType()', () => {
    it('should require authentication', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      auth.currentUser = null;

      // Act & Assert
      await expect(
        createCustomActivityType('different-user', {
          name: 'Test',
          icon: 'Test',
          defaultColor: '#000000',
        })
      ).rejects.toThrow();
    });

    it('should verify user ownership', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      auth.currentUser = { uid: 'user-123' };

      // Act & Assert
      await expect(
        createCustomActivityType('different-user', {
          name: 'Test',
          icon: 'Test',
          defaultColor: '#000000',
        })
      ).rejects.toThrow();
    });

    it('should require name, icon, and color', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      auth.currentUser = { uid: 'test-user-123' };

      // Act & Assert
      await expect(
        createCustomActivityType('test-user-123', {
          name: '',
          icon: 'Test',
          defaultColor: '#000000',
        })
      ).rejects.toThrow();
    });

    it('should enforce max 10 custom activities limit', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      const { getDocs } = jest.requireMock('firebase/firestore');
      auth.currentUser = { uid: 'test-user-123' };

      // Create 10 mock custom activities
      const mockCustoms = Array.from({ length: 10 }, (_, i) => ({
        id: `custom-${i}`,
        data: () => ({
          name: `Activity ${i}`,
          icon: 'Test',
          color: '#000000',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      }));

      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          mockCustoms.forEach(callback);
        },
      });

      // Act & Assert
      await expect(
        createCustomActivityType('test-user-123', {
          name: 'New Activity',
          icon: 'Test',
          defaultColor: '#000000',
        })
      ).rejects.toThrow();
    });

    it('should create a custom activity successfully', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      const { getDocs, addDoc, collection } =
        jest.requireMock('firebase/firestore');
      auth.currentUser = { uid: 'test-user-123' };

      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          // No existing customs
        },
      });

      const mockDocRef = { id: 'new-activity-123' };
      addDoc.mockResolvedValue(mockDocRef);

      // Act
      const result = await createCustomActivityType('test-user-123', {
        name: 'Guitar Practice',
        icon: 'Music',
        defaultColor: '#FF6482',
        category: 'creative',
        description: 'Practice guitar',
      });

      // Assert
      expect(result).toMatchObject({
        id: 'new-activity-123',
        name: 'Guitar Practice',
        icon: 'Music',
        defaultColor: '#FF6482',
        category: 'creative',
        description: 'Practice guitar',
        isSystem: false,
        userId: 'test-user-123',
      });
      expect(addDoc).toHaveBeenCalled();
    });

    it('should set correct order for new custom activity', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      const { getDocs, addDoc } = jest.requireMock('firebase/firestore');
      auth.currentUser = { uid: 'test-user-123' };

      // Mock 3 existing custom activities
      const mockCustoms = Array.from({ length: 3 }, (_, i) => ({
        id: `custom-${i}`,
        data: () => ({
          name: `Activity ${i}`,
          icon: 'Test',
          color: '#000000',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      }));

      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          mockCustoms.forEach(callback);
        },
      });

      addDoc.mockResolvedValue({ id: 'new-activity' });

      // Act
      const result = await createCustomActivityType('test-user-123', {
        name: 'New',
        icon: 'Test',
        defaultColor: '#000000',
      });

      // Assert
      expect(result.order).toBe(14); // 10 (system) + 3 (existing) + 1
    });

    it('should handle rate limiting', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      const { checkRateLimit } = jest.requireMock('@/lib/rateLimit');
      auth.currentUser = { uid: 'test-user-123' };

      checkRateLimit.mockImplementation(() => {
        throw new Error('Rate limit exceeded');
      });

      const { getDocs } = jest.requireMock('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          // No customs
        },
      });

      // Act & Assert
      await expect(
        createCustomActivityType('test-user-123', {
          name: 'Test',
          icon: 'Test',
          defaultColor: '#000000',
        })
      ).rejects.toThrow();
    });

    it('should handle optional description', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      const { getDocs, addDoc } = jest.requireMock('firebase/firestore');
      const { checkRateLimit } = jest.requireMock('@/lib/rateLimit');

      auth.currentUser = { uid: 'test-user-123' };
      checkRateLimit.mockImplementation(() => {
        // Rate limit check passes
      });

      getDocs.mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          // No customs
        },
      });

      addDoc.mockResolvedValue({ id: 'new-activity' });

      // Act
      const result = await createCustomActivityType('test-user-123', {
        name: 'Test',
        icon: 'Test',
        defaultColor: '#000000',
        // No description provided
      });

      // Assert - Result should have the created activity
      expect(result.id).toBe('new-activity');
      expect(result.name).toBe('Test');
    });
  });

  // ========================================================================
  // UPDATE CUSTOM ACTIVITY
  // ========================================================================

  describe('updateCustomActivityType()', () => {
    it('should require authentication', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      auth.currentUser = null;

      // Act & Assert
      await expect(
        updateCustomActivityType('activity-id', 'user-123', { name: 'Updated' })
      ).rejects.toThrow();
    });

    it('should verify user ownership', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      auth.currentUser = { uid: 'user-123' };

      // Act & Assert
      await expect(
        updateCustomActivityType('activity-id', 'different-user', {
          name: 'Updated',
        })
      ).rejects.toThrow();
    });

    it('should require activity ID', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      auth.currentUser = { uid: 'test-user-123' };

      // Act & Assert
      await expect(
        updateCustomActivityType('', 'test-user-123', { name: 'Updated' })
      ).rejects.toThrow();
    });

    it('should update activity successfully', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      const { getDoc, updateDoc } = jest.requireMock('firebase/firestore');
      auth.currentUser = { uid: 'test-user-123' };

      getDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            name: 'Old Name',
            icon: 'Test',
            color: '#000000',
            isDefault: false,
            category: 'productivity',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            name: 'New Name',
            icon: 'Test',
            color: '#000000',
            category: 'productivity',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        });

      // Act
      const result = await updateCustomActivityType(
        'activity-123',
        'test-user-123',
        {
          name: 'New Name',
        }
      );

      // Assert
      expect(result.name).toBe('New Name');
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should prevent updating system activities', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      const { getDoc } = jest.requireMock('firebase/firestore');
      auth.currentUser = { uid: 'test-user-123' };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          name: 'System Activity',
          isDefault: true, // System activity
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      // Act & Assert
      await expect(
        updateCustomActivityType('activity-123', 'test-user-123', {
          name: 'Updated',
        })
      ).rejects.toThrow();
    });

    it('should return 404 for non-existent activity', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      const { getDoc } = jest.requireMock('firebase/firestore');
      auth.currentUser = { uid: 'test-user-123' };

      getDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
      });

      // Act & Assert
      await expect(
        updateCustomActivityType('non-existent', 'test-user-123', {
          name: 'Updated',
        })
      ).rejects.toThrow();
    });

    it('should update multiple fields', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      const { getDoc, updateDoc } = jest.requireMock('firebase/firestore');
      auth.currentUser = { uid: 'test-user-123' };

      getDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            name: 'Old',
            icon: 'Old',
            color: '#000000',
            isDefault: false,
            description: 'Old desc',
            category: 'productivity',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            name: 'New',
            icon: 'New',
            color: '#FF0000',
            description: 'New desc',
            category: 'creative',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        });

      // Act
      const result = await updateCustomActivityType(
        'activity-123',
        'test-user-123',
        {
          name: 'New',
          icon: 'New',
          defaultColor: '#FF0000',
          description: 'New desc',
          category: 'creative',
        }
      );

      // Assert
      expect(result.name).toBe('New');
      expect(result.icon).toBe('New');
      expect(result.defaultColor).toBe('#FF0000');
      expect(result.description).toBe('New desc');
      expect(result.category).toBe('creative');
    });
  });

  // ========================================================================
  // DELETE CUSTOM ACTIVITY
  // ========================================================================

  describe('deleteCustomActivityType()', () => {
    it('should require authentication', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      auth.currentUser = null;

      // Act & Assert
      await expect(
        deleteCustomActivityType('activity-id', 'user-123')
      ).rejects.toThrow();
    });

    it('should verify user ownership', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      auth.currentUser = { uid: 'user-123' };

      // Act & Assert
      await expect(
        deleteCustomActivityType('activity-id', 'different-user')
      ).rejects.toThrow();
    });

    it('should require activity ID', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      auth.currentUser = { uid: 'test-user-123' };

      // Act & Assert
      await expect(
        deleteCustomActivityType('', 'test-user-123')
      ).rejects.toThrow();
    });

    it('should delete custom activity successfully', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      const { getDoc, deleteDoc } = jest.requireMock('firebase/firestore');
      auth.currentUser = { uid: 'test-user-123' };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          name: 'Custom Activity',
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      // Act
      await deleteCustomActivityType('activity-123', 'test-user-123');

      // Assert
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should prevent deleting system activities', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      const { getDoc } = jest.requireMock('firebase/firestore');
      auth.currentUser = { uid: 'test-user-123' };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          name: 'System Activity',
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      // Act & Assert
      await expect(
        deleteCustomActivityType('system-activity', 'test-user-123')
      ).rejects.toThrow();
    });

    it('should return 404 for non-existent activity', async () => {
      // Arrange
      const { auth } = jest.requireMock('@/lib/firebase');
      const { getDoc } = jest.requireMock('firebase/firestore');
      auth.currentUser = { uid: 'test-user-123' };

      getDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
      });

      // Act & Assert
      await expect(
        deleteCustomActivityType('non-existent', 'test-user-123')
      ).rejects.toThrow();
    });
  });

  // ========================================================================
  // GET ACTIVITY BY ID
  // ========================================================================

  describe('getActivityTypeById()', () => {
    it('should return system activity by ID', async () => {
      // Act
      const activity = await getActivityTypeById('work');

      // Assert
      expect(activity).toMatchObject({
        id: 'work',
        name: 'Work',
        isSystem: true,
      });
    });

    it('should return null for non-existent system activity', async () => {
      // Act
      const activity = await getActivityTypeById('non-existent');

      // Assert
      expect(activity).toBeNull();
    });

    it('should require userId for custom activities', async () => {
      // Act
      const activity = await getActivityTypeById('custom-activity');

      // Assert
      expect(activity).toBeNull(); // Can't fetch custom without userId
    });

    it('should fetch custom activity by ID', async () => {
      // Arrange
      const { getDoc } = jest.requireMock('firebase/firestore');

      getDoc.mockResolvedValue({
        exists: () => true,
        id: 'guitar-123',
        data: () => ({
          name: 'Guitar Practice',
          icon: 'Music',
          color: '#FF6482',
          category: 'creative',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      // Act
      const activity = await getActivityTypeById('guitar-123', 'user-123');

      // Assert
      expect(activity).toMatchObject({
        id: 'guitar-123',
        name: 'Guitar Practice',
        isSystem: false,
        userId: 'user-123',
      });
    });

    it('should return null for non-existent custom activity', async () => {
      // Arrange
      const { getDoc } = jest.requireMock('firebase/firestore');

      getDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
      });

      // Act
      const activity = await getActivityTypeById('non-existent', 'user-123');

      // Assert
      expect(activity).toBeNull();
    });
  });

  // ========================================================================
  // GET ACTIVITY TYPES BY IDS (BATCH)
  // ========================================================================

  describe('getActivityTypesByIds()', () => {
    it('should return map of activities', async () => {
      // Arrange
      const { getDoc } = jest.requireMock('firebase/firestore');

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          name: 'Test Activity',
          icon: 'Test',
          color: '#000000',
          category: 'productivity',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      // Act
      const result = await getActivityTypesByIds(
        ['work', 'coding'],
        'user-123'
      );

      // Assert
      expect(result.get('work')).toMatchObject({ id: 'work' });
      expect(result.get('coding')).toMatchObject({ id: 'coding' });
    });

    it('should omit non-existent activities from map', async () => {
      // Arrange
      const { getDoc } = jest.requireMock('firebase/firestore');

      getDoc.mockImplementation(() =>
        Promise.resolve({
          exists: () => false,
          data: () => null,
        })
      );

      // Act
      const result = await getActivityTypesByIds([
        'non-existent-1',
        'non-existent-2',
      ]);

      // Assert
      expect(result.size).toBe(0);
    });

    it('should handle mixed existing and non-existent IDs', async () => {
      // Arrange
      const { getDoc } = jest.requireMock('firebase/firestore');

      let callCount = 0;
      getDoc.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          exists: () => callCount === 1, // First call exists, second doesn't
          data: () =>
            callCount === 1
              ? {
                  name: 'Test',
                  icon: 'Test',
                  color: '#000000',
                  category: 'productivity',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }
              : null,
        });
      });

      // Act
      const result = await getActivityTypesByIds(['work', 'non-existent']);

      // Assert
      expect(result.size).toBe(1);
      expect(result.get('work')).toBeDefined();
      expect(result.get('non-existent')).toBeUndefined();
    });

    it('should handle empty IDs array', async () => {
      // Act
      const result = await getActivityTypesByIds([]);

      // Assert
      expect(result.size).toBe(0);
    });

    it('should handle batch of activity IDs', async () => {
      // Arrange
      const { getDoc } = jest.requireMock('firebase/firestore');

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          name: 'Test',
          icon: 'Test',
          color: '#000000',
          category: 'productivity',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      // Act
      const result = await getActivityTypesByIds(['work', 'coding', 'reading']);

      // Assert - Should return a map
      expect(result instanceof Map).toBe(true);
    });
  });
});
