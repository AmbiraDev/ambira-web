'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/components/HeaderComponent'
import BottomNavigation from '@/components/BottomNavigation'
import GroupAvatar from '@/features/groups/components/GroupAvatar'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { UserCardCompact } from '@/features/social/components/UserCard'
import { Users, Search } from 'lucide-react'
import { firebaseApi } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { CACHE_KEYS } from '@/lib/queryClient'
import { LoadingScreen } from '@/components/LoadingScreen'
import type {
  Group,
  UserSearchResult,
  SuggestedUser,
  GroupSearchResult,
  SuggestedGroup,
} from '@/types'

// Optimized hooks
import {
  useSearchUsers,
  useSearchGroups,
  useSuggestedUsers,
  useSuggestedGroups,
  useFollowingList,
  useUserGroups,
} from '@/features/search/hooks'

// Loading skeletons
import {
  SearchLoadingSkeleton,
  SuggestionsLoadingSkeleton,
} from '@/features/search/components/SearchLoadingSkeleton'

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const type = (searchParams.get('type') || 'people') as 'people' | 'groups'

  const [query, setQuery] = useState(initialQuery)
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null)
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Debounce search input to reduce API calls
  const debouncedQuery = useDebounce(query, 300)

  // Prefetch following list and user groups in parallel when page loads
  const { followingIds } = useFollowingList({
    userId: user?.id,
    enabled: !!user,
  })

  const { groups: userGroups } = useUserGroups({
    userId: user?.id,
    enabled: !!user && type === 'groups',
  })

  const joinedGroupIds = useMemo(() => new Set(userGroups.map((g) => g.id)), [userGroups])

  // Search hooks - only enabled when there's a search query
  const hasSearchQuery = debouncedQuery.trim().length > 0

  const { users: searchUsers, isLoading: isSearchingUsers } = useSearchUsers({
    searchTerm: debouncedQuery,
    enabled: hasSearchQuery && type === 'people',
  })

  const { groups: searchGroups, isLoading: isSearchingGroups } = useSearchGroups({
    searchTerm: debouncedQuery,
    enabled: hasSearchQuery && type === 'groups',
  })

  // Suggestions hooks - only enabled when there's no search query
  const { suggestedUsers, isLoading: isLoadingSuggestedUsers } = useSuggestedUsers({
    enabled: !hasSearchQuery && type === 'people' && !!user,
    limit: 5,
  })

  const { suggestedGroups, isLoading: isLoadingSuggestedGroups } = useSuggestedGroups({
    userId: user?.id,
    enabled: !hasSearchQuery && type === 'groups' && !!user,
    limit: 20,
  })

  // Enhance search results with following/joined status
  const enhancedUsers = useMemo((): UserSearchResult[] => {
    if (!hasSearchQuery) return []

    return searchUsers
      .map((u) => ({
        ...u,
        isFollowing: followingIds.has(u.id),
        isSelf: user && u.id === user.id ? true : null,
      }))
      .sort((a, b) => (b.isSelf ? 1 : 0) - (a.isSelf ? 1 : 0))
  }, [searchUsers, followingIds, user, hasSearchQuery])

  const enhancedSuggestedUsers = useMemo((): SuggestedUser[] => {
    return suggestedUsers.map((u) => ({
      ...u,
      isFollowing: followingIds.has(u.id),
    }))
  }, [suggestedUsers, followingIds])

  // Determine loading state
  const isLoading = hasSearchQuery
    ? type === 'people'
      ? isSearchingUsers
      : isSearchingGroups
    : type === 'people'
      ? isLoadingSuggestedUsers
      : isLoadingSuggestedGroups

  // Memoize the follow handler
  const handleFollowChange = useCallback(
    (userId: string, isFollowing: boolean) => {
      // Optimistically update the following IDs set
      queryClient.setQueryData(['following-ids', user!.id], (old: Set<string> = new Set()) => {
        const newSet = new Set(old)
        if (isFollowing) {
          newSet.add(userId)
        } else {
          newSet.delete(userId)
        }
        return newSet
      })
    },
    [queryClient, user]
  )

  // Memoize the join group handler
  const handleJoinGroup = useCallback(
    async (groupId: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!user) return

      const isJoined = joinedGroupIds.has(groupId)

      try {
        setJoiningGroup(groupId)

        if (isJoined) {
          await firebaseApi.group.leaveGroup(groupId, user.id)
        } else {
          await firebaseApi.group.joinGroup(groupId, user.id)
        }

        // Invalidate user groups cache to refetch
        queryClient.invalidateQueries({
          queryKey: CACHE_KEYS.USER_GROUPS(user.id),
        })
      } catch {
      } finally {
        setJoiningGroup(null)
      }
    },
    [user, joinedGroupIds, queryClient]
  )

  const renderUserResult = (user: UserSearchResult | SuggestedUser) => {
    if ('isSelf' in user && user.isSelf) {
      return (
        <Link
          key={user.id}
          href={`/profile/${user.username}`}
          className="block border-b border-gray-100 last:border-0"
        >
          <div className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold bg-green-100 text-green-800 ring-2 ring-green-400">
                {(user.username?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-600">@{user.username}</p>
                {user.bio && <p className="text-sm text-gray-700 mt-1">{user.bio}</p>}
                <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  This is you
                </span>
              </div>
            </div>
          </div>
        </Link>
      )
    }

    return (
      <div key={user.id} className="border-b border-gray-100 last:border-0">
        <UserCardCompact user={user} variant="search" onFollowChange={handleFollowChange} />
      </div>
    )
  }

  const renderGroupResult = (
    group: GroupSearchResult | SuggestedGroup | (Group & { members?: number })
  ) => {
    const isJoined = joinedGroupIds.has(group.id)
    const isLoading = joiningGroup === group.id

    return (
      <div className="p-3 md:p-4 transition-colors">
        <div className="flex items-start md:items-center gap-3 md:gap-4">
          {/* Group Icon */}
          <Link href={`/groups/${group.id}`} className="flex-shrink-0">
            <div className="md:hidden">
              <GroupAvatar imageUrl={group.imageUrl} name={group.name} size="md" />
            </div>
            <div className="hidden md:block">
              <GroupAvatar imageUrl={group.imageUrl} name={group.name} size="lg" />
            </div>
          </Link>

          {/* Group Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/groups/${group.id}`}>
              <p className="font-semibold text-sm md:text-base text-gray-900 hover:text-[#0066CC] truncate mb-0.5 md:mb-1 transition-colors">
                {group.name}
              </p>
            </Link>
            {'description' in group && group.description && (
              <p className="hidden md:block text-sm text-gray-600 mb-2 line-clamp-2">
                {group.description}
              </p>
            )}
            <div className="text-xs md:text-sm text-gray-500">
              {group.memberCount || group.members || 0}{' '}
              {(group.memberCount || group.members) === 1 ? 'member' : 'members'}
            </div>
          </div>

          {/* Join Button */}
          <button
            onClick={(e) => handleJoinGroup(group.id, e)}
            disabled={isLoading}
            className={`text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 min-h-[36px] md:min-h-[40px] px-4 md:px-6 py-2 rounded-lg ${
              isJoined
                ? 'text-gray-600 hover:text-gray-900 border border-gray-300'
                : 'text-white bg-[#0066CC] hover:bg-[#0051D5]'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Joining...' : isJoined ? 'Joined' : 'Join'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - only show on desktop */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile search header */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Back button */}
          <button
            onClick={() => window.history.back()}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Centered title */}
          <h1 className="text-lg font-semibold text-gray-900 absolute left-1/2 -translate-x-1/2">
            Discover
          </h1>

          {/* Empty spacer for symmetry */}
          <div className="w-10" />
        </div>

        {/* Mobile Filter Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() =>
              (window.location.href = `/search?q=${encodeURIComponent(initialQuery)}&type=people`)
            }
            className={`relative flex-1 py-4 px-4 text-base font-medium transition-colors ${
              type === 'people' ? 'text-[#0066CC]' : 'text-gray-500'
            }`}
          >
            People
            {type === 'people' && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#0066CC]" />
            )}
          </button>
          <button
            type="button"
            onClick={() =>
              (window.location.href = `/search?q=${encodeURIComponent(initialQuery)}&type=groups`)
            }
            className={`relative flex-1 py-4 px-4 text-base font-medium transition-colors ${
              type === 'groups' ? 'text-[#0066CC]' : 'text-gray-500'
            }`}
          >
            Groups
            {type === 'groups' && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#0066CC]" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop centered container */}
      <div className="hidden md:flex md:justify-center md:pt-8 md:pb-16 md:px-8">
        <div className="w-full max-w-2xl">
          {/* Desktop Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {initialQuery ? `Search Results for "${initialQuery}"` : 'Discover'}
            </h1>

            {/* Desktop Filter Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                type="button"
                onClick={() =>
                  (window.location.href = `/search?q=${encodeURIComponent(initialQuery)}&type=people`)
                }
                className={`relative py-3 px-6 text-base font-medium transition-colors ${
                  type === 'people' ? 'text-[#0066CC]' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                People
                {type === 'people' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0066CC]" />
                )}
              </button>
              <button
                type="button"
                onClick={() =>
                  (window.location.href = `/search?q=${encodeURIComponent(initialQuery)}&type=groups`)
                }
                className={`relative py-3 px-6 text-base font-medium transition-colors ${
                  type === 'groups' ? 'text-[#0066CC]' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Groups
                {type === 'groups' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0066CC]" />
                )}
              </button>
            </div>

            {/* Desktop Search Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (query.trim())
                  window.location.href = `/search?q=${encodeURIComponent(query.trim())}&type=${type}`
              }}
            >
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${type}...`}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent text-base"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#0066CC] transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Desktop Results */}
          {!hasSearchQuery ? (
            isLoading ? (
              <SuggestionsLoadingSkeleton />
            ) : (
              <div className="space-y-6">
                {/* Suggested People - only show on People tab */}
                {type === 'people' && (
                  <>
                    {enhancedSuggestedUsers.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            People you might like
                          </h3>
                        </div>
                        <div className="space-y-1">
                          {enhancedSuggestedUsers.map((suggestedUser) => (
                            <div
                              key={suggestedUser.id}
                              className="bg-white rounded-lg overflow-hidden"
                            >
                              <UserCardCompact
                                user={suggestedUser}
                                variant="search"
                                onFollowChange={handleFollowChange}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No people to suggest
                        </h3>
                        <p className="text-gray-600 text-sm">
                          There are no people available at the moment. Check back later!
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Suggested Groups - only show on Groups tab */}
                {type === 'groups' && (
                  <>
                    {suggestedGroups.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                          <h3 className="text-lg font-semibold text-gray-900">Suggested Groups</h3>
                        </div>
                        <div className="space-y-1">
                          {suggestedGroups.slice(0, 5).map((group) => (
                            <div
                              key={group.id}
                              className="bg-white rounded-lg overflow-hidden hover:bg-gray-50 transition-colors"
                            >
                              {renderGroupResult(group)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No groups to suggest
                        </h3>
                        <p className="text-gray-600 text-sm">
                          There are no groups available at the moment. Check back later!
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          ) : isLoading ? (
            <SearchLoadingSkeleton type={type} count={5} />
          ) : (
            <>
              {type === 'people' && enhancedUsers.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Search className="w-20 h-20 mx-auto text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
                  <p className="text-gray-600 mt-2">
                    No {type} found matching "{debouncedQuery}"
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Try a different search term or filter
                  </p>
                </div>
              )}

              {type === 'groups' && searchGroups.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Search className="w-20 h-20 mx-auto text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
                  <p className="text-gray-600 mt-2">
                    No {type} found matching "{debouncedQuery}"
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Try a different search term or filter
                  </p>
                </div>
              )}

              {type === 'people' && enhancedUsers.length > 0 && (
                <div>
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">
                      Found {enhancedUsers.length}{' '}
                      {enhancedUsers.length === 1 ? 'result' : 'results'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {enhancedUsers.map(renderUserResult)}
                  </div>
                </div>
              )}

              {type === 'groups' && searchGroups.length > 0 && (
                <div>
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">
                      Found {searchGroups.length} {searchGroups.length === 1 ? 'result' : 'results'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {searchGroups.map(renderGroupResult)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile container */}
      <div className="md:hidden pt-6 pb-4 min-h-[calc(100vh-3.5rem)]">
        {/* Mobile Search Form */}
        <div className="mb-6 px-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (query.trim())
                window.location.href = `/search?q=${encodeURIComponent(query.trim())}&type=${type}`
            }}
          >
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${type}...`}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FC4C02] focus:border-transparent text-base"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#FC4C02] transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        {/* Mobile Results */}
        <div className="px-4">
          {!hasSearchQuery ? (
            isLoading ? (
              <SuggestionsLoadingSkeleton />
            ) : (
              <div className="space-y-6">
                {/* Suggested People - only show on People tab */}
                {type === 'people' && (
                  <>
                    {enhancedSuggestedUsers.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            People you might like
                          </h3>
                        </div>
                        <div className="space-y-1">
                          {enhancedSuggestedUsers.map((suggestedUser) => (
                            <div
                              key={suggestedUser.id}
                              className="bg-white rounded-lg overflow-hidden"
                            >
                              <UserCardCompact
                                user={suggestedUser}
                                variant="search"
                                onFollowChange={handleFollowChange}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No people to suggest
                        </h3>
                        <p className="text-gray-600 text-sm">
                          There are no people available at the moment. Check back later!
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Suggested Groups - only show on Groups tab */}
                {type === 'groups' && (
                  <>
                    {suggestedGroups.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                          <h3 className="text-lg font-semibold text-gray-900">Suggested Groups</h3>
                        </div>
                        <div className="space-y-1">
                          {suggestedGroups.slice(0, 5).map((group) => (
                            <div
                              key={group.id}
                              className="bg-white rounded-lg overflow-hidden hover:bg-gray-50 transition-colors"
                            >
                              {renderGroupResult(group)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No groups to suggest
                        </h3>
                        <p className="text-gray-600 text-sm">
                          There are no groups available at the moment. Check back later!
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          ) : isLoading ? (
            <SearchLoadingSkeleton type={type} count={5} />
          ) : (
            <>
              {type === 'people' && enhancedUsers.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Search className="w-20 h-20 mx-auto text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
                  <p className="text-gray-600 mt-2">
                    No {type} found matching "{debouncedQuery}"
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Try a different search term or filter
                  </p>
                </div>
              )}

              {type === 'groups' && searchGroups.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Search className="w-20 h-20 mx-auto text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
                  <p className="text-gray-600 mt-2">
                    No {type} found matching "{debouncedQuery}"
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Try a different search term or filter
                  </p>
                </div>
              )}

              {type === 'people' && enhancedUsers.length > 0 && (
                <div>
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">
                      Found {enhancedUsers.length}{' '}
                      {enhancedUsers.length === 1 ? 'result' : 'results'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {enhancedUsers.map(renderUserResult)}
                  </div>
                </div>
              )}

              {type === 'groups' && searchGroups.length > 0 && (
                <div>
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">
                      Found {searchGroups.length} {searchGroups.length === 1 ? 'result' : 'results'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {searchGroups.map(renderGroupResult)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      <BottomNavigation />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SearchContent />
    </Suspense>
  )
}
