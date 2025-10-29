import { Session } from '@/domain/entities/Session';
import { ProfileStatsCalculator } from '@/features/profile/domain/ProfileStatsCalculator';

const calculator = new ProfileStatsCalculator();

function buildSession(
  id: string,
  overrides: Partial<{
    createdAt: Date;
    duration: number;
    projectId: string;
    activityId: string;
  }> = {}
) {
  const createdAt = overrides.createdAt ?? new Date('2024-01-01T10:00:00Z');
  const duration = overrides.duration ?? 3600;
  const projectId = overrides.projectId ?? 'project-default';
  const activityId = overrides.activityId ?? 'activity-default';

  return new Session(
    id,
    'user-1',
    projectId,
    activityId,
    duration,
    createdAt,
    undefined,
    undefined,
    'everyone'
  );
}

describe('ProfileStatsCalculator', () => {
  it('builds daily chart data for the last 7 days', () => {
    const sessions = [
      buildSession('s1', {
        createdAt: new Date('2024-01-06T09:00:00Z'),
        duration: 1800,
      }),
      buildSession('s2', {
        createdAt: new Date('2024-01-06T15:00:00Z'),
        duration: 5400,
      }),
      buildSession('s3', {
        createdAt: new Date('2024-01-03T12:00:00Z'),
        duration: 7200,
      }),
    ];

    // Freeze time to Jan 7th
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-07T12:00:00Z'));
    const chart = calculator.calculateChartData(sessions, '7D');
    jest.useRealTimers();

    expect(chart).toHaveLength(7);
    const busyDay = chart.find(point => point.sessions === 2);
    expect(busyDay).toBeDefined();
    expect(busyDay?.hours ?? 0).toBeGreaterThan(1.4);
  });

  it('summarises overall session statistics and streaks', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-07T12:00:00Z'));

    const sessions = [
      buildSession('s1', {
        createdAt: new Date('2024-01-07T09:00:00Z'),
        duration: 3600,
      }),
      buildSession('s2', {
        createdAt: new Date('2024-01-06T09:00:00Z'),
        duration: 7200,
      }),
      buildSession('s3', {
        createdAt: new Date('2024-01-04T09:00:00Z'),
        duration: 1800,
      }),
    ];

    const stats = calculator.calculateStats(sessions);

    expect(stats.totalSessions).toBe(3);
    expect(stats.totalHours).toBeCloseTo((3600 + 7200 + 1800) / 3600, 5);
    expect(stats.longestSession).toBe(7200);
    expect(stats.currentStreak).toBeGreaterThanOrEqual(2);
    expect(stats.longestStreak).toBeGreaterThanOrEqual(stats.currentStreak);

    jest.useRealTimers();
  });

  it('filters sessions by activity and ranks top activities', () => {
    const sessions = [
      buildSession('s1', {
        activityId: 'writing',
        projectId: 'writing',
        duration: 3600,
      }),
      buildSession('s2', {
        activityId: 'writing',
        projectId: 'writing',
        duration: 5400,
      }),
      buildSession('s3', {
        activityId: 'reading',
        projectId: 'reading',
        duration: 1800,
      }),
    ];

    const filtered = calculator.filterSessionsByActivity(sessions, 'writing');
    expect(filtered).toHaveLength(2);

    const top = calculator.getTopActivities(sessions, 2);
    expect(top[0]).toMatchObject({ id: 'writing', sessions: 2 });
    expect(top[1]).toMatchObject({ id: 'reading', sessions: 1 });
  });
});
