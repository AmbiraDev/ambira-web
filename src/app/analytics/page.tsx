'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivities } from '@/hooks/useActivitiesQuery';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import Footer from '@/components/Footer';
import Header from '@/components/HeaderComponent';
import { useUserSessions } from '@/features/sessions/hooks';
import { useProfileStats } from '@/features/profile/hooks';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, ComposedChart, Area } from 'recharts';
import { ChevronDown, BarChart3, TrendingUp, Activity } from 'lucide-react';
import { IconRenderer } from '@/components/IconRenderer';
import { useRouter } from 'next/navigation';
import { safeNumber } from '@/lib/utils';

type TimePeriod = '7D' | '2W' | '4W' | '3M' | '1Y';

interface ChartDataPoint {
  name: string;
  hours: number;
  sessions: number;
  avgDuration: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7D');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line'>(() => {
    // Load chart type from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('analyticsChartType');
      return (saved === 'bar' || saved === 'line') ? saved : 'bar';
    }
    return 'bar';
  });
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false);

  // Refs for dropdown trigger buttons (for focus management)
  const activityTriggerRef = useRef<HTMLButtonElement>(null);
  const chartTypeTriggerRef = useRef<HTMLButtonElement>(null);

  // Save chart type to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('analyticsChartType', chartType);
    }
  }, [chartType]);

  // Handle Escape key for Activity dropdown
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showProjectDropdown) {
        setShowProjectDropdown(false);
        // Return focus to the trigger button
        activityTriggerRef.current?.focus();
      }
    };

    if (showProjectDropdown) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showProjectDropdown]);

  // Handle Escape key for Chart Type dropdown
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showChartTypeDropdown) {
        setShowChartTypeDropdown(false);
        // Return focus to the trigger button
        chartTypeTriggerRef.current?.focus();
      }
    };

    if (showChartTypeDropdown) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showChartTypeDropdown]);

  // Use new feature hooks for sessions and stats
  const { data: sessions = [], isLoading: sessionsLoading } = useUserSessions(user?.id || '', 100, {
    enabled: !!user?.id,
  });
  const { data: stats = null, isLoading: statsLoading } = useProfileStats(user?.id || '', {
    enabled: !!user?.id,
  });
  const { data: activities = [] } = useActivities(user?.id);

  const isLoading = sessionsLoading || statsLoading;

  // Debug logging for activities

  const filteredSessions = useMemo(() => {
    if (selectedProjectId === 'all') {
      return sessions;
    }

    // Filter by both activityId and projectId for backward compatibility
    const filtered = sessions.filter(s => {
      const matchesActivityId = s.activityId === selectedProjectId;
      const matchesProjectId = s.projectId === selectedProjectId;
      return matchesActivityId || matchesProjectId;
    });

    return filtered;
  }, [sessions, selectedProjectId]);

  const calculatedStats = useMemo(() => {
    const now = new Date();

    // Helper to get date range based on time period
    const getDateRange = (period: TimePeriod) => {
      const end = new Date(now);
      const start = new Date(now);

      switch (period) {
        case '7D':
          start.setDate(now.getDate() - 7);
          break;
        case '2W':
          start.setDate(now.getDate() - 14);
          break;
        case '4W':
          start.setDate(now.getDate() - 28);
          break;
        case '3M':
          start.setMonth(now.getMonth() - 3);
          break;
        case '1Y':
          start.setFullYear(now.getFullYear() - 1);
          break;
      }

      return { start, end };
    };

    // Get current and previous period ranges
    const currentRange = getDateRange(timePeriod);
    const previousStart = new Date(currentRange.start);
    const periodLength = currentRange.end.getTime() - currentRange.start.getTime();
    previousStart.setTime(previousStart.getTime() - periodLength);

    // Filter sessions for current period
    const currentPeriodSessions = filteredSessions.filter(s => {
      const sessionDate = new Date(s.createdAt);
      return sessionDate >= currentRange.start && sessionDate <= currentRange.end;
    });

    // Filter sessions for previous period
    const previousPeriodSessions = filteredSessions.filter(s => {
      const sessionDate = new Date(s.createdAt);
      return sessionDate >= previousStart && sessionDate < currentRange.start;
    });

    // Calculate current period stats
    const currentHours = currentPeriodSessions.reduce((sum, s) => sum + s.duration / 3600, 0);
    const currentSessionCount = currentPeriodSessions.length;
    const currentAvgDuration = currentSessionCount > 0
      ? currentPeriodSessions.reduce((sum, s) => sum + s.duration, 0) / currentSessionCount / 60
      : 0;

    const currentActiveDays = new Set(
      currentPeriodSessions.map(s => new Date(s.createdAt).toDateString())
    ).size;

    // Calculate previous period stats
    const previousHours = previousPeriodSessions.reduce((sum, s) => sum + s.duration / 3600, 0);
    const previousSessionCount = previousPeriodSessions.length;
    const previousAvgDuration = previousSessionCount > 0
      ? previousPeriodSessions.reduce((sum, s) => sum + s.duration, 0) / previousSessionCount / 60
      : 0;

    const previousActiveDays = new Set(
      previousPeriodSessions.map(s => new Date(s.createdAt).toDateString())
    ).size;

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number | null => {
      if (previous === 0) return null; // No previous data
      return ((current - previous) / previous) * 100;
    };

    const hoursChange = calculateChange(currentHours, previousHours);
    const sessionsChange = calculateChange(currentSessionCount, previousSessionCount);
    const avgDurationChange = calculateChange(currentAvgDuration, previousAvgDuration);
    const activeDaysChange = calculateChange(currentActiveDays, previousActiveDays);

    return {
      totalHours: currentHours,
      sessions: currentSessionCount,
      avgDuration: Math.round(currentAvgDuration),
      currentStreak: stats?.currentStreak || 0,
      longestStreak: stats?.longestStreak || 0,
      activeDays: currentActiveDays,
      activities: activities?.length || 0,

      // Percentage changes
      hoursChange,
      sessionsChange,
      avgDurationChange,
      activeDaysChange,
      activitiesChange: null, // Activities count doesn't have time-based comparison
      streakChange: null, // Streaks don't have meaningful percentage changes
    };
  }, [filteredSessions, stats, activities, timePeriod]);

  const chartData = useMemo(() => {
    if (!filteredSessions) return [];
    const now = new Date();
    const data: ChartDataPoint[] = [];

    if (timePeriod === '7D') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const daySessions = filteredSessions.filter(s => new Date(s.createdAt).toDateString() === day.toDateString());
        const hoursWorked = daySessions.reduce((sum, s) => sum + s.duration / 3600, 0);
        const avgDuration = daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + s.duration, 0) / daySessions.length / 60
          : 0;
        data.push({
          name: `${dayNames[day.getDay()].slice(0, 3)} ${day.getDate()}`,
          hours: Number(hoursWorked.toFixed(2)),
          sessions: daySessions.length,
          avgDuration: Math.round(avgDuration)
        });
      }
    } else if (timePeriod === '2W') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 13; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const daySessions = filteredSessions.filter(s => new Date(s.createdAt).toDateString() === day.toDateString());
        const hoursWorked = daySessions.reduce((sum, s) => sum + s.duration / 3600, 0);
        const avgDuration = daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + s.duration, 0) / daySessions.length / 60
          : 0;
        data.push({
          name: `${dayNames[day.getDay()].slice(0, 3)} ${day.getDate()}`,
          hours: safeNumber(hoursWorked.toFixed(2)),
          sessions: daySessions.length,
          avgDuration: Math.round(avgDuration)
        });
      }
    } else if (timePeriod === '4W') {
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekSessions = filteredSessions.filter(s => {
          const sessionDate = new Date(s.createdAt);
          return sessionDate >= weekStart && sessionDate <= weekEnd;
        });
        const hoursWorked = weekSessions.reduce((sum, s) => sum + s.duration / 3600, 0);
        const avgDuration = weekSessions.length > 0
          ? weekSessions.reduce((sum, s) => sum + s.duration, 0) / weekSessions.length / 60
          : 0;
        data.push({ name: `Week ${4 - i}`, hours: safeNumber(hoursWorked.toFixed(2)), sessions: weekSessions.length, avgDuration: Math.round(avgDuration) });
      }
    } else if (timePeriod === '3M' || timePeriod === '1Y') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthsBack = timePeriod === '3M' ? 2 : 11;
      for (let i = monthsBack; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(month.getMonth() - i);
        const monthSessions = filteredSessions.filter(s => {
          const sessionDate = new Date(s.createdAt);
          return sessionDate.getMonth() === month.getMonth() && sessionDate.getFullYear() === month.getFullYear();
        });
        const hoursWorked = monthSessions.reduce((sum, s) => sum + s.duration / 3600, 0);
        const avgDuration = monthSessions.length > 0
          ? monthSessions.reduce((sum, s) => sum + s.duration, 0) / monthSessions.length / 60
          : 0;
        data.push({ name: monthNames[month.getMonth()], hours: safeNumber(hoursWorked.toFixed(2)), sessions: monthSessions.length, avgDuration: Math.round(avgDuration) });
      }
    }
    return data;
  }, [filteredSessions, timePeriod]);

  // Average duration over time data - extract from chartData
  const avgDurationData = useMemo(() => {
    return chartData.map(d => ({ name: d.name, value: d.avgDuration }));
  }, [chartData]);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-semibold">{entry.name}</span>: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Empty state component for charts
  const ChartEmptyState = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="h-full flex items-center justify-center" role="status" aria-label={`No data: ${title}`}>
      <div className="text-center max-w-md px-4">
        <Icon className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm md:text-base text-gray-600 mb-4">{description}</p>
        <button
          onClick={() => router.push('/timer')}
          className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0051D5] transition-colors duration-200 font-semibold text-sm md:text-base shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2"
          aria-label="Start tracking your first session"
        >
          <Activity className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
          Start Your First Session
        </button>
      </div>
    </div>
  );

  // Helper to render percentage change
  const renderPercentageChange = (change: number | null) => {
    if (change === null) return null;

    const isPositive = change >= 0;
    const formattedChange = Math.abs(change).toFixed(0);

    return (
      <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '↑' : '↓'} {formattedChange}%
      </div>
    );
  };

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <div className="hidden md:block"><Header /></div>
        <div className="md:hidden"><MobileHeader title="Analytics" /></div>

        <div className="pb-20 md:pb-8">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
            {/* Header - Desktop only */}
            <div className="hidden md:block mb-4">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Analytics</h1>
            </div>

            {/* Controls */}
            <div className="space-y-3 mb-6">
              {/* Row 1: Activity Selector & Chart Type */}
              <div className="flex items-center gap-2">
                {/* Activity Selector */}
                <div className="relative flex-shrink-0">
                  <button
                    ref={activityTriggerRef}
                    onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] min-w-[140px] max-w-[200px]"
                    aria-label="Select activity to filter analytics"
                    aria-expanded={showProjectDropdown}
                    aria-haspopup="listbox"
                  >
                    <span className="truncate">{selectedProjectId === 'all' ? 'All activities' : activities?.find(p => p.id === selectedProjectId)?.name || 'All activities'}</span>
                    <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                  </button>
                  {showProjectDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProjectDropdown(false)} />
                      <div className="absolute left-0 top-full mt-2 w-full max-w-xs bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-64 overflow-y-auto" role="listbox">
                        <button
                          onClick={() => { setSelectedProjectId('all'); setShowProjectDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-inset focus:bg-blue-50 ${selectedProjectId === 'all' ? 'bg-blue-50 text-blue-600' : ''}`}
                          role="option"
                          aria-selected={selectedProjectId === 'all'}
                        >
                          All
                        </button>
                        {(!activities || activities.length === 0) && <div className="px-4 py-2 text-xs text-gray-400">No activities yet</div>}
                        {activities?.map((activity) => (
                          <button
                            key={activity.id}
                            onClick={() => { setSelectedProjectId(activity.id); setShowProjectDropdown(false); }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-inset focus:bg-blue-50 flex items-center gap-3 ${selectedProjectId === activity.id ? 'bg-blue-50 text-blue-600' : ''}`}
                            role="option"
                            aria-selected={selectedProjectId === activity.id}
                            aria-label={`Filter by ${activity.name}`}
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: activity.color + '20' }}
                            >
                              <IconRenderer iconName={activity.icon} size={18} />
                            </div>
                            <span className="truncate">{activity.name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Chart Type Selector */}
                <div className="relative flex-shrink-0">
                  <button
                    ref={chartTypeTriggerRef}
                    onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}
                    className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]"
                    aria-label="Select chart type for analytics visualization"
                    aria-expanded={showChartTypeDropdown}
                    aria-haspopup="listbox"
                  >
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 16 16" fill="currentColor">
                      {chartType === 'bar' ? (
                        <>
                          <rect x="2" y="8" width="3" height="6" rx="0.5"/>
                          <rect x="6.5" y="4" width="3" height="10" rx="0.5"/>
                          <rect x="11" y="6" width="3" height="8" rx="0.5"/>
                        </>
                      ) : (
                        <path d="M2 12 L5 8 L8 10 L11 4 L14 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      )}
                    </svg>
                    <span className="capitalize">{chartType}</span>
                    <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                  {showChartTypeDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowChartTypeDropdown(false)} />
                      <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50" role="listbox">
                        <button
                          onClick={() => { setChartType('bar'); setShowChartTypeDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-inset focus:bg-blue-50 flex items-center gap-2 ${chartType === 'bar' ? 'bg-blue-50 text-blue-600' : ''}`}
                          role="option"
                          aria-selected={chartType === 'bar'}
                          aria-label="Display charts as bar charts"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                            <rect x="2" y="8" width="3" height="6" rx="0.5"/>
                            <rect x="6.5" y="4" width="3" height="10" rx="0.5"/>
                            <rect x="11" y="6" width="3" height="8" rx="0.5"/>
                          </svg>
                          Bar
                        </button>
                        <button
                          onClick={() => { setChartType('line'); setShowChartTypeDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-inset focus:bg-blue-50 flex items-center gap-2 ${chartType === 'line' ? 'bg-blue-50 text-blue-600' : ''}`}
                          role="option"
                          aria-selected={chartType === 'line'}
                          aria-label="Display charts as line charts"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                            <path d="M2 12 L5 8 L8 10 L11 4 L14 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Line
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Row 2: Time Period Buttons - Scrollable on mobile */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0" role="group" aria-label="Time period selection">
                {(['7D', '2W', '4W', '3M', '1Y'] as TimePeriod[]).map((period) => {
                  const ariaLabels: Record<TimePeriod, string> = {
                    '7D': 'Last 7 days',
                    '2W': 'Last 2 weeks',
                    '4W': 'Last 4 weeks',
                    '3M': 'Last 3 months',
                    '1Y': 'Last 1 year'
                  };
                  return (
                    <button
                      key={period}
                      onClick={() => setTimePeriod(period)}
                      className={`flex-shrink-0 px-4 md:px-5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] ${
                        timePeriod === period ? 'bg-gray-900 text-white focus:ring-offset-2' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 focus:border-[#007AFF]'
                      }`}
                      aria-label={ariaLabels[period]}
                      aria-pressed={timePeriod === period}
                    >
                      {period}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {/* Main Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">Hours completed</h3>
                </div>
                <div className="h-72">
                  {isLoading ? (
                    <div className="h-full bg-gray-50 rounded animate-pulse" />
                  ) : chartData.length === 0 || chartData.every(d => d.hours === 0) ? (
                    <ChartEmptyState
                      icon={BarChart3}
                      title="No session data yet"
                      description="Start tracking your productive sessions to see your hours visualized over time. Your progress will appear here!"
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'bar' ? (
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: '#666' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 12, fill: '#666' }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="hours" fill="#007AFF" radius={[4, 4, 0, 0]} name="Hours" />
                        </BarChart>
                      ) : (
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: '#666' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 12, fill: '#666' }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="hours"
                            stroke="#007AFF"
                            strokeWidth={2}
                            fill="url(#colorHours)"
                            name="Hours"
                          />
                        </ComposedChart>
                      )}
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Second Row - Two Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Average Session Duration */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900">Average session duration</h3>
                  </div>
                  <div className="h-48">
                    {avgDurationData.length === 0 || avgDurationData.every(d => d.value === 0) ? (
                      <ChartEmptyState
                        icon={TrendingUp}
                        title="No duration data"
                        description="Track sessions to see your average session duration trends and improve your productivity!"
                      />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                          <BarChart data={avgDurationData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" fill="#34C759" radius={[4, 4, 0, 0]} name="Minutes" />
                          </BarChart>
                        ) : (
                          <ComposedChart data={avgDurationData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorAvgDuration" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34C759" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#34C759" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#34C759"
                              strokeWidth={2}
                              fill="url(#colorAvgDuration)"
                              name="Minutes"
                            />
                          </ComposedChart>
                        )}
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Sessions */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900">Sessions completed</h3>
                  </div>
                  <div className="h-48">
                    {chartData.length === 0 || chartData.every(d => d.sessions === 0) ? (
                      <ChartEmptyState
                        icon={Activity}
                        title="No sessions tracked"
                        description="Complete your first session to start building your productivity streak and track your progress!"
                      />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="sessions" fill="#34C759" radius={[4, 4, 0, 0]} name="Sessions" />
                          </BarChart>
                        ) : (
                          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorSessionsSmall" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34C759" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#34C759" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                              type="monotone"
                              dataKey="sessions"
                              stroke="#34C759"
                              strokeWidth={2}
                              fill="url(#colorSessionsSmall)"
                              name="Sessions"
                            />
                          </ComposedChart>
                        )}
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid - 5 columns */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Total Hours</div>
                  <div className="text-2xl font-bold mb-1">{calculatedStats.totalHours.toFixed(1)}</div>
                  {renderPercentageChange(calculatedStats.hoursChange)}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Avg Duration</div>
                  <div className="text-2xl font-bold mb-1">{calculatedStats.avgDuration}m</div>
                  {renderPercentageChange(calculatedStats.avgDurationChange)}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Sessions</div>
                  <div className="text-2xl font-bold mb-1">{calculatedStats.sessions}</div>
                  {renderPercentageChange(calculatedStats.sessionsChange)}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Active Days</div>
                  <div className="text-2xl font-bold mb-1">{calculatedStats.activeDays}</div>
                  {renderPercentageChange(calculatedStats.activeDaysChange)}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Activities</div>
                  <div className="text-2xl font-bold mb-1">{calculatedStats.activities}</div>
                  {renderPercentageChange(calculatedStats.activitiesChange)}
                </div>
              </div>

              {/* Secondary Stats Grid - Streaks */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Current Streak</div>
                  <div className="text-2xl font-bold mb-1">{calculatedStats.currentStreak}</div>
                  {renderPercentageChange(calculatedStats.streakChange)}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Longest Streak</div>
                  <div className="text-2xl font-bold mb-1">{calculatedStats.longestStreak}</div>
                  {renderPercentageChange(calculatedStats.streakChange)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden"><BottomNavigation /></div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
