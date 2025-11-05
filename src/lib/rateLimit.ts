/**
 * Rate Limiting Utility
 *
 * Provides client-side rate limiting to prevent abuse of Firebase operations.
 * Uses in-memory storage with exponential backoff for repeated violations.
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  violations: number;
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public limit: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * In-memory rate limiter
 * Key format: `${userId}:${operation}`
 */
class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Check if a request is allowed
   */
  check(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    // No previous requests or window expired
    if (!entry || now >= entry.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
        violations: entry?.violations || 0,
      });
      return true;
    }

    // Within rate limit
    if (entry.count < config.maxRequests) {
      entry.count++;
      return true;
    }

    // Rate limit exceeded
    entry.violations++;
    return false;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string, config: RateLimitConfig): number {
    const entry = this.store.get(key);
    if (!entry || Date.now() >= entry.resetTime) {
      return config.maxRequests;
    }
    return Math.max(0, config.maxRequests - entry.count);
  }

  /**
   * Get time until reset (in milliseconds)
   */
  getResetTime(key: string): number | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const remaining = entry.resetTime - Date.now();
    return remaining > 0 ? remaining : null;
  }

  /**
   * Get violation count
   */
  getViolations(key: string): number {
    return this.store.get(key)?.violations || 0;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy the rate limiter and clear interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different operations
 */
export const RATE_LIMITS = {
  // Authentication operations (per user)
  AUTH_LOGIN: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts. Please try again later.',
  },
  AUTH_SIGNUP: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many signup attempts. Please try again later.',
  },

  // Social operations (per user)
  FOLLOW: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many follow actions. Please slow down.',
  },
  SUPPORT: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many support actions. Please slow down.',
  },
  COMMENT: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many comments. Please slow down.',
  },

  // Content creation (per user)
  SESSION_CREATE: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many session creations. Please slow down.',
  },
  PROJECT_CREATE: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many project creations. Please slow down.',
  },
  CUSTOM_ACTIVITY_CREATE: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many custom activity creations. Please slow down.',
  },
  TASK_CREATE: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many task creations. Please slow down.',
  },

  // Updates (per user)
  SESSION_UPDATE: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many session updates. Please slow down.',
  },
  PROJECT_UPDATE: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many project updates. Please slow down.',
  },

  // File uploads (per user)
  FILE_UPLOAD: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many file uploads. Please slow down.',
  },

  // Search operations (per user)
  SEARCH: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many search requests. Please slow down.',
  },
} as const;

export type RateLimitOperation = keyof typeof RATE_LIMITS;

/**
 * Check rate limit and throw error if exceeded
 *
 * @param userId - User identifier (or IP for unauthenticated)
 * @param operation - Type of operation being rate limited
 * @throws {RateLimitError} If rate limit is exceeded
 */
export function checkRateLimit(
  userId: string,
  operation: RateLimitOperation
): void {
  const config = RATE_LIMITS[operation];
  const key = `${userId}:${operation}`;

  const allowed = rateLimiter.check(key, config);

  if (!allowed) {
    const resetTime = rateLimiter.getResetTime(key);
    const retryAfter = resetTime ? Math.ceil(resetTime / 1000) : 60;
    const violations = rateLimiter.getViolations(key);

    // Apply exponential backoff for repeated violations
    const backoffMultiplier = Math.min(Math.pow(2, violations - 1), 8);
    const adjustedRetryAfter = retryAfter * backoffMultiplier;

    throw new RateLimitError(
      config.message || 'Rate limit exceeded',
      adjustedRetryAfter,
      config.maxRequests
    );
  }
}

/**
 * Async wrapper for rate-limited operations
 *
 * @param userId - User identifier
 * @param operation - Type of operation
 * @param fn - Function to execute if rate limit allows
 * @returns Result of the function
 */
export async function withRateLimit<T>(
  userId: string,
  operation: RateLimitOperation,
  fn: () => Promise<T>
): Promise<T> {
  checkRateLimit(userId, operation);
  return fn();
}

/**
 * Get rate limit info for a user and operation
 */
export function getRateLimitInfo(
  userId: string,
  operation: RateLimitOperation
): {
  remaining: number;
  limit: number;
  resetTime: number | null;
  violations: number;
} {
  const config = RATE_LIMITS[operation];
  const key = `${userId}:${operation}`;

  return {
    remaining: rateLimiter.getRemaining(key, config),
    limit: config.maxRequests,
    resetTime: rateLimiter.getResetTime(key),
    violations: rateLimiter.getViolations(key),
  };
}

/**
 * Reset rate limit for a user and operation
 */
export function resetRateLimit(
  userId: string,
  operation: RateLimitOperation
): void {
  const key = `${userId}:${operation}`;
  rateLimiter.reset(key);
}

/**
 * Format retry-after time in human-readable format
 */
export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

// Export the limiter for testing purposes
export { rateLimiter };
