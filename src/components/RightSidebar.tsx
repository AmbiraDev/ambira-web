'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { firebaseUserApi, firebaseApi } from '@/lib/api'
import { cachedQuery } from '@/lib/cache'
import { debug } from '@/lib/debug'
import GroupAvatar from '@/features/groups/components/GroupAvatar'
import SuggestedPeopleModal from '@/features/search/components/SuggestedPeopleModal'
import SuggestedGroupsModal from '@/features/groups/components/SuggestedGroupsModal'
import { useSuggestedGroups } from '@/features/search/hooks'
import { useJoinGroup } from '@/features/groups/hooks/useGroupMutations'
import { GROUP_DISPLAY_CONFIG } from '@/lib/constants/groupDisplay'
import { StreakCard } from '@/features/streaks/components/StreakCard'
import { Flame, Trophy } from 'lucide-react'

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

      // Load suggested users (top 3) with 1 hour cache
      try {
        const suggestions = await cachedQuery(
          `suggested_users_${user.id}`,
          () => firebaseUserApi.getSuggestedUsers(3),
          {
            memoryTtl: 60 * 60 * 1000,
            localTtl: 60 * 60 * 1000,
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
      className="hidden xl:block w-[368px] flex-shrink-0 pl-8 pr-4"
      aria-label="Suggestions and goals sidebar"
    >
      <div className="sticky top-0 pt-8 space-y-6 pb-6 max-h-screen overflow-y-auto no-scrollbar">
        {/* Streak Card - Duolingo Style */}
        {user && (
          <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] overflow-hidden hover:border-[#DDF4FF] transition-colors">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Flame className="w-6 h-6 text-[#FF9600]" fill="#FF9600" />
                <span className="font-extrabold text-[#4B4B4B] text-lg tracking-tight">Streak</span>
              </div>
              <Link
                href="/analytics"
                className="text-xs font-bold text-[#1CB0F6] hover:text-[#0088CC] uppercase tracking-widest hover:bg-[#DDF4FF] px-3 py-1.5 rounded-lg transition-colors"
              >
                View
              </Link>
            </div>
            <div className="px-5 pb-5">
              <StreakCard userId={user.id} variant="compact" showProgress={false} />
            </div>
          </div>
        )}

        {/* Suggested Friends - Duolingo Style */}
        <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] overflow-hidden hover:border-[#DDF4FF] transition-colors">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="font-extrabold text-[#4B4B4B] text-lg tracking-tight">
              Add Friends
            </span>
            <Link
              href="/search"
              className="text-xs font-bold text-[#1CB0F6] hover:text-[#0088CC] uppercase tracking-widest hover:bg-[#DDF4FF] px-3 py-1.5 rounded-lg transition-colors"
            >
              Find
            </Link>
          </div>

          <div className="px-2 pb-2">
            {isLoadingUsers ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse p-2">
                    <div className="w-12 h-12 bg-[#E5E5E5] rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-[#E5E5E5] rounded w-24 mb-2"></div>
                      <div className="h-3 bg-[#E5E5E5] rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : suggestedUsers.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-[#AFAFAF] font-bold">No suggestions available</p>
              </div>
            ) : (
              <div className="space-y-1">
                {suggestedUsers.map((suggestedUser) => (
                  <Link
                    key={suggestedUser.id}
                    href={`/profile/${suggestedUser.username}`}
                    className="flex items-center gap-3 p-3 hover:bg-[#F7F7F7] rounded-xl transition-colors group"
                  >
                    {suggestedUser.profilePicture ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 p-0.5 bg-gradient-to-br from-[#58CC02] to-[#45A000]">
                        <Image
                          src={suggestedUser.profilePicture}
                          alt={`${suggestedUser.name}'s profile picture`}
                          width={48}
                          height={48}
                          className="w-full h-full rounded-full object-cover border-2 border-white"
                          loading="lazy"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 p-0.5 bg-gradient-to-br from-[#58CC02] to-[#45A000]">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center border-2 border-white">
                          <span className="text-[#3C3C3C] font-bold text-sm">
                            {suggestedUser.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#4B4B4B] truncate group-hover:text-[#58CC02] transition-colors">
                        {suggestedUser.name}
                      </p>
                      <p className="text-xs text-[#AFAFAF] font-bold truncate">
                        @{suggestedUser.username}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleFollowToggle(suggestedUser.id)
                      }}
                      className={`px-4 py-2 text-xs rounded-xl font-extrabold tracking-wide transition-all uppercase ${
                        followingUsers.has(suggestedUser.id)
                          ? 'bg-transparent text-[#AFAFAF] hover:bg-[#E5E5E5] hover:text-[#777777]'
                          : 'bg-[#1CB0F6] text-white border-b-4 border-[#1496D4] hover:bg-[#20BAF8] active:border-b-0 active:translate-y-1'
                      }`}
                      aria-label={
                        followingUsers.has(suggestedUser.id)
                          ? `Unfollow ${suggestedUser.name}`
                          : `Follow ${suggestedUser.name}`
                      }
                    >
                      {followingUsers.has(suggestedUser.id) ? 'Following' : 'Follow'}
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Suggested Groups - Duolingo Style */}
        <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] overflow-hidden hover:border-[#DDF4FF] transition-colors">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-[#CE82FF]" fill="#CE82FF" />
              <span className="font-extrabold text-[#4B4B4B] text-lg tracking-tight">Groups</span>
            </div>
            <Link
              href="/groups"
              className="text-xs font-bold text-[#1CB0F6] hover:text-[#0088CC] uppercase tracking-widest hover:bg-[#DDF4FF] px-3 py-1.5 rounded-lg transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="px-2 pb-2">
            {isLoadingGroups ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse p-2">
                    <div className="w-12 h-12 bg-[#E5E5E5] rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-[#E5E5E5] rounded w-24 mb-2"></div>
                      <div className="h-3 bg-[#E5E5E5] rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : fetchedSuggestedGroups.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-[#AFAFAF] font-bold">No groups available</p>
              </div>
            ) : (
              <div className="space-y-1">
                {fetchedSuggestedGroups.slice(0, 3).map((group) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-[#F7F7F7] rounded-xl transition-colors group"
                  >
                    <GroupAvatar imageUrl={group.imageUrl} name={group.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#4B4B4B] truncate group-hover:text-[#CE82FF] transition-colors">
                        {group.name}
                      </p>
                      <p className="text-xs text-[#AFAFAF] font-bold">
                        {group.memberCount || 0} {group.memberCount === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (!user || joinedGroupIds.has(group.id)) return

                        setJoinedGroupIds((prev) => new Set(prev).add(group.id))

                        joinGroupMutation.mutate(
                          {
                            groupId: group.id,
                            userId: user.id,
                          },
                          {
                            onError: (error) => {
                              debug.error('Failed to join group:', error)
                              setJoinedGroupIds((prev) => {
                                const next = new Set(prev)
                                next.delete(group.id)
                                return next
                              })
                            },
                          }
                        )
                      }}
                      className={`px-4 py-2 text-xs rounded-xl font-extrabold tracking-wide transition-all uppercase ${
                        joinedGroupIds.has(group.id)
                          ? 'bg-transparent text-[#AFAFAF] hover:bg-[#E5E5E5] hover:text-[#777777]'
                          : 'bg-[#1CB0F6] text-white border-b-4 border-[#1496D4] hover:bg-[#20BAF8] active:border-b-0 active:translate-y-1'
                      }`}
                      disabled={joinedGroupIds.has(group.id)}
                    >
                      {joinedGroupIds.has(group.id) ? 'Joined' : 'Join'}
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <SuggestedPeopleModal isOpen={showPeopleModal} onClose={() => setShowPeopleModal(false)} />
      <SuggestedGroupsModal isOpen={showGroupsModal} onClose={() => setShowGroupsModal(false)} />
    </aside>
  )
}

export default RightSidebar
