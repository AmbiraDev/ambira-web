'use client';

import React from 'react';
import { Lock, Share2 } from 'lucide-react';
import { Achievement, AchievementProgress } from '@/types';

interface AchievementCardProps {
  achievement?: Achievement;
  progress?: AchievementProgress;
  onShare?: (achievementId: string) => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  progress,
  onShare,
}) => {
  const isUnlocked = achievement !== undefined || progress?.isUnlocked;
  const displayData = achievement || progress;

  if (!displayData) return null;

  return (
    <div
      className={`relative rounded-lg p-4 border-2 transition-all ${
        isUnlocked
          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 hover:shadow-lg'
          : 'bg-gray-50 border-gray-200 opacity-60'
      }`}
    >
      {/* Lock overlay for locked achievements */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-10 rounded-lg">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`text-4xl flex-shrink-0 ${
            isUnlocked ? 'filter-none' : 'grayscale'
          }`}
        >
          {displayData.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 mb-1">{displayData.name}</h3>
          <p className="text-sm text-gray-600 mb-2">
            {displayData.description}
          </p>

          {/* Progress bar for locked achievements */}
          {!isUnlocked && progress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  {progress.currentValue} / {progress.targetValue}
                </span>
                <span>{Math.round(progress.percentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Earned date for unlocked achievements */}
          {isUnlocked && achievement && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Earned {achievement.earnedAt.toLocaleDateString()}
              </p>
              {onShare && !achievement.isShared && (
                <button
                  onClick={() => onShare(achievement.id)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Share2 className="w-3 h-3" />
                  Share
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
