'use client';

import React, { useEffect, useState } from 'react';
import { Flame, TrendingUp, Calendar, Target } from 'lucide-react';
import { firebaseApi } from '@/lib/api';
import { StreakStats as StreakStatsType } from '@/types';

interface StreakStatsProps {
  userId: string;
}

export const StreakStats: React.FC<StreakStatsProps> = ({ userId }) => {
  const [streakStats, setStreakStats] = useState<StreakStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStreak = async () => {
      try {
        const stats = await firebaseApi.streak.getStreakStats(userId);
        setStreakStats(stats);
      } catch {
      } finally {
        setIsLoading(false);
      }
    };

    loadStreak();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded mb-2"></div>
            <div className="w-16 h-6 bg-gray-200 rounded mb-1"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!streakStats) return null;

  const getStreakColor = () => {
    if (streakStats.currentStreak >= 100) return 'text-purple-600 bg-purple-50';
    if (streakStats.currentStreak >= 30) return 'text-blue-600 bg-blue-50';
    if (streakStats.currentStreak >= 7) return 'text-orange-600 bg-orange-50';
    return 'text-orange-500 bg-orange-50';
  };

  const progressToNextMilestone = streakStats.nextMilestone
    ? (streakStats.currentStreak / streakStats.nextMilestone) * 100
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Current Streak */}
        <div className={`rounded-lg p-4 ${getStreakColor()}`}>
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5" fill="currentColor" />
            <span className="text-sm font-medium">Current Streak</span>
          </div>
          <div className="text-3xl font-bold">{streakStats.currentStreak}</div>
          <div className="text-xs mt-1">
            {streakStats.currentStreak === 1 ? 'day' : 'days'}
          </div>
        </div>

        {/* Best Streak */}
        <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Best Streak</span>
          </div>
          <div className="text-3xl font-bold">{streakStats.longestStreak}</div>
          <div className="text-xs text-gray-500 mt-1">
            {streakStats.longestStreak === 1 ? 'day' : 'days'}
          </div>
        </div>

        {/* Total Streak Days */}
        <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Total Days</span>
          </div>
          <div className="text-3xl font-bold">
            {streakStats.totalStreakDays}
          </div>
          <div className="text-xs text-gray-500 mt-1">active days</div>
        </div>

        {/* Next Milestone */}
        <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5" />
            <span className="text-sm font-medium">Next Goal</span>
          </div>
          <div className="text-3xl font-bold">{streakStats.nextMilestone}</div>
          <div className="text-xs text-gray-500 mt-1">
            {streakStats.nextMilestone - streakStats.currentStreak} days to go
          </div>
        </div>
      </div>

      {/* Progress to Next Milestone */}
      {streakStats.nextMilestone > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress to {streakStats.nextMilestone} day milestone
            </span>
            <span className="text-sm font-bold text-gray-900">
              {Math.round(progressToNextMilestone)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressToNextMilestone}%` }}
            />
          </div>
        </div>
      )}

      {/* Streak Status */}
      {streakStats.streakAtRisk && streakStats.currentStreak > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <Flame className="w-5 h-5" />
            <span className="font-medium">Streak at risk!</span>
          </div>
          <p className="text-sm text-red-600 mt-1">
            Complete a session today to maintain your{' '}
            {streakStats.currentStreak} day streak.
          </p>
        </div>
      )}
    </div>
  );
};
