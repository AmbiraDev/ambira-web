import { firebaseStreakApi } from '@/lib/api/streaks';

const getDoc = jest.fn();
const setDoc = jest.fn();
const getDocs = jest.fn();
const collection = jest.fn(() => ({}));
const doc = jest.fn(() => ({}));
const query = jest.fn(() => ({}));

const createTimestamp = (date: Date) => ({
  toDate: () => date,
});

const Timestamp = {
  fromDate: (date: Date) => createTimestamp(date),
};

jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'user-auth' } },
}));

jest.mock('firebase/firestore', () => {
  const Timestamp = {
    fromDate: (date: Date) => createTimestamp(date),
  };

  return {
    collection: (...args: unknown[]) => collection(...args),
    doc: (...args: unknown[]) => doc(...args),
    getDoc: (...args: unknown[]) => getDoc(...args),
    getDocs: (...args: unknown[]) => getDocs(...args),
    setDoc: (...args: unknown[]) => setDoc(...args),
    updateDoc: jest.fn(),
    Timestamp,
    query: (...args: unknown[]) => query(...args),
    where: (...args: unknown[]) => ({ type: 'where', args }),
    orderBy: (...args: unknown[]) => ({ type: 'orderBy', args }),
    limit: (...args: unknown[]) => ({ type: 'limit', args }),
  };
});

jest.mock('@/lib/api/shared/utils', () => ({
  convertTimestamp: (value: unknown) => {
    if (value instanceof Date) {
      return value;
    }
    if (
      value &&
      typeof value === 'object' &&
      'toDate' in (value as Record<string, unknown>)
    ) {
      return (value as { toDate: () => Date }).toDate();
    }
    return new Date(value as string);
  },
}));

describe('firebaseStreakApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initialises empty streaks when no record exists', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => false,
    });
    setDoc.mockResolvedValueOnce(undefined);

    const data = await firebaseStreakApi.getStreakData('new-user');

    expect(setDoc).toHaveBeenCalled();
    expect(data).toMatchObject({
      userId: 'new-user',
      currentStreak: 0,
      totalStreakDays: 0,
    });
  });

  it('hydrates persisted streak data', async () => {
    const lastActivity = Timestamp.fromDate(new Date('2024-01-01T12:00:00Z'));

    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        userId: 'user',
        currentStreak: 3,
        longestStreak: 5,
        lastActivityDate: lastActivity,
        totalStreakDays: 12,
        streakHistory: [{ date: '2024-01-01' }],
        isPublic: false,
      }),
    });

    const data = await firebaseStreakApi.getStreakData('user');

    expect(data.currentStreak).toBe(3);
    expect(data.lastActivityDate.toISOString()).toBe(
      '2024-01-01T12:00:00.000Z'
    );
    expect(data.isPublic).toBe(false);
  });

  it('suppresses permission errors when creating default streaks', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => false,
    });
    const permissionError = { code: 'permission-denied' };
    setDoc.mockRejectedValueOnce(permissionError);

    const data = await firebaseStreakApi.getStreakData('restricted');

    expect(data.currentStreak).toBe(0);
    expect(setDoc).toHaveBeenCalled();
  });

  it('calculates streak statistics from recent sessions', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-07T12:00:00Z'));

    const sessions = [
      {
        data: () => ({
          startTime: Timestamp.fromDate(new Date('2024-01-07T09:00:00Z')),
        }),
      },
      {
        data: () => ({
          startTime: Timestamp.fromDate(new Date('2024-01-06T09:00:00Z')),
        }),
      },
      {
        data: () => ({
          startTime: Timestamp.fromDate(new Date('2024-01-04T09:00:00Z')),
        }),
      },
    ];
    getDocs.mockResolvedValueOnce({ docs: sessions });

    const stats = await firebaseStreakApi.getStreakStats('user-1');

    expect(query).toHaveBeenCalled();
    expect(stats.currentStreak).toBeGreaterThanOrEqual(2);
    expect(stats.longestStreak).toBeGreaterThanOrEqual(stats.currentStreak);

    jest.useRealTimers();
  });
});
