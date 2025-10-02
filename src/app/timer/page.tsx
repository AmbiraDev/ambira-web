'use client';

import React from 'react';
import { SessionTimerEnhanced } from '@/components/SessionTimerEnhanced';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';

export default function TimerPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="px-8 py-6">
          <SessionTimerEnhanced projectId="" />
        </div>
      </div>
    </ProtectedRoute>
  );
}
