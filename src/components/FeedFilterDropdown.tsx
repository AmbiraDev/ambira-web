'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseApi } from '@/lib/firebaseApi';
import { Group } from '@/types';

export interface FeedFilterOption {
  type: 'following' | 'user' | 'group';
  label: string;
  groupId?: string;
}

interface FeedFilterDropdownProps {
  selectedFilter: FeedFilterOption;
  onFilterChange: (filter: FeedFilterOption) => void;
}

export const FeedFilterDropdown: React.FC<FeedFilterDropdownProps> = ({
  selectedFilter,
  onFilterChange
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fetch user's groups
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) return;

      try {
        setIsLoadingGroups(true);
        const userGroups = await firebaseApi.group.getUserGroups(user.id);
        setGroups(userGroups);
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      } finally {
        setIsLoadingGroups(false);
      }
    };

    fetchGroups();
  }, [user]);

  const handleFilterSelect = (filter: FeedFilterOption) => {
    onFilterChange(filter);
    setIsOpen(false);
  };

  const isSelected = (filter: FeedFilterOption) => {
    if (filter.type === 'group' && selectedFilter.type === 'group') {
      return filter.groupId === selectedFilter.groupId;
    }
    return filter.type === selectedFilter.type && !filter.groupId && !selectedFilter.groupId;
  };

  return (
    <div ref={dropdownRef} className="relative inline-block w-[220px]">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">
          {selectedFilter.label}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="py-1">
            {/* Following */}
            <button
              onClick={() =>
                handleFilterSelect({ type: 'following', label: 'Following' })
              }
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                isSelected({ type: 'following', label: 'Following' })
                  ? 'bg-gray-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className={`${
                isSelected({ type: 'following', label: 'Following' })
                  ? 'font-medium text-gray-900'
                  : 'text-gray-700'
              }`}>
                Following
              </span>
              {isSelected({ type: 'following', label: 'Following' }) && (
                <Check className="w-5 h-5 text-gray-900" />
              )}
            </button>

            {/* My Activities */}
            <button
              onClick={() =>
                handleFilterSelect({ type: 'user', label: 'My Activities' })
              }
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                isSelected({ type: 'user', label: 'My Activities' })
                  ? 'bg-gray-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className={`${
                isSelected({ type: 'user', label: 'My Activities' })
                  ? 'font-medium text-gray-900'
                  : 'text-gray-700'
              }`}>
                My Activities
              </span>
              {isSelected({ type: 'user', label: 'My Activities' }) && (
                <Check className="w-5 h-5 text-gray-900" />
              )}
            </button>

            {/* Divider if there are groups */}
            {groups.length > 0 && (
              <div className="border-t border-gray-200 my-1"></div>
            )}

            {/* User's Groups */}
            {isLoadingGroups ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                Loading groups...
              </div>
            ) : groups.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No groups yet
              </div>
            ) : (
              groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() =>
                    handleFilterSelect({
                      type: 'group',
                      label: group.name,
                      groupId: group.id
                    })
                  }
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                    isSelected({
                      type: 'group',
                      label: group.name,
                      groupId: group.id
                    })
                      ? 'bg-gray-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`truncate ${
                    isSelected({
                      type: 'group',
                      label: group.name,
                      groupId: group.id
                    })
                      ? 'font-medium text-gray-900'
                      : 'text-gray-700'
                  }`}>
                    {group.name}
                  </span>
                  {isSelected({
                    type: 'group',
                    label: group.name,
                    groupId: group.id
                  }) && <Check className="w-5 h-5 flex-shrink-0 ml-2 text-gray-900" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
