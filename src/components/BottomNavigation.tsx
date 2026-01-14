'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTimer } from '@/features/timer/hooks'
import { Home, Play, Users, User } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function BottomNavigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { timerState } = useTimer()
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  // Detect keyboard open/close on mobile by monitoring viewport height changes
  useEffect(() => {
    // Only run on mobile devices
    if (typeof window === 'undefined' || window.innerWidth > 768) {
      return
    }

    const initialHeight = window.visualViewport?.height || window.innerHeight

    const handleResize = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight

      // If viewport height decreased by more than 150px, keyboard is likely open
      // This threshold helps avoid false positives from browser chrome changes
      setIsKeyboardOpen(initialHeight - currentHeight > 150)
    }

    // Use visualViewport if available (better for keyboard detection)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
    } else {
      window.addEventListener('resize', handleResize)
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
      } else {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    if (path === '/search') return pathname.startsWith('/search')
    if (path === '/groups') return pathname.startsWith('/groups')
    if (path === '/you') {
      // Highlight "You" tab when on /you or on the user's own profile
      return (
        pathname.startsWith('/you') ||
        pathname === '/profile' ||
        (user?.username && pathname === `/profile/${user.username}`)
      )
    }
    return pathname === path
  }

  const hasActiveSession =
    timerState.currentProject && (timerState.isRunning || timerState.pausedDuration > 0)

  return (
    <>
      <nav
        role="navigation"
        aria-label="Main navigation"
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[#E5E5E5] md:hidden transition-transform duration-200 ${isKeyboardOpen ? 'translate-y-full' : 'translate-y-0'}`}
      >
        <div
          className="flex items-center justify-around h-[6.5rem] px-2 pb-8 pt-1.5"
          style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
        >
          {/* Feed */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center space-y-1 px-4 py-1 transition-colors ${
              isActive('/') ? 'text-[#58CC02]' : 'text-[#AFAFAF]'
            }`}
            aria-label="View feed"
            aria-current={isActive('/') ? 'page' : undefined}
          >
            <Home className="w-8 h-8" strokeWidth={isActive('/') ? 2.5 : 2} aria-hidden="true" />
            <span className="text-sm font-bold">Home</span>
          </Link>

          {/* Record Button */}
          <Link
            href="/timer"
            className={`flex flex-col items-center justify-center px-4 py-1 transition-colors ${
              hasActiveSession ? '' : isActive('/timer') ? 'text-[#58CC02]' : 'text-[#AFAFAF]'
            }`}
            aria-label={hasActiveSession ? 'View active session' : 'Start session timer'}
            aria-current={isActive('/timer') ? 'page' : undefined}
          >
            <div
              className={`flex flex-col items-center justify-center space-y-1 ${hasActiveSession ? 'bg-[#58CC02] rounded-2xl px-4 py-2 text-white border-2 border-b-4 border-[#45A000]' : ''}`}
            >
              <Play
                className="w-8 h-8"
                strokeWidth={hasActiveSession || isActive('/timer') ? 2.5 : 2}
                fill={hasActiveSession || isActive('/timer') ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
              <span className="text-sm font-bold">{hasActiveSession ? 'Active' : 'Record'}</span>
            </div>
          </Link>

          {/* Groups */}
          <Link
            href="/groups"
            className={`flex flex-col items-center justify-center space-y-1 px-4 py-1 transition-colors ${
              isActive('/groups') ? 'text-[#58CC02]' : 'text-[#AFAFAF]'
            }`}
            aria-label="View groups"
            aria-current={isActive('/groups') ? 'page' : undefined}
          >
            <Users
              className="w-8 h-8"
              strokeWidth={isActive('/groups') ? 2.5 : 2}
              aria-hidden="true"
            />
            <span className="text-sm font-bold">Groups</span>
          </Link>

          {/* You */}
          <Link
            href="/you"
            className={`flex flex-col items-center justify-center space-y-1 px-4 py-1 transition-colors ${
              isActive('/you') ? 'text-[#58CC02]' : 'text-[#AFAFAF]'
            }`}
            aria-label="View your profile and progress"
            aria-current={isActive('/you') ? 'page' : undefined}
          >
            <User className="w-8 h-8" strokeWidth={isActive('/you') ? 2.5 : 2} aria-hidden="true" />
            <span className="text-sm font-bold">You</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
