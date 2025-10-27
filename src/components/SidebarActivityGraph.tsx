'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  ComposedChart,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { firebaseSessionApi } from '@/lib/api';
import { Session } from '@/types';

type TimePeriod = 'week' | 'month';

interface ChartDataPoint {
  name: string;
  hours: number;
  isToday?: boolean;
}

function SidebarActivityGraph() {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [showDropdown, setShowDropdown] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    loadSessions();
  }, [user]);

  useEffect(() => {
    processChartData();
  }, [sessions, timePeriod]);

  const loadSessions = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await firebaseSessionApi.getSessions(1, 500, {});
      setSessions(response.sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const processChartData = () => {
    const now = new Date();
    const data: ChartDataPoint[] = [];

    if (timePeriod === 'week') {
      // Last 7 days
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        day.setHours(0, 0, 0, 0);

        const hoursWorked =
          sessions.length > 0
            ? sessions
                .filter(s => {
                  const sessionDate = new Date(s.createdAt);
                  sessionDate.setHours(0, 0, 0, 0);
                  return sessionDate.getTime() === day.getTime();
                })
                .reduce((sum, s) => sum + s.duration / 3600, 0)
            : 0;

        data.push({
          name: dayNames[day.getDay()] || '',
          hours: Number(hoursWorked.toFixed(1)),
          isToday: i === 0,
        });
      }
    } else if (timePeriod === 'month') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        weekEnd.setHours(23, 59, 59, 999);

        const hoursWorked =
          sessions.length > 0
            ? sessions
                .filter(s => {
                  const sessionDate = new Date(s.createdAt);
                  return sessionDate >= weekStart && sessionDate <= weekEnd;
                })
                .reduce((sum, s) => sum + s.duration / 3600, 0)
            : 0;

        data.push({
          name: `W${4 - i}`,
          hours: Number(hoursWorked.toFixed(1)),
          isToday: i === 0,
        });
      }
    }

    setChartData(data);
  };

  return (
    <div className="p-6">
      {/* Header with dropdown */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {timePeriod === 'week' ? 'This Week' : 'This Month'}
        </h3>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
          >
            {timePeriod === 'week' ? 'Week' : 'Month'}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            />
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-28 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={() => {
                  setTimePeriod('week');
                  setShowDropdown(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  timePeriod === 'week'
                    ? 'text-[#007AFF] font-semibold bg-blue-50'
                    : 'text-gray-700'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => {
                  setTimePeriod('month');
                  setShowDropdown(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  timePeriod === 'month'
                    ? 'text-[#007AFF] font-semibold bg-blue-50'
                    : 'text-gray-700'
                }`}
              >
                Month
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-52 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl animate-pulse"></div>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007AFF" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={35}
                domain={[0, 'dataMax + 0.5']}
                tickFormatter={value => value.toFixed(1)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: 'white',
                }}
                labelStyle={{ color: 'white', marginBottom: '4px' }}
                formatter={(value: any) => [`${value.toFixed(1)} hrs`, 'Time']}
                cursor={{
                  stroke: '#e5e7eb',
                  strokeWidth: 1,
                  strokeDasharray: '3 3',
                }}
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
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 8,
                  fill: '#007AFF',
                  stroke: 'white',
                  strokeWidth: 3,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default SidebarActivityGraph;
