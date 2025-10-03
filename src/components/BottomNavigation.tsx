'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTimer } from '@/contexts/TimerContext';
import { Home, Compass, Play, Users, User } from 'lucide-react';

export default function BottomNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { timerState } = useTimer();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === '/search') return pathname.startsWith('/search');
    if (path === '/projects') return pathname.startsWith('/projects');
    if (path === '/groups') return pathname.startsWith('/groups');
    return pathname === path;
  };

  const hasActiveSession = timerState.currentProject && (timerState.isRunning || timerState.pausedDuration > 0);
  const isOnTimerPage = pathname.startsWith('/timer');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden mobile-safe-area">
      <div className="flex items-center justify-around h-16 px-2" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-1 transition-colors ${
            isActive('/') ? 'text-[#007AFF]' : 'text-gray-500'
          }`}
        >
          <Home className="w-6 h-6" strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Discover */}
        <Link
          href="/search"
          className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-1 transition-colors ${
            isActive('/search') ? 'text-[#007AFF]' : 'text-gray-500'
          }`}
        >
          <Compass className="w-6 h-6" strokeWidth={isActive('/search') ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Discover</span>
        </Link>

        {/* Record Button (FAB style in center) */}
        <Link
          href="/timer"
          className="flex flex-col items-center justify-center -mt-2"
        >
          <div className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all ${
            hasActiveSession && !isOnTimerPage ? 'bg-[#007AFF]' : 'bg-gray-900'
          }`}>
            {hasActiveSession && !isOnTimerPage ? (
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-white mb-0.5 animate-pulse" />
              </div>
            ) : (
              <Play className="w-6 h-6 text-white" fill="white" />
            )}
          </div>
          <span className={`text-[10px] font-medium mt-0.5 ${
            hasActiveSession && !isOnTimerPage ? 'text-[#007AFF]' : 'text-gray-600'
          }`}>
            {hasActiveSession && !isOnTimerPage ? 'Active' : 'Record'}
          </span>
        </Link>

        {/* Groups */}
        <Link
          href="/groups"
          className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-1 transition-colors ${
            isActive('/groups') ? 'text-[#007AFF]' : 'text-gray-500'
          }`}
        >
          <Users className="w-6 h-6" strokeWidth={isActive('/groups') ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Groups</span>
        </Link>

        {/* Profile */}
        <Link
          href={user ? `/profile/${user.username}` : '/profile'}
          className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-1 transition-colors ${
            pathname.startsWith('/profile') ? 'text-[#007AFF]' : 'text-gray-500'
          }`}
        >
          <User className="w-6 h-6" strokeWidth={pathname.startsWith('/profile') ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
