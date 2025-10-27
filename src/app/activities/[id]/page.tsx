'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import { IconRenderer } from '@/components/IconRenderer';
import { useAuth } from '@/hooks/useAuth';
import { useActivities, useActivityStats } from '@/hooks/useActivitiesQuery';
import { firebaseApi } from '@/lib/api';
import { Activity, ActivityStats, SessionWithDetails } from '@/types';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Calendar,
  TrendingUp,
  Settings,
  ChevronDown,
  Play,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ComposedChart,
  Area,
} from 'recharts';
import { SessionCard } from '@/components/SessionCard';
import { firebaseApi as api } from '@/lib/api';

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

type ActivityTab = 'sessions' | 'analytics';
type TimePeriod = '7D' | '2W' | '4W' | '3M' | '1Y';

interface ChartDataPoint {
  name: string;
  hours: number;
  sessions: number;
  avgDuration: number;
}

function ProjectDetailContent({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: projects = [] } = useActivities(user?.id);
  const { data: stats, isLoading: isLoadingStats } =
    useActivityStats(projectId);

  const [project, setProject] = useState<Activity | null>(null);
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [activeTab, setActiveTab] = useState<ActivityTab>('analytics');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7D');
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'line'>(() => {
    // Load chart type from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('analyticsChartType');
      return saved === 'bar' || saved === 'line' ? saved : 'bar';
    }
    return 'bar';
  });
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false);

  // Save chart type to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('analyticsChartType', chartType);
    }
  }, [chartType]);

  useEffect(() => {
    loadProjectData();
  }, [projectId, projects]);

  useEffect(() => {
    processChartData();
  }, [sessions, timePeriod]);

  const loadProjectData = async () => {
    try {
      setIsLoading(true);

      // Find project in context
      const foundProject = projects?.find(p => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
      }

      // Load sessions
      setIsLoadingSessions(true);
      try {
        if (user?.id) {
          const userSessions = await firebaseApi.session.getUserSessions(
            user.id,
            50,
            true
          );
          // Filter sessions for this project
          const projectSessions = userSessions.filter(
            s => s.activityId === projectId || s.projectId === projectId
          );
          setSessions(projectSessions as SessionWithDetails[]);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setIsLoadingSessions(false);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processChartData = () => {
    const now = new Date();
    const data: ChartDataPoint[] = [];

    if (timePeriod === '7D') {
      const dayNames = [
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
      ] as const;
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const dayIndex = day.getDay();
        const dayName = (dayNames[dayIndex] || 'Day') as string;
        const daySessions = sessions.filter(
          s => new Date(s.createdAt).toDateString() === day.toDateString()
        );
        const hoursWorked = daySessions.reduce(
          (sum, s) => sum + s.duration / 3600,
          0
        );
        const avgDuration =
          daySessions.length > 0
            ? daySessions.reduce((sum, s) => sum + s.duration, 0) /
              daySessions.length /
              60
            : 0;
        data.push({
          name: `${dayName.slice(0, 3)} ${day.getDate()}`,
          hours: Number(hoursWorked.toFixed(2)),
          sessions: daySessions.length,
          avgDuration: Math.round(avgDuration),
        });
      }
    } else if (timePeriod === '2W') {
      const dayNames = [
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
      ] as const;
      for (let i = 13; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const dayIndex = day.getDay();
        const dayName = (dayNames[dayIndex] || 'Day') as string;
        const daySessions = sessions.filter(
          s => new Date(s.createdAt).toDateString() === day.toDateString()
        );
        const hoursWorked = daySessions.reduce(
          (sum, s) => sum + s.duration / 3600,
          0
        );
        const avgDuration =
          daySessions.length > 0
            ? daySessions.reduce((sum, s) => sum + s.duration, 0) /
              daySessions.length /
              60
            : 0;
        data.push({
          name: `${dayName.slice(0, 3)} ${day.getDate()}`,
          hours: Number(hoursWorked.toFixed(2)),
          sessions: daySessions.length,
          avgDuration: Math.round(avgDuration),
        });
      }
    } else if (timePeriod === '4W') {
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const weekSessions = sessions.filter(s => {
          const sessionDate = new Date(s.createdAt);
          return sessionDate >= weekStart && sessionDate <= weekEnd;
        });
        const hoursWorked = weekSessions.reduce(
          (sum, s) => sum + s.duration / 3600,
          0
        );
        const avgDuration =
          weekSessions.length > 0
            ? weekSessions.reduce((sum, s) => sum + s.duration, 0) /
              weekSessions.length /
              60
            : 0;
        data.push({
          name: `Week ${4 - i}`,
          hours: Number(hoursWorked.toFixed(2)),
          sessions: weekSessions.length,
          avgDuration: Math.round(avgDuration),
        });
      }
    } else if (timePeriod === '3M' || timePeriod === '1Y') {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ] as const;
      const monthsBack = timePeriod === '3M' ? 2 : 11;
      for (let i = monthsBack; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(month.getMonth() - i);
        const monthIndex = month.getMonth();
        const monthName = (monthNames[monthIndex] || 'Month') as string;
        const monthSessions = sessions.filter(s => {
          const sessionDate = new Date(s.createdAt);
          return (
            sessionDate.getMonth() === month.getMonth() &&
            sessionDate.getFullYear() === month.getFullYear()
          );
        });
        const hoursWorked = monthSessions.reduce(
          (sum, s) => sum + s.duration / 3600,
          0
        );
        const avgDuration =
          monthSessions.length > 0
            ? monthSessions.reduce((sum, s) => sum + s.duration, 0) /
              monthSessions.length /
              60
            : 0;
        data.push({
          name: monthName,
          hours: Number(hoursWorked.toFixed(2)),
          sessions: monthSessions.length,
          avgDuration: Math.round(avgDuration),
        });
      }
    }

    setChartData(data);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  };

  // Session handlers for SessionCard
  const handleSupport = async (sessionId: string) => {
    // TODO: Re-implement when API is fixed
  };

  const handleRemoveSupport = async (sessionId: string) => {
    // TODO: Re-implement when API is fixed
  };

  const handleShare = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const shareData = {
      title: session.title || 'Focus Session',
      text: session.description || 'Check out my focus session on Ambira!',
      url: `${window.location.origin}/sessions/${sessionId}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

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

  const calculatedStats = React.useMemo(() => {
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

    const currentRange = getDateRange(timePeriod);
    const periodSessions = sessions.filter(s => {
      const sessionDate = new Date(s.createdAt);
      return (
        sessionDate >= currentRange.start && sessionDate <= currentRange.end
      );
    });

    const totalHours = periodSessions.reduce(
      (sum, s) => sum + s.duration / 3600,
      0
    );
    const sessionCount = periodSessions.length;
    const avgDuration =
      sessionCount > 0
        ? periodSessions.reduce((sum, s) => sum + s.duration, 0) /
          sessionCount /
          60
        : 0;

    const activeDays = new Set(
      periodSessions.map(s => new Date(s.createdAt).toDateString())
    ).size;

    return {
      totalHours,
      sessions: sessionCount,
      avgDuration: Math.round(avgDuration),
      activeDays,
    };
  }, [sessions, timePeriod]);

  if (isLoading || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const weeklyProgress =
    project.weeklyTarget && stats
      ? (stats.weeklyHours / project.weeklyTarget) * 100
      : 0;
  const totalProgress =
    project.totalTarget && stats
      ? (stats.totalHours / project.totalTarget) * 100
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/activities')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Activities</span>
        </button>

        {/* Main Content */}
        <div className="flex-1">
          {/* Activity Header */}
          <div className="mb-6">
            <div className="flex items-start gap-4">
              {/* Activity Icon */}
              <div className="w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md bg-gray-100">
                <IconRenderer iconName={project.icon} size={64} />
              </div>

              <div className="flex-1 min-w-0">
                {/* Activity Name and Settings Icon */}
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {project.name}
                  </h1>
                  <button
                    onClick={() => router.push(`/activities/${projectId}/edit`)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Edit activity"
                  >
                    <Settings className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-gray-700 mb-4 whitespace-pre-line max-h-24 overflow-y-auto">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex gap-8" aria-label="Activity tabs">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'sessions'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Sessions
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'analytics' && (
              <div className="max-w-5xl mx-auto">
                {/* Header with controls */}
                <div className="flex items-center justify-end gap-2 mb-6">
                  {/* Time Period Buttons */}
                  {(['7D', '2W', '4W', '3M', '1Y'] as TimePeriod[]).map(
                    period => (
                      <button
                        key={period}
                        onClick={() => setTimePeriod(period)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          timePeriod === period
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        {period}
                      </button>
                    )
                  )}

                  {/* Chart Type Selector */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowChartTypeDropdown(!showChartTypeDropdown)
                      }
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        {chartType === 'bar' ? (
                          <>
                            <rect x="2" y="8" width="3" height="6" rx="0.5" />
                            <rect
                              x="6.5"
                              y="4"
                              width="3"
                              height="10"
                              rx="0.5"
                            />
                            <rect x="11" y="6" width="3" height="8" rx="0.5" />
                          </>
                        ) : (
                          <path
                            d="M2 12 L5 8 L8 10 L11 4 L14 6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                      </svg>
                      <span className="capitalize">{chartType}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showChartTypeDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowChartTypeDropdown(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                          <button
                            onClick={() => {
                              setChartType('bar');
                              setShowChartTypeDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${chartType === 'bar' ? 'bg-blue-50 text-blue-600' : ''}`}
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                            >
                              <rect x="2" y="8" width="3" height="6" rx="0.5" />
                              <rect
                                x="6.5"
                                y="4"
                                width="3"
                                height="10"
                                rx="0.5"
                              />
                              <rect
                                x="11"
                                y="6"
                                width="3"
                                height="8"
                                rx="0.5"
                              />
                            </svg>
                            Bar
                          </button>
                          <button
                            onClick={() => {
                              setChartType('line');
                              setShowChartTypeDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${chartType === 'line' ? 'bg-blue-50 text-blue-600' : ''}`}
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                            >
                              <path
                                d="M2 12 L5 8 L8 10 L11 4 L14 6"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Line
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Main Chart */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900">
                        Hours completed
                      </h3>
                    </div>
                    <div className="h-72">
                      {isLoadingSessions ? (
                        <div className="h-full bg-gray-50 rounded animate-pulse" />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'bar' ? (
                            <BarChart
                              data={chartData}
                              margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                              }}
                            >
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
                              <Bar
                                dataKey="hours"
                                fill="#1D9BF0"
                                radius={[4, 4, 0, 0]}
                                name="Hours"
                              />
                            </BarChart>
                          ) : (
                            <ComposedChart
                              data={chartData}
                              margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                              }}
                            >
                              <defs>
                                <linearGradient
                                  id="colorHours"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#1D9BF0"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#1D9BF0"
                                    stopOpacity={0}
                                  />
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
                                stroke="#1D9BF0"
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
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900">
                          Average session duration
                        </h3>
                      </div>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'bar' ? (
                            <BarChart
                              data={chartData}
                              margin={{
                                top: 5,
                                right: 5,
                                left: -30,
                                bottom: 0,
                              }}
                            >
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar
                                dataKey="avgDuration"
                                fill="#00BA7C"
                                radius={[4, 4, 0, 0]}
                                name="Minutes"
                              />
                            </BarChart>
                          ) : (
                            <ComposedChart
                              data={chartData}
                              margin={{
                                top: 5,
                                right: 5,
                                left: -30,
                                bottom: 0,
                              }}
                            >
                              <defs>
                                <linearGradient
                                  id="colorAvgDuration"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#00BA7C"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#00BA7C"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Area
                                type="monotone"
                                dataKey="avgDuration"
                                stroke="#00BA7C"
                                strokeWidth={2}
                                fill="url(#colorAvgDuration)"
                                name="Minutes"
                              />
                            </ComposedChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Sessions completed */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900">
                          Sessions completed
                        </h3>
                      </div>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'bar' ? (
                            <BarChart
                              data={chartData}
                              margin={{
                                top: 5,
                                right: 5,
                                left: -30,
                                bottom: 0,
                              }}
                            >
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar
                                dataKey="sessions"
                                fill="#00BA7C"
                                radius={[4, 4, 0, 0]}
                                name="Sessions"
                              />
                            </BarChart>
                          ) : (
                            <ComposedChart
                              data={chartData}
                              margin={{
                                top: 5,
                                right: 5,
                                left: -30,
                                bottom: 0,
                              }}
                            >
                              <defs>
                                <linearGradient
                                  id="colorSessionsSmall"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#00BA7C"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#00BA7C"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Area
                                type="monotone"
                                dataKey="sessions"
                                stroke="#00BA7C"
                                strokeWidth={2}
                                fill="url(#colorSessionsSmall)"
                                name="Sessions"
                              />
                            </ComposedChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid - 4 columns */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2">
                        Total Hours
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {calculatedStats.totalHours.toFixed(1)}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2">
                        Avg Duration
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {calculatedStats.avgDuration}m
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2">Sessions</div>
                      <div className="text-2xl font-bold mb-1">
                        {calculatedStats.sessions}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2">
                        Active Days
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {calculatedStats.activeDays}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="max-w-3xl mx-auto">
                {isLoadingSessions ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
                      >
                        <div className="h-20 bg-gray-100 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="text-gray-400 mb-2">
                      <Clock className="w-12 h-12 mx-auto mb-4" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No sessions yet
                    </h3>
                    <p className="text-gray-600">
                      Start tracking time on this activity to see sessions here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {sessions.map(session => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        onSupport={handleSupport}
                        onRemoveSupport={handleRemoveSupport}
                        onShare={handleShare}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPageWrapper({
  params,
}: ProjectDetailPageProps) {
  const [projectId, setProjectId] = React.useState<string>('');

  React.useEffect(() => {
    params.then(({ id }) => setProjectId(id));
  }, [params]);

  return (
    <ProtectedRoute>
      {!projectId ? (
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-[1400px] mx-auto px-4 py-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        <ProjectDetailContent projectId={projectId} />
      )}
    </ProtectedRoute>
  );
}
