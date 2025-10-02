'use client';

import React from 'react';
import { SessionTimer } from '@/components/SessionTimer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';

export default function TimerPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <SessionTimer />
      </div>
    </ProtectedRoute>
  );
}
