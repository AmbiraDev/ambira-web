'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Target, CheckSquare, TrendingUp, Calendar } from 'lucide-react';
import { ActivityChart } from './ActivityChart';
import { ProgressRing } from './ProgressRing';
import { AnalyticsPeriod } from '@/types';

interface ProjectAnalyticsProps {
  projectId: string;
  projectName: string;
}

const PERIODS: AnalyticsPeriod[] = [
  { label: '7D', value: '7d', days: 7 },
  { label: '1M', value: '1m', days: 30 },
  { label: '3M', value: '3m', days: 90 },
  { label: '6M', value: '6m', days: 180 },
  { label: '1Y', value: '1y', days: 365 },
  { label: 'All', value: 'all', days: 9999 }
];

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({
  projectId,
  projectName
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>(PERIODS[1]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - in real implementation, fetch from API
  const mockData = {
    totalHours: 125,
    weeklyAverage: 8.5,
    sessionCount: 42,
    taskCompletionRate: 78,
    goalProgress: {
      current: 125,
      target: 200,
      percentage: 62.5,
      estimatedCompletion: new Date('2025-11-15')
    },
    cumulativeHours: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      return {
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.floor(Math.random() * 3) + (i * 4)
      };
    }),
    sessionFrequency: Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (12 - i) * 7);
      return {
        label: `Week ${i + 1}`,
        value: Math.floor(Math.random() * 8) + 2
      };
    })
  };

  useEffect(() => {
    setIsLoading(false);
  }, [projectId, selectedPeriod]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  const daysUntilGoal = mockData.goalProgress.estimatedCompletion
    ? Math.ceil((mockData.goalProgress.estimatedCompletion.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{projectName} Analytics</h2>
          <p className="text-gray-600">Detailed project insights and progress</p>
        </div>
        
        <div className="flex gap-2">
          {PERIODS.map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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

      {/* Key metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Total Hours</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{mockData.totalHours}</p>
          <p className="text-xs text-gray-500 mt-1">
            {mockData.weeklyAverage}h per week avg
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Sessions</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{mockData.sessionCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {(mockData.totalHours / mockData.sessionCount).toFixed(1)}h avg duration
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Task Rate</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{mockData.taskCompletionRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Completion rate</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-600">Weekly Avg</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{mockData.weeklyAverage}</p>
          <p className="text-xs text-gray-500 mt-1">hours per week</p>
        </div>
      </div>

      {/* Goal progress */}
      {mockData.goalProgress && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Progress</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockData.goalProgress.current}h / {mockData.goalProgress.target}h
                  </p>
                </div>
                
                {daysUntilGoal && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimated Completion</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {daysUntilGoal} days
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {mockData.goalProgress.estimatedCompletion.toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hours Remaining</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {mockData.goalProgress.target - mockData.goalProgress.current}h
                  </p>
                </div>
              </div>
            </div>
            
            <div className="ml-6">
              <ProgressRing
                progress={mockData.goalProgress.percentage}
                size={120}
                color="#3b82f6"
              />
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative hours */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cumulative Hours</h3>
            {mockData.goalProgress && (
              <div className="text-sm text-gray-500">
                Goal: {mockData.goalProgress.target}h
              </div>
            )}
          </div>
          <ActivityChart
            data={mockData.cumulativeHours}
            type="line"
            height={200}
            color="#3b82f6"
            valueFormatter={(v) => `${v}h`}
          />
          {mockData.goalProgress && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">On track!</span> At your current pace, you'll reach 
                your goal in {daysUntilGoal} days.
              </p>
            </div>
          )}
        </div>

        {/* Session frequency */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Frequency</h3>
          <ActivityChart
            data={mockData.sessionFrequency}
            type="bar"
            height={200}
            color="#10b981"
            valueFormatter={(v) => `${v} sessions`}
          />
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Average of <span className="font-semibold">
                {(mockData.sessionFrequency.reduce((sum, d) => sum + d.value, 0) / mockData.sessionFrequency.length).toFixed(1)} sessions
              </span> per week
            </p>
          </div>
        </div>
      </div>

      {/* Task completion insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Completion Rate</p>
            <p className="text-4xl font-bold text-green-600">{mockData.taskCompletionRate}%</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Tasks per Session</p>
            <p className="text-4xl font-bold text-blue-600">
              {(mockData.taskCompletionRate / mockData.sessionCount * 10).toFixed(1)}
            </p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Productivity Score</p>
            <p className="text-4xl font-bold text-purple-600">
              {Math.round((mockData.taskCompletionRate + mockData.weeklyAverage * 5) / 2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
