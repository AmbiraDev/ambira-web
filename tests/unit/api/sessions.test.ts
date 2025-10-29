import { firebaseSessionApi } from '@/lib/api/sessions';

const addDoc = jest.fn();
const setDoc = jest.fn();
const getDoc = jest.fn();
const deleteDoc = jest.fn();
const collection = jest.fn(() => ({}));
const doc = jest.fn(() => ({}));

const createTimestamp = (date: Date) => ({
  toDate: () => date,
});

jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'author' } },
}));

jest.mock('firebase/firestore', () => {
  const Timestamp = {
    fromDate: (date: Date) => createTimestamp(date),
  };

  return {
    collection: (...args: unknown[]) => collection(...args),
    doc: (...args: unknown[]) => doc(...args),
    addDoc: (...args: unknown[]) => addDoc(...args),
    setDoc: (...args: unknown[]) => setDoc(...args),
    getDoc: (...args: unknown[]) => getDoc(...args),
    deleteDoc: (...args: unknown[]) => deleteDoc(...args),
    serverTimestamp: () => new Date(),
    Timestamp,
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

const updateChallengeProgress = jest.fn();

jest.mock('@/lib/api/challenges', () => ({
  firebaseChallengeApi: {
    updateChallengeProgress: (...args: unknown[]) =>
      updateChallengeProgress(...args),
  },
}));

const checkRateLimit = jest.fn();

jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
}));

const handleError = jest.fn((_error, _context, options) => ({
  userMessage: options?.defaultMessage || 'handled error',
}));

jest.mock('@/lib/errorHandler', () => ({
  handleError: (...args: unknown[]) => handleError(...args),
  isPermissionError: jest.fn(() => false),
  isNotFoundError: jest.fn(() => false),
  ErrorSeverity: { WARNING: 'warning' },
}));

describe('firebaseSessionApi - createSession', () => {
  const basePayload = {
    projectId: 'project-1',
    title: 'Morning Writing',
    description: 'Focused writing session',
    duration: 3600,
    startTime: new Date('2024-01-01T09:00:00Z'),
    visibility: 'everyone' as const,
    images: ['https://example.com/image.png'],
    allowComments: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    addDoc.mockResolvedValue({ id: 'session-123' });
    (
      firebaseSessionApi.clearActiveSession as jest.Mock | undefined
    )?.mockRestore?.();
    jest
      .spyOn(firebaseSessionApi, 'clearActiveSession')
      .mockResolvedValue(undefined);
    updateChallengeProgress.mockResolvedValue(undefined);
    checkRateLimit.mockReturnValue(undefined);
  });

  afterEach(() => {
    (firebaseSessionApi.clearActiveSession as jest.Mock).mockRestore();
  });

  it('persists sessions and triggers challenge updates', async () => {
    const session = await firebaseSessionApi.createSession(basePayload);

    expect(checkRateLimit).toHaveBeenCalledWith('author', 'SESSION_CREATE');
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'author',
        projectId: 'project-1',
        visibility: 'everyone',
      })
    );
    expect(updateChallengeProgress).toHaveBeenCalledWith(
      'author',
      expect.objectContaining({ id: 'session-123' })
    );
    expect(session).toMatchObject({
      id: 'session-123',
      title: 'Morning Writing',
      visibility: 'everyone',
    });
  });

  it('omits optional session fields when not provided', async () => {
    const payload = { ...basePayload, howFelt: undefined, images: undefined };
    await firebaseSessionApi.createSession(payload);

    const stored = addDoc.mock.calls[0]?.[1] as Record<string, unknown>;
    expect('howFelt' in stored).toBe(false);
    expect(stored.images).toEqual([]);
  });

  it('surfaces friendly errors when creation fails', async () => {
    addDoc.mockRejectedValueOnce(new Error('write denied'));

    await expect(firebaseSessionApi.createSession(basePayload)).rejects.toThrow(
      /Failed to save session/
    );
    expect(handleError).toHaveBeenCalled();
  });
});
