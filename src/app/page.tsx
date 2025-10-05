'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LandingPage } from '@/components/LandingPage';
import Header from '../components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import BottomNavigation from '@/components/BottomNavigation';
import { FABMenu } from '@/components/FABMenu';
import Feed from '@/components/Feed';
import FeedCarousel from '@/components/FeedCarousel';
import DayOverview from '@/components/DayOverview';
import { useState } from 'react';
import { FeedFilters } from '@/types';

function HomeContent() {
  const { user } = useAuth();

  const filters: FeedFilters = {
    followingOnly: true
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - hidden on mobile */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile header */}
      <MobileHeader title="Feed" />

      {/* Day Overview - Mobile Only */}
      <DayOverview />

      <div className="max-w-[1400px] mx-auto md:px-4 md:py-6">
        <div className="md:flex gap-6">
          {/* Left Sidebar - hidden on mobile */}
          <div className="hidden md:block">
            <LeftSidebar />
          </div>

          {/* Main Feed */}
          <main className="flex-1 min-w-0 max-w-[600px] md:mx-auto">
            {/* Following Feed */}
            <Feed filters={filters} key="following-feed" />
            
            {/* Suggested Posts Section */}
            <div className="mt-8 pt-8 border-t-4 border-gray-200">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 md:rounded-lg border md:border-gray-200 p-4 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h2 className="text-lg font-bold text-gray-900">Suggested Posts</h2>
                </div>
                <p className="text-sm text-gray-600">Discover productive sessions from the community</p>
              </div>
              <Feed filters={{ excludeFollowing: true }} key="suggested-feed" initialLimit={20} />
            </div>
          </main>

          {/* Right Sidebar - hidden on mobile */}
          <div className="hidden md:block">
            <RightSidebar />
          </div>
        </div>

        {/* Floating Action Button Menu - only show on desktop */}
        <div className="hidden md:block">
          <FABMenu />
        </div>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Show dashboard if authenticated
  return <HomeContent />;
}