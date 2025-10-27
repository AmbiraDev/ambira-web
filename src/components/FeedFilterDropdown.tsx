'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { firebaseApi } from '@/lib/api';
import { Group } from '@/types';

export interface FeedFilterOption {
  type: 'following' | 'user' | 'group' | 'all';
  label: string;
  groupId?: string;
}

interface FeedFilterDropdownProps {
  selectedFilter: FeedFilterOption;
  onFilterChange: (filter: FeedFilterOption) => void;
}

export const FeedFilterDropdown: React.FC<FeedFilterDropdownProps> = ({
  selectedFilter,
  onFilterChange,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
      } catch (_err) {
        console.error('Failed to fetch groups:', err);
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
    return (
      filter.type === selectedFilter.type &&
      !filter.groupId &&
      !selectedFilter.groupId
    );
  };

  return (
    <div ref={dropdownRef} className="relative inline-block w-[220px]">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-[#007AFF] text-white rounded-lg hover:bg-[#0051D5] transition-colors duration-200 shadow-sm min-h-[44px]"
        aria-label={`Filter feed by ${selectedFilter.label}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="font-semibold">{selectedFilter.label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
          role="listbox"
          aria-label="Feed filter options"
        >
          <div className="py-1">
            {/* All */}
            <button
              onClick={() => handleFilterSelect({ type: 'all', label: 'All' })}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFilterSelect({ type: 'all', label: 'All' });
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors duration-200 min-h-[44px] ${
                isSelected({ type: 'all', label: 'All' })
                  ? 'bg-gray-50'
                  : 'hover:bg-gray-50'
              }`}
              role="option"
              aria-selected={isSelected({ type: 'all', label: 'All' })}
            >
              <span
                className={`${
                  isSelected({ type: 'all', label: 'All' })
                    ? 'font-medium text-gray-900'
                    : 'text-gray-700'
                }`}
              >
                All
              </span>
              {isSelected({ type: 'all', label: 'All' }) && (
                <Check className="w-5 h-5 text-gray-900" />
              )}
            </button>

            {/* Following */}
            <button
              onClick={() =>
                handleFilterSelect({ type: 'following', label: 'Following' })
              }
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFilterSelect({ type: 'following', label: 'Following' });
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors duration-200 min-h-[44px] ${
                isSelected({ type: 'following', label: 'Following' })
                  ? 'bg-gray-50'
                  : 'hover:bg-gray-50'
              }`}
              role="option"
              aria-selected={isSelected({
                type: 'following',
                label: 'Following',
              })}
            >
              <span
                className={`${
                  isSelected({ type: 'following', label: 'Following' })
                    ? 'font-medium text-gray-900'
                    : 'text-gray-700'
                }`}
              >
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
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFilterSelect({ type: 'user', label: 'My Activities' });
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors duration-200 min-h-[44px] ${
                isSelected({ type: 'user', label: 'My Activities' })
                  ? 'bg-gray-50'
                  : 'hover:bg-gray-50'
              }`}
              role="option"
              aria-selected={isSelected({
                type: 'user',
                label: 'My Activities',
              })}
            >
              <span
                className={`${
                  isSelected({ type: 'user', label: 'My Activities' })
                    ? 'font-medium text-gray-900'
                    : 'text-gray-700'
                }`}
              >
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
              groups.map(group => (
                <button
                  key={group.id}
                  onClick={() =>
                    handleFilterSelect({
                      type: 'group',
                      label: group.name,
                      groupId: group.id,
                    })
                  }
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleFilterSelect({
                        type: 'group',
                        label: group.name,
                        groupId: group.id,
                      });
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors duration-200 min-h-[44px] ${
                    isSelected({
                      type: 'group',
                      label: group.name,
                      groupId: group.id,
                    })
                      ? 'bg-gray-50'
                      : 'hover:bg-gray-50'
                  }`}
                  role="option"
                  aria-selected={isSelected({
                    type: 'group',
                    label: group.name,
                    groupId: group.id,
                  })}
                >
                  <span
                    className={`truncate ${
                      isSelected({
                        type: 'group',
                        label: group.name,
                        groupId: group.id,
                      })
                        ? 'font-medium text-gray-900'
                        : 'text-gray-700'
                    }`}
                  >
                    {group.name}
                  </span>
                  {isSelected({
                    type: 'group',
                    label: group.name,
                    groupId: group.id,
                  }) && (
                    <Check className="w-5 h-5 flex-shrink-0 ml-2 text-gray-900" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
