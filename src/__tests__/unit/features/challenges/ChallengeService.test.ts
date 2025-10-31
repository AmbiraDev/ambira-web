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
    name: 'Most Active',
    type: 'most-activity',
    description: 'Complete 10 sessions',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    groupId: undefined,
    participantCount: 100,
    createdByUserId: 'admin-1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockLeaderboard: ChallengeLeaderboard = {
    challengeId: 'challenge-1',
    entries: [
      {
        rank: 1,
        userId: 'user-1',
        user: {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          username: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        progress: 1000,
        isCompleted: true,
      },
      {
        rank: 2,
        userId: 'user-2',
        user: {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User 2',
          username: 'user2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        progress: 900,
        isCompleted: false,
      },
    ],
    lastUpdated: new Date(),
  };

  const mockProgress: ChallengeProgress = {
    challengeId: 'challenge-1',
    userId: 'user-1',
    currentValue: 1000,
    targetValue: 1000,
    percentage: 100,
    rank: 1,
    isCompleted: true,
    lastUpdated: new Date(),
  };

  const mockStats: ChallengeStats = {
    totalParticipants: 100,
    completedParticipants: 50,
    averageProgress: 750,
    topPerformers: [],
    timeRemaining: 86400,
    daysRemaining: 1,
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
        { ...mockChallenge, id: 'challenge-2', name: 'Fastest' },
      ];

      (firebaseApi.challenge.getChallenges as jest.Mock).mockResolvedValue(
        mockChallenges
      );

      // ACT
      const result = await challengeService.getChallenges();

      // ASSERT
      expect(result).toHaveLength(2);
      expect(result[0]).toBeDefined();
      expect(result[0]?.name).toBe('Most Active');
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

      // ASSERT - Service returns null on error
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
      expect(result?.entries[0]).toBeDefined();
      expect(result?.entries[0]?.rank).toBe(1);
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
      expect(result?.percentage).toBe(100);
      expect(result?.isCompleted).toBe(true);
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
