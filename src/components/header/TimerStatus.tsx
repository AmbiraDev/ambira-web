'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Timer, Edit3 } from 'lucide-react'
import { useTimer } from '@/features/timer/hooks'
import type { TimerStatusProps } from './header.types'
import { TIMING, CLASS_NAMES, ROUTES } from './header.constants'
import { shouldShowHeaderTimer, isOnTimerPage } from './header.utils'

/**
 * TimerStatus Component
 *
 * Manages timer-related UI in the header:
 * - Shows "Start Session" and "Log Manual" buttons when no active session
 * - Shows active session indicator with live timer when session is running
 * - Hides timer display when on the timer page (to avoid duplication)
 *
 * Follows Single Responsibility Principle by managing only timer status UI.
 *
 * @example
 * ```tsx
 * <TimerStatus pathname="/feed" />
 * ```
 */
export default function TimerStatus({ pathname }: TimerStatusProps) {
  const { timerState, getElapsedTime, getFormattedTime } = useTimer()
  const [headerTimer, setHeaderTimer] = useState<string>('')

  const hasActiveSession = !!(
    timerState.currentProject &&
    (timerState.isRunning || timerState.pausedDuration > 0)
  )

  // Update header timer display when there is an active/paused session
  // and we are not on the timer page
  useEffect(() => {
    if (!shouldShowHeaderTimer(hasActiveSession, pathname)) {
      setHeaderTimer('')
      return
    }

    const updateTimer = () => {
      const seconds = getElapsedTime()
      setHeaderTimer(getFormattedTime(seconds))
    }

    updateTimer()
    const interval = setInterval(updateTimer, TIMING.TIMER_UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [
    pathname,
    hasActiveSession,
    timerState.isRunning,
    timerState.pausedDuration,
    getElapsedTime,
    getFormattedTime,
  ])

  // Show active session indicator
  if (hasActiveSession) {
    const displayText = isOnTimerPage(pathname) ? 'Active' : headerTimer || 'Active'

    return (
      <Link
        href={ROUTES.TIMER}
        className="hidden md:flex items-center space-x-2 px-4 py-3 bg-[#58CC02] text-white text-sm font-bold rounded-2xl hover:brightness-105 transition-all border-2 border-b-4 border-[#45A000] active:border-b-2 active:translate-y-[2px]"
        aria-label="View active session"
      >
        <div
          className="w-2 h-2 rounded-full bg-white/60 flex-shrink-0 animate-pulse"
          aria-hidden="true"
        />
        <span className="w-[60px] text-center">{displayText}</span>
      </Link>
    )
  }

  // Show session action buttons when no active session
  return (
    <>
      {/* Start Session Button */}
      <Link href={ROUTES.TIMER} className={cn(CLASS_NAMES.BUTTON_PRIMARY, 'hidden md:flex')}>
        <Timer className="w-4 h-4" strokeWidth={2.5} />
        <span>Start Session</span>
      </Link>

      {/* Manual Session Button */}
      <Link
        href={ROUTES.RECORD_MANUAL}
        className={cn(CLASS_NAMES.BUTTON_SECONDARY, 'hidden md:flex')}
      >
        <Edit3 className="w-4 h-4" strokeWidth={2.5} />
        <span>Log Manual</span>
      </Link>
    </>
  )
}

/**
 * Utility function to combine class names
 * Moved here to avoid circular dependencies
 */
function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
