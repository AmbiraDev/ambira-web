'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Trash2,
  UserPlus,
  Heart,
  MessageCircle,
  Reply,
  AtSign,
  Users,
  Trophy,
  Bell,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useClearAllNotifications,
} from '@/hooks/useNotifications';
import Header from '@/components/HeaderComponent';
import BottomNavigation from '@/components/BottomNavigation';
import { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import ConfirmDialog from '@/components/ConfirmDialog';

// Swipeable notification item component
function SwipeableNotificationItem({
  notification,
  onDelete,

  onClick,
}: {
  notification: Notification;
  onDelete: (id: string) => void;

  onClick: (notification: Notification) => void;
}) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const minSwipeDistance = 80;
  const deleteThreshold = 120;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    const touch = e.targetTouches[0];
    if (touch) {
      setTouchStart(touch.clientX);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (!touch) return;

    setTouchEnd(touch.clientX);
    const distance = touchStart - touch.clientX;
    if (distance > 0) {
      setSwipeOffset(Math.min(distance, deleteThreshold + 20));
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;

    if (isLeftSwipe && distance >= deleteThreshold) {
      // Delete if swiped past threshold
      handleDelete();
    } else if (isLeftSwipe && distance >= minSwipeDistance) {
      // Show delete button
      setSwipeOffset(deleteThreshold);
    } else {
      // Reset
      setSwipeOffset(0);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(notification.id);
    }, 200);
  };

  const handleClick = () => {
    if (swipeOffset === 0 && !isDeleting) {
      onClick(notification);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = 'w-5 h-5 text-gray-600';

    switch (type) {
      case 'follow':
        return <UserPlus className={iconClass} />;
      case 'support':
        return <Heart className={iconClass} />;
      case 'comment':
        return <MessageCircle className={iconClass} />;
      case 'reply':
        return <Reply className={iconClass} />;
      case 'mention':
        return <AtSign className={iconClass} />;
      case 'group':
        return <Users className={iconClass} />;
      case 'challenge':
        return <Trophy className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Delete button background */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center justify-end bg-red-500 px-6"
        style={{
          width: `${Math.max(swipeOffset, 0)}px`,
          transition: isDeleting
            ? 'none'
            : swipeOffset === deleteThreshold
              ? 'width 0.2s ease-out'
              : 'none',
        }}
      >
        <button
          onClick={handleDelete}
          className="text-white flex flex-col items-center gap-1"
        >
          <Trash2 className="w-6 h-6" />
          <span className="text-xs font-medium">Delete</span>
        </button>
      </div>

      {/* Notification content */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleClick}
        className={`border-b border-gray-200 transition-all ${
          isDeleting ? 'opacity-0 translate-x-full' : ''
        } ${!notification.isRead ? 'bg-gray-100' : 'bg-white'}`}
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          transition: isDeleting
            ? 'all 0.3s ease-out'
            : swipeOffset === deleteThreshold || swipeOffset === 0
              ? 'transform 0.2s ease-out'
              : 'none',
        }}
      >
        <div className="flex items-start gap-4 p-4">
          {/* Avatar / Icon */}
          <div className="flex-shrink-0">
            {notification.actorProfilePicture ? (
              <Image
                src={notification.actorProfilePicture}
                alt={notification.actorName ?? ''}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                {getNotificationIcon(notification.type)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p
                  className={`text-base text-gray-900 ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}
                >
                  {notification.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
                {notification.createdAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDistanceToNow(notification.createdAt, {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: notifications = [] } = useNotifications({
    realtime: true,
  });
  const unreadCount = useUnreadCount();
  const markAsReadMutation = useMarkNotificationRead();
  const markAllAsReadMutation = useMarkAllNotificationsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const clearAllNotificationsMutation = useClearAllNotifications();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to link if available
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  };

  const handleDelete = (id: string) => {
    deleteNotificationMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleClearAllClick = () => {
    setShowClearConfirm(true);
  };

  const handleClearAllConfirm = () => {
    clearAllNotificationsMutation.mutate();
    setShowClearConfirm(false);
  };

  const handleClearAllCancel = () => {
    setShowClearConfirm(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view notifications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Desktop content wrapper */}
      <div className="hidden md:flex flex-1 items-start justify-center pt-24 pb-8">
        <div className="w-full max-w-2xl px-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Notifications
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                      : 'All caught up!'}
                  </p>
                </div>
                {notifications.length > 0 && (
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        disabled={markAllAsReadMutation.isPending}
                        className="px-4 py-2 text-sm font-semibold text-[#0066CC] hover:text-[#0051D5] hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        data-testid="mark-all-read-button-desktop"
                        aria-label="Mark all notifications as read"
                        aria-busy={markAllAsReadMutation.isPending}
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={handleClearAllClick}
                      disabled={clearAllNotificationsMutation.isPending}
                      className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      data-testid="clear-all-button-desktop"
                      aria-label="Clear all notifications"
                      aria-busy={clearAllNotificationsMutation.isPending}
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop notifications list */}
            <div className="divide-y divide-gray-200">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔔</span>
                  </div>
                  <p className="text-gray-600">No notifications yet</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <SwipeableNotificationItem
                    key={notification.id}
                    notification={notification}
                    onDelete={handleDelete}
                    onClick={handleNotificationClick}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Sticky at top on mobile */}
      {notifications.length > 0 && (
        <div className="md:hidden bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-[57px] z-10">
          <span className="text-sm text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </span>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllAsReadMutation.isPending}
                className="text-[#0066CC] font-semibold text-sm hover:text-[#0051D5] transition-colors disabled:opacity-50"
                data-testid="mark-all-read-button-mobile"
                aria-label="Mark all notifications as read"
                aria-busy={markAllAsReadMutation.isPending}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={handleClearAllClick}
              disabled={clearAllNotificationsMutation.isPending}
              className="text-red-600 font-semibold text-sm hover:text-red-700 transition-colors disabled:opacity-50"
              data-testid="clear-all-button-mobile"
              aria-label="Clear all notifications"
              aria-busy={clearAllNotificationsMutation.isPending}
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Mobile Notifications List */}
      <div className="md:hidden flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🔔</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              No notifications
            </p>
            <p className="text-gray-600 text-center">
              When you get notifications, they'll show up here
            </p>
          </div>
        ) : (
          <div>
            {notifications.map(notification => (
              <SwipeableNotificationItem
                key={notification.id}
                notification={notification}
                onDelete={handleDelete}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      <BottomNavigation />

      {/* Clear All Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={handleClearAllCancel}
        onConfirm={handleClearAllConfirm}
        title="Clear All Notifications"
        message="Are you sure you want to delete all notifications? This action cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        variant="danger"
        isLoading={clearAllNotificationsMutation.isPending}
      />
    </div>
  );
}
