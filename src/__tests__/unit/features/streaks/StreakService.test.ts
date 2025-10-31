/**
 * StreakService Unit Tests
 *
 * Tests streak data retrieval and visibility management
 */

import { StreakService } from '@/features/streaks/services/StreakService';
import { firebaseApi } from '@/lib/api';
import { StreakData, StreakStats } from '@/types';

jest.mock('@/lib/api');

describe('StreakService', () => {
  let streakService: StreakService;

  const mockStreakData: StreakData = {
    userId: 'user-1',
    currentStreak: 7,
    longestStreak: 30,
    lastActivityDate: new Date('2024-01-10'),
    totalStreakDays: 45,
    streakHistory: [],
    isPublic: true,
  };

  const mockStreakStats: StreakStats = {
    currentStreak: 7,
    longestStreak: 30,
    totalStreakDays: 45,
    lastActivityDate: new Date('2024-01-10'),
    streakAtRisk: false,
    nextMilestone: 30,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    streakService = new StreakService();
  });

  describe('getStreakData', () => {
    it('should get streak data for user', async () => {
      // ARRANGE
      (firebaseApi.streak.getStreakData as jest.Mock).mockResolvedValue(
        mockStreakData
      );

      // ACT
      const result = await streakService.getStreakData('user-1');

      // ASSERT
      expect(result).toEqual(mockStreakData);
      expect(result?.currentStreak).toBe(7);
      expect(firebaseApi.streak.getStreakData).toHaveBeenCalledWith('user-1');
    });

    it('should return null if user has no streak', async () => {
      // ARRANGE
      (firebaseApi.streak.getStreakData as jest.Mock).mockResolvedValue(null);

      // ACT
      const result = await streakService.getStreakData('user-2');

      // ASSERT
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // ARRANGE
      (firebaseApi.streak.getStreakData as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      // ACT
      const result = await streakService.getStreakData('user-1');

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe('getStreakStats', () => {
    it('should get streak statistics', async () => {
      // ARRANGE
      (firebaseApi.streak.getStreakStats as jest.Mock).mockResolvedValue(
        mockStreakStats
      );

      // ACT
      const result = await streakService.getStreakStats('user-1');

      // ASSERT
      expect(result).toEqual(mockStreakStats);
      expect(result?.longestStreak).toBe(30);
      expect(firebaseApi.streak.getStreakStats).toHaveBeenCalledWith('user-1');
    });

    it('should return null if stats not found', async () => {
      // ARRANGE
      (firebaseApi.streak.getStreakStats as jest.Mock).mockResolvedValue(null);

      // ACT
      const result = await streakService.getStreakStats('user-1');

      // ASSERT
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // ARRANGE
      (firebaseApi.streak.getStreakStats as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      // ACT
      const result = await streakService.getStreakStats('user-1');

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe('updateStreakVisibility', () => {
    it('should update streak to public', async () => {
      // ARRANGE
      (
        firebaseApi.streak.updateStreakVisibility as jest.Mock
      ).mockResolvedValue(undefined);

      // ACT
      await streakService.updateStreakVisibility('user-1', true);

      // ASSERT
      expect(firebaseApi.streak.updateStreakVisibility).toHaveBeenCalledWith(
        'user-1',
        true
      );
    });

    it('should update streak to private', async () => {
      // ARRANGE
      (
        firebaseApi.streak.updateStreakVisibility as jest.Mock
      ).mockResolvedValue(undefined);

      // ACT
      await streakService.updateStreakVisibility('user-1', false);

      // ASSERT
      expect(firebaseApi.streak.updateStreakVisibility).toHaveBeenCalledWith(
        'user-1',
        false
      );
    });

    it('should propagate API errors', async () => {
      // ARRANGE
      (
        firebaseApi.streak.updateStreakVisibility as jest.Mock
      ).mockRejectedValue(new Error('Update failed'));

      // ACT & ASSERT
      await expect(
        streakService.updateStreakVisibility('user-1', true)
      ).rejects.toThrow('Update failed');
    });
  });
});
