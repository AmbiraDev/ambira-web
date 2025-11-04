/**
 * Streak Query Hooks - React Query Boundary
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { StreakService } from '../services/StreakService';
import { StreakData, StreakStats } from '@/types';
import { STANDARD_CACHE_TIMES } from '@/lib/react-query';

const streakService = new StreakService();

export const STREAK_KEYS = {
  all: () => ['streaks'] as const,
  data: (userId: string) => [...STREAK_KEYS.all(), 'data', userId] as const,
  stats: (userId: string) => [...STREAK_KEYS.all(), 'stats', userId] as const,
};

export function useStreakData(
  userId: string,
  options?: Partial<UseQueryOptions<StreakData | null, Error>>
) {
  return useQuery<StreakData | null, Error>({
    queryKey: STREAK_KEYS.data(userId),
    queryFn: () => streakService.getStreakData(userId),
    staleTime: STANDARD_CACHE_TIMES.MEDIUM,
    enabled: !!userId,
    ...options,
  });
}

export function useStreakStats(
  userId: string,
  options?: Partial<UseQueryOptions<StreakStats | null, Error>>
) {
  return useQuery<StreakStats | null, Error>({
    queryKey: STREAK_KEYS.stats(userId),
    queryFn: () => streakService.getStreakStats(userId),
    staleTime: STANDARD_CACHE_TIMES.MEDIUM,
    enabled: !!userId,
    ...options,
  });
}
