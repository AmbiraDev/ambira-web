'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTimer } from '@/contexts/TimerContext';
import { Home, Compass, PlayCircle, Users, User } from 'lucide-react';

export default function BottomNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { timerState } = useTimer();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === '/search') return pathname.startsWith('/search');
    if (path === '/activities') return pathname.startsWith('/activities');
    if (path === '/groups') return pathname.startsWith('/groups');
    if (path === '/you') return pathname.startsWith('/you');
    return pathname === path;
  };

  const hasActiveSession = timerState.currentProject && (timerState.isRunning || timerState.pausedDuration > 0);
  const isOnTimerPage = pathname.startsWith('/timer');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around h-20 px-2 pb-6 pt-2" style={{paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'}}>
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

        {/* Record Button */}
        <Link
          href="/timer"
          className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-1 transition-colors ${
            isActive('/timer') ? 'text-[#007AFF]' : 'text-gray-500'
          }`}
        >
          <div className="relative">
            <PlayCircle className="w-6 h-6" strokeWidth={isActive('/timer') ? 2.5 : 2} fill={isActive('/timer') ? 'currentColor' : 'none'} />
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
          <Users className="w-6 h-6" strokeWidth={isActive('/groups') ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Groups</span>
        </Link>

        {/* You */}
        <Link
          href="/you"
          className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-1 transition-colors ${
            isActive('/you') ? 'text-[#007AFF]' : 'text-gray-500'
          }`}
        >
          <User className="w-6 h-6" strokeWidth={isActive('/you') ? 2.5 : 2} />
          <span className="text-[10px] font-medium">You</span>
        </Link>
      </div>
    </nav>
  );
}
