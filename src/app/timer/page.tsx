'use client';

import React from 'react';
import { SessionTimerEnhanced } from '@/components/SessionTimerEnhanced';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import BottomNavigation from '@/components/BottomNavigation';
import { SaveSession } from '@/components/SaveSession';

export default function TimerPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header - hidden on mobile */}
        <div className="hidden md:block">
          <Header />
        </div>

        <div className="px-0 md:px-8 md:py-6 md:pt-24">
          <SessionTimerEnhanced projectId="" />
        </div>

        {/* Bottom padding for mobile navigation - only on desktop */}
        <div className="h-20 hidden md:block" />

        {/* Bottom Navigation - only on desktop */}
        <div className="hidden md:block">
          <BottomNavigation />
        </div>
      </div>
    </ProtectedRoute>
  );
}
