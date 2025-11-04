'use client';

import React, { useState, useEffect } from 'react';
import { SuggestedUser } from '@/types';
import { firebaseUserApi } from '@/lib/api';
import { UserCard } from './UserCard';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Sparkles, TrendingUp } from 'lucide-react';

interface SuggestedUsersProps {
  limit?: number;
  showHeader?: boolean;
  onUserSelect?: (user: SuggestedUser) => void;
  variant?: 'default' | 'compact';
}

const SuggestedUsers: React.FC<SuggestedUsersProps> = ({
  limit = 10,
  showHeader = true,
  onUserSelect,
  variant = 'default',
}) => {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSuggestions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const suggestions = await firebaseUserApi.getSuggestedUsers(limit);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load suggestions');
      // Don't show error for empty database - just set empty array
      if (error instanceof Error && error.message.includes('permissions')) {
        setSuggestions([]);
      } else {
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const handleRefresh = () => {
    loadSuggestions(true);
  };

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setSuggestions(prev =>
      prev.map(user =>
        user.id === userId
          ? {
              ...user,
              isFollowing,
              followersCount: isFollowing
                ? user.followersCount + 1
                : Math.max(0, user.followersCount - 1),
            }
          : user
      )
    );
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'mutual_followers':
        return <Users className="w-3 h-3" />;
      case 'similar_interests':
        return <Sparkles className="w-3 h-3" />;
      case 'popular_user':
        return <TrendingUp className="w-3 h-3" />;
      case 'location_based':
        return <Users className="w-3 h-3" />;
      case 'activity_based':
        return <TrendingUp className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  const getReasonColor = (reason: string): string => {
    switch (reason) {
      case 'mutual_followers':
        return 'text-blue-600';
      case 'similar_interests':
        return 'text-purple-600';
      case 'popular_user':
        return 'text-orange-600';
      case 'location_based':
        return 'text-green-600';
      case 'activity_based':
        return 'text-pink-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card-background rounded-lg border border-border p-6">
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Suggested Users
            </h3>
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="w-20 h-8 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-card-background rounded-lg border border-border p-6">
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Suggested Users
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        )}
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h4 className="font-medium text-foreground mb-1">
            No suggestions available
          </h4>
          <p className="text-sm text-muted-foreground">
            We couldn't find any users to suggest right now. Try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-background rounded-lg border border-border p-6">
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Suggested Users
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {suggestions.map(user => (
          <div key={user.id} onClick={() => onUserSelect?.(user)}>
            {variant === 'compact' ? (
              <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  {user.profilePicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profilePicture}
                      alt={`${user.name}'s profile picture`}
                      className="w-10 h-10 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* User Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-foreground truncate">
                      {user.name}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.followersCount || 0} followers
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {getReasonIcon(user.reason)}
                      <span
                        className={`text-xs ${getReasonColor(user.reason)}`}
                      >
                        {user.reason.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Follow Button */}
                {!user.isFollowing && (
                  <Button
                    size="sm"
                    className="flex items-center gap-1 min-w-[70px]"
                    onClick={e => {
                      e.stopPropagation();
                      // Handle follow logic here
                    }}
                  >
                    Follow
                  </Button>
                )}
              </div>
            ) : (
              <UserCard
                user={user}
                variant="suggestion"
                onFollowChange={handleFollowChange}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Compact sidebar version
export const SuggestedUsersSidebar: React.FC<SuggestedUsersProps> = props => {
  return (
    <SuggestedUsers {...props} limit={5} variant="compact" showHeader={true} />
  );
};

// Widget version for dashboard
export const SuggestedUsersWidget: React.FC<SuggestedUsersProps> = props => {
  return (
    <SuggestedUsers {...props} limit={6} variant="compact" showHeader={true} />
  );
};

export default SuggestedUsers;
