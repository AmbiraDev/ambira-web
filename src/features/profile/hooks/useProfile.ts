/**
 * Profile Query Hooks - React Query Boundary
 *
 * This is the ONLY place where React Query should be used for profiles.
 * All components should use these hooks instead of direct React Query or firebaseApi calls.
 *
 * Architecture:
 * Components → useProfile hooks (React Query) → ProfileService → Repositories → Firebase
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { ProfileService } from '../services/ProfileService';
import { User } from '@/domain/entities/User';
import { Session } from '@/domain/entities/Session';
import {
  TimePeriod,
  ChartDataPoint,
  ProfileStats,
} from '../domain/ProfileStatsCalculator';
import { STANDARD_CACHE_TIMES } from '@/lib/react-query';

// Singleton service instance
const profileService = new ProfileService();

// ==================== CACHE KEYS ====================

export const PROFILE_KEYS = {
  all: () => ['profile'] as const,
  details: () => [...PROFILE_KEYS.all(), 'detail'] as const,
  detail: (userId: string) => [...PROFILE_KEYS.details(), userId] as const,
  byUsername: (username: string) =>
    [...PROFILE_KEYS.all(), 'username', username] as const,
  sessions: (userId: string, limit?: number) =>
    [...PROFILE_KEYS.detail(userId), 'sessions', limit] as const,
  stats: (userId: string) => [...PROFILE_KEYS.detail(userId), 'stats'] as const,
  chartData: (userId: string, period: TimePeriod, activityId?: string) =>
    [...PROFILE_KEYS.detail(userId), 'chart', period, activityId] as const,
  topActivities: (userId: string, limit?: number) =>
    [...PROFILE_KEYS.detail(userId), 'topActivities', limit] as const,
  followers: (userId: string) =>
    [...PROFILE_KEYS.detail(userId), 'followers'] as const,
  following: (userId: string) =>
    [...PROFILE_KEYS.detail(userId), 'following'] as const,
  isFollowing: (currentUserId: string, targetUserId: string) =>
    [
      ...PROFILE_KEYS.all(),
      'isFollowing',
      currentUserId,
      targetUserId,
    ] as const,
};

// ==================== QUERY HOOKS ====================

/**
 * Get user profile by ID
 *
 * @example
 * const { data: profile, isLoading, error } = useProfileById(userId);
 */
export function useProfileById(
  userId: string,
  options?: Partial<UseQueryOptions<User | null, Error>>
) {
  return useQuery<User | null, Error>({
    queryKey: PROFILE_KEYS.detail(userId),
    queryFn: () => profileService.getProfileById(userId),
    staleTime: STANDARD_CACHE_TIMES.LONG, // 15 minutes
    enabled: !!userId,
    ...options,
  });
}

/**
 * Get user profile by username
 *
 * Useful for profile pages using username in URL.
 *
 * @example
 * const { data: profile, isLoading, error } = useProfileByUsername('john_doe');
 */
export function useProfileByUsername(
  username: string,
  options?: Partial<UseQueryOptions<User | null, Error>>
) {
  return useQuery<User | null, Error>({
    queryKey: PROFILE_KEYS.byUsername(username),
    queryFn: async () => {
      try {
        return await profileService.getProfileByUsername(username);
      } catch (error: unknown) {
        // Return null for not found/permission errors instead of throwing
        if (
          error?.message?.includes('not found') ||
          error?.message?.includes('private')
        ) {
          return null;
        }
        throw error;
      }
    },
    staleTime: STANDARD_CACHE_TIMES.LONG, // 15 minutes
    retry: false, // Don't retry on permission/not found errors
    enabled: !!username,
    ...options,
  });
}

/**
 * Get user's sessions
 *
 * @example
 * const { data: sessions, isLoading } = useUserSessions(userId, 50);
 */
export function useUserSessions(
  userId: string,
  limit: number = 50,
  options?: Partial<UseQueryOptions<Session[], Error>>
) {
  return useQuery<Session[], Error>({
    queryKey: PROFILE_KEYS.sessions(userId, limit),
    queryFn: () => profileService.getUserSessions(userId, limit),
    staleTime: STANDARD_CACHE_TIMES.MEDIUM, // 5 minutes
    enabled: !!userId,
    ...options,
  });
}

/**
 * Get profile statistics
 *
 * Includes total time, session count, streak info, etc.
 *
 * @example
 * const { data: stats } = useProfileStats(userId);
 */
export function useProfileStats(
  userId: string,
  options?: Partial<UseQueryOptions<ProfileStats, Error>>
) {
  return useQuery<ProfileStats, Error>({
    queryKey: PROFILE_KEYS.stats(userId),
    queryFn: () => profileService.getProfileStats(userId),
    staleTime: STANDARD_CACHE_TIMES.VERY_LONG, // 1 hour - stats change slowly
    enabled: !!userId,
    ...options,
  });
}

/**
 * Get chart data for profile analytics
 *
 * Returns data points for charting over a time period.
 *
 * @example
 * const { data: chartData } = useProfileChartData(userId, 'week', 'all');
 */
export function useProfileChartData(
  userId: string,
  period: TimePeriod,
  activityId: string = 'all',
  options?: Partial<UseQueryOptions<ChartDataPoint[], Error>>
) {
  return useQuery<ChartDataPoint[], Error>({
    queryKey: PROFILE_KEYS.chartData(userId, period, activityId),
    queryFn: () => profileService.getChartData(userId, period, activityId),
    staleTime: STANDARD_CACHE_TIMES.LONG, // 15 minutes
    enabled: !!userId,
    ...options,
  });
}

/**
 * Get top activities for a user
 *
 * Returns the most logged activities by time spent.
 *
 * @example
 * const { data: topActivities } = useTopActivities(userId, 5);
 */
export function useTopActivities(
  userId: string,
  limit: number = 5,
  options?: Partial<
    UseQueryOptions<
      Array<{ id: string; hours: number; sessions: number }>,
      Error
    >
  >
) {
  return useQuery<
    Array<{ id: string; hours: number; sessions: number }>,
    Error
  >({
    queryKey: PROFILE_KEYS.topActivities(userId, limit),
    queryFn: () => profileService.getTopActivities(userId, limit),
    staleTime: STANDARD_CACHE_TIMES.LONG, // 15 minutes
    enabled: !!userId,
    ...options,
  });
}

/**
 * Get user's followers
 *
 * @example
 * const { data: followerIds } = useFollowers(userId);
 */
export function useFollowers(
  userId: string,
  options?: Partial<UseQueryOptions<string[], Error>>
) {
  return useQuery<string[], Error>({
    queryKey: PROFILE_KEYS.followers(userId),
    queryFn: async () => {
      try {
        return await profileService.getFollowers(userId);
      } catch (_error) {
        // Return empty array on permission errors
        return [];
      }
    },
    staleTime: STANDARD_CACHE_TIMES.LONG, // 15 minutes
    retry: false, // Don't retry on permission errors
    enabled: !!userId,
    ...options,
  });
}

/**
 * Get users that a user is following
 *
 * @example
 * const { data: followingIds } = useFollowing(userId);
 */
export function useFollowing(
  userId: string,
  options?: Partial<UseQueryOptions<string[], Error>>
) {
  return useQuery<string[], Error>({
    queryKey: PROFILE_KEYS.following(userId),
    queryFn: async () => {
      try {
        return await profileService.getFollowing(userId);
      } catch (_error) {
        // Return empty array on permission errors
        return [];
      }
    },
    staleTime: STANDARD_CACHE_TIMES.LONG, // 15 minutes
    retry: false, // Don't retry on permission errors
    enabled: !!userId,
    ...options,
  });
}

/**
 * Check if current user follows target user
 *
 * @example
 * const { data: isFollowing } = useIsFollowing(currentUserId, targetUserId);
 */
export function useIsFollowing(
  currentUserId: string,
  targetUserId: string,
  options?: Partial<UseQueryOptions<boolean, Error>>
) {
  return useQuery<boolean, Error>({
    queryKey: PROFILE_KEYS.isFollowing(currentUserId, targetUserId),
    queryFn: () => profileService.isFollowing(currentUserId, targetUserId),
    staleTime: STANDARD_CACHE_TIMES.MEDIUM, // 5 minutes
    enabled:
      !!currentUserId && !!targetUserId && currentUserId !== targetUserId,
    ...options,
  });
}

/**
 * Check if profile can be viewed by current user
 *
 * Handles privacy settings (everyone, followers, private).
 *
 * @example
 * const { data: canView } = useCanViewProfile(profileUser, viewerId);
 */
export function useCanViewProfile(
  profileUser: User | null,
  viewerId: string | null,
  options?: Partial<UseQueryOptions<boolean, Error>>
) {
  return useQuery<boolean, Error>({
    queryKey: [
      ...PROFILE_KEYS.detail(profileUser?.id || ''),
      'canView',
      viewerId,
    ],
    queryFn: () => {
      if (!profileUser) return false;
      return profileService.canViewProfile(profileUser, viewerId);
    },
    staleTime: STANDARD_CACHE_TIMES.MEDIUM, // 5 minutes
    enabled: !!profileUser,
    ...options,
  });
}
