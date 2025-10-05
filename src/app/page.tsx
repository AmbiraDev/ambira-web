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

      <div className="max-w-[1400px] mx-auto md:px-4 md:py-6">
        <div className="md:flex gap-6">
          {/* Left Sidebar - hidden on mobile */}
          <div className="hidden md:block">
            <LeftSidebar />
          </div>

          {/* Main Feed */}
          <main className="flex-1 min-w-0 max-w-[600px] md:mx-auto">
            {/* Feed Posts */}
            <Feed filters={filters} />
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