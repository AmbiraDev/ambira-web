'use client'

import React, { useState } from 'react'
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useClearAllNotifications,
} from '@/hooks/useNotifications'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
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
  Trash2,
} from 'lucide-react'
import { Notification } from '@/types'
import ConfirmDialog from '@/components/ConfirmDialog'

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const getNotificationIcon = (type: Notification['type']) => {
  const iconClass = 'w-5 h-5 text-gray-600'

  switch (type) {
    case 'follow':
      return <UserPlus className={iconClass} />
    case 'support':
      return <Heart className={iconClass} />
    case 'comment':
      return <MessageCircle className={iconClass} />
    case 'reply':
      return <Reply className={iconClass} />
    case 'mention':
      return <AtSign className={iconClass} />
    case 'group':
      return <Users className={iconClass} />
    case 'challenge':
      return <Trophy className={iconClass} />
    default:
      return <Bell className={iconClass} />
  }
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  // Enable real-time updates for notifications panel
  const { data: notifications = [] } = useNotifications({
    realtime: true,
  })
  const unreadCount = useUnreadCount()
  const markAsReadMutation = useMarkNotificationRead()
  const markAllAsReadMutation = useMarkAllNotificationsRead()
  const deleteNotificationMutation = useDeleteNotification()
  const clearAllNotificationsMutation = useClearAllNotifications()
  const router = useRouter()
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleNotificationClick = (notification: Notification) => {
    // Close panel and navigate immediately for better UX
    onClose()

    // Navigate to the link
    if (notification.linkUrl) {
      router.push(notification.linkUrl)
    }

    // Mark as read in the background (don't await) - using React Query mutation
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id)
    }
  }

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()

    // Get the current mouse position
    const mouseY = e.clientY

    setDeletingIds((prev) => new Set(prev).add(notificationId))

    // Use React Query mutation with optimistic updates
    await deleteNotificationMutation.mutateAsync(notificationId)

    setDeletingIds((prev) => {
      const next = new Set(prev)
      next.delete(notificationId)
      return next
    })

    // After deletion, check which notification is now under the mouse cursor
    const elementAtPoint = document.elementFromPoint(e.clientX, mouseY)
    const notificationElement = elementAtPoint?.closest('[data-notification-id]')
    if (notificationElement) {
      const newNotificationId = notificationElement.getAttribute('data-notification-id')
      if (newNotificationId) {
        setHoveredId(newNotificationId)
      }
    }
  }

  const handleMarkAllRead = async () => {
    await markAllAsReadMutation.mutateAsync()
  }

  const handleClearAllClick = () => {
    setShowClearConfirm(true)
  }

  const handleClearAllConfirm = async () => {
    await clearAllNotificationsMutation.mutateAsync()
    setShowClearConfirm(false)
  }

  const handleClearAllCancel = () => {
    setShowClearConfirm(false)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown Panel */}
      <div className="absolute top-12 right-0 w-[400px] max-h-[500px] bg-white z-50 shadow-2xl rounded-lg border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-[#0066CC] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs text-[#0066CC] hover:text-[#0051D5] font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
                aria-label="Mark all notifications as read"
                aria-busy={markAllAsReadMutation.isPending}
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAllClick}
                disabled={clearAllNotificationsMutation.isPending}
                className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
                aria-label="Clear all notifications"
                aria-busy={clearAllNotificationsMutation.isPending}
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>
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
                  data-notification-id={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  onMouseEnter={() => setHoveredId(notification.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                    !notification.isRead ? 'bg-gray-100' : ''
                  } ${deletingIds.has(notification.id) ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-700 mt-0.5">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(notification.createdAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    {/* Delete button (shown on hover) or Unread indicator */}
                    <div className="flex-shrink-0">
                      {hoveredId === notification.id ? (
                        <button
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          disabled={deletingIds.has(notification.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        !notification.isRead && (
                          <div className="w-2 h-2 bg-[#0066CC] rounded-full mt-2" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
    </>
  )
}
