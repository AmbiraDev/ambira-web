'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import Header from '@/components/HeaderComponent';
import { ProjectList } from '@/components/ProjectList';
import { firebaseSessionApi, firebaseUserApi } from '@/lib/firebaseApi';
import { Session, UserStats, User as UserType, UserProfile } from '@/types';
import { Heart, MessageCircle, Share2, Calendar, Clock, Target, ChevronDown, MoreVertical, Edit, User as UserIcon, Users, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserSessions, useUserStats, useUserProfile, useUserFollowers, useUserFollowing } from '@/hooks/useCache';
import { ImageGallery } from '@/components/ImageGallery';
import { UnifiedProfileCard } from '@/components/UnifiedProfileCard';

type AnalyticsTab = 'progress' | 'sessions';
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

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab') as AnalyticsTab | null;

  const [activeTab, setActiveTab] = useState<AnalyticsTab>(
    tabParam === 'sessions' ? 'sessions' : 'progress'
  );
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);
  const [sessionMenuOpen, setSessionMenuOpen] = useState<string | null>(null);
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<Session | null>(null);

  // Use React Query hooks for data with automatic caching
  const { data: sessions = [], isLoading: sessionsLoading } = useUserSessions(user?.id || '', 50, {
    enabled: !!user?.id,
    refetchOnMount: 'always', // Always refetch when component mounts to ensure fresh data
    staleTime: 0, // Always treat as stale to ensure fresh data
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
    if (tabParam === 'sessions' || tabParam === 'progress') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Helper function to get session date using createdAt
  const getSessionDate = (session: Session): Date => {
    // Use createdAt as the primary date field for sessions
    return session.createdAt instanceof Date
      ? session.createdAt
      : new Date(session.createdAt);
  };

  // Calculate chart data using useMemo to prevent infinite loop
  const chartData = useMemo(() => {
    if (!sessions) return [];

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Filter sessions to only include those from the relevant time period
    // This ensures we're using the correct date range for calculations
    let filteredSessions = sessions;

    if (timePeriod === 'week') {
      // Only include sessions from the last 7 days based on startTime
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      filteredSessions = sessions.filter(s => {
        const sessionDate = getSessionDate(s);
        return sessionDate >= sevenDaysAgo;
      });
    }

    // Debug: Find today's sessions
    const todaySessions = filteredSessions.filter(s => {
      const sessionDate = getSessionDate(s);
      return sessionDate.toDateString() === now.toDateString();
    });

    const todayHours = todaySessions.reduce((sum, s) => sum + s.duration / 3600, 0);

    console.log('=== ANALYTICS DEBUG ===');
    console.log('Total sessions loaded:', sessions.length);
    console.log('Filtered sessions for period:', filteredSessions.length);
    console.log('Today\'s date:', now.toDateString());
    console.log('Today\'s sessions:', todaySessions.length);
    console.log('Today\'s total hours:', todayHours.toFixed(2));
    console.log('Today\'s sessions details:', todaySessions.map(s => ({
      title: s.title,
      startTime: getSessionDate(s).toString(),
      duration: (s.duration / 3600).toFixed(2) + 'h',
    })));
    console.log('======================');

    const data: ChartDataPoint[] = [];

    // Use filtered sessions for all calculations
    const sessionsToUse = filteredSessions;

    if (timePeriod === 'day') {
      // Last 24 hours by hour
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now);
        hour.setHours(hour.getHours() - i);
        const hourLabel = hour.getHours().toString().padStart(2, '0');

        const hoursWorked = sessionsToUse.length > 0 ? sessionsToUse
          .filter(s => {
            const sessionDate = getSessionDate(s);
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

        const hoursWorked = sessionsToUse.length > 0 ? sessionsToUse
          .filter(s => getSessionDate(s).toDateString() === day.toDateString())
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

        const hoursWorked = sessionsToUse.length > 0 ? sessionsToUse
          .filter(s => {
            const sessionDate = getSessionDate(s);
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

        const hoursWorked = sessionsToUse.length > 0 ? sessionsToUse
          .filter(s => {
            const sessionDate = getSessionDate(s);
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
          <MobileHeader title="Analytics" />
        </div>

        {/* Tabs */}
        <div className="sticky top-12 md:top-0 bg-white md:bg-gray-50 z-30">
          <div className="bg-gray-50 border-b md:border-b-0 border-gray-200">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
              <div className="flex md:gap-8 md:pl-0">
                <button
                  onClick={() => {
                    setActiveTab('progress');
                    router.push('/analytics?tab=progress');
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
                    router.push('/analytics?tab=sessions');
                  }}
                  className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors ${
                    activeTab === 'sessions'
                      ? 'border-[#007AFF] text-[#007AFF] md:text-gray-900'
                      : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                  }`}
                >
                  Sessions
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pb-32 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
            {activeTab === 'progress' && (
              <div className="max-w-5xl mx-auto">
                {/* Hero Stats Section */}
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Your Progress</h2>

                  {/* Primary Stats - Large Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Total Time Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-2xl p-6 shadow-lg">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-white/80 text-sm font-medium">Last 30 Days</span>
                        </div>
                        <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                          {stats?.totalHours?.toFixed(1) || 0}
                          <span className="text-2xl md:text-3xl ml-2 text-white/80">hours</span>
                        </div>
                        <p className="text-white/90 text-sm">Total Focus Time</p>
                      </div>
                      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    </div>

                    {/* Streak Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#FC4C02] to-[#D43D00] rounded-2xl p-6 shadow-lg">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Target className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-white/80 text-sm font-medium">Keep it up!</span>
                        </div>
                        <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                          {stats?.currentStreak || 0}
                          <span className="text-2xl md:text-3xl ml-2 text-white/80">days</span>
                        </div>
                        <p className="text-white/90 text-sm">Current Streak</p>
                      </div>
                      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    </div>
                  </div>

                  {/* Secondary Stats - Compact Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-[#007AFF]" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{sessions.length}</div>
                      <p className="text-xs text-gray-500 mt-1">Total Sessions</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                          <Clock className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats?.totalHours ? (stats.totalHours / 30).toFixed(1) : 0}h
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Daily Average</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                          <Target className="w-4 h-4 text-purple-600" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length / 60) : 0}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Avg Session (min)</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                          <Heart className="w-4 h-4 text-[#FC4C02]" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats?.longestStreak || 0}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Longest Streak</p>
                    </div>
                  </div>
                </div>

                {/* Activity Chart */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Activity Overview</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {timePeriod === 'day' && 'Last 24 hours'}
                        {timePeriod === 'week' && 'Last 7 days'}
                        {timePeriod === 'month' && 'Last 4 weeks'}
                        {timePeriod === 'year' && 'Last 12 months'}
                      </p>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setShowTimePeriodDropdown(!showTimePeriodDropdown)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}
                        <ChevronDown className={`w-4 h-4 transition-transform ${showTimePeriodDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showTimePeriodDropdown && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                          {(['day', 'week', 'month', 'year'] as TimePeriod[]).map((period) => (
                            <button
                              key={period}
                              onClick={() => {
                                setTimePeriod(period);
                                setShowTimePeriodDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                                timePeriod === period ? 'text-[#007AFF] font-semibold bg-blue-50' : 'text-gray-700'
                              }`}
                            >
                              {period.charAt(0).toUpperCase() + period.slice(1)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-64 md:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#007AFF" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
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
                          width={40}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                            fontSize: '12px',
                            padding: '8px 12px'
                          }}
                          formatter={(value: number) => [`${value} hours`, 'Focus Time']}
                        />
                        <Line
                          type="monotone"
                          dataKey="hours"
                          stroke="#007AFF"
                          strokeWidth={3}
                          fill="url(#colorHours)"
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
                          activeDot={{ r: 7, fill: '#007AFF', strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Insights Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Weekly Comparison */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Comparison</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">This Week</span>
                          <span className="font-semibold text-gray-900">
                            {chartData.slice(-7).reduce((sum, d) => sum + d.hours, 0).toFixed(1)}h
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#007AFF] to-[#0051D5] h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (chartData.slice(-7).reduce((sum, d) => sum + d.hours, 0) / 40) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Last Week</span>
                          <span className="font-semibold text-gray-900">
                            {chartData.slice(-14, -7).reduce((sum, d) => sum + d.hours, 0).toFixed(1)}h
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gray-300 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (chartData.slice(-14, -7).reduce((sum, d) => sum + d.hours, 0) / 40) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          {chartData.slice(-7).reduce((sum, d) => sum + d.hours, 0) >= chartData.slice(-14, -7).reduce((sum, d) => sum + d.hours, 0) ? (
                            <>
                              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                <span className="text-green-600 text-lg">↑</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">Great progress!</p>
                                <p className="text-xs text-gray-500">You're trending upward</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                                <span className="text-orange-600 text-lg">↓</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">Keep pushing!</p>
                                <p className="text-xs text-gray-500">You can do better</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Productivity Insights</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-[#007AFF]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">Most Productive Day</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {chartData.length > 0
                              ? chartData.reduce((max, d) => d.hours > max.hours ? d : max, chartData[0]).name
                              : 'N/A'}
                            {chartData.length > 0 && ` - ${chartData.reduce((max, d) => d.hours > max.hours ? d : max, chartData[0]).hours}h`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Target className="w-5 h-5 text-[#FC4C02]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">Weekly Goal Progress</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {chartData.slice(-7).reduce((sum, d) => sum + d.hours, 0).toFixed(1)}h / 40h
                            ({Math.round((chartData.slice(-7).reduce((sum, d) => sum + d.hours, 0) / 40) * 100)}%)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">Active Days This Week</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {chartData.slice(-7).filter(d => d.hours > 0).length} out of 7 days
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Breakdown */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Activity Breakdown</h3>
                  {categoryStats.length > 0 ? (
                    <div className="space-y-3">
                      {categoryStats.map((stat) => (
                        <div key={stat.category} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-xl shadow-sm`}>
                              {stat.icon}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{stat.category}</div>
                              <div className="text-sm text-gray-500">{stat.sessions} sessions</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">{stat.hours}h</div>
                            <div className="text-sm text-gray-500">{stat.percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No activity data yet</p>
                      <p className="text-sm text-gray-400 mt-1">Start tracking sessions to see your breakdown</p>
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
