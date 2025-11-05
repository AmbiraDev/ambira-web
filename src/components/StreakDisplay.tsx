'use client';

import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { firebaseApi } from '@/lib/api';
import { StreakStats } from '@/types';

interface StreakDisplayProps {
  userId: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  userId,
  size = 'medium',
  showLabel = true,
}) => {
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null);
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
      <div className="flex items-center gap-2 animate-pulse">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        {showLabel && <div className="w-16 h-4 bg-gray-200 rounded"></div>}
      </div>
    );
  }

  if (!streakStats) return null;

  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl',
  };

  const iconSizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const getFlameColor = () => {
    if (streakStats.streakAtRisk) return 'text-gray-400';
    if (streakStats.currentStreak >= 100) return 'text-purple-500';
    if (streakStats.currentStreak >= 30) return 'text-blue-500';
    if (streakStats.currentStreak >= 7) return 'text-orange-500';
    return 'text-orange-400';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${getFlameColor()} relative`}>
        <Flame className={iconSizeClasses[size]} fill="currentColor" />
        {streakStats.streakAtRisk && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
        )}
      </div>
      <div className="flex flex-col">
        <span className={`font-bold ${sizeClasses[size]} leading-none`}>
          {streakStats.currentStreak}
        </span>
        {showLabel && (
          <span className="text-xs text-gray-500">
            {streakStats.currentStreak === 1 ? 'day' : 'days'}
          </span>
        )}
      </div>
    </div>
  );
};
