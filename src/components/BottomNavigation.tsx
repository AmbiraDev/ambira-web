'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTimer } from '@/contexts/TimerContext';
import {
  Home,
  Compass,
  PlayCircle,
  Users,
  MoreHorizontal,
  User,
  Activity,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { timerState } = useTimer();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === '/search') return pathname.startsWith('/search');
    if (path === '/activities') return pathname.startsWith('/activities');
    if (path === '/groups') return pathname.startsWith('/groups');
    if (path === '/profile')
      return pathname.startsWith('/profile') || pathname.startsWith('/you');
    if (path === '/analytics') return pathname.startsWith('/analytics');
    if (path === '/settings') return pathname.startsWith('/settings');
    return pathname === path;
  };

  // Check if any "More" menu item is active
  const isMoreActive =
    isActive('/profile') ||
    isActive('/analytics') ||
    isActive('/activities') ||
    isActive('/settings');

  const hasActiveSession =
    timerState.currentProject &&
    (timerState.isRunning || timerState.pausedDuration > 0);
  const isOnTimerPage = pathname.startsWith('/timer');

  // Close menu when pathname changes
  useEffect(() => {
    setShowMoreMenu(false);
  }, [pathname]);

  const handleMoreClick = () => {
    setShowMoreMenu(!showMoreMenu);
  };

  const handleNavigate = (path: string) => {
    setShowMoreMenu(false);
    router.push(path);
  };

  return (
    <>
      {/* Backdrop */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setShowMoreMenu(false)}
        />
      )}

      {/* More Menu */}
      {showMoreMenu && (
        <div className="fixed bottom-20 left-0 right-0 z-50 md:hidden animate-slide-up">
          <div className="mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Menu</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* Profile */}
              <button
                onClick={() => handleNavigate('/profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  isActive('/profile') ? 'bg-blue-50' : ''
                }`}
              >
                {user?.profilePicture ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white">
                    <Image
                      src={user.profilePicture}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-[#FC4C02] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div
                    className={`font-medium ${isActive('/profile') ? 'text-[#007AFF]' : 'text-gray-900'}`}
                  >
                    My Profile
                  </div>
                  <div className="text-xs text-gray-500">@{user?.username}</div>
                </div>
              </button>

              {/* Activities */}
              <button
                onClick={() => handleNavigate('/activities')}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  isActive('/activities') ? 'bg-blue-50' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive('/activities') ? 'bg-blue-100' : 'bg-gray-100'
                  }`}
                >
                  <Activity
                    className={`w-5 h-5 ${isActive('/activities') ? 'text-[#007AFF]' : 'text-gray-600'}`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div
                    className={`font-medium ${isActive('/activities') ? 'text-[#007AFF]' : 'text-gray-900'}`}
                  >
                    Activities
                  </div>
                  <div className="text-xs text-gray-500">
                    Manage your activities
                  </div>
                </div>
              </button>

              {/* Analytics */}
              <button
                onClick={() => handleNavigate('/analytics')}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  isActive('/analytics') ? 'bg-blue-50' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive('/analytics') ? 'bg-blue-100' : 'bg-gray-100'
                  }`}
                >
                  <BarChart3
                    className={`w-5 h-5 ${isActive('/analytics') ? 'text-[#007AFF]' : 'text-gray-600'}`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div
                    className={`font-medium ${isActive('/analytics') ? 'text-[#007AFF]' : 'text-gray-900'}`}
                  >
                    Analytics
                  </div>
                  <div className="text-xs text-gray-500">
                    View detailed stats
                  </div>
                </div>
              </button>

              {/* Settings */}
              <button
                onClick={() => handleNavigate('/settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  isActive('/settings') ? 'bg-blue-50' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive('/settings') ? 'bg-blue-100' : 'bg-gray-100'
                  }`}
                >
                  <Settings
                    className={`w-5 h-5 ${isActive('/settings') ? 'text-[#007AFF]' : 'text-gray-600'}`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div
                    className={`font-medium ${isActive('/settings') ? 'text-[#007AFF]' : 'text-gray-900'}`}
                  >
                    Settings
                  </div>
                  <div className="text-xs text-gray-500">
                    Account & preferences
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
        <div
          className="flex items-center justify-around h-20 px-2 pb-6 pt-2"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* Feed */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-1 transition-colors ${
              isActive('/') ? 'text-[#007AFF]' : 'text-gray-500'
            }`}
          >
            <Home className="w-6 h-6" strokeWidth={isActive('/') ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Feed</span>
          </Link>

          {/* Discovery */}
          <Link
            href="/search"
            className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-1 transition-colors ${
              isActive('/search') ? 'text-[#007AFF]' : 'text-gray-500'
            }`}
          >
            <Compass
              className="w-6 h-6"
              strokeWidth={isActive('/search') ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">Discovery</span>
          </Link>

          {/* Record Button */}
          <Link
            href="/timer"
            className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-1 transition-colors ${
              isActive('/timer') ? 'text-[#007AFF]' : 'text-gray-500'
            }`}
          >
            <div className="relative">
              <PlayCircle
                className="w-6 h-6"
                strokeWidth={isActive('/timer') ? 2.5 : 2}
                fill={isActive('/timer') ? 'currentColor' : 'none'}
              />
              {hasActiveSession && !isOnTimerPage && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#007AFF] rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-medium">Record</span>
          </Link>

          {/* Groups */}
          <Link
            href="/groups"
            className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-1 transition-colors ${
              isActive('/groups') ? 'text-[#007AFF]' : 'text-gray-500'
            }`}
          >
            <Users
              className="w-6 h-6"
              strokeWidth={isActive('/groups') ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">Groups</span>
          </Link>

          {/* More */}
          <button
            onClick={handleMoreClick}
            className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-1 transition-colors ${
              isMoreActive || showMoreMenu ? 'text-[#007AFF]' : 'text-gray-500'
            }`}
          >
            <MoreHorizontal
              className="w-6 h-6"
              strokeWidth={isMoreActive || showMoreMenu ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
