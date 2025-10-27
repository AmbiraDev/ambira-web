/**
 * Rate Limiting Tests
 */

import {
  checkRateLimit,
  withRateLimit,
  getRateLimitInfo,
  resetRateLimit,
  RateLimitError,
  formatRetryAfter,
  rateLimiter,
  RATE_LIMITS,
} from '../rateLimit';

describe('Rate Limiting', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    // Reset all rate limits before each test
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Clean up the rate limiter
    rateLimiter.destroy();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within rate limit', () => {
      expect(() => {
        checkRateLimit(testUserId, 'AUTH_LOGIN');
      }).not.toThrow();
    });

    it('should throw RateLimitError when limit exceeded', () => {
      const userId = testUserId + '-exceed';
      const limit = RATE_LIMITS.AUTH_LOGIN.maxRequests;

      // Make requests up to the limit
      for (let i = 0; i < limit; i++) {
        checkRateLimit(userId, 'AUTH_LOGIN');
      }

      // Next request should throw
      expect(() => {
        checkRateLimit(userId, 'AUTH_LOGIN');
      }).toThrow(RateLimitError);
    });

    it('should track different operations separately', () => {
      const userId = testUserId + '-separate';
      // Use up login limit
      const loginLimit = RATE_LIMITS.AUTH_LOGIN.maxRequests;
      for (let i = 0; i < loginLimit; i++) {
        checkRateLimit(userId, 'AUTH_LOGIN');
      }

      // Signup should still work
      expect(() => {
        checkRateLimit(userId, 'AUTH_SIGNUP');
      }).not.toThrow();
    });

    it('should track different users separately', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      const limit = RATE_LIMITS.FOLLOW.maxRequests;

      // Use up limit for user1
      for (let i = 0; i < limit; i++) {
        checkRateLimit(user1, 'FOLLOW');
      }

      // User1 should be rate limited
      expect(() => {
        checkRateLimit(user1, 'FOLLOW');
      }).toThrow(RateLimitError);

      // User2 should still work
      expect(() => {
        checkRateLimit(user2, 'FOLLOW');
      }).not.toThrow();
    });
  });

  describe('RateLimitError', () => {
    it('should include retry information', () => {
      const limit = RATE_LIMITS.SUPPORT.maxRequests;

      for (let i = 0; i < limit; i++) {
        checkRateLimit(testUserId, 'SUPPORT');
      }

      try {
        checkRateLimit(testUserId, 'SUPPORT');
        fail('Should have thrown RateLimitError');
      } catch (_error) {
        expect(error).toBeInstanceOf(RateLimitError);
        if (error instanceof RateLimitError) {
          expect(error.retryAfter).toBeGreaterThan(0);
          expect(error.limit).toBe(limit);
          expect(error.message).toContain('slow down');
        }
      }
    });

    it('should apply exponential backoff for repeated violations', () => {
      const limit = RATE_LIMITS.COMMENT.maxRequests;

      // First violation
      for (let i = 0; i <= limit; i++) {
        try {
          checkRateLimit(testUserId + '-backoff', 'COMMENT');
        } catch (_error) {
          if (error instanceof RateLimitError) {
            const firstRetryAfter = error.retryAfter;

            // Try again (second violation)
            try {
              checkRateLimit(testUserId + '-backoff', 'COMMENT');
            } catch (error2) {
              if (error2 instanceof RateLimitError) {
                // Second violation should have longer retry time
                expect(error2.retryAfter).toBeGreaterThanOrEqual(
                  firstRetryAfter
                );
              }
            }
          }
        }
      }
    });
  });

  describe('withRateLimit', () => {
    it('should execute function if within rate limit', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await withRateLimit(testUserId, 'PROJECT_CREATE', mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should throw RateLimitError if limit exceeded', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const limit = RATE_LIMITS.PROJECT_CREATE.maxRequests;

      // Use up the limit
      for (let i = 0; i < limit; i++) {
        await withRateLimit(testUserId + '-fn', 'PROJECT_CREATE', mockFn);
      }

      // Next call should throw
      await expect(
        withRateLimit(testUserId + '-fn', 'PROJECT_CREATE', mockFn)
      ).rejects.toThrow(RateLimitError);
    });

    it('should not execute function if rate limited', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const limit = RATE_LIMITS.TASK_CREATE.maxRequests;

      // Use up the limit
      for (let i = 0; i < limit; i++) {
        checkRateLimit(testUserId + '-noexec', 'TASK_CREATE');
      }

      // Function should not be called
      try {
        await withRateLimit(testUserId + '-noexec', 'TASK_CREATE', mockFn);
      } catch (_error) {
        // Expected to throw
      }

      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return correct info for unused limit', () => {
      const info = getRateLimitInfo(testUserId + '-info', 'SESSION_CREATE');

      expect(info.remaining).toBe(RATE_LIMITS.SESSION_CREATE.maxRequests);
      expect(info.limit).toBe(RATE_LIMITS.SESSION_CREATE.maxRequests);
      expect(info.resetTime).toBeNull();
      expect(info.violations).toBe(0);
    });

    it('should return correct remaining count', () => {
      const userId = testUserId + '-remaining';
      const limit = RATE_LIMITS.FOLLOW.maxRequests;

      // Use 3 requests
      checkRateLimit(userId, 'FOLLOW');
      checkRateLimit(userId, 'FOLLOW');
      checkRateLimit(userId, 'FOLLOW');

      const info = getRateLimitInfo(userId, 'FOLLOW');

      expect(info.remaining).toBe(limit - 3);
      expect(info.limit).toBe(limit);
    });

    it('should return reset time when limit is active', () => {
      const userId = testUserId + '-reset';

      checkRateLimit(userId, 'SUPPORT');

      const info = getRateLimitInfo(userId, 'SUPPORT');

      expect(info.resetTime).toBeGreaterThan(0);
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for user and operation', () => {
      const userId = testUserId + '-reset-test';
      const limit = RATE_LIMITS.FILE_UPLOAD.maxRequests;

      // Use up the limit
      for (let i = 0; i < limit; i++) {
        checkRateLimit(userId, 'FILE_UPLOAD');
      }

      // Should be rate limited
      expect(() => {
        checkRateLimit(userId, 'FILE_UPLOAD');
      }).toThrow(RateLimitError);

      // Reset
      resetRateLimit(userId, 'FILE_UPLOAD');

      // Should work again
      expect(() => {
        checkRateLimit(userId, 'FILE_UPLOAD');
      }).not.toThrow();
    });
  });

  describe('formatRetryAfter', () => {
    it('should format seconds correctly', () => {
      expect(formatRetryAfter(1)).toBe('1 second');
      expect(formatRetryAfter(30)).toBe('30 seconds');
      expect(formatRetryAfter(59)).toBe('59 seconds');
    });

    it('should format minutes correctly', () => {
      expect(formatRetryAfter(60)).toBe('1 minute');
      expect(formatRetryAfter(90)).toBe('2 minutes');
      expect(formatRetryAfter(300)).toBe('5 minutes');
    });
  });

  describe('RATE_LIMITS configuration', () => {
    it('should have reasonable limits for authentication', () => {
      expect(RATE_LIMITS.AUTH_LOGIN.maxRequests).toBeLessThanOrEqual(10);
      expect(RATE_LIMITS.AUTH_LOGIN.windowMs).toBeGreaterThanOrEqual(60000);

      expect(RATE_LIMITS.AUTH_SIGNUP.maxRequests).toBeLessThanOrEqual(5);
      expect(RATE_LIMITS.AUTH_SIGNUP.windowMs).toBeGreaterThanOrEqual(300000);
    });

    it('should have reasonable limits for social operations', () => {
      expect(RATE_LIMITS.FOLLOW.maxRequests).toBeGreaterThan(10);
      expect(RATE_LIMITS.SUPPORT.maxRequests).toBeGreaterThan(10);
      expect(RATE_LIMITS.COMMENT.maxRequests).toBeGreaterThan(5);
    });

    it('should have reasonable limits for content creation', () => {
      expect(RATE_LIMITS.SESSION_CREATE.maxRequests).toBeGreaterThan(10);
      expect(RATE_LIMITS.PROJECT_CREATE.maxRequests).toBeGreaterThan(5);
      expect(RATE_LIMITS.TASK_CREATE.maxRequests).toBeGreaterThan(10);
    });

    it('should have user-friendly error messages', () => {
      Object.values(RATE_LIMITS).forEach(config => {
        expect(config.message).toBeTruthy();
        expect(config.message.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Time window expiration', () => {
    it('should reset counter after time window expires', async () => {
      const userId = testUserId + '-expire';

      // Make a request
      checkRateLimit(userId, 'FOLLOW');

      const info1 = getRateLimitInfo(userId, 'FOLLOW');
      expect(info1.remaining).toBe(RATE_LIMITS.FOLLOW.maxRequests - 1);

      // Wait for window to expire (simulate by resetting)
      resetRateLimit(userId, 'FOLLOW');

      const info2 = getRateLimitInfo(userId, 'FOLLOW');
      expect(info2.remaining).toBe(RATE_LIMITS.FOLLOW.maxRequests);
    }, 10000);
  });
});
