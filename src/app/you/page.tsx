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

type YouTab = 'progress' | 'sessions' | 'projects' | 'profile';
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
    tabParam === 'sessions' ? 'sessions' : 
    tabParam === 'projects' ? 'projects' : 
    tabParam === 'profile' ? 'profile' : 'progress'
  );
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);
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
    if (tabParam === 'sessions' || tabParam === 'progress' || tabParam === 'projects' || tabParam === 'profile') {
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
          <MobileHeader title="You" />
        </div>

        {/* Tabs */}
        <div className="sticky top-12 md:top-0 bg-white md:bg-gray-50 z-30">
          <div className="bg-gray-50 border-b md:border-b-0 border-gray-200">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
              <div className="flex md:gap-8 md:pl-0">
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
                    setActiveTab('projects');
                    router.push('/you?tab=projects');
                  }}
                  className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors ${
                    activeTab === 'projects'
                      ? 'border-[#007AFF] text-[#007AFF] md:text-gray-900'
                      : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                  }`}
                >
                  Projects
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
        <div className="pb-32 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
            {activeTab === 'progress' && (
              <div className="max-w-4xl mx-auto">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Total Time</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.totalHours?.toFixed(1) || 0}h
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    <span className="text-sm text-gray-600">Streak</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.currentStreak || 0} days
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">Sessions</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {sessions.length}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-purple-600" />
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
                        <Link href="/you?tab=profile">
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

            {activeTab === 'projects' && (
              <div className="max-w-4xl mx-auto">
                <ProjectList />
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <UnifiedProfileCard
                  name={user.name}
                  username={user.username}
                  profilePicture={userProfile?.profilePicture || user.profilePicture}
                  bio={userProfile?.bio || user.bio}
                  location={userProfile?.location || user.location}
                  followersCount={followers.length}
                  followingCount={following.length}
                  isOwnProfile={true}
                  editButtonHref="/settings"
                  className="mb-6"
                />

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
