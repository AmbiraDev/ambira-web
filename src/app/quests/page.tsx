'use client'

import MobileHeader from '@/components/MobileHeader'
import LeftSidebar from '@/components/LeftSidebar'
import BottomNavigation from '@/components/BottomNavigation'
import Footer from '@/components/Footer'
import { Zap } from 'lucide-react'

export default function QuestsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <MobileHeader title="Quests" showNotifications={true} showProfilePicture={false} />

      {/* Main Content Area */}
      <div className="flex-1">
        <div className="flex justify-center">
          {/* Left Sidebar - Fixed, hidden on mobile */}
          <div className="hidden lg:block flex-shrink-0">
            <LeftSidebar />
          </div>

          {/* Content Area - with left margin on desktop for fixed sidebar */}
          <div className="flex-1 lg:ml-[256px]">
            <div className="w-full max-w-[1400px] mx-auto pt-6 pb-4 md:py-8 min-h-[calc(100vh-3.5rem)]">
              {/* Page Header */}
              <div className="flex items-center justify-between mb-6 px-6 md:px-8">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">Quests</h1>
                </div>
              </div>

              {/* Empty State */}
              <div className="text-center py-12 px-6 md:px-8">
                <div className="max-w-md mx-auto">
                  <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
                  <p className="text-gray-600">
                    Quests will be available here. Stay tuned for updates!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 lg:hidden" />

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />

      {/* Footer */}
      <Footer />
    </div>
  )
}
