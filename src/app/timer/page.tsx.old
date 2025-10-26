'use client';

import React from 'react';
import { SessionTimerEnhanced } from '@/components/SessionTimerEnhanced';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import BottomNavigation from '@/components/BottomNavigation';

export default function TimerPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        {/* Header - hidden on mobile */}
        <div className="hidden md:block">
          <Header />
        </div>

        <div className="md:pt-20">
          <SessionTimerEnhanced projectId="" />
        </div>

        {/* Bottom Navigation - only on desktop */}
        <div className="hidden md:block">
          <BottomNavigation />
        </div>
      </div>
    </ProtectedRoute>
  );
}
