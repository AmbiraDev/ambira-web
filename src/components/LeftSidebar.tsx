'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { firebaseApi } from '@/lib/firebaseApi';
import { UserProfile, UserStats } from '@/types';
import { WeekStreakCalendar } from './WeekStreakCalendar';
import { User, TrendingUp, Calendar, Target, ChevronRight, Clock } from 'lucide-react';
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
    <aside className="hidden lg:block w-[280px] flex-shrink-0">
      <div className="sticky top-[88px] space-y-4">
        {/* Profile Card - Subtle Design */}
        <Link href="/you" className="block group">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
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
                    <div className="w-20 h-20 bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-full flex items-center justify-center ring-2 ring-gray-200">
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
                <p className="text-sm text-gray-500 mb-4">
                  @{user?.username || 'username'}
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
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

        {/* Today's Goals */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Today's Goals</h3>
            <Link href="/you?tab=progress" className="text-xs text-[#007AFF] hover:text-[#0056D6] font-medium">
              Manage
            </Link>
          </div>
          
          <div className="space-y-4">
            {/* Daily Hours Goal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Focus Time</div>
                    <div className="text-xs text-gray-500">{stats?.weeklyHours ? (stats.weeklyHours / 7).toFixed(1) : 0} / 2.0 hrs</div>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((stats?.weeklyHours ? stats.weeklyHours / 7 : 0) / 2) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Daily Sessions Goal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Sessions</div>
                    <div className="text-xs text-gray-500">{stats?.sessionsThisWeek ? Math.round(stats.sessionsThisWeek / 7) : 0} / 3 today</div>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((stats?.sessionsThisWeek ? stats.sessionsThisWeek / 7 : 0) / 3) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Streak Goal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Streak</div>
                    <div className="text-xs text-gray-500">{stats?.currentStreak || 0} day streak</div>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((stats?.currentStreak || 0) / 7) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
}

export default LeftSidebar;
