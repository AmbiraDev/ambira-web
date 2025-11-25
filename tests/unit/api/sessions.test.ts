import { firebaseSessionApi } from '@/lib/api/sessions'
import type { CreateSessionData } from '@/types'

jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'author' } },
}))

jest.mock('firebase/firestore', () => {
  const mockTimestamp = {
    fromDate: (date: Date) => ({
      toDate: () => date,
    }),
  }

  const mockModule = {
    collection: jest.fn(() => ({})),
    doc: jest.fn(() => ({})),
    addDoc: jest.fn(),
    setDoc: jest.fn(),
    getDoc: jest.fn(),
    deleteDoc: jest.fn(),
    serverTimestamp: jest.fn(() => new Date()),
    Timestamp: mockTimestamp,
  }

  ;(globalThis as unknown as { __firestoreMocks: typeof mockModule }).__firestoreMocks = mockModule

  return mockModule
})

const firestoreMocks = jest.requireMock('firebase/firestore') as {
  collection: jest.Mock
  doc: jest.Mock
  addDoc: jest.Mock
  setDoc: jest.Mock
  getDoc: jest.Mock
  deleteDoc: jest.Mock
  serverTimestamp: jest.Mock
  Timestamp: { fromDate: (date: Date) => { toDate: () => Date } }
}

const { addDoc: addDocMock } = firestoreMocks

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

const updateChallengeProgress = jest.fn()

jest.mock('@/lib/api/challenges', () => ({
  firebaseChallengeApi: {
    updateChallengeProgress: (...args: unknown[]) => updateChallengeProgress(...args),
  },
}))

jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn(),
}))

const { checkRateLimit: checkRateLimitMock } = jest.requireMock('@/lib/rateLimit') as {
  checkRateLimit: jest.Mock
}

jest.mock('@/lib/errorHandler', () => {
  const handleError = jest.fn(
    (_error: unknown, _context: string, options?: { defaultMessage?: string }) => ({
      userMessage: options?.defaultMessage || 'handled error',
    })
  )

  return {
    handleError,
    isPermissionError: jest.fn(() => false),
    isNotFoundError: jest.fn(() => false),
    ErrorSeverity: { WARNING: 'warning' },
  }
})

const { handleError: handleErrorMock } = jest.requireMock('@/lib/errorHandler') as {
  handleError: jest.Mock
}

describe('firebaseSessionApi - createSession', () => {
  const basePayload: CreateSessionData = {
    activityId: 'project-1',
    projectId: 'project-1',
    title: 'Morning Writing',
    description: 'Focused writing session',
    duration: 3600,
    startTime: new Date('2024-01-01T09:00:00Z'),
    visibility: 'everyone' as const,
    images: ['https://example.com/image.png'],
    allowComments: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    addDocMock.mockResolvedValue({ id: 'session-123' })
    ;(firebaseSessionApi.clearActiveSession as jest.Mock | undefined)?.mockRestore?.()
    jest.spyOn(firebaseSessionApi, 'clearActiveSession').mockResolvedValue(undefined)
    updateChallengeProgress.mockResolvedValue(undefined)
    checkRateLimitMock.mockReturnValue(undefined)
  })

  afterEach(() => {
    ;(firebaseSessionApi.clearActiveSession as jest.Mock).mockRestore()
  })

  it('persists sessions and triggers challenge updates', async () => {
    const session = await firebaseSessionApi.createSession(basePayload)

    expect(checkRateLimitMock).toHaveBeenCalledWith('author', 'SESSION_CREATE')
    expect(addDocMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'author',
        projectId: 'project-1',
        visibility: 'everyone',
      })
    )
    expect(updateChallengeProgress).toHaveBeenCalledWith(
      'author',
      expect.objectContaining({ id: 'session-123' })
    )
    expect(session).toMatchObject({
      id: 'session-123',
      title: 'Morning Writing',
      visibility: 'everyone',
    })
  })

  it('omits optional session fields when not provided', async () => {
    const payload: CreateSessionData = {
      ...basePayload,
      howFelt: undefined,
      images: undefined,
    }
    await firebaseSessionApi.createSession(payload)

    const stored = addDocMock.mock.calls[0]?.[1] as Record<string, unknown>
    expect('howFelt' in stored).toBe(false)
    expect(stored.images).toEqual([])
  })

  it('surfaces friendly errors when creation fails', async () => {
    addDocMock.mockRejectedValueOnce(new Error('write denied'))

    await expect(firebaseSessionApi.createSession(basePayload)).rejects.toThrow(
      /Failed to save session/
    )
    expect(handleErrorMock).toHaveBeenCalled()
  })
})
