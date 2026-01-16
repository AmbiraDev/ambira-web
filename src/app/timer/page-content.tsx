'use client'

import React from 'react'
import { SessionTimerEnhanced } from '@/components/SessionTimerEnhanced'
import MobileHeader from '@/components/MobileHeader'
import LeftSidebar from '@/components/LeftSidebar'
import BottomNavigation from '@/components/BottomNavigation'

export default function TimerPageContent() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Mobile header - only visible on mobile */}
      <MobileHeader title="Timer" />

      {/* Main Content Area - No top header on desktop (Duolingo style) */}
      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto lg:px-6 lg:py-0">
          <div className="flex lg:gap-8 justify-center">
            {/* Left Sidebar - Fixed, hidden on mobile (includes logo like Duolingo) */}
            <div className="hidden lg:block flex-shrink-0">
              <LeftSidebar />
            </div>

            {/* Timer Content */}
            <main
              id="timer-content"
              role="main"
              className="flex-1 min-w-0 max-w-[600px] mx-auto lg:pt-6 px-4"
            >
              <SessionTimerEnhanced projectId="" />
            </main>
          </div>
        </div>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
