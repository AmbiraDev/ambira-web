'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { UserProfile, UserStats, ProfileTab, Session, User as UserType } from '@/types';
import { firebaseUserApi, firebaseSessionApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ProfileTabs, TabContent, OverviewContent, AchievementsContent, FollowersContent, FollowingContent, PostsContent } from '@/components/ProfileTabs';
import { ProfileStats } from '@/components/ProfileStats';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import { Button } from '@/components/ui/button';
import { UserX, Heart, MessageCircle, Share2, Calendar, Clock, Target, ChevronDown, MoreVertical, Edit, User as UserIcon, Users } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useUserFollowers, useUserFollowing } from '@/hooks/useCache';
import { UnifiedProfileCard } from '@/components/UnifiedProfileCard';

type YouTab = 'progress' | 'sessions' | 'profile';
type TimePeriod = 'day' | 'week' | 'month' | 'year';

interface ChartDataPoint {
  name: string;
  hours: number;
}

interface CategoryStats {
  category: string;
  hours: number;
  sessions: number;
  percentage: number;
  icon: string;
  color: string;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();
  const tabParam = searchParams?.get('tab') as YouTab | null;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<YouTab>(
    tabParam === 'sessions' ? 'sessions' : tabParam === 'profile' ? 'profile' : 'progress'
  );
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = currentUser?.username === username;

  // Use cached hooks for followers/following
  const { data: followers = [], isLoading: followersLoading } = useUserFollowers(profile?.id || '', {
    enabled: !!profile?.id,
  });
  const { data: following = [], isLoading: followingLoading } = useUserFollowing(profile?.id || '', {
    enabled: !!profile?.id,
  });

  // Update tab when URL changes
  useEffect(() => {
    if (tabParam === 'sessions' || tabParam === 'progress' || tabParam === 'profile') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const profileData = await firebaseUserApi.getUserProfile(username);
      setProfile(profileData);

      // Load stats after we have the profile
      const statsData = await firebaseUserApi.getUserStats(profileData.id);
      setStats(statsData);

      // Load sessions
      let sessionsData: Session[] = [];
      try {
        sessionsData = await firebaseSessionApi.getUserSessions(profileData.id, 50, isOwnProfile);
      } catch (sessionError) {
        // Silently handle session loading errors, default to empty array
        sessionsData = [];
      }
      setSessions(sessionsData);

      // Load posts count (sessions count since sessions = posts)
      const sessionsCount = await firebaseSessionApi.getUserSessionsCount(profileData.id, isOwnProfile);
      setPostsCount(sessionsCount);

      // Note: Followers and following are now loaded via cached hooks above

    } catch (error: any) {
      // Handle profile load errors gracefully without console logging
      if (error.message?.includes('not found')) {
        setError('User not found');
      } else if (error.message?.includes('private')) {
        setError('This profile is private');
      } else if (error.message?.includes('followers')) {
        setError('This profile is only visible to followers');
      } else {
        setError('Failed to load profile');
        toast.error('Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  }, [username, isOwnProfile]);

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username, loadProfile]);

  useEffect(() => {
    processChartData();
    if (sessions.length > 0) {
      processCategoryStats();
    } else {
      setCategoryStats([]);
    }
  }, [sessions, timePeriod]);

  const processChartData = () => {
    const now = new Date();
    const data: ChartDataPoint[] = [];

    if (timePeriod === 'day') {
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now);
        hour.setHours(hour.getHours() - i);
        const hourLabel = hour.getHours().toString().padStart(2, '0');

        const hoursWorked = sessions.length > 0 ? sessions
          .filter(s => {
            const sessionDate = new Date(s.createdAt);
            return sessionDate.getHours() === hour.getHours() &&
                   sessionDate.toDateString() === hour.toDateString();
          })
          .reduce((sum, s) => sum + s.duration / 3600, 0) : 0;

        data.push({ name: hourLabel, hours: Number(hoursWorked.toFixed(2)) });
      }
    } else if (timePeriod === 'week') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);

        const hoursWorked = sessions.length > 0 ? sessions
          .filter(s => new Date(s.createdAt).toDateString() === day.toDateString())
          .reduce((sum, s) => sum + s.duration / 3600, 0) : 0;

        data.push({
          name: dayNames[day.getDay()],
          hours: Number(hoursWorked.toFixed(2))
        });
      }
    } else if (timePeriod === 'month') {
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));

        const hoursWorked = sessions.length > 0 ? sessions
          .filter(s => {
            const sessionDate = new Date(s.createdAt);
            return sessionDate >= weekStart && sessionDate <= weekEnd;
          })
          .reduce((sum, s) => sum + s.duration / 3600, 0) : 0;

        data.push({
          name: `Week ${4 - i}`,
          hours: Number(hoursWorked.toFixed(2))
        });
      }
    } else if (timePeriod === 'year') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(month.getMonth() - i);

        const hoursWorked = sessions.length > 0 ? sessions
          .filter(s => {
            const sessionDate = new Date(s.createdAt);
            return sessionDate.getMonth() === month.getMonth() &&
                   sessionDate.getFullYear() === month.getFullYear();
          })
          .reduce((sum, s) => sum + s.duration / 3600, 0) : 0;

        data.push({
          name: monthNames[month.getMonth()],
          hours: Number(hoursWorked.toFixed(2))
        });
      }
    }

    setChartData(data);
  };

  const processCategoryStats = () => {
    setCategoryStats([]);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
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
                  {[1, 2, 3].map((i) => (
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
              {[1, 2, 3, 4].map((i) => (
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
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !profile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-16">
          <UserX className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error === 'User not found' && 'User Not Found'}
            {error === 'This profile is private' && 'Private Profile'}
            {error === 'This profile is only visible to followers' && 'Followers Only'}
            {error && !['User not found', 'This profile is private', 'This profile is only visible to followers'].includes(error) && 'Error Loading Profile'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {error === 'User not found' && `The user "${username}" doesn't exist.`}
            {error === 'This profile is private' && `@${username}'s profile is private. Only they can view their profile.`}
            {error === 'This profile is only visible to followers' && `@${username}'s profile is only visible to people they follow back.`}
            {error && !['User not found', 'This profile is private', 'This profile is only visible to followers'].includes(error) && 'Something went wrong while loading this profile.'}
          </p>
          <Button asChild>
            <Link href="/">
              Go Home
            </Link>
          </Button>
        </div>
        </div>
        </div>
      </ProtectedRoute>
    );
  }

  const tabStats = {
    totalHours: stats?.totalHours || 0,
    currentStreak: stats?.currentStreak || 0,
    achievements: 0, // TODO: Implement achievements
    followers: followers.length,
    following: following.length,
    posts: postsCount,
  };
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white md:bg-gray-50">
        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden">
          <MobileHeader title={profile.name} />
        </div>

        {/* Profile Header - Only for other users' profiles */}
        {!isOwnProfile && (
          <div className="bg-white md:bg-gray-50 pt-6">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  {/* Profile Picture */}
                  {profile.profilePicture ? (
                    <div className="w-24 h-24 rounded-full mb-4 overflow-hidden ring-4 ring-white bg-white">
                      <img
                        src={profile.profilePicture}
                        alt={`${profile.name}'s profile picture`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-[#FC4C02] to-[#FF8800] rounded-full flex items-center justify-center mb-4">
                      <span className="text-white font-bold text-4xl">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Name and Pronouns */}
                  <div className="mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                    {profile.pronouns && (
                      <p className="text-gray-400 text-sm mt-0.5">{profile.pronouns}</p>
                    )}
                  </div>

                  {/* Username */}
                  <p className="text-gray-500 mb-3">@{profile.username}</p>

                  {/* Tagline */}
                  {profile.tagline && (
                    <p className="text-gray-600 text-sm mb-3 font-medium">
                      {profile.tagline}
                    </p>
                  )}

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-gray-700 mb-3 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  {/* Location */}
                  {profile.location && (
                    <div className="flex items-center gap-1 text-gray-600 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">{profile.location}</span>
                    </div>
                  )}

                  {/* Website */}
                  {profile.website && (
                    <div className="flex items-center gap-1.5 text-gray-600 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <a
                        href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#007AFF] hover:underline"
                      >
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}

                  {/* Social Links */}
                  {profile.socialLinks && (profile.socialLinks.twitter || profile.socialLinks.github || profile.socialLinks.linkedin) && (
                    <div className="flex items-center gap-3 mb-4">
                      {profile.socialLinks.twitter && (
                        <a
                          href={`https://twitter.com/${profile.socialLinks.twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-[#1DA1F2] transition-colors"
                          title="Twitter"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>
                      )}
                      {profile.socialLinks.github && (
                        <a
                          href={`https://github.com/${profile.socialLinks.github.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          title="GitHub"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                          </svg>
                        </a>
                      )}
                      {profile.socialLinks.linkedin && (
                        <a
                          href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-[#0A66C2] transition-colors"
                          title="LinkedIn"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex gap-8 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Following</div>
                      <div className="text-xl font-bold text-gray-900">
                        {following.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Followers</div>
                      <div className="text-xl font-bold text-gray-900">
                        {followers.length}
                      </div>
                    </div>
                  </div>

                  {/* Follow Button */}
                  <button
                    onClick={async () => {
                      try {
                        if (profile.isFollowing) {
                          await firebaseUserApi.unfollowUser(profile.id);
                          handleProfileUpdate({ ...profile, isFollowing: false });
                        } else {
                          await firebaseUserApi.followUser(profile.id);
                          handleProfileUpdate({ ...profile, isFollowing: true });
                        }
                      } catch (error) {
                        console.error('Follow error:', error);
                      }
                    }}
                    className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                      profile.isFollowing
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-[#007AFF] text-white hover:bg-[#0056D6]'
                    }`}
                  >
                    {profile.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="sticky top-12 md:top-0 bg-white md:bg-gray-50 z-30">
          <div className="bg-gray-50 border-b md:border-b-0 border-gray-200">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
              <div className="flex md:gap-8 md:pl-[220px]">
                <button
                  onClick={() => {
                    setActiveTab('progress');
                    router.push(`/profile/${username}?tab=progress`);
                  }}
                  className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors ${
                    activeTab === 'progress'
                      ? 'border-[#007AFF] text-[#007AFF] md:text-gray-900'
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
                  className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors ${
                    activeTab === 'sessions'
                      ? 'border-[#007AFF] text-[#007AFF] md:text-gray-900'
                      : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                  }`}
                >
                  Sessions
                </button>
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    router.push(`/profile/${username}?tab=profile`);
                  }}
                  className={`flex-1 md:flex-initial py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors ${
                    activeTab === 'profile'
                      ? 'border-[#007AFF] text-[#007AFF] md:text-gray-900'
                      : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                  }`}
                >
                  Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
            {activeTab === 'progress' && (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Last 4 Weeks Summary */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Last 4 Weeks</h2>
                  </div>

                  {/* Main Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Time</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats?.totalHours?.toFixed(1) || 0}h
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sessions</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {sessions.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg/Week</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats?.weeklyHours?.toFixed(1) || 0}h
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg/Day</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats?.totalHours ? (stats.totalHours / 28).toFixed(1) : 0}h
                      </div>
                    </div>
                  </div>

                  {/* Weekly Breakdown Chart */}
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                      >
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={false}
                          width={40}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          formatter={(value: number) => [`${value}h`, 'Hours']}
                        />
                        <Line
                          type="monotone"
                          dataKey="hours"
                          stroke="#FC4C02"
                          strokeWidth={2}
                          isAnimationActive={false}
                          dot={(props: any) => {
                            const { cx, cy, index, payload } = props;
                            const isToday = index === chartData.length - 1;
                            return (
                              <circle
                                key={`dot-${index}-${payload.name}`}
                                cx={cx}
                                cy={cy}
                                r={isToday ? 5 : 0}
                                fill="#FC4C02"
                                stroke="none"
                              />
                            );
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Year Stats and Additional Metrics */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* This Year Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">
                        {new Date().getFullYear()}
                      </h3>
                      <button
                        onClick={() => setTimePeriod('year')}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        View chart
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Total Time</span>
                        <span className="font-semibold text-gray-900">
                          {stats?.totalHours?.toFixed(1) || 0}h
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Sessions</span>
                        <span className="font-semibold text-gray-900">
                          {sessions.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Longest Session</span>
                        <span className="font-semibold text-gray-900">
                          {sessions.length > 0
                            ? formatTime(Math.max(...sessions.map(s => s.duration)))
                            : '0m'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Current Streak</span>
                        <span className="font-semibold text-gray-900">
                          {stats?.currentStreak || 0} days
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* All-Time Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">All-Time</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Total Sessions</span>
                        <span className="font-semibold text-gray-900">
                          {postsCount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Total Time</span>
                        <span className="font-semibold text-gray-900">
                          {stats?.totalHours?.toFixed(1) || 0}h
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Longest Streak</span>
                        <span className="font-semibold text-gray-900">
                          {stats?.longestStreak || stats?.currentStreak || 0} days
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Avg Session</span>
                        <span className="font-semibold text-gray-900">
                          {sessions.length > 0
                            ? formatTime(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length)
                            : '0m'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Time Period Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      {timePeriod === 'day' && 'Last 24 Hours'}
                      {timePeriod === 'week' && 'Last 7 Days'}
                      {timePeriod === 'month' && 'Last 4 Weeks'}
                      {timePeriod === 'year' && 'Last 12 Months'}
                    </h3>
                    <div className="relative">
                      <button
                        onClick={() => setShowTimePeriodDropdown(!showTimePeriodDropdown)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      >
                        {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {showTimePeriodDropdown && (
                        <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                          {(['day', 'week', 'month', 'year'] as TimePeriod[]).map((period) => (
                            <button
                              key={period}
                              onClick={() => {
                                setTimePeriod(period);
                                setShowTimePeriodDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                timePeriod === period ? 'text-[#FC4C02] font-medium' : 'text-gray-700'
                              }`}
                            >
                              {period.charAt(0).toUpperCase() + period.slice(1)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                      >
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={false}
                          width={40}
                          label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px',
                            padding: '8px 12px'
                          }}
                          formatter={(value: number) => [`${value}h`, 'Hours']}
                        />
                        <Line
                          type="monotone"
                          dataKey="hours"
                          stroke="#FC4C02"
                          strokeWidth={2}
                          isAnimationActive={false}
                          dot={false}
                          activeDot={{ r: 4, fill: '#FC4C02' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Sessions Summary */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                    <button
                      onClick={() => {
                        setActiveTab('sessions');
                        router.push(`/profile/${username}?tab=sessions`);
                      }}
                      className="text-sm text-[#FC4C02] hover:text-[#E04402] font-medium"
                    >
                      View all
                    </button>
                  </div>
                  {sessions.length > 0 ? (
                    <div className="space-y-3">
                      {sessions.slice(0, 5).map((session) => (
                        <div key={session.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {session.title || 'Focus Session'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(new Date(session.createdAt))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900 text-sm">
                              {formatTime(session.duration)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {session.tasks?.length || 0} tasks
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No sessions yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="max-w-4xl mx-auto space-y-4">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading sessions...</div>
                ) : sessions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No sessions yet</div>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                      {/* Session Header */}
                      <div className="flex items-center justify-between p-4 pb-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/profile/${username}?tab=profile`}>
                            {profile.profilePicture ? (
                              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white bg-white">
                                <img
                                  src={profile.profilePicture}
                                  alt={`${profile.name}'s profile picture`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white">
                                <span className="text-white font-semibold text-sm">
                                  {profile.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </Link>
                          <div>
                            <div className="font-semibold text-gray-900 text-base">{profile.name}</div>
                            <div className="text-xs text-gray-500">
                              {formatDate(new Date(session.createdAt))}
                            </div>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors p-2">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Session Title and Description */}
                      <div className="px-4 pb-3">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {session.title || 'Focus Session'}
                        </h3>
                        {session.description && (
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {session.description}
                          </p>
                        )}
                      </div>

                      {/* Session Stats - Strava style */}
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Time</div>
                            <div className="text-xl font-bold text-gray-900">
                              {formatTime(session.duration)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Tasks</div>
                            <div className="text-xl font-bold text-gray-900">
                              {session.tasks?.length || 0}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Tags</div>
                            <div className="text-xl font-bold text-gray-900">
                              {session.tags?.length || 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center border-t border-gray-100 px-2">
                        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 hover:bg-gray-50 transition-colors rounded-lg">
                          <Heart className="w-6 h-6" />
                          <span className="text-sm font-medium">
                            {session.supportCount || 0}
                          </span>
                        </button>
                        <div className="w-px h-6 bg-gray-200"></div>
                        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 hover:bg-gray-50 transition-colors rounded-lg">
                          <MessageCircle className="w-6 h-6" />
                          <span className="text-sm font-medium">
                            {session.commentCount || 0}
                          </span>
                        </button>
                        <div className="w-px h-6 bg-gray-200"></div>
                        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 hover:bg-gray-50 transition-colors rounded-lg">
                          <Share2 className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="max-w-4xl mx-auto">
                {/* Profile Header - Only show for own profile */}
                {isOwnProfile && (
                  <UnifiedProfileCard
                    name={profile.name}
                    username={profile.username}
                    profilePicture={profile.profilePicture}
                    bio={profile.bio}
                    tagline={profile.tagline}
                    pronouns={profile.pronouns}
                    location={profile.location}
                    website={profile.website}
                    socialLinks={profile.socialLinks}
                    followersCount={followers.length}
                    followingCount={following.length}
                    isOwnProfile={true}
                    editButtonHref="/settings"
                    className="mb-6"
                  />
                )}

                {/* This Week Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 text-[#FC4C02]">📊</div>
                    <h2 className="text-lg font-bold">This week</h2>
                  </div>

                  <div className="flex gap-6 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Time</div>
                      <div className="text-xl font-bold">
                        {stats?.weeklyHours?.toFixed(1) || 0}h
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Sessions</div>
                      <div className="text-xl font-bold">
                        {stats?.sessionsThisWeek || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Streak</div>
                      <div className="text-xl font-bold">
                        {stats?.currentStreak || 0} days
                      </div>
                    </div>
                  </div>
                </div>

                {/* Followers Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Followers ({followers.length})</h3>
                  </div>
                  {followers.length > 0 ? (
                    <div className="space-y-3">
                      {followers.slice(0, 5).map((follower) => (
                        <Link
                          key={follower.id}
                          href={`/profile/${follower.username}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 bg-[#FC4C02] rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {follower.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{follower.name}</div>
                            <div className="text-sm text-gray-500">@{follower.username}</div>
                          </div>
                        </Link>
                      ))}
                      {followers.length > 5 && (
                        <div className="text-center pt-2">
                          <button className="text-[#007AFF] text-sm font-medium">
                            View all {followers.length} followers
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No followers yet</p>
                    </div>
                  )}
                </div>

                {/* Following Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Following ({following.length})</h3>
                  </div>
                  {following.length > 0 ? (
                    <div className="space-y-3">
                      {following.slice(0, 5).map((followedUser) => (
                        <Link
                          key={followedUser.id}
                          href={`/profile/${followedUser.username}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 bg-[#FC4C02] rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {followedUser.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{followedUser.name}</div>
                            <div className="text-sm text-gray-500">@{followedUser.username}</div>
                          </div>
                        </Link>
                      ))}
                      {following.length > 5 && (
                        <div className="text-center pt-2">
                          <button className="text-[#007AFF] text-sm font-medium">
                            View all {following.length} following
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <UserIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Not following anyone yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <BottomNavigation />
        </div>
      </div>
    </ProtectedRoute>
  );
}
