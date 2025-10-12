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
import { User as UserIcon, Users, Settings, Clock, Target, Calendar, Heart, LogOut, Edit, TrendingUp, BarChart3, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, ComposedChart, BarChart, Bar } from 'recharts';
import { useSearchParams, useRouter } from 'next/navigation';
import Feed from '@/components/Feed';

type ProfileTab = 'progress' | 'sessions' | 'followers' | 'following';
type TimePeriod = '7D' | '2W' | '4W' | '3M' | '1Y';
type ChartType = 'bar' | 'line';

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
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7D');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false);

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

    if (timePeriod === '7D') {
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
    } else if (timePeriod === '2W') {
      // Last 14 days
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 13; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);

        const hoursWorked = sessions.length > 0 ? sessions
          .filter(s => new Date(s.createdAt).toDateString() === day.toDateString())
          .reduce((sum, s) => sum + s.duration / 3600, 0) : 0;

        data.push({
          name: `${dayNames[day.getDay()]} ${day.getDate()}`,
          hours: Number(hoursWorked.toFixed(2))
        });
      }
    } else if (timePeriod === '4W') {
      // Last 4 weeks
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
    } else if (timePeriod === '3M') {
      // Last 3 months
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
    } else if (timePeriod === '1Y') {
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
              <div className="bg-gray-50 md:rounded-xl md:border border-gray-200 p-3 md:p-6 mb-4 md:mb-6 relative">
                {/* Settings Icon */}
                <div className="absolute top-3 md:top-4 right-3 md:right-4 z-10">
                  <div className="relative">
                    <button
                      onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                      className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Settings className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    {/* Settings Dropdown */}
                    {showSettingsMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
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
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Responsive Layout - Stacks on mobile, side-by-side on desktop */}
                <div className="flex flex-col md:flex-row md:gap-8">
                  {/* Left Column - Profile Info */}
                  <div className="flex-1">
                    {/* Profile Picture */}
                    {user.profilePicture || userProfile?.profilePicture ? (
                      <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-white shadow-md mb-3 md:mb-4">
                        <Image
                          src={userProfile?.profilePicture || user.profilePicture || ''}
                          alt={user.name}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 md:w-32 md:h-32 bg-[#FC4C02] rounded-full flex items-center justify-center ring-4 ring-white shadow-md mb-3 md:mb-4">
                        <span className="text-white font-bold text-2xl md:text-4xl">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Name and Username */}
                    <h1 className="text-lg md:text-2xl font-bold text-gray-900">{user.name}</h1>
                    <p className="text-gray-600 text-sm md:text-base mb-2 md:mb-3">@{user.username}</p>

                    {/* Bio */}
                    {(userProfile?.bio || user.bio) && (
                      <p className="text-gray-700 mb-2 md:mb-3 text-sm md:text-base leading-snug">{userProfile?.bio || user.bio}</p>
                    )}

                    {/* Location */}
                    {(userProfile?.location || user.location) && (
                      <p className="text-gray-500 text-xs md:text-sm mb-3 md:mb-4">📍 {userProfile?.location || user.location}</p>
                    )}

                    {/* Edit Profile Button */}
                    <Link
                      href="/settings"
                      className="inline-flex items-center gap-2 mb-3 md:mb-4 px-3 md:px-4 py-2 md:py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-semibold text-xs md:text-sm"
                    >
                      <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      Edit Profile
                    </Link>

                    {/* Follower/Following Counts */}
                    <div className="flex gap-4 md:gap-6 mb-4 md:mb-0">
                      <button
                        onClick={() => {
                          setActiveTab('followers');
                          router.push('/profile?tab=followers');
                        }}
                        className="hover:underline"
                      >
                        <span className="font-bold text-gray-900 text-sm md:text-base">{followers.length}</span>{' '}
                        <span className="text-gray-600 text-xs md:text-sm">Followers</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('following');
                          router.push('/profile?tab=following');
                        }}
                        className="hover:underline"
                      >
                        <span className="font-bold text-gray-900 text-sm md:text-base">{following.length}</span>{' '}
                        <span className="text-gray-600 text-xs md:text-sm">Following</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column - This Week Stats */}
                  <div className="md:w-64 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-8">
                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                      <div className="w-4 h-4 md:w-5 md:h-5 text-[#FC4C02]">📊</div>
                      <h2 className="text-sm md:text-base font-bold">This week</h2>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-1 gap-3 md:gap-4 md:space-y-0">
                      <div>
                        <div className="text-[10px] md:text-xs text-gray-600 uppercase tracking-wide">Time</div>
                        <div className="text-lg md:text-2xl font-bold">
                          {stats?.weeklyHours?.toFixed(1) || 0}h
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] md:text-xs text-gray-600 uppercase tracking-wide">Sessions</div>
                        <div className="text-lg md:text-2xl font-bold">
                          {stats?.sessionsThisWeek || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] md:text-xs text-gray-600 uppercase tracking-wide">Streak</div>
                        <div className="text-lg md:text-2xl font-bold">
                          {stats?.currentStreak || 0} <span className="text-sm md:text-base">days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="sticky top-12 md:top-14 bg-white md:bg-gray-50 z-30 -mx-4 md:mx-0">
                <div className="bg-white md:bg-gray-50 border-b border-gray-200">
                  <div className="flex md:gap-8 px-4 md:px-0">
                    <button
                      onClick={() => {
                        setActiveTab('progress');
                        router.push('/profile?tab=progress');
                      }}
                      className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors ${
                        activeTab === 'progress'
                          ? 'border-[#007AFF] text-[#007AFF]'
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
                          ? 'border-[#007AFF] text-[#007AFF]'
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
                          ? 'border-[#007AFF] text-[#007AFF]'
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
                          ? 'border-[#007AFF] text-[#007AFF]'
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
                  <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
                    {/* Header with Time Period Selector and Chart Type */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 py-2">
                      <h2 className="text-lg md:text-xl font-bold text-gray-900">Account overview</h2>
                      <div className="flex items-center gap-2 -mx-4 md:mx-0 px-4 md:px-0">
                        <div className="overflow-x-auto pb-1 flex items-center gap-1.5 md:gap-2 flex-1 md:flex-initial">
                          {(['7D', '2W', '4W', '3M', '1Y'] as TimePeriod[]).map((period) => (
                            <button
                              key={period}
                              onClick={() => setTimePeriod(period)}
                              className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                                timePeriod === period
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {period}
                            </button>
                          ))}
                        </div>

                        {/* Chart Type Selector - Outside overflow container */}
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}
                            className="flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors whitespace-nowrap"
                          >
                            {chartType === 'bar' ? (
                              <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            ) : (
                              <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            )}
                            <span className="capitalize hidden sm:inline">{chartType}</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {/* Chart Type Dropdown */}
                          {showChartTypeDropdown && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                              <button
                                onClick={() => {
                                  setChartType('bar');
                                  setShowChartTypeDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                                  chartType === 'bar' ? 'text-[#007AFF] font-medium' : 'text-gray-700'
                                }`}
                              >
                                {chartType === 'bar' && <span className="text-[#007AFF]">✓</span>}
                                <BarChart3 className="w-4 h-4" />
                                Bar
                              </button>
                              <button
                                onClick={() => {
                                  setChartType('line');
                                  setShowChartTypeDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                                  chartType === 'line' ? 'text-[#007AFF] font-medium' : 'text-gray-700'
                                }`}
                              >
                                {chartType === 'line' && <span className="text-[#007AFF]">✓</span>}
                                <TrendingUp className="w-4 h-4" />
                                Line
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Activity Chart */}
                    <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-3 md:p-6">
                      <div className="mb-3 md:mb-6">
                        <h3 className="text-sm md:text-base font-medium text-gray-900">Hours Tracked</h3>
                        <p className="text-[10px] md:text-sm text-gray-500 mt-0.5">
                          {timePeriod === '7D' && 'Daily'}
                          {timePeriod === '2W' && 'Daily'}
                          {timePeriod === '4W' && 'Weekly'}
                          {timePeriod === '3M' && 'Monthly'}
                          {timePeriod === '1Y' && 'Monthly'}
                        </p>
                      </div>
                      <div className="h-48 md:h-72">
                        {isLoading ? (
                          <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl animate-pulse flex items-center justify-center">
                            <p className="text-gray-400 text-sm">Loading...</p>
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'bar' ? (
                              <BarChart
                                data={chartData}
                                margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
                              >
                                <XAxis
                                  dataKey="name"
                                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                                  axisLine={{ stroke: '#e5e7eb' }}
                                  tickLine={false}
                                  dy={8}
                                />
                                <YAxis
                                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                                  axisLine={{ stroke: '#e5e7eb' }}
                                  tickLine={false}
                                  width={35}
                                  domain={[0, 'dataMax + 0.5']}
                                  tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    color: 'white',
                                  }}
                                  formatter={(value: number) => [`${value.toFixed(1)}h`, 'Hours']}
                                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                                />
                                <Bar
                                  dataKey="hours"
                                  fill="#007AFF"
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            ) : (
                              <ComposedChart
                                data={chartData}
                                margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
                              >
                                <defs>
                                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#007AFF" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis
                                  dataKey="name"
                                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                                  axisLine={{ stroke: '#e5e7eb' }}
                                  tickLine={false}
                                  dy={8}
                                />
                                <YAxis
                                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                                  axisLine={{ stroke: '#e5e7eb' }}
                                  tickLine={false}
                                  width={35}
                                  domain={[0, 'dataMax + 0.5']}
                                  tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    color: 'white',
                                  }}
                                  formatter={(value: number) => [`${value.toFixed(1)}h`, 'Hours']}
                                  cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="hours"
                                  stroke="none"
                                  fill="url(#colorHours)"
                                />
                                <Line
                                  type="monotone"
                                  dataKey="hours"
                                  stroke="#007AFF"
                                  strokeWidth={2}
                                  dot={false}
                                  activeDot={{
                                    r: 4,
                                    fill: '#007AFF',
                                    stroke: 'white',
                                    strokeWidth: 2
                                  }}
                                />
                              </ComposedChart>
                            )}
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* Secondary Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                      {/* Sessions over time */}
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-3 md:p-6">
                        <h3 className="text-xs md:text-base font-medium text-gray-900 mb-2 md:mb-4">Sessions over time</h3>
                        <div className="h-32 md:h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'bar' ? (
                              <BarChart
                                data={chartData}
                                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                              >
                                <XAxis
                                  dataKey="name"
                                  tick={{ fontSize: 11, fill: '#6b7280' }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                                  axisLine={false}
                                  tickLine={false}
                                  width={35}
                                  domain={[0, 'dataMax + 0.5']}
                                  tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    color: 'white',
                                  }}
                                  formatter={(value: number) => [`${value.toFixed(1)}h`, 'Hours']}
                                />
                                <Bar
                                  dataKey="hours"
                                  fill="#007AFF"
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            ) : (
                              <ComposedChart
                                data={chartData}
                                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                              >
                                <defs>
                                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis
                                  dataKey="name"
                                  tick={{ fontSize: 11, fill: '#6b7280' }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                                  axisLine={false}
                                  tickLine={false}
                                  width={35}
                                  domain={[0, 'dataMax + 0.5']}
                                  tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    color: 'white',
                                  }}
                                  formatter={(value: number) => [`${value.toFixed(1)}h`, 'Hours']}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="hours"
                                  stroke="#007AFF"
                                  strokeWidth={2}
                                  fill="url(#colorSessions)"
                                />
                              </ComposedChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Productivity trends */}
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-3 md:p-6">
                        <h3 className="text-xs md:text-base font-medium text-gray-900 mb-2 md:mb-4">Productivity trends</h3>
                        <div className="space-y-2 md:space-y-3">
                          <div className="flex items-center justify-between p-2 md:p-3 bg-white rounded-lg">
                            <div>
                              <div className="text-xs md:text-sm font-medium text-gray-900">Total hours</div>
                              <div className="text-[10px] md:text-xs text-gray-500">All time</div>
                            </div>
                            <div className="text-right">
                              <div className="text-base md:text-lg font-bold text-gray-900">{stats?.totalHours?.toFixed(1) || 0}h</div>
                              <div className="text-[10px] md:text-xs text-green-600">↑ 100%</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-2 md:p-3 bg-white rounded-lg">
                            <div>
                              <div className="text-xs md:text-sm font-medium text-gray-900">Avg session</div>
                              <div className="text-[10px] md:text-xs text-gray-500">Per session</div>
                            </div>
                            <div className="text-right">
                              <div className="text-base md:text-lg font-bold text-gray-900">
                                {sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length / 60) : 0}m
                              </div>
                              <div className="text-[10px] md:text-xs text-green-600">↑ 100%</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-2 md:p-3 bg-white rounded-lg">
                            <div>
                              <div className="text-xs md:text-sm font-medium text-gray-900">Current streak</div>
                              <div className="text-[10px] md:text-xs text-gray-500">Consecutive days</div>
                            </div>
                            <div className="text-right">
                              <div className="text-base md:text-lg font-bold text-gray-900">{stats?.currentStreak || 0}</div>
                              <div className="text-[10px] md:text-xs text-green-600">↑ 100%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
                      {/* Total Hours */}
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-2.5 md:p-4">
                        <div className="text-[10px] md:text-sm text-gray-600 mb-0.5 md:mb-1 uppercase tracking-wide">Total hours</div>
                        <div className="text-lg md:text-2xl font-bold text-gray-900">
                          {stats?.totalHours?.toFixed(1) || '0'}
                        </div>
                        <div className="text-[10px] md:text-xs text-green-600 mt-0.5 md:mt-1 flex items-center gap-1">
                          <span>↑</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Sessions */}
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-2.5 md:p-4">
                        <div className="text-[10px] md:text-sm text-gray-600 mb-0.5 md:mb-1 uppercase tracking-wide">Sessions</div>
                        <div className="text-lg md:text-2xl font-bold text-gray-900">
                          {sessions.length}
                        </div>
                        <div className="text-[10px] md:text-xs text-green-600 mt-0.5 md:mt-1 flex items-center gap-1">
                          <span>↑</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Avg Duration */}
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-2.5 md:p-4">
                        <div className="text-[10px] md:text-sm text-gray-600 mb-0.5 md:mb-1 uppercase tracking-wide">Avg duration</div>
                        <div className="text-lg md:text-2xl font-bold text-gray-900">
                          {sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length / 60) : 0}m
                        </div>
                        <div className="text-[10px] md:text-xs text-green-600 mt-0.5 md:mt-1 flex items-center gap-1">
                          <span>↑</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Current Streak */}
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-2.5 md:p-4">
                        <div className="text-[10px] md:text-sm text-gray-600 mb-0.5 md:mb-1 uppercase tracking-wide">Current streak</div>
                        <div className="text-lg md:text-2xl font-bold text-gray-900">
                          {stats?.currentStreak || 0}
                        </div>
                        <div className="text-[10px] md:text-xs text-green-600 mt-0.5 md:mt-1 flex items-center gap-1">
                          <span>↑</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Longest Streak */}
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-2.5 md:p-4">
                        <div className="text-[10px] md:text-sm text-gray-600 mb-0.5 md:mb-1 uppercase tracking-wide">Longest streak</div>
                        <div className="text-lg md:text-2xl font-bold text-gray-900">
                          {stats?.longestStreak || 0}
                        </div>
                        <div className="text-[10px] md:text-xs text-green-600 mt-0.5 md:mt-1 flex items-center gap-1">
                          <span>↑</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
                      {/* Weekly Hours */}
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-2.5 md:p-4">
                        <div className="text-[10px] md:text-sm text-gray-600 mb-0.5 md:mb-1 uppercase tracking-wide">This week</div>
                        <div className="text-lg md:text-2xl font-bold text-gray-900">
                          {stats?.weeklyHours?.toFixed(1) || '0'}h
                        </div>
                        <div className="text-[10px] md:text-xs text-green-600 mt-0.5 md:mt-1 flex items-center gap-1">
                          <span>↑</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Weekly Sessions */}
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-2.5 md:p-4">
                        <div className="text-[10px] md:text-sm text-gray-600 mb-0.5 md:mb-1 uppercase tracking-wide">Weekly sessions</div>
                        <div className="text-lg md:text-2xl font-bold text-gray-900">
                          {stats?.sessionsThisWeek || 0}
                        </div>
                        <div className="text-[10px] md:text-xs text-green-600 mt-0.5 md:mt-1 flex items-center gap-1">
                          <span>↑</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Active Days */}
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-2.5 md:p-4">
                        <div className="text-[10px] md:text-sm text-gray-600 mb-0.5 md:mb-1 uppercase tracking-wide">Active days</div>
                        <div className="text-lg md:text-2xl font-bold text-gray-900">
                          {chartData.slice(-7).filter(d => d.hours > 0).length}
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-600 mt-0.5 md:mt-1">
                          This week
                        </div>
                      </div>

                      {/* Total Projects */}
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-2.5 md:p-4">
                        <div className="text-[10px] md:text-sm text-gray-600 mb-0.5 md:mb-1 uppercase tracking-wide">Projects</div>
                        <div className="text-lg md:text-2xl font-bold text-gray-900">
                          {/* Will be populated when we have project count */}
                          0
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-600 mt-0.5 md:mt-1">
                          All time
                        </div>
                      </div>

                      {/* Followers */}
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-2.5 md:p-4">
                        <div className="text-[10px] md:text-sm text-gray-600 mb-0.5 md:mb-1 uppercase tracking-wide">Followers</div>
                        <div className="text-lg md:text-2xl font-bold text-gray-900">
                          {followers.length}
                        </div>
                        <div className="text-[10px] md:text-xs text-green-600 mt-0.5 md:mt-1 flex items-center gap-1">
                          <span>↑</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'sessions' && (
                  <div className="max-w-4xl mx-auto">
                    <Feed
                      filters={{ type: 'user', userId: user.id }}
                      showEndMessage={true}
                    />
                  </div>
                )}

                {activeTab === 'followers' && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-bold mb-4">Followers ({followers.length})</h3>
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
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-bold mb-4">Following ({following.length})</h3>
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
      </div>
    </ProtectedRoute>
  );
}
