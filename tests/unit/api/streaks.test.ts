import { firebaseStreakApi } from '@/lib/api/streaks'

jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'user-auth' } },
}))

jest.mock('firebase/firestore', () => {
  const timestamp = {
    fromDate: (date: Date) => ({
      toDate: () => date,
    }),
  }

  const mockModule = {
    collection: jest.fn(() => ({})),
    doc: jest.fn(() => ({})),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    Timestamp: timestamp,
    query: jest.fn(),
    where: jest.fn((...args: unknown[]) => ({ type: 'where', args })),
    orderBy: jest.fn((...args: unknown[]) => ({ type: 'orderBy', args })),
    limit: jest.fn((...args: unknown[]) => ({ type: 'limit', args })),
  }

  return mockModule
})

const streakFirestoreMocks = jest.requireMock('firebase/firestore') as {
  collection: jest.Mock
  doc: jest.Mock
  getDoc: jest.Mock
  getDocs: jest.Mock
  setDoc: jest.Mock
  updateDoc: jest.Mock
  Timestamp: { fromDate: (date: Date) => { toDate: () => Date } }
  query: jest.Mock
  where: jest.Mock
  orderBy: jest.Mock
  limit: jest.Mock
}

const getDocMock = streakFirestoreMocks.getDoc
const setDocMock = streakFirestoreMocks.setDoc
const getDocsMock = streakFirestoreMocks.getDocs
const queryMock = streakFirestoreMocks.query
const mockTimestamp = streakFirestoreMocks.Timestamp

jest.mock('@/lib/api/shared/utils', () => ({
  convertTimestamp: (value: unknown) => {
    if (value instanceof Date) {
      return value
    }
    if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
      return (value as { toDate: () => Date }).toDate()
    }
    return new Date(value as string)
  },
}))

describe('firebaseStreakApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('initialises empty streaks when no record exists', async () => {
    getDocMock.mockResolvedValueOnce({
      exists: () => false,
    })
    setDocMock.mockResolvedValueOnce(undefined)

    const data = await firebaseStreakApi.getStreakData('new-user')

    expect(setDocMock).toHaveBeenCalled()
    expect(data).toMatchObject({
      userId: 'new-user',
      currentStreak: 0,
      totalStreakDays: 0,
    })
  })

  it('hydrates persisted streak data', async () => {
    const lastActivity = mockTimestamp.fromDate(new Date('2024-01-01T12:00:00Z'))

    getDocMock.mockResolvedValueOnce({
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
    })

    const data = await firebaseStreakApi.getStreakData('user')

    expect(data.currentStreak).toBe(3)
    expect(data.lastActivityDate.toISOString()).toBe('2024-01-01T12:00:00.000Z')
    expect(data.isPublic).toBe(false)
  })

  it('suppresses permission errors when creating default streaks', async () => {
    getDocMock.mockResolvedValueOnce({
      exists: () => false,
    })
    const permissionError = { code: 'permission-denied' }
    setDocMock.mockRejectedValueOnce(permissionError)

    const data = await firebaseStreakApi.getStreakData('restricted')

    expect(data.currentStreak).toBe(0)
    expect(setDocMock).toHaveBeenCalled()
  })

  it('calculates streak statistics from recent sessions', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-07T12:00:00Z'))

    const sessions = [
      {
        data: () => ({
          startTime: mockTimestamp.fromDate(new Date('2024-01-07T09:00:00Z')),
        }),
      },
      {
        data: () => ({
          startTime: mockTimestamp.fromDate(new Date('2024-01-06T09:00:00Z')),
        }),
      },
      {
        data: () => ({
          startTime: mockTimestamp.fromDate(new Date('2024-01-04T09:00:00Z')),
        }),
      },
    ]
    getDocsMock.mockResolvedValueOnce({ docs: sessions })

    const stats = await firebaseStreakApi.getStreakStats('user-1')

    expect(queryMock).toHaveBeenCalled()
    expect(stats.currentStreak).toBeGreaterThanOrEqual(2)
    expect(stats.longestStreak).toBeGreaterThanOrEqual(stats.currentStreak)

    jest.useRealTimers()
  })
})
