'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { UserProfile } from '@/types';
import { firebaseUserApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Users, Clock, Edit3, UserPlus, Check } from 'lucide-react';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(profile.isFollowing || false);
  const [isLoading, setIsLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(profile.followersCount);

  const isOwnProfile = user?.id === profile.id;
  const canFollow = !isOwnProfile && user;

  const handleFollow = async () => {
    if (!canFollow) return;

    try {
      setIsLoading(true);
      
      if (isFollowing) {
        await firebaseUserApi.unfollowUser(profile.id);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast.success(`Unfollowed ${profile.name}`);
      } else {
        await firebaseUserApi.followUser(profile.id);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success(`Following ${profile.name}`);
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
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      toast.error('Failed to update follow status');
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
    <div className="bg-card-background rounded-lg border border-border p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="relative">
            {profile.profilePicture ? (
              <Image
                src={profile.profilePicture}
                alt={`${profile.name}'s profile picture`}
                width={120}
                height={120}
                className="rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-30 h-30 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
            {profile.isPrivate && (
              <Badge variant="secondary" className="absolute -bottom-2 -right-2">
                Private
              </Badge>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground truncate">
                {profile.name}
              </h1>
              <p className="text-muted-foreground text-lg">@{profile.username}</p>
              
              {profile.bio && (
                <p className="text-foreground mt-3 leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Location and Join Date */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDate(profile.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {showEditButton && isOwnProfile && (
                <Button
                  variant="outline"
                  onClick={onEditClick}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </Button>
              )}
              
              {canFollow && (
                <Button
                  onClick={handleFollow}
                  disabled={isLoading}
                  variant={isFollowing ? "outline" : "default"}
                  className="flex items-center gap-2 min-w-[100px]"
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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-foreground">
                <Users className="w-4 h-4" />
                <span className="font-semibold">{followersCount.toLocaleString()}</span>
              </div>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-foreground">
                <UserPlus className="w-4 h-4" />
                <span className="font-semibold">{profile.followingCount.toLocaleString()}</span>
              </div>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">{formatHours(profile.totalHours)}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
