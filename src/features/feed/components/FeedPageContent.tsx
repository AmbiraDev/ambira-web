/**
 * Feed Page Content Component (Clean Architecture)
 *
 * This component handles all feed presentation logic.
 * It has been extracted from the route file to separate concerns.
 */

'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import MobileFeedHeader from '@/components/MobileFeedHeader'
import LeftSidebar from '@/components/LeftSidebar'
import RightSidebar from '@/components/RightSidebar'
import BottomNavigation from '@/components/BottomNavigation'
import Footer from '@/components/Footer'
import Feed from '@/features/feed/components/Feed'
import React, { Suspense } from 'react'

export function FeedPageContent() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

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
      {/* Mobile Duolingo-style header - only visible on mobile */}
      <MobileFeedHeader />

      {/* Main Content Area - No top header on desktop (Duolingo style) */}
      <div className="flex-1 lg:ml-[256px]">
        <div className="max-w-[1100px] mx-auto lg:px-6 lg:py-0">
          {/* Left Sidebar - Fixed position, hidden on mobile */}
          <LeftSidebar />

          <div className="flex lg:gap-8 justify-center">
            {/* Main Feed - Scrollable Container */}
            <main
              id="main-feed"
              role="main"
              className="flex-1 min-w-0 w-full px-7 lg:px-0 lg:max-w-[600px] lg:mx-auto lg:pt-6"
            >
              {/* Feed */}
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
                <Feed
                  filters={{ type: 'following' }}
                  key="following-feed"
                  showEndMessage={true}
                  showGroupInfo={true}
                />
              </Suspense>
            </main>

            {/* Right Sidebar - Fixed, hidden on mobile */}
            <div className="hidden xl:block flex-shrink-0">
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>

      {/* Footer - hidden when bottom nav is visible */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-36 lg:hidden" />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
