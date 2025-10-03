'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { firebaseApi } from '@/lib/firebaseApi';
import { UserProfile, UserStats } from '@/types';
import { WeekStreakCalendar } from './WeekStreakCalendar';

function LeftSidebar() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (user?.username) {
        try {
          setIsLoading(true);
          const [profileData, statsData] = await Promise.all([
            firebaseApi.user.getUserProfile(user.username),
            firebaseApi.user.getUserStats(user.id)
          ]);
          setProfile(profileData);
          setStats(statsData);
        } catch (error) {
          console.error('Failed to load user data:', error);
          // Set default values if user data doesn't exist yet
          setProfile({
            id: user.id,
            username: user.username,
            name: user.name,
            bio: '',
            location: '',
            profilePicture: undefined,
            followersCount: 0,
            followingCount: 0,
            totalHours: 0,
            isFollowing: false,
            isPrivate: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          setStats({
            totalHours: 0,
            weeklyHours: 0,
            monthlyHours: 0,
            sessionsThisWeek: 0,
            sessionsThisMonth: 0,
            currentStreak: 0,
            longestStreak: 0,
            averageSessionDuration: 0,
            mostProductiveHour: 14
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUserData();
  }, [user]);
  return (
    <aside className="hidden lg:block w-[280px] flex-shrink-0">
      <div className="sticky top-[60px] space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="h-6 bg-gray-300 rounded mx-auto mb-4 w-32"></div>
              <div className="flex justify-center space-x-8 mb-6">
                <div className="text-center">
                  <div className="h-4 bg-gray-300 rounded mb-1 w-16"></div>
                  <div className="h-8 bg-gray-300 rounded w-8"></div>
                </div>
                <div className="text-center">
                  <div className="h-4 bg-gray-300 rounded mb-1 w-16"></div>
                  <div className="h-8 bg-gray-300 rounded w-8"></div>
                </div>
                <div className="text-center">
                  <div className="h-4 bg-gray-300 rounded mb-1 w-16"></div>
                  <div className="h-8 bg-gray-300 rounded w-8"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="w-24 h-24 bg-gray-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl font-medium text-white">
                  {profile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {profile?.name || user?.name || 'User'}
              </h2>
              
              <div className="flex justify-center space-x-8 mb-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Following</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {profile?.followingCount || 0}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Followers</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {profile?.followersCount || 0}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Hours</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(stats?.totalHours || 0)}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Latest Activity */}
          {!isLoading && (
            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="text-sm text-gray-600 mb-1">Latest Activity</div>
              <div className="text-sm font-semibold text-gray-900">
                {stats?.sessionsThisWeek ? `${stats.sessionsThisWeek} sessions this week` : 'No recent activity'}
              </div>
            </div>
          )}

          {/* Your Streak */}
          {!isLoading && user && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Your streak</div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-gray-900 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold">{stats?.currentStreak || 0} days</span>
                </div>
              </div>
              
              {/* Weekly Calendar with real data */}
              <WeekStreakCalendar userId={user.id} />
            </div>
          )}
        </div>

        {/* Training Log */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <button className="w-full flex items-center justify-between text-gray-900 hover:text-[#007AFF] transition-colors">
            <span className="text-sm font-medium">Your Training Log</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Activity Icons */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-2 hover:bg-gray-50 rounded">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
            <button className="flex flex-col items-center p-2 hover:bg-gray-50 rounded">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
            <button className="flex flex-col items-center p-2 hover:bg-gray-50 rounded">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>
            <button className="flex flex-col items-center p-2 hover:bg-gray-50 rounded">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
}

export default LeftSidebar;
