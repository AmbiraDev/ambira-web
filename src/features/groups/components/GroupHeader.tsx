'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Group, GroupStats } from '@/types'
import GroupAvatar from '@/features/groups/components/GroupAvatar'
import {
  Users,
  MapPin,
  Lock,
  Globe,
  Settings,
  TrendingUp,
  Clock,
  ChevronLeft,
  MessageSquare,
  UserPlus,
} from 'lucide-react'

interface GroupHeaderProps {
  group: Group
  stats?: GroupStats
  currentUserId?: string
  isJoined?: boolean
  onJoin?: () => Promise<void>
  onLeave?: () => Promise<void>
  onSettings?: () => void
  onInvite?: () => void
  isLoading?: boolean
}

const categoryLabels = {
  work: 'Work',
  study: 'Study',
  'side-project': 'Side Project',
  learning: 'Learning',
  other: 'Other',
}

const typeLabels = {
  'just-for-fun': 'Just for Fun',
  professional: 'Professional',
  competitive: 'Competitive',
  other: 'Other',
}

export default function GroupHeader({
  group,
  stats,
  currentUserId,
  isJoined = false,
  onJoin,
  onLeave,
  onSettings,
  onInvite,
  isLoading = false,
}: GroupHeaderProps) {
  const router = useRouter()
  const isAdmin = currentUserId && group.adminUserIds.includes(currentUserId)
  const isCreator = currentUserId && group.createdByUserId === currentUserId
  const canJoin = currentUserId && !isJoined && !isAdmin
  const canLeave = currentUserId && isJoined && !isAdmin

  const handleJoin = async () => {
    if (onJoin && canJoin) {
      await onJoin()
    }
  }

  const handleLeave = async () => {
    if (onLeave && canLeave) {
      await onLeave()
    }
  }

  return (
    <div className="bg-white md:bg-gray-50">
      {/* Mobile Back Button Header */}
      <div className="md:hidden sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-50 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 truncate flex-1">{group.name}</h1>
        {(isAdmin || isCreator) && (
          <button
            onClick={onSettings}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="md:max-w-4xl md:mx-auto md:pt-6">
        <div className="bg-white md:rounded-xl md:border md:border-gray-200 p-6">
          {/* Group Avatar and Name */}
          <div className="flex items-start gap-4 mb-4">
            <GroupAvatar
              imageUrl={group.imageUrl}
              name={group.name}
              size="xl"
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                {(isAdmin || isCreator) && (
                  <button
                    onClick={onSettings}
                    className="hidden md:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Settings className="w-5 h-5 text-gray-600" />
                  </button>
                )}
              </div>
              <p className="text-gray-600 text-sm mt-1">{group.description}</p>
            </div>
          </div>

          {/* Group Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Users className="w-4 h-4" />
              <span className="font-medium">{group.memberCount} members</span>
            </div>
            {group.location && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{group.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              {group.privacySetting === 'public' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                  <Globe className="w-3 h-3" />
                  Public
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">
                  <Lock className="w-3 h-3" />
                  Approval Required
                </span>
              )}
            </div>
          </div>

          {/* Category and Type Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
              {categoryLabels[group.category]}
            </span>
            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
              {typeLabels[group.type]}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <button
                  disabled
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-500 rounded-xl font-semibold text-sm"
                >
                  Admin
                </button>
                {onInvite && (
                  <button
                    onClick={onInvite}
                    className="py-3 px-4 bg-[#0066CC] hover:bg-[#0051D5] text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite
                  </button>
                )}
              </>
            ) : canJoin ? (
              <button
                onClick={handleJoin}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-[#0066CC] hover:bg-[#0051D5] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {group.privacySetting === 'public' ? 'Join Group' : 'Request to Join'}
              </button>
            ) : canLeave ? (
              <>
                <button
                  onClick={handleLeave}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  Leave Group
                </button>
                {onInvite && (
                  <button
                    onClick={onInvite}
                    className="py-3 px-4 bg-[#0066CC] hover:bg-[#0051D5] text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite
                  </button>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 md:px-0 px-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#0066CC] flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-gray-600">Active Members</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeMembers}</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-gray-600">Weekly Hours</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.weeklyHours.toFixed(1)}h
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-gray-600">Total Hours</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}h</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#FC4C02] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-gray-600">Posts</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalPosts}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
