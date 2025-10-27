'use client';

import React from 'react';
import Link from 'next/link';
import { Group } from '@/types';
import GroupAvatar from '@/components/GroupAvatar';

interface GroupCardProps {
  group: Group;
  currentUserId?: string;
  isJoined?: boolean;
  onJoin?: (groupId: string) => Promise<void>;
  onLeave?: (groupId: string) => Promise<void>;
  isLoading?: boolean; // Kept for future use
}

export default function GroupCard({
  group,
  // Props below are in the interface but not used in current implementation
  // currentUserId, isJoined, onJoin, onLeave, isLoading
}: GroupCardProps) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="group flex flex-col items-center text-center transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 rounded-lg p-2 -m-2"
    >
      {/* Group Avatar */}
      <div className="mb-3">
        <GroupAvatar imageUrl={group.imageUrl} name={group.name} size="lg" />
      </div>

      {/* Group Name */}
      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#0066CC] transition-all duration-200 line-clamp-2">
        {group.name}
      </h3>
    </Link>
  );
}
