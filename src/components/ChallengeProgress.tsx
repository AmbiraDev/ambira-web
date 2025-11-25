'use client'

import React from 'react'
import Link from 'next/link'
import { Challenge, ChallengeProgress as ChallengeProgressType } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Trophy,
  Target,
  TrendingUp,
  Zap,
  Timer,
  Clock,
  CheckCircle,
  ExternalLink,
} from 'lucide-react'

interface ChallengeProgressProps {
  challenge: Challenge
  progress: ChallengeProgressType
  compact?: boolean
  showActions?: boolean
}

const challengeTypeConfig = {
  'most-activity': {
    label: 'Most Activity',
    icon: TrendingUp,
    color: 'bg-blue-100 text-blue-800',
  },
  'fastest-effort': {
    label: 'Fastest Effort',
    icon: Zap,
    color: 'bg-yellow-100 text-yellow-800',
  },
  'longest-session': {
    label: 'Longest Session',
    icon: Timer,
    color: 'bg-purple-100 text-purple-800',
  },
  'group-goal': {
    label: 'Group Goal',
    icon: Target,
    color: 'bg-green-100 text-green-800',
  },
}

export default function ChallengeProgress({
  challenge,
  progress,
  compact = false,
  showActions = true,
}: ChallengeProgressProps) {
  const typeConfig = challengeTypeConfig[challenge.type]
  const TypeIcon = typeConfig.icon

  const now = new Date()
  const endDate = new Date(challenge.endDate)
  const timeRemaining = endDate.getTime() - now.getTime()
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))
  const isActive = timeRemaining > 0 && challenge.isActive

  const formatProgress = (value: number) => {
    if (
      challenge.type === 'most-activity' ||
      challenge.type === 'group-goal' ||
      challenge.type === 'longest-session'
    ) {
      return `${value.toFixed(1)}h`
    }
    if (challenge.type === 'fastest-effort') {
      return `${value.toFixed(1)} tasks/h`
    }
    return value.toString()
  }

  const getProgressColor = () => {
    if (progress.isCompleted) return 'bg-green-500'
    if (progress.percentage >= 75) return 'bg-blue-500'
    if (progress.percentage >= 50) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  const getRankColor = () => {
    if (progress.rank === 1) return 'text-yellow-600'
    if (progress.rank <= 3) return 'text-blue-600'
    if (progress.rank <= 10) return 'text-green-600'
    return 'text-gray-600'
  }

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TypeIcon className="w-4 h-4 text-gray-500" />
            <Link
              href={`/challenges/${challenge.id}`}
              className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
            >
              {challenge.name}
            </Link>
          </div>
          {progress.isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">
              {formatProgress(progress.currentValue)}
              {challenge.goalValue && ` / ${formatProgress(challenge.goalValue)}`}
            </span>
          </div>

          {challenge.goalValue && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${Math.min(progress.percentage, 100)}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className={`font-medium ${getRankColor()}`}>Rank #{progress.rank}</span>
            {isActive && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {daysRemaining > 0 ? `${daysRemaining}d left` : 'Ending soon'}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${typeConfig.color.replace('text-', 'bg-').replace('800', '500/10')}`}
          >
            <TypeIcon className="w-5 h-5 text-current" />
          </div>
          <div>
            <Link
              href={`/challenges/${challenge.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {challenge.name}
            </Link>
            <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
          </div>
        </div>
        {progress.isCompleted && (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <Badge className="bg-green-100 text-green-800">Completed</Badge>
          </div>
        )}
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatProgress(progress.currentValue)}
          </div>
          <div className="text-sm text-gray-500">Current Progress</div>
        </div>

        {challenge.goalValue && (
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatProgress(challenge.goalValue)}
            </div>
            <div className="text-sm text-gray-500">Target Goal</div>
          </div>
        )}

        <div className="text-center">
          <div className={`text-2xl font-bold ${getRankColor()}`}>#{progress.rank}</div>
          <div className="text-sm text-gray-500">Your Rank</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{progress.percentage.toFixed(1)}%</div>
          <div className="text-sm text-gray-500">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      {challenge.goalValue && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress to Goal</span>
            <span className="font-medium">
              {formatProgress(progress.currentValue)} / {formatProgress(challenge.goalValue)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${Math.min(progress.percentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Time Remaining */}
      {isActive && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">Time Remaining</span>
          </div>
          <p className="text-blue-700">
            {daysRemaining > 1
              ? `${daysRemaining} days left to complete this challenge`
              : daysRemaining === 1
                ? 'Less than 24 hours remaining!'
                : 'Challenge ending soon!'}
          </p>
        </div>
      )}

      {/* Completion Message */}
      {progress.isCompleted && (
        <div className="bg-green-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-900">Challenge Completed!</span>
          </div>
          <p className="text-green-700">
            Congratulations! You've successfully completed this challenge.
          </p>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-3">
          <Link href={`/challenges/${challenge.id}`}>
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Challenge
            </Button>
          </Link>
          <Link href={`/challenges/${challenge.id}#leaderboard`}>
            <Button variant="outline">
              <Trophy className="w-4 h-4 mr-2" />
              View Leaderboard
            </Button>
          </Link>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-xs text-gray-500 mt-4">
        Last updated: {progress.lastUpdated.toLocaleString()}
      </div>
    </div>
  )
}
