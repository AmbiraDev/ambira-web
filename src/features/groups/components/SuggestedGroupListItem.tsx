'use client'

import React from 'react'
import Link from 'next/link'
import { Group } from '@/types'
import GroupAvatar from './GroupAvatar'
import { Users, MapPin } from 'lucide-react'
import { truncateText } from '@/lib/utils/text'
import { GROUP_DISPLAY_CONFIG } from '@/lib/constants/groupDisplay'

interface SuggestedGroupListItemProps {
  group: Group
  onJoin: (groupId: string, e: React.MouseEvent) => Promise<void>
  isJoining: boolean
  isJoined: boolean
}

export const SuggestedGroupListItem = React.memo<SuggestedGroupListItemProps>(
  function SuggestedGroupListItem({ group, onJoin, isJoining, isJoined }) {
    // Mobile: Truncate group name if longer than configured length
    const displayNameMobile = truncateText(
      group.name,
      GROUP_DISPLAY_CONFIG.TRUNCATE_LENGTHS.NAME_MOBILE
    )

    // Desktop: Truncate group name if longer than configured length
    const displayNameDesktop = truncateText(
      group.name,
      GROUP_DISPLAY_CONFIG.TRUNCATE_LENGTHS.NAME_DESKTOP
    )

    // Mobile: Truncate location if longer than configured length
    const displayLocationMobile = truncateText(
      group.location,
      GROUP_DISPLAY_CONFIG.TRUNCATE_LENGTHS.LOCATION_MOBILE
    )

    // Desktop: Don't truncate location
    const displayLocationDesktop = group.location

    // Desktop: Truncate description if longer than configured length
    const displayDescription = truncateText(
      group.description,
      GROUP_DISPLAY_CONFIG.TRUNCATE_LENGTHS.DESCRIPTION_DESKTOP
    )

    return (
      <div className="py-5 px-6 md:px-8 border-b border-gray-200 hover:bg-gray-50 transition-all duration-200">
        <div className="flex items-start gap-4 md:gap-6">
          {/* Group Icon - larger on desktop, clickable */}
          <Link
            href={`/groups/${group.id}`}
            className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 rounded-xl"
          >
            <div className="md:hidden">
              <GroupAvatar imageUrl={group.imageUrl} name={group.name} size="lg" />
            </div>
            <div className="hidden md:block">
              <GroupAvatar imageUrl={group.imageUrl} name={group.name} size="xl" />
            </div>
          </Link>

          {/* Group Info */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/groups/${group.id}`}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 rounded"
            >
              {/* Mobile: Show compact name */}
              <h3 className="md:hidden font-semibold text-lg text-gray-900 mb-2 hover:text-[#0066CC] transition-colors">
                {displayNameMobile}
              </h3>

              {/* Desktop: Show longer name */}
              <h3 className="hidden md:block font-semibold text-xl text-gray-900 mb-2 hover:text-[#0066CC] transition-colors">
                {displayNameDesktop}
              </h3>
            </Link>

            {/* Desktop: Show description */}
            {displayDescription && (
              <p className="hidden md:block text-sm text-gray-600 mb-3 leading-relaxed">
                {displayDescription}
              </p>
            )}

            {/* Meta Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Users className="w-4 h-4" aria-hidden="true" />
                <span>
                  {group.memberCount || 0} {group.memberCount === 1 ? 'Member' : 'Members'}
                </span>
              </div>

              {/* Mobile: Show truncated location */}
              {displayLocationMobile && (
                <div className="md:hidden flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  <span>{displayLocationMobile}</span>
                </div>
              )}

              {/* Desktop: Show full location */}
              {displayLocationDesktop && (
                <div className="hidden md:flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  <span>{displayLocationDesktop}</span>
                </div>
              )}
            </div>
          </div>

          {/* Join Button - aligned to the right */}
          <div className="flex-shrink-0">
            <button
              onClick={(e) => onJoin(group.id, e)}
              disabled={isJoining || isJoined}
              className={`min-h-[44px] px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 ${
                isJoined
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isJoining
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#0066CC] text-white hover:bg-[#0051D5] cursor-pointer'
              }`}
              aria-label={isJoined ? `Already joined ${group.name}` : `Join ${group.name}`}
            >
              {isJoined ? 'Joined' : isJoining ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>
      </div>
    )
  }
)
