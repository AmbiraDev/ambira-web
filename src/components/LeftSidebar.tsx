'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { firebaseApi } from '@/lib/firebaseApi';
import { UserProfile, UserStats } from '@/types';
import { WeekStreakCalendar } from './WeekStreakCalendar';
import { User, TrendingUp, Calendar, Target, ChevronRight } from 'lucide-react';
import Link from 'next/link';

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
      <div className="sticky top-[88px] space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <Link href="/you">
            {isLoading ? (
              <div className="animate-pulse p-6">
                <div className="w-16 h-16 bg-gray-300 rounded-full mb-3"></div>
                <div className="h-5 bg-gray-300 rounded mb-2 w-32"></div>
                <div className="h-4 bg-gray-300 rounded w-24"></div>
              </div>
            ) : (
              <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="w-16 h-16 bg-[#FC4C02] rounded-full mb-3 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-white">
                    {profile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {profile?.name || user?.name || 'User'}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <span>{profile?.followingCount || 0} Following</span>
                  <span>·</span>
                  <span>{profile?.followersCount || 0} Followers</span>
                </div>
              </div>
            )}
          </Link>

          {/* Stats */}
          {!isLoading && (
            <div className="border-t border-gray-100 grid grid-cols-3">
              <div className="p-4 text-center border-r border-gray-100">
                <div className="text-sm text-gray-500 mb-1">Activities</div>
                <div className="text-xl font-bold text-gray-900">{stats?.sessionsThisWeek || 0}</div>
              </div>
              <div className="p-4 text-center border-r border-gray-100">
                <div className="text-sm text-gray-500 mb-1">Hours</div>
                <div className="text-xl font-bold text-gray-900">{Math.round(stats?.totalHours || 0)}</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-sm text-gray-500 mb-1">Streak</div>
                <div className="text-xl font-bold text-gray-900">{stats?.currentStreak || 0}</div>
              </div>
            </div>
          )}

        </div>

        {/* Relative Effort */}
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FC4C02]" />
              <span className="font-semibold text-gray-900">Relative Effort</span>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <div className="font-medium text-gray-900 mb-1">Last Week</div>
            <div>Recovery Week</div>
            <div className="text-xs text-gray-500 mt-2">
              Based on your activity data, your training last week was less intense than usual. Way to recover intelligently.
            </div>
          </div>
        </div>

        {/* Manage Your Goals */}
        <Link href="/you?tab=progress" className="block bg-white rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Manage Your Goals</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </Link>

      </div>
    </aside>
  );
}

export default LeftSidebar;
