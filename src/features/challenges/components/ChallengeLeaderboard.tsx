'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChallengeLeaderboard as ChallengeLeaderboardType } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Medal, Award, Crown, MapPin, CheckCircle } from 'lucide-react'

interface ChallengeLeaderboardProps {
  leaderboard: ChallengeLeaderboardType
  challengeType: 'most-activity' | 'fastest-effort' | 'longest-session' | 'group-goal'
  currentUserId?: string
  showFilters?: boolean
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-500" />
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />
    default:
      return (
        <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-gray-500">
          #{rank}
        </span>
      )
  }
}

const getRankBadgeColor = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 2:
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 3:
      return 'bg-amber-100 text-amber-800 border-amber-200'
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200'
  }
}

export default function ChallengeLeaderboard({
  leaderboard,
  challengeType,
  currentUserId,
  showFilters = true,
}: ChallengeLeaderboardProps) {
  const [filter, setFilter] = useState<'all' | 'following' | 'completed'>('all')

  const formatProgress = (progress: number) => {
    if (
      challengeType === 'most-activity' ||
      challengeType === 'group-goal' ||
      challengeType === 'longest-session'
    ) {
      return `${progress.toFixed(1)} hours`
    }
    if (challengeType === 'fastest-effort') {
      return `${progress.toFixed(1)} tasks/hour`
    }
    return progress.toString()
  }

  const getProgressLabel = () => {
    switch (challengeType) {
      case 'most-activity':
        return 'Total Hours'
      case 'fastest-effort':
        return 'Best Ratio'
      case 'longest-session':
        return 'Longest Session'
      case 'group-goal':
        return 'Contributed Hours'
      default:
        return 'Progress'
    }
  }

  // Filter entries based on selected filter
  const filteredEntries = leaderboard.entries.filter((entry) => {
    if (filter === 'completed') {
      return entry.isCompleted
    }
    // TODO: Implement following filter when we have following data
    return true
  })

  const currentUserEntry = leaderboard.entries.find((entry) => entry.userId === currentUserId)

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Participants
          </Button>
          <Button
            variant={filter === 'following' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('following')}
            disabled // TODO: Implement when following data is available
          >
            Following
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>
      )}

      {/* Current User Highlight */}
      {currentUserEntry && filter === 'all' && currentUserEntry.rank > 3 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <span className="text-sm font-bold text-blue-700">#{currentUserEntry.rank}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-900">Your Position</span>
                {currentUserEntry.isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
              </div>
              <div className="text-sm text-blue-700">
                {formatProgress(currentUserEntry.progress)} • {getProgressLabel()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {filteredEntries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {filteredEntries.slice(0, 3).map((entry) => (
            <div
              key={entry.userId}
              className={`relative bg-white border-2 rounded-lg p-6 text-center ${
                entry.userId === currentUserId ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {/* Rank Badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className={`${getRankBadgeColor(entry.rank)} border-2`}>#{entry.rank}</Badge>
              </div>

              {/* Profile Picture */}
              <div className="w-16 h-16 mx-auto mb-3 relative">
                {entry.user.profilePicture ? (
                  <Image
                    src={entry.user.profilePicture}
                    alt={entry.user.name}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-lg">
                      {entry.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Rank Icon Overlay */}
                <div className="absolute -top-1 -right-1">{getRankIcon(entry.rank)}</div>
              </div>

              {/* User Info */}
              <Link
                href={`/users/${entry.user.username}`}
                className="block hover:text-blue-600 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-1">{entry.user.name}</h3>
                <p className="text-sm text-gray-500 mb-2">@{entry.user.username}</p>
              </Link>

              {/* Location */}
              {entry.user.location && (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-3">
                  <MapPin className="w-3 h-3" />
                  <span>{entry.user.location}</span>
                </div>
              )}

              {/* Progress */}
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatProgress(entry.progress)}
              </div>
              <div className="text-sm text-gray-500">{getProgressLabel()}</div>

              {/* Completion Badge */}
              {entry.isCompleted && (
                <div className="mt-3">
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full Leaderboard Table */}
      {filteredEntries.length > 3 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Full Leaderboard</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {getProgressLabel()}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.slice(3).map((entry) => (
                  <tr
                    key={entry.userId}
                    className={`hover:bg-gray-50 ${
                      entry.userId === currentUserId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRankIcon(entry.rank)}
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          #{entry.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 relative mr-3">
                          {entry.user.profilePicture ? (
                            <Image
                              src={entry.user.profilePicture}
                              alt={entry.user.name}
                              fill
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-bold text-xs">
                                {entry.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/users/${entry.user.username}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600"
                          >
                            {entry.user.name}
                          </Link>
                          <div className="text-sm text-gray-500">@{entry.user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatProgress(entry.progress)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.isCompleted ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="secondary">In Progress</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No participants yet</h3>
          <p className="text-gray-500">
            {filter === 'completed'
              ? 'No one has completed this challenge yet.'
              : 'Be the first to join this challenge!'}
          </p>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {leaderboard.lastUpdated.toLocaleString()}
      </div>
    </div>
  )
}
