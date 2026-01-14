/**
 * Feed Page Content Component (Clean Architecture)
 *
 * This component handles all feed presentation logic.
 * It has been extracted from the route file to separate concerns.
 */

'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import LeftSidebar from '@/components/LeftSidebar'
import RightSidebar from '@/components/RightSidebar'
import BottomNavigation from '@/components/BottomNavigation'
import Footer from '@/components/Footer'
import Feed from '@/features/feed/components/Feed'
import { FeedFilterDropdown, FeedFilterOption } from '@/features/feed/components/FeedFilterDropdown'
import { StreakCard } from '@/features/streaks/components/StreakCard'
import React, { useState, Suspense } from 'react'

export function FeedPageContent() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const [selectedFilter, setSelectedFilter] = useState<FeedFilterOption>({
    type: 'following',
    label: 'Following',
  })

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#58CC02]"></div>
          <p className="text-[#AFAFAF] font-bold">Loading...</p>
        </div>
      </div>
    )
  }

  // Show feed for authenticated users
  if (!isAuthenticated) {
    // Redirect to landing page
    router.push('/about')
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Mobile header - only visible on mobile */}
      <MobileHeader title="Home" showNotifications={true} />

      {/* Main Content Area - No top header on desktop (Duolingo style) */}
      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto lg:px-6 lg:py-0">
          <div className="flex lg:gap-8 justify-center">
            {/* Left Sidebar - Fixed, hidden on mobile (includes logo like Duolingo) */}
            <div className="hidden lg:block flex-shrink-0">
              <LeftSidebar />
            </div>

            {/* Main Feed - Scrollable Container */}
            <main
              id="main-feed"
              role="main"
              className="flex-1 min-w-0 max-w-[600px] mx-auto lg:pt-6"
            >
              {/* Filter Dropdown - Desktop only */}
              <div className="hidden md:block px-4 md:px-0 pt-3 pb-2 sticky top-0 z-10 bg-white">
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
              <Suspense
                fallback={
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-4 animate-pulse"
                      >
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-[#E5E5E5] rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-[#E5E5E5] rounded w-32"></div>
                            <div className="h-3 bg-[#E5E5E5] rounded w-24"></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-4 bg-[#E5E5E5] rounded w-full"></div>
                          <div className="h-4 bg-[#E5E5E5] rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              >
                {/* Mobile: Always show following + group members */}
                <div className="md:hidden">
                  <>
                    <Feed
                      filters={{ type: 'following' }}
                      key="following-feed"
                      showEndMessage={false}
                      showGroupInfo={true}
                    />

                    {/* Group Members Section */}
                    <div className="mt-0">
                      <div className="bg-white border-b-2 border-[#E5E5E5] p-4 mb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#CE82FF] to-[#A855F7] flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </div>
                          <h2 className="text-base font-extrabold text-[#3C3C3C]">
                            From Your Groups
                          </h2>
                        </div>
                        <p className="text-sm text-[#AFAFAF] font-semibold">
                          Sessions from members in your groups
                        </p>
                      </div>
                      <Feed
                        filters={{ type: 'group-members-unfollowed' }}
                        key="group-members-feed"
                        initialLimit={20}
                        showEndMessage={true}
                        showGroupInfo={true}
                      />
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
                      <Feed
                        filters={{ type: 'following' }}
                        key="following-feed"
                        showEndMessage={false}
                      />

                      {/* Suggested Posts Section */}
                      <div className="mt-0">
                        <div className="bg-white md:rounded-2xl border-2 md:border-[#E5E5E5] p-4 mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#1CB0F6] to-[#0088CC] flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                            </div>
                            <h2 className="text-base font-extrabold text-[#3C3C3C]">
                              Suggested Posts
                            </h2>
                          </div>
                          <p className="text-sm text-[#AFAFAF] font-semibold">
                            Discover productive sessions from the community
                          </p>
                        </div>
                        <Feed
                          filters={{ type: 'recent' }}
                          key="suggested-feed"
                          initialLimit={10}
                          showEndMessage={true}
                        />
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
                      filters={{
                        type: 'group',
                        groupId: selectedFilter.groupId,
                      }}
                      key={`group-feed-${selectedFilter.groupId}`}
                      showEndMessage={true}
                    />
                  )}
                </div>
              </Suspense>
            </main>

            {/* Right Sidebar - Fixed, hidden on mobile */}
            <div className="hidden xl:block flex-shrink-0">
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>

      {/* Footer - hidden on mobile */}
      <Footer />

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
