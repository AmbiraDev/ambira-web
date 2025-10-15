'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Notification } from '@/types';
import { firebaseNotificationApi } from '@/lib/firebaseApi';
import { collection, query, where, orderBy, limit as firestoreLimit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time listener for notifications
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Set up real-time listener
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc'),
      firestoreLimit(50)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notifs: Notification[] = [];
        let unread = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          const notification: Notification = {
            id: doc.id,
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            linkUrl: data.linkUrl,
            isRead: data.isRead || false,
            createdAt: data.createdAt?.toDate() || new Date(),
            actorId: data.actorId,
            actorName: data.actorName,
            actorUsername: data.actorUsername,
            actorProfilePicture: data.actorProfilePicture,
            sessionId: data.sessionId,
            commentId: data.commentId,
            groupId: data.groupId,
            challengeId: data.challengeId,
          };

          notifs.push(notification);

          if (!notification.isRead) {
            unread++;
          }
        });

        setNotifications(notifs);
        setUnreadCount(unread);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error listening to notifications:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated, user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await firebaseNotificationApi.markAsRead(notificationId);
      // The real-time listener will automatically update the state
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await firebaseNotificationApi.markAllAsRead(user.id);
      // The real-time listener will automatically update the state
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await firebaseNotificationApi.deleteNotification(notificationId);
      // The real-time listener will automatically update the state
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;

    try {
      // Delete all notifications for the current user
      const deletePromises = notifications.map(notification =>
        firebaseNotificationApi.deleteNotification(notification.id)
      );
      await Promise.all(deletePromises);
      // The real-time listener will automatically update the state
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const refreshNotifications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const notifs = await firebaseNotificationApi.getUserNotifications(user.id);
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
