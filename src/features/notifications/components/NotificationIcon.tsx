'use client'

import React, { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications, useUnreadCount } from '@/hooks/useNotifications'
import NotificationsPanel from './NotificationsPanel'
import { useRouter } from 'next/navigation'

interface NotificationIconProps {
  className?: string
  showLabel?: boolean
  labelClassName?: string
}

export default function NotificationIcon({
  className = '',
  showLabel = false,
  labelClassName = '',
}: NotificationIconProps) {
  // Enable real-time updates for notification bell
  useNotifications({ realtime: true })
  const unreadCount = useUnreadCount()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleClick = () => {
    if (isMobile) {
      router.push('/notifications')
    } else {
      setIsPanelOpen(true)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`relative flex items-center gap-2 ${className}`}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
      >
        <div className="relative">
          <Bell className="w-6 h-6" aria-hidden="true" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-[#FF2D55] text-white text-xs font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>
        {showLabel && <span className={labelClassName}>Notifications</span>}
      </button>

      {/* Desktop dropdown panel */}
      {!isMobile && (
        <NotificationsPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
      )}
    </div>
  )
}
