'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTimer } from '@/contexts/TimerContext';
import { useAuth } from '@/contexts/AuthContext';
import { Search, X, ChevronDown, Menu, LayoutDashboard, Users, BarChart3, Timer, Edit3 } from 'lucide-react';
import NotificationIcon from './NotificationIcon';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAnalyticsMenuOpen, setIsAnalyticsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'people' | 'groups' | 'challenges'>('people');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const profileCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyticsCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between h-14">
          {/* Left side: Logo + Search + Navigation */}
          <div className="flex items-center space-x-4 ml-8">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <Image
                src="/logo.svg"
                alt="Ambira"
                width={48}
                height={48}
                className="w-12 h-12"
                priority
              />
            </Link>

            {/* Search Area - Only show when authenticated */}
            {user && (
              <>
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
              </>
            )}

            {/* Desktop Navigation - Only show when search is closed AND user is authenticated */}
            {!isSearchOpen && user && (
              <nav className="hidden md:flex items-center space-x-6 h-14">
                <Link
                  href="/feed"
                  className={`text-base font-[450] transition-colors h-full relative flex items-center ${
                    isActive('/feed')
                      ? 'text-gray-900'
                      : 'text-gray-600 hover:text-[#007AFF]'
                  }`}
                >
                  Dashboard
                  {isActive('/feed') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007AFF]"></div>
                  )}
                </Link>
                <Link
                  href="/groups"
                  className={`text-base font-[450] transition-colors h-full relative flex items-center ${
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
                  href="/activities"
                  className={`text-base font-[450] transition-colors h-full relative flex items-center ${
                    isActive('/activities')
                      ? 'text-gray-900'
                      : 'text-gray-600 hover:text-[#007AFF]'
                  }`}
                >
                  Activities
                  {isActive('/activities') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007AFF]"></div>
                  )}
                </Link>
                <Link
                  href="/analytics"
                  className={`text-base font-[450] transition-colors h-full relative flex items-center ${
                    isActive('/analytics')
                      ? 'text-gray-900'
                      : 'text-gray-600 hover:text-[#007AFF]'
                  }`}
                >
                  Analytics
                  {isActive('/analytics') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007AFF]"></div>
                  )}
                </Link>
              </nav>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">

            {/* "Have an account?" text + Sign In Button - Only show when NOT authenticated */}
            {!user && (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-gray-700 text-sm font-medium">Have an account?</span>
                <Link
                  href="/auth"
                  className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white hover:bg-[#0051D5] rounded-md transition-colors whitespace-nowrap font-semibold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 min-h-[44px]"
                >
                  <span>Sign In</span>
                </Link>
              </div>
            )}

            {/* Discord Community Button - Only show when NOT authenticated */}
            {!user && (
              <a
                href="https://discord.gg/wFMeNmCpdQ"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#5865F2] text-white hover:bg-[#4752C4] rounded-md transition-colors whitespace-nowrap font-semibold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 min-h-[44px]"
              >
                <svg width="20" height="20" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="currentColor"/>
                </svg>
                <span>Community</span>
              </a>
            )}

            {/* Session Actions - Only show when NO active session AND user is authenticated */}
            {user && !timerState.currentProject && (
              <>
                {/* Start Session Button - Solid Blue */}
                <Link
                  href="/timer"
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white hover:bg-[#0051D5] rounded-md transition-colors whitespace-nowrap font-semibold text-sm"
                >
                  <Timer
                    className="w-4 h-4"
                    strokeWidth={2.5}
                  />
                  <span>Start Session</span>
                </Link>

                {/* Manual Session Button - White with Border */}
                <Link
                  href="/record-manual"
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors whitespace-nowrap font-semibold text-sm"
                >
                  <Edit3
                    className="w-4 h-4"
                    strokeWidth={2.5}
                  />
                  <span>Log Manual</span>
                </Link>
              </>
            )}

            {/* Active Session Status - Only show when there's an active/paused session */}
            {timerState.currentProject && (timerState.isRunning || timerState.pausedDuration > 0) && (
              <Link
                href="/timer"
                className="hidden md:flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-green-300 flex-shrink-0" />
                <span className="w-[60px] text-center">{pathname.startsWith('/timer') ? 'Active' : headerTimer || 'Active'}</span>
              </Link>
            )}

            {/* Notifications Icon */}
            {user && (
              <NotificationIcon className="hidden md:flex p-2 text-gray-600 hover:text-[#007AFF] transition-colors" />
            )}

            {/* Profile with Strava-style dropdown - Only show when authenticated */}
            {user && (
              <div className="relative">
                {/* Profile Container - Hover triggers dropdown */}
                <div
                  className="flex items-center gap-1 cursor-pointer"
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
                  {/* Profile Picture - Click to go to profile */}
                  <Link href="/profile" className="text-gray-600 hover:text-[#007AFF] transition-colors">
                    {user.profilePicture ? (
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-200 transition-all">
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
                      <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-gray-200 transition-all">
                        <span className="text-sm font-medium text-gray-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Dropdown Icon */}
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="p-1 text-gray-600 hover:text-[#007AFF] transition-colors"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 z-20 w-48 bg-white border border-gray-300 shadow-lg overflow-hidden"
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
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        Settings
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button - Only show when authenticated */}
            {user && (
              <button
                className="md:hidden p-2 text-gray-600 hover:text-[#007AFF] transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation - Only show when authenticated */}
        {user && isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-sm">
            <nav className="py-4 space-y-2">
              <Link
                href="/feed"
                className={`block px-4 py-2 transition-colors ${
                  isActive('/feed')
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
                href="/activities"
                className={`block px-4 py-2 transition-colors ${
                  isActive('/activities')
                    ? 'text-[#007AFF] bg-blue-50'
                    : 'text-gray-600 hover:text-[#007AFF]'
                }`}
              >
                Activities
              </Link>
              <Link
                href="/analytics"
                className={`block px-4 py-2 transition-colors ${
                  isActive('/analytics')
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