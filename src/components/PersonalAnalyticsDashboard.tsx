'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Target, CheckSquare, Flame, Calendar, TrendingUp } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { ActivityChart } from './ActivityChart';
import { HeatmapCalendar } from './HeatmapCalendar';
import { StreakDisplay } from './StreakDisplay';
import { AnalyticsPeriod } from '@/types';

interface PersonalAnalyticsDashboardProps {
  userId: string;
}

const PERIODS: AnalyticsPeriod[] = [
  { label: '7 Days', value: '7d', days: 7 },
  { label: '1 Month', value: '1m', days: 30 },
  { label: '3 Months', value: '3m', days: 90 },
  { label: '6 Months', value: '6m', days: 180 },
  { label: '1 Year', value: '1y', days: 365 },
  { label: 'All Time', value: 'all', days: 9999 }
];

export const PersonalAnalyticsDashboard: React.FC<PersonalAnalyticsDashboardProps> = ({
  userId
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>(PERIODS[1]); // Default to 1 month
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - in real implementation, fetch from API
  const mockData = {
    totalHours: { current: 42, previous: 35, change: 7, changePercent: 20, isPositive: true },
    totalSessions: { current: 28, previous: 24, change: 4, changePercent: 16.7, isPositive: true },
    totalTasks: { current: 156, previous: 142, change: 14, changePercent: 9.9, isPositive: true },
    averageSessionDuration: 90, // minutes
    currentStreak: 7,
    longestStreak: 14,
    mostProductiveDay: 'Tuesday',
    mostProductiveHour: 14,
    activityByDay: [
      { day: 'Mon', hours: 6, sessions: 4 },
      { day: 'Tue', hours: 8, sessions: 5 },
      { day: 'Wed', hours: 5, sessions: 3 },
      { day: 'Thu', hours: 7, sessions: 4 },
      { day: 'Fri', hours: 6, sessions: 4 },
      { day: 'Sat', hours: 4, sessions: 2 },
      { day: 'Sun', hours: 6, sessions: 6 }
    ],
    activityByHour: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sessions: i >= 9 && i <= 17 ? Math.floor(Math.random() * 5) + 1 : 0
    })),
    heatmapData: Array.from({ length: 90 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (90 - i));
      return {
        date: date.toISOString().split('T')[0],
        value: Math.random() > 0.3 ? Math.floor(Math.random() * 8) + 1 : 0
      };
    })
  };

  useEffect(() => {
    // Simulate loading
    setIsLoading(false);
  }, [selectedPeriod, userId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
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
          <h2 className="text-2xl font-bold text-gray-900">Personal Analytics</h2>
          <p className="text-gray-600">Track your productivity and progress</p>
        </div>
        
        <div className="flex gap-2">
          {PERIODS.map((period) => (
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
            isPositive: mockData.totalHours.isPositive
          }}
          subtitle={`${mockData.totalHours.change}h more than last period`}
          color="blue"
        />
        
        <StatsCard
          title="Sessions"
          value={mockData.totalSessions.current}
          icon={Target}
          trend={{
            value: mockData.totalSessions.changePercent,
            isPositive: mockData.totalSessions.isPositive
          }}
          subtitle={`Avg ${mockData.averageSessionDuration} min per session`}
          color="green"
        />
        
        <StatsCard
          title="Tasks Completed"
          value={mockData.totalTasks.current}
          icon={CheckSquare}
          trend={{
            value: mockData.totalTasks.changePercent,
            isPositive: mockData.totalTasks.isPositive
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Overview</h3>
        <HeatmapCalendar data={mockData.heatmapData} months={3} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity by day */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity by Day</h3>
          <ActivityChart
            data={mockData.activityByDay.map(d => ({
              label: d.day,
              value: d.hours,
              secondaryValue: d.sessions
            }))}
            type="bar"
            height={200}
            valueFormatter={(v) => `${v}h`}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity by Hour</h3>
          <ActivityChart
            data={mockData.activityByHour
              .filter(d => d.sessions > 0)
              .map(d => ({
                label: `${d.hour}:00`,
                value: d.sessions
              }))}
            type="line"
            height={200}
            valueFormatter={(v) => `${v} sessions`}
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
          <p className="text-2xl font-bold text-blue-600">{mockData.mostProductiveDay}</p>
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
            {mockData.mostProductiveHour}:00 - {mockData.mostProductiveHour + 1}:00
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Your most productive time of day
          </p>
        </div>
      </div>
    </div>
  );
};
