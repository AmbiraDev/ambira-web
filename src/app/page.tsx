'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '../components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import BottomNavigation from '@/components/BottomNavigation';
import Feed from '@/components/Feed';
import { FeedFilterDropdown, FeedFilterOption } from '@/components/FeedFilterDropdown';
import { StreakCard } from '@/components/StreakCard';
import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<FeedFilterOption>({
    type: 'following',
    label: 'Following'
  });

  console.log('[Home Page] Auth State:', { isAuthenticated, isLoading });

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

  // Show feed for authenticated users
  if (isAuthenticated) {
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
                {/* Filter Dropdown - Desktop only */}
                <div className="hidden md:block px-4 md:px-0 pt-3 pb-2 sticky top-0 z-10 bg-gray-50">
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

                {/* Feed based on selected filter (Desktop) or mobile-specific feed */}
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
                  {/* Mobile: Always show following + group members */}
                  <div className="md:hidden">
                    <>
                      <Feed filters={{ type: 'following' }} key="following-feed" showEndMessage={false} showGroupInfo={true} />

                      {/* Group Members Section */}
                      <div className="mt-0">
                        <div className="bg-white border-b-[6px] border-gray-200 p-4 mb-0">
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h2 className="text-base font-semibold text-gray-900">From Your Groups</h2>
                          </div>
                          <p className="text-sm text-gray-500">Sessions from members in your groups</p>
                        </div>
                        <Feed filters={{ type: 'group-members-unfollowed' }} key="group-members-feed" initialLimit={20} showEndMessage={true} showGroupInfo={true} />
                      </div>
                    </>
                  </div>

                  {/* Desktop: Show based on selected filter */}
                  <div className="hidden md:block">
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
                  </div>
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

  // Show landing page if not authenticated
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Make productivity <span className="text-[#007AFF]">social.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Studying shouldn't be done alone. Join your friends, share your progress, and achieve better results together.
          </p>
          <Link
            href="/auth"
            className="inline-block px-8 py-4 bg-[#34C759] text-white font-semibold rounded-lg hover:bg-[#2fb34d] transition-colors text-lg shadow-sm"
          >
            Sign Up Free
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-12 space-y-24 md:space-y-32">
        {/* Feature 1: Share Your Sessions */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
          <div className="flex-1 space-y-4 md:pt-12 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Share Your Work</h2>
            <p className="text-lg md:text-xl text-gray-600">
              Track your study and work sessions, then share them with friends. Get encouragement and support as you make progress on your goals.
            </p>
          </div>
          <div className="flex-1">
            <div className="rounded-xl overflow-hidden border border-gray-300 shadow-sm">
              <Image
                src="/session-post-placeholder.png"
                alt="Example of a session post in the feed"
                width={800}
                height={779}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Feature 2: Join Groups */}
        <div className="flex flex-col md:flex-row-reverse items-center md:items-start gap-12">
          <div className="flex-1 space-y-4 md:pt-12 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Study With Groups</h2>
            <p className="text-lg md:text-xl text-gray-600">
              Better results happen with groups. Join communities of students and professionals working toward similar goals, and stay accountable together.
            </p>
          </div>
          <div className="flex-1">
            <div className="rounded-xl overflow-hidden border border-gray-300 shadow-sm">
              <Image
                src="/groups-placeholder.png"
                alt="Example of a group page with challenges"
                width={1000}
                height={630}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Feature 3: Analytics */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
          <div className="flex-1 space-y-4 md:pt-12 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Understand Your Habits</h2>
            <p className="text-lg md:text-xl text-gray-600">
              See detailed insights into your productivity patterns. Track your progress over time and discover when you work best.
            </p>
          </div>
          <div className="flex-1">
            <div className="rounded-xl overflow-hidden border border-gray-300 shadow-sm">
              <Image
                src="/analytics-placeholder.png"
                alt="Example of analytics dashboard with charts"
                width={800}
                height={676}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Ready to work together?</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <Link
            href="/auth"
            className="inline-block px-8 py-4 bg-[#34C759] text-white font-semibold rounded-lg hover:bg-[#2fb34d] transition-colors text-lg shadow-sm"
          >
            Sign Up Free
          </Link>
          <a
            href="https://discord.gg/wFMeNmCpdQ"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#5865F2] text-white font-semibold rounded-lg hover:bg-[#4752C4] transition-colors text-lg shadow-sm"
          >
            <svg width="24" height="24" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="currentColor"/>
            </svg>
            <span>Join Community</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500">
          <p>&copy; 2025 Ambira. Make productivity social.</p>
        </div>
      </footer>
    </div>
  );
}