/**
 * LeaderboardCalculator Unit Tests
 *
 * Pure unit tests for domain logic - no dependencies on infrastructure.
 * Fast, deterministic, and easy to maintain.
 */

import { LeaderboardCalculator } from '../LeaderboardCalculator';
import { User } from '@/domain/entities/User';
import { Session } from '@/domain/entities/Session';

describe('LeaderboardCalculator', () => {
  let calculator: LeaderboardCalculator;

  beforeEach(() => {
    calculator = new LeaderboardCalculator();
  });

  describe('calculate', () => {
    it('should calculate leaderboard correctly with multiple users', () => {
      // Arrange
      const users = [
        new User('user1', 'alice', 'Alice', 'alice@example.com', new Date()),
        new User('user2', 'bob', 'Bob', 'bob@example.com', new Date())
      ];

      const sessions = [
        new Session('s1', 'user1', 'proj1', null, 3600, new Date()), // Alice: 1 hour
        new Session('s2', 'user2', 'proj1', null, 7200, new Date()), // Bob: 2 hours
        new Session('s3', 'user1', 'proj1', null, 1800, new Date())  // Alice: 0.5 hour
      ];

      // Act
      const leaderboard = calculator.calculate(users, sessions, 'week');

      // Assert
      expect(leaderboard).toHaveLength(2);

      // Bob should be first (2 hours)
      expect(leaderboard[0].user.name).toBe('Bob');
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[0].totalHours).toBe(2);
      expect(leaderboard[0].sessionCount).toBe(1);

      // Alice should be second (1.5 hours)
      expect(leaderboard[1].user.name).toBe('Alice');
      expect(leaderboard[1].rank).toBe(2);
      expect(leaderboard[1].totalHours).toBe(1.5);
      expect(leaderboard[1].sessionCount).toBe(2);
    });

    it('should handle users with no sessions', () => {
      // Arrange
      const users = [
        new User('user1', 'alice', 'Alice', 'alice@example.com', new Date()),
        new User('user2', 'bob', 'Bob', 'bob@example.com', new Date())
      ];

      const sessions: Session[] = [];

      // Act
      const leaderboard = calculator.calculate(users, sessions, 'week');

      // Assert
      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].totalHours).toBe(0);
      expect(leaderboard[0].sessionCount).toBe(0);
      expect(leaderboard[1].totalHours).toBe(0);
      expect(leaderboard[1].sessionCount).toBe(0);
    });

    it('should sort by session count when hours are equal', () => {
      // Arrange
      const users = [
        new User('user1', 'alice', 'Alice', 'alice@example.com', new Date()),
        new User('user2', 'bob', 'Bob', 'bob@example.com', new Date())
      ];

      const sessions = [
        new Session('s1', 'user1', 'proj1', null, 1800, new Date()), // Alice: 0.5h
        new Session('s2', 'user1', 'proj1', null, 1800, new Date()), // Alice: 0.5h (total 1h, 2 sessions)
        new Session('s3', 'user2', 'proj1', null, 3600, new Date())  // Bob: 1h (1 session)
      ];

      // Act
      const leaderboard = calculator.calculate(users, sessions, 'week');

      // Assert
      // Both have 1 hour, but Alice has 2 sessions vs Bob's 1
      expect(leaderboard[0].user.name).toBe('Alice');
      expect(leaderboard[0].sessionCount).toBe(2);
      expect(leaderboard[1].user.name).toBe('Bob');
      expect(leaderboard[1].sessionCount).toBe(1);
    });

    it('should filter sessions by time period (today)', () => {
      // Arrange
      const users = [
        new User('user1', 'alice', 'Alice', 'alice@example.com', new Date())
      ];

      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const sessions = [
        new Session('s1', 'user1', 'proj1', null, 3600, now),       // Today
        new Session('s2', 'user1', 'proj1', null, 3600, yesterday)  // Yesterday
      ];

      // Act
      const leaderboard = calculator.calculate(users, sessions, 'today');

      // Assert
      expect(leaderboard[0].totalHours).toBe(1); // Only today's session
      expect(leaderboard[0].sessionCount).toBe(1);
    });

    it('should filter sessions by time period (week)', () => {
      // Arrange
      const users = [
        new User('user1', 'alice', 'Alice', 'alice@example.com', new Date())
      ];

      const now = new Date();
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 8);

      const sessions = [
        new Session('s1', 'user1', 'proj1', null, 3600, now),       // This week
        new Session('s2', 'user1', 'proj1', null, 3600, lastWeek)   // Last week
      ];

      // Act
      const leaderboard = calculator.calculate(users, sessions, 'week');

      // Assert
      expect(leaderboard[0].totalHours).toBe(1); // Only this week's session
      expect(leaderboard[0].sessionCount).toBe(1);
    });
  });

  describe('getTopEntries', () => {
    it('should return top N entries', () => {
      // Arrange
      const entries = [
        {
          user: new User('user1', 'alice', 'Alice', 'alice@example.com', new Date()),
          totalHours: 10,
          sessionCount: 5,
          rank: 1
        },
        {
          user: new User('user2', 'bob', 'Bob', 'bob@example.com', new Date()),
          totalHours: 8,
          sessionCount: 4,
          rank: 2
        },
        {
          user: new User('user3', 'charlie', 'Charlie', 'charlie@example.com', new Date()),
          totalHours: 6,
          sessionCount: 3,
          rank: 3
        }
      ];

      // Act
      const top2 = calculator.getTopEntries(entries, 2);

      // Assert
      expect(top2).toHaveLength(2);
      expect(top2[0].user.name).toBe('Alice');
      expect(top2[1].user.name).toBe('Bob');
    });
  });

  describe('findUserPosition', () => {
    it('should find user position in leaderboard', () => {
      // Arrange
      const entries = [
        {
          user: new User('user1', 'alice', 'Alice', 'alice@example.com', new Date()),
          totalHours: 10,
          sessionCount: 5,
          rank: 1
        },
        {
          user: new User('user2', 'bob', 'Bob', 'bob@example.com', new Date()),
          totalHours: 8,
          sessionCount: 4,
          rank: 2
        }
      ];

      // Act
      const bobPosition = calculator.findUserPosition(entries, 'user2');

      // Assert
      expect(bobPosition).not.toBeNull();
      expect(bobPosition?.user.name).toBe('Bob');
      expect(bobPosition?.rank).toBe(2);
    });

    it('should return null if user not found', () => {
      // Arrange
      const entries = [
        {
          user: new User('user1', 'alice', 'Alice', 'alice@example.com', new Date()),
          totalHours: 10,
          sessionCount: 5,
          rank: 1
        }
      ];

      // Act
      const position = calculator.findUserPosition(entries, 'user999');

      // Assert
      expect(position).toBeNull();
    });
  });

  describe('calculateAverageSessionDuration', () => {
    it('should calculate average session duration correctly', () => {
      // Arrange
      const entry = {
        user: new User('user1', 'alice', 'Alice', 'alice@example.com', new Date()),
        totalHours: 5,
        sessionCount: 2,
        rank: 1
      };

      // Act
      const avgDuration = calculator.calculateAverageSessionDuration(entry);

      // Assert
      // 5 hours * 60 minutes / 2 sessions = 150 minutes
      expect(avgDuration).toBe(150);
    });

    it('should return 0 for entries with no sessions', () => {
      // Arrange
      const entry = {
        user: new User('user1', 'alice', 'Alice', 'alice@example.com', new Date()),
        totalHours: 0,
        sessionCount: 0,
        rank: 1
      };

      // Act
      const avgDuration = calculator.calculateAverageSessionDuration(entry);

      // Assert
      expect(avgDuration).toBe(0);
    });
  });
});
