
/**
 * Unit Tests: Notifications API
 * Tests all notification CRUD operations including mark all as read and clear all
 */

import { firebaseNotificationApi } from '@/lib/api/notifications'
import {
  createMockNotification,
  createMockNotificationBatch,
  createMockUnreadNotification,
  resetNotificationFactory,
} from '../../../__mocks__/factories'

// Mock the firebase module
jest.mock('@/lib/firebase', () => ({
  db: {},
}))

// Mock the error handler
jest.mock('@/lib/errorHandler', () => ({
  handleError: (error: Error, context: string, options?: { defaultMessage?: string }) => ({
    userMessage: options?.defaultMessage || `Failed to ${context}`,
    severity: 'ERROR',
  }),
  ErrorSeverity: {
    ERROR: 'ERROR',
    WARNING: 'WARNING',
  },
}))

// In-memory data store for mocked Firestore
const mockDataStore = new Map<string, Map<string, any>>()

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ path: 'notifications' })),
  doc: jest.fn((db, collection, id) => ({ id, path: `${collection}/${id}` })),
  getDoc: jest.fn(async (ref) => {
    const collection = mockDataStore.get('notifications')
    const data = collection?.get(ref.id)
    return {
      exists: () => !!data,
      data: () => data,
      id: ref.id,
    }
  }),
  getDocs: jest.fn(async (query) => {
    const collection = mockDataStore.get('notifications') || new Map()
    let docs: any[] = []

    collection.forEach((data, id) => {
      // Apply where clauses if they exist in the query
      let shouldInclude = true
      if (query._where) {
        query._where.forEach((clause: any) => {
          const fieldValue = data[clause.field]
          if (clause.operator === '==') {
            shouldInclude = shouldInclude && fieldValue === clause.value
          } else if (clause.operator === '!=') {
            shouldInclude = shouldInclude && fieldValue !== clause.value
          }
        })
      }

      if (shouldInclude) {
        docs.push({
          id,
          data: () => data,
          ref: { id },
        })
      }
    })

    // Apply limit if specified
    if (query._limit && query._limit > 0) {
      docs = docs.slice(0, query._limit)
    }

    return {
      docs,
      forEach: (callback: (doc: any) => void) => docs.forEach(callback),
      size: docs.length,
      empty: docs.length === 0,
    }
  }),
  addDoc: jest.fn(async (ref, data) => {
    const id = `mock-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const collection = mockDataStore.get('notifications') || new Map()
    collection.set(id, { ...data, createdAt: new Date() })
    mockDataStore.set('notifications', collection)
    return { id }
  }),
  updateDoc: jest.fn(async (ref, data) => {
    const collection = mockDataStore.get('notifications')
    if (!collection) {
      throw new Error('Collection not found')
    }
    const existing = collection.get(ref.id)
    if (!existing) {
      throw new Error(`Document ${ref.id} not found`)
    }
    collection.set(ref.id, { ...existing, ...data, updatedAt: new Date() })
  }),
  deleteDoc: jest.fn(async (ref) => {
    const collection = mockDataStore.get('notifications')
    if (collection) {
      collection.delete(ref.id)
    }
  }),
  query: jest.fn((collectionRef, ...clauses) => {
    const queryObj = {
      _collectionRef: collectionRef,
      _where: [],
      _orderBy: [],
      _limit: null,
    } as any
    clauses.forEach((clause: any) => {
      if (clause.field && clause.operator !== undefined) {
        queryObj._where.push(clause)
      } else if (clause.field && clause.direction) {
        queryObj._orderBy.push(clause)
      } else if (clause.limitValue) {
        queryObj._limit = clause.limitValue
      }
    })
    return queryObj
  }),
  where: jest.fn((field, operator, value) => ({ field, operator, value })),
  orderBy: jest.fn((field, direction) => ({ field, direction })),
  limit: jest.fn((limitValue) => ({ limitValue })),
  serverTimestamp: jest.fn(() => new Date()),
  writeBatch: jest.fn(() => {
    const operations: Array<{
      type: 'update' | 'delete'
      ref: any
      data?: any
    }> = []
    return {
      update: jest.fn((ref, data) => {
        operations.push({ type: 'update', ref, data })
      }),
      delete: jest.fn((ref) => {
        operations.push({ type: 'delete', ref })
      }),
      commit: jest.fn(async () => {
        const { updateDoc, deleteDoc } = jest.requireMock('firebase/firestore')
        for (const op of operations) {
          if (op.type === 'update') {
            await updateDoc(op.ref, op.data)
          } else if (op.type === 'delete') {
            await deleteDoc(op.ref)
          }
        }
      }),
    }
  }),
}))

// Helper to seed mock data
const seedNotification = (id: string, data: any) => {
  const collection = mockDataStore.get('notifications') || new Map()
  collection.set(id, data)
  mockDataStore.set('notifications', collection)
}

describe('lib/api/notifications', () => {
  beforeEach(() => {
    mockDataStore.clear()
    resetNotificationFactory()
    jest.clearAllMocks()
  })

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const notificationData = {
        userId: 'user-123',
        type: 'follow' as const,
        title: 'New Follower',
        message: 'Alex followed you',
        isRead: false,
        linkUrl: '/profile/alex',
        actorId: 'user-alex',
        actorName: 'Alex',
        actorUsername: 'alex',
      }

      const result = await firebaseNotificationApi.createNotification(notificationData)

      expect(result).toMatchObject(notificationData)
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeInstanceOf(Date)
    })

    it('should throw error on failure', async () => {
      // Force an error by mocking addDoc to throw
      const { addDoc } = await import('firebase/firestore')
      addDoc.mockRejectedValueOnce(new Error('Firestore error'))

      await expect(
        firebaseNotificationApi.createNotification({
          userId: 'user-123',
          type: 'follow',
          title: 'Test',
          message: 'Test message',
          isRead: false,
        })
      ).rejects.toThrow('Failed to create notification')
    })
  })

  describe('getUserNotifications', () => {
    it('should fetch notifications for a user', async () => {
      const userId = 'user-123'
      const notifications = createMockNotificationBatch(3, { userId })

      // Seed the mock data
      notifications.forEach((notif) => {
        seedNotification(notif.id, {
          ...notif,
          createdAt: notif.createdAt,
        })
      })

      const result = await firebaseNotificationApi.getUserNotifications(userId)

      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({
        userId,
        type: 'follow',
      })
    })

    it('should limit notifications based on limitCount parameter', async () => {
      const userId = 'user-123'
      const notifications = createMockNotificationBatch(10, { userId })

      notifications.forEach((notif) => {
        seedNotification(notif.id, {
          ...notif,
          createdAt: notif.createdAt,
        })
      })

      const result = await firebaseNotificationApi.getUserNotifications(userId, 5)

      expect(result).toHaveLength(5)
    })

    it('should return empty array if no notifications found', async () => {
      const result = await firebaseNotificationApi.getUserNotifications('user-nonexistent')

      expect(result).toEqual([])
    })

    it('should throw error on failure', async () => {
      const { getDocs } = await import('firebase/firestore')
      getDocs.mockRejectedValueOnce(new Error('Firestore error'))

      await expect(firebaseNotificationApi.getUserNotifications('user-123')).rejects.toThrow(
        'Failed to get notifications'
      )
    })
  })

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const notification = createMockUnreadNotification({
        id: 'notif-123',
        userId: 'user-123',
      })

      seedNotification(notification.id, notification)

      await firebaseNotificationApi.markAsRead(notification.id)

      const collection = mockDataStore.get('notifications')
      const updated = collection?.get(notification.id)
      expect(updated?.isRead).toBe(true)
      expect(updated?.updatedAt).toBeDefined()
    })

    it('should throw error if notification not found', async () => {
      await expect(firebaseNotificationApi.markAsRead('nonexistent-id')).rejects.toThrow()
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for a user', async () => {
      const userId = 'user-123'
      const notifications = [
        createMockUnreadNotification({ id: 'notif-1', userId }),
        createMockUnreadNotification({ id: 'notif-2', userId }),
        createMockUnreadNotification({ id: 'notif-3', userId }),
      ]

      notifications.forEach((notif) => {
        seedNotification(notif.id, {
          ...notif,
          createdAt: notif.createdAt,
        })
      })

      await firebaseNotificationApi.markAllAsRead(userId)

      // Verify all notifications are marked as read
      const collection = mockDataStore.get('notifications')
      notifications.forEach((notif) => {
        const updated = collection?.get(notif.id)
        expect(updated?.isRead).toBe(true)
        expect(updated?.updatedAt).toBeDefined()
      })
    })

    it('should only update unread notifications', async () => {
      const userId = 'user-123'
      const notifications = [
        createMockUnreadNotification({ id: 'notif-1', userId }),
        createMockNotification({ id: 'notif-2', userId, isRead: true }),
      ]

      notifications.forEach((notif) => {
        seedNotification(notif.id, {
          ...notif,
          createdAt: notif.createdAt,
        })
      })

      await firebaseNotificationApi.markAllAsRead(userId)

      const collection = mockDataStore.get('notifications')
      expect(collection?.get('notif-1')?.isRead).toBe(true)
      expect(collection?.get('notif-2')?.isRead).toBe(true)
    })

    it('should handle empty notification list gracefully', async () => {
      await expect(
        firebaseNotificationApi.markAllAsRead('user-no-notifications')
      ).resolves.not.toThrow()
    })

    it('should not affect other users notifications', async () => {
      const user1Id = 'user-1'
      const user2Id = 'user-2'

      seedNotification('notif-1', {
        ...createMockUnreadNotification({ userId: user1Id }),
        id: 'notif-1',
      })
      seedNotification('notif-2', {
        ...createMockUnreadNotification({ userId: user2Id }),
        id: 'notif-2',
      })

      await firebaseNotificationApi.markAllAsRead(user1Id)

      const collection = mockDataStore.get('notifications')
      expect(collection?.get('notif-1')?.isRead).toBe(true)
      expect(collection?.get('notif-2')?.isRead).toBe(false)
    })
  })

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const notification = createMockNotification({
        id: 'notif-123',
        userId: 'user-123',
      })

      seedNotification(notification.id, notification)

      await firebaseNotificationApi.deleteNotification(notification.id)

      const collection = mockDataStore.get('notifications')
      expect(collection?.has(notification.id)).toBe(false)
    })

    it('should not throw error when deleting non-existent notification', async () => {
      await expect(
        firebaseNotificationApi.deleteNotification('nonexistent-id')
      ).resolves.not.toThrow()
    })
  })

  describe('clearAllNotifications', () => {
    it('should delete all notifications for a user', async () => {
      const userId = 'user-123'
      const notifications = createMockNotificationBatch(5, { userId })

      notifications.forEach((notif) => {
        seedNotification(notif.id, {
          ...notif,
          createdAt: notif.createdAt,
        })
      })

      await firebaseNotificationApi.clearAllNotifications(userId)

      // Verify all notifications are deleted
      const collection = mockDataStore.get('notifications')
      notifications.forEach((notif) => {
        expect(collection?.has(notif.id)).toBe(false)
      })
    })

    it('should only delete notifications for the specified user', async () => {
      const user1Id = 'user-1'
      const user2Id = 'user-2'

      seedNotification('notif-1', {
        ...createMockNotification({ userId: user1Id }),
        id: 'notif-1',
      })
      seedNotification('notif-2', {
        ...createMockNotification({ userId: user2Id }),
        id: 'notif-2',
      })

      await firebaseNotificationApi.clearAllNotifications(user1Id)

      const collection = mockDataStore.get('notifications')
      expect(collection?.has('notif-1')).toBe(false)
      expect(collection?.has('notif-2')).toBe(true)
    })

    it('should handle empty notification list gracefully', async () => {
      await expect(
        firebaseNotificationApi.clearAllNotifications('user-no-notifications')
      ).resolves.not.toThrow()
    })

    it('should delete both read and unread notifications', async () => {
      const userId = 'user-123'
      const notifications = [
        createMockNotification({ id: 'notif-1', userId, isRead: false }),
        createMockNotification({ id: 'notif-2', userId, isRead: true }),
        createMockNotification({ id: 'notif-3', userId, isRead: false }),
      ]

      notifications.forEach((notif) => {
        seedNotification(notif.id, {
          ...notif,
          createdAt: notif.createdAt,
        })
      })

      await firebaseNotificationApi.clearAllNotifications(userId)

      const collection = mockDataStore.get('notifications')
      expect(collection?.has('notif-1')).toBe(false)
      expect(collection?.has('notif-2')).toBe(false)
      expect(collection?.has('notif-3')).toBe(false)
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      const userId = 'user-123'
      const notifications = [
        createMockUnreadNotification({ id: 'notif-1', userId }),
        createMockNotification({ id: 'notif-2', userId, isRead: true }),
        createMockUnreadNotification({ id: 'notif-3', userId }),
      ]

      notifications.forEach((notif) => {
        seedNotification(notif.id, {
          ...notif,
          createdAt: notif.createdAt,
        })
      })

      const count = await firebaseNotificationApi.getUnreadCount(userId)

      expect(count).toBe(2)
    })

    it('should return 0 if no unread notifications', async () => {
      const userId = 'user-123'
      const notification = createMockNotification({
        id: 'notif-1',
        userId,
        isRead: true,
      })

      seedNotification(notification.id, {
        ...notification,
        createdAt: notification.createdAt,
      })

      const count = await firebaseNotificationApi.getUnreadCount(userId)

      expect(count).toBe(0)
    })

    it('should return 0 if no notifications exist', async () => {
      const count = await firebaseNotificationApi.getUnreadCount('user-nonexistent')

      expect(count).toBe(0)
    })
  })
})
