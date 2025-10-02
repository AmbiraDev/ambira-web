'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LandingPage } from '@/components/LandingPage';
import Header from '../components/HeaderComponent';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import FeedPost from '@/components/FeedPost';
import { FABMenu } from '@/components/FABMenu';
import { Users } from 'lucide-react';

function HomeContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <LeftSidebar />
          
          {/* Main Feed */}
          <main className="flex-1 min-w-0 max-w-[600px]">
            {/* Feed Filter */}
            <div className="mb-4">
              <select className="w-full text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]">
                <option>Following</option>
                <option>All Activity</option>
                <option>My Activities</option>
              </select>
            </div>

            {/* Feed Posts */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-gray-500 mb-4">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No activity yet</h3>
              <p className="text-gray-600 mb-6">
                Follow some users to see their productivity activities in your feed.
              </p>
              <button className="inline-flex items-center px-4 py-2 bg-[#007AFF] text-white text-sm font-medium rounded-lg hover:bg-[#0056D6] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2 transition-colors">
                <Users className="w-5 h-5 mr-2" strokeWidth={2} />
                Discover Users
              </button>
            </div>
          </main>
          
          {/* Right Sidebar */}
          <RightSidebar />
        </div>
        
        {/* Floating Action Button Menu */}
        <FABMenu />
      </div>
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