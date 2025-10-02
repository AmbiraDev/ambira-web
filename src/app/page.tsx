'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '../components/HeaderComponent';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import FeedPost from '@/components/FeedPost';

function HomeContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {/* Welcome message with logout button */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600">Ready to track your productivity?</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar */}
          <LeftSidebar />
          
          {/* Main Feed */}
          <main className="flex-1 min-w-0 max-w-[600px]">
            {/* Feed Filter */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <select className="w-full text-sm text-gray-700 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent">
                <option>Following</option>
                <option>All Activity</option>
                <option>My Activities</option>
              </select>
            </div>

            {/* Feed Posts */}
            <FeedPost
              author="Sarah Chen"
              authorInitials="SC"
              authorColor="bg-purple-400"
              timestamp="Today at 11:45 AM"
              title="Morning Study Session"
              description="Crushed my algorithm practice today!"
              time="2h 30m"
              metric1="Tasks Completed"
              metric1Value="8 tasks"
              metric2="Focus Score"
              metric2Value="9/10"
              kudosCount={12}
              commentCount={3}
            />

            <FeedPost
              author="Alex Rodriguez"
              authorInitials="AR"
              authorColor="bg-green-400"
              timestamp="Yesterday at 3:20 PM"
              title="Project Planning Deep Work"
              description="Finally mapped out the entire feature roadmap"
              time="1h 45m"
              metric1="Pages Written"
              metric1Value="12 pages"
              metric2="Ideas Generated"
              metric2Value="23 ideas"
              kudosCount={8}
              commentCount={1}
            />

            <FeedPost
              author="Emma Thompson"
              authorInitials="ET"
              authorColor="bg-blue-400"
              timestamp="Yesterday at 9:15 PM"
              title="Evening Code Review"
              description="Refactored the authentication module - much cleaner now! 🚀"
              time="1h 20m"
              metric1="Files Reviewed"
              metric1Value="15 files"
              metric2="Bugs Fixed"
              metric2Value="3 bugs"
              kudosCount={18}
              commentCount={5}
            />
          </main>
          
          {/* Right Sidebar */}
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}