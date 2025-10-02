'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserSearchResult, SuggestedUser } from '@/types';
import { userApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Check, Users, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface UserCardProps {
  user: UserSearchResult | SuggestedUser;
  variant?: 'search' | 'suggestion' | 'follower' | 'following';
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  variant = 'search',
  onFollowChange,
}) => {
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [isLoading, setIsLoading] = useState(false);

  const isOwnProfile = currentUser?.id === user.id;
  const canFollow = !isOwnProfile && currentUser && variant !== 'follower';

  const handleFollow = async () => {
    if (!canFollow) return;

    try {
      setIsLoading(true);
      
      if (isFollowing) {
        await userApi.unfollowUser(user.id);
        setIsFollowing(false);
        toast.success(`Unfollowed ${user.name}`);
      } else {
        await userApi.followUser(user.id);
        setIsFollowing(true);
        toast.success(`Following ${user.name}`);
      }

      onFollowChange?.(user.id, !isFollowing);
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      toast.error('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  const getReasonBadge = (reason: string) => {
    const reasonMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      'mutual_followers': { label: 'Mutual followers', variant: 'secondary' },
      'similar_interests': { label: 'Similar interests', variant: 'default' },
      'popular_user': { label: 'Popular user', variant: 'outline' },
      'location_based': { label: 'Near you', variant: 'secondary' },
      'activity_based': { label: 'Similar activity', variant: 'default' },
    };

    return reasonMap[reason] || { label: reason, variant: 'outline' };
  };

  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="bg-card-background rounded-lg border border-border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link href={`/profile/${user.username}`} className="flex-shrink-0">
          {user.profilePicture ? (
            <Image
              src={user.profilePicture}
              alt={`${user.name}'s profile picture`}
              width={48}
              height={48}
              className="rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <Link href={`/profile/${user.username}`}>
                <h3 className="font-semibold text-foreground hover:text-primary transition-colors truncate">
                  {user.name}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              
              {user.bio && (
                <p className="text-sm text-foreground mt-1 line-clamp-2">
                  {user.bio}
                </p>
              )}

              {/* Stats and badges */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{formatFollowerCount(user.followersCount)} followers</span>
                </div>

                {/* Suggestion reason */}
                {'reason' in user && user.reason && (
                  <Badge 
                    variant={getReasonBadge(user.reason).variant}
                    className="text-xs"
                  >
                    {getReasonBadge(user.reason).label}
                  </Badge>
                )}

                {/* Location if available */}
                {'location' in user && user.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{user.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Follow Button */}
            {canFollow && (
              <div className="flex-shrink-0 ml-2">
                <Button
                  onClick={handleFollow}
                  disabled={isLoading}
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  className="flex items-center gap-1 min-w-[80px]"
                >
                  {isLoading ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <Check className="w-3 h-3" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact version for lists
export const UserCardCompact: React.FC<UserCardProps> = ({
  user,
  variant = 'search',
  onFollowChange,
}) => {
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [isLoading, setIsLoading] = useState(false);

  const isOwnProfile = currentUser?.id === user.id;
  const canFollow = !isOwnProfile && currentUser && variant !== 'follower';

  const handleFollow = async () => {
    if (!canFollow) return;

    try {
      setIsLoading(true);
      
      if (isFollowing) {
        await userApi.unfollowUser(user.id);
        setIsFollowing(false);
        toast.success(`Unfollowed ${user.name}`);
      } else {
        await userApi.followUser(user.id);
        setIsFollowing(true);
        toast.success(`Following ${user.name}`);
      }

      onFollowChange?.(user.id, !isFollowing);
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      toast.error('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <Link href={`/profile/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
        {/* Avatar */}
        {user.profilePicture ? (
          <Image
            src={user.profilePicture}
            alt={`${user.name}'s profile picture`}
            width={32}
            height={32}
            className="rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* User Info */}
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-foreground truncate">{user.name}</h4>
          <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
        </div>
      </Link>

      {/* Follow Button */}
      {canFollow && (
        <Button
          onClick={handleFollow}
          disabled={isLoading}
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          className="flex items-center gap-1 min-w-[70px]"
        >
          {isLoading ? (
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isFollowing ? (
            'Following'
          ) : (
            'Follow'
          )}
        </Button>
      )}
    </div>
  );
};
