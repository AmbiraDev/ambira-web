'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import GroupCard from '@/components/GroupCard';
import GroupAvatar from '@/components/GroupAvatar';
// import CreateGroupModal from '@/components/CreateGroupModal';
import { Group } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';
import { Users, Search, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import Link from 'next/link';

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'study', label: 'Study' },
  { value: 'work', label: 'Work' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' },
];

const GROUPS_PER_PAGE = 10;
const TOTAL_GROUPS_TO_FETCH = 100;

export default function GroupsPage() {
  const { user } = useAuth();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [allSuggestedGroups, setAllSuggestedGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [joiningGroups, setJoiningGroups] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  // const [showCreateModal, setShowCreateModal] = useState(false);

  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    name: '',
    location: '',
    category: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      // Load user's groups
      const userGroupsData = await firebaseApi.group.getUserGroups(user.id);
      setUserGroups(userGroupsData);

      // Load suggested groups (exclude groups user is already in)
      const suggestedGroups = await firebaseApi.group.searchGroups({}, TOTAL_GROUPS_TO_FETCH);
      const userGroupIds = new Set(userGroupsData.map(g => g.id));
      const filteredSuggested = suggestedGroups.filter(g => !userGroupIds.has(g.id));
      setAllSuggestedGroups(filteredSuggested);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!user) return;

    try {
      setIsSearching(true);
      setHasSearched(true);
      setCurrentPage(0);

      // Build search criteria
      const criteria: any = { privacySetting: 'public' };

      if (searchFilters.category) {
        criteria.category = searchFilters.category;
      }

      // Search for groups
      const results = await firebaseApi.group.searchGroups(criteria, 50);

      // Filter by name and location on client side
      let filtered = results;

      if (searchFilters.name) {
        const nameLower = searchFilters.name.toLowerCase();
        filtered = filtered.filter(g => g.name.toLowerCase().includes(nameLower));
      }

      if (searchFilters.location) {
        const locationLower = searchFilters.location.toLowerCase();
        filtered = filtered.filter(g => g.location?.toLowerCase().includes(locationLower));
      }

      // Exclude groups user is already in
      const userGroupIds = new Set(userGroups.map(g => g.id));
      filtered = filtered.filter(g => !userGroupIds.has(g.id));

      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching groups:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Calculate paginated groups
  const totalPages = Math.ceil(allSuggestedGroups.length / GROUPS_PER_PAGE);
  const startIndex = currentPage * GROUPS_PER_PAGE;
  const endIndex = startIndex + GROUPS_PER_PAGE;
  const paginatedGroups = allSuggestedGroups.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleJoinGroup = async (groupId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || joiningGroups.has(groupId)) return;

    setJoiningGroups(prev => new Set(prev).add(groupId));
    try {
      await firebaseApi.group.joinGroup(groupId, user.id);
      // Remove from suggestions after joining and add to user groups
      setAllSuggestedGroups(prev => prev.filter(g => g.id !== groupId));
      await loadData();
    } catch (error) {
      console.error('Failed to join group:', error);
    } finally {
      setJoiningGroups(prev => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    }
  };

  // const handleCreateGroup = async (data: any) => {
  //   if (!user) return;

  //   try {
  //     await firebaseApi.group.createGroup({
  //       ...data,
  //       creatorId: user.id,
  //     });
  //     await loadData();
  //     setShowCreateModal(false);
  //   } catch (error) {
  //     console.error('Error creating group:', error);
  //     throw error;
  //   }
  // };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view groups</h1>
          <p className="text-gray-600">You need to be logged in to join groups and challenges.</p>
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

      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
          </div>
          <Link
            href="/groups/new"
            className="px-4 py-2 md:px-6 md:py-2.5 bg-[#007AFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0056D6] transition-colors inline-flex items-center justify-center"
          >
            Create a Group
          </Link>
        </div>

        {/* My Groups Section */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
          </div>
        ) : userGroups.length > 0 ? (
          <div className="mb-8">
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {userGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  currentUserId={user?.id}
                  isJoined={true}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Search Section */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Group Name"
              value={searchFilters.name}
              onChange={(e) => setSearchFilters({ ...searchFilters, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white"
            />
            <input
              type="text"
              placeholder="Location"
              value={searchFilters.location}
              onChange={(e) => setSearchFilters({ ...searchFilters, location: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white"
            />
            <select
              value={searchFilters.category}
              onChange={(e) => setSearchFilters({ ...searchFilters, category: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white"
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
              className="px-6 py-2 bg-[#007AFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0056D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Search Results or Suggested Groups */}
        {hasSearched && searchResults.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h2>
            <div className="space-y-4">
              {searchResults.map((group) => {
                const isJoining = joiningGroups.has(group.id);
                return (
                  <div
                    key={group.id}
                    className="py-3"
                  >
                    <div className="flex items-start gap-3">
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
                          <h3 className="font-semibold text-base text-gray-900 truncate hover:text-[#007AFF] transition-colors">
                            {group.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{group.description}</p>

                        {/* Meta Info */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {group.memberCount || 0} {group.memberCount === 1 ? 'member' : 'members'}
                          </span>
                          {group.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {group.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Join Button */}
                      <button
                        onClick={(e) => handleJoinGroup(group.id, e)}
                        disabled={isJoining}
                        className={`text-sm font-semibold transition-colors flex-shrink-0 ${
                          isJoining
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-[#007AFF] hover:text-[#0051D5]'
                        }`}
                      >
                        {isJoining ? 'Joining...' : 'Join'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : hasSearched && !isSearching && searchResults.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No groups found</h2>
            <p className="text-gray-600">Try adjusting your search filters</p>
          </div>
        ) : !hasSearched && allSuggestedGroups.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Suggested Groups</h2>
            <div className="space-y-4">
              {paginatedGroups.map((group) => {
                const isJoining = joiningGroups.has(group.id);
                return (
                  <div
                    key={group.id}
                    className="py-3"
                  >
                    <div className="flex items-start gap-3">
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
                          <h3 className="font-semibold text-base text-gray-900 truncate hover:text-[#007AFF] transition-colors">
                            {group.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{group.description}</p>

                        {/* Meta Info */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {group.memberCount || 0} {group.memberCount === 1 ? 'member' : 'members'}
                          </span>
                          {group.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {group.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Join Button */}
                      <button
                        onClick={(e) => handleJoinGroup(group.id, e)}
                        disabled={isJoining}
                        className={`text-sm font-semibold transition-colors flex-shrink-0 ${
                          isJoining
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-[#007AFF] hover:text-[#0051D5]'
                        }`}
                      >
                        {isJoining ? 'Joining...' : 'Join'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {allSuggestedGroups.length > GROUPS_PER_PAGE && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>

                <span className="text-sm text-gray-600 font-medium">
                  Page {currentPage + 1} of {totalPages}
                </span>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage >= totalPages - 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      <BottomNavigation />

      {/* Create Group Modal */}
      {/* <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGroup}
      /> */}
    </div>
  );
}
