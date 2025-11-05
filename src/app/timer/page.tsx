/**
 * Timer Route (Clean Architecture)
 *
 * This route file ONLY handles routing concerns.
 * All timer logic is delegated to SessionTimerEnhanced component.
 */

import { Metadata } from 'next';
import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import BottomNavigation from '@/components/BottomNavigation';
import TimerPageContent from './page-content';

export const metadata: Metadata = {
  title: 'Timer - Ambira',
  description: 'Track your productivity sessions with the Ambira timer',
};

export default function TimerPage() {
  return (
    <ProtectedRoute>
      {/* Skip to main content link - keyboard navigation only (hidden on mobile) */}
      <a
        href="#timer-content"
        className="sr-only md:focus:not-sr-only md:focus:absolute md:focus:top-4 md:focus:left-4 md:focus:z-50 md:focus:px-4 md:focus:py-2 md:focus:bg-white md:focus:text-[#0066CC] md:focus:rounded md:focus:shadow-lg md:focus:outline-none md:focus:ring-2 md:focus:ring-[#0066CC]"
      >
        Skip to timer
      </a>

      <div className="min-h-screen bg-white">
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
