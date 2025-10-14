'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Users,
  Trophy,
  Reply,
  AtSign,
  Check,
} from 'lucide-react';
import { Notification } from '@/types';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'follow':
      return <UserPlus className="w-5 h-5" />;
    case 'support':
      return <Heart className="w-5 h-5" />;
    case 'comment':
      return <MessageCircle className="w-5 h-5" />;
    case 'reply':
      return <Reply className="w-5 h-5" />;
    case 'mention':
      return <AtSign className="w-5 h-5" />;
    case 'group':
      return <Users className="w-5 h-5" />;
    case 'challenge':
      return <Trophy className="w-5 h-5" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
};


export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const router = useRouter();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleNotificationClick = (notification: Notification) => {
    // Close panel and navigate immediately for better UX
    onClose();

    // Navigate to the link
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }

    // Mark as read in the background (don't await)
    if (!notification.isRead) {
      markAsRead(notification.id).catch((error) => {
        console.error('Failed to mark notification as read:', error);
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    setDeletingIds((prev) => new Set(prev).add(notificationId));
    await deleteNotification(notificationId);
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(notificationId);
      return next;
    });
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dropdown Panel */}
      <div className="absolute top-12 right-0 w-[400px] max-h-[500px] bg-white z-50 shadow-2xl rounded-lg border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-[#007AFF] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-[#007AFF] hover:text-[#0051D5] font-medium flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                    !notification.isRead ? 'bg-gray-100' : ''
                  } ${deletingIds.has(notification.id) ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-700 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-[#007AFF] rounded-full mt-2" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
