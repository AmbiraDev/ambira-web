'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ComposedChart,
  Area,
} from 'recharts';
import { ActivityChartTooltip } from './ActivityChartTooltip';

type TimePeriod = '7D' | '2W' | '4W' | '3M' | '1Y';

interface ChartDataPoint {
  name: string;
  hours: number;
  sessions: number;
  avgDuration: number;
}

interface CalculatedStats {
  totalHours: number;
  sessions: number;
  avgDuration: number;
  activeDays: number;
}

interface ActivityAnalyticsProps {
  chartData: ChartDataPoint[];
  calculatedStats: CalculatedStats;
  timePeriod: TimePeriod;
  chartType: 'bar' | 'line';
  isLoading: boolean;
  onTimePeriodChange: (period: TimePeriod) => void;
  onChartTypeChange: (type: 'bar' | 'line') => void;
}

export function ActivityAnalytics({
  chartData,
  calculatedStats,
  timePeriod,
  chartType,
  isLoading,
  onTimePeriodChange,
  onChartTypeChange,
}: ActivityAnalyticsProps) {
  const [showChartTypeDropdown, setShowChartTypeDropdown] =
    React.useState(false);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header with controls */}
      <div className="flex items-center justify-end gap-2 mb-6">
        {/* Time Period Buttons */}
        {(['7D', '2W', '4W', '3M', '1Y'] as TimePeriod[]).map(period => (
          <button
            key={period}
            onClick={() => onTimePeriodChange(period)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              timePeriod === period
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {period}
          </button>
        ))}

        {/* Chart Type Selector */}
        <div className="relative">
          <button
            onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              {chartType === 'bar' ? (
                <>
                  <rect x="2" y="8" width="3" height="6" rx="0.5" />
                  <rect x="6.5" y="4" width="3" height="10" rx="0.5" />
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
                    onChartTypeChange('bar');
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
                    <rect x="6.5" y="4" width="3" height="10" rx="0.5" />
                    <rect x="11" y="6" width="3" height="8" rx="0.5" />
                  </svg>
                  Bar
                </button>
                <button
                  onClick={() => {
                    onChartTypeChange('line');
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
            <h3 className="font-semibold text-gray-900">Hours completed</h3>
          </div>
          <div className="h-72">
            {isLoading ? (
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
                    <Tooltip content={<ActivityChartTooltip />} />
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
                    <Tooltip content={<ActivityChartTooltip />} />
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
                    <Tooltip content={<ActivityChartTooltip />} />
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
                    <Tooltip content={<ActivityChartTooltip />} />
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
                    <Tooltip content={<ActivityChartTooltip />} />
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
                    <Tooltip content={<ActivityChartTooltip />} />
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
            <div className="text-sm text-gray-600 mb-2">Total Hours</div>
            <div className="text-2xl font-bold mb-1">
              {calculatedStats.totalHours.toFixed(1)}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-2">Avg Duration</div>
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
            <div className="text-sm text-gray-600 mb-2">Active Days</div>
            <div className="text-2xl font-bold mb-1">
              {calculatedStats.activeDays}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
