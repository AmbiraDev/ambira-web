'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { firebaseApi } from '@/lib/api'
import { Group } from '@/types'

export interface FeedFilterOption {
  type: 'following' | 'user' | 'group' | 'all'
  label: string
  groupId?: string
}

interface FeedFilterDropdownProps {
  selectedFilter: FeedFilterOption
  onFilterChange: (filter: FeedFilterOption) => void
}

export const FeedFilterDropdown: React.FC<FeedFilterDropdownProps> = ({
  selectedFilter,
  onFilterChange,
}) => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Fetch user's groups
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) return

      try {
        setIsLoadingGroups(true)
        const userGroups = await firebaseApi.group.getUserGroups(user.id)
        setGroups(userGroups)
      } catch (_err) {
      } finally {
        setIsLoadingGroups(false)
      }
    }

    fetchGroups()
  }, [user])

  const handleFilterSelect = (filter: FeedFilterOption) => {
    onFilterChange(filter)
    setIsOpen(false)
  }

  const isSelected = (filter: FeedFilterOption) => {
    if (filter.type === 'group' && selectedFilter.type === 'group') {
      return filter.groupId === selectedFilter.groupId
    }
    return filter.type === selectedFilter.type && !filter.groupId && !selectedFilter.groupId
  }

  return (
    <div ref={dropdownRef} className="relative inline-block w-[280px]">
      {/* Dropdown Button - Duolingo Style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        className="w-full flex items-center justify-between px-5 py-3 bg-[#1CB0F6] text-white rounded-2xl hover:brightness-105 transition-all duration-200 min-h-[52px] border-2 border-b-4 border-[#0088CC] active:border-b-2 active:translate-y-[2px] font-extrabold text-base"
        aria-label={`Filter feed by ${selectedFilter.label}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{selectedFilter.label}</span>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          strokeWidth={3}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu - Duolingo Style */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#E5E5E5] rounded-2xl shadow-lg z-50 overflow-hidden"
          role="listbox"
          aria-label="Feed filter options"
        >
          <div className="py-2">
            {/* All */}
            <button
              onClick={() => handleFilterSelect({ type: 'all', label: 'All' })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleFilterSelect({ type: 'all', label: 'All' })
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors duration-200 min-h-[48px] ${
                isSelected({ type: 'all', label: 'All' }) ? 'bg-[#DDF4FF]' : 'hover:bg-[#F7F7F7]'
              }`}
              role="option"
              aria-selected={isSelected({ type: 'all', label: 'All' })}
            >
              <span
                className={`font-bold ${
                  isSelected({ type: 'all', label: 'All' }) ? 'text-[#1CB0F6]' : 'text-[#4B4B4B]'
                }`}
              >
                All
              </span>
              {isSelected({ type: 'all', label: 'All' }) && (
                <Check className="w-5 h-5 text-[#1CB0F6]" strokeWidth={3} />
              )}
            </button>

            {/* Following */}
            <button
              onClick={() => handleFilterSelect({ type: 'following', label: 'Following' })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleFilterSelect({ type: 'following', label: 'Following' })
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors duration-200 min-h-[48px] ${
                isSelected({ type: 'following', label: 'Following' })
                  ? 'bg-[#DDF4FF]'
                  : 'hover:bg-[#F7F7F7]'
              }`}
              role="option"
              aria-selected={isSelected({
                type: 'following',
                label: 'Following',
              })}
            >
              <span
                className={`font-bold ${
                  isSelected({ type: 'following', label: 'Following' })
                    ? 'text-[#1CB0F6]'
                    : 'text-[#4B4B4B]'
                }`}
              >
                Following
              </span>
              {isSelected({ type: 'following', label: 'Following' }) && (
                <Check className="w-5 h-5 text-[#1CB0F6]" strokeWidth={3} />
              )}
            </button>

            {/* My Activities */}
            <button
              onClick={() => handleFilterSelect({ type: 'user', label: 'My Activities' })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleFilterSelect({ type: 'user', label: 'My Activities' })
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors duration-200 min-h-[48px] ${
                isSelected({ type: 'user', label: 'My Activities' })
                  ? 'bg-[#DDF4FF]'
                  : 'hover:bg-[#F7F7F7]'
              }`}
              role="option"
              aria-selected={isSelected({
                type: 'user',
                label: 'My Activities',
              })}
            >
              <span
                className={`font-bold ${
                  isSelected({ type: 'user', label: 'My Activities' })
                    ? 'text-[#1CB0F6]'
                    : 'text-[#4B4B4B]'
                }`}
              >
                My Activities
              </span>
              {isSelected({ type: 'user', label: 'My Activities' }) && (
                <Check className="w-5 h-5 text-[#1CB0F6]" strokeWidth={3} />
              )}
            </button>

            {/* Divider if there are groups */}
            {groups.length > 0 && <div className="border-t-2 border-[#E5E5E5] my-2"></div>}

            {/* User's Groups */}
            {isLoadingGroups ? (
              <div className="px-4 py-3 text-sm text-[#AFAFAF] font-semibold">
                Loading groups...
              </div>
            ) : groups.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[#AFAFAF] font-semibold">No groups yet</div>
            ) : (
              groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() =>
                    handleFilterSelect({
                      type: 'group',
                      label: group.name,
                      groupId: group.id,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleFilterSelect({
                        type: 'group',
                        label: group.name,
                        groupId: group.id,
                      })
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors duration-200 min-h-[48px] ${
                    isSelected({
                      type: 'group',
                      label: group.name,
                      groupId: group.id,
                    })
                      ? 'bg-[#DDF4FF]'
                      : 'hover:bg-[#F7F7F7]'
                  }`}
                  role="option"
                  aria-selected={isSelected({
                    type: 'group',
                    label: group.name,
                    groupId: group.id,
                  })}
                >
                  <span
                    className={`truncate font-bold ${
                      isSelected({
                        type: 'group',
                        label: group.name,
                        groupId: group.id,
                      })
                        ? 'text-[#1CB0F6]'
                        : 'text-[#4B4B4B]'
                    }`}
                  >
                    {group.name}
                  </span>
                  {isSelected({
                    type: 'group',
                    label: group.name,
                    groupId: group.id,
                  }) && (
                    <Check className="w-5 h-5 flex-shrink-0 ml-2 text-[#1CB0F6]" strokeWidth={3} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
