'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTimer } from '@/contexts/TimerContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const { timerState } = useTimer();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#007AFF] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:inline">Ambira</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8 h-16">
              <Link 
                href="/" 
                className={`text-base font-medium transition-colors flex items-center h-full relative ${
                  isActive('/') 
                    ? 'text-gray-900' 
                    : 'text-gray-600 hover:text-[#007AFF]'
                }`}
              >
                Dashboard
                {isActive('/') && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007AFF]"></div>
                )}
              </Link>
              <Link 
                href="/projects" 
                className={`text-base font-medium transition-colors flex items-center h-full relative ${
                  isActive('/projects') 
                    ? 'text-gray-900' 
                    : 'text-gray-600 hover:text-[#007AFF]'
                }`}
              >
                Projects
                {isActive('/projects') && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007AFF]"></div>
                )}
              </Link>
              <Link 
                href="/groups" 
                className={`text-base font-medium transition-colors flex items-center h-full relative ${
                  isActive('/groups') 
                    ? 'text-gray-900' 
                    : 'text-gray-600 hover:text-[#007AFF]'
                }`}
              >
                Groups
                {isActive('/groups') && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007AFF]"></div>
                )}
              </Link>
              <Link 
                href="/challenges" 
                className={`text-base font-medium transition-colors flex items-center h-full relative ${
                  isActive('/challenges') 
                    ? 'text-gray-900' 
                    : 'text-gray-600 hover:text-[#007AFF]'
                }`}
              >
                Challenges
                {isActive('/challenges') && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007AFF]"></div>
                )}
              </Link>
              <Link 
                href="/tasks" 
                className={`text-base font-medium transition-colors flex items-center h-full relative ${
                  isActive('/tasks') 
                    ? 'text-gray-900' 
                    : 'text-gray-600 hover:text-[#007AFF]'
                }`}
              >
                Tasks
                {isActive('/tasks') && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007AFF]"></div>
                )}
              </Link>
            </nav>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Search icon */}
            <button className="p-2 text-gray-600 hover:text-[#007AFF] transition-colors hidden md:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Session Status / Start Session Button */}
            {timerState.currentProject && (timerState.isRunning || timerState.pausedDuration > 0) ? (
              <Link 
                href="/timer"
                className="hidden md:flex items-center space-x-2 px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-green-300" />
                <span>Active</span>
              </Link>
            ) : (
              <Link 
                href="/timer"
                className="hidden md:block px-4 py-1.5 bg-[#007AFF] text-white text-sm font-medium rounded hover:bg-[#0056D6] transition-colors"
              >
                Record Now
              </Link>
            )}

            {/* Notifications */}
            <button className="p-2 text-gray-600 hover:text-[#007AFF] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* Profile with dropdown (opens on hover, with small close delay) */}
            <div 
              className="relative"
              onMouseEnter={() => {
                if (profileCloseTimerRef.current) {
                  clearTimeout(profileCloseTimerRef.current);
                  profileCloseTimerRef.current = null;
                }
                setIsProfileMenuOpen(true);
              }}
              onMouseLeave={() => {
                if (profileCloseTimerRef.current) {
                  clearTimeout(profileCloseTimerRef.current);
                }
                profileCloseTimerRef.current = setTimeout(() => setIsProfileMenuOpen(false), 200);
              }}
            >
              <button 
                className="flex items-center space-x-1 text-gray-600 hover:text-[#007AFF] transition-colors"
              >
                <div className="w-8 h-8 bg-[#FC4C02] rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <svg className="w-4 h-4 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isProfileMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20"
                  onMouseEnter={() => {
                    if (profileCloseTimerRef.current) {
                      clearTimeout(profileCloseTimerRef.current);
                      profileCloseTimerRef.current = null;
                    }
                    setIsProfileMenuOpen(true);
                  }}
                  onMouseLeave={() => {
                    if (profileCloseTimerRef.current) {
                      clearTimeout(profileCloseTimerRef.current);
                    }
                    profileCloseTimerRef.current = setTimeout(() => setIsProfileMenuOpen(false), 200);
                  }}
                >
                    <Link
                      href={user ? `/profile/${user.username}` : '/profile'}
                      className="block px-4 py-2 text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      Settings
                    </Link>
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={() => logout()}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Log Out
                    </button>
                </div>
              )}
            </div>

            {/* Plus button */}
            <button className="p-2 text-gray-600 hover:text-[#007AFF] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-[#007AFF] transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>


        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="py-4 space-y-2">
              <Link 
                href="/" 
                className={`block px-4 py-2 transition-colors ${
                  isActive('/') 
                    ? 'text-[#007AFF] bg-blue-50' 
                    : 'text-gray-900 hover:text-[#007AFF]'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/projects" 
                className={`block px-4 py-2 transition-colors ${
                  isActive('/projects') 
                    ? 'text-[#007AFF] bg-blue-50' 
                    : 'text-gray-600 hover:text-[#007AFF]'
                }`}
              >
                Projects
              </Link>
              <Link 
                href="/groups" 
                className={`block px-4 py-2 transition-colors ${
                  isActive('/groups') 
                    ? 'text-[#007AFF] bg-blue-50' 
                    : 'text-gray-600 hover:text-[#007AFF]'
                }`}
              >
                Groups
              </Link>
              <Link 
                href="/challenges" 
                className={`block px-4 py-2 transition-colors ${
                  isActive('/challenges') 
                    ? 'text-[#007AFF] bg-blue-50' 
                    : 'text-gray-600 hover:text-[#007AFF]'
                }`}
              >
                Challenges
              </Link>
              <Link 
                href="/tasks" 
                className={`block px-4 py-2 transition-colors ${
                  isActive('/tasks') 
                    ? 'text-[#007AFF] bg-blue-50' 
                    : 'text-gray-600 hover:text-[#007AFF]'
                }`}
              >
                Tasks
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}