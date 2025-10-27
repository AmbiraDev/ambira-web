'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useUserGroups,
  usePublicGroups,
  useJoinGroup,
} from '@/features/groups/hooks';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import GroupCard from '@/components/GroupCard';
import { GroupListItem } from '@/components/GroupListItem';
import { Group } from '@/types';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react';
import Link from 'next/link';

// Category filter options
const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'study', label: 'Study' },
  { value: 'work', label: 'Work' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' },
];

// Pagination and layout constants
const GROUPS_PER_PAGE = 10;
const SEARCH_RESULTS_LIMIT = 50;
const _MY_GROUPS_GRID_COLS = {
  mobile: 4,
  tablet: 6,
  desktop: 8,
} as const;

export default function GroupsPage() {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');

  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    name: '',
    location: '',
    category: '',
  });

  // Use new group hooks
  const { data: userGroups = [], isLoading: isLoadingUserGroups } =
    useUserGroups(user?.id || '', {
      enabled: !!user?.id,
    });

  const { data: allPublicGroups = [], isLoading: isLoadingSuggested } =
    usePublicGroups(undefined, {
      enabled: !!user,
    });

  const joinGroupMutation = useJoinGroup();
  const isLoading = isLoadingUserGroups || isLoadingSuggested;

  // Client-side filtering for search
  const hasActiveFilters = !!(
    searchFilters.name ||
    searchFilters.location ||
    searchFilters.category
  );

  const filteredSearchResults = useMemo(() => {
    if (!hasActiveFilters) return [];

    return allPublicGroups
      .filter(group => {
        const matchesName =
          searchFilters.name === '' ||
          group.name.toLowerCase().includes(searchFilters.name.toLowerCase());
        const matchesLocation =
          searchFilters.location === '' ||
          (group.location
            ?.toLowerCase()
            .includes(searchFilters.location.toLowerCase()) ??
            false);
        const matchesCategory =
          searchFilters.category === '' ||
          group.category === searchFilters.category;

        return matchesName && matchesLocation && matchesCategory;
      })
      .slice(0, SEARCH_RESULTS_LIMIT);
  }, [allPublicGroups, searchFilters]);

  // Update search results when filtered results change
  useEffect(() => {
    if (hasSearched && filteredSearchResults.length >= 0) {
      setSearchResults(filteredSearchResults);
    }
  }, [filteredSearchResults, hasSearched]);

  /**
   * Executes a group search based on current filter criteria.
   * Updates search results state and resets pagination to first page.
   */
  const handleSearch = useCallback(async () => {
    if (!user) return;

    try {
      setIsSearching(true);
      setHasSearched(true);
      setCurrentPage(0);
      setSearchStatus('Searching for groups...');

      // Use client-side filtered results
      if (filteredSearchResults.length > 0) {
        setSearchResults(filteredSearchResults);
        setSearchStatus(
          `Found ${filteredSearchResults.length} ${filteredSearchResults.length === 1 ? 'group' : 'groups'}`
        );
      } else {
        setSearchStatus('No groups found');
      }
    } catch (error) {
      console.error('Error searching groups:', error);
      setSearchStatus('Error searching groups. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [user, filteredSearchResults]);

  /**
   * Clears a specific search filter and updates the filter state.
   * @param filterKey - The key of the filter to clear (name, location, or category)
   */
  const clearFilter = (filterKey: keyof typeof searchFilters) => {
    setSearchFilters({ ...searchFilters, [filterKey]: '' });
  };

  /**
   * Clears all active search filters and resets search state.
   * Returns to default discover groups view.
   */
  const clearAllFilters = () => {
    setSearchFilters({ name: '', location: '', category: '' });
    setHasSearched(false);
    setSearchResults([]);
  };

  // Memoized pagination calculations to avoid unnecessary recalculations
  const { totalPages, paginatedGroups } = useMemo(() => {
    const pages = Math.ceil(allPublicGroups.length / GROUPS_PER_PAGE);
    const startIndex = currentPage * GROUPS_PER_PAGE;
    const endIndex = startIndex + GROUPS_PER_PAGE;
    const groups = allPublicGroups.slice(startIndex, endIndex);

    return {
      totalPages: pages,
      paginatedGroups: groups,
    };
  }, [allPublicGroups, currentPage]);

  /**
   * Advances to the next page of groups if available.
   */
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  /**
   * Returns to the previous page of groups if available.
   */
  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  /**
   * Handles joining a group for the current user.
   * Uses the new joinGroupMutation hook for automatic cache invalidation.
   * @param groupId - The ID of the group to join
   * @param e - The click event (prevented to avoid navigation)
   */
  const handleJoinGroup = async (groupId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    try {
      await joinGroupMutation.mutateAsync({ groupId, userId: user.id });
      // Automatic cache invalidation handled by mutation
    } catch (error) {
      console.error('Failed to join group:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to view groups
          </h1>
          <p className="text-gray-600">
            You need to be logged in to join groups and challenges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden md:block">
        <Header />
      </div>
      <MobileHeader title="Groups" />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Groups
            </h1>
          </div>
          <Link
            href="/groups/new"
            aria-label="Create a new group"
            className="min-h-[44px] px-4 py-2 md:px-6 md:py-2.5 bg-[#007AFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0051D5] transition-all duration-200 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2"
          >
            Create a Group
          </Link>
        </div>

        {/* My Groups Section */}
        {isLoading ? (
          <div className="mb-8">
            <div className="mb-4">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="mb-3 w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              My Groups
            </h2>
            {userGroups.length > 0 ? (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {userGroups.map(group => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    currentUserId={user?.id}
                    isJoined={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 bg-white border border-gray-200 rounded-lg">
                <div className="max-w-md mx-auto">
                  <Users
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
                    aria-hidden="true"
                  />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    You haven't joined any groups yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Join groups to connect with like-minded people, participate
                    in challenges, and stay motivated!
                  </p>
                  <button
                    onClick={() => {
                      const discoverSection =
                        document.getElementById('discover-groups');
                      discoverSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    aria-label="Scroll to discover groups section"
                    className="min-h-[44px] px-6 py-2.5 bg-[#007AFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0051D5] transition-all duration-200 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2"
                  >
                    <Search className="w-4 h-4" aria-hidden="true" />
                    Explore Groups Below
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Screen reader announcements for search status */}
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {searchStatus}
        </div>

        {/* Search Section */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Group Name"
              aria-label="Search by group name"
              value={searchFilters.name}
              onChange={e =>
                setSearchFilters({ ...searchFilters, name: e.target.value })
              }
              className="min-h-[44px] px-4 py-2 border border-gray-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 bg-white"
            />
            <input
              type="text"
              placeholder="Location"
              aria-label="Filter by location"
              value={searchFilters.location}
              onChange={e =>
                setSearchFilters({ ...searchFilters, location: e.target.value })
              }
              className="min-h-[44px] px-4 py-2 border border-gray-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 bg-white"
            />
            <select
              value={searchFilters.category}
              onChange={e =>
                setSearchFilters({ ...searchFilters, category: e.target.value })
              }
              aria-label="Filter by category"
              className="min-h-[44px] px-4 py-2 border border-gray-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 bg-white"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              aria-label={
                isSearching ? 'Searching for groups' : 'Search groups'
              }
              className="min-h-[44px] px-6 py-2 bg-[#007AFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0051D5] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2"
            >
              {isSearching ? (
                <>
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    aria-hidden="true"
                  />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" aria-hidden="true" />
                  Search
                </>
              )}
            </button>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">
                Active filters:
              </span>
              {searchFilters.name && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#007AFF] text-white text-xs font-semibold rounded-full transition-all duration-200 hover:bg-[#0051D5]">
                  Name: {searchFilters.name}
                  <button
                    onClick={() => clearFilter('name')}
                    aria-label="Remove name filter"
                    className="hover:bg-white/20 rounded-full p-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              )}
              {searchFilters.location && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#007AFF] text-white text-xs font-semibold rounded-full transition-all duration-200 hover:bg-[#0051D5]">
                  Location: {searchFilters.location}
                  <button
                    onClick={() => clearFilter('location')}
                    aria-label="Remove location filter"
                    className="hover:bg-white/20 rounded-full p-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              )}
              {searchFilters.category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#007AFF] text-white text-xs font-semibold rounded-full transition-all duration-200 hover:bg-[#0051D5]">
                  Category:{' '}
                  {
                    categoryOptions.find(
                      opt => opt.value === searchFilters.category
                    )?.label
                  }
                  <button
                    onClick={() => clearFilter('category')}
                    aria-label="Remove category filter"
                    className="hover:bg-white/20 rounded-full p-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium underline transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 rounded px-1"
                aria-label="Clear all filters"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Search Results or Suggested Groups */}
        {isSearching ? (
          <div>
            <div className="mb-4">
              <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : hasSearched && searchResults.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Search Results
            </h2>
            <div className="space-y-4">
              {searchResults.map(group => {
                const isJoined = userGroups.some(g => g.id === group.id);
                return (
                  <GroupListItem
                    key={group.id}
                    group={group}
                    isJoined={isJoined}
                    isJoining={joinGroupMutation.isPending}
                    onJoinGroup={handleJoinGroup}
                  />
                );
              })}
            </div>
          </div>
        ) : hasSearched && !isSearching && searchResults.length === 0 ? (
          <div className="text-center py-12">
            <Users
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              aria-hidden="true"
            />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No groups found
            </h2>
            <p className="text-gray-600">Try adjusting your search filters</p>
          </div>
        ) : !hasSearched ? (
          allPublicGroups.length > 0 ? (
            <div id="discover-groups">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Discover Groups
              </h2>
              <div className="space-y-4">
                {paginatedGroups.map(group => {
                  const isJoined = userGroups.some(g => g.id === group.id);
                  return (
                    <GroupListItem
                      key={group.id}
                      group={group}
                      isJoined={isJoined}
                      isJoining={joinGroupMutation.isPending}
                      onJoinGroup={handleJoinGroup}
                    />
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {allPublicGroups.length > GROUPS_PER_PAGE && (
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 0}
                    className="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2"
                    aria-label="Previous page"
                  >
                    <ChevronLeft
                      className="w-5 h-5 text-gray-700"
                      aria-hidden="true"
                    />
                  </button>

                  <span className="text-sm text-gray-600 font-medium">
                    Page {currentPage + 1} of {totalPages}
                  </span>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage >= totalPages - 1}
                    className="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2"
                    aria-label="Next page"
                  >
                    <ChevronRight
                      className="w-5 h-5 text-gray-700"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                aria-hidden="true"
              />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No groups available
              </h2>
              <p className="text-gray-600">Be the first to create a group!</p>
            </div>
          )
        ) : null}
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      <BottomNavigation />
    </div>
  );
}
