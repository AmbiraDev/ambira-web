import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Notification } from '@/types';
import { firebaseNotificationApi } from '@/lib/api';
import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useMemo } from 'react';
import { CACHE_KEYS, CACHE_TIMES } from '@/lib/queryClient';

/**
 * Hook to fetch user notifications with optional real-time updates
 *
 * @param options.realtime - Enable real-time Firestore listener (default: false)
 * @param options.limit - Maximum number of notifications to fetch (default: 50)
 */
export function useNotifications(options?: {
  realtime?: boolean;
  limit?: number;
  queryOptions?: Partial<UseQueryOptions<Notification[]>>;
}) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const realtime = options?.realtime ?? false;
  const limit = options?.limit ?? 50;

  const queryKey = useMemo(
    () => [...CACHE_KEYS.NOTIFICATIONS(user?.id || 'none'), limit, user],
    [user, limit]
  );

  // Base query for notifications
  const notificationsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      return firebaseNotificationApi.getUserNotifications(user.id, limit);
    },
    enabled: isAuthenticated && !!user,
    staleTime: CACHE_TIMES.REAL_TIME, // 30 seconds
    gcTime: CACHE_TIMES.MEDIUM, // 5 minutes
    ...options?.queryOptions,
  });

  // Set up real-time listener if requested
  useEffect(() => {
    if (!realtime || !isAuthenticated || !user) return;

    const notificationsRef = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const unsubscribe = onSnapshot(
      notificationsRef,
      snapshot => {
        const notifications: Notification[] = [];

        snapshot.forEach(doc => {
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

          notifications.push(notification);
        });

        // Update React Query cache with real-time data
        queryClient.setQueryData(queryKey, notifications);
      },
      error => {
        console.error('Error in notifications real-time listener:', error);
      }
    );

    return () => unsubscribe();
  }, [realtime, isAuthenticated, user, limit, queryClient, queryKey]);

  return notificationsQuery;
}

/**
 * Hook to get unread notification count
 * Derived from notifications query for efficiency
 */
export function useUnreadCount() {
  const { user } = useAuth();
  const queryKey = CACHE_KEYS.NOTIFICATIONS(user?.id || 'none');
  const queryClient = useQueryClient();

  // Get cached notifications data
  const notifications = queryClient.getQueryData<Notification[]>(queryKey);

  return useMemo(
    () => notifications?.filter(n => !n.isRead).length ?? 0,
    [notifications]
  );
}

/**
 * Hook to mark a notification as read with optimistic updates
 */
export function useMarkNotificationRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = CACHE_KEYS.NOTIFICATIONS(user?.id || 'none');

  return useMutation({
    mutationFn: (notificationId: string) =>
      firebaseNotificationApi.markAsRead(notificationId),

    // Optimistic update
    onMutate: async notificationId => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousNotifications =
        queryClient.getQueryData<Notification[]>(queryKey);

      // Optimistically update to the new value
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(
          queryKey,
          previousNotifications.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }

      // Return context with the previous value
      return { previousNotifications };
    },

    // On error, roll back to the previous value
    onError: (err, notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKey, context.previousNotifications);
      }
      console.error('Error marking notification as read:', err);
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = CACHE_KEYS.NOTIFICATIONS(user?.id || 'none');

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return firebaseNotificationApi.markAllAsRead(user.id);
    },

    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previousNotifications =
        queryClient.getQueryData<Notification[]>(queryKey);

      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(
          queryKey,
          previousNotifications.map(n => ({ ...n, isRead: true }))
        );
      }

      return { previousNotifications };
    },

    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKey, context.previousNotifications);
      }
      console.error('Error marking all notifications as read:', err);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Hook to delete a notification with optimistic updates
 */
export function useDeleteNotification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = CACHE_KEYS.NOTIFICATIONS(user?.id || 'none');

  return useMutation({
    mutationFn: (notificationId: string) =>
      firebaseNotificationApi.deleteNotification(notificationId),

    // Optimistic update
    onMutate: async notificationId => {
      await queryClient.cancelQueries({ queryKey });

      const previousNotifications =
        queryClient.getQueryData<Notification[]>(queryKey);

      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(
          queryKey,
          previousNotifications.filter(n => n.id !== notificationId)
        );
      }

      return { previousNotifications };
    },

    onError: (err, notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKey, context.previousNotifications);
      }
      console.error('Error deleting notification:', err);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Hook to clear all notifications with optimistic updates
 */
export function useClearAllNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = CACHE_KEYS.NOTIFICATIONS(user?.id || 'none');

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return firebaseNotificationApi.clearAllNotifications(user.id);
    },

    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previousNotifications =
        queryClient.getQueryData<Notification[]>(queryKey);

      // Clear the cache immediately
      queryClient.setQueryData<Notification[]>(queryKey, []);

      return { previousNotifications };
    },

    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKey, context.previousNotifications);
      }
      console.error('Error clearing all notifications:', err);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
