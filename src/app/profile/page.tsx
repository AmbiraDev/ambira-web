'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import Header from '@/components/HeaderComponent';
import { useUserSessions, useUserStats, useUserProfile, useUserFollowers, useUserFollowing } from '@/hooks/useCache';
import Link from 'next/link';
import Image from 'next/image';
import { User as UserIcon, Users, Settings, Clock, Target, Calendar, Heart, ChevronDown, MoreVertical, Edit, Trash2, MessageCircle, Share2, LogOut } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useSearchParams, useRouter } from 'next/navigation';
import { Session } from '@/types';
import { ImageGallery } from '@/components/ImageGallery';
import { firebaseSessionApi } from '@/lib/firebaseApi';

type ProfileTab = 'progress' | 'sessions' | 'followers' | 'following';
type TimePeriod = 'day' | 'week' | 'month' | 'year';

interface ChartDataPoint {
  name: string;
  hours: number;
}

interface CategoryStats {
  category: string;
  hours: number;
  sessions: number;
  percentage: number;
  icon: string;
  color: string;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab') as ProfileTab | null;

  const [activeTab, setActiveTab] = useState<ProfileTab>(
    tabParam === 'sessions' ? 'sessions' :
    tabParam === 'followers' ? 'followers' :
    tabParam === 'following' ? 'following' : 'progress'
  );
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [sessionMenuOpen, setSessionMenuOpen] = useState<string | null>(null);
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<Session | null>(null);

  // Use React Query hooks for data with automatic caching
  const { data: sessions = [], isLoading: sessionsLoading } = useUserSessions(user?.id || '', 50, {
    enabled: !!user?.id,
  });
  const { data: stats = null, isLoading: statsLoading } = useUserStats(user?.id || '', {
    enabled: !!user?.id,
  });
  const { data: userProfile = null } = useUserProfile(user?.id || '', {
    enabled: !!user?.id,
  });
  const { data: followers = [] } = useUserFollowers(user?.id || '', {
    enabled: !!user?.id,
  });
  const { data: following = [] } = useUserFollowing(user?.id || '', {
    enabled: !!user?.id,
  });

  const isLoading = sessionsLoading || statsLoading;

  // Update tab when URL changes
  useEffect(() => {
    if (tabParam === 'sessions' || tabParam === 'progress' || tabParam === 'followers' || tabParam === 'following') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Calculate chart data using useMemo to prevent infinite loop
  const chartData = useMemo(() => {
    if (!sessions) return [];

    const now = new Date();
    const data: ChartDataPoint[] = [];

    if (timePeriod === 'day') {
      // Last 24 hours by hour
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now);
        hour.setHours(hour.getHours() - i);
        const hourLabel = hour.getHours().toString().padStart(2, '0');

        const hoursWorked = sessions.length > 0 ? sessions
          .filter(s => {
            const sessionDate = new Date(s.createdAt);
            return sessionDate.getHours() === hour.getHours() &&
                   sessionDate.toDateString() === hour.toDateString();
          })
          .reduce((sum, s) => sum + s.duration / 3600, 0) : 0;

        data.push({ name: hourLabel, hours: Number(hoursWorked.toFixed(2)) });
      }
    } else if (timePeriod === 'week') {
      // Last 7 days
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);

        const hoursWorked = sessions.length > 0 ? sessions
          .filter(s => new Date(s.createdAt).toDateString() === day.toDateString())
          .reduce((sum, s) => sum + s.duration / 3600, 0) : 0;

        data.push({
          name: dayNames[day.getDay()],
          hours: Number(hoursWorked.toFixed(2))
        });
      }
    } else if (timePeriod === 'month') {
      // Last 30 days grouped by week
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));

        const hoursWorked = sessions.length > 0 ? sessions
          .filter(s => {
            const sessionDate = new Date(s.createdAt);
            return sessionDate >= weekStart && sessionDate <= weekEnd;
          })
          .reduce((sum, s) => sum + s.duration / 3600, 0) : 0;

        data.push({
          name: `Week ${4 - i}`,
          hours: Number(hoursWorked.toFixed(2))
        });
      }
    } else if (timePeriod === 'year') {
      // Last 12 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(month.getMonth() - i);

        const hoursWorked = sessions.length > 0 ? sessions
          .filter(s => {
            const sessionDate = new Date(s.createdAt);
            return sessionDate.getMonth() === month.getMonth() &&
                   sessionDate.getFullYear() === month.getFullYear();
          })
          .reduce((sum, s) => sum + s.duration / 3600, 0) : 0;

        data.push({
          name: monthNames[month.getMonth()],
          hours: Number(hoursWorked.toFixed(2))
        });
      }
    }

    return data;
  }, [sessions, timePeriod]);

  // Category stats - empty for now
  const categoryStats: CategoryStats[] = [];

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await firebaseSessionApi.deleteSession(sessionId);
      setDeleteConfirmSession(null);
      // React Query will automatically refetch
      alert('Session deleted successfully');
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    }
  };

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white md:bg-gray-50">
        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden">
          <MobileHeader title="My Profile" />
        </div>

        {/* Content */}
        <div className="pb-32 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
            <div className="max-w-4xl mx-auto">
              {/* Profile Card with This Week Stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 relative">
                {/* Settings Icon */}
                <div className="absolute top-4 right-4">
                  <div className="relative">
                    <button
                      onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                    </button>

                    {/* Settings Dropdown */}
                    {showSettingsMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-gray-900 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowSettingsMenu(false)}
                        >
                          Settings
                        </Link>
                        <hr className="my-2 border-gray-200" />
                        <button
                          onClick={() => {
                            setShowSettingsMenu(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Two Column Layout */}
                <div className="flex gap-8">
                  {/* Left Column - Profile Info */}
                  <div className="flex-1">
                    {/* Profile Picture */}
                    {user.profilePicture || userProfile?.profilePicture ? (
                      <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-md mb-4">
                        <Image
                          src={userProfile?.profilePicture || user.profilePicture || ''}
                          alt={user.name}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-[#FC4C02] rounded-full flex items-center justify-center ring-4 ring-white shadow-md mb-4">
                        <span className="text-white font-bold text-4xl">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Name and Username */}
                    <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                    <p className="text-gray-600 mb-3">@{user.username}</p>

                    {/* Bio */}
                    {(userProfile?.bio || user.bio) && (
                      <p className="text-gray-700 mb-3">{userProfile?.bio || user.bio}</p>
                    )}

                    {/* Location */}
                    {(userProfile?.location || user.location) && (
                      <p className="text-gray-500 text-sm mb-4">📍 {userProfile?.location || user.location}</p>
                    )}

                    {/* Edit Profile Button */}
                    <Link
                      href="/settings"
                      className="inline-flex items-center gap-2 mb-4 px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-semibold text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </Link>

                    {/* Follower/Following Counts */}
                    <div className="flex gap-6">
                      <button
                        onClick={() => {
                          setActiveTab('followers');
                          router.push('/profile?tab=followers');
                        }}
                        className="hover:underline"
                      >
                        <span className="font-bold text-gray-900">{followers.length}</span>{' '}
                        <span className="text-gray-600">Followers</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('following');
                          router.push('/profile?tab=following');
                        }}
                        className="hover:underline"
                      >
                        <span className="font-bold text-gray-900">{following.length}</span>{' '}
                        <span className="text-gray-600">Following</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column - This Week Stats */}
                  <div className="w-64 border-l border-gray-200 pl-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-5 h-5 text-[#FC4C02]">📊</div>
                      <h2 className="text-base font-bold">This week</h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-gray-600">Time</div>
                        <div className="text-2xl font-bold">
                          {stats?.weeklyHours?.toFixed(1) || 0}h
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Sessions</div>
                        <div className="text-2xl font-bold">
                          {stats?.sessionsThisWeek || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Streak</div>
                        <div className="text-2xl font-bold">
                          {stats?.currentStreak || 0} days
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="sticky top-12 md:top-14 bg-white md:bg-gray-50 z-30 -mx-4 md:mx-0">
                <div className="bg-gray-50 border-b md:border-b-0 border-gray-200">
                  <div className="flex md:gap-8 px-4 md:px-0">
                    <button
                      onClick={() => {
                        setActiveTab('progress');
                        router.push('/profile?tab=progress');
                      }}
                      className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors ${
                        activeTab === 'progress'
                          ? 'border-[#007AFF] text-[#007AFF] md:text-gray-900'
                          : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                      }`}
                    >
                      Progress
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('sessions');
                        router.push('/profile?tab=sessions');
                      }}
                      className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors ${
                        activeTab === 'sessions'
                          ? 'border-[#007AFF] text-[#007AFF] md:text-gray-900'
                          : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                      }`}
                    >
                      Sessions
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('followers');
                        router.push('/profile?tab=followers');
                      }}
                      className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors ${
                        activeTab === 'followers'
                          ? 'border-[#007AFF] text-[#007AFF] md:text-gray-900'
                          : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                      }`}
                    >
                      Followers
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('following');
                        router.push('/profile?tab=following');
                      }}
                      className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors ${
                        activeTab === 'following'
                          ? 'border-[#007AFF] text-[#007AFF] md:text-gray-900'
                          : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                      }`}
                    >
                      Following
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === 'progress' && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Last 4 Weeks Summary */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Last 4 Weeks</h2>
                      </div>

                      {/* Main Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Time</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {stats?.totalHours?.toFixed(1) || 0}h
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sessions</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {sessions.length}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg/Week</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {stats?.weeklyHours?.toFixed(1) || 0}h
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg/Day</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {stats?.totalHours ? (stats.totalHours / 28).toFixed(1) : 0}h
                          </div>
                        </div>
                      </div>

                      {/* Weekly Breakdown Chart */}
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData}
                            margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                          >
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              axisLine={{ stroke: '#e5e7eb' }}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              axisLine={{ stroke: '#e5e7eb' }}
                              tickLine={false}
                              width={40}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}
                              formatter={(value: number) => [`${value}h`, 'Hours']}
                            />
                            <Line
                              type="monotone"
                              dataKey="hours"
                              stroke="#FC4C02"
                              strokeWidth={2}
                              isAnimationActive={false}
                              dot={(props: any) => {
                                const { cx, cy, index, payload } = props;
                                const isToday = index === chartData.length - 1;
                                return (
                                  <circle
                                    key={`dot-${index}-${payload.name}`}
                                    cx={cx}
                                    cy={cy}
                                    r={isToday ? 5 : 0}
                                    fill="#FC4C02"
                                    stroke="none"
                                  />
                                );
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Year Stats and Additional Metrics */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* This Year Section */}
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900">
                            {new Date().getFullYear()}
                          </h3>
                          <button
                            onClick={() => setTimePeriod('year')}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            View chart
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Total Time</span>
                            <span className="font-semibold text-gray-900">
                              {stats?.totalHours?.toFixed(1) || 0}h
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Sessions</span>
                            <span className="font-semibold text-gray-900">
                              {sessions.length}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Longest Session</span>
                            <span className="font-semibold text-gray-900">
                              {sessions.length > 0
                                ? formatTime(Math.max(...sessions.map(s => s.duration)))
                                : '0m'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Current Streak</span>
                            <span className="font-semibold text-gray-900">
                              {stats?.currentStreak || 0} days
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* All-Time Section */}
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900">All-Time</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Total Sessions</span>
                            <span className="font-semibold text-gray-900">
                              {sessions.length}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Total Time</span>
                            <span className="font-semibold text-gray-900">
                              {stats?.totalHours?.toFixed(1) || 0}h
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Longest Streak</span>
                            <span className="font-semibold text-gray-900">
                              {stats?.longestStreak || stats?.currentStreak || 0} days
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Avg Session</span>
                            <span className="font-semibold text-gray-900">
                              {sessions.length > 0
                                ? formatTime(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length)
                                : '0m'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Time Period Chart */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">
                          {timePeriod === 'day' && 'Last 24 Hours'}
                          {timePeriod === 'week' && 'Last 7 Days'}
                          {timePeriod === 'month' && 'Last 4 Weeks'}
                          {timePeriod === 'year' && 'Last 12 Months'}
                        </h3>
                        <div className="relative">
                          <button
                            onClick={() => setShowTimePeriodDropdown(!showTimePeriodDropdown)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                          >
                            {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          {showTimePeriodDropdown && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                              {(['day', 'week', 'month', 'year'] as TimePeriod[]).map((period) => (
                                <button
                                  key={period}
                                  onClick={() => {
                                    setTimePeriod(period);
                                    setShowTimePeriodDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                    timePeriod === period ? 'text-[#FC4C02] font-medium' : 'text-gray-700'
                                  }`}
                                >
                                  {period.charAt(0).toUpperCase() + period.slice(1)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData}
                            margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                          >
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              axisLine={{ stroke: '#e5e7eb' }}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              axisLine={{ stroke: '#e5e7eb' }}
                              tickLine={false}
                              width={40}
                              label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '12px',
                                padding: '8px 12px'
                              }}
                              formatter={(value: number) => [`${value}h`, 'Hours']}
                            />
                            <Line
                              type="monotone"
                              dataKey="hours"
                              stroke="#FC4C02"
                              strokeWidth={2}
                              isAnimationActive={false}
                              dot={false}
                              activeDot={{ r: 4, fill: '#FC4C02' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Recent Sessions Summary */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                        <button
                          onClick={() => {
                            setActiveTab('sessions');
                            router.push('/profile?tab=sessions');
                          }}
                          className="text-sm text-[#FC4C02] hover:text-[#E04402] font-medium"
                        >
                          View all
                        </button>
                      </div>
                      {sessions.length > 0 ? (
                        <div className="space-y-3">
                          {sessions.slice(0, 5).map((session) => (
                            <div key={session.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm">
                                  {session.title || 'Focus Session'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(new Date(session.createdAt))}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900 text-sm">
                                  {formatTime(session.duration)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {session.tasks?.length || 0} tasks
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          No sessions yet
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'sessions' && (
                  <div className="max-w-4xl mx-auto space-y-4">
                    {isLoading ? (
                      <div className="p-8 text-center text-gray-500">Loading sessions...</div>
                    ) : sessions.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">No sessions yet</div>
                    ) : (
                      sessions.map((session) => (
                        <div key={session.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                          {/* Session Header */}
                          <div className="flex items-center justify-between p-4 pb-3">
                            <div className="flex items-center gap-3">
                              <Link href="/profile">
                                {userProfile?.profilePicture || user.profilePicture ? (
                                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white">
                                    <Image
                                      src={userProfile?.profilePicture || user.profilePicture || ''}
                                      alt={user.name}
                                      width={40}
                                      height={40}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-[#FC4C02] rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white">
                                    <span className="text-white font-semibold text-sm">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </Link>
                              <div>
                                <div className="font-semibold text-gray-900 text-base">{user.name}</div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(new Date(session.createdAt))}
                                </div>
                              </div>
                            </div>
                            <div className="relative">
                              <button
                                onClick={() => setSessionMenuOpen(sessionMenuOpen === session.id ? null : session.id)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>
                              {sessionMenuOpen === session.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                  <button
                                    onClick={() => {
                                      router.push(`/sessions/${session.id}/edit`);
                                      setSessionMenuOpen(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Edit session
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeleteConfirmSession(session);
                                      setSessionMenuOpen(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete session
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Session Title and Description */}
                          <div className="px-4 pb-3">
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">
                              {session.title || 'Focus Session'}
                            </h3>
                            {session.description && (
                              <p className="text-gray-600 text-sm line-clamp-2">
                                {session.description}
                              </p>
                            )}
                          </div>

                          {/* Image Gallery */}
                          {session.images && session.images.length > 0 && (
                            <div className="px-4 pb-4">
                              <ImageGallery images={session.images} />
                            </div>
                          )}

                          {/* Session Stats - Strava style */}
                          <div className="px-4 pb-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Time</div>
                                <div className="text-xl font-bold text-gray-900">
                                  {formatTime(session.duration)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Tasks</div>
                                <div className="text-xl font-bold text-gray-900">
                                  {session.tasks?.length || 0}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Tags</div>
                                <div className="text-xl font-bold text-gray-900">
                                  {session.tags?.length || 0}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center border-t border-gray-100 px-2">
                            <Link href={`/sessions/${session.id}`} className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 hover:bg-gray-50 transition-colors rounded-lg">
                              <Heart className="w-6 h-6" />
                              <span className="text-sm font-medium">
                                {session.supportCount || 0}
                              </span>
                            </Link>
                            <div className="w-px h-6 bg-gray-200"></div>
                            <Link href={`/sessions/${session.id}`} className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 hover:bg-gray-50 transition-colors rounded-lg">
                              <MessageCircle className="w-6 h-6" />
                              <span className="text-sm font-medium">
                                {session.commentCount || 0}
                              </span>
                            </Link>
                            <div className="w-px h-6 bg-gray-200"></div>
                            <button className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 hover:bg-gray-50 transition-colors rounded-lg">
                              <Share2 className="w-6 h-6" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'followers' && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold mb-4">Followers ({followers.length})</h3>
                    {followers.length > 0 ? (
                      <div className="space-y-3">
                        {followers.map((follower) => (
                          <Link
                            key={follower.id}
                            href={`/profile/${follower.username}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {follower.profilePicture ? (
                              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white">
                                <Image
                                  src={follower.profilePicture}
                                  alt={follower.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-[#FC4C02] rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {follower.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-medium">{follower.name}</div>
                              <div className="text-sm text-gray-500">@{follower.username}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No followers yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'following' && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold mb-4">Following ({following.length})</h3>
                    {following.length > 0 ? (
                      <div className="space-y-3">
                        {following.map((followedUser) => (
                          <Link
                            key={followedUser.id}
                            href={`/profile/${followedUser.username}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {followedUser.profilePicture ? (
                              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white">
                                <Image
                                  src={followedUser.profilePicture}
                                  alt={followedUser.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-[#FC4C02] rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {followedUser.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-medium">{followedUser.name}</div>
                              <div className="text-sm text-gray-500">@{followedUser.username}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <UserIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Not following anyone yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <BottomNavigation />
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmSession && (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Delete Session?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this session? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmSession(null)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteConfirmSession && handleDeleteSession(deleteConfirmSession.id)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
