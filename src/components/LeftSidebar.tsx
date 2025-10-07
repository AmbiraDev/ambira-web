'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { firebaseApi } from '@/lib/firebaseApi';
import { UserProfile, UserStats } from '@/types';
import { WeekStreakCalendar } from './WeekStreakCalendar';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
    <aside className="hidden lg:block w-[280px] flex-shrink-0" aria-label="User profile sidebar">
      <div className="space-y-4 h-full overflow-y-auto scrollbar-hide">
        {/* Profile Card - Subtle Design */}
        <Link href="/you" className="block group" aria-label="View your profile">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2 w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  {profile?.profilePicture || user?.profilePicture ? (
                    <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-200">
                      <Image
                        src={profile?.profilePicture || user?.profilePicture || ''}
                        alt={profile?.name || user?.name || 'User'}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-[#FC4C02] rounded-full flex items-center justify-center ring-2 ring-white">
                      <span className="text-3xl font-bold text-white">
                        {profile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {profile?.name || user?.name || 'User'}
                </h2>

                {/* Bio */}
                {profile?.bio && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {profile.bio}
                  </p>
                )}

                {/* Location */}
                {profile?.location && (
                  <p className="text-sm text-gray-500 mb-3">
                    {profile.location}
                  </p>
                )}

                {/* Profile Views */}
                <div className="pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    View Profile
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200 mt-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats?.sessionsThisWeek || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{Math.round(stats?.totalHours || 0)}</div>
                    <div className="text-xs text-gray-500 mt-1">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats?.currentStreak || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">Streak</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Link>

      </div>
    </aside>
  );
}

export default LeftSidebar;
