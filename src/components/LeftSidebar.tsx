'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { firebaseApi } from '@/lib/api';
import { UserProfile, UserStats } from '@/types';
import { WeekStreakCalendar } from './WeekStreakCalendar';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import DailyGoals from './DailyGoals';
import { StreakCard } from './StreakCard';

function LeftSidebar() {
  const { user } = useAuth();
  const [_profile, setProfile] = useState<UserProfile | null>(null);
  const [_stats, setStats] = useState<UserStats | null>(null);
  const [_isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (user?.username) {
        try {
          setIsLoading(true);
          const [profileData, statsData] = await Promise.all([
            firebaseApi.user.getUserProfile(user.username),
            firebaseApi.user.getUserStats(user.id),
          ]);
          setProfile(profileData);
          setStats(statsData);
        } catch (error) {
          console.error('Failed to load user data:', error);
          // Set default values if user data doesn't exist yet
          setProfile({
            id: user.id,
            username: user.username,
            name: user.name,
            bio: '',
            location: '',
            profilePicture: undefined,
            followersCount: 0,
            followingCount: 0,
            totalHours: 0,
            isFollowing: false,
            isPrivate: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          setStats({
            totalHours: 0,
            weeklyHours: 0,
            monthlyHours: 0,
            sessionsThisWeek: 0,
            sessionsThisMonth: 0,
            currentStreak: 0,
            longestStreak: 0,
            averageSessionDuration: 0,
            mostProductiveHour: 14,
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUserData();
  }, [user]);
  return (
    <aside
      className="hidden lg:block w-[340px] flex-shrink-0"
      aria-label="User sidebar"
    >
      <div className="space-y-4 h-full overflow-y-auto scrollbar-hide pt-12 pb-6">
        {/* Streak Card */}
        {user && (
          <StreakCard userId={user.id} variant="compact" showProgress={false} />
        )}

        {/* Daily Goals */}
        <DailyGoals />
      </div>
    </aside>
  );
}

export default LeftSidebar;
