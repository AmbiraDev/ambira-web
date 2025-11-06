'use client';

import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { firebaseApi } from '@/lib/api';
import { StreakStats } from '@/types';
import Link from 'next/link';
import { WeekStreakCalendar } from './WeekStreakCalendar';

interface StreakCardProps {
  userId: string;
  variant?: 'default' | 'compact';
  showProgress?: boolean;
}

export const StreakCard: React.FC<StreakCardProps> = ({
  userId,
  variant = 'default',
  showProgress = true,
}) => {
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStreak = async () => {
      try {
        const stats = await firebaseApi.streak.getStreakStats(userId);

        // Fetch last 7 days of sessions for detailed logging
        const sessionsResponse = await firebaseApi.session.getSessions(100, {});

        // Get date 7 days ago at start of day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6); // Include today = 7 days total

        // Create a map of dates to sessions
        type SessionData = {
          duration: number;
          startTime: Date | string;
        };
        const dateMap = new Map<
          string,
          {
            totalMinutes: number;
            sessionCount: number;
            sessions: SessionData[];
          }
        >();

        // Initialize all 7 days
        for (let i = 0; i < 7; i++) {
          const date = new Date(sevenDaysAgo);
          date.setDate(sevenDaysAgo.getDate() + i);
          const dateKey = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
          dateMap.set(dateKey, {
            totalMinutes: 0,
            sessionCount: 0,
            sessions: [],
          });
        }

        // Filter sessions from last 7 days and group by date
        sessionsResponse.sessions.forEach((session: SessionData) => {
          const sessionDate = new Date(session.startTime);
          if (sessionDate >= sevenDaysAgo && sessionDate <= new Date()) {
            const dateKey = sessionDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            });
            const dayData = dateMap.get(dateKey);
            if (dayData) {
              dayData.totalMinutes += session.duration;
              dayData.sessionCount += 1;
              dayData.sessions.push(session);
            }
          }
        });

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
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!streakStats) return null;

  const getFlameColor = () => {
    // Grey flame when user has a streak but hasn't completed today's session
    if (streakStats.streakAtRisk && streakStats.currentStreak > 0)
      return 'text-gray-400';
    // Milestone-based colors for active streaks
    if (streakStats.currentStreak >= 100) return 'text-purple-500';
    if (streakStats.currentStreak >= 30) return 'text-blue-500';
    if (streakStats.currentStreak >= 7) return 'text-orange-500';
    // Default orange for new streaks
    return 'text-orange-400';
  };

  const getGradientColor = () => {
    if (streakStats.streakAtRisk && streakStats.currentStreak > 0)
      return 'from-gray-50 to-gray-100';
    if (streakStats.currentStreak >= 100) return 'from-purple-50 to-purple-100';
    if (streakStats.currentStreak >= 30) return 'from-blue-50 to-blue-100';
    if (streakStats.currentStreak >= 7) return 'from-orange-50 to-orange-100';
    return 'from-orange-50 to-orange-100';
  };

  const progressToNextMilestone = streakStats.nextMilestone
    ? (streakStats.currentStreak / streakStats.nextMilestone) * 100
    : 0;

  if (variant === 'compact') {
    return (
      <Link href="/analytics" className="block">
        <div className="p-3 hover:bg-gray-50 rounded-xl transition-all cursor-pointer">
          {/* Header */}
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Your streak
          </h3>

          {/* Flame icon and week calendar side by side */}
          <div className="flex items-center gap-3">
            {/* Left side - Flame with day count */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`${getFlameColor()} relative`}>
                <Flame className="w-10 h-10" fill="currentColor" />
              </div>
              <div className="text-sm font-medium text-gray-900 mt-0.5">
                {streakStats.currentStreak}
              </div>
              <div className="text-xs text-gray-500">
                Day{streakStats.currentStreak !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Right side - Week calendar */}
            <div className="flex-1">
              <WeekStreakCalendar userId={userId} />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br ${getGradientColor()} border border-gray-200 rounded-xl p-4 md:p-6`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`${getFlameColor()} relative`}>
            <Flame className="w-10 h-10" fill="currentColor" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Streak</h3>
            <p className="text-sm text-gray-600">Stay consistent</p>
          </div>
        </div>
        <Link
          href="/analytics"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View Analytics →
        </Link>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-gray-900">
            {streakStats.currentStreak}
          </div>
          <div className="text-xs text-gray-600 mt-1">Current</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-gray-900">
            {streakStats.longestStreak}
          </div>
          <div className="text-xs text-gray-600 mt-1">Best</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-gray-900">
            {streakStats.totalStreakDays}
          </div>
          <div className="text-xs text-gray-600 mt-1">Total Days</div>
        </div>
      </div>

      {/* Progress to Next Milestone */}
      {showProgress && streakStats.nextMilestone > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 font-medium">
              Next goal: {streakStats.nextMilestone} days
            </span>
            <span className="text-gray-600">
              {streakStats.nextMilestone - streakStats.currentStreak} to go
            </span>
          </div>
          <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                streakStats.streakAtRisk && streakStats.currentStreak > 0
                  ? 'bg-gray-400'
                  : streakStats.currentStreak >= 100
                    ? 'bg-purple-500'
                    : streakStats.currentStreak >= 30
                      ? 'bg-blue-500'
                      : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(progressToNextMilestone, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
