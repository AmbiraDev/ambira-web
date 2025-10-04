'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import Header from '@/components/HeaderComponent';
import { firebaseSessionApi, firebaseUserApi } from '@/lib/firebaseApi';
import { Session, UserStats } from '@/types';
import { Heart, MessageCircle, Share2, Calendar, Clock, Target, ChevronDown, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

type YouTab = 'progress' | 'sessions';
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
  const [activeTab, setActiveTab] = useState<YouTab>('progress');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);

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

      try {
        sessionsData = await firebaseSessionApi.getUserSessions(user.id, 50, true);
      } catch (sessionError) {
        console.error('Error loading sessions:', sessionError);
        // Set empty array on error
        sessionsData = [];
      }

      try {
        statsData = await firebaseUserApi.getUserStats(user.id);
      } catch (statsError) {
        console.error('Error loading stats:', statsError);
        // Stats will remain null
      }

      setSessions(sessionsData);
      setStats(statsData);
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
    const categoryMap = new Map<string, { hours: number; sessions: number }>();
    const totalHours = sessions.reduce((sum, s) => sum + s.duration / 3600, 0);

    sessions.forEach(session => {
      const category = session.category || 'Other';
      const existing = categoryMap.get(category) || { hours: 0, sessions: 0 };
      categoryMap.set(category, {
        hours: existing.hours + session.duration / 3600,
        sessions: existing.sessions + 1
      });
    });

    const categoryIcons: Record<string, { icon: string; color: string }> = {
      'Study': { icon: '📚', color: 'bg-blue-100' },
      'Work': { icon: '💼', color: 'bg-green-100' },
      'Creative': { icon: '🎨', color: 'bg-purple-100' },
      'Fitness': { icon: '💪', color: 'bg-orange-100' },
      'Other': { icon: '📌', color: 'bg-gray-100' }
    };

    const stats: CategoryStats[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        hours: Number(data.hours.toFixed(1)),
        sessions: data.sessions,
        percentage: totalHours > 0 ? Math.round((data.hours / totalHours) * 100) : 0,
        icon: categoryIcons[category]?.icon || '📌',
        color: categoryIcons[category]?.color || 'bg-gray-100'
      }))
      .sort((a, b) => b.hours - a.hours);

    setCategoryStats(stats);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
      <div className="min-h-screen bg-white">
        <MobileHeader title="You" />

        {/* Tabs */}
        <div className="sticky top-12 bg-white border-b border-gray-200 z-30 md:hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'progress'
                  ? 'border-[#007AFF] text-[#007AFF]'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Progress
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'sessions'
                  ? 'border-[#007AFF] text-[#007AFF]'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Sessions
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pb-24">
          {activeTab === 'progress' && (
            <div className="p-4">
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
            <div className="divide-y divide-gray-100">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No sessions yet</div>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="bg-white p-4">
                    {/* Session Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <Link href="/profile-mobile">
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
                          {formatDate(session.createdAt)}
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
                        <div className="text-xs text-gray-500 mb-1">Project</div>
                        <div className="font-bold text-gray-900 truncate">
                          {session.projectTitle || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Category</div>
                        <div className="font-bold text-gray-900 truncate">
                          {session.category || 'General'}
                        </div>
                      </div>
                    </div>

                    {/* Session Images */}
                    {session.images && session.images.length > 0 && (
                      <div className={`grid gap-2 mb-4 ${
                        session.images.length === 1 ? 'grid-cols-1' :
                        session.images.length === 2 ? 'grid-cols-2' :
                        'grid-cols-3'
                      }`}>
                        {session.images.slice(0, 3).map((image, idx) => (
                          <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={image}
                              alt={`Session image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                      <button className="flex items-center gap-2 text-gray-600 hover:text-[#007AFF] transition-colors">
                        <Heart className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {session.likes || 0}
                        </span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 hover:text-[#007AFF] transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {session.comments || 0}
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
        </div>

        <BottomNavigation />
      </div>
    </ProtectedRoute>
  );
}
