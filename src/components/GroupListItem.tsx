'use client';

import React from 'react';
import Link from 'next/link';
import { Group } from '@/types';
import GroupAvatar from './GroupAvatar';
import { Users, MapPin, Loader2 } from 'lucide-react';

interface GroupListItemProps {
  group: Group;
  isJoined: boolean;
  isJoining: boolean;
  onJoinGroup: (groupId: string, e: React.MouseEvent) => void;
}

export const GroupListItem: React.FC<GroupListItemProps> = ({
  group,
  isJoined,
  isJoining,
  onJoinGroup,
}) => {
  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onJoinGroup(group.id, e);
  };

  return (
    <div className="relative group/item">
      {/* Entire row is clickable */}
      <Link
        href={`/groups/${group.id}`}
        className="block py-3 px-3 -mx-3 rounded-lg hover:bg-gray-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2"
      >
        <div className="flex items-start gap-3">
          {/* Group Icon */}
          <GroupAvatar
            imageUrl={group.imageUrl}
            name={group.name}
            size="md"
          />

          {/* Group Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-gray-900 truncate group-hover/item:text-[#0051D5] transition-all duration-200">
              {group.name}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{group.description}</p>

            {/* Meta Info */}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" aria-hidden="true" />
                {group.memberCount || 0} {group.memberCount === 1 ? 'member' : 'members'}
              </span>
              {group.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  {group.location}
                </span>
              )}
            </div>
          </div>

          {/* Join Button or Joined Indicator */}
          <div className="flex-shrink-0">
            {isJoined ? (
              <span
                className="min-h-[44px] min-w-[44px] text-sm font-semibold text-gray-500 flex items-center justify-center"
                aria-label={`You are a member of ${group.name}`}
              >
                Joined
              </span>
            ) : (
              <button
                onClick={handleJoinClick}
                disabled={isJoining}
                aria-label={isJoining ? `Joining ${group.name}` : `Join ${group.name}`}
                className={`min-h-[44px] px-4 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 rounded relative z-10 ${
                  isJoining
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-[#007AFF] hover:text-[#0051D5]'
                }`}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Joining...
                  </>
                ) : (
                  'Join'
                )}
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};
