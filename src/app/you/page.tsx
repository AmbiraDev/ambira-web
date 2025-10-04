'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import Header from '@/components/HeaderComponent';
import { firebaseSessionApi, firebaseUserApi } from '@/lib/firebaseApi';
import { Session, UserStats, User as UserType, UserProfile } from '@/types';
import { Heart, MessageCircle, Share2, Calendar, Clock, Target, ChevronDown, MoreVertical, Edit, User as UserIcon, Users } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useSearchParams, useRouter } from 'next/navigation';

type YouTab = 'progress' | 'sessions' | 'profile';
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

export default function YouPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab') as YouTab | null;

  const [activeTab, setActiveTab] = useState<YouTab>(
    tabParam === 'sessions' ? 'sessions' : tabParam === 'profile' ? 'profile' : 'progress'
  );
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [followers, setFollowers] = useState<UserType[]>([]);
  const [following, setFollowing] = useState<UserType[]>([]);

  // Update tab when URL changes
  useEffect(() => {
    if (tabParam === 'sessions' || tabParam === 'progress' || tabParam === 'profile') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    processChartData();
    if (sessions.length > 0) {
      processCategoryStats();
    } else {
      setCategoryStats([]);
    }
  }, [sessions, timePeriod]);

  const loadData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load sessions and stats separately to handle errors better
      let sessionsData: Session[] = [];
      let statsData: UserStats | null = null;
      let profileData: UserProfile | null = null;
      let followersData: UserType[] = [];
      let followingData: UserType[] = [];

      try {
        sessionsData = await firebaseSessionApi.getUserSessions(user.id, 50, true);
      } catch (sessionError) {
        console.error('Error loading sessions:', sessionError);
        sessionsData = [];
      }

      try {
        statsData = await firebaseUserApi.getUserStats(user.id);
      } catch (statsError) {
        console.error('Error loading stats:', statsError);
      }

      try {
        profileData = await firebaseUserApi.getUserProfile(user.username);
      } catch (profileError) {
        console.error('Error loading profile:', profileError);
      }

      try {
        followersData = await firebaseUserApi.getFollowers(user.id);
      } catch (followersError) {
        console.error('Error loading followers:', followersError);
      }

      try {
        followingData = await firebaseUserApi.getFollowing(user.id);
      } catch (followingError) {
        console.error('Error loading following:', followingError);
      }

      setSessions(sessionsData);
      setStats(statsData);
      setUserProfile(profileData);
      setFollowers(followersData);
      setFollowing(followingData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processChartData = () => {
    const now = new Date();
    let data: ChartDataPoint[] = [];

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

    setChartData(data);
  };

  const processCategoryStats = () => {
    // Since sessions don't have categories in the current schema,
    // we'll skip this for now or group by tags/projects instead
    setCategoryStats([]);
  };

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
          <MobileHeader title="You" />
        </div>

        {/* Tabs */}
        <div className="sticky top-12 md:top-0 bg-white md:bg-gray-50 border-b border-gray-200 z-30">
          <div className="bg-gray-50 border-b md:border-b-0 border-gray-200">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
              <div className="flex md:gap-8">
                <button
                  onClick={() => {
                    setActiveTab('progress');
                    router.push('/you?tab=progress');
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
                    router.push('/you?tab=sessions');
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
                    setActiveTab('profile');
                    router.push('/you?tab=profile');
                  }}
                  className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors ${
                    activeTab === 'profile'
                      ? 'border-[#007AFF] text-[#007AFF] md:text-gray-900'
                      : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                  }`}
                >
                  Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
            {activeTab === 'progress' && (
              <div className="max-w-4xl mx-auto">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-[#007AFF] flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-600">Total Time</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.totalHours?.toFixed(1) || 0}h
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-[#FC4C02] flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-600">Streak</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.currentStreak || 0} days
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-600">Sessions</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {sessions.length}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-600">Avg/Day</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.totalHours ? (stats.totalHours / 30).toFixed(1) : 0}h
                  </div>
                </div>
              </div>

              {/* Chart with Time Period Dropdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">
                    {timePeriod === 'day' && 'Today'}
                    {timePeriod === 'week' && 'This Week'}
                    {timePeriod === 'month' && 'This Month'}
                    {timePeriod === 'year' && 'This Year'}
                  </h3>
                  <div className="relative">
                    <button
                      onClick={() => setShowTimePeriodDropdown(!showTimePeriodDropdown)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
                              timePeriod === period ? 'text-[#007AFF] font-medium' : 'text-gray-700'
                            }`}
                          >
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
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
                        stroke="#007AFF"
                        strokeWidth={2}
                        isAnimationActive={false}
                        dot={(props: any) => {
                          const { cx, cy, index, payload } = props;
                          const isLast = index === chartData.length - 1;
                          return (
                            <circle
                              key={`dot-${index}-${payload.name}`}
                              cx={cx}
                              cy={cy}
                              r={isLast ? 6 : 4}
                              fill={isLast ? '#007AFF' : '#fff'}
                              stroke="#007AFF"
                              strokeWidth={2}
                            />
                          );
                        }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-lg font-bold mb-4">Activity Breakdown</h3>
                {categoryStats.length > 0 ? (
                  <div className="space-y-3">
                    {categoryStats.map((stat) => (
                      <div key={stat.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-lg`}>
                            {stat.icon}
                          </div>
                          <div>
                            <div className="font-medium">{stat.category}</div>
                            <div className="text-sm text-gray-500">{stat.sessions} sessions</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{stat.hours}h</div>
                          <div className="text-sm text-gray-500">{stat.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No activity data yet
                  </div>
                )}
              </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="max-w-4xl mx-auto space-y-6">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No sessions yet</div>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    {/* Session Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <Link href="/you?tab=profile">
                        <div className="w-10 h-10 bg-[#FC4C02] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{user.name}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(new Date(session.createdAt))}
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Session Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {session.title || 'Focus Session'}
                    </h3>

                    {/* Session Description */}
                    {session.description && (
                      <p className="text-gray-700 mb-3 line-clamp-3">
                        {session.description}
                      </p>
                    )}

                    {/* Session Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4 bg-gray-50 rounded-lg p-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Time</div>
                        <div className="font-bold text-gray-900">
                          {formatTime(session.duration)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Tasks</div>
                        <div className="font-bold text-gray-900 truncate">
                          {session.tasks?.length || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Tags</div>
                        <div className="font-bold text-gray-900 truncate">
                          {session.tags?.length || 0}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-6 pt-4 mt-4 border-t border-gray-200">
                      <button className="flex items-center gap-2 text-gray-600 hover:text-[#007AFF] transition-colors">
                        <Heart className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {session.supportCount || 0}
                        </span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 hover:text-[#007AFF] transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {session.commentCount || 0}
                        </span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 hover:text-[#007AFF] transition-colors ml-auto">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  {/* Profile Picture */}
                  <div className="w-24 h-24 bg-[#FC4C02] rounded-full flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-4xl">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Name and Location */}
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h1>
                  <p className="text-gray-600 mb-4">
                    {userProfile?.location || user.location || 'Location not set'}
                  </p>

                  {/* Stats */}
                  <div className="flex gap-8 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Following</div>
                      <div className="text-xl font-bold">
                        {userProfile?.followingCount || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Followers</div>
                      <div className="text-xl font-bold">
                        {userProfile?.followersCount || 0}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href="/settings"
                      className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-[#FC4C02] text-[#FC4C02] rounded-xl font-medium"
                    >
                      <Edit className="w-5 h-5" />
                      Edit Profile
                    </Link>
                  </div>
                </div>

                {/* This Week Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 text-[#FC4C02]">📊</div>
                    <h2 className="text-lg font-bold">This week</h2>
                  </div>

                  <div className="flex gap-6 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Time</div>
                      <div className="text-xl font-bold">
                        {stats?.weeklyHours?.toFixed(1) || 0}h
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Sessions</div>
                      <div className="text-xl font-bold">
                        {stats?.sessionsThisWeek || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Streak</div>
                      <div className="text-xl font-bold">
                        {stats?.currentStreak || 0} days
                      </div>
                    </div>
                  </div>
                </div>

                {/* Followers Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Followers ({followers.length})</h3>
                  </div>
                  {followers.length > 0 ? (
                    <div className="space-y-3">
                      {followers.slice(0, 5).map((follower) => (
                        <Link
                          key={follower.id}
                          href={`/profile/${follower.username}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 bg-[#FC4C02] rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {follower.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{follower.name}</div>
                            <div className="text-sm text-gray-500">@{follower.username}</div>
                          </div>
                        </Link>
                      ))}
                      {followers.length > 5 && (
                        <div className="text-center pt-2">
                          <button className="text-[#007AFF] text-sm font-medium">
                            View all {followers.length} followers
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No followers yet</p>
                    </div>
                  )}
                </div>

                {/* Following Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Following ({following.length})</h3>
                  </div>
                  {following.length > 0 ? (
                    <div className="space-y-3">
                      {following.slice(0, 5).map((followedUser) => (
                        <Link
                          key={followedUser.id}
                          href={`/profile/${followedUser.username}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 bg-[#FC4C02] rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {followedUser.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{followedUser.name}</div>
                            <div className="text-sm text-gray-500">@{followedUser.username}</div>
                          </div>
                        </Link>
                      ))}
                      {following.length > 5 && (
                        <div className="text-center pt-2">
                          <button className="text-[#007AFF] text-sm font-medium">
                            View all {following.length} following
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <UserIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Not following anyone yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
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
