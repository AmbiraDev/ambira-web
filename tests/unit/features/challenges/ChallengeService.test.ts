/**
 * ChallengeService Unit Tests
 *
 * Tests challenge retrieval, leaderboards, progress, and statistics
 */

import { ChallengeService } from '@/features/challenges/services/ChallengeService';
import { firebaseApi } from '@/lib/api';
import {
  Challenge,
  ChallengeLeaderboard,
  ChallengeProgress,
  ChallengeStats,
} from '@/types';

jest.mock('@/lib/api');

describe('ChallengeService', () => {
  let challengeService: ChallengeService;

  const mockChallenge: Challenge = {
    id: 'challenge-1',
    title: 'Most Active',
    type: 'most-activity',
    description: 'Complete 10 sessions',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    groupId: null,
    participantCount: 100,
    createdAt: new Date('2024-01-01'),
  };

  const mockLeaderboard: ChallengeLeaderboard = {
    challengeId: 'challenge-1',
    entries: [
      {
        rank: 1,
        userId: 'user-1',
        displayName: 'User 1',
        score: 1000,
      },
      {
        rank: 2,
        userId: 'user-2',
        displayName: 'User 2',
        score: 900,
      },
    ],
  };

  const mockProgress: ChallengeProgress = {
    challengeId: 'challenge-1',
    userId: 'user-1',
    currentScore: 1000,
    targetScore: 1000,
    percentComplete: 100,
    status: 'completed',
  };

  const mockStats: ChallengeStats = {
    challengeId: 'challenge-1',
    totalParticipants: 100,
    completedParticipants: 50,
    avgScore: 750,
    highestScore: 1000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    challengeService = new ChallengeService();
  });

  describe('getChallenges', () => {
    it('should get all challenges', async () => {
      // ARRANGE
      const mockChallenges = [
        mockChallenge,
        { ...mockChallenge, id: 'challenge-2', title: 'Fastest' },
      ];

      (firebaseApi.challenge.getChallenges as jest.Mock).mockResolvedValue(
        mockChallenges
      );

      // ACT
      const result = await challengeService.getChallenges();

      // ASSERT
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Most Active');
      expect(firebaseApi.challenge.getChallenges).toHaveBeenCalled();
    });

    it('should get challenges with filters', async () => {
      // ARRANGE
      const filters = { type: 'most-activity' as const };
      const mockChallenges = [mockChallenge];

      (firebaseApi.challenge.getChallenges as jest.Mock).mockResolvedValue(
        mockChallenges
      );

      // ACT
      const result = await challengeService.getChallenges(filters);

      // ASSERT
      expect(result).toHaveLength(1);
      expect(firebaseApi.challenge.getChallenges).toHaveBeenCalledWith(filters);
    });

    it('should return empty array on error', async () => {
      // ARRANGE
      (firebaseApi.challenge.getChallenges as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      // ACT
      const result = await challengeService.getChallenges();

      // ASSERT
      expect(result).toEqual([]);
    });
  });

  describe('getChallenge', () => {
    it('should get challenge by ID', async () => {
      // ARRANGE
      (firebaseApi.challenge.getChallenge as jest.Mock).mockResolvedValue(
        mockChallenge
      );

      // ACT
      const result = await challengeService.getChallenge('challenge-1');

      // ASSERT
      expect(result).toEqual(mockChallenge);
      expect(firebaseApi.challenge.getChallenge).toHaveBeenCalledWith(
        'challenge-1'
      );
    });

    it('should return null if challenge not found', async () => {
      // ARRANGE
      (firebaseApi.challenge.getChallenge as jest.Mock).mockResolvedValue(null);

      // ACT
      const result = await challengeService.getChallenge('nonexistent');

      // ASSERT
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // ARRANGE
      (firebaseApi.challenge.getChallenge as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      // ACT
      const result = await challengeService.getChallenge('challenge-1');

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe('getChallengeLeaderboard', () => {
    it('should get challenge leaderboard', async () => {
      // ARRANGE
      (
        firebaseApi.challenge.getChallengeLeaderboard as jest.Mock
      ).mockResolvedValue(mockLeaderboard);

      // ACT
      const result =
        await challengeService.getChallengeLeaderboard('challenge-1');

      // ASSERT
      expect(result).toEqual(mockLeaderboard);
      expect(result?.entries).toHaveLength(2);
      expect(result?.entries[0].rank).toBe(1);
    });

    it('should return null if leaderboard not found', async () => {
      // ARRANGE
      (
        firebaseApi.challenge.getChallengeLeaderboard as jest.Mock
      ).mockResolvedValue(null);

      // ACT
      const result =
        await challengeService.getChallengeLeaderboard('nonexistent');

      // ASSERT
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // ARRANGE
      (
        firebaseApi.challenge.getChallengeLeaderboard as jest.Mock
      ).mockRejectedValue(new Error('API Error'));

      // ACT
      const result =
        await challengeService.getChallengeLeaderboard('challenge-1');

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe('getChallengeProgress', () => {
    it('should get user challenge progress', async () => {
      // ARRANGE
      (
        firebaseApi.challenge.getChallengeProgress as jest.Mock
      ).mockResolvedValue(mockProgress);

      // ACT
      const result = await challengeService.getChallengeProgress(
        'challenge-1',
        'user-1'
      );

      // ASSERT
      expect(result).toEqual(mockProgress);
      expect(result?.percentComplete).toBe(100);
      expect(result?.status).toBe('completed');
    });

    it('should return null if progress not found', async () => {
      // ARRANGE
      (
        firebaseApi.challenge.getChallengeProgress as jest.Mock
      ).mockResolvedValue(null);

      // ACT
      const result = await challengeService.getChallengeProgress(
        'challenge-1',
        'user-1'
      );

      // ASSERT
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // ARRANGE
      (
        firebaseApi.challenge.getChallengeProgress as jest.Mock
      ).mockRejectedValue(new Error('API Error'));

      // ACT
      const result = await challengeService.getChallengeProgress(
        'challenge-1',
        'user-1'
      );

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe('getChallengeStats', () => {
    it('should get challenge statistics', async () => {
      // ARRANGE
      (firebaseApi.challenge.getChallengeStats as jest.Mock).mockResolvedValue(
        mockStats
      );

      // ACT
      const result = await challengeService.getChallengeStats('challenge-1');

      // ASSERT
      expect(result).toEqual(mockStats);
      expect(result?.totalParticipants).toBe(100);
      expect(result?.completedParticipants).toBe(50);
    });

    it('should return null if stats not found', async () => {
      // ARRANGE
      (firebaseApi.challenge.getChallengeStats as jest.Mock).mockResolvedValue(
        null
      );

      // ACT
      const result = await challengeService.getChallengeStats('challenge-1');

      // ASSERT
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // ARRANGE
      (firebaseApi.challenge.getChallengeStats as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      // ACT
      const result = await challengeService.getChallengeStats('challenge-1');

      // ASSERT
      expect(result).toBeNull();
    });
  });
});
