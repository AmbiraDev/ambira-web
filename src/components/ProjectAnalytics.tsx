'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Target, TrendingUp, BarChart3 } from 'lucide-react';
import { ActivityChart } from './ActivityChart';
import { ProgressRing } from './ProgressRing';
import { AnalyticsPeriod, ProjectStats } from '@/types';
import { firebaseProjectApi, firebaseSessionApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';

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

interface ProjectAnalyticsData {
  totalHours: number;
  weeklyAverage: number;
  sessionCount: number;
  averageSessionDuration: number;
  goalProgress: {
    current: number;
    target: number | null;
    percentage: number;
    estimatedCompletion: Date | null;
  };
  cumulativeHours: Array<{ label: string; value: number }>;
  sessionFrequency: Array<{ label: string; value: number }>;
}

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({
  projectId,
  projectName
}) => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>(PERIODS[1]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<ProjectAnalyticsData | null>(null);

  const loadAnalyticsData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Get project stats
      const projectStats = await firebaseProjectApi.getProjectStats(projectId);
      
      // Get sessions for this project within the selected period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - selectedPeriod.days);
      
      const sessions = await firebaseSessionApi.getSessionsByProject(projectId, {
        dateFrom: startDate,
        dateTo: endDate
      });

      // Calculate cumulative hours data
      const dailyHours: Record<string, number> = {};
      let cumulativeTotal = 0;
      
      sessions.forEach(session => {
        const sessionDate = new Date(session.createdAt);
        const dateKey = sessionDate.toISOString().split('T')[0];
        dailyHours[dateKey] = (dailyHours[dateKey] || 0) + (session.duration / 3600);
      });

      // Generate cumulative hours chart data
      const cumulativeHours = [];
      for (let i = selectedPeriod.days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        const dailyHour = dailyHours[dateKey] || 0;
        cumulativeTotal += dailyHour;
        
        cumulativeHours.push({
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(cumulativeTotal * 10) / 10
        });
      }

      // Generate session frequency data (weekly)
      const weeklyData: Record<string, number> = {};
      sessions.forEach(session => {
        const sessionDate = new Date(session.createdAt);
        const weekStart = new Date(sessionDate);
        weekStart.setDate(sessionDate.getDate() - sessionDate.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
      });

      const sessionFrequency = Object.entries(weeklyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12) // Last 12 weeks
        .map(([weekKey, count], index) => ({
          label: `Week ${index + 1}`,
          value: count
        }));

      // Calculate goal progress
      const totalHours = projectStats.totalHours;
      const goalProgress = {
        current: totalHours,
        target: projectStats.totalTarget || null,
        percentage: projectStats.totalTarget ? (totalHours / projectStats.totalTarget) * 100 : 0,
        estimatedCompletion: projectStats.totalTarget && projectStats.weeklyHours > 0 
          ? new Date(Date.now() + ((projectStats.totalTarget - totalHours) / projectStats.weeklyHours) * 7 * 24 * 60 * 60 * 1000)
          : null
      };

      setAnalyticsData({
        totalHours: Math.round(totalHours * 10) / 10,
        weeklyAverage: Math.round(projectStats.weeklyHours * 10) / 10,
        sessionCount: sessions.length,
        averageSessionDuration: sessions.length > 0 
          ? Math.round((sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length / 60) * 10) / 10
          : 0,
        goalProgress,
        cumulativeHours,
        sessionFrequency: sessionFrequency.length > 0 ? sessionFrequency : [
          { label: 'This Week', value: sessions.length }
        ]
      });
      
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      // Fallback to basic data
      setAnalyticsData({
        totalHours: 0,
        weeklyAverage: 0,
        sessionCount: 0,
        averageSessionDuration: 0,
        goalProgress: { current: 0, target: null, percentage: 0, estimatedCompletion: null },
        cumulativeHours: [{ label: 'Today', value: 0 }],
        sessionFrequency: [{ label: 'This Week', value: 0 }]
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [projectId, selectedPeriod, user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const daysUntilGoal = analyticsData.goalProgress.estimatedCompletion
    ? Math.ceil((analyticsData.goalProgress.estimatedCompletion.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{projectName} Analytics</h2>
          <p className="text-gray-600">Detailed project insights and progress</p>
        </div>
        
        <div className="flex gap-1">
          {PERIODS.map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod.value === period.value
                  ? 'bg-gray-900 text-white'
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
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Total Hours</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analyticsData.totalHours}</p>
          <p className="text-xs text-gray-500 mt-1">
            {analyticsData.weeklyAverage}h per week avg
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Sessions</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analyticsData.sessionCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {analyticsData.averageSessionDuration}min avg duration
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Goal Progress</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {analyticsData.goalProgress.target ? `${Math.round(analyticsData.goalProgress.percentage)}%` : 'No Goal'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {analyticsData.goalProgress.target ? `${analyticsData.goalProgress.current}h / ${analyticsData.goalProgress.target}h` : 'Set a target goal'}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Weekly Avg</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analyticsData.weeklyAverage}</p>
          <p className="text-xs text-gray-500 mt-1">hours per week</p>
        </div>
      </div>

      {/* Goal progress */}
      {analyticsData.goalProgress.target && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Progress</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.goalProgress.current}h / {analyticsData.goalProgress.target}h
                  </p>
                </div>
                
                {daysUntilGoal && daysUntilGoal > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimated Completion</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {daysUntilGoal} days
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {analyticsData.goalProgress.estimatedCompletion?.toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hours Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.max(0, analyticsData.goalProgress.target - analyticsData.goalProgress.current)}h
                  </p>
                </div>
              </div>
            </div>
            
            <div className="ml-6">
              <ProgressRing
                progress={Math.min(analyticsData.goalProgress.percentage, 100)}
                size={120}
                color="#374151"
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
            {analyticsData.goalProgress.target && (
              <div className="text-sm text-gray-500">
                Goal: {analyticsData.goalProgress.target}h
              </div>
            )}
          </div>
          <ActivityChart
            data={analyticsData.cumulativeHours}
            type="line"
            height={240}
            color="#374151"
            valueFormatter={(v) => `${v}h`}
          />
          {analyticsData.goalProgress.target && daysUntilGoal && daysUntilGoal > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                At your current pace, you'll reach your goal in <span className="font-semibold">{daysUntilGoal} days</span>.
              </p>
            </div>
          )}
        </div>

        {/* Session frequency */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Frequency</h3>
          <ActivityChart
            data={analyticsData.sessionFrequency}
            type="bar"
            height={240}
            color="#6B7280"
            valueFormatter={(v) => `${v} sessions`}
          />
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Average of <span className="font-semibold">
                {analyticsData.sessionFrequency.length > 0 
                  ? (analyticsData.sessionFrequency.reduce((sum, d) => sum + d.value, 0) / analyticsData.sessionFrequency.length).toFixed(1)
                  : '0'
                } sessions
              </span> per week
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
