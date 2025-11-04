'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Search, Settings, ChevronLeft } from 'lucide-react';
import NotificationIcon from './NotificationIcon';

interface MobileHeaderProps {
  title: string;
  showNotifications?: boolean;
  showProfilePicture?: boolean;
  showBackButton?: boolean;
  showSettings?: boolean;
  onSettingsClick?: () => void;
}

export default function MobileHeader({
  title,
  showNotifications = false,
  showProfilePicture = true,
  showBackButton = false,
  showSettings = false,
  onSettingsClick,
}: MobileHeaderProps) {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <header className="md:hidden bg-gray-50 px-4 py-2 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-center h-10 relative">
        {/* Left Side Icons */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
          {/* Back Button */}
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft
                className="w-6 h-6"
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          )}

          {/* Profile Picture */}
          {showProfilePicture && !showBackButton && (
            <Link href="/you?tab=profile">
              {user.profilePicture ? (
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-300">
                  <Image
                    src={user.profilePicture}
                    alt={user.name}
                    width={64}
                    height={64}
                    quality={90}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-[#FC4C02] rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-gray-300">
                  <span className="text-white font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </Link>
          )}

          {/* Search Icon */}
          {showNotifications && (
            <Link
              href="/search"
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Search and discover"
            >
              <Search
                className="w-6 h-6 text-gray-700"
                strokeWidth={2}
                aria-hidden="true"
              />
            </Link>
          )}
        </div>

        {/* Page Title - Centered */}
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>

        {/* Right Side Icons */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          {showNotifications && <NotificationIcon className="text-gray-700" />}
          {showSettings && (
            <button
              onClick={onSettingsClick}
              className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open settings menu"
            >
              <Settings
                className="w-6 h-6"
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
