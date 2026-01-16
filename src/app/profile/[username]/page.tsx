/**
 * Profile Route (Clean Architecture)
 *
 * This route file ONLY handles routing concerns.
 * All business logic is delegated to the ProfilePageContent component.
 *
 * NOTE: The ProfilePageContent still contains all the original logic from the 1087-line file.
 * Future migration steps could include:
 * 1. Extract chart calculation logic to use ProfileStatsCalculator
 * 2. Extract data fetching to use ProfileService
 * 3. Create smaller presentation components
 * 4. Move everything to features/profile/components/
 *
 * For now, we've separated routing from presentation.
 */

import { ProtectedRoute } from '@/components/ProtectedRoute'
import MobileHeader from '@/components/MobileHeader'
import LeftSidebar from '@/components/LeftSidebar'
import BottomNavigation from '@/components/BottomNavigation'
import ProfilePageContent from './page-content'

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function ProfilePage(props: ProfilePageProps) {
  const params = await props.params

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-white md:bg-gray-50">
        {/* Mobile Header */}
        <MobileHeader title="Profile" />

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="flex justify-center">
            {/* Left Sidebar - Fixed, hidden on mobile */}
            <div className="hidden lg:block flex-shrink-0">
              <LeftSidebar />
            </div>

            {/* Profile Content - with left margin on desktop to account for fixed sidebar */}
            <div className="flex-1 lg:ml-[256px]">
              <ProfilePageContent username={params.username} />
            </div>
          </div>
        </div>

        {/* Bottom padding for mobile navigation */}
        <div className="h-20 lg:hidden" />

        {/* Mobile Bottom Navigation */}
        <BottomNavigation />
      </div>
    </ProtectedRoute>
  )
}
