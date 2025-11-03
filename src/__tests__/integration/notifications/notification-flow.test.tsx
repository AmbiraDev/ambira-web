/**
 * Integration Test: Notification Flow
 * Tests: Receive → Badge → Click → Mark read → Clear all
 * Tests complete notification lifecycle including batch operations
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useClearAllNotifications,
} from '@/hooks/useNotifications';
import { firebaseNotificationApi } from '@/lib/api';
import {
  createMockNotificationBatch,
  createMockUnreadNotification,
  resetNotificationFactory,
} from '../../../__mocks__/factories';

// Mock dependencies
jest.mock('@/lib/firebase');
jest.mock('@/lib/api', () => ({
  firebaseNotificationApi: {
    getUserNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    clearAllNotifications: jest.fn(),
  },
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user-123', username: 'testuser', name: 'Test User' },
    isAuthenticated: true,
  })),
}));

const mockFirebaseApi = firebaseNotificationApi as jest.Mocked<
  typeof firebaseNotificationApi
>;

describe('Integration: Notification Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    resetNotificationFactory();
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Complete notification lifecycle', () => {
    it('should handle receive → view → mark read → delete flow', async () => {
      // Step 1: Receive notifications (fetch)
      const mockNotifications = [
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-1' }),
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-2' }),
      ];
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);

      const { result: notificationsResult } = renderHook(
        () => useNotifications(),
        { wrapper }
      );

      await waitFor(() => {
        expect(notificationsResult.current.data).toEqual(mockNotifications);
      });

      // Step 2: Check unread badge count
      const { result: unreadCountResult } = renderHook(() => useUnreadCount(), {
        wrapper,
      });

      expect(unreadCountResult.current).toBe(2);

      // Step 3: Mark one notification as read
      mockFirebaseApi.markAsRead.mockResolvedValue(undefined);

      const { result: markReadResult } = renderHook(
        () => useMarkNotificationRead(),
        { wrapper }
      );

      act(() => {
        markReadResult.current.mutate('notif-1');
      });

      await waitFor(() => {
        expect(markReadResult.current.isSuccess).toBe(true);
      });

      // Step 4: Verify unread count decreased
      await waitFor(() => {
        const { result: updatedCountResult } = renderHook(
          () => useUnreadCount(),
          { wrapper }
        );
        expect(updatedCountResult.current).toBe(1);
      });

      // Step 5: Delete the notification
      mockFirebaseApi.deleteNotification.mockResolvedValue(undefined);

      const { result: deleteResult } = renderHook(
        () => useDeleteNotification(),
        { wrapper }
      );

      act(() => {
        deleteResult.current.mutate('notif-1');
      });

      await waitFor(() => {
        expect(deleteResult.current.isSuccess).toBe(true);
      });

      // Step 6: Verify notification was removed from cache
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<any>([
          'notifications',
          'user-123',
          50,
          expect.anything(),
        ]);
        expect(cachedData).toHaveLength(1);
        expect(cachedData?.[0].id).toBe('notif-2');
      });
    });

    it('should handle mark all as read flow', async () => {
      // Step 1: Receive multiple unread notifications
      const mockNotifications = createMockNotificationBatch(5, {
        userId: 'user-123',
        isRead: false,
      });
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        const cachedData = queryClient.getQueryData<any>([
          'notifications',
          'user-123',
          50,
          expect.anything(),
        ]);
        expect(cachedData).toEqual(mockNotifications);
      });

      // Step 2: Verify unread count
      const { result: unreadCountResult } = renderHook(() => useUnreadCount(), {
        wrapper,
      });

      expect(unreadCountResult.current).toBe(5);

      // Step 3: Mark all as read
      mockFirebaseApi.markAllAsRead.mockResolvedValue(undefined);

      const { result: markAllResult } = renderHook(
        () => useMarkAllNotificationsRead(),
        { wrapper }
      );

      act(() => {
        markAllResult.current.mutate();
      });

      await waitFor(() => {
        expect(markAllResult.current.isSuccess).toBe(true);
      });

      // Step 4: Verify all notifications are marked as read in cache
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<any>([
          'notifications',
          'user-123',
          50,
          expect.anything(),
        ]);
        cachedData?.forEach((notif: any) => {
          expect(notif.isRead).toBe(true);
        });
      });

      // Step 5: Verify unread count is now 0
      await waitFor(() => {
        const { result: updatedCountResult } = renderHook(
          () => useUnreadCount(),
          { wrapper }
        );
        expect(updatedCountResult.current).toBe(0);
      });

      expect(mockFirebaseApi.markAllAsRead).toHaveBeenCalledWith('user-123');
    });

    it('should handle clear all notifications flow', async () => {
      // Step 1: Receive multiple notifications
      const mockNotifications = createMockNotificationBatch(10, {
        userId: 'user-123',
      });
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        const cachedData = queryClient.getQueryData<any>([
          'notifications',
          'user-123',
          50,
          expect.anything(),
        ]);
        expect(cachedData).toHaveLength(10);
      });

      // Step 2: Clear all notifications
      mockFirebaseApi.clearAllNotifications.mockResolvedValue(undefined);

      const { result: clearAllResult } = renderHook(
        () => useClearAllNotifications(),
        { wrapper }
      );

      act(() => {
        clearAllResult.current.mutate();
      });

      await waitFor(() => {
        expect(clearAllResult.current.isSuccess).toBe(true);
      });

      // Step 3: Verify all notifications are removed from cache
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<any>([
          'notifications',
          'user-123',
          50,
          expect.anything(),
        ]);
        expect(cachedData).toEqual([]);
      });

      // Step 4: Verify unread count is 0
      const { result: unreadCountResult } = renderHook(() => useUnreadCount(), {
        wrapper,
      });

      expect(unreadCountResult.current).toBe(0);

      expect(mockFirebaseApi.clearAllNotifications).toHaveBeenCalledWith(
        'user-123'
      );
    });

    it('should handle mixed read/unread notifications with mark all as read', async () => {
      // Step 1: Receive mixed notifications
      const mockNotifications = [
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-1' }),
        {
          ...createMockUnreadNotification({
            userId: 'user-123',
            id: 'notif-2',
          }),
          isRead: true,
        },
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-3' }),
        {
          ...createMockUnreadNotification({
            userId: 'user-123',
            id: 'notif-4',
          }),
          isRead: true,
        },
      ];
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        const cachedData = queryClient.getQueryData<any>([
          'notifications',
          'user-123',
          50,
          expect.anything(),
        ]);
        expect(cachedData).toEqual(mockNotifications);
      });

      // Step 2: Verify unread count (should be 2)
      const { result: unreadCountResult } = renderHook(() => useUnreadCount(), {
        wrapper,
      });

      expect(unreadCountResult.current).toBe(2);

      // Step 3: Mark all as read
      mockFirebaseApi.markAllAsRead.mockResolvedValue(undefined);

      const { result: markAllResult } = renderHook(
        () => useMarkAllNotificationsRead(),
        { wrapper }
      );

      act(() => {
        markAllResult.current.mutate();
      });

      await waitFor(() => {
        expect(markAllResult.current.isSuccess).toBe(true);
      });

      // Step 4: Verify all are now marked as read
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<any>([
          'notifications',
          'user-123',
          50,
          expect.anything(),
        ]);
        cachedData?.forEach((notif: any) => {
          expect(notif.isRead).toBe(true);
        });
      });

      // Step 5: Verify unread count is now 0
      await waitFor(() => {
        const { result: updatedCountResult } = renderHook(
          () => useUnreadCount(),
          { wrapper }
        );
        expect(updatedCountResult.current).toBe(0);
      });
    });

    it('should handle error recovery in mark all as read', async () => {
      // Step 1: Setup notifications
      const mockNotifications = createMockNotificationBatch(3, {
        userId: 'user-123',
        isRead: false,
      });
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        const cachedData = queryClient.getQueryData<any>([
          'notifications',
          'user-123',
          50,
          expect.anything(),
        ]);
        expect(cachedData).toEqual(mockNotifications);
      });

      // Step 2: Try to mark all as read but fail
      mockFirebaseApi.markAllAsRead.mockRejectedValue(
        new Error('Network error')
      );

      const { result: markAllResult } = renderHook(
        () => useMarkAllNotificationsRead(),
        { wrapper }
      );

      act(() => {
        markAllResult.current.mutate();
      });

      await waitFor(() => {
        expect(markAllResult.current.isError).toBe(true);
      });

      // Step 3: Verify cache was rolled back
      const cachedData = queryClient.getQueryData<any>([
        'notifications',
        'user-123',
        50,
        expect.anything(),
      ]);
      cachedData?.forEach((notif: any) => {
        expect(notif.isRead).toBe(false);
      });

      // Step 4: Verify unread count is still 3
      const { result: unreadCountResult } = renderHook(() => useUnreadCount(), {
        wrapper,
      });

      expect(unreadCountResult.current).toBe(3);
    });

    it('should handle error recovery in clear all notifications', async () => {
      // Step 1: Setup notifications
      const mockNotifications = createMockNotificationBatch(3, {
        userId: 'user-123',
      });
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        const cachedData = queryClient.getQueryData<any>([
          'notifications',
          'user-123',
          50,
          expect.anything(),
        ]);
        expect(cachedData).toHaveLength(3);
      });

      // Step 2: Try to clear all but fail
      mockFirebaseApi.clearAllNotifications.mockRejectedValue(
        new Error('Network error')
      );

      const { result: clearAllResult } = renderHook(
        () => useClearAllNotifications(),
        { wrapper }
      );

      act(() => {
        clearAllResult.current.mutate();
      });

      await waitFor(() => {
        expect(clearAllResult.current.isError).toBe(true);
      });

      // Step 3: Verify cache was rolled back
      const cachedData = queryClient.getQueryData<any>([
        'notifications',
        'user-123',
        50,
        expect.anything(),
      ]);
      expect(cachedData).toHaveLength(3);
    });
  });
});
