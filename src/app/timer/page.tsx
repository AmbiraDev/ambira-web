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
        <div className="max-w-4xl mx-auto p-6">
          <SessionTimerEnhanced projectId="" />
        </div>
      </div>
    </ProtectedRoute>
  );
}
