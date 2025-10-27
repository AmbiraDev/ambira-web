'use client';

import React, { useState, useEffect } from 'react';
import { GroupStats } from '@/types';
import { BarChart3, TrendingUp, Users, Clock, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface GroupAnalyticsProps {
  groupId: string;
  stats: GroupStats | null | undefined;
}

export default function GroupAnalytics({
  groupId,
  stats,
}: GroupAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>(
    'month'
  );
  const [analyticsData, setAnalyticsData] = useState<{
    hoursData: Array<{ date: string; hours: number; members: number }>;
    membershipGrowth: Array<{ date: string; members: number }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [groupId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const { firebaseApi } = await import('@/lib/api');
      const data = await firebaseApi.group.getGroupAnalytics(
        groupId,
        timeRange
      );
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hoursData = analyticsData?.hoursData || [];
  const membershipGrowth = analyticsData?.membershipGrowth || [];

  const projectDistribution =
    stats?.topProjects.slice(0, 5).map(project => ({
      name:
        project.projectName.length > 15
          ? project.projectName.substring(0, 15) + '...'
          : project.projectName,
      hours: project.hours,
      members: project.memberCount,
    })) || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Time Range Selector */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Activity Over Time
          </h3>
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Hours Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hoursData}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="#007AFF"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHours)"
                name="Hours"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Membership Growth */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Membership Growth
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={membershipGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="members"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
                name="Members"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Projects */}
      {projectDistribution.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Projects by Hours
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  style={{ fontSize: '11px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="hours"
                  fill="#8b5cf6"
                  radius={[8, 8, 0, 0]}
                  name="Hours"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Group Insights</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>
                  Average{' '}
                  {(
                    (stats?.totalHours || 0) / (stats?.totalMembers || 1)
                  ).toFixed(1)}{' '}
                  hours per member
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>
                  {stats?.activeMembers || 0} active members this month (
                  {Math.round(
                    ((stats?.activeMembers || 0) / (stats?.totalMembers || 1)) *
                      100
                  )}
                  % of total)
                </span>
              </li>
              {stats?.topProjects &&
                stats.topProjects.length > 0 &&
                stats.topProjects[0] && (
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>
                      Most popular project: {stats.topProjects[0]?.projectName}{' '}
                      ({stats.topProjects[0]?.hours.toFixed(1)} hours)
                    </span>
                  </li>
                )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
