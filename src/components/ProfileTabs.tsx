'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { firebaseSessionApi, firebaseApi } from '@/lib/firebaseApi';
import { Session, User, Project, SessionWithDetails } from '@/types';
import SessionCard from './SessionCard';
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
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Fetch sessions - sessions ARE posts (Strava-like)
        const userSessions = await firebaseSessionApi.getUserSessions(userId, 20, isOwnProfile);
        setSessions(userSessions);
        console.log('Loaded sessions for posts tab:', userSessions);
      } catch (err: any) {
        console.error('Failed to load user sessions:', err);
        setError(err.message || 'Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadSessions();
    }
  }, [userId, isOwnProfile]);

  // Handle support
  const handleSupport = useCallback(async (sessionId: string) => {
    try {
      await firebaseApi.post.supportSession(sessionId);

      // Optimistic update
      setSessions(prev => prev.map(session =>
        session.id === sessionId
          ? { ...session, isSupported: true, supportCount: session.supportCount + 1 }
          : session
      ));
    } catch (err: any) {
      console.error('Failed to support session:', err);
    }
  }, []);

  // Handle remove support
  const handleRemoveSupport = useCallback(async (sessionId: string) => {
    try {
      await firebaseApi.post.removeSupportFromSession(sessionId);

      // Optimistic update
      setSessions(prev => prev.map(session =>
        session.id === sessionId
          ? { ...session, isSupported: false, supportCount: Math.max(0, session.supportCount - 1) }
          : session
      ));
    } catch (err: any) {
      console.error('Failed to remove support:', err);
    }
  }, []);

  // Handle share
  const handleShare = useCallback(async (sessionId: string) => {
    try {
      const sessionUrl = `${window.location.origin}/sessions/${sessionId}`;

      if (navigator.share) {
        await navigator.share({
          title: 'Check out this session on Ambira',
          text: 'Look at this productive session!',
          url: sessionUrl
        });
      } else {
        await navigator.clipboard.writeText(sessionUrl);
        console.log('Link copied to clipboard');
      }
    } catch (err: any) {
      console.error('Failed to share session:', err);
    }
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }
    try {
      await firebaseSessionApi.deleteSession(sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (err: any) {
      console.error('Failed to delete session:', err);
    }
  }, []);

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

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {isOwnProfile ? 'No sessions yet' : 'No sessions'}
        </h3>
        <p className="text-muted-foreground">
          {isOwnProfile
            ? 'Complete some sessions to see them here.'
            : 'This user hasn\'t shared any sessions yet.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onSupport={handleSupport}
          onRemoveSupport={handleRemoveSupport}
          onShare={handleShare}
          onDelete={isOwnProfile ? handleDelete : undefined}
          showComments={true}
        />
      ))}
    </div>
  );
};
