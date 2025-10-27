/**
 * Timer Route (Clean Architecture)
 *
 * This route file ONLY handles routing concerns.
 * All timer logic is delegated to SessionTimerEnhanced component.
 */

'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import BottomNavigation from '@/components/BottomNavigation';
import TimerPageContent from './page-content';

export default function TimerPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        {/* Skip to main content link for keyboard navigation */}
        <a
          href="#timer-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-[#007AFF] focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
        >
          Skip to timer
        </a>

        {/* Header - hidden on mobile */}
        <header className="hidden md:block">
          <Header />
        </header>

        {/* Timer Content */}
        <TimerPageContent />

        {/* Bottom Navigation - only on desktop */}
        <div className="hidden md:block">
          <BottomNavigation />
        </div>
      </div>
    </ProtectedRoute>
  );
}
