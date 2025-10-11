'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Group } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import GroupAvatar from '@/components/GroupAvatar';
import { 
  Users, 
  MapPin, 
  Lock, 
  Globe, 
  Calendar,
  UserCheck,
  Clock
} from 'lucide-react';

interface GroupCardProps {
  group: Group;
  currentUserId?: string;
  isJoined?: boolean;
  onJoin?: (groupId: string) => Promise<void>;
  onLeave?: (groupId: string) => Promise<void>;
  isLoading?: boolean;
}

const categoryLabels = {
  'work': 'Work',
  'study': 'Study',
  'side-project': 'Side Project',
  'learning': 'Learning',
  'other': 'Other'
};

const typeLabels = {
  'just-for-fun': 'Just for Fun',
  'professional': 'Professional',
  'competitive': 'Competitive',
  'other': 'Other'
};

const categoryColors = {
  'work': 'bg-blue-100 text-blue-800',
  'study': 'bg-green-100 text-green-800',
  'side-project': 'bg-purple-100 text-purple-800',
  'learning': 'bg-orange-100 text-orange-800',
  'other': 'bg-gray-100 text-gray-800'
};

const typeColors = {
  'just-for-fun': 'bg-pink-100 text-pink-800',
  'professional': 'bg-indigo-100 text-indigo-800',
  'competitive': 'bg-red-100 text-red-800',
  'other': 'bg-gray-100 text-gray-800'
};

export default function GroupCard({ 
  group, 
  currentUserId, 
  isJoined = false, 
  onJoin, 
  onLeave,
  isLoading = false 
}: GroupCardProps) {
  const isAdmin = currentUserId && group.adminUserIds.includes(currentUserId);
  const canJoin = currentUserId && !isJoined && !isAdmin;
  const canLeave = currentUserId && isJoined && !isAdmin;

  const handleJoin = async () => {
    if (onJoin && canJoin) {
      await onJoin(group.id);
    }
  };

  const handleLeave = async () => {
    if (onLeave && canLeave) {
      await onLeave(group.id);
    }
  };

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="group hover:shadow-sm transition-all duration-200 border border-gray-200/60 hover:border-[#007AFF]/30 aspect-square p-3 flex flex-col items-center justify-center text-center">
        {/* Group Avatar */}
        {group.imageUrl ? (
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 mb-2">
            <Image
              src={group.imageUrl}
              alt={group.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-[#007AFF]/5 transition-colors mb-2">
            <Users className="w-6 h-6 text-gray-600 group-hover:text-[#007AFF] transition-colors" />
          </div>
        )}

        {/* Group Name */}
        <h3 className="text-xs font-semibold text-gray-900 group-hover:text-[#007AFF] transition-colors line-clamp-2">
          {group.name}
        </h3>
      </Card>
    </Link>
  );
}
