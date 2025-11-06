'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { firebaseUserApi, firebaseApi } from '@/lib/api'
import { cachedQuery } from '@/lib/cache'
import { debug } from '@/lib/debug'
import GroupAvatar from '@/components/GroupAvatar'
import SuggestedPeopleModal from '@/components/SuggestedPeopleModal'
import SuggestedGroupsModal from '@/components/SuggestedGroupsModal'
import { useSuggestedGroups } from '@/features/search/hooks'
import { useJoinGroup } from '@/features/groups/hooks/useGroupMutations'
import { GROUP_DISPLAY_CONFIG } from '@/lib/constants/groupDisplay'

interface SuggestedUser {
  id: string
  name: string
  username: string
  location?: string
  followersCount: number
  profilePicture?: string
}

function RightSidebar() {
  const { user } = useAuth()
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())
  const [showPeopleModal, setShowPeopleModal] = useState(false)
  const [showGroupsModal, setShowGroupsModal] = useState(false)
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set())

  // Use the proper hook for suggested groups
  const { suggestedGroups: fetchedSuggestedGroups, isLoading: isLoadingGroups } =
    useSuggestedGroups({
      userId: user?.id,
      enabled: !!user,
      limit: GROUP_DISPLAY_CONFIG.SUGGESTED_GROUPS_LIMIT,
    })

  // Use the join group mutation hook
  const joinGroupMutation = useJoinGroup()

  const loadSuggestedContent = useCallback(async () => {
    try {
      setIsLoadingUsers(true)

      if (!user) return

      // Load the list of users we're already following
      try {
        const following = await firebaseUserApi.getFollowing(user.id)
        const followingIds = new Set(following.map((u) => u.id))
        setFollowingUsers(followingIds)
      } catch (error) {
        debug.error('Failed to load following users:', error)
      }

      // Load suggested users (top 5) with 1 hour cache
      try {
        // Use the getSuggestedUsers API which filters by profileVisibility and already-followed users
        const suggestions = await cachedQuery(
          `suggested_users_${user.id}`,
          () => firebaseUserApi.getSuggestedUsers(5),
          {
            memoryTtl: 60 * 60 * 1000, // 1 hour in memory
            localTtl: 60 * 60 * 1000, // 1 hour in localStorage
            sessionCache: true,
            dedupe: true,
          }
        )
        setSuggestedUsers(suggestions)
      } catch (error) {
        debug.error('Failed to load suggested users:', error)
      }
    } catch {
    } finally {
      setIsLoadingUsers(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadSuggestedContent()
    }
  }, [user, loadSuggestedContent])

  const handleFollowToggle = async (userId: string) => {
    if (!user) return

    const isFollowing = followingUsers.has(userId)

    // Optimistic update
    setFollowingUsers((prev) => {
      const next = new Set(prev)
      if (isFollowing) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })

    try {
      if (isFollowing) {
        await firebaseApi.user.unfollowUser(userId)
      } else {
        await firebaseApi.user.followUser(userId)
        // Remove from suggestions after following
        setSuggestedUsers((prev) => prev.filter((u) => u.id !== userId))
      }
    } catch {
      // Revert on error
      setFollowingUsers((prev) => {
        const next = new Set(prev)
        if (isFollowing) {
          next.add(userId)
        } else {
          next.delete(userId)
        }
        return next
      })
    }
  }

  return (
    <aside
      className="hidden xl:block w-[320px] flex-shrink-0"
      aria-label="Suggestions and groups sidebar"
    >
      <div className="space-y-4 h-full overflow-y-auto scrollbar-hide pt-20 pb-6">
        {/* Suggested Friends - Redesigned */}
        <div className="px-2">
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-lg font-semibold text-gray-900">Suggested for you</h3>
          </div>

          {isLoadingUsers ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 animate-pulse p-3 bg-white rounded-lg"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedUsers.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-lg">
              <p className="text-sm text-gray-500">No suggestions available</p>
            </div>
          ) : (
            <div className="space-y-1">
              {suggestedUsers.map((suggestedUser) => (
                <Link
                  key={suggestedUser.id}
                  href={`/profile/${suggestedUser.username}`}
                  className="block px-3 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    {suggestedUser.profilePicture ? (
                      <Image
                        src={suggestedUser.profilePicture}
                        alt={`${suggestedUser.name}'s profile picture`}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        loading="lazy"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-semibold text-sm">
                          {suggestedUser.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 hover:text-[#0066CC] truncate mb-0.5">
                        {suggestedUser.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">@{suggestedUser.username}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleFollowToggle(suggestedUser.id)
                      }}
                      className={`text-sm font-semibold transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                        followingUsers.has(suggestedUser.id)
                          ? 'text-gray-600 hover:text-gray-900'
                          : 'text-[#0066CC] hover:text-[#0051D5]'
                      }`}
                      aria-label={
                        followingUsers.has(suggestedUser.id)
                          ? `Unfollow ${suggestedUser.name}`
                          : `Follow ${suggestedUser.name}`
                      }
                      aria-pressed={followingUsers.has(suggestedUser.id)}
                    >
                      {followingUsers.has(suggestedUser.id) ? 'Following' : 'Follow'}
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Clubs - Redesigned */}
        <div className="px-2">
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-lg font-semibold text-gray-900">Suggested Groups</h3>
          </div>

          {isLoadingGroups ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 animate-pulse p-3 bg-white rounded-lg"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : fetchedSuggestedGroups.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-lg">
              <p className="text-sm text-gray-500">No groups available</p>
            </div>
          ) : (
            <div className="space-y-1">
              {fetchedSuggestedGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="block px-3 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <GroupAvatar imageUrl={group.imageUrl} name={group.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 hover:text-[#0066CC] truncate mb-0.5">
                        {group.name}
                      </p>
                      <div className="text-xs text-gray-500">
                        {group.memberCount || 0} {group.memberCount === 1 ? 'member' : 'members'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (!user || joinedGroupIds.has(group.id)) return

                        // Immediately mark as joined for instant UI feedback
                        setJoinedGroupIds((prev) => new Set(prev).add(group.id))

                        // Fire mutation with proper error handling
                        joinGroupMutation.mutate(
                          {
                            groupId: group.id,
                            userId: user.id,
                          },
                          {
                            onError: (error) => {
                              debug.error('Failed to join group:', error)
                              // Rollback optimistic update on error
                              setJoinedGroupIds((prev) => {
                                const next = new Set(prev)
                                next.delete(group.id)
                                return next
                              })
                            },
                            // The mutation will automatically invalidate the cache
                            // and the suggested groups hook will refetch and filter out this group
                          }
                        )
                      }}
                      className={`text-sm font-semibold transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                        joinedGroupIds.has(group.id)
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-[#0066CC] hover:text-[#0051D5] cursor-pointer'
                      }`}
                      disabled={joinedGroupIds.has(group.id)}
                    >
                      {joinedGroupIds.has(group.id) ? 'Joined' : 'Join'}
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SuggestedPeopleModal isOpen={showPeopleModal} onClose={() => setShowPeopleModal(false)} />
      <SuggestedGroupsModal isOpen={showGroupsModal} onClose={() => setShowGroupsModal(false)} />
    </aside>
  )
}

export default RightSidebar
