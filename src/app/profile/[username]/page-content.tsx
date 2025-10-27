'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { UserX, ChevronDown, BarChart2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Area,
  ComposedChart,
  BarChart,
  Bar,
} from 'recharts';
import {
  useProfileByUsername,
  useProfileStats,
  useFollowers,
  useFollowing,
  useFollowUser,
  useUnfollowUser,
  useIsFollowing,
} from '@/features/profile/hooks';
import { useUserSessions } from '@/features/sessions/hooks';
import { useProjects } from '@/features/projects/hooks';
import Feed from '@/components/Feed';
import { FollowersList } from '@/features/social/components/FollowersList';
import { FollowingList } from '@/features/social/components/FollowingList';

type YouTab = 'progress' | 'sessions' | 'followers' | 'following';
type TimePeriod = '7D' | '2W' | '4W' | '3M' | '1Y';
type ChartType = 'bar' | 'line';

interface ChartDataPoint {
  name: string;
  hours: number;
  sessions: number;
  avgDuration: number;
}

interface ProfilePageContentProps {
  username: string;
}

export default function ProfilePageContent({
  username,
}: ProfilePageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();
  const tabParam = searchParams?.get('tab') as YouTab | null;

  const [activeTab, setActiveTab] = useState<YouTab>(
    tabParam === 'sessions'
      ? 'sessions'
      : tabParam === 'followers'
        ? 'followers'
        : tabParam === 'following'
          ? 'following'
          : 'progress'
  );
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7D');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('all');
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);

  // Use new profile and session hooks for all data fetching
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useProfileByUsername(username);

  const isOwnProfile = currentUser?.username === username;

  // Dynamic metadata using useEffect for client component
  React.useEffect(() => {
    if (profile) {
      document.title = `${profile.name} (@${profile.username}) - Ambira`;

      const description =
        profile.bio || `View ${profile.name}'s productivity profile on Ambira`;

      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);

      // Open Graph tags
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute(
        'content',
        `${profile.name} (@${profile.username}) - Ambira`
      );

      let ogDescription = document.querySelector(
        'meta[property="og:description"]'
      );
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', description);

      let ogType = document.querySelector('meta[property="og:type"]');
      if (!ogType) {
        ogType = document.createElement('meta');
        ogType.setAttribute('property', 'og:type');
        document.head.appendChild(ogType);
      }
      ogType.setAttribute('content', 'profile');

      // Twitter card tags
      let twitterCard = document.querySelector('meta[name="twitter:card"]');
      if (!twitterCard) {
        twitterCard = document.createElement('meta');
        twitterCard.setAttribute('name', 'twitter:card');
        document.head.appendChild(twitterCard);
      }
      twitterCard.setAttribute('content', 'summary');

      let twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta');
        twitterTitle.setAttribute('name', 'twitter:title');
        document.head.appendChild(twitterTitle);
      }
      twitterTitle.setAttribute(
        'content',
        `${profile.name} (@${profile.username}) - Ambira`
      );

      let twitterDescription = document.querySelector(
        'meta[name="twitter:description"]'
      );
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta');
        twitterDescription.setAttribute('name', 'twitter:description');
        document.head.appendChild(twitterDescription);
      }
      twitterDescription.setAttribute('content', description);
    }
  }, [profile]);

  const { data: stats, isLoading: isLoadingStats } = useProfileStats(
    profile?.id || '',
    {
      enabled: !!profile?.id,
    }
  );

  const { data: sessions = [], isLoading: isLoadingSessions } = useUserSessions(
    profile?.id || '',
    undefined,
    {
      enabled: !!profile?.id,
    }
  );

  const { data: followers = [] } = useFollowers(profile?.id || '', {
    enabled: !!profile?.id,
  });

  const { data: following = [] } = useFollowing(profile?.id || '', {
    enabled: !!profile?.id,
  });

  const { data: activities = [] } = useProjects({
    enabled: !!profile?.id,
  });

  // Check if current user is following this profile
  const { data: isFollowing = false } = useIsFollowing(
    currentUser?.id || '',
    profile?.id || '',
    {
      enabled: !isOwnProfile && !!currentUser?.id && !!profile?.id,
    }
  );

  // Use follow/unfollow mutations
  const followUserMutation = useFollowUser();
  const unfollowUserMutation = useUnfollowUser();

  // Compute loading and error states
  const isLoading = isLoadingProfile || isLoadingStats || isLoadingSessions;
  const error = profileError
    ? (profileError.message as string | undefined)?.includes('not found')
      ? 'User not found'
      : (profileError.message as string | undefined)?.includes('private')
        ? 'This profile is private'
        : (profileError.message as string | undefined)?.includes('followers')
          ? 'This profile is only visible to followers'
          : 'Failed to load profile'
    : null;

  // Filter sessions based on selected activity
  const filteredSessions = useMemo(() => {
    if (selectedActivityId === 'all') return sessions;
    return sessions.filter(
      s =>
        s.activityId === selectedActivityId ||
        s.projectId === selectedActivityId
    );
  }, [sessions, selectedActivityId]);

  // Calculate weekly stats from sessions
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklySessions = sessions.filter(
      s => new Date(s.createdAt) >= oneWeekAgo
    );
    const weeklyHours = weeklySessions.reduce(
      (sum, s) => sum + s.duration / 3600,
      0
    );
    return {
      weeklyHours,
      sessionsThisWeek: weeklySessions.length,
    };
  }, [sessions]);

  // Update tab when URL changes
  useEffect(() => {
    if (
      tabParam === 'sessions' ||
      tabParam === 'progress' ||
      tabParam === 'followers' ||
      tabParam === 'following'
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Show error toast when profile fails to load
  useEffect(() => {
    if (error && profileError) {
      toast.error(error);
    }
  }, [error, profileError]);

  // Calculate chart data using useMemo to prevent infinite loop
  const chartData = useMemo(() => {
    if (!filteredSessions) return [];

    const now = new Date();
    const data: ChartDataPoint[] = [];

    if (timePeriod === '7D') {
      // Last 7 days
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);

        const daySessions = filteredSessions.filter(
          s => new Date(s.createdAt).toDateString() === day.toDateString()
        );
        const hoursWorked = daySessions.reduce(
          (sum, s) => sum + s.duration / 3600,
          0
        );
        const avgDuration =
          daySessions.length > 0
            ? daySessions.reduce((sum, s) => sum + s.duration, 0) /
              daySessions.length /
              60
            : 0;

        const dayName = dayNames[day.getDay()] || 'Day';
        data.push({
          name: `${dayName.slice(0, 3)} ${day.getDate()}`,
          hours: Number(hoursWorked.toFixed(2)),
          sessions: daySessions.length,
          avgDuration: Math.round(avgDuration),
        });
      }
    } else if (timePeriod === '2W') {
      // Last 14 days
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 13; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);

        const daySessions = filteredSessions.filter(
          s => new Date(s.createdAt).toDateString() === day.toDateString()
        );
        const hoursWorked = daySessions.reduce(
          (sum, s) => sum + s.duration / 3600,
          0
        );
        const avgDuration =
          daySessions.length > 0
            ? daySessions.reduce((sum, s) => sum + s.duration, 0) /
              daySessions.length /
              60
            : 0;

        const dayName = dayNames[day.getDay()] || 'Day';
        data.push({
          name: `${dayName.slice(0, 3)} ${day.getDate()}`,
          hours: Number(hoursWorked.toFixed(2)),
          sessions: daySessions.length,
          avgDuration: Math.round(avgDuration),
        });
      }
    } else if (timePeriod === '4W') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);

        const weekSessions = filteredSessions.filter(s => {
          const sessionDate = new Date(s.createdAt);
          return sessionDate >= weekStart && sessionDate <= weekEnd;
        });
        const hoursWorked = weekSessions.reduce(
          (sum, s) => sum + s.duration / 3600,
          0
        );
        const avgDuration =
          weekSessions.length > 0
            ? weekSessions.reduce((sum, s) => sum + s.duration, 0) /
              weekSessions.length /
              60
            : 0;

        data.push({
          name: `Week ${4 - i}`,
          hours: Number(hoursWorked.toFixed(2)),
          sessions: weekSessions.length,
          avgDuration: Math.round(avgDuration),
        });
      }
    } else if (timePeriod === '3M') {
      // Last 3 months
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      for (let i = 2; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(month.getMonth() - i);

        const monthSessions = filteredSessions.filter(s => {
          const sessionDate = new Date(s.createdAt);
          return (
            sessionDate.getMonth() === month.getMonth() &&
            sessionDate.getFullYear() === month.getFullYear()
          );
        });
        const hoursWorked = monthSessions.reduce(
          (sum, s) => sum + s.duration / 3600,
          0
        );
        const avgDuration =
          monthSessions.length > 0
            ? monthSessions.reduce((sum, s) => sum + s.duration, 0) /
              monthSessions.length /
              60
            : 0;

        data.push({
          name: monthNames[month.getMonth()] || 'Month',
          hours: Number(hoursWorked.toFixed(2)),
          sessions: monthSessions.length,
          avgDuration: Math.round(avgDuration),
        });
      }
    } else if (timePeriod === '1Y') {
      // Last 12 months
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(month.getMonth() - i);

        const monthSessions = filteredSessions.filter(s => {
          const sessionDate = new Date(s.createdAt);
          return (
            sessionDate.getMonth() === month.getMonth() &&
            sessionDate.getFullYear() === month.getFullYear()
          );
        });
        const hoursWorked = monthSessions.reduce(
          (sum, s) => sum + s.duration / 3600,
          0
        );
        const avgDuration =
          monthSessions.length > 0
            ? monthSessions.reduce((sum, s) => sum + s.duration, 0) /
              monthSessions.length /
              60
            : 0;

        data.push({
          name: monthNames[month.getMonth()] || 'Month',
          hours: Number(hoursWorked.toFixed(2)),
          sessions: monthSessions.length,
          avgDuration: Math.round(avgDuration),
        });
      }
    }

    return data;
  }, [filteredSessions, timePeriod]);

  // Calculate stats with percentage changes
  const calculatedStats = useMemo(() => {
    const now = new Date();

    // Helper to get date range based on time period
    const getDateRange = (period: TimePeriod) => {
      const end = new Date(now);
      const start = new Date(now);

      switch (period) {
        case '7D':
          start.setDate(now.getDate() - 7);
          break;
        case '2W':
          start.setDate(now.getDate() - 14);
          break;
        case '4W':
          start.setDate(now.getDate() - 28);
          break;
        case '3M':
          start.setMonth(now.getMonth() - 3);
          break;
        case '1Y':
          start.setFullYear(now.getFullYear() - 1);
          break;
      }

      return { start, end };
    };

    // Get current and previous period ranges
    const currentRange = getDateRange(timePeriod);
    const previousStart = new Date(currentRange.start);
    const periodLength =
      currentRange.end.getTime() - currentRange.start.getTime();
    previousStart.setTime(previousStart.getTime() - periodLength);

    // Filter sessions for current period
    const currentPeriodSessions = filteredSessions.filter(s => {
      const sessionDate = new Date(s.createdAt);
      return (
        sessionDate >= currentRange.start && sessionDate <= currentRange.end
      );
    });

    // Filter sessions for previous period
    const previousPeriodSessions = filteredSessions.filter(s => {
      const sessionDate = new Date(s.createdAt);
      return sessionDate >= previousStart && sessionDate < currentRange.start;
    });

    // Calculate current period stats
    const currentHours = currentPeriodSessions.reduce(
      (sum, s) => sum + s.duration / 3600,
      0
    );
    const currentSessionCount = currentPeriodSessions.length;
    const currentAvgDuration =
      currentSessionCount > 0
        ? currentPeriodSessions.reduce((sum, s) => sum + s.duration, 0) /
          currentSessionCount /
          60
        : 0;

    const currentActiveDays = new Set(
      currentPeriodSessions.map(s => new Date(s.createdAt).toDateString())
    ).size;

    // Calculate previous period stats
    const previousHours = previousPeriodSessions.reduce(
      (sum, s) => sum + s.duration / 3600,
      0
    );
    const previousSessionCount = previousPeriodSessions.length;
    const previousAvgDuration =
      previousSessionCount > 0
        ? previousPeriodSessions.reduce((sum, s) => sum + s.duration, 0) /
          previousSessionCount /
          60
        : 0;

    const previousActiveDays = new Set(
      previousPeriodSessions.map(s => new Date(s.createdAt).toDateString())
    ).size;

    // Calculate percentage changes
    const calculateChange = (
      current: number,
      previous: number
    ): number | null => {
      if (previous === 0) return null; // No previous data
      return ((current - previous) / previous) * 100;
    };

    const hoursChange = calculateChange(currentHours, previousHours);
    const sessionsChange = calculateChange(
      currentSessionCount,
      previousSessionCount
    );
    const avgDurationChange = calculateChange(
      currentAvgDuration,
      previousAvgDuration
    );
    const activeDaysChange = calculateChange(
      currentActiveDays,
      previousActiveDays
    );

    return {
      totalHours: currentHours,
      sessions: currentSessionCount,
      avgDuration: Math.round(currentAvgDuration),
      currentStreak: stats?.currentStreak || 0,
      longestStreak: stats?.longestStreak || 0,
      activeDays: currentActiveDays,
      activities: activities?.length || 0,

      // Percentage changes
      hoursChange,
      sessionsChange,
      avgDurationChange,
      activeDaysChange,
      activitiesChange: null, // Activities count doesn't have time-based comparison
      streakChange: null, // Streaks don't have meaningful percentage changes
    };
  }, [filteredSessions, stats, activities, timePeriod]);

  // Average duration over time data - extract from chartData
  const avgDurationData = useMemo(() => {
    return chartData.map(d => ({ name: d.name, value: d.avgDuration }));
  }, [chartData]);

  // Helper to render percentage change
  const renderPercentageChange = (change: number | null) => {
    if (change === null) return null;

    const isPositive = change >= 0;
    const formattedChange = Math.abs(change).toFixed(0);

    return (
      <div
        className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}
      >
        {isPositive ? '↑' : '↓'} {formattedChange}%
      </div>
    );
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-semibold">{entry.name}</span>: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Loading skeleton for profile header */}
          <div className="bg-card-background rounded-lg border border-border p-6 animate-pulse">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-30 h-30 bg-muted rounded-full" />
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="text-center">
                      <div className="h-6 bg-muted rounded w-16 mx-auto mb-2" />
                      <div className="h-4 bg-muted rounded w-20 mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Loading skeleton for tabs */}
          <div className="border-b border-border animate-pulse">
            <div className="flex space-x-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-muted rounded w-24" />
              ))}
            </div>
          </div>

          {/* Loading skeleton for content */}
          <div className="bg-card-background rounded-lg border border-border p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <UserX className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error === 'User not found' && 'User Not Found'}
            {error === 'This profile is private' && 'Private Profile'}
            {error === 'This profile is only visible to followers' &&
              'Followers Only'}
            {error &&
              ![
                'User not found',
                'This profile is private',
                'This profile is only visible to followers',
              ].includes(error) &&
              'Error Loading Profile'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {error === 'User not found' &&
              `The user "${username}" doesn't exist.`}
            {error === 'This profile is private' &&
              `@${username}'s profile is private. Only they can view their profile.`}
            {error === 'This profile is only visible to followers' &&
              `@${username}'s profile is only visible to people they follow back.`}
            {error &&
              ![
                'User not found',
                'This profile is private',
                'This profile is only visible to followers',
              ].includes(error) &&
              'Something went wrong while loading this profile.'}
          </p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Profile Card with This Week Stats */}
          <div className="bg-gray-50 md:rounded-xl md:border border-gray-200 p-3 md:p-6 mb-4 md:mb-6 relative">
            {/* Responsive Layout - Stacks on mobile, side-by-side on desktop */}
            <div className="flex flex-col md:flex-row md:gap-8">
              {/* Left Column - Profile Info */}
              <div className="flex-1">
                {/* Profile Picture */}
                {profile.profilePicture ? (
                  <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-white shadow-md mb-3 md:mb-4">
                    <img
                      src={profile.profilePicture}
                      alt={`${profile.name}'s profile picture`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 md:w-32 md:h-32 bg-[#FC4C02] rounded-full flex items-center justify-center ring-4 ring-white shadow-md mb-3 md:mb-4">
                    <span className="text-white font-bold text-2xl md:text-4xl">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Name and Username */}
                <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                  {profile.name}
                </h1>
                <p className="text-gray-600 text-sm md:text-base mb-2 md:mb-3">
                  @{profile.username}
                </p>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-gray-700 mb-2 md:mb-3 text-sm md:text-base leading-snug">
                    {profile.bio}
                  </p>
                )}

                {/* Location */}
                {profile.location && (
                  <p className="text-gray-500 text-xs md:text-sm mb-3 md:mb-4 flex items-center gap-1">
                    <MapPin
                      className="w-3 h-3 md:w-4 md:h-4"
                      aria-hidden="true"
                    />
                    {profile.location}
                  </p>
                )}

                {/* Follow Button - Only for other users' profiles */}
                {!isOwnProfile && currentUser && profile && (
                  <button
                    onClick={async () => {
                      try {
                        if (isFollowing) {
                          await unfollowUserMutation.mutateAsync({
                            currentUserId: currentUser.id,
                            targetUserId: profile.id,
                          });
                        } else {
                          await followUserMutation.mutateAsync({
                            currentUserId: currentUser.id,
                            targetUserId: profile.id,
                          });
                        }
                        // Automatic cache invalidation handled by mutations
                      } catch (error) {
                        console.error('Follow error:', error);
                      }
                    }}
                    disabled={
                      followUserMutation.isPending ||
                      unfollowUserMutation.isPending
                    }
                    className={`inline-flex items-center gap-2 mb-3 md:mb-4 px-3 md:px-4 py-2 md:py-2.5 rounded-lg transition-colors font-semibold text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      isFollowing
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-[#007AFF] text-white hover:bg-[#0056D6]'
                    }`}
                  >
                    {followUserMutation.isPending ||
                    unfollowUserMutation.isPending
                      ? 'Loading...'
                      : isFollowing
                        ? 'Following'
                        : 'Follow'}
                  </button>
                )}

                {/* Follower/Following Counts */}
                <div className="flex gap-4 md:gap-6 mb-4 md:mb-0">
                  <button
                    onClick={() => {
                      setActiveTab('followers');
                      router.push(`/profile/${username}?tab=followers`);
                    }}
                    className="hover:underline"
                  >
                    <span className="font-bold text-gray-900 text-sm md:text-base">
                      {followers.length}
                    </span>{' '}
                    <span className="text-gray-600 text-xs md:text-sm">
                      Followers
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('following');
                      router.push(`/profile/${username}?tab=following`);
                    }}
                    className="hover:underline"
                  >
                    <span className="font-bold text-gray-900 text-sm md:text-base">
                      {following.length}
                    </span>{' '}
                    <span className="text-gray-600 text-xs md:text-sm">
                      Following
                    </span>
                  </button>
                </div>
              </div>

              {/* Right Column - This Week Stats */}
              <div className="md:w-64 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-8">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <BarChart2
                    className="w-4 h-4 md:w-5 md:h-5 text-[#FC4C02]"
                    aria-hidden="true"
                  />
                  <h2 className="text-sm md:text-base font-bold">This week</h2>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-1 gap-3 md:gap-4 md:space-y-0">
                  <div>
                    <div className="text-[10px] md:text-xs text-gray-600 uppercase tracking-wide">
                      Time
                    </div>
                    <div className="text-lg md:text-2xl font-bold">
                      {weeklyStats.weeklyHours.toFixed(1)}h
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] md:text-xs text-gray-600 uppercase tracking-wide">
                      Sessions
                    </div>
                    <div className="text-lg md:text-2xl font-bold">
                      {weeklyStats.sessionsThisWeek}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] md:text-xs text-gray-600 uppercase tracking-wide">
                      Streak
                    </div>
                    <div className="text-lg md:text-2xl font-bold">
                      {stats?.currentStreak || 0}{' '}
                      <span className="text-sm md:text-base">days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="sticky top-12 md:top-14 bg-white md:bg-gray-50 z-30 -mx-4 md:mx-0">
            <div className="bg-white md:bg-gray-50 border-b border-gray-200">
              <div className="flex md:gap-8 px-4 md:px-0 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => {
                    setActiveTab('progress');
                    router.push(`/profile/${username}?tab=progress`);
                  }}
                  className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'progress'
                      ? 'border-[#007AFF] text-[#007AFF]'
                      : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                  }`}
                >
                  Progress
                </button>
                <button
                  onClick={() => {
                    setActiveTab('sessions');
                    router.push(`/profile/${username}?tab=sessions`);
                  }}
                  className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'sessions'
                      ? 'border-[#007AFF] text-[#007AFF]'
                      : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                  }`}
                >
                  Sessions
                </button>
                <button
                  onClick={() => {
                    setActiveTab('followers');
                    router.push(`/profile/${username}?tab=followers`);
                  }}
                  className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'followers'
                      ? 'border-[#007AFF] text-[#007AFF]'
                      : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                  }`}
                >
                  Followers
                </button>
                <button
                  onClick={() => {
                    setActiveTab('following');
                    router.push(`/profile/${username}?tab=following`);
                  }}
                  className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'following'
                      ? 'border-[#007AFF] text-[#007AFF]'
                      : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                  }`}
                >
                  Following
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'progress' && (
              <div className="space-y-4">
                {/* Controls */}
                <div className="space-y-3">
                  {/* Row 1: Activity Selector & Chart Type */}
                  <div className="flex items-center gap-2">
                    {/* Activity Selector */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() =>
                          setShowActivityDropdown(!showActivityDropdown)
                        }
                        className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 min-w-[140px] max-w-[200px]"
                      >
                        <span className="truncate">
                          {selectedActivityId === 'all'
                            ? 'All activities'
                            : activities?.find(p => p.id === selectedActivityId)
                                ?.name || 'All activities'}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                      </button>
                      {showActivityDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowActivityDropdown(false)}
                          />
                          <div className="absolute left-0 top-full mt-2 w-full max-w-xs bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-64 overflow-y-auto">
                            <button
                              onClick={() => {
                                setSelectedActivityId('all');
                                setShowActivityDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedActivityId === 'all' ? 'bg-blue-50 text-blue-600' : ''}`}
                            >
                              All
                            </button>
                            {(!activities || activities.length === 0) && (
                              <div className="px-4 py-2 text-xs text-gray-400">
                                No activities yet
                              </div>
                            )}
                            {activities?.map(activity => (
                              <button
                                key={activity.id}
                                onClick={() => {
                                  setSelectedActivityId(activity.id);
                                  setShowActivityDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-3 ${selectedActivityId === activity.id ? 'bg-blue-50 text-blue-600' : ''}`}
                              >
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{
                                    backgroundColor: activity.color + '20',
                                  }}
                                >
                                  <span style={{ color: activity.color }}>
                                    ●
                                  </span>
                                </div>
                                <span className="truncate">
                                  {activity.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Chart Type Selector */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() =>
                          setShowChartTypeDropdown(!showChartTypeDropdown)
                        }
                        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <svg
                          className="w-3.5 h-3.5 md:w-4 md:h-4"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          {chartType === 'bar' ? (
                            <>
                              <rect x="2" y="8" width="3" height="6" rx="0.5" />
                              <rect
                                x="6.5"
                                y="4"
                                width="3"
                                height="10"
                                rx="0.5"
                              />
                              <rect
                                x="11"
                                y="6"
                                width="3"
                                height="8"
                                rx="0.5"
                              />
                            </>
                          ) : (
                            <path
                              d="M2 12 L5 8 L8 10 L11 4 L14 6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                        </svg>
                        <span className="capitalize">{chartType}</span>
                        <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      {showChartTypeDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowChartTypeDropdown(false)}
                          />
                          <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                            <button
                              onClick={() => {
                                setChartType('bar');
                                setShowChartTypeDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${chartType === 'bar' ? 'bg-blue-50 text-blue-600' : ''}`}
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                              >
                                <rect
                                  x="2"
                                  y="8"
                                  width="3"
                                  height="6"
                                  rx="0.5"
                                />
                                <rect
                                  x="6.5"
                                  y="4"
                                  width="3"
                                  height="10"
                                  rx="0.5"
                                />
                                <rect
                                  x="11"
                                  y="6"
                                  width="3"
                                  height="8"
                                  rx="0.5"
                                />
                              </svg>
                              Bar
                            </button>
                            <button
                              onClick={() => {
                                setChartType('line');
                                setShowChartTypeDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${chartType === 'line' ? 'bg-blue-50 text-blue-600' : ''}`}
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                              >
                                <path
                                  d="M2 12 L5 8 L8 10 L11 4 L14 6"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Line
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Time Period Buttons - Scrollable on mobile */}
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                    {(['7D', '2W', '4W', '3M', '1Y'] as TimePeriod[]).map(
                      period => (
                        <button
                          key={period}
                          onClick={() => setTimePeriod(period)}
                          className={`flex-shrink-0 px-4 md:px-5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors ${
                            timePeriod === period
                              ? 'bg-gray-900 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          {period}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Main Chart */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900">
                        Hours completed
                      </h3>
                    </div>
                    <div className="h-72">
                      {isLoading ? (
                        <div className="h-full bg-gray-50 rounded animate-pulse" />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'bar' ? (
                            <BarChart
                              data={chartData}
                              margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                              }}
                            >
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 12, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                                width={40}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar
                                dataKey="hours"
                                fill="#007AFF"
                                radius={[4, 4, 0, 0]}
                                name="Hours"
                              />
                            </BarChart>
                          ) : (
                            <ComposedChart
                              data={chartData}
                              margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                              }}
                            >
                              <defs>
                                <linearGradient
                                  id="colorHours"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#007AFF"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#007AFF"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 12, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                                width={40}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Area
                                type="monotone"
                                dataKey="hours"
                                stroke="#007AFF"
                                strokeWidth={2}
                                fill="url(#colorHours)"
                                name="Hours"
                              />
                            </ComposedChart>
                          )}
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Second Row - Two Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Average Session Duration */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900">
                          Average session duration
                        </h3>
                      </div>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'bar' ? (
                            <BarChart
                              data={avgDurationData}
                              margin={{
                                top: 5,
                                right: 5,
                                left: -30,
                                bottom: 0,
                              }}
                            >
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar
                                dataKey="value"
                                fill="#34C759"
                                radius={[4, 4, 0, 0]}
                                name="Minutes"
                              />
                            </BarChart>
                          ) : (
                            <ComposedChart
                              data={avgDurationData}
                              margin={{
                                top: 5,
                                right: 5,
                                left: -30,
                                bottom: 0,
                              }}
                            >
                              <defs>
                                <linearGradient
                                  id="colorAvgDuration"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#34C759"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#34C759"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#34C759"
                                strokeWidth={2}
                                fill="url(#colorAvgDuration)"
                                name="Minutes"
                              />
                            </ComposedChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Sessions */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900">
                          Sessions completed
                        </h3>
                      </div>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'bar' ? (
                            <BarChart
                              data={chartData}
                              margin={{
                                top: 5,
                                right: 5,
                                left: -30,
                                bottom: 0,
                              }}
                            >
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar
                                dataKey="sessions"
                                fill="#34C759"
                                radius={[4, 4, 0, 0]}
                                name="Sessions"
                              />
                            </BarChart>
                          ) : (
                            <ComposedChart
                              data={chartData}
                              margin={{
                                top: 5,
                                right: 5,
                                left: -30,
                                bottom: 0,
                              }}
                            >
                              <defs>
                                <linearGradient
                                  id="colorSessionsSmall"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#34C759"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#34C759"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Area
                                type="monotone"
                                dataKey="sessions"
                                stroke="#34C759"
                                strokeWidth={2}
                                fill="url(#colorSessionsSmall)"
                                name="Sessions"
                              />
                            </ComposedChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid - 5 columns */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
                        Total Hours
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {calculatedStats.totalHours.toFixed(1)}
                      </div>
                      {renderPercentageChange(calculatedStats.hoursChange)}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
                        Avg Duration
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {calculatedStats.avgDuration}m
                      </div>
                      {renderPercentageChange(
                        calculatedStats.avgDurationChange
                      )}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
                        Sessions
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {calculatedStats.sessions}
                      </div>
                      {renderPercentageChange(calculatedStats.sessionsChange)}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
                        Active Days
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {calculatedStats.activeDays}
                      </div>
                      {renderPercentageChange(calculatedStats.activeDaysChange)}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
                        Activities
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {calculatedStats.activities}
                      </div>
                      {renderPercentageChange(calculatedStats.activitiesChange)}
                    </div>
                  </div>

                  {/* Secondary Stats Grid - Streaks */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
                        Current Streak
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {calculatedStats.currentStreak}
                      </div>
                      {renderPercentageChange(calculatedStats.streakChange)}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
                        Longest Streak
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {calculatedStats.longestStreak}
                      </div>
                      {renderPercentageChange(calculatedStats.streakChange)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="max-w-4xl mx-auto">
                <Feed
                  filters={{ type: 'user', userId: profile.id }}
                  showEndMessage={true}
                />
              </div>
            )}

            {activeTab === 'followers' && (
              <div>
                <FollowersList userId={profile.id} />
              </div>
            )}

            {activeTab === 'following' && (
              <div>
                <FollowingList userId={profile.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
