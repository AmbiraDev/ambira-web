'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTimer } from '@/features/timer/hooks'
import { BookOpen, Play, Users, User, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

// Nav items with Duolingo-style colors matching the sidebar
// Order: 2 left, Start center, 2 right
const leftNavItems = [
  { href: '/', label: 'Feed', icon: BookOpen, color: '#58CC02' },
  { href: '/quests', label: 'Quests', icon: Zap, color: '#FF9600' },
]

const rightNavItems = [
  { href: '/groups', label: 'Groups', icon: Users, color: '#CE82FF' },
  { href: '/profile', label: 'Profile', icon: User, color: '#FF4B4B' },
]

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
    if (path === '/quests') return pathname.startsWith('/quests')
    if (path === '/groups') return pathname.startsWith('/groups')
    if (path === '/profile') {
      return (
        pathname === '/profile' ||
        pathname.startsWith('/you') ||
        (user?.username && pathname === `/profile/${user.username}`)
      )
    }
    if (path === '/timer') return pathname.startsWith('/timer')
    return pathname === path
  }

  const hasActiveSession =
    timerState.currentProject && (timerState.isRunning || timerState.pausedDuration > 0)

  const renderNavItem = (item: (typeof leftNavItems)[0]) => {
    const Icon = item.icon
    const active = isActive(item.href)

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex flex-col items-center justify-center gap-2 px-5 py-3 rounded-2xl transition-all ${
          active ? 'bg-[#DDF4FF]' : ''
        }`}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
      >
        <Icon
          className="w-12 h-12"
          style={{ color: item.color }}
          fill={item.color}
          aria-hidden="true"
        />
        <span className={`text-lg font-bold ${active ? 'text-[#1CB0F6]' : 'text-[#4B4B4B]'}`}>
          {item.label}
        </span>
      </Link>
    )
  }

  const timerActive = isActive('/timer')

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[#E5E5E5] lg:hidden transition-transform duration-200 ${isKeyboardOpen ? 'translate-y-full' : 'translate-y-0'}`}
    >
      <div
        className="flex items-end justify-around h-36 px-4 pb-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {/* Left nav items */}
        {leftNavItems.map(renderNavItem)}

        {/* Center Start button - larger and elevated */}
        <Link
          href="/timer"
          className="flex flex-col items-center justify-center gap-2 -mt-8"
          aria-label={hasActiveSession ? 'View active session' : 'Start session'}
          aria-current={timerActive ? 'page' : undefined}
        >
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg ${
              hasActiveSession
                ? 'bg-[#58CC02] border-4 border-[#45A000]'
                : timerActive
                  ? 'bg-[#58CC02] border-4 border-[#45A000]'
                  : 'bg-[#58CC02] border-4 border-b-[6px] border-[#45A000]'
            }`}
          >
            <Play className="w-12 h-12 text-white ml-1" fill="white" aria-hidden="true" />
          </div>
          <span
            className={`text-lg font-bold ${
              hasActiveSession || timerActive ? 'text-[#58CC02]' : 'text-[#4B4B4B]'
            }`}
          >
            {hasActiveSession ? 'Active' : 'Start'}
          </span>
        </Link>

        {/* Right nav items */}
        {rightNavItems.map(renderNavItem)}
      </div>
    </nav>
  )
}
