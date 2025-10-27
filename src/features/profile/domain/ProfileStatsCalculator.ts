/**
 * Profile Stats Calculator - Domain Service
 *
 * Pure business logic for calculating profile statistics and chart data.
 * No infrastructure dependencies - easy to test.
 */

import { Session } from '@/domain/entities/Session';

export type TimePeriod = '7D' | '2W' | '4W' | '3M' | '1Y';

export interface ChartDataPoint {
  name: string;
  hours: number;
  sessions: number;
  avgDuration: number; // in minutes
}

export interface ProfileStats {
  totalHours: number;
  totalSessions: number;
  averageSessionDuration: number; // in minutes
  longestSession: number; // in seconds
  currentStreak: number;
  longestStreak: number;
  // Additional computed fields
  weeklyHours?: number; // Hours this week
  sessionsThisWeek?: number; // Sessions count this week
}

export class ProfileStatsCalculator {
  /**
   * Calculate chart data for a given time period
   */
  calculateChartData(
    sessions: Session[],
    period: TimePeriod
  ): ChartDataPoint[] {
    const now = new Date();
    const data: ChartDataPoint[] = [];

    switch (period) {
      case '7D':
        return this.calculateDailyData(sessions, 7, now);

      case '2W':
        return this.calculateDailyData(sessions, 14, now);

      case '4W':
        return this.calculateWeeklyData(sessions, 4, now);

      case '3M':
        return this.calculateWeeklyData(sessions, 12, now);

      case '1Y':
        return this.calculateMonthlyData(sessions, 12, now);

      default:
        return this.calculateDailyData(sessions, 7, now);
    }
  }

  /**
   * Calculate daily chart data
   */
  private calculateDailyData(
    sessions: Session[],
    days: number,
    now: Date
  ): ChartDataPoint[] {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data: ChartDataPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);

      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const daySessions = sessions.filter(s => {
        const sessionDate = s.createdAt;
        return sessionDate >= day && sessionDate < nextDay;
      });

      const hoursWorked = daySessions.reduce(
        (sum, s) => sum + s.getDurationInHours(),
        0
      );
      const avgDuration =
        daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + s.duration, 0) /
            daySessions.length /
            60
          : 0;

      const dayName = dayNames[day.getDay()];
      data.push({
        name: `${dayName?.slice(0, 3) || ''} ${day.getDate()}`,
        hours: Number(hoursWorked.toFixed(2)),
        sessions: daySessions.length,
        avgDuration: Math.round(avgDuration),
      });
    }

    return data;
  }

  /**
   * Calculate weekly chart data
   */
  private calculateWeeklyData(
    sessions: Session[],
    weeks: number,
    now: Date
  ): ChartDataPoint[] {
    const data: ChartDataPoint[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekSessions = sessions.filter(s => {
        const sessionDate = s.createdAt;
        return sessionDate >= weekStart && sessionDate < weekEnd;
      });

      const hoursWorked = weekSessions.reduce(
        (sum, s) => sum + s.getDurationInHours(),
        0
      );
      const avgDuration =
        weekSessions.length > 0
          ? weekSessions.reduce((sum, s) => sum + s.duration, 0) /
            weekSessions.length /
            60
          : 0;

      // Format as "Week of Mon DD"
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const weekLabel = `Week of ${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}`;

      data.push({
        name: weekLabel,
        hours: Number(hoursWorked.toFixed(2)),
        sessions: weekSessions.length,
        avgDuration: Math.round(avgDuration),
      });
    }

    return data;
  }

  /**
   * Calculate monthly chart data
   */
  private calculateMonthlyData(
    sessions: Session[],
    months: number,
    now: Date
  ): ChartDataPoint[] {
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const data: ChartDataPoint[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthSessions = sessions.filter(s => {
        const sessionDate = s.createdAt;
        return sessionDate >= monthStart && sessionDate < monthEnd;
      });

      const hoursWorked = monthSessions.reduce(
        (sum, s) => sum + s.getDurationInHours(),
        0
      );
      const avgDuration =
        monthSessions.length > 0
          ? monthSessions.reduce((sum, s) => sum + s.duration, 0) /
            monthSessions.length /
            60
          : 0;

      const monthName = monthNames[monthStart.getMonth()];
      data.push({
        name: monthName || '',
        hours: Number(hoursWorked.toFixed(2)),
        sessions: monthSessions.length,
        avgDuration: Math.round(avgDuration),
      });
    }

    return data;
  }

  /**
   * Calculate overall profile statistics
   */
  calculateStats(sessions: Session[]): ProfileStats {
    if (sessions.length === 0) {
      return {
        totalHours: 0,
        totalSessions: 0,
        averageSessionDuration: 0,
        longestSession: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
    }

    // Total hours and sessions
    const totalSeconds = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalHours = totalSeconds / 3600;
    const totalSessions = sessions.length;

    // Average session duration
    const averageSessionDuration = totalSeconds / sessions.length / 60; // in minutes

    // Longest session
    const longestSession = Math.max(...sessions.map(s => s.duration));

    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(sessions);

    return {
      totalHours: Number(totalHours.toFixed(2)),
      totalSessions,
      averageSessionDuration: Math.round(averageSessionDuration),
      longestSession,
      currentStreak,
      longestStreak,
    };
  }

  /**
   * Calculate current and longest streak
   */
  private calculateStreaks(sessions: Session[]): {
    currentStreak: number;
    longestStreak: number;
  } {
    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort sessions by date (most recent first)
    const sortedSessions = [...sessions].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Get unique dates
    const uniqueDates = new Set<string>();
    sortedSessions.forEach(s => {
      const dateStr = s.createdAt.toDateString();
      uniqueDates.add(dateStr);
    });

    const dates = Array.from(uniqueDates).map(d => new Date(d));
    dates.sort((a, b) => b.getTime() - a.getTime());

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if there's activity today or yesterday
    if (dates.length > 0) {
      const firstDate = dates[0];
      if (!firstDate) {
        return { currentStreak: 0, longestStreak: 0 };
      }

      const mostRecentDate = new Date(firstDate);
      mostRecentDate.setHours(0, 0, 0, 0);

      if (
        mostRecentDate.getTime() === today.getTime() ||
        mostRecentDate.getTime() === yesterday.getTime()
      ) {
        currentStreak = 1;

        // Count consecutive days
        for (let i = 1; i < dates.length; i++) {
          const prevDateValue = dates[i - 1];
          const currDateValue = dates[i];

          if (!prevDateValue || !currDateValue) {
            break;
          }

          const prevDate = new Date(prevDateValue);
          prevDate.setHours(0, 0, 0, 0);
          const currDate = new Date(currDateValue);
          currDate.setHours(0, 0, 0, 0);

          const dayDiff = Math.round(
            (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (dayDiff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prevDateValue = dates[i - 1];
      const currDateValue = dates[i];

      if (!prevDateValue || !currDateValue) {
        continue;
      }

      const prevDate = new Date(prevDateValue);
      prevDate.setHours(0, 0, 0, 0);
      const currDate = new Date(currDateValue);
      currDate.setHours(0, 0, 0, 0);

      const dayDiff = Math.round(
        (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return { currentStreak, longestStreak };
  }

  /**
   * Filter sessions by activity/project ID
   */
  filterSessionsByActivity(sessions: Session[], activityId: string): Session[] {
    if (activityId === 'all') {
      return sessions;
    }

    return sessions.filter(
      s =>
        s.activityId === activityId ||
        s.projectId === activityId ||
        s.groupIds.includes(activityId)
    );
  }

  /**
   * Get top activities by hours
   */
  getTopActivities(
    sessions: Session[],
    limit: number = 5
  ): Array<{ id: string; hours: number; sessions: number }> {
    const activityMap = new Map<string, { hours: number; sessions: number }>();

    sessions.forEach(s => {
      const id = s.projectId || s.activityId || 'unknown';
      const existing = activityMap.get(id) || { hours: 0, sessions: 0 };

      activityMap.set(id, {
        hours: existing.hours + s.getDurationInHours(),
        sessions: existing.sessions + 1,
      });
    });

    return Array.from(activityMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, limit);
  }
}
