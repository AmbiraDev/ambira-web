'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Target, Calendar, Heart, ChevronDown } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { firebaseSessionApi } from '@/lib/api';
import { Session } from '@/types';

interface ProjectProgressViewProps {
  projectId: string;
}

type TimePeriod = 'day' | 'week' | 'month' | 'year';

interface ChartDataPoint {
  name: string;
  hours: number;
}

export const ProjectProgressView: React.FC<ProjectProgressViewProps> = ({
  projectId,
}) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await firebaseSessionApi.getSessions(500, {
        projectId,
      });
      setSessions(response.sessions);
    } catch {
      console.error('Failed to load sessions');
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const processChartData = useCallback(() => {
    const now = new Date();
    const data: ChartDataPoint[] = [];

    if (timePeriod === 'day') {
      // Last 24 hours by hour
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now);
        hour.setHours(hour.getHours() - i);
        const hourLabel = hour.getHours().toString().padStart(2, '0');

        const hoursWorked =
          sessions.length > 0
            ? sessions
                .filter(s => {
                  const sessionDate = new Date(s.startTime);
                  return (
                    sessionDate.getHours() === hour.getHours() &&
                    sessionDate.toDateString() === hour.toDateString()
                  );
                })
                .reduce((sum, s) => sum + s.duration / 3600, 0)
            : 0;

        data.push({ name: hourLabel, hours: Number(hoursWorked.toFixed(2)) });
      }
    } else if (timePeriod === 'week') {
      // Last 7 days
      const dayNames = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);

        const hoursWorked =
          sessions.length > 0
            ? sessions
                .filter(
                  s =>
                    new Date(s.startTime).toDateString() === day.toDateString()
                )
                .reduce((sum, s) => sum + s.duration / 3600, 0)
            : 0;

        data.push({
          name: dayNames[(7 - i) % 7] || '',
          hours: Number(hoursWorked.toFixed(2)),
        });
      }
    } else if (timePeriod === 'month') {
      // Last 30 days grouped by week
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);

        const hoursWorked =
          sessions.length > 0
            ? sessions
                .filter(s => {
                  const sessionDate = new Date(s.startTime);
                  return sessionDate >= weekStart && sessionDate <= weekEnd;
                })
                .reduce((sum, s) => sum + s.duration / 3600, 0)
            : 0;

        data.push({
          name: `Week ${4 - i}`,
          hours: Number(hoursWorked.toFixed(2)),
        });
      }
    } else if (timePeriod === 'year') {
      // Last 12 months
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
      ];
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(month.getMonth() - i);

        const hoursWorked =
          sessions.length > 0
            ? sessions
                .filter(s => {
                  const sessionDate = new Date(s.startTime);
                  return (
                    sessionDate.getMonth() === month.getMonth() &&
                    sessionDate.getFullYear() === month.getFullYear()
                  );
                })
                .reduce((sum, s) => sum + s.duration / 3600, 0)
            : 0;

        data.push({
          name: monthNames[month.getMonth()] || '',
          hours: Number(hoursWorked.toFixed(2)),
        });
      }
    }

    setChartData(data);
  }, [sessions, timePeriod]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    processChartData();
  }, [processChartData]);

  // Calculate stats
  const totalHours = sessions.reduce((sum, s) => sum + s.duration / 3600, 0);
  const totalSessions = sessions.length;

  // Calculate streak
  const sessionsByDate = new Map<string, boolean>();
  sessions.forEach(s => {
    const date = new Date(s.startTime);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split('T')[0] ?? '';
    if (dateStr) {
      sessionsByDate.set(dateStr, true);
    }
  });

  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(today);

  while (true) {
    const dateStr: string = checkDate.toISOString().split('T')[0] ?? '';
    if (!sessionsByDate.has(dateStr)) {
      break;
    }
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const avgPerDay =
    totalHours > 0 && sessions.length > 0
      ? (totalHours / 30).toFixed(1)
      : '0.0';

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
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
            {totalHours.toFixed(1)}h
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
            {currentStreak} days
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
            {totalSessions}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-600">Avg/Day</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{avgPerDay}h</div>
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
                {(['day', 'week', 'month', 'year'] as TimePeriod[]).map(
                  period => (
                    <button
                      key={period}
                      onClick={() => {
                        setTimePeriod(period);
                        setShowTimePeriodDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        timePeriod === period
                          ? 'text-[#007AFF] font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  )
                )}
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
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value}h`, 'Hours']}
              />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#007AFF"
                strokeWidth={2}
                isAnimationActive={false}
                dot={(props: {
                  cx?: number;
                  cy?: number;
                  index?: number;
                  payload?: ChartDataPoint;
                }) => {
                  const { cx, cy, index, payload } = props;
                  const isLast = index === chartData.length - 1;
                  return (
                    <circle
                      key={`dot-${index}-${payload?.name || 'unknown'}`}
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
        <div className="text-center py-8 text-gray-400">
          No activity data yet
        </div>
      </div>
    </div>
  );
};
