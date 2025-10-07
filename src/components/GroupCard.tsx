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
    <Card className="group hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
      <Link href={`/groups/${group.id}`} className="block">
        {/* Group Banner */}
        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg overflow-hidden">
          {group.bannerUrl && (
            <Image
              src={group.bannerUrl}
              alt={`${group.name} banner`}
              fill
              className="object-cover"
            />
          )}
          <div className="absolute top-3 right-3">
            {group.privacySetting === 'public' ? (
              <Badge variant="secondary" className="bg-white/90 text-gray-700">
                <Globe className="w-3 h-3 mr-1" />
                Public
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-white/90 text-gray-700">
                <Lock className="w-3 h-3 mr-1" />
                Approval Required
              </Badge>
            )}
          </div>
        </div>

        <div className="p-4">
          {/* Group Avatar */}
          <div className="flex items-start gap-3 mb-3">
            <div className="relative -mt-8">
              <div className="bg-white border-4 border-white rounded-xl shadow-sm">
                <GroupAvatar
                  imageUrl={group.imageUrl}
                  name={group.name}
                  size="lg"
                />              
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                {group.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                {group.description}
              </p>
            </div>
          </div>

          {/* Group Stats */}
          <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{group.memberCount} members</span>
            </div>
            {group.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-24">{group.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Category and Type Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className={categoryColors[group.category]}>
              {categoryLabels[group.category]}
            </Badge>
            <Badge className={typeColors[group.type]}>
              {typeLabels[group.type]}
            </Badge>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            {isAdmin && (
              <Button variant="outline" size="sm" disabled>
                <UserCheck className="w-4 h-4 mr-1" />
                Admin
              </Button>
            )}
            {canJoin && (
              <Button 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  handleJoin();
                }}
                disabled={isLoading}
              >
                {group.privacySetting === 'public' ? 'Join Group' : 'Request to Join'}
              </Button>
            )}
            {canLeave && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  handleLeave();
                }}
                disabled={isLoading}
              >
                Leave Group
              </Button>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
