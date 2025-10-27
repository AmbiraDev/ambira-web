'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Lock } from 'lucide-react';
import { firebaseApi } from '@/lib/api';
import { Achievement, AchievementProgress } from '@/types';
import { AchievementCard } from './AchievementCard';

interface TrophyCaseProps {
  userId: string;
  onShareAchievement?: (achievementId: string) => void;
}

export const TrophyCase: React.FC<TrophyCaseProps> = ({
  userId,
  onShareAchievement,
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const [achievementsData, progressData] = await Promise.all([
          firebaseApi.achievement.getUserAchievements(userId),
          firebaseApi.achievement.getAchievementProgress(userId),
        ]);
        setAchievements(achievementsData);
        setProgress(progressData);
      } catch {
        console.error('Failed to load achievements');
      } finally {
        setIsLoading(false);
      }
    };

    loadAchievements();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  const unlockedAchievements = achievements;
  const lockedProgress = progress.filter(p => !p.isUnlocked);

  const getFilteredItems = () => {
    if (filter === 'unlocked') {
      return unlockedAchievements.map(a => ({
        type: 'achievement' as const,
        data: a,
      }));
    }
    if (filter === 'locked') {
      return lockedProgress.map(p => ({ type: 'progress' as const, data: p }));
    }
    // All: show unlocked first, then locked
    return [
      ...unlockedAchievements.map(a => ({
        type: 'achievement' as const,
        data: a,
      })),
      ...lockedProgress.map(p => ({ type: 'progress' as const, data: p })),
    ];
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trophy Case</h2>
            <p className="text-sm text-gray-600">
              {unlockedAchievements.length} of {progress.length} achievements
              unlocked
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({progress.length})
          </button>
          <button
            onClick={() => setFilter('unlocked')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unlocked'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unlocked ({unlockedAchievements.length})
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'locked'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Locked ({lockedProgress.length})
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Overall Progress
          </span>
          <span className="text-sm font-bold text-gray-900">
            {Math.round((unlockedAchievements.length / progress.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full transition-all duration-500"
            style={{
              width: `${(unlockedAchievements.length / progress.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Achievement grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, index) => (
            <AchievementCard
              key={index}
              achievement={item.type === 'achievement' ? item.data : undefined}
              progress={item.type === 'progress' ? item.data : undefined}
              onShare={onShareAchievement}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No achievements to display</p>
        </div>
      )}
    </div>
  );
};
