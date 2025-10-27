'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/HeaderComponent';
import BottomNavigation from '@/components/BottomNavigation';
import GroupAvatar from '@/components/GroupAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { UserCardCompact } from '@/components/UserCard';
import { Users } from 'lucide-react';
import { firebaseApi } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { CACHE_KEYS } from '@/lib/queryClient';
import type { User, Group } from '@/types';

// Optimized hooks
import {
  useSearchUsers,
  useSearchGroups,
  useSuggestedUsers,
  useSuggestedGroups,
  useFollowingList,
  useUserGroups,
} from '@/features/search/hooks';

// Loading skeletons
import {
  SearchLoadingSkeleton,
  SuggestionsLoadingSkeleton,
} from '@/features/search/components/SearchLoadingSkeleton';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const type = (searchParams.get('type') || 'people') as 'people' | 'groups';

  const [query, setQuery] = useState(initialQuery);
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Debounce search input to reduce API calls
  const debouncedQuery = useDebounce(query, 300);

  // Prefetch following list and user groups in parallel when page loads
  const { followingIds } = useFollowingList({
    userId: user?.id,
    enabled: !!user,
  });

  const { groups: userGroups } = useUserGroups({
    userId: user?.id,
    enabled: !!user && type === 'groups',
  });

  const joinedGroupIds = useMemo(
    () => new Set(userGroups.map(g => g.id)),
    [userGroups]
  );

  // Search hooks - only enabled when there's a search query
  const hasSearchQuery = debouncedQuery.trim().length > 0;

  const { users: searchUsers, isLoading: isSearchingUsers } = useSearchUsers({
    searchTerm: debouncedQuery,
    enabled: hasSearchQuery && type === 'people',
  });

  const { groups: searchGroups, isLoading: isSearchingGroups } =
    useSearchGroups({
      searchTerm: debouncedQuery,
      enabled: hasSearchQuery && type === 'groups',
    });

  // Suggestions hooks - only enabled when there's no search query
  const { suggestedUsers, isLoading: isLoadingSuggestedUsers } =
    useSuggestedUsers({
      enabled: !hasSearchQuery && type === 'people' && !!user,
      limit: 5,
    });

  const { suggestedGroups, isLoading: isLoadingSuggestedGroups } =
    useSuggestedGroups({
      userId: user?.id,
      enabled: !hasSearchQuery && type === 'groups' && !!user,
      limit: 20,
    });

  // Enhance search results with following/joined status
  const enhancedUsers = useMemo(() => {
    if (!hasSearchQuery) return [];

    return searchUsers
      .map(u => ({
        ...u,
        isFollowing: followingIds.has(u.id),
        isSelf: user && u.id === user.id,
      }))
      .sort((a, b) => (b.isSelf ? 1 : 0) - (a.isSelf ? 1 : 0));
  }, [searchUsers, followingIds, user, hasSearchQuery]);

  const enhancedSuggestedUsers = useMemo(() => {
    return suggestedUsers.map(u => ({
      ...u,
      isFollowing: followingIds.has(u.id),
    }));
  }, [suggestedUsers, followingIds]);

  // Determine loading state
  const isLoading = hasSearchQuery
    ? type === 'people'
      ? isSearchingUsers
      : isSearchingGroups
    : type === 'people'
      ? isLoadingSuggestedUsers
      : isLoadingSuggestedGroups;

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    // Optimistically update the following IDs set
    queryClient.setQueryData(
      ['following-ids', user!.id],
      (old: Set<string> = new Set()) => {
        const newSet = new Set(old);
        if (isFollowing) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      }
    );
  };

  const handleJoinGroup = async (groupId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    const isJoined = joinedGroupIds.has(groupId);

    try {
      setJoiningGroup(groupId);

      if (isJoined) {
        await firebaseApi.group.leaveGroup(groupId, user.id);
      } else {
        await firebaseApi.group.joinGroup(groupId, user.id);
      }

      // Invalidate user groups cache to refetch
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.USER_GROUPS(user.id),
      });
    } catch {
      console.error('Failed to join/leave group');
    } finally {
      setJoiningGroup(null);
    }
  };

  const renderUserResult = (
    user: User & { isSelf?: boolean; isFollowing?: boolean }
  ) => {
    if (user.isSelf) {
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
                {user.bio && (
                  <p className="text-sm text-gray-700 mt-1">{user.bio}</p>
                )}
                <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  This is you
                </span>
              </div>
            </div>
          </div>
        </Link>
      );
    }

    return (
      <div key={user.id} className="border-b border-gray-100 last:border-0">
        <UserCardCompact
          user={user}
          variant="search"
          onFollowChange={handleFollowChange}
        />
      </div>
    );
  };

  const renderGroupResult = (group: Group & { members?: number }) => {
    const isJoined = joinedGroupIds.has(group.id);
    const isLoading = joiningGroup === group.id;

    return (
      <div className="p-3 transition-colors">
        <div className="flex items-center gap-3">
          {/* Group Icon */}
          <Link href={`/groups/${group.id}`}>
            <GroupAvatar
              imageUrl={group.imageUrl}
              name={group.name}
              size="md"
            />
          </Link>

          {/* Group Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/groups/${group.id}`}>
              <p className="font-semibold text-sm text-gray-900 hover:text-[#007AFF] truncate mb-0.5 transition-colors">
                {group.name}
              </p>
            </Link>
            <div className="text-xs text-gray-500">
              {group.memberCount || group.members || 0}{' '}
              {(group.memberCount || group.members) === 1
                ? 'member'
                : 'members'}
            </div>
          </div>

          {/* Join Button */}
          <button
            onClick={e => handleJoinGroup(group.id, e)}
            disabled={isLoading}
            className={`text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
              isJoined
                ? 'text-gray-600 hover:text-gray-900'
                : 'text-[#007AFF] hover:text-[#0051D5]'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Joining...' : isJoined ? 'Joined' : 'Join'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - only show on desktop */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile search header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h1 className="text-xl font-semibold text-gray-900">Discover</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-4 md:py-8 md:pt-24">
        {/* Search Info - only show if there's a query */}
        {initialQuery && (
          <div className="mb-6 hidden md:block">
            <h1 className="text-2xl font-bold text-gray-900">
              Search Results for "{initialQuery}"
            </h1>
            <p className="text-gray-600 mt-1">
              Searching in {type.charAt(0).toUpperCase() + type.slice(1)}
            </p>
          </div>
        )}

        {/* Mobile Search Form */}
        <div className="md:hidden mb-6">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (query.trim())
                window.location.href = `/search?q=${encodeURIComponent(query.trim())}&type=${type}`;
            }}
          >
            <div className="space-y-4">
              {/* Filter Tabs */}
              <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    (window.location.href = `/search?q=${encodeURIComponent(initialQuery)}&type=people`)
                  }
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-all border-r border-gray-200 last:border-r-0 ${
                    type === 'people'
                      ? 'bg-[#007AFF] text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  People
                </button>
                <button
                  type="button"
                  onClick={() =>
                    (window.location.href = `/search?q=${encodeURIComponent(initialQuery)}&type=groups`)
                  }
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                    type === 'groups'
                      ? 'bg-[#007AFF] text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Groups
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={`Search ${type}...`}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FC4C02] focus:border-transparent text-base"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#FC4C02] transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        <div>
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
                          {enhancedSuggestedUsers.map(suggestedUser => (
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
                          There are no people available at the moment. Check
                          back later!
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
                          <h3 className="text-lg font-semibold text-gray-900">
                            Suggested Groups
                          </h3>
                        </div>
                        <div className="space-y-1">
                          {suggestedGroups.slice(0, 5).map(group => (
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
                          There are no groups available at the moment. Check
                          back later!
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
                  <svg
                    className="w-20 h-20 mx-auto text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    No results found
                  </h3>
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
                  <svg
                    className="w-20 h-20 mx-auto text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    No results found
                  </h3>
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
                      Found {searchGroups.length}{' '}
                      {searchGroups.length === 1 ? 'result' : 'results'}
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
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
