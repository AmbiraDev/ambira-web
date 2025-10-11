'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import GroupCard from '@/components/GroupCard';
// import CreateGroupModal from '@/components/CreateGroupModal';
import { Group } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';
import { Users, Search } from 'lucide-react';
import Link from 'next/link';

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'study', label: 'Study' },
  { value: 'work', label: 'Work' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' },
];

export default function GroupsPage() {
  const { user } = useAuth();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
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
        <div className="bg-gray-100 rounded-lg p-4 md:p-6 mb-6">
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

        {/* Search Results */}
        {searchResults.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h2>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {searchResults.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  currentUserId={user?.id}
                  isJoined={false}
                />
              ))}
            </div>
          </div>
        ) : !isSearching && searchResults.length === 0 && (searchFilters.name || searchFilters.location || searchFilters.category) ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No groups found</h2>
            <p className="text-gray-600">Try adjusting your search filters</p>
          </div>
        ) : userGroups.length === 0 && !searchFilters.name && !searchFilters.location && !searchFilters.category ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Search for a group above to get started</p>
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
