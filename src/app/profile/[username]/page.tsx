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

'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import ProfilePageContent from './page-content';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage(props: ProfilePageProps) {
  const params = await props.params;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white md:bg-gray-50">
        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden">
          <MobileHeader title="Profile" />
        </div>

        {/* Profile Content */}
        <ProfilePageContent username={params.username} />

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <BottomNavigation />
        </div>
      </div>
    </ProtectedRoute>
  );
}
