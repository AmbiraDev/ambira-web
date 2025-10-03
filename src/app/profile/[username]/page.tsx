'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { UserProfile, UserStats, ProfileTab } from '@/types';
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
import { UserX } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = currentUser?.username === username;

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const profileData = await firebaseUserApi.getUserProfile(username);
      setProfile(profileData);
      
      // Load stats after we have the profile
      const statsData = await firebaseUserApi.getUserStats(profileData.id);
      setStats(statsData);

      // Load posts count (sessions count since sessions = posts)
      const sessionsCount = await firebaseSessionApi.getUserSessionsCount(profileData.id, isOwnProfile);
      setPostsCount(sessionsCount);
      console.log(`Posts count for ${username}: ${sessionsCount}`);
    } catch (error: any) {
      console.error('Profile load error:', error);
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
            {!['User not found', 'This profile is private', 'This profile is only visible to followers'].includes(error) && 'Error Loading Profile'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {error === 'User not found' && `The user "${username}" doesn't exist.`}
            {error === 'This profile is private' && `@${username}'s profile is private. Only they can view their profile.`}
            {error === 'This profile is only visible to followers' && `@${username}'s profile is only visible to people they follow back.`}
            {!['User not found', 'This profile is private', 'This profile is only visible to followers'].includes(error) && 'Something went wrong while loading this profile.'}
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
    followers: profile.followersCount || 0,
    following: profile.followingCount || 0,
    posts: postsCount,
  };
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="hidden md:block">
          <Header />
        </div>
        <MobileHeader title="Profile" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <ProfileHeader
            profile={profile}
            onProfileUpdate={handleProfileUpdate}
            showEditButton={isOwnProfile}
            onEditClick={() => window.location.href = '/settings'}
          />

          {/* Profile Tabs */}
          <ProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            stats={tabStats}
            showPrivateContent={isOwnProfile}
            userId={profile.id}
          />

          {/* Tab Content */}
          <div className="bg-card-background rounded-lg border border-border">
            <TabContent>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <OverviewContent stats={stats || undefined} />
                  {stats && (
                    <ProfileStats userId={profile.id} isOwnProfile={isOwnProfile} />
                  )}
                </div>
              )}
              
              {activeTab === 'achievements' && <AchievementsContent />}
              {activeTab === 'followers' && <FollowersContent userId={profile.id} />}
              {activeTab === 'following' && <FollowingContent userId={profile.id} />}
              {activeTab === 'posts' && <PostsContent userId={profile.id} isOwnProfile={isOwnProfile} />}
            </TabContent>
          </div>
        </div>
        </div>

        {/* Bottom padding for mobile navigation */}
        <div className="h-20 md:hidden" />

        <BottomNavigation />
      </div>
    </ProtectedRoute>
  );
}
