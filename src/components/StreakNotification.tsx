'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Flame, X } from 'lucide-react';
import { firebaseApi } from '@/lib/api';
import { StreakStats } from '@/types';

interface StreakNotificationProps {
  userId: string;
  onDismiss?: () => void;
}

export const StreakNotification: React.FC<StreakNotificationProps> = ({
  userId,
  onDismiss,
}) => {
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const loadStreak = async () => {
      try {
        const stats = await firebaseApi.streak.getStreakStats(userId);
        setStreakStats(stats);

        // Show notification if streak is at risk and has a meaningful streak
        if (stats.streakAtRisk && stats.currentStreak > 0) {
          setIsVisible(true);
        }
      } catch {
        console.error('Failed to load streak');
      }
    };

    loadStreak();
  }, [userId]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible || isDismissed || !streakStats) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-lg border-2 border-orange-400 p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="relative">
            <Flame className="w-8 h-8 text-orange-500" fill="currentColor" />
            <AlertTriangle className="w-4 h-4 text-red-500 absolute -top-1 -right-1" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">
            Don't break your streak!
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            You're on a{' '}
            <span className="font-semibold text-orange-600">
              {streakStats.currentStreak} day streak
            </span>
            . Complete a session today to keep it going!
          </p>

          {streakStats.nextMilestone && (
            <p className="text-xs text-gray-500">
              Only {streakStats.nextMilestone - streakStats.currentStreak} days
              until your next milestone! 🎯
            </p>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleDismiss}
          className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
        >
          Start Session
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
        >
          Remind me later
        </button>
      </div>
    </div>
  );
};
