'use client';

import React from 'react';
import { GlobalTasks } from '@/components/GlobalTasks';

export default function TasksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <GlobalTasks />
      </div>
    </div>
  );
}
