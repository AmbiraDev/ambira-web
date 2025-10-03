'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LandingPage } from '@/components/LandingPage';
import Header from '../components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import BottomNavigation from '@/components/BottomNavigation';
import { FABMenu } from '@/components/FABMenu';
import { Users } from 'lucide-react';

function HomeContent() {
  const { user } = useAuth();

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
            {/* Feed Filter */}
            <div className="mb-4 px-4 md:px-0 pt-4 md:pt-0">
              <select className="w-full md:w-48 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]">
                <option>Following</option>
                <option>All Activity</option>
                <option>My Activities</option>
              </select>
            </div>

            {/* Feed Posts */}
            <div className="bg-white border-gray-200 md:border md:rounded-lg p-6 md:p-8 text-center mx-4 md:mx-0 rounded-lg border">
              <div className="text-gray-500 mb-4">
                <Users className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No activity yet</h3>
              <p className="text-gray-600 mb-6 text-sm md:text-base">
                Follow some users to see their productivity activities in your feed.
              </p>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                <Users className="w-5 h-5 mr-2" strokeWidth={2} />
                Discover Users
              </button>
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