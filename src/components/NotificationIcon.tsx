'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';
import NotificationsPanel from './NotificationsPanel';

interface NotificationIconProps {
  className?: string;
  showLabel?: boolean;
  labelClassName?: string;
}

export default function NotificationIcon({
  className = '',
  showLabel = false,
  labelClassName = '',
}: NotificationIconProps) {
  const { unreadCount } = useNotifications();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsPanelOpen(true)}
        className={`relative flex items-center gap-2 ${className}`}
      >
        <div className="relative">
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-[#FF2D55] text-white text-xs font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>
        {showLabel && <span className={labelClassName}>Notifications</span>}
      </button>

      <NotificationsPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </div>
  );
}
