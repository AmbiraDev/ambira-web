import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import NotificationsPanel from '@/components/NotificationsPanel';
import type { Notification } from '@/types';

const pushMock = jest.fn();
const useNotificationsMock = jest.fn();
const useUnreadCountMock = jest.fn();
const markNotificationReadMock = jest.fn();
const markAllMock = jest.fn().mockResolvedValue(undefined);
const deleteMock = jest.fn().mockResolvedValue(undefined);
const clearAllMock = jest.fn().mockResolvedValue(undefined);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: (...args: unknown[]) => useNotificationsMock(...args),
  useUnreadCount: () => useUnreadCountMock(),
  useMarkNotificationRead: () => ({ mutate: markNotificationReadMock }),
  useMarkAllNotificationsRead: () => ({ mutateAsync: markAllMock }),
  useDeleteNotification: () => ({ mutateAsync: deleteMock }),
  useClearAllNotifications: () => ({ mutateAsync: clearAllMock }),
}));

jest.mock('date-fns', () => ({
  formatDistanceToNow: () => 'just now',
}));

const notificationFactory = (
  overrides: Partial<Notification> = {}
): Notification => ({
  id: 'notif-1',
  userId: 'user-1',
  type: 'follow',
  title: 'New follower',
  message: 'Alex followed you',
  linkUrl: '/users/alex',
  isRead: false,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

describe('components/NotificationsPanel', () => {
  beforeEach(() => {
    pushMock.mockReset();
    useNotificationsMock.mockReset();
    useUnreadCountMock.mockReset();
    markNotificationReadMock.mockReset();
    markAllMock.mockReset().mockResolvedValue(undefined);
    deleteMock.mockReset().mockResolvedValue(undefined);
    clearAllMock.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(document, 'elementFromPoint', {
      value: jest.fn(() => null),
      configurable: true,
      writable: true,
    });
    // Mock window.confirm to return true by default (user confirms)
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    delete (document as unknown as Record<string, unknown>).elementFromPoint;
    // Clean up window.confirm mock
    jest.restoreAllMocks();
  });

  it('does not render when panel is closed', () => {
    useNotificationsMock.mockReturnValue({ data: [], isLoading: false });
    useUnreadCountMock.mockReturnValue(0);

    const { container } = render(
      <NotificationsPanel isOpen={false} onClose={jest.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders notifications and supports actions', async () => {
    const notifications = [notificationFactory()];
    const handleClose = jest.fn();
    useNotificationsMock.mockReturnValue({ data: notifications });
    useUnreadCountMock.mockReturnValue(1);

    render(<NotificationsPanel isOpen onClose={handleClose} />);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('New follower')).toBeInTheDocument();
    expect(screen.getByText('Alex followed you')).toBeInTheDocument();
    expect(screen.getByText('just now')).toBeInTheDocument();

    // Mark all as read & clear all
    fireEvent.click(screen.getByText('Mark all read'));
    await waitFor(() => expect(markAllMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText('Clear all'));
    await waitFor(() => expect(clearAllMock).toHaveBeenCalledTimes(1));

    // Hover to reveal delete, then remove the notification
    const notificationItem = screen
      .getByText('New follower')
      .closest('[data-notification-id]') as HTMLElement;
    fireEvent.mouseEnter(notificationItem);
    const deleteButton = within(notificationItem).getByRole('button');
    fireEvent.click(deleteButton);
    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith('notif-1'));

    // Clicking navigates and marks as read
    fireEvent.click(notificationItem);

    expect(handleClose).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith('/users/alex');
    expect(markNotificationReadMock).toHaveBeenCalledWith('notif-1');
  });

  it('does not clear all notifications when user cancels confirmation', async () => {
    const notifications = [notificationFactory()];
    useNotificationsMock.mockReturnValue({ data: notifications });
    useUnreadCountMock.mockReturnValue(1);

    // Mock confirm to return false (user cancels)
    global.confirm = jest.fn(() => false);

    render(<NotificationsPanel isOpen onClose={jest.fn()} />);

    fireEvent.click(screen.getByText('Clear all'));

    // Verify confirm was called with the right message
    expect(global.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete all notifications? This cannot be undone.'
    );

    // Verify the mutation was NOT called
    await waitFor(() => {
      expect(clearAllMock).not.toHaveBeenCalled();
    });
  });
});
