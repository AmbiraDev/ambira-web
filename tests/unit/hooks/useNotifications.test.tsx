/**
 * Unit Tests: useNotifications hooks
 * Tests all notification-related hooks including mark all as read and clear all
 */

// Mock dependencies BEFORE imports
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
}));

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
} from '../../__mocks__/factories';

const mockFirebaseApi = firebaseNotificationApi as jest.Mocked<
  typeof firebaseNotificationApi
>;

describe('hooks/useNotifications', () => {
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

  describe('useNotifications', () => {
    it('should fetch notifications for authenticated user', async () => {
      const mockNotifications = createMockNotificationBatch(3, {
        userId: 'user-123',
      });
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockNotifications);
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFirebaseApi.getUserNotifications).toHaveBeenCalledWith(
        'user-123',
        50
      );
    });

    it('should respect custom limit parameter', async () => {
      const mockNotifications = createMockNotificationBatch(5, {
        userId: 'user-123',
      });
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);

      renderHook(() => useNotifications({ limit: 10 }), { wrapper });

      await waitFor(() => {
        expect(mockFirebaseApi.getUserNotifications).toHaveBeenCalledWith(
          'user-123',
          10
        );
      });
    });

    it('should return empty array for unauthenticated user', async () => {
      const { useAuth } = require('@/hooks/useAuth');
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });

      expect(mockFirebaseApi.getUserNotifications).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      mockFirebaseApi.getUserNotifications.mockRejectedValue(
        new Error('Fetch failed')
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('useUnreadCount', () => {
    it('should calculate unread count from cached notifications', async () => {
      const mockNotifications = [
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-1' }),
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-2' }),
        {
          ...createMockUnreadNotification({
            userId: 'user-123',
            id: 'notif-3',
          }),
          isRead: true,
        },
      ];
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);

      // First render notifications hook to populate cache
      const { result: notificationsResult } = renderHook(
        () => useNotifications(),
        { wrapper }
      );

      await waitFor(() => {
        expect(notificationsResult.current.data).toEqual(mockNotifications);
      });

      // Then render unread count hook
      const { result: countResult } = renderHook(() => useUnreadCount(), {
        wrapper,
      });

      expect(countResult.current).toBe(2);
    });

    it('should return 0 when no notifications are cached', () => {
      const { result } = renderHook(() => useUnreadCount(), { wrapper });

      expect(result.current).toBe(0);
    });

    it('should return 0 when all notifications are read', async () => {
      const mockNotifications = createMockNotificationBatch(3, {
        userId: 'user-123',
        isRead: true,
      });
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);

      // First populate cache
      const { result: notificationsResult } = renderHook(
        () => useNotifications(),
        { wrapper }
      );

      await waitFor(() => {
        expect(notificationsResult.current.data).toEqual(mockNotifications);
      });

      // Then check count
      const { result: countResult } = renderHook(() => useUnreadCount(), {
        wrapper,
      });

      expect(countResult.current).toBe(0);
    });
  });

  describe('useMarkNotificationRead', () => {
    it('should mark notification as read with optimistic update', async () => {
      const mockNotifications = [
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-1' }),
      ];
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);
      mockFirebaseApi.markAsRead.mockResolvedValue(undefined);

      // First populate cache
      const { result: notificationsResult } = renderHook(
        () => useNotifications(),
        { wrapper }
      );

      await waitFor(() => {
        expect(notificationsResult.current.data).toEqual(mockNotifications);
      });

      // Then mark as read
      const { result: mutationResult } = renderHook(
        () => useMarkNotificationRead(),
        { wrapper }
      );

      act(() => {
        mutationResult.current.mutate('notif-1');
      });

      // Verify optimistic update
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<any>([
          'notifications',
          'user-123',
          50,
          expect.anything(),
        ]);
        expect(cachedData).toBeDefined();
        if (cachedData) {
          expect(cachedData[0].isRead).toBe(true);
        }
      });

      expect(mockFirebaseApi.markAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('should rollback on error', async () => {
      const mockNotifications = [
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-1' }),
      ];
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);
      mockFirebaseApi.markAsRead.mockRejectedValue(new Error('Update failed'));

      // First populate cache
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

      // Then try to mark as read
      const { result: mutationResult } = renderHook(
        () => useMarkNotificationRead(),
        { wrapper }
      );

      act(() => {
        mutationResult.current.mutate('notif-1');
      });

      // Verify rollback after error
      await waitFor(() => {
        expect(mutationResult.current.isError).toBe(true);
      });

      // Cache should be rolled back to original state
      const cachedData = queryClient.getQueryData<any>([
        'notifications',
        'user-123',
        50,
        expect.anything(),
      ]);
      expect(cachedData?.[0].isRead).toBe(false);
    });
  });

  describe('useMarkAllNotificationsRead', () => {
    it('should mark all notifications as read with optimistic update', async () => {
      const mockNotifications = [
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-1' }),
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-2' }),
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-3' }),
      ];
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);
      mockFirebaseApi.markAllAsRead.mockResolvedValue(undefined);

      // First populate cache
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

      // Then mark all as read
      const { result: mutationResult } = renderHook(
        () => useMarkAllNotificationsRead(),
        { wrapper }
      );

      act(() => {
        mutationResult.current.mutate();
      });

      // Verify optimistic update
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<any>([
          'notifications',
          'user-123',
          50,
          expect.anything(),
        ]);
        expect(cachedData).toBeDefined();
        if (cachedData) {
          cachedData.forEach((notif: any) => {
            expect(notif.isRead).toBe(true);
          });
        }
      });

      expect(mockFirebaseApi.markAllAsRead).toHaveBeenCalledWith('user-123');
    });

    it('should rollback on error', async () => {
      const mockNotifications = [
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-1' }),
      ];
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);
      mockFirebaseApi.markAllAsRead.mockRejectedValue(
        new Error('Update failed')
      );

      // First populate cache
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

      // Then try to mark all as read
      const { result: mutationResult } = renderHook(
        () => useMarkAllNotificationsRead(),
        { wrapper }
      );

      act(() => {
        mutationResult.current.mutate();
      });

      // Verify rollback after error
      await waitFor(() => {
        expect(mutationResult.current.isError).toBe(true);
      });

      // Cache should be rolled back
      const cachedData = queryClient.getQueryData<any>([
        'notifications',
        'user-123',
        50,
        expect.anything(),
      ]);
      expect(cachedData?.[0].isRead).toBe(false);
    });

    it('should handle unauthenticated user', async () => {
      const { useAuth } = require('@/hooks/useAuth');
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useMarkAllNotificationsRead(), {
        wrapper,
      });

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toEqual(
          new Error('User not authenticated')
        );
      });
    });
  });

  describe('useDeleteNotification', () => {
    it('should delete notification with optimistic update', async () => {
      const mockNotifications = [
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-1' }),
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-2' }),
      ];
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);
      mockFirebaseApi.deleteNotification.mockResolvedValue(undefined);

      // First populate cache
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

      // Then delete notification
      const { result: mutationResult } = renderHook(
        () => useDeleteNotification(),
        { wrapper }
      );

      act(() => {
        mutationResult.current.mutate('notif-1');
      });

      // Verify optimistic update
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

      expect(mockFirebaseApi.deleteNotification).toHaveBeenCalledWith(
        'notif-1'
      );
    });

    it('should rollback on error', async () => {
      const mockNotifications = [
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-1' }),
      ];
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);
      mockFirebaseApi.deleteNotification.mockRejectedValue(
        new Error('Delete failed')
      );

      // First populate cache
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

      // Then try to delete
      const { result: mutationResult } = renderHook(
        () => useDeleteNotification(),
        { wrapper }
      );

      act(() => {
        mutationResult.current.mutate('notif-1');
      });

      // Verify rollback after error
      await waitFor(() => {
        expect(mutationResult.current.isError).toBe(true);
      });

      // Cache should be restored
      const cachedData = queryClient.getQueryData<any>([
        'notifications',
        'user-123',
        50,
        expect.anything(),
      ]);
      expect(cachedData).toHaveLength(1);
    });
  });

  describe('useClearAllNotifications', () => {
    it('should clear all notifications with optimistic update', async () => {
      const mockNotifications = [
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-1' }),
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-2' }),
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-3' }),
      ];
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);
      mockFirebaseApi.clearAllNotifications.mockResolvedValue(undefined);

      // First populate cache
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

      // Then clear all
      const { result: mutationResult } = renderHook(
        () => useClearAllNotifications(),
        { wrapper }
      );

      act(() => {
        mutationResult.current.mutate();
      });

      // Verify optimistic update
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<any>([
          'notifications',
          'user-123',
          50,
          expect.anything(),
        ]);
        expect(cachedData).toEqual([]);
      });

      expect(mockFirebaseApi.clearAllNotifications).toHaveBeenCalledWith(
        'user-123'
      );
    });

    it('should rollback on error', async () => {
      const mockNotifications = [
        createMockUnreadNotification({ userId: 'user-123', id: 'notif-1' }),
      ];
      mockFirebaseApi.getUserNotifications.mockResolvedValue(mockNotifications);
      mockFirebaseApi.clearAllNotifications.mockRejectedValue(
        new Error('Clear failed')
      );

      // First populate cache
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

      // Then try to clear all
      const { result: mutationResult } = renderHook(
        () => useClearAllNotifications(),
        { wrapper }
      );

      act(() => {
        mutationResult.current.mutate();
      });

      // Verify rollback after error
      await waitFor(() => {
        expect(mutationResult.current.isError).toBe(true);
      });

      // Cache should be restored
      const cachedData = queryClient.getQueryData<any>([
        'notifications',
        'user-123',
        50,
        expect.anything(),
      ]);
      expect(cachedData).toHaveLength(1);
    });

    it('should handle unauthenticated user', async () => {
      const { useAuth } = require('@/hooks/useAuth');
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useClearAllNotifications(), {
        wrapper,
      });

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toEqual(
          new Error('User not authenticated')
        );
      });
    });

    it('should handle empty notification list', async () => {
      mockFirebaseApi.getUserNotifications.mockResolvedValue([]);
      mockFirebaseApi.clearAllNotifications.mockResolvedValue(undefined);

      // First populate cache with empty array
      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        const cachedData = queryClient.getQueryData<any>([
          'notifications',
          'user-123',
          50,
          expect.anything(),
        ]);
        expect(cachedData).toEqual([]);
      });

      // Then clear all
      const { result: mutationResult } = renderHook(
        () => useClearAllNotifications(),
        { wrapper }
      );

      act(() => {
        mutationResult.current.mutate();
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      expect(mockFirebaseApi.clearAllNotifications).toHaveBeenCalledWith(
        'user-123'
      );
    });
  });
});
