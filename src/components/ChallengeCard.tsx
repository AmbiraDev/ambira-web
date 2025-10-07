'use client';

import React from 'react';
import Link from 'next/link';
import { Challenge, ChallengeStats } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Target,
  Zap,
  Timer,
  TrendingUp
} from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  stats?: ChallengeStats;
  isParticipating?: boolean;
  userProgress?: number;
  onJoin?: () => Promise<void>;
  onLeave?: () => Promise<void>;
  isLoading?: boolean;
  showActions?: boolean;
}

const challengeTypeConfig = {
  'most-activity': {
    label: 'Most Activity',
    icon: TrendingUp,
    color: 'bg-blue-100 text-blue-800',
    description: 'Log the most hours'
  },
  'fastest-effort': {
    label: 'Fastest Effort',
    icon: Zap,
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Best tasks per hour ratio'
  },
  'longest-session': {
    label: 'Longest Session',
    icon: Timer,
    color: 'bg-purple-100 text-purple-800',
    description: 'Single longest work session'
  },
  'group-goal': {
    label: 'Group Goal',
    icon: Target,
    color: 'bg-green-100 text-green-800',
    description: 'Collective target'
  }
};

export default function ChallengeCard({
  challenge,
  stats,
  isParticipating = false,
  userProgress = 0,
  onJoin,
  onLeave,
  isLoading = false,
  showActions = true
}: ChallengeCardProps) {
  const typeConfig = challengeTypeConfig[challenge.type];
  const TypeIcon = typeConfig.icon;

  const now = new Date();
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  const isActive = now >= startDate && now <= endDate && challenge.isActive;
  const isUpcoming = now < startDate && challenge.isActive;
  const isCompleted = now > endDate || !challenge.isActive;

  const timeRemaining = isActive ? endDate.getTime() - now.getTime() : 0;
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  const getStatusBadge = () => {
    if (isUpcoming) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Upcoming</Badge>;
    }
    if (isActive) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Completed</Badge>;
  };

  const formatProgress = (progress: number) => {
    if (challenge.type === 'most-activity' || challenge.type === 'group-goal' || challenge.type === 'longest-session') {
      return `${progress.toFixed(1)}h`;
    }
    if (challenge.type === 'fastest-effort') {
      return `${progress.toFixed(1)} tasks/h`;
    }
    return progress.toString();
  };

  const getProgressPercentage = () => {
    if (!challenge.goalValue || userProgress === 0) return 0;
    return Math.min((userProgress / challenge.goalValue) * 100, 100);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2.5 rounded-lg ${typeConfig.color.replace('text-', 'bg-').replace('800', '500/10')} flex-shrink-0`}>
              <TypeIcon className="w-5 h-5 text-current" />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/challenges/${challenge.id}`}
                className="text-lg font-bold text-gray-900 hover:text-[#007AFF] transition-colors block truncate"
              >
                {challenge.name}
              </Link>
              <p className="text-sm text-gray-600">{typeConfig.description}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {challenge.description}
        </p>

        {/* Challenge Type and Goal */}
        <div className="flex items-center gap-4 mb-4">
          <Badge className={typeConfig.color}>
            {typeConfig.label}
          </Badge>
          {challenge.goalValue && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Target className="w-4 h-4" />
              <span>Goal: {formatProgress(challenge.goalValue)}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{challenge.participantCount} participants</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              {isActive && daysRemaining > 0 && `${daysRemaining} days left`}
              {isUpcoming && `Starts ${startDate.toLocaleDateString()}`}
              {isCompleted && `Ended ${endDate.toLocaleDateString()}`}
            </span>
          </div>
        </div>

        {/* User Progress (if participating) */}
        {isParticipating && userProgress > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Your Progress</span>
              <span className="font-medium text-gray-900">
                {formatProgress(userProgress)}
                {challenge.goalValue && ` / ${formatProgress(challenge.goalValue)}`}
              </span>
            </div>
            {challenge.goalValue && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Top Performers Preview */}
        {stats?.topPerformers && stats.topPerformers.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Trophy className="w-4 h-4" />
              <span>Top Performers</span>
            </div>
            <div className="space-y-1">
              {stats.topPerformers.slice(0, 3).map((performer, index) => (
                <div key={performer.userId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">#{index + 1}</span>
                    <span className="font-medium">{performer.user.name}</span>
                  </div>
                  <span className="text-gray-600">
                    {formatProgress(performer.progress)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-3">
            {!isParticipating && !isCompleted && (
              <Button
                onClick={onJoin}
                disabled={isLoading}
                className="flex-1 font-semibold"
              >
                {isLoading ? 'Joining...' : 'Join Challenge'}
              </Button>
            )}
            {isParticipating && !isCompleted && (
              <Button
                variant="outline"
                onClick={onLeave}
                disabled={isLoading}
                className="flex-1 font-semibold"
              >
                {isLoading ? 'Leaving...' : 'Leave Challenge'}
              </Button>
            )}
            <Link href={`/challenges/${challenge.id}`}>
              <Button variant="outline" className="font-semibold">
                View Details
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}