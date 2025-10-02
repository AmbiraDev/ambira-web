'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FeedLayout from '@/components/FeedLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

const FeedPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <FeedPageContent />
    </ProtectedRoute>
  );
};

const FeedPageContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
              <p className="text-sm text-gray-600">
                Discover productive sessions from the community
              </p>
            </div>
            
            {/* Feed Filters */}
            <div className="flex items-center space-x-4">
              <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="following">Following</option>
                <option value="trending">Trending</option>
                <option value="recent">Recent</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <FeedLayout />
    </div>
  );
};

export default FeedPage;
