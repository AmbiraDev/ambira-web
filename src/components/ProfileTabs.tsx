'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { firebasePostApi } from '@/lib/firebaseApi';
import { PostWithDetails } from '@/types';
import { 
  BarChart3, 
  Trophy, 
  Users, 
  FileText,
  Calendar,
  TrendingUp,
  Award,
  Clock
} from 'lucide-react';

export type ProfileTab = 'overview' | 'achievements' | 'following' | 'posts';

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  stats?: {
    totalHours: number;
    currentStreak: number;
    achievements: number;
    followers: number;
    following: number;
    posts: number;
  };
  showPrivateContent?: boolean;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  stats,
  showPrivateContent = false,
}) => {
  const tabs: Array<{
    id: ProfileTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    disabled?: boolean;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'achievements',
      label: 'Achievements',
      icon: <Trophy className="w-4 h-4" />,
      badge: stats?.achievements,
    },
    {
      id: 'following',
      label: 'Following',
      icon: <Users className="w-4 h-4" />,
      badge: stats?.following,
    },
    {
      id: 'posts',
      label: 'Posts',
      icon: <FileText className="w-4 h-4" />,
      badge: stats?.posts,
      disabled: !showPrivateContent,
    },
  ];

  return (
    <div className="border-b border-border">
      <div className="flex space-x-1 overflow-x-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-none border-b-2 transition-all
              ${activeTab === tab.id 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
              }
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {tab.icon}
            <span className="whitespace-nowrap">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <Badge 
                variant={activeTab === tab.id ? "secondary" : "outline"} 
                className="ml-1 text-xs"
              >
                {tab.badge}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

// Tab content components
interface TabContentProps {
  children: React.ReactNode;
  className?: string;
}

export const TabContent: React.FC<TabContentProps> = ({ children, className = "" }) => (
  <div className={`py-6 ${className}`}>
    {children}
  </div>
);

// Overview tab content
interface OverviewContentProps {
  stats?: {
    totalHours: number;
    weeklyHours: number;
    monthlyHours: number;
    currentStreak: number;
    longestStreak: number;
    sessionsThisWeek: number;
    sessionsThisMonth: number;
    averageSessionDuration: number;
    mostProductiveHour: number;
  };
}

export const OverviewContent: React.FC<OverviewContentProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  const formatHours = (hours: number | undefined): string => {
    if (hours === undefined || hours === null || isNaN(hours)) {
      return '0h';
    }
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card-background p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Total Hours</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatHours(stats.totalHours)}
          </div>
        </div>

        <div className="bg-card-background p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Current Streak</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.currentStreak} days
          </div>
        </div>

        <div className="bg-card-background p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">This Week</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatHours(stats.weeklyHours)}
          </div>
        </div>

        <div className="bg-card-background p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Award className="w-4 h-4" />
            <span className="text-sm">Longest Streak</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.longestStreak} days
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card-background p-6 rounded-lg border border-border">
          <h3 className="font-semibold text-foreground mb-4">Activity Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sessions this week:</span>
              <span className="font-medium">{stats.sessionsThisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sessions this month:</span>
              <span className="font-medium">{stats.sessionsThisMonth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg session duration:</span>
              <span className="font-medium">{formatDuration(stats.averageSessionDuration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Most productive hour:</span>
              <span className="font-medium">{stats.mostProductiveHour}:00</span>
            </div>
          </div>
        </div>

        <div className="bg-card-background p-6 rounded-lg border border-border">
          <h3 className="font-semibold text-foreground mb-4">Monthly Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total hours:</span>
              <span className="font-medium">{formatHours(stats.monthlyHours)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily average:</span>
              <span className="font-medium">
                {formatHours(stats.monthlyHours / 30)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weekly average:</span>
              <span className="font-medium">{formatHours(stats.monthlyHours / 4.3)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder components for other tabs
export const AchievementsContent: React.FC = () => (
  <div className="text-center py-12">
    <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-foreground mb-2">Achievements</h3>
    <p className="text-muted-foreground">
      Achievement system coming soon! Track your milestones and earn badges.
    </p>
  </div>
);

export const FollowingContent: React.FC = () => (
  <div className="text-center py-12">
    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-foreground mb-2">Following</h3>
    <p className="text-muted-foreground">
      Follow list will be displayed here.
    </p>
  </div>
);

interface PostsContentProps {
  userId: string;
  isOwnProfile?: boolean;
}

export const PostsContent: React.FC<PostsContentProps> = ({ userId, isOwnProfile = false }) => {
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userPosts = await firebasePostApi.getUserPosts(userId, 20, isOwnProfile);
        setPosts(userPosts);
      } catch (err: any) {
        console.error('Failed to load user posts:', err);
        setError(err.message || 'Failed to load posts');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadPosts();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Error loading posts</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {isOwnProfile ? 'No posts yet' : 'No posts'}
        </h3>
        <p className="text-muted-foreground">
          {isOwnProfile 
            ? 'Complete some sessions to see your posts here.' 
            : 'This user hasn\'t shared any posts yet.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-card-background p-4 rounded-lg border border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {post.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-foreground">{post.user.name}</h4>
                <span className="text-sm text-muted-foreground">@{post.user.username}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-foreground mb-3">{post.content}</p>
              {post.session && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {post.session.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Duration: {Math.floor(post.session.duration / 3600)}h {Math.floor((post.session.duration % 3600) / 60)}m</span>
                    {post.session.tasks && post.session.tasks.length > 0 && (
                      <span>Tasks: {post.session.tasks.length}</span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span>{post.supportCount} supports</span>
                <span>{post.commentCount} comments</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
