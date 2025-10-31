import {
  checkRateLimit,
  withRateLimit,
  getRateLimitInfo,
  resetRateLimit,
  formatRetryAfter,
  RateLimitError,
  rateLimiter,
} from '@/lib/rateLimit';

describe('lib/rateLimit', () => {
  const user = 'user-123';
  const operation = 'AUTH_LOGIN' as const;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    resetRateLimit(user, operation);
  });

  afterEach(() => {
    resetRateLimit(user, operation);
    jest.useRealTimers();
  });

  afterAll(() => {
    rateLimiter.destroy();
  });

  it('allows requests until the configured limit is exceeded', () => {
    for (let i = 0; i < 5; i += 1) {
      expect(() => checkRateLimit(user, operation)).not.toThrow();
    }

    expect(() => checkRateLimit(user, operation)).toThrow(RateLimitError);
  });

  it('records rate limit metadata for diagnostics', () => {
    for (let i = 0; i < 5; i += 1) {
      checkRateLimit(user, operation);
    }

    try {
      checkRateLimit(user, operation);
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
    }

    const info = getRateLimitInfo(user, operation);
    expect(info.remaining).toBe(0);
    expect(info.limit).toBe(5);
    expect(info.violations).toBe(1);
    expect(info.resetTime).not.toBeNull();
  });

  it('resets counters after the rate limit window passes', () => {
    for (let i = 0; i < 5; i += 1) {
      checkRateLimit(user, operation);
    }

    // Fast forward past the 15 minute window for AUTH_LOGIN
    jest.advanceTimersByTime(15 * 60 * 1000 + 1);

    expect(() => checkRateLimit(user, operation)).not.toThrow();
  });

  it('wraps operations and surfaces underlying results', async () => {
    const result = await withRateLimit(user, operation, async () => 42);
    expect(result).toBe(42);
  });

  it('formats retry-after responses for UI display', () => {
    expect(formatRetryAfter(10)).toBe('10 seconds');
    expect(formatRetryAfter(65)).toBe('2 minutes');
  });
});
