/**
 * Challenge Mutation Hooks - React Query Boundary
 */

import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
import { ChallengeService } from '../services/ChallengeService';
import { CHALLENGE_KEYS } from './useChallenges';
import { Challenge, CreateChallengeData, UpdateChallengeData } from '@/types';

const challengeService = new ChallengeService();

export function useCreateChallenge(
  options?: Partial<UseMutationOptions<Challenge, Error, CreateChallengeData>>
) {
  const queryClient = useQueryClient();
  return useMutation<Challenge, Error, CreateChallengeData>({
    mutationFn: data => challengeService.createChallenge(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHALLENGE_KEYS.lists() });
    },
    ...options,
  });
}

export function useUpdateChallenge(
  options?: Partial<
    UseMutationOptions<
      Challenge,
      Error,
      { challengeId: string; data: UpdateChallengeData }
    >
  >
) {
  const queryClient = useQueryClient();
  return useMutation<
    Challenge,
    Error,
    { challengeId: string; data: UpdateChallengeData }
  >({
    mutationFn: ({ challengeId, data }) =>
      challengeService.updateChallenge(challengeId, data),
    onSuccess: (_, { challengeId }) => {
      queryClient.invalidateQueries({
        queryKey: CHALLENGE_KEYS.detail(challengeId),
      });
      queryClient.invalidateQueries({ queryKey: CHALLENGE_KEYS.lists() });
    },
    ...options,
  });
}

export function useDeleteChallenge(
  options?: Partial<UseMutationOptions<void, Error, string>>
) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: challengeId => challengeService.deleteChallenge(challengeId),
    onSuccess: (_, challengeId) => {
      queryClient.invalidateQueries({ queryKey: CHALLENGE_KEYS.lists() });
      queryClient.removeQueries({
        queryKey: CHALLENGE_KEYS.detail(challengeId),
      });
    },
    ...options,
  });
}

export function useJoinChallenge(
  options?: Partial<UseMutationOptions<void, Error, string>>
) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: challengeId => challengeService.joinChallenge(challengeId),
    onSuccess: (_, challengeId) => {
      queryClient.invalidateQueries({
        queryKey: CHALLENGE_KEYS.detail(challengeId),
      });
      queryClient.invalidateQueries({
        queryKey: CHALLENGE_KEYS.leaderboard(challengeId),
      });
      queryClient.invalidateQueries({
        queryKey: CHALLENGE_KEYS.stats(challengeId),
      });
    },
    ...options,
  });
}

export function useLeaveChallenge(
  options?: Partial<UseMutationOptions<void, Error, string>>
) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: challengeId => challengeService.leaveChallenge(challengeId),
    onSuccess: (_, challengeId) => {
      queryClient.invalidateQueries({
        queryKey: CHALLENGE_KEYS.detail(challengeId),
      });
      queryClient.invalidateQueries({
        queryKey: CHALLENGE_KEYS.leaderboard(challengeId),
      });
      queryClient.invalidateQueries({
        queryKey: CHALLENGE_KEYS.stats(challengeId),
      });
    },
    ...options,
  });
}

export function useInvalidateChallenge() {
  const queryClient = useQueryClient();
  return (challengeId: string) => {
    queryClient.invalidateQueries({
      queryKey: CHALLENGE_KEYS.detail(challengeId),
    });
  };
}

export function useInvalidateAllChallenges() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: CHALLENGE_KEYS.all() });
  };
}
