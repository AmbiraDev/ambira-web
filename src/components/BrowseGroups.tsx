'use client';

import React, { useState, useEffect } from 'react';
import { Group, GroupFilters } from '@/types';
import GroupCard from './GroupCard';
import CreateGroupModal from './CreateGroupModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Search, Filter, Plus, Grid3X3, List, MapPin } from 'lucide-react';

interface CreateGroupData {
  name: string;
  description: string;
  category?: string;
  type?: string;
  privacySetting?: string;
  location?: string;
}

interface BrowseGroupsProps {
  groups: Group[];
  userGroups: string[]; // Array of group IDs the user has joined
  onJoinGroup: (groupId: string) => Promise<void>;
  onLeaveGroup: (groupId: string) => Promise<void>;
  onCreateGroup: (data: CreateGroupData) => Promise<void>;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'work', label: 'Work' },
  { value: 'study', label: 'Study' },
  { value: 'side-project', label: 'Side Project' },
  { value: 'learning', label: 'Learning' },
  { value: 'other', label: 'Other' },
];

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'just-for-fun', label: 'Just for Fun' },
  { value: 'professional', label: 'Professional' },
  { value: 'competitive', label: 'Competitive' },
  { value: 'other', label: 'Other' },
];

const privacyOptions = [
  { value: '', label: 'All Privacy' },
  { value: 'public', label: 'Public' },
  { value: 'approval-required', label: 'Approval Required' },
];

const sortOptions = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'members', label: 'Most Members' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'activity', label: 'Most Active' },
];

export default function BrowseGroups({
  groups,
  userGroups,
  onJoinGroup,
  onLeaveGroup,
  onCreateGroup,
  isLoading = false,
  hasMore = false,
  onLoadMore,
}: BrowseGroupsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<GroupFilters>({
    search: '',
    category: undefined,
    type: undefined,
    privacySetting: undefined,
    location: '',
  });
  const [sortBy, setSortBy] = useState('recent');
  const [filteredGroups, setFilteredGroups] = useState<Group[]>(groups);

  useEffect(() => {
    let filtered = [...groups];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        group =>
          group.name.toLowerCase().includes(searchLower) ||
          group.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(group => group.category === filters.category);
    }

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter(group => group.type === filters.type);
    }

    // Apply privacy filter
    if (filters.privacySetting) {
      filtered = filtered.filter(
        group => group.privacySetting === filters.privacySetting
      );
    }

    // Apply location filter
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(group =>
        group.location?.toLowerCase().includes(locationLower)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'members':
        filtered.sort((a, b) => b.memberCount - a.memberCount);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'activity':
        // For now, sort by member count as a proxy for activity
        filtered.sort((a, b) => b.memberCount - a.memberCount);
        break;
      case 'recent':
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    setFilteredGroups(filtered);
  }, [groups, filters, sortBy]);

  const handleFilterChange = (key: keyof GroupFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: undefined,
      type: undefined,
      privacySetting: undefined,
      location: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Groups</h1>
          <p className="text-gray-600 mt-1">
            Join productivity groups and connect with like-minded people
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search groups..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Location */}
          <div className="lg:w-48">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Location..."
                value={filters.location}
                onChange={e => handleFilterChange('location', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Advanced Filters */}
        {(showFilters || window.innerWidth >= 1024) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                value={filters.category}
                onChange={e => handleFilterChange('category', e.target.value)}
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Select
                value={filters.type}
                onChange={e => handleFilterChange('type', e.target.value)}
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Select
                value={filters.privacySetting}
                onChange={e =>
                  handleFilterChange('privacySetting', e.target.value)
                }
              >
                {privacyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <span className="text-sm text-gray-500">
                  {filteredGroups.length} of {groups.length} groups
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {filteredGroups.length} groups found
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">View:</span>
          <div className="flex border border-gray-300 rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none border-r border-gray-300"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Groups Grid/List */}
      {isLoading && filteredGroups.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
            >
              <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No groups found
          </h3>
          <p className="text-gray-600 mb-4">
            {hasActiveFilters
              ? 'Try adjusting your filters or search terms'
              : 'Be the first to create a group in this category'}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button onClick={() => setShowCreateModal(true)}>
              Create Group
            </Button>
          )}
        </div>
      ) : (
        <>
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredGroups.map(group => (
              <GroupCard
                key={group.id}
                group={group}
                currentUserId="current-user-id" // This should come from auth context
                isJoined={userGroups.includes(group.id)}
                onJoin={onJoinGroup}
                onLeave={onLeaveGroup}
                isLoading={isLoading}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-6">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More Groups'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={onCreateGroup}
        isLoading={isLoading}
      />
    </div>
  );
}
