'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Group, GroupStats } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MapPin, 
  Lock, 
  Globe, 
  Calendar,
  Settings,
  MoreHorizontal,
  TrendingUp,
  Clock,
  Target,
  ArrowLeft,
  ChevronLeft
} from 'lucide-react';

interface GroupHeaderProps {
  group: Group;
  stats?: GroupStats;
  currentUserId?: string;
  isJoined?: boolean;
  onJoin?: () => Promise<void>;
  onLeave?: () => Promise<void>;
  onSettings?: () => void;
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

export default function GroupHeader({ 
  group, 
  stats,
  currentUserId, 
  isJoined = false, 
  onJoin, 
  onLeave,
  onSettings,
  isLoading = false 
}: GroupHeaderProps) {
  const router = useRouter();
  const isAdmin = currentUserId && group.adminUserIds.includes(currentUserId);
  const isCreator = currentUserId && group.createdByUserId === currentUserId;
  const canJoin = currentUserId && !isJoined && !isAdmin;
  const canLeave = currentUserId && isJoined && !isAdmin;

  const handleJoin = async () => {
    if (onJoin && canJoin) {
      await onJoin();
    }
  };

  const handleLeave = async () => {
    if (onLeave && canLeave) {
      await onLeave();
    }
  };

  return (
    <div className="bg-white">
      {/* Mobile Back Button Header */}
      <div className="md:hidden sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-50 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 truncate flex-1">{group.name}</h1>
        {(isAdmin || isCreator) && (
          <button
            onClick={onSettings}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 pt-6 pb-6">
        {/* Group Avatar and Basic Info */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shadow-lg">
              {group.imageUrl ? (
                <Image
                  src={group.imageUrl}
                  alt={group.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl md:text-3xl">
                  {group.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {group.name}
              </h1>

              {/* Desktop Settings Button */}
              {(isAdmin || isCreator) && (
                <button
                  onClick={onSettings}
                  className="hidden md:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>

            <p className="text-gray-600 text-base md:text-lg mb-3 leading-relaxed">
              {group.description}
            </p>

            {/* Group Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span className="font-medium">{group.memberCount} members</span>
              </div>
              {group.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{group.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                {group.privacySetting === 'public' ? (
                  <>
                    <Globe className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-orange-600" />
                    <span className="text-orange-600 font-medium">Approval Required</span>
                  </>
                )}
              </div>
            </div>

            {/* Category and Type Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={`${categoryColors[group.category]} text-xs font-medium px-2.5 py-1`}>
                {categoryLabels[group.category]}
              </Badge>
              <Badge className={`${typeColors[group.type]} text-xs font-medium px-2.5 py-1`}>
                {typeLabels[group.type]}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button variant="outline" size="sm" disabled className="font-medium">
                  <Users className="w-4 h-4 mr-1.5" />
                  Admin
                </Button>
              )}
              {canJoin && (
                <Button
                  onClick={handleJoin}
                  disabled={isLoading}
                  size="sm"
                  className="bg-[#007AFF] hover:bg-[#0051D5] text-white font-semibold px-5 shadow-md"
                >
                  <Users className="w-4 h-4 mr-1.5" />
                  {group.privacySetting === 'public' ? 'Join Group' : 'Request to Join'}
                </Button>
              )}
              {canLeave && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLeave}
                  disabled={isLoading}
                  className="font-medium"
                >
                  Leave Group
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-blue-500 rounded-lg">
                  <Users className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-medium text-blue-900">Active Members</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-blue-900">{stats.activeMembers}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-green-500 rounded-lg">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-medium text-green-900">Weekly Hours</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-green-900">{stats.weeklyHours.toFixed(1)}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-purple-500 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-medium text-purple-900">Total Hours</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-purple-900">{stats.totalHours.toFixed(1)}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4 border border-orange-200/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-orange-500 rounded-lg">
                  <Target className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-medium text-orange-900">Posts</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-orange-900">{stats.totalPosts}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
