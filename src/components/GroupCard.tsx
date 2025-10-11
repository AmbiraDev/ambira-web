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
  isLoading?: boolean;
}

export default function GroupCard({
  group
}: GroupCardProps) {

  return (
    <Link href={`/groups/${group.id}`}>
      <div className="group flex flex-col items-center text-center">
        {/* Group Avatar */}
        <div className="mb-3">
          <GroupAvatar
            imageUrl={group.imageUrl}
            name={group.name}
            size="lg"
          />
        </div>

        {/* Group Name */}
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#007AFF] transition-colors line-clamp-2">
          {group.name}
        </h3>
      </div>
    </Link>
  );
}
