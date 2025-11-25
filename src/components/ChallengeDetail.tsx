'use client'

import React, { useState } from 'react'
import {
  Challenge,
  ChallengeStats,
  ChallengeLeaderboard as ChallengeLeaderboardType,
  ChallengeProgress,
} from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Target, Zap, Timer, TrendingUp, Award, Settings, Share2 } from 'lucide-react'
import ChallengeLeaderboard from './ChallengeLeaderboard'

interface ChallengeDetailProps {
  challenge: Challenge
  stats: ChallengeStats
  leaderboard: ChallengeLeaderboardType
  userProgress?: ChallengeProgress | null
  isParticipating: boolean
  isAdmin: boolean
  onJoin: () => Promise<void>
  onLeave: () => Promise<void>
  onEdit?: () => void
  onDelete?: () => void
  isLoading: boolean
}

const challengeTypeConfig = {
  'most-activity': {
    label: 'Most Activity',
    icon: TrendingUp,
    color: 'bg-blue-100 text-blue-800',
    description: 'Compete to log the most productive hours during the challenge period',
  },
  'fastest-effort': {
    label: 'Fastest Effort',
    icon: Zap,
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Achieve the best tasks-per-hour ratio in your sessions',
  },
  'longest-session': {
    label: 'Longest Session',
    icon: Timer,
    color: 'bg-purple-100 text-purple-800',
    description: 'Record the longest single continuous work session',
  },
  'group-goal': {
    label: 'Group Goal',
    icon: Target,
    color: 'bg-green-100 text-green-800',
    description: 'Work together to reach a collective productivity target',
  },
}

export default function ChallengeDetail({
  challenge,
  stats,
  leaderboard,
  userProgress,
  isParticipating,
  isAdmin,
  onJoin,
  onLeave,
  onEdit,
  onDelete: _onDelete,
  isLoading,
}: ChallengeDetailProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'leaderboard'>('overview')

  const typeConfig = challengeTypeConfig[challenge.type]
  const TypeIcon = typeConfig.icon

  const now = new Date()
  const startDate = new Date(challenge.startDate)
  const endDate = new Date(challenge.endDate)
  const isActive = now >= startDate && now <= endDate && challenge.isActive
  const isUpcoming = now < startDate && challenge.isActive
  const isCompleted = now > endDate || !challenge.isActive

  const timeRemaining = isActive ? endDate.getTime() - now.getTime() : 0
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))
  const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60))

  const getStatusBadge = () => {
    if (isUpcoming) {
      return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
    }
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>
  }

  const formatProgress = (progress: number) => {
    if (
      challenge.type === 'most-activity' ||
      challenge.type === 'group-goal' ||
      challenge.type === 'longest-session'
    ) {
      return `${progress.toFixed(1)} hours`
    }
    if (challenge.type === 'fastest-effort') {
      return `${progress.toFixed(1)} tasks/hour`
    }
    return progress.toString()
  }

  const getProgressPercentage = () => {
    if (!challenge.goalValue || !userProgress?.currentValue) return 0
    return Math.min((userProgress.currentValue / challenge.goalValue) * 100, 100)
  }

  const formatTimeRemaining = () => {
    if (daysRemaining > 1) {
      return `${daysRemaining} days remaining`
    } else if (hoursRemaining > 1) {
      return `${hoursRemaining} hours remaining`
    } else if (timeRemaining > 0) {
      return 'Less than 1 hour remaining'
    }
    return 'Challenge ended'
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0066CC] to-[#0051D5] text-white rounded-lg shadow-sm p-8 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="p-3 bg-white/20 rounded-lg flex-shrink-0">
              <TypeIcon className="w-8 h-8" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold mb-2">{challenge.name}</h1>
              <p className="text-white/80 text-lg">{typeConfig.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {isAdmin && (
              <Button variant="secondary" size="sm" onClick={onEdit}>
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>
            )}
          </div>
        </div>

        {/* Challenge Meta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-white/10 rounded-lg">
            <div className="text-3xl font-bold">{challenge.participantCount}</div>
            <div className="text-white/80 text-sm mt-1">Participants</div>
          </div>
          <div className="text-center p-4 bg-white/10 rounded-lg">
            <div className="text-2xl font-bold">
              {isActive
                ? formatTimeRemaining()
                : isUpcoming
                  ? `Starts ${startDate.toLocaleDateString()}`
                  : `Ended ${endDate.toLocaleDateString()}`}
            </div>
            <div className="text-white/80 text-sm mt-1">
              {isActive ? 'Time Remaining' : isUpcoming ? 'Start Date' : 'End Date'}
            </div>
          </div>
          <div className="text-center p-4 bg-white/10 rounded-lg">
            <div className="text-3xl font-bold">
              {challenge.goalValue ? formatProgress(challenge.goalValue) : 'No limit'}
            </div>
            <div className="text-white/80 text-sm mt-1">Target Goal</div>
          </div>
        </div>

        {/* User Progress */}
        {isParticipating && userProgress && (
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Your Progress</span>
              <span className="text-lg font-bold">
                {formatProgress(userProgress.currentValue)}
                {challenge.goalValue && ` / ${formatProgress(challenge.goalValue)}`}
              </span>
            </div>
            {challenge.goalValue && (
              <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                <div
                  className="bg-white h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-blue-100">
              <span>Rank #{userProgress.rank}</span>
              <span>{userProgress.percentage.toFixed(1)}% complete</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-6">
          {!isParticipating && !isCompleted && (
            <Button
              onClick={onJoin}
              disabled={isLoading}
              size="lg"
              className="bg-white text-[#0066CC] hover:bg-gray-50 font-semibold"
            >
              {isLoading ? 'Joining...' : 'Join Challenge'}
            </Button>
          )}
          {isParticipating && !isCompleted && (
            <Button
              variant="outline"
              onClick={onLeave}
              disabled={isLoading}
              size="lg"
              className="border-white text-white hover:bg-white/10 font-semibold"
            >
              {isLoading ? 'Leaving...' : 'Leave Challenge'}
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            className="border-white text-white hover:bg-white/10 font-semibold"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
              activeSection === 'overview'
                ? 'border-[#0066CC] text-[#0066CC]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSection('leaderboard')}
            className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
              activeSection === 'leaderboard'
                ? 'border-[#0066CC] text-[#0066CC]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Leaderboard
          </button>
        </div>

        <div className="p-6">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">About This Challenge</h2>
                <p className="text-gray-600 leading-relaxed">{challenge.description}</p>
              </div>

              {/* Rules */}
              {challenge.rules && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Rules & Requirements</h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600 whitespace-pre-wrap">{challenge.rules}</p>
                  </div>
                </div>
              )}

              {/* Challenge Details */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Challenge Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-900">Duration</span>
                    </div>
                    <p className="text-gray-600">
                      {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-900">Challenge Type</span>
                    </div>
                    <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                  </div>
                </div>
              </div>

              {/* Rewards */}
              {challenge.rewards && challenge.rewards.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Rewards</h2>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-yellow-600" />
                      <span className="font-semibold text-yellow-900">What You'll Earn</span>
                    </div>
                    <ul className="space-y-1">
                      {challenge.rewards.map((reward, index) => (
                        <li key={index} className="text-yellow-800">
                          • {reward}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Challenge Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.totalParticipants}
                    </div>
                    <div className="text-sm text-blue-600">Total Participants</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.completedParticipants}
                    </div>
                    <div className="text-sm text-green-600">Completed</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatProgress(stats.averageProgress)}
                    </div>
                    <div className="text-sm text-purple-600">Average Progress</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round((stats.completedParticipants / stats.totalParticipants) * 100) ||
                        0}
                      %
                    </div>
                    <div className="text-sm text-orange-600">Completion Rate</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'leaderboard' && (
            <ChallengeLeaderboard
              leaderboard={leaderboard}
              challengeType={challenge.type}
              currentUserId={userProgress?.userId}
            />
          )}
        </div>
      </div>
    </div>
  )
}
