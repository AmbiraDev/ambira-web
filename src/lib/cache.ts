/**
 * Client-side caching utilities to reduce Firestore reads
 *
 * This module provides:
 * 1. localStorage caching for user preferences and static data
 * 2. sessionStorage caching for temporary data within a session
 * 3. Memory caching for frequently accessed data
 * 4. Query deduplication to prevent duplicate concurrent requests
 */

import { debug } from './debug';
import { CACHE_TIMES } from '@/config/constants';

// ==================== STORAGE UTILITIES ====================

const STORAGE_PREFIX = 'ambira_';
const CACHE_VERSION = 'v1';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: string;
}

/**
 * Safely access localStorage with error handling
 */
function getStorage(type: 'local' | 'session'): Storage | null {
  try {
    const storage = type === 'local' ? localStorage : sessionStorage;
    // Test if storage is accessible
    const testKey = `${STORAGE_PREFIX}test`;
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return storage;
  } catch (e) {
    debug.warn(`${type}Storage is not available:`, e);
    return null;
  }
}

/**
 * LocalStorage cache with TTL support
 */
export class LocalCache {
  private static readonly PREFIX = `${STORAGE_PREFIX}${CACHE_VERSION}_`;

  static set<T>(key: string, data: T, ttlMs: number = CACHE_TIMES.DAILY): void {
    const storage = getStorage('local');
    if (!storage) return;

    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };
      storage.setItem(`${this.PREFIX}${key}`, JSON.stringify(item));
    } catch (e) {
      // Storage might be full, try to clear old items
      this.clearExpired();
      try {
        const item: CacheItem<T> = {
          data,
          timestamp: Date.now(),
          version: CACHE_VERSION,
        };
        storage.setItem(`${this.PREFIX}${key}`, JSON.stringify(item));
      } catch (e2) {
        debug.warn('Failed to cache data:', e2);
      }
    }
  }

  static get<T>(key: string, ttlMs: number = CACHE_TIMES.DAILY): T | null {
    const storage = getStorage('local');
    if (!storage) return null;

    try {
      const itemStr = storage.getItem(`${this.PREFIX}${key}`);
      if (!itemStr) return null;

      const item: CacheItem<T> = JSON.parse(itemStr);

      // Check version
      if (item.version !== CACHE_VERSION) {
        storage.removeItem(`${this.PREFIX}${key}`);
        return null;
      }

      // Check TTL
      const age = Date.now() - item.timestamp;
      if (age > ttlMs) {
        storage.removeItem(`${this.PREFIX}${key}`);
        return null;
      }

      return item.data;
    } catch (e) {
      debug.warn('Failed to retrieve cached data:', e);
      return null;
    }
  }

  static remove(key: string): void {
    const storage = getStorage('local');
    if (!storage) return;
    storage.removeItem(`${this.PREFIX}${key}`);
  }

  static clear(): void {
    const storage = getStorage('local');
    if (!storage) return;

    try {
      const keys = Object.keys(storage);
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          storage.removeItem(key);
        }
      });
    } catch (e) {
      debug.warn('Failed to clear cache:', e);
    }
  }

  static clearExpired(): void {
    const storage = getStorage('local');
    if (!storage) return;

    try {
      const keys = Object.keys(storage);
      const now = Date.now();

      keys.forEach(key => {
        if (!key.startsWith(this.PREFIX)) return;

        try {
          const itemStr = storage.getItem(key);
          if (!itemStr) return;

          const item: CacheItem<unknown> = JSON.parse(itemStr);
          // Remove items older than 7 days
          if (now - item.timestamp > CACHE_TIMES.WEEKLY) {
            storage.removeItem(key);
          }
        } catch (e) {
          // Invalid item, remove it
          storage.removeItem(key);
        }
      });
    } catch (e) {
      debug.warn('Failed to clear expired cache:', e);
    }
  }
}

/**
 * SessionStorage cache (cleared when browser tab closes)
 */
export class SessionCache {
  private static readonly PREFIX = `${STORAGE_PREFIX}${CACHE_VERSION}_`;

  static set<T>(key: string, data: T): void {
    const storage = getStorage('session');
    if (!storage) return;

    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };
      storage.setItem(`${this.PREFIX}${key}`, JSON.stringify(item));
    } catch (e) {
      debug.warn('Failed to cache data in session:', e);
    }
  }

  static get<T>(key: string): T | null {
    const storage = getStorage('session');
    if (!storage) return null;

    try {
      const itemStr = storage.getItem(`${this.PREFIX}${key}`);
      if (!itemStr) return null;

      const item: CacheItem<T> = JSON.parse(itemStr);

      // Check version
      if (item.version !== CACHE_VERSION) {
        storage.removeItem(`${this.PREFIX}${key}`);
        return null;
      }

      return item.data;
    } catch (e) {
      debug.warn('Failed to retrieve cached data from session:', e);
      return null;
    }
  }

  static remove(key: string): void {
    const storage = getStorage('session');
    if (!storage) return;
    storage.removeItem(`${this.PREFIX}${key}`);
  }

  static clear(): void {
    const storage = getStorage('session');
    if (!storage) return;

    try {
      const keys = Object.keys(storage);
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          storage.removeItem(key);
        }
      });
    } catch (e) {
      debug.warn('Failed to clear session cache:', e);
    }
  }
}

// ==================== MEMORY CACHE ====================

interface MemoryCacheItem<T> {
  data: T;
  timestamp: number;
}

/**
 * In-memory cache for ultra-fast access (cleared on page refresh)
 */
export class MemoryCache {
  private static cache = new Map<string, MemoryCacheItem<any>>();
  private static readonly MAX_SIZE = 100; // Prevent memory leaks

  static set<T>(key: string, data: T, ttlMs: number = CACHE_TIMES.MEDIUM): void {
    // If cache is too large, remove oldest items
    if (this.cache.size >= this.MAX_SIZE) {
      const oldestKey = this.cache.keys().next().value as string | undefined;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  static get<T>(key: string, ttlMs: number = CACHE_TIMES.MEDIUM): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const age = Date.now() - item.timestamp;
    if (age > ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  static remove(key: string): void {
    this.cache.delete(key);
  }

  static clear(): void {
    this.cache.clear();
  }

  static clearExpired(ttlMs: number = CACHE_TIMES.MEDIUM): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > ttlMs) {
        this.cache.delete(key);
      }
    }
  }
}

// ==================== QUERY DEDUPLICATION ====================

interface PendingQuery<T> {
  promise: Promise<T>;
  timestamp: number;
}

/**
 * Prevents duplicate concurrent requests for the same data
 */
export class QueryDeduplicator {
  private static pending = new Map<string, PendingQuery<any>>();

  static async dedupe<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttlMs: number = 1000
  ): Promise<T> {
    // Check if there's a pending request for this key
    const existing = this.pending.get(key);
    if (existing) {
      const age = Date.now() - existing.timestamp;
      if (age < ttlMs) {
        // Return the existing promise
        return existing.promise;
      }
    }

    // Create new request
    const promise = queryFn()
      .finally(() => {
        // Clean up after request completes
        this.pending.delete(key);
      });

    this.pending.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  static clear(): void {
    this.pending.clear();
  }
}

// ==================== CACHE HELPERS ====================

/**
 * Multi-layer cache wrapper for Firestore queries
 *
 * Checks caches in order:
 * 1. Memory cache (fastest)
 * 2. SessionStorage (fast, tab-scoped)
 * 3. LocalStorage (persistent)
 * 4. Firestore query (slowest)
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: {
    memoryTtl?: number;
    sessionCache?: boolean;
    localTtl?: number;
    dedupe?: boolean;
  } = {}
): Promise<T> {
  const {
    memoryTtl = CACHE_TIMES.SHORT, // 1 minute in memory
    sessionCache = false,
    localTtl = 0, // 0 = no localStorage caching
    dedupe = true,
  } = options;

  // Check memory cache first
  const memoryData = MemoryCache.get<T>(key, memoryTtl);
  if (memoryData !== null) {
    return memoryData;
  }

  // Check session cache
  if (sessionCache) {
    const sessionData = SessionCache.get<T>(key);
    if (sessionData !== null) {
      // Store in memory for even faster next access
      MemoryCache.set(key, sessionData, memoryTtl);
      return sessionData;
    }
  }

  // Check local cache
  if (localTtl > 0) {
    const localData = LocalCache.get<T>(key, localTtl);
    if (localData !== null) {
      // Store in higher-level caches
      MemoryCache.set(key, localData, memoryTtl);
      if (sessionCache) {
        SessionCache.set(key, localData);
      }
      return localData;
    }
  }

  // Execute query (with optional deduplication)
  const executeQuery = async (): Promise<T> => {
    const data = await queryFn();

    // Store in all caches
    MemoryCache.set(key, data, memoryTtl);
    if (sessionCache) {
      SessionCache.set(key, data);
    }
    if (localTtl > 0) {
      LocalCache.set(key, data, localTtl);
    }

    return data;
  };

  if (dedupe) {
    return QueryDeduplicator.dedupe(key, executeQuery);
  } else {
    return executeQuery();
  }
}

/**
 * Invalidate cached data across all layers
 */
export function invalidateCache(key: string): void {
  MemoryCache.remove(key);
  SessionCache.remove(key);
  LocalCache.remove(key);
}

/**
 * Invalidate all caches with a specific prefix
 */
export function invalidateCachePrefix(prefix: string): void {
  // Memory cache
  MemoryCache.clear(); // Simple clear for now

  // Session and local storage would need iteration
  // This is a simplified version
}

/**
 * Clear all caches (useful on logout)
 */
export function clearAllCaches(): void {
  MemoryCache.clear();
  SessionCache.clear();
  LocalCache.clear();
  QueryDeduplicator.clear();
}

// Clear expired items periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    MemoryCache.clearExpired();
    LocalCache.clearExpired();
  }, CACHE_TIMES.MEDIUM); // Every 5 minutes
}
