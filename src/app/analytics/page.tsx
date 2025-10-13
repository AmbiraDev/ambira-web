'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import Footer from '@/components/Footer';
import Header from '@/components/HeaderComponent';
import { useUserSessions, useUserStats, useProjects } from '@/hooks/useCache';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, ComposedChart, BarChart, Bar } from 'recharts';
import { TrendingUp, BarChart3, ChevronDown } from 'lucide-react';

type AnalyticsTab = 'overview' | 'trends' | 'activities' | 'insights';
type TimePeriod = '7D' | '2W' | '4W' | '3M' | '1Y';
type ChartType = 'bar' | 'line';

interface ChartDataPoint {
  name: string;
  hours: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7D');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('all');
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);

  // Use React Query hooks for data with automatic caching
  const { data: sessions = [], isLoading: sessionsLoading } = useUserSessions(user?.id || '', 100, {
    enabled: !!user?.id,
  });
  const { data: stats = null, isLoading: statsLoading } = useUserStats(user?.id || '', {
    enabled: !!user?.id,
  });
  const { data: activities = [] } = useProjects(user?.id || '', {
    enabled: !!user?.id,
  });

  const isLoading = sessionsLoading || statsLoading;

  // Filter sessions based on selected activity
  const filteredSessions = useMemo(() => {
    if (selectedActivityId === 'all') return sessions;
    return sessions.filter(s => s.activityId === selectedActivityId || s.projectId === selectedActivityId);
  }, [sessions, selectedActivityId]);

  // Calculate chart data using useMemo to prevent infinite loop
  const chartData = useMemo(() => {
    if (!filteredSessions) return [];

    const now = new Date();
    const data: ChartDataPoint[] = [];

    if (timePeriod === '7D') {
      // Last 7 days
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);

        const hoursWorked = filteredSessions.length > 0 ? filteredSessions
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

        const hoursWorked = filteredSessions.length > 0 ? filteredSessions
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

        const hoursWorked = filteredSessions.length > 0 ? filteredSessions
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

        const hoursWorked = filteredSessions.length > 0 ? filteredSessions
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

        const hoursWorked = filteredSessions.length > 0 ? filteredSessions
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
  }, [filteredSessions, timePeriod]);

  // Calculate activity breakdown by project
  const activityBreakdown = useMemo(() => {
    const breakdown = new Map<string, { name: string; hours: number; sessions: number; color: string }>();

    filteredSessions.forEach(session => {
      const projectId = session.projectId || session.activityId || 'other';
      const project = activities.find(a => a.id === projectId);
      const projectName = project?.name || 'Other';
      const projectColor = project?.color || '#9CA3AF';

      if (!breakdown.has(projectId)) {
        breakdown.set(projectId, { name: projectName, hours: 0, sessions: 0, color: projectColor });
      }

      const current = breakdown.get(projectId)!;
      current.hours += session.duration / 3600;
      current.sessions += 1;
    });

    return Array.from(breakdown.values()).sort((a, b) => b.hours - a.hours);
  }, [filteredSessions, activities]);

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

        {/* Content */}
        <div className="pb-32 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
            <div className="max-w-6xl mx-auto">
              {/* Page Header */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
                <p className="text-gray-600">Track your productivity trends and insights</p>
              </div>

              {/* Tabs */}
              <div className="sticky top-12 md:top-14 bg-white md:bg-gray-50 z-30 -mx-4 md:mx-0 mb-6">
                <div className="bg-white md:bg-gray-50 border-b border-gray-200">
                  <div className="flex md:gap-8 px-4 md:px-0">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors ${
                        activeTab === 'overview'
                          ? 'border-[#007AFF] text-[#007AFF]'
                          : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('trends')}
                      className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors ${
                        activeTab === 'trends'
                          ? 'border-[#007AFF] text-[#007AFF]'
                          : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                      }`}
                    >
                      Trends
                    </button>
                    <button
                      onClick={() => setActiveTab('activities')}
                      className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors ${
                        activeTab === 'activities'
                          ? 'border-[#007AFF] text-[#007AFF]'
                          : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                      }`}
                    >
                      Activities
                    </button>
                    <button
                      onClick={() => setActiveTab('insights')}
                      className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors ${
                        activeTab === 'insights'
                          ? 'border-[#007AFF] text-[#007AFF]'
                          : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                      }`}
                    >
                      Insights
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="space-y-4 md:space-y-6">
                {/* Header with Controls */}
                <div className="flex items-center justify-between gap-2 py-2">
                  {/* Activity Filter Dropdown */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setShowActivityDropdown(!showActivityDropdown)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors whitespace-nowrap"
                    >
                      <span className="font-medium">
                        {selectedActivityId === 'all'
                          ? 'All Activities'
                          : activities.find(a => a.id === selectedActivityId)?.name || 'All Activities'
                        }
                      </span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Activity Dropdown Menu */}
                    {showActivityDropdown && (
                      <>
                        {/* Backdrop to close dropdown */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowActivityDropdown(false)}
                        />
                        <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-64 overflow-y-auto">
                          <button
                            onClick={() => {
                              setSelectedActivityId('all');
                              setShowActivityDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                              selectedActivityId === 'all' ? 'text-[#007AFF] font-medium bg-blue-50' : 'text-gray-700'
                            }`}
                          >
                            {selectedActivityId === 'all' && <span className="text-[#007AFF]">✓</span>}
                            <span>All Activities</span>
                          </button>
                          {activities.map((activity) => (
                            <button
                              key={activity.id}
                              onClick={() => {
                                setSelectedActivityId(activity.id);
                                setShowActivityDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                                selectedActivityId === activity.id ? 'text-[#007AFF] font-medium bg-blue-50' : 'text-gray-700'
                              }`}
                            >
                              {selectedActivityId === activity.id && <span className="text-[#007AFF]">✓</span>}
                              <span className="flex items-center gap-2">
                                <span style={{ color: activity.color }}>●</span>
                                {activity.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Time Period Buttons - Scrollable on mobile */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="overflow-x-auto flex items-center gap-1.5 md:gap-2 flex-1 scrollbar-hide">
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

                    {/* Chart Type Selector */}
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
                        <>
                          {/* Backdrop to close dropdown */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowChartTypeDropdown(false)}
                          />
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
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {activeTab === 'overview' && (
                  <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-3 md:p-4">
                        <div className="text-[10px] md:text-xs text-gray-600 mb-1 uppercase tracking-wide">Total hours</div>
                        <div className="text-xl md:text-2xl font-bold text-gray-900">
                          {stats?.totalHours?.toFixed(1) || '0'}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-3 md:p-4">
                        <div className="text-[10px] md:text-xs text-gray-600 mb-1 uppercase tracking-wide">Sessions</div>
                        <div className="text-xl md:text-2xl font-bold text-gray-900">
                          {filteredSessions.length}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-3 md:p-4">
                        <div className="text-[10px] md:text-xs text-gray-600 mb-1 uppercase tracking-wide">Avg duration</div>
                        <div className="text-xl md:text-2xl font-bold text-gray-900">
                          {filteredSessions.length > 0 ? Math.round(filteredSessions.reduce((sum, s) => sum + s.duration, 0) / filteredSessions.length / 60) : 0}m
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-3 md:p-4">
                        <div className="text-[10px] md:text-xs text-gray-600 mb-1 uppercase tracking-wide">Current streak</div>
                        <div className="text-xl md:text-2xl font-bold text-gray-900">
                          {stats?.currentStreak || 0}
                        </div>
                      </div>
                    </div>

                    {/* Main Chart */}
                    <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-4 md:p-6">
                      <div className="mb-4">
                        <h3 className="text-base md:text-lg font-medium text-gray-900">Hours Tracked</h3>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">
                          {timePeriod === '7D' && 'Daily activity over the past week'}
                          {timePeriod === '2W' && 'Daily activity over the past 2 weeks'}
                          {timePeriod === '4W' && 'Weekly activity over the past month'}
                          {timePeriod === '3M' && 'Monthly activity over the past 3 months'}
                          {timePeriod === '1Y' && 'Monthly activity over the past year'}
                        </p>
                      </div>
                      <div className="h-64 md:h-80">
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
                  </>
                )}

                {activeTab === 'trends' && (
                  <div className="space-y-4 md:space-y-6">
                    {/* Weekly Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-3 md:p-4">
                        <div className="text-[10px] md:text-xs text-gray-600 mb-1 uppercase tracking-wide">This week</div>
                        <div className="text-xl md:text-2xl font-bold text-gray-900">
                          {stats?.weeklyHours?.toFixed(1) || '0'}h
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-3 md:p-4">
                        <div className="text-[10px] md:text-xs text-gray-600 mb-1 uppercase tracking-wide">Weekly sessions</div>
                        <div className="text-xl md:text-2xl font-bold text-gray-900">
                          {stats?.sessionsThisWeek || 0}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-3 md:p-4">
                        <div className="text-[10px] md:text-xs text-gray-600 mb-1 uppercase tracking-wide">Active days</div>
                        <div className="text-xl md:text-2xl font-bold text-gray-900">
                          {chartData.slice(-7).filter(d => d.hours > 0).length}
                        </div>
                      </div>
                    </div>

                    {/* Trends Chart */}
                    <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-4 md:p-6">
                      <h3 className="text-base md:text-lg font-medium text-gray-900 mb-4">Productivity Trends</h3>
                      <div className="h-64 md:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
                          >
                            <defs>
                              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#007AFF" stopOpacity={0.2}/>
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
                            />
                            <Area
                              type="monotone"
                              dataKey="hours"
                              stroke="none"
                              fill="url(#trendGradient)"
                            />
                            <Line
                              type="monotone"
                              dataKey="hours"
                              stroke="#007AFF"
                              strokeWidth={3}
                              dot={false}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'activities' && (
                  <div className="space-y-4 md:space-y-6">
                    {/* Activity Breakdown */}
                    <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-4 md:p-6">
                      <h3 className="text-base md:text-lg font-medium text-gray-900 mb-4">Activity Breakdown</h3>
                      {activityBreakdown.length > 0 ? (
                        <div className="space-y-3">
                          {activityBreakdown.map((activity, index) => {
                            const totalHours = activityBreakdown.reduce((sum, a) => sum + a.hours, 0);
                            const percentage = totalHours > 0 ? (activity.hours / totalHours) * 100 : 0;

                            return (
                              <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activity.color }}></div>
                                    <span className="font-medium text-gray-900">{activity.name}</span>
                                  </div>
                                  <div className="text-gray-600">
                                    <span className="font-semibold">{activity.hours.toFixed(1)}h</span>
                                    <span className="text-xs ml-2">({percentage.toFixed(0)}%)</span>
                                  </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all"
                                    style={{ width: `${percentage}%`, backgroundColor: activity.color }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {activity.sessions} session{activity.sessions !== 1 ? 's' : ''}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <p>No activity data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'insights' && (
                  <div className="space-y-4 md:space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg md:rounded-xl border border-blue-200 p-4 md:p-6">
                        <h3 className="text-sm md:text-base font-medium text-gray-900 mb-2">Total Progress</h3>
                        <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
                          {stats?.totalHours?.toFixed(1) || '0'}h
                        </div>
                        <p className="text-xs md:text-sm text-gray-600">
                          Across {filteredSessions.length} sessions
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg md:rounded-xl border border-green-200 p-4 md:p-6">
                        <h3 className="text-sm md:text-base font-medium text-gray-900 mb-2">Current Streak</h3>
                        <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
                          {stats?.currentStreak || 0} days
                        </div>
                        <p className="text-xs md:text-sm text-gray-600">
                          Best: {stats?.longestStreak || 0} days
                        </p>
                      </div>
                    </div>

                    {/* Additional Insights */}
                    <div className="bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 p-4 md:p-6">
                      <h3 className="text-base md:text-lg font-medium text-gray-900 mb-4">Performance Summary</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                          <span className="text-sm text-gray-600">Average Session Length</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {filteredSessions.length > 0
                              ? Math.round(filteredSessions.reduce((sum, s) => sum + s.duration, 0) / filteredSessions.length / 60)
                              : 0}m
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                          <span className="text-sm text-gray-600">Total Sessions</span>
                          <span className="text-sm font-semibold text-gray-900">{filteredSessions.length}</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <span className="text-sm text-gray-600">Active Activities</span>
                          <span className="text-sm font-semibold text-gray-900">{activityBreakdown.length}</span>
                        </div>
                      </div>
                    </div>
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

        {/* Footer - Desktop only */}
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
