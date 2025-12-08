/**
 * GroupDetailPage - Presentation Component
 *
 * Displays group details using clean architecture.
 * This component ONLY handles presentation - no business logic.
 */

'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { debug } from '@/lib/debug'
import { useGroupDetails } from '../hooks/useGroupDetails'
import { useJoinGroup, useLeaveGroup } from '../hooks/useGroupMutations'
import { GroupLeaderboard } from './GroupLeaderboard'
import { GroupMembersList } from './GroupMembersList'
import { Users, Settings, ArrowLeft, Check } from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'

interface GroupDetailPageProps {
  groupId: string
}

export function GroupDetailPage({ groupId }: GroupDetailPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { group, isLoading, error } = useGroupDetails(groupId)
  const joinGroupMutation = useJoinGroup()
  const leaveGroupMutation = useLeaveGroup()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'members'>('leaderboard')

  // Dynamic metadata using useEffect for client component
  React.useEffect(() => {
    if (group) {
      document.title = `${group.name} - Ambira`

      const description = group.description || `Join ${group.name} group and connect with others`

      let metaDescription = document.querySelector('meta[name="description"]')
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.setAttribute('name', 'description')
        document.head.appendChild(metaDescription)
      }
      metaDescription.setAttribute('content', description)

      // Open Graph tags
      let ogTitle = document.querySelector('meta[property="og:title"]')
      if (!ogTitle) {
        ogTitle = document.createElement('meta')
        ogTitle.setAttribute('property', 'og:title')
        document.head.appendChild(ogTitle)
      }
      ogTitle.setAttribute('content', group.name)

      let ogDescription = document.querySelector('meta[property="og:description"]')
      if (!ogDescription) {
        ogDescription = document.createElement('meta')
        ogDescription.setAttribute('property', 'og:description')
        document.head.appendChild(ogDescription)
      }
      ogDescription.setAttribute('content', description)

      let ogType = document.querySelector('meta[property="og:type"]')
      if (!ogType) {
        ogType = document.createElement('meta')
        ogType.setAttribute('property', 'og:type')
        document.head.appendChild(ogType)
      }
      ogType.setAttribute('content', 'website')

      // Twitter card tags
      let twitterCard = document.querySelector('meta[name="twitter:card"]')
      if (!twitterCard) {
        twitterCard = document.createElement('meta')
        twitterCard.setAttribute('name', 'twitter:card')
        document.head.appendChild(twitterCard)
      }
      twitterCard.setAttribute('content', 'summary')

      let twitterTitle = document.querySelector('meta[name="twitter:title"]')
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta')
        twitterTitle.setAttribute('name', 'twitter:title')
        document.head.appendChild(twitterTitle)
      }
      twitterTitle.setAttribute('content', `${group.name} - Ambira`)

      let twitterDescription = document.querySelector('meta[name="twitter:description"]')
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta')
        twitterDescription.setAttribute('name', 'twitter:description')
        document.head.appendChild(twitterDescription)
      }
      twitterDescription.setAttribute('content', description)
    }
  }, [group])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view groups</h1>
          <p className="text-gray-600">You need to be logged in to view group details.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error?.message || 'Group not found'}
            </h1>
            <p className="text-gray-600 mb-4">
              The group you're looking for doesn't exist or has been deleted.
            </p>
            <button
              onClick={() => router.push('/groups')}
              className="bg-[#0066CC] text-white px-4 py-2 rounded-lg hover:bg-[#0051D5]"
            >
              Back to Groups
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isAdmin = group.adminUserIds.includes(user.id)
  const isMember = group.memberIds.includes(user.id)

  const handleJoinLeave = async () => {
    if (!user || isProcessing) return

    if (isMember) {
      setShowLeaveConfirm(true)
      return
    }

    try {
      await joinGroupMutation.mutateAsync({
        groupId: group.id,
        userId: user.id,
      })
    } catch (error) {
      debug.error('Failed to join group:', error)
    }
  }

  const confirmLeaveGroup = async () => {
    if (!user || !isMember) return

    setIsProcessing(true)
    setShowLeaveConfirm(false)

    try {
      await leaveGroupMutation.mutateAsync({
        groupId: group.id,
        userId: user.id,
      })
      router.push('/groups')
    } catch (error) {
      debug.error('Failed to leave group:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Get category icon
  const getCategoryIcon = () => {
    switch (group.category) {
      case 'work':
        return '💼'
      case 'study':
        return '📚'
      case 'side-project':
        return '💻'
      case 'learning':
        return '🎓'
      default:
        return '📌'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Mobile Header with Back Button */}
      <div className="sm:hidden mb-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1">
          {/* Group Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Group Avatar */}
              <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-[#0066CC] to-[#0051D5] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                {group.imageUrl ? (
                  <Image
                    src={group.imageUrl}
                    alt={group.name}
                    width={128}
                    height={128}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Users className="w-10 h-10 sm:w-16 sm:h-16 text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0 w-full">
                {/* Group Name and Action Buttons */}
                <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{group.name}</h1>
                    {isAdmin && (
                      <button
                        onClick={() => router.push(`/groups/${group.id}/settings`)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Edit group"
                      >
                        <Settings className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                  </div>

                  {/* Join/Joined Button */}
                  <button
                    onClick={handleJoinLeave}
                    disabled={isProcessing}
                    className={`min-h-[44px] px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      isMember
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-[#0066CC] text-white hover:bg-[#0051D5]'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label={isMember ? `Leave ${group.name}` : `Join ${group.name}`}
                  >
                    {isProcessing && isMember ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Leaving...
                      </>
                    ) : isMember ? (
                      <>
                        <Check className="w-4 h-4" />
                        Joined
                      </>
                    ) : (
                      'Join'
                    )}
                  </button>
                </div>

                {/* Category and Location */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">{getCategoryIcon()}</span>
                    <span className="text-xs sm:text-sm text-gray-600 capitalize">
                      {group.category.replace('-', ' ')}
                    </span>
                  </div>

                  {group.location && (
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg">📍</span>
                      <span className="text-xs sm:text-sm text-gray-600">{group.location}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {group.description && (
                  <p className="text-sm sm:text-base text-gray-700 mb-4 whitespace-pre-line max-h-24 overflow-y-auto">
                    {group.description}
                  </p>
                )}

                {/* Member Count */}
                <div className="text-sm text-gray-600">
                  {group.memberCount || group.memberIds.length} member
                  {(group.memberCount || group.memberIds.length) !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6 -mx-4 sm:mx-0">
            <nav
              className="flex gap-4 sm:gap-8 overflow-x-auto px-4 sm:px-0"
              aria-label="Group tabs"
            >
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'leaderboard'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Group Leaderboard
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'members'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Members
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'leaderboard' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Group Leaderboard</h2>
                <GroupLeaderboard groupId={groupId} />
              </div>
            )}

            {activeTab === 'members' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Members</h2>
                <GroupMembersList groupId={groupId} />
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={confirmLeaveGroup}
        title="Leave group"
        message="Are you sure you want to leave this group?"
        confirmText="Leave group"
        cancelText="Stay"
        isLoading={isProcessing}
        variant="warning"
      />
    </div>
  )
}
