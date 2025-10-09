'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseSessionApi } from '@/lib/firebaseApi';
import { Session } from '@/types';

type TimePeriod = 'week' | 'month';

interface ChartDataPoint {
  name: string;
  hours: number;
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
                .filter((s) => {
                  const sessionDate = new Date(s.startTime);
                  sessionDate.setHours(0, 0, 0, 0);
                  return sessionDate.getTime() === day.getTime();
                })
                .reduce((sum, s) => sum + s.duration / 3600, 0)
            : 0;

        data.push({
          name: dayNames[day.getDay()],
          hours: Number(hoursWorked.toFixed(1)),
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
                .filter((s) => {
                  const sessionDate = new Date(s.startTime);
                  return sessionDate >= weekStart && sessionDate <= weekEnd;
                })
                .reduce((sum, s) => sum + s.duration / 3600, 0)
            : 0;

        data.push({
          name: `W${4 - i}`,
          hours: Number(hoursWorked.toFixed(1)),
        });
      }
    }

    setChartData(data);
  };

  const totalHours = sessions.reduce((sum, s) => sum + s.duration / 3600, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      {/* Header with dropdown */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Activity</h3>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            {timePeriod === 'week' ? 'Week' : 'Month'}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-1 w-24 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={() => {
                  setTimePeriod('week');
                  setShowDropdown(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${
                  timePeriod === 'week' ? 'text-[#007AFF] font-medium' : 'text-gray-700'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => {
                  setTimePeriod('month');
                  setShowDropdown(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${
                  timePeriod === 'month' ? 'text-[#007AFF] font-medium' : 'text-gray-700'
                }`}
              >
                Month
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Total hours stat */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900">{totalHours.toFixed(1)}h</div>
        <div className="text-sm text-gray-500">Total time</div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-48 bg-gray-100 rounded animate-pulse"></div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#007AFF"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default SidebarActivityGraph;
