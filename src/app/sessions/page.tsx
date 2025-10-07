'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import Feed from '@/components/Feed';

export default function SessionsPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header - hidden on mobile */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Mobile header */}
        <MobileHeader title="My Sessions" />

        <div className="max-w-[600px] mx-auto px-0 md:px-4 md:py-6">
          <div className="mb-4 md:mb-6 px-4 md:px-0 pt-4 md:pt-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Sessions</h1>
            <p className="text-gray-600 mt-1 md:mt-2">View and manage your work sessions</p>
          </div>
          
          {/* Use Feed component with user filter */}
          {user && (
            <Feed 
              filters={{ type: 'user', userId: user.id }} 
              initialLimit={20}
              showEndMessage={true}
            />
          )}
        </div>

        {/* Bottom padding for mobile navigation */}
        <div className="h-20 md:hidden" />

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </ProtectedRoute>
  );
}
