'use client';

import React from 'react';
import Link from 'next/link';
import { Group } from '@/types';
import GroupAvatar from './GroupAvatar';
import { Users, MapPin } from 'lucide-react';

interface MyGroupListItemProps {
  group: Group;
}

export const MyGroupListItem: React.FC<MyGroupListItemProps> = ({ group }) => {
  // Truncate group name if longer than 30 characters
  const displayName = group.name.length > 30
    ? group.name.substring(0, 30) + '...'
    : group.name;

  // Truncate location if longer than 20 characters
  const displayLocation = group.location && group.location.length > 20
    ? group.location.substring(0, 20) + '...'
    : group.location;

  return (
    <Link
      href={`/groups/${group.id}`}
      className="block py-5 px-0 border-b border-gray-200 hover:bg-gray-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2"
    >
      <div className="flex items-start gap-4">
        {/* Group Icon */}
        <GroupAvatar imageUrl={group.imageUrl} name={group.name} size="lg" />

        {/* Group Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 mb-2">
            {displayName}
          </h3>

          {/* Meta Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Users className="w-4 h-4" aria-hidden="true" />
              <span>{group.memberCount || 0} {group.memberCount === 1 ? 'Member' : 'Members'}</span>
            </div>
            {displayLocation && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                <span>{displayLocation}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
