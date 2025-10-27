'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Target,
  CheckSquare,
  Flame,
  _TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { StatsCard } from './StatsCard';
import { ActivityChart } from './ActivityChart';
import Link from 'next/link';

interface AnalyticsWidgetProps {
  userId: string;
}

export const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - in real implementation, fetch from API
  const mockData = {
    thisWeek: {
      hours: 28,
      sessions: 18,
      tasks: 45,
      streak: 5,
    },
    trends: {
      hours: { value: 15, isPositive: true },
      sessions: { value: 12, isPositive: true },
      tasks: { value: 8, isPositive: true },
    },
    weeklyActivity: [
      { label: 'Mon', value: 4 },
      { label: 'Tue', value: 5 },
      { label: 'Wed', value: 3 },
      { label: 'Thu', value: 6 },
      { label: 'Fri', value: 5 },
      { label: 'Sat', value: 3 },
      { label: 'Sun', value: 2 },
    ],
  };

  useEffect(() => {
    // Simulate loading
    setIsLoading(false);
  }, [userId]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            This Week's Progress
          </h2>
          <p className="text-sm text-gray-600">Your productivity at a glance</p>
        </div>
        <Link
          href="/profile"
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {mockData.thisWeek.hours}
          </div>
          <div className="text-xs text-gray-600">Hours</div>
          <div className="text-xs text-green-600 font-medium mt-1">
            +{mockData.trends.hours.value}%
          </div>
        </div>

        <div className="text-center p-4 bg-green-50 rounded-lg">
          <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {mockData.thisWeek.sessions}
          </div>
          <div className="text-xs text-gray-600">Sessions</div>
          <div className="text-xs text-green-600 font-medium mt-1">
            +{mockData.trends.sessions.value}%
          </div>
        </div>

        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <CheckSquare className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {mockData.thisWeek.tasks}
          </div>
          <div className="text-xs text-gray-600">Tasks</div>
          <div className="text-xs text-green-600 font-medium mt-1">
            +{mockData.trends.tasks.value}%
          </div>
        </div>

        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <Flame className="w-6 h-6 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {mockData.thisWeek.streak}
          </div>
          <div className="text-xs text-gray-600">Day Streak</div>
          <div className="text-xs text-orange-600 font-medium mt-1">
            Keep it up!
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Daily Activity
        </h3>
        <ActivityChart
          data={mockData.weeklyActivity}
          type="bar"
          height={120}
          color="#3b82f6"
          valueFormatter={v => `${v}h`}
          showLabels={true}
        />
      </div>
    </div>
  );
};
