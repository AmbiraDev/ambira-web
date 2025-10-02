'use client';

import React from 'react';
import { GlobalTasks } from '@/components/GlobalTasks';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto p-6">
          <GlobalTasks />
        </div>
      </div>
    </ProtectedRoute>
  );
}
