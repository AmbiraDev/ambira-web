'use client';

import React from 'react';
import Link from 'next/link';
import { Group } from '@/types';
import GroupAvatar from './GroupAvatar';
import { Users, MapPin } from 'lucide-react';
import { truncateText } from '@/lib/utils/text';
import { GROUP_DISPLAY_CONFIG } from '@/lib/constants/groupDisplay';

interface MyGroupListItemProps {
  group: Group;
}

export const MyGroupListItem: React.FC<MyGroupListItemProps> = ({ group }) => {
  // Mobile: Truncate group name if longer than configured length
  const displayNameMobile = truncateText(
    group.name,
    GROUP_DISPLAY_CONFIG.TRUNCATE_LENGTHS.NAME_MOBILE
  );

  // Desktop: Truncate group name if longer than configured length
  const displayNameDesktop = truncateText(
    group.name,
    GROUP_DISPLAY_CONFIG.TRUNCATE_LENGTHS.NAME_DESKTOP
  );

  // Mobile: Truncate location if longer than configured length
  const displayLocationMobile = truncateText(
    group.location,
    GROUP_DISPLAY_CONFIG.TRUNCATE_LENGTHS.LOCATION_MOBILE
  );

  // Desktop: Don't truncate location
  const displayLocationDesktop = group.location;

  // Desktop: Truncate description if longer than configured length
  const displayDescription = truncateText(
    group.description,
    GROUP_DISPLAY_CONFIG.TRUNCATE_LENGTHS.DESCRIPTION_DESKTOP
  );

  return (
    <Link
      href={`/groups/${group.id}`}
      className="block py-5 px-6 md:px-8 border-b border-gray-200 hover:bg-gray-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2"
    >
      <div className="flex items-start gap-4 md:gap-6">
        {/* Group Icon - larger on desktop */}
        <div className="md:hidden">
          <GroupAvatar imageUrl={group.imageUrl} name={group.name} size="lg" />
        </div>
        <div className="hidden md:block">
          <GroupAvatar imageUrl={group.imageUrl} name={group.name} size="xl" />
        </div>

        {/* Group Info */}
        <div className="flex-1 min-w-0">
          {/* Mobile: Show compact name */}
          <h3 className="md:hidden font-semibold text-lg text-gray-900 mb-2">
            {displayNameMobile}
          </h3>

          {/* Desktop: Show longer name */}
          <h3 className="hidden md:block font-semibold text-xl text-gray-900 mb-2">
            {displayNameDesktop}
          </h3>

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
                {group.memberCount || 0}{' '}
                {group.memberCount === 1 ? 'Member' : 'Members'}
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
      </div>
    </Link>
  );
};
