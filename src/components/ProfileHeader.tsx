'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/types';
import { firebaseUserApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Calendar,
  Clock,
  Edit3,
  UserPlus,
  Check,
  LogOut,
} from 'lucide-react';

interface ProfileHeaderProps {
  profile: UserProfile;
  onProfileUpdate?: (updatedProfile: UserProfile) => void;
  showEditButton?: boolean;
  onEditClick?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onProfileUpdate,
  showEditButton = false,
  onEditClick,
}) => {
  const { user, logout } = useAuth();
  const [isFollowing, setIsFollowing] = useState(profile.isFollowing || false);
  const [isLoading, setIsLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(profile.followersCount);

  const isOwnProfile = user?.username === profile.username;
  const canFollow = !isOwnProfile && user;

  const handleFollow = async () => {
    if (!canFollow) return;

    try {
      setIsLoading(true);

      if (isFollowing) {
        await firebaseUserApi.unfollowUser(profile.id);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await firebaseUserApi.followUser(profile.id);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }

      // Update profile data if callback provided
      if (onProfileUpdate) {
        const updatedProfile = {
          ...profile,
          isFollowing: !isFollowing,
          followersCount: isFollowing ? followersCount - 1 : followersCount + 1,
        };
        onProfileUpdate(updatedProfile);
      }
    } catch (_error) {
      console.error('Follow/unfollow error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatHours = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    }
    if (hours < 100) {
      return `${hours.toFixed(1)}h`;
    }
    return `${Math.round(hours)}h`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="flex flex-col gap-6">
        {/* Top section: Avatar + Name + Actions */}
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              {profile.profilePicture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profilePicture}
                  alt={`${profile.name}'s profile picture`}
                  className="w-[140px] h-[140px] rounded-full object-cover border-4 border-gray-100"
                />
              ) : (
                <div className="w-[140px] h-[140px] bg-gradient-to-br from-[#FC4C02] to-[#FF8800] rounded-full flex items-center justify-center text-white text-5xl font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Name and actions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.name}
                </h1>
                {profile.location && (
                  <div className="flex items-center gap-1 mt-1 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {isOwnProfile && showEditButton && onEditClick && (
                  <Button
                    onClick={onEditClick}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="hidden md:inline">Edit Profile</span>
                  </Button>
                )}
                {canFollow && (
                  <Button
                    onClick={handleFollow}
                    disabled={isLoading}
                    variant={isFollowing ? 'outline' : 'default'}
                    className={`flex items-center gap-2 min-w-[110px] ${
                      isFollowing
                        ? 'border-gray-300'
                        : 'bg-[#FC4C02] hover:bg-[#E04502]'
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <Check className="w-4 h-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-4">
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  {followersCount.toLocaleString()}
                </span>
                <span className="text-sm text-gray-600 ml-1">Followers</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  {profile.followingCount.toLocaleString()}
                </span>
                <span className="text-sm text-gray-600 ml-1">Following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="text-gray-700 leading-relaxed">{profile.bio}</div>
        )}

        {/* Additional info */}
        <div className="flex items-center gap-4 text-sm text-gray-600 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Joined {formatDate(profile.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatHours(profile.totalHours)} total time</span>
          </div>
          {isOwnProfile && (
            <button
              onClick={logout}
              className="ml-auto flex items-center gap-1 text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
