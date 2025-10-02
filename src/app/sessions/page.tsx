'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SessionHistory } from '@/components/SessionHistory';
import Header from '@/components/HeaderComponent';

export default function SessionsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Session History</h1>
            <p className="text-gray-600 mt-2">View and manage your productivity sessions</p>
          </div>
          <SessionHistory />
        </div>
      </div>
    </ProtectedRoute>
  );
}
