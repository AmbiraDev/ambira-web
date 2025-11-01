import {
  LocalCache,
  SessionCache,
  MemoryCache,
  QueryDeduplicator,
  cachedQuery,
  invalidateCache,
  clearAllCaches,
} from '@/lib/cache';

jest.mock('@/lib/debug', () => ({
  debug: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

type MutableStorage = Storage & {
  __store?: Map<string, string>;
};

const setupStorage = (storage: MutableStorage) => {
  const store = new Map<string, string>();

  storage.__store = store;
  storage.clear = jest.fn(() => store.clear());
  storage.getItem = jest.fn((key: string) =>
    store.has(key) ? store.get(key)! : null
  );
  storage.setItem = jest.fn((key: string, value: string) => {
    store.set(key, value);
  });
  storage.removeItem = jest.fn((key: string) => {
    store.delete(key);
  });
  storage.key = jest.fn(
    (index: number) => Array.from(store.keys())[index] ?? null
  );
};

describe('lib/cache', () => {
  beforeEach(() => {
    setupStorage(window.localStorage as MutableStorage);
    setupStorage(window.sessionStorage as MutableStorage);
    MemoryCache.clear();
    QueryDeduplicator.clear();
  });

  afterEach(() => {
    clearAllCaches();
    jest.restoreAllMocks();
  });

  it('stores and retrieves local cache values until TTL expires', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1_000);

    LocalCache.set('greeting', 'hello world', 2_000);

    nowSpy.mockReturnValue(2_000);
    expect(LocalCache.get('greeting', 2_000)).toBe('hello world');

    nowSpy.mockReturnValue(4_500);
    expect(LocalCache.get('greeting', 2_000)).toBeNull();
  });

  it('reads and clears session cache entries', () => {
    SessionCache.set('token', 'abc123');
    expect(SessionCache.get('token')).toBe('abc123');

    SessionCache.remove('token');
    expect(SessionCache.get('token')).toBeNull();
  });

  it('expires in-memory items according to TTL', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(5_000);

    MemoryCache.set('count', 42, 500);

    nowSpy.mockReturnValue(5_400);
    expect(MemoryCache.get<number>('count', 500)).toBe(42);

    nowSpy.mockReturnValue(6_000);
    expect(MemoryCache.get<number>('count', 500)).toBeNull();
  });

  it('deduplicates concurrent queries for identical keys', async () => {
    const queryFn = jest.fn(async () => {
      return 'result';
    });

    const promiseA = QueryDeduplicator.dedupe('fetch-key', queryFn);
    const promiseB = QueryDeduplicator.dedupe('fetch-key', queryFn);

    expect(queryFn).toHaveBeenCalledTimes(1);
    await expect(promiseA).resolves.toBe('result');
    await expect(promiseB).resolves.toBe('result');
  });

  it('hydrates layered cache sequentially and reuses stored data', async () => {
    const queryFn = jest
      .fn()
      .mockResolvedValueOnce({ data: 'fresh' })
      .mockRejectedValue(new Error('Should not run again'));

    const first = await cachedQuery('multi-layer', queryFn, {
      sessionCache: true,
      localTtl: 10_000,
    });
    expect(first).toEqual({ data: 'fresh' });
    expect(queryFn).toHaveBeenCalledTimes(1);

    // Memory cache hit should bypass the query function
    const second = await cachedQuery('multi-layer', queryFn, {
      sessionCache: true,
      localTtl: 10_000,
    });
    expect(second).toEqual({ data: 'fresh' });
    expect(queryFn).toHaveBeenCalledTimes(1);

    // Remove memory cache to force sessionStorage fallback
    MemoryCache.remove('multi-layer');
    const third = await cachedQuery('multi-layer', queryFn, {
      sessionCache: true,
      localTtl: 10_000,
    });
    expect(third).toEqual({ data: 'fresh' });
    expect(queryFn).toHaveBeenCalledTimes(1);

    // Remove session cache to force localStorage fallback
    SessionCache.remove('multi-layer');
    MemoryCache.remove('multi-layer');
    const fourth = await cachedQuery('multi-layer', queryFn, {
      sessionCache: true,
      localTtl: 10_000,
    });
    expect(fourth).toEqual({ data: 'fresh' });
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('invalidates cache entries across all layers', async () => {
    const queryFn = jest.fn().mockResolvedValue('value');

    await cachedQuery('invalidate-me', queryFn, {
      sessionCache: true,
      localTtl: 10_000,
    });
    expect(queryFn).toHaveBeenCalledTimes(1);

    invalidateCache('invalidate-me');

    expect(MemoryCache.get('invalidate-me')).toBeNull();
    expect(SessionCache.get('invalidate-me')).toBeNull();
    expect(LocalCache.get('invalidate-me', 10_000)).toBeNull();
  });
});
