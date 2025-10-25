/**
 * Leaderboard Calculator Domain Service
 *
 * Pure business logic for calculating group leaderboards.
 * No dependencies on infrastructure (database, API, etc.)
 */

import { User } from '@/domain/entities/User';
import { Session } from '@/domain/entities/Session';
import { LeaderboardEntry, TimePeriod } from '../types/groups.types';

export class LeaderboardCalculator {
  /**
   * Calculate leaderboard from users and their sessions
   */
  calculate(
    users: User[],
    sessions: Session[],
    period: TimePeriod
  ): LeaderboardEntry[] {
    // Filter sessions by time period
    const filteredSessions = this.filterSessionsByPeriod(sessions, period);

    // Group sessions by user
    const sessionsByUser = this.groupSessionsByUser(filteredSessions);

    // Calculate stats for each user
    const entries: LeaderboardEntry[] = users.map(user => {
      const userSessions = sessionsByUser.get(user.id) || [];
      const totalHours = this.calculateTotalHours(userSessions);
      const sessionCount = userSessions.length;

      return {
        user,
        totalHours,
        sessionCount,
        rank: 0 // Will be assigned after sorting
      };
    });

    // Sort by total hours (descending) and assign ranks
    entries.sort((a, b) => {
      // Primary sort: total hours
      if (b.totalHours !== a.totalHours) {
        return b.totalHours - a.totalHours;
      }
      // Tiebreaker: session count
      return b.sessionCount - a.sessionCount;
    });

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  /**
   * Filter sessions by time period
   */
  private filterSessionsByPeriod(
    sessions: Session[],
    period: TimePeriod
  ): Session[] {
    const now = new Date();
    const startDate = this.getStartDate(now, period);

    return sessions.filter(session => session.createdAt >= startDate);
  }

  /**
   * Get start date for a time period
   */
  private getStartDate(now: Date, period: TimePeriod): Date {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    switch (period) {
      case 'today':
        // Start of today
        return start;

      case 'week':
        // Start of this week (Sunday)
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        return start;

      case 'month':
        // Start of this month
        start.setDate(1);
        return start;

      case 'all-time':
        // Beginning of time
        return new Date(0);

      default:
        return start;
    }
  }

  /**
   * Group sessions by user ID
   */
  private groupSessionsByUser(sessions: Session[]): Map<string, Session[]> {
    const map = new Map<string, Session[]>();

    for (const session of sessions) {
      const existing = map.get(session.userId) || [];
      map.set(session.userId, [...existing, session]);
    }

    return map;
  }

  /**
   * Calculate total hours from sessions
   */
  private calculateTotalHours(sessions: Session[]): number {
    const totalSeconds = sessions.reduce((sum, session) => sum + session.duration, 0);
    return Math.round((totalSeconds / 3600) * 10) / 10; // Round to 1 decimal
  }

  /**
   * Get top N entries from leaderboard
   */
  getTopEntries(entries: LeaderboardEntry[], limit: number): LeaderboardEntry[] {
    return entries.slice(0, limit);
  }

  /**
   * Find user's position in leaderboard
   */
  findUserPosition(entries: LeaderboardEntry[], userId: string): LeaderboardEntry | null {
    return entries.find(entry => entry.user.id === userId) || null;
  }

  /**
   * Calculate average session duration for leaderboard
   */
  calculateAverageSessionDuration(entry: LeaderboardEntry): number {
    if (entry.sessionCount === 0) return 0;
    return Math.round((entry.totalHours * 60) / entry.sessionCount); // In minutes
  }
}
