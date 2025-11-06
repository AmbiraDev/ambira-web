/**
 * GroupLeaderboard Component
 *
 * Displays group members ranked by activity hours.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGroupLeaderboard } from '../hooks/useGroupLeaderboard';
import { Trophy, Loader2, Medal, Award } from 'lucide-react';

interface GroupLeaderboardProps {
  groupId: string;
}

type Timeframe = 'week' | 'month' | 'allTime';

export function GroupLeaderboard({ groupId }: GroupLeaderboardProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('allTime');
  const {
    data: leaderboard,
    isLoading,
    error,
  } = useGroupLeaderboard(groupId, timeframe);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-700" />;
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center">
            <span className="text-gray-600 font-semibold">{rank}</span>
          </div>
        );
    }
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="space-y-4">
      {/* Timeframe selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTimeframe('week')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            timeframe === 'week'
              ? 'bg-[#0066CC] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setTimeframe('month')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            timeframe === 'month'
              ? 'bg-[#0066CC] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => setTimeframe('allTime')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            timeframe === 'allTime'
              ? 'bg-[#0066CC] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Time
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading leaderboard...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800 font-medium">Failed to load leaderboard</p>
          <p className="text-sm text-red-600 mt-1">Please try again later</p>
        </div>
      )}

      {!isLoading && !error && leaderboard && leaderboard.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No activity yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Start tracking sessions to appear on the leaderboard!
          </p>
        </div>
      )}

      {!isLoading && !error && leaderboard && leaderboard.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {leaderboard.map(entry => (
            <Link
              key={entry.userId}
              href={`/profile/${entry.username}`}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-10 flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>

              {/* Profile Picture */}
              {entry.profilePicture ? (
                <Image
                  src={entry.profilePicture}
                  alt={entry.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 font-semibold text-lg">
                    {entry.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {entry.name}
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  @{entry.username}
                </p>
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-gray-900">
                  {formatHours(entry.totalHours)}
                </div>
                <div className="text-xs text-gray-500">
                  {entry.sessionCount} session
                  {entry.sessionCount !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Arrow indicator */}
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
