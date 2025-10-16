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
import { FeedFilterDropdown, FeedFilterOption } from '@/components/FeedFilterDropdown';
import { StreakCard } from '@/components/StreakCard';
import { useState, Suspense } from 'react';
import { FeedFilters } from '@/types';

function HomeContent() {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<FeedFilterOption>({
    type: 'all',
    label: 'All'
  });

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Fixed Header - hidden on mobile */}
      <div className="hidden md:block flex-shrink-0">
        <Header />
      </div>

      {/* Mobile header */}
      <MobileHeader title="Feed" showNotifications={true} />

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-[1400px] mx-auto md:px-4 md:py-6">
          <div className="h-full md:flex gap-4 justify-center">
            {/* Left Sidebar - Fixed, hidden on mobile */}
            <div className="hidden md:block flex-shrink-0">
              <LeftSidebar />
            </div>

            {/* Main Feed - Scrollable Container */}
            <main className="flex-1 min-w-0 max-w-[600px] mx-auto h-full overflow-y-auto scrollbar-hide">
              {/* Filter Dropdown */}
              <div className="px-4 md:px-0 pt-3 pb-2 sticky top-0 z-10 bg-gray-50">
                <FeedFilterDropdown
                  selectedFilter={selectedFilter}
                  onFilterChange={(filter) => setSelectedFilter(filter)}
                />
              </div>

              {/* Streak Card - Mobile Only */}
              {user && (
                <div className="md:hidden px-4 mb-4">
                  <StreakCard userId={user.id} variant="compact" showProgress={false} />
                </div>
              )}

              {/* Feed based on selected filter */}
              <Suspense fallback={
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-32"></div>
                          <div className="h-3 bg-gray-300 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-300 rounded w-full"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              }>
                {selectedFilter.type === 'all' && (
                  <Feed filters={{ type: 'all' }} key="all-feed" showEndMessage={true} />
                )}

                {selectedFilter.type === 'following' && (
                  <>
                    <Feed filters={{ type: 'following' }} key="following-feed" showEndMessage={false} />

                    {/* Suggested Posts Section */}
                    <div className="mt-0">
                      <div className="bg-white md:rounded-lg border md:border-gray-200 p-4 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <h2 className="text-base font-semibold text-gray-900">Suggested Posts</h2>
                        </div>
                        <p className="text-sm text-gray-500">Discover productive sessions from the community</p>
                      </div>
                      <Feed filters={{ type: 'recent' }} key="suggested-feed" initialLimit={10} showEndMessage={true} />
                    </div>
                  </>
                )}

                {selectedFilter.type === 'user' && (
                  <Feed
                    filters={{ type: 'user', userId: user?.id }}
                    key={`user-feed-${user?.id}`}
                    showEndMessage={true}
                  />
                )}

                {selectedFilter.type === 'group' && selectedFilter.groupId && (
                  <Feed
                    filters={{ type: 'group', groupId: selectedFilter.groupId }}
                    key={`group-feed-${selectedFilter.groupId}`}
                    showEndMessage={true}
                  />
                )}
              </Suspense>
            </main>

            {/* Right Sidebar - Fixed, hidden on mobile */}
            <div className="hidden md:block flex-shrink-0">
              <RightSidebar />
            </div>
          </div>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show dashboard if authenticated
  if (isAuthenticated) {
    return <HomeContent />;
  }

  // Show landing page if not authenticated
  return <LandingPage />;
}