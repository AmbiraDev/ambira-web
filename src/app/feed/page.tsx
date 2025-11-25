/**
 * Feed Route (Clean Architecture)
 *
 * This route file ONLY handles routing concerns.
 * All business logic is delegated to the FeedPageContent component.
 */

'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import Header from '@/components/HeaderComponent'
import MobileHeader from '@/components/MobileHeader'
import BottomNavigation from '@/components/BottomNavigation'
import FeedPageContent from './page-content'

export default function FeedPage() {
  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* Fixed Header - hidden on mobile */}
        <div className="hidden md:block flex-shrink-0">
          <Header />
        </div>

        {/* Mobile header */}
        <MobileHeader title="Feed" showNotifications={true} />

        {/* Feed Content */}
        <FeedPageContent />

        {/* Bottom padding for mobile navigation */}
        <div className="h-20 md:hidden" />

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </ProtectedRoute>
  )
}
