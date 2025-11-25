/**
 * Notifications API Module
 * Handles notification CRUD and challenge-specific notifications
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Firebase imports
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as limitFn,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'

// Local Firebase config
import { db } from '@/lib/firebase'

// Error handling
import { handleError, ErrorSeverity } from '@/lib/errorHandler'

// Shared utilities
import { convertTimestamp } from '../shared/utils'

// Types
import type { Notification } from '@/types'

// ============================================================================
// PUBLIC API
// ============================================================================

export const firebaseNotificationApi = {
  // Create a notification
  createNotification: async (
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<Notification> => {
    try {
      const notificationData = {
        ...notification,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'notifications'), notificationData)

      return {
        id: docRef.id,
        ...notification,
        createdAt: new Date(),
      }
    } catch (_error) {
      const apiError = handleError(_error, 'Create notification', {
        defaultMessage: 'Failed to create notification',
      })
      throw new Error(apiError.userMessage)
    }
  },

  // Get notifications for a user
  getUserNotifications: async (
    userId: string,
    limitCount: number = 50
  ): Promise<Notification[]> => {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limitFn(limitCount > 0 ? limitCount : 50)
      )

      const snapshot = await getDocs(notificationsQuery)
      const notifications: Notification[] = []

      snapshot.forEach((doc) => {
        const data = doc.data()
        notifications.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          linkUrl: data.linkUrl,
          isRead: data.isRead || false,
          createdAt: convertTimestamp(data.createdAt),
          actorId: data.actorId,
          actorName: data.actorName,
          actorUsername: data.actorUsername,
          actorProfilePicture: data.actorProfilePicture,
          sessionId: data.sessionId,
          commentId: data.commentId,
          groupId: data.groupId,
          challengeId: data.challengeId,
        })
      })

      return notifications
    } catch (_error) {
      const apiError = handleError(_error, 'Get notifications', {
        defaultMessage: 'Failed to get notifications',
      })
      throw new Error(apiError.userMessage)
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true,
        updatedAt: serverTimestamp(),
      })
    } catch (_error) {
      const apiError = handleError(_error, 'Mark notification as read', {
        defaultMessage: 'Failed to mark notification as read',
      })
      throw new Error(apiError.userMessage)
    }
  },

  // Mark all notifications as read for a user
  markAllAsRead: async (userId: string): Promise<void> => {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      )

      const snapshot = await getDocs(notificationsQuery)
      const batch = writeBatch(db)

      snapshot.forEach((doc) => {
        batch.update(doc.ref, {
          isRead: true,
          updatedAt: serverTimestamp(),
        })
      })

      await batch.commit()
    } catch (_error) {
      const apiError = handleError(_error, 'Mark all notifications as read', {
        defaultMessage: 'Failed to mark all notifications as read',
      })
      throw new Error(apiError.userMessage)
    }
  },

  // Delete a notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId))
    } catch (_error) {
      const apiError = handleError(_error, 'Delete notification', {
        defaultMessage: 'Failed to delete notification',
      })
      throw new Error(apiError.userMessage)
    }
  },

  // Clear all notifications for a user (batched delete)
  clearAllNotifications: async (userId: string): Promise<void> => {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      )

      const snapshot = await getDocs(notificationsQuery)
      const batch = writeBatch(db)

      snapshot.forEach((doc) => {
        batch.delete(doc.ref)
      })

      await batch.commit()
    } catch (_error) {
      const apiError = handleError(_error, 'Clear all notifications', {
        defaultMessage: 'Failed to clear all notifications',
      })
      throw new Error(apiError.userMessage)
    }
  },

  // Get unread notification count
  getUnreadCount: async (userId: string): Promise<number> => {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      )

      const snapshot = await getDocs(notificationsQuery)
      return snapshot.size
    } catch (_error) {
      const apiError = handleError(_error, 'Get unread count', {
        defaultMessage: 'Failed to get unread count',
      })
      throw new Error(apiError.userMessage)
    }
  },
}

// Challenge Notification Helper Functions
export const challengeNotifications = {
  // Notify when a user completes a challenge
  notifyCompletion: async (
    challengeId: string,
    userId: string,
    challengeName: string
  ): Promise<void> => {
    try {
      const notification: Omit<Notification, 'id' | 'createdAt'> = {
        userId,
        type: 'challenge',
        title: '🏆 Challenge Completed!',
        message: `Congratulations! You've completed the "${challengeName}" challenge.`,
        challengeId,
        isRead: false,
      }

      await firebaseNotificationApi.createNotification(notification)
    } catch (_error) {
      handleError(_error, 'send completion notification', {
        severity: ErrorSeverity.ERROR,
      })
    }
  },

  // Notify other participants when someone joins a challenge
  notifyParticipantJoined: async (
    challengeId: string,
    newParticipantId: string,
    newParticipantName: string,
    challengeName: string
  ): Promise<void> => {
    try {
      // Get all other participants
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('challengeId', '==', challengeId)
      )

      const participantsSnapshot = await getDocs(participantsQuery)
      const batch = writeBatch(db)

      participantsSnapshot.forEach((participantDoc) => {
        const participantData = participantDoc.data()

        // Don't notify the person who just joined
        if (participantData.userId !== newParticipantId) {
          const notificationRef = doc(collection(db, 'notifications'))
          batch.set(notificationRef, {
            userId: participantData.userId,
            type: 'challenge',
            title: '👋 New Challenger!',
            message: `${newParticipantName} joined the "${challengeName}" challenge.`,
            challengeId,
            actorName: newParticipantName,
            isRead: false,
            createdAt: serverTimestamp(),
          })
        }
      })

      await batch.commit()
    } catch (_error) {
      handleError(_error, 'send participant joined notifications', {
        severity: ErrorSeverity.ERROR,
      })
    }
  },

  // Notify all participants when challenge is ending soon
  notifyEndingSoon: async (
    challengeId: string,
    challengeName: string,
    daysRemaining: number
  ): Promise<void> => {
    try {
      // Get all participants
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('challengeId', '==', challengeId)
      )

      const participantsSnapshot = await getDocs(participantsQuery)
      const batch = writeBatch(db)

      participantsSnapshot.forEach((participantDoc) => {
        const participantData = participantDoc.data()

        const notificationRef = doc(collection(db, 'notifications'))
        batch.set(notificationRef, {
          userId: participantData.userId,
          type: 'challenge',
          title: '⏰ Challenge Ending Soon!',
          message: `The "${challengeName}" challenge ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Make your final push!`,
          challengeId,
          isRead: false,
          createdAt: serverTimestamp(),
        })
      })

      await batch.commit()
    } catch (_error) {
      handleError(_error, 'send ending soon notifications', {
        severity: ErrorSeverity.ERROR,
      })
    }
  },

  // Notify when a new challenge is created in a group
  notifyNewChallenge: async (
    challengeId: string,
    challengeName: string,
    challengeType: string,
    groupId: string,
    creatorName: string
  ): Promise<void> => {
    try {
      // Get all group members
      const groupDoc = await getDoc(doc(db, 'groups', groupId))
      if (!groupDoc.exists()) return

      const groupData = groupDoc.data()
      const memberIds = groupData.memberUserIds || []
      const batch = writeBatch(db)

      memberIds.forEach((memberId: string) => {
        // Don't notify the creator
        if (memberId !== groupData.createdByUserId) {
          const notificationRef = doc(collection(db, 'notifications'))
          batch.set(notificationRef, {
            userId: memberId,
            type: 'challenge',
            title: '🎯 New Challenge Available!',
            message: `${creatorName} created a new "${challengeName}" challenge in your group.`,
            challengeId,
            groupId,
            actorName: creatorName,
            isRead: false,
            createdAt: serverTimestamp(),
          })
        }
      })

      await batch.commit()
    } catch (_error) {
      handleError(_error, 'send new challenge notifications', {
        severity: ErrorSeverity.ERROR,
      })
    }
  },

  // Notify when rank changes significantly (moved up 3+ positions)
  notifyRankChange: async (
    challengeId: string,
    userId: string,
    challengeName: string,
    newRank: number,
    previousRank: number
  ): Promise<void> => {
    try {
      // Only notify for significant improvements (moved up 3+ positions)
      if (previousRank - newRank >= 3) {
        const notification: Omit<Notification, 'id' | 'createdAt'> = {
          userId,
          type: 'challenge',
          title: '📈 Rank Improved!',
          message: `You moved up to #${newRank} in the "${challengeName}" challenge!`,
          challengeId,
          isRead: false,
        }

        await firebaseNotificationApi.createNotification(notification)
      }
    } catch (_error) {
      handleError(_error, 'send rank change notification', {
        severity: ErrorSeverity.ERROR,
      })
    }
  },

  // Notify when reaching milestones (25%, 50%, 75%, 90% of goal)
  notifyMilestone: async (
    challengeId: string,
    userId: string,
    challengeName: string,
    progress: number,
    goalValue: number
  ): Promise<void> => {
    try {
      const percentage = (progress / goalValue) * 100
      const milestones = [25, 50, 75, 90]

      for (const milestone of milestones) {
        if (percentage >= milestone && percentage < milestone + 5) {
          // 5% buffer to avoid duplicate notifications
          const notification: Omit<Notification, 'id' | 'createdAt'> = {
            userId,
            type: 'challenge',
            title: `🎯 ${milestone}% Complete!`,
            message: `You're ${milestone}% of the way through the "${challengeName}" challenge. Keep going!`,
            challengeId,
            isRead: false,
          }

          await firebaseNotificationApi.createNotification(notification)
          break // Only send one milestone notification at a time
        }
      }
    } catch (_error) {
      handleError(_error, 'send milestone notification', {
        severity: ErrorSeverity.ERROR,
      })
    }
  },
}

// Activity API (alias for Project API for new naming convention)
