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
    <div className="relative">
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

      {/* Banner - Desktop Only */}
      <div className="relative h-0 md:h-48 bg-gray-200 hidden md:block">
        {group.bannerUrl && (
          <Image
            src={group.bannerUrl}
            alt={`${group.name} banner`}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Privacy Badge */}
        <div className="absolute top-4 right-4">
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

        {/* Admin Actions */}
        {(isAdmin || isCreator) && (
          <div className="absolute top-4 left-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={onSettings}
              className="bg-white/90 text-gray-700 hover:bg-white"
            >
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative px-4 md:px-6 pb-6">
        {/* Group Avatar and Basic Info */}
        <div className="flex items-start gap-3 md:gap-4 md:-mt-12 mb-4 pt-4 md:pt-0">
          <div className="relative">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white md:border-4 border-2 border-white shadow-lg overflow-hidden flex-shrink-0">
              {group.imageUrl ? (
                <Image
                  src={group.imageUrl}
                  alt={group.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg md:text-2xl">
                  {group.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Privacy Badge - Mobile */}
            <div className="md:hidden absolute -bottom-1 -right-1">
              {group.privacySetting === 'public' ? (
                <div className="bg-white rounded-full p-1 shadow-sm">
                  <Globe className="w-3 h-3 text-green-600" />
                </div>
              ) : (
                <div className="bg-white rounded-full p-1 shadow-sm">
                  <Lock className="w-3 h-3 text-orange-600" />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 md:pt-8 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2 truncate md:whitespace-normal">
                  {group.name}
                </h1>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {group.description}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                {isAdmin && (
                  <Button variant="outline" disabled>
                    <Users className="w-4 h-4 mr-1" />
                    Admin
                  </Button>
                )}
                {canJoin && (
                  <Button 
                    onClick={handleJoin}
                    disabled={isLoading}
                    className="bg-[#007AFF] hover:bg-[#0051D5] text-white font-semibold px-6 shadow-md"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {group.privacySetting === 'public' ? 'Join Group' : 'Request to Join'}
                  </Button>
                )}
                {canLeave && (
                  <Button 
                    variant="outline"
                    onClick={handleLeave}
                    disabled={isLoading}
                  >
                    Leave Group
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Group Meta */}
        <div className="flex flex-wrap items-center gap-6 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{group.memberCount} members</span>
          </div>
          {group.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{group.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Category and Type Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge className={`${categoryColors[group.category]} text-sm px-3 py-1`}>
            {categoryLabels[group.category]}
          </Badge>
          <Badge className={`${typeColors[group.type]} text-sm px-3 py-1`}>
            {typeLabels[group.type]}
          </Badge>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">Active Members</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeMembers}</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-600">Weekly Hours</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.weeklyHours.toFixed(1)}</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-600">Total Hours</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-600">Posts</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
