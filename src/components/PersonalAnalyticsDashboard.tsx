'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Target,
  CheckSquare,
  Flame,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { StatsCard } from './StatsCard';
import { ActivityChart } from './ActivityChart';
import { HeatmapCalendar } from './HeatmapCalendar';
import { AnalyticsPeriod, Session } from '@/types';
import { firebaseSessionApi } from '@/lib/api';

interface PersonalAnalyticsDashboardProps {
  userId: string;
  projectId?: string;
}

const PERIODS: AnalyticsPeriod[] = [
  { label: '7 Days', value: '7d', days: 7 },
  { label: '1 Month', value: '1m', days: 30 },
  { label: '3 Months', value: '3m', days: 90 },
  { label: '6 Months', value: '6m', days: 180 },
  { label: '1 Year', value: '1y', days: 365 },
  { label: 'All Time', value: 'all', days: 9999 },
];

export const PersonalAnalyticsDashboard: React.FC<
  PersonalAnalyticsDashboardProps
> = ({ userId, projectId }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>(
    PERIODS[1]!
  ); // Default to 1 month
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters: unknown = {};
      if (projectId) {
        filters.projectId = projectId;
      }

      const response = await firebaseSessionApi.getSessions(1, 500, filters);

      // Filter by selected period
      const cutoffDate = new Date();
      if (selectedPeriod?.value !== 'all') {
        cutoffDate.setDate(cutoffDate.getDate() - (selectedPeriod?.days || 0));
      } else {
        cutoffDate.setFullYear(2000); // Get all sessions
      }

      const filteredSessions = response.sessions.filter(
        session =>
          new Date(session.createdAt) >= cutoffDate && session.userId === userId
      );

      setSessions(filteredSessions);
    } catch (_error) {
      console.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod, userId, projectId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const calculateAnalytics = () => {
    // Calculate total hours
    const totalSeconds = sessions.reduce(
      (sum, s) => sum + (s.duration || 0),
      0
    );
    const totalHours = totalSeconds / 3600;

    // Calculate sessions
    const totalSessions = sessions.length;

    // Calculate tasks (tasks tracking not implemented at session level)
    const totalTasks = 0;

    // Calculate average session duration in minutes
    const averageSessionDuration =
      totalSessions > 0 ? totalSeconds / totalSessions / 60 : 0;

    // Calculate streak
    const sortedSessions = [...sessions].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionsByDate = new Map<string, boolean>();
    sortedSessions.forEach(s => {
      const date = new Date(s.createdAt);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0] || '';
      sessionsByDate.set(dateStr, true);
    });

    // Calculate current streak
    const checkDate = new Date(today);
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0] || '';
      if (sessionsByDate.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    const allDates = Array.from(sessionsByDate.keys()).sort().reverse();
    tempStreak = 0;
    let lastDate: Date | null = null;

    allDates.forEach(dateStr => {
      const date = new Date(dateStr);
      if (!lastDate) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round(
          (lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      lastDate = date;
    });
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate activity by day of week
    const activityByDay = [
      { day: 'Sun', hours: 0, sessions: 0 },
      { day: 'Mon', hours: 0, sessions: 0 },
      { day: 'Tue', hours: 0, sessions: 0 },
      { day: 'Wed', hours: 0, sessions: 0 },
      { day: 'Thu', hours: 0, sessions: 0 },
      { day: 'Fri', hours: 0, sessions: 0 },
      { day: 'Sat', hours: 0, sessions: 0 },
    ];

    sessions.forEach(s => {
      const dayOfWeek = new Date(s.createdAt).getDay();
      if (activityByDay[dayOfWeek]) {
        activityByDay[dayOfWeek].hours += (s.duration || 0) / 3600;
        activityByDay[dayOfWeek].sessions += 1;
      }
    });

    // Calculate activity by hour
    const activityByHour = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sessions: 0,
    }));

    sessions.forEach(s => {
      const hour = new Date(s.createdAt).getHours();
      if (activityByHour[hour]) {
        activityByHour[hour].sessions += 1;
      }
    });

    // Most productive day
    const maxDayActivity = Math.max(...activityByDay.map(d => d.hours));
    const mostProductiveDay =
      activityByDay.find(d => d.hours === maxDayActivity)?.day || 'N/A';

    // Most productive hour
    const maxHourActivity = Math.max(...activityByHour.map(h => h.sessions));
    const mostProductiveHour =
      activityByHour.find(h => h.sessions === maxHourActivity)?.hour || 0;

    // Generate heatmap data
    const heatmapData: Array<{ date: string; value: number }> = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    for (let i = 0; i < 90; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0] || '';

      const daySessions = sessions.filter(s => {
        const sessionDate =
          new Date(s.createdAt).toISOString().split('T')[0] || '';
        return sessionDate === dateStr;
      });

      const dayHours =
        daySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 3600;
      heatmapData.push({ date: dateStr, value: dayHours });
    }

    // Calculate comparison with previous period (mock for now)
    const previousHours = totalHours * 0.8;
    const previousSessions = Math.floor(totalSessions * 0.85);
    const previousTasks = Math.floor(totalTasks * 0.9);

    const hoursChange = totalHours - previousHours;
    const hoursChangePercent =
      previousHours > 0 ? (hoursChange / previousHours) * 100 : 0;

    const sessionsChange = totalSessions - previousSessions;
    const sessionsChangePercent =
      previousSessions > 0 ? (sessionsChange / previousSessions) * 100 : 0;

    const tasksChange = totalTasks - previousTasks;
    const tasksChangePercent =
      previousTasks > 0 ? (tasksChange / previousTasks) * 100 : 0;

    return {
      totalHours: {
        current: totalHours,
        previous: previousHours,
        change: hoursChange,
        changePercent: hoursChangePercent,
        isPositive: hoursChange >= 0,
      },
      totalSessions: {
        current: totalSessions,
        previous: previousSessions,
        change: sessionsChange,
        changePercent: sessionsChangePercent,
        isPositive: sessionsChange >= 0,
      },
      totalTasks: {
        current: totalTasks,
        previous: previousTasks,
        change: tasksChange,
        changePercent: tasksChangePercent,
        isPositive: tasksChange >= 0,
      },
      averageSessionDuration,
      currentStreak,
      longestStreak,
      mostProductiveDay,
      mostProductiveHour,
      activityByDay,
      activityByHour,
      heatmapData,
    };
  };

  const mockData = calculateAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {projectId ? 'Project Analytics' : 'Personal Analytics'}
          </h2>
          <p className="text-gray-600">
            {projectId
              ? 'Track your project progress and activity'
              : 'Track your productivity and progress'}
          </p>
        </div>

        <div className="flex gap-2">
          {PERIODS.map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod.value === period.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Hours"
          value={mockData.totalHours.current}
          icon={Clock}
          trend={{
            value: mockData.totalHours.changePercent,
            isPositive: mockData.totalHours.isPositive,
          }}
          subtitle={`${mockData.totalHours.change.toFixed(1)}h more than last period`}
          color="blue"
        />

        <StatsCard
          title="Sessions"
          value={mockData.totalSessions.current}
          icon={Target}
          trend={{
            value: mockData.totalSessions.changePercent,
            isPositive: mockData.totalSessions.isPositive,
          }}
          subtitle={`Avg ${mockData.averageSessionDuration.toFixed(0)} min per session`}
          color="green"
        />

        <StatsCard
          title="Tasks Completed"
          value={mockData.totalTasks.current}
          icon={CheckSquare}
          trend={{
            value: mockData.totalTasks.changePercent,
            isPositive: mockData.totalTasks.isPositive,
          }}
          color="purple"
        />

        <StatsCard
          title="Current Streak"
          value={`${mockData.currentStreak} days`}
          icon={Flame}
          subtitle={`Best: ${mockData.longestStreak} days`}
          color="orange"
        />
      </div>

      {/* Activity heatmap */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Activity Overview
        </h3>
        <HeatmapCalendar data={mockData.heatmapData} months={3} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity by day */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Activity by Day
          </h3>
          <ActivityChart
            data={mockData.activityByDay.map(d => ({
              label: d.day,
              value: d.hours,
              secondaryValue: d.sessions,
            }))}
            type="bar"
            height={200}
            valueFormatter={v => `${v}h`}
          />
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600">Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">Sessions</span>
            </div>
          </div>
        </div>

        {/* Activity by hour */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Activity by Hour
          </h3>
          <ActivityChart
            data={mockData.activityByHour
              .filter(d => d.sessions > 0)
              .map(d => ({
                label: `${d.hour}:00`,
                value: d.sessions,
              }))}
            type="line"
            height={200}
            valueFormatter={v => `${v} sessions`}
          />
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Most Productive Day</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {mockData.mostProductiveDay}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            You tend to be most productive on {mockData.mostProductiveDay}s
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Peak Hours</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {mockData.mostProductiveHour}:00 - {mockData.mostProductiveHour + 1}
            :00
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Your most productive time of day
          </p>
        </div>
      </div>
    </div>
  );
};
