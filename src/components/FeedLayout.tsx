'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseApi } from '@/lib/firebaseApi';
import { UserStats, SuggestedUser, FeedFilters } from '@/types';
import Feed from './Feed';
import SuggestedUsers from './SuggestedUsers';

type FeedType = 'recent' | 'following' | 'trending';

interface FeedLayoutProps {
  className?: string;
}

export const FeedLayout: React.FC<FeedLayoutProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [feedType, setFeedType] = useState<FeedType>('recent');
  const [filters, setFilters] = useState<FeedFilters>({ type: 'recent' });

  const handleFeedTypeChange = (type: FeedType) => {
    setFeedType(type);
    setFilters({ type });
  };

  // Load user stats and suggestions
  React.useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const [stats, suggestions] = await Promise.all([
          firebaseApi.user.getUserStats(user.id),
          firebaseApi.user.getSuggestedUsers(5)
        ]);
        
        setUserStats(stats);
        setSuggestedUsers(suggestions);
      } catch (error) {
        console.error('Failed to load feed data:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadData();
  }, [user]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Personal Stats */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <div className="sticky top-6 space-y-6">
            {/* Personal Stats Widget */}
            {user && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Stats
                </h3>
                
                {isLoadingStats ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : userStats ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Hours</span>
                      <span className="font-semibold text-gray-900">
                        {userStats.totalHours.toFixed(1)}h
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">This Week</span>
                      <span className="font-semibold text-gray-900">
                        {userStats.weeklyHours.toFixed(1)}h
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Streak</span>
                      <span className="font-semibold text-gray-900">
                        {userStats.currentStreak} days
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sessions This Week</span>
                      <span className="font-semibold text-gray-900">
                        {userStats.sessionsThisWeek}
                      </span>
                    </div>
                    
                    {userStats.favoriteProject && (
                      <div className="pt-3 border-t border-gray-200">
                        <span className="text-sm text-gray-600 block mb-1">
                          Favorite Project
                        </span>
                        <span className="font-semibold text-gray-900">
                          {userStats.favoriteProject.name}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({formatTime(userStats.favoriteProject.hours * 3600)})
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-sm">
                    No stats available
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Start Timer</div>
                      <div className="text-sm text-gray-600">Begin a new session</div>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Add Task</div>
                      <div className="text-sm text-gray-600">Create a new task</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Feed */}
        <div className="lg:col-span-6 order-1 lg:order-2">
          {/* Feed Type Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <div className="flex gap-0 border-b border-gray-200">
              <button
                onClick={() => setFeedType('recent')}
                className={`flex-1 px-6 py-4 font-medium transition-all ${
                  feedType === 'recent'
                    ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setFeedType('following')}
                className={`flex-1 px-6 py-4 font-medium transition-all ${
                  feedType === 'following'
                    ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Following
              </button>
              <button
                onClick={() => setFeedType('trending')}
                className={`flex-1 px-6 py-4 font-medium transition-all ${
                  feedType === 'trending'
                    ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                🔥 Trending
              </button>
            </div>
          </div>

          <Feed filters={filters} key={feedType} />
        </div>

        {/* Right Sidebar - Suggestions */}
        <div className="lg:col-span-3 order-3">
          <div className="sticky top-6 space-y-6">
            {/* Suggested Users */}
            <SuggestedUsers users={suggestedUsers} />
            
            {/* Trending Projects */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Trending Projects
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">💻</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Web Development</div>
                    <div className="text-sm text-gray-600">1.2k sessions this week</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📚</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Learning</div>
                    <div className="text-sm text-gray-600">890 sessions this week</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">🎨</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Design</div>
                    <div className="text-sm text-gray-600">567 sessions this week</div>
                  </div>
                </div>
              </div>
              
              <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All Projects
              </button>
            </div>
            
            {/* Feed Tips */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                💡 Feed Tips
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                Share your productive sessions to inspire others and build your network!
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use meaningful descriptions</li>
                <li>• Tag relevant skills</li>
                <li>• Rate how you felt</li>
                <li>• Support others' work</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedLayout;
