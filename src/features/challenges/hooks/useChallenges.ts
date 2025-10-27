/**
 * Challenge Query Hooks - React Query Boundary
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { ChallengeService } from '../services/ChallengeService';
import { Challenge, ChallengeFilters, ChallengeLeaderboard, ChallengeProgress, ChallengeStats } from '@/types';
import { STANDARD_CACHE_TIMES } from '@/lib/react-query';

const challengeService = new ChallengeService();

export const CHALLENGE_KEYS = {
  all: () => ['challenges'] as const,
  lists: () => [...CHALLENGE_KEYS.all(), 'list'] as const,
  list: (filters?: ChallengeFilters) => [...CHALLENGE_KEYS.lists(), filters] as const,
  details: () => [...CHALLENGE_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...CHALLENGE_KEYS.details(), id] as const,
  leaderboard: (id: string) => [...CHALLENGE_KEYS.detail(id), 'leaderboard'] as const,
  progress: (challengeId: string, userId: string) => [...CHALLENGE_KEYS.detail(challengeId), 'progress', userId] as const,
  stats: (id: string) => [...CHALLENGE_KEYS.detail(id), 'stats'] as const,
};

export function useChallenges(filters?: ChallengeFilters, options?: Partial<UseQueryOptions<Challenge[], Error>>) {
  return useQuery<Challenge[], Error>({
    queryKey: CHALLENGE_KEYS.list(filters),
    queryFn: () => challengeService.getChallenges(filters),
    staleTime: STANDARD_CACHE_TIMES.MEDIUM,
    ...options,
  });
}

export function useChallenge(challengeId: string, options?: Partial<UseQueryOptions<Challenge | null, Error>>) {
  return useQuery<Challenge | null, Error>({
    queryKey: CHALLENGE_KEYS.detail(challengeId),
    queryFn: () => challengeService.getChallenge(challengeId),
    staleTime: STANDARD_CACHE_TIMES.MEDIUM,
    enabled: !!challengeId,
    ...options,
  });
}

export function useChallengeLeaderboard(challengeId: string, options?: Partial<UseQueryOptions<ChallengeLeaderboard | null, Error>>) {
  return useQuery<ChallengeLeaderboard | null, Error>({
    queryKey: CHALLENGE_KEYS.leaderboard(challengeId),
    queryFn: () => challengeService.getChallengeLeaderboard(challengeId),
    staleTime: STANDARD_CACHE_TIMES.SHORT,
    enabled: !!challengeId,
    ...options,
  });
}

export function useChallengeProgress(challengeId: string, userId: string, options?: Partial<UseQueryOptions<ChallengeProgress | null, Error>>) {
  return useQuery<ChallengeProgress | null, Error>({
    queryKey: CHALLENGE_KEYS.progress(challengeId, userId),
    queryFn: () => challengeService.getChallengeProgress(challengeId, userId),
    staleTime: STANDARD_CACHE_TIMES.SHORT,
    enabled: !!challengeId && !!userId,
    ...options,
  });
}

export function useChallengeStats(challengeId: string, options?: Partial<UseQueryOptions<ChallengeStats | null, Error>>) {
  return useQuery<ChallengeStats | null, Error>({
    queryKey: CHALLENGE_KEYS.stats(challengeId),
    queryFn: () => challengeService.getChallengeStats(challengeId),
    staleTime: STANDARD_CACHE_TIMES.MEDIUM,
    enabled: !!challengeId,
    ...options,
  });
}
