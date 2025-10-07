'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTimer } from '@/contexts/TimerContext';
import { useAuth } from '@/contexts/AuthContext';
import { Search, X, ChevronDown, Menu, LayoutDashboard, Users, BarChart3, Timer } from 'lucide-react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'people' | 'groups' | 'challenges'>('people');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const profileCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { timerState, getElapsedTime, getFormattedTime } = useTimer();
  const { user, logout } = useAuth();
  const [headerTimer, setHeaderTimer] = useState<string>('');

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // Focus search input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Update header timer display when there is an active/paused session and we are not on the timer page
  useEffect(() => {
    const onTimerPage = pathname.startsWith('/timer');
    const hasActiveOrPaused = !!(timerState.currentProject && (timerState.isRunning || timerState.pausedDuration > 0));

    if (!hasActiveOrPaused || onTimerPage) {
      setHeaderTimer('');
      return;
    }

    const update = () => {
      const secs = getElapsedTime();
      setHeaderTimer(getFormattedTime(secs));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [pathname, timerState.currentProject, timerState.isRunning, timerState.pausedDuration, getElapsedTime, getFormattedTime]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=${searchFilter}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const getFilterLabel = () => {
    switch (searchFilter) {
      case 'people': return 'People';
      case 'groups': return 'Groups';
      case 'challenges': return 'Challenges';
      default: return 'People';
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between h-16">
          {/* Left side: Logo + Search + Navigation */}
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#007AFF] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:inline">Ambira</span>
            </Link>

            {/* Search Area */}
            {isSearchOpen ? (
              <div className="flex items-center space-x-1 md:space-x-2 flex-1 md:flex-none">
                <form onSubmit={handleSearch} className="flex items-center space-x-1 md:space-x-2 flex-1 md:flex-none">
                  {/* Filter Dropdown */}
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                      className="flex items-center space-x-1 md:space-x-1.5 px-2 md:px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap text-xs md:text-sm"
                    >
                      <span className="font-medium hidden md:inline">{getFilterLabel()}</span>
                      <span className="font-medium md:hidden">{getFilterLabel().slice(0, 1)}</span>
                      <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {isFilterDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchFilter('people');
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 transition-colors ${
                            searchFilter === 'people' ? 'bg-blue-50 text-[#007AFF]' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          People
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchFilter('groups');
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 transition-colors ${
                            searchFilter === 'groups' ? 'bg-blue-50 text-[#007AFF]' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Groups
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchFilter('challenges');
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 transition-colors ${
                            searchFilter === 'challenges' ? 'bg-blue-50 text-[#007AFF]' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Challenges
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="relative flex-1 md:w-80 md:flex-none min-w-0">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search ${getFilterLabel().toLowerCase()}...`}
                      className="w-full px-3 md:px-4 py-2 pr-8 md:pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent text-xs md:text-sm"
                    />
                    <Search className="w-3 h-3 md:w-4 md:h-4 absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </form>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                    setIsFilterDropdownOpen(false);
                  }}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-600 hover:text-[#007AFF] transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Desktop Navigation - Only show when search is closed */}
            {!isSearchOpen && (
              <nav className="hidden md:flex items-center space-x-6 h-16">
                <Link 
                  href="/" 
                  className={`text-base font-medium transition-colors flex items-center gap-2 h-full relative ${
                    isActive('/') 
                      ? 'text-gray-900' 
                      : 'text-gray-600 hover:text-[#007AFF]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                  {isActive('/') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007AFF]"></div>
                  )}
                </Link>
                <Link
                  href="/groups"
                  className={`text-base font-medium transition-colors flex items-center gap-2 h-full relative ${
                    isActive('/groups')
                      ? 'text-gray-900'
                      : 'text-gray-600 hover:text-[#007AFF]'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Groups
                  {isActive('/groups') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007AFF]"></div>
                  )}
                </Link>
                <Link
                  href="/you?tab=progress"
                  className={`text-base font-medium transition-colors flex items-center gap-2 h-full relative ${
                    isActive('/you')
                      ? 'text-gray-900'
                      : 'text-gray-600 hover:text-[#007AFF]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                  {isActive('/you') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007AFF]"></div>
                  )}
                </Link>
              </nav>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">

            {/* Active Session Status - Only show when there's an active/paused session */}
            {timerState.currentProject && (timerState.isRunning || timerState.pausedDuration > 0) && (
              <Link
                href="/timer"
                className="hidden md:flex items-center space-x-2 px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-green-300" />
                <span>{pathname.startsWith('/timer') ? 'Active' : headerTimer || 'Active'}</span>
              </Link>
            )}

            {/* Profile with dropdown (opens on hover, with small close delay) - Only show when authenticated */}
            {user && (
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
                  className="flex items-center space-x-2 text-gray-600 hover:text-[#007AFF] transition-colors"
                >
                  {user.profilePicture ? (
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-200 hover:ring-[#007AFF] transition-all">
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
                    <div className="w-9 h-9 bg-[#FC4C02] rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-gray-200 hover:ring-[#007AFF] transition-all">
                      <span className="text-sm font-medium text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4 hidden md:block" />
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
                        href="/you?tab=profile"
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
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-[#007AFF] transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
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
                href="/you?tab=progress"
                className={`block px-4 py-2 transition-colors ${
                  isActive('/you')
                    ? 'text-[#007AFF] bg-blue-50'
                    : 'text-gray-600 hover:text-[#007AFF]'
                }`}
              >
                Analytics
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}