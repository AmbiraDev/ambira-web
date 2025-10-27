/**
 * Optimized Firestore query wrapper with multi-layer caching
 *
 * This reduces Firestore reads by:
 * 1. Caching query results in memory/storage
 * 2. Deduplicating concurrent requests
 * 3. Batching multiple document reads
 * 4. Providing optimistic updates
 */

import {
  getDoc,
  getDocs,
  writeBatch,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentReference,
  Query,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  cachedQuery,
  invalidateCache,
  MemoryCache,
  QueryDeduplicator,
} from './cache';
import { CACHE_TIMES } from '@/config/constants';

// ==================== CACHED DOCUMENT READS ====================

/**
 * Get a single document with caching
 */
export async function getCachedDoc(
  docRef: DocumentReference,
  options: {
    memoryTtl?: number;
    sessionCache?: boolean;
    localTtl?: number;
    dedupe?: boolean;
  } = {}
): Promise<DocumentSnapshot> {
  const cacheKey = `doc:${docRef.path}`;

  return cachedQuery(cacheKey, () => getDoc(docRef), {
    memoryTtl: options.memoryTtl ?? CACHE_TIMES.MEDIUM, // 5 minutes
    sessionCache: options.sessionCache ?? true,
    localTtl: options.localTtl ?? 0,
    dedupe: options.dedupe ?? true,
  });
}

/**
 * Get multiple documents in a batch with caching
 * This is more efficient than multiple individual reads
 */
export async function getCachedDocs(
  docRefs: DocumentReference[],
  options: {
    memoryTtl?: number;
    dedupe?: boolean;
  } = {}
): Promise<DocumentSnapshot[]> {
  const memoryTtl = options.memoryTtl ?? CACHE_TIMES.MEDIUM;

  // Check cache for each document
  const results: (DocumentSnapshot | null)[] = [];
  const toFetch: { ref: DocumentReference; index: number }[] = [];

  docRefs.forEach((ref, index) => {
    const cacheKey = `doc:${ref.path}`;
    const cached = MemoryCache.get<DocumentSnapshot>(cacheKey, memoryTtl);

    if (cached) {
      results[index] = cached;
    } else {
      results[index] = null;
      toFetch.push({ ref, index });
    }
  });

  // If all cached, return early
  if (toFetch.length === 0) {
    return results as DocumentSnapshot[];
  }

  // Fetch missing documents
  const fetchPromises = toFetch.map(async ({ ref, index }) => {
    const cacheKey = `doc:${ref.path}`;

    const fetchDoc = async () => {
      const snapshot = await getDoc(ref);
      MemoryCache.set(cacheKey, snapshot, memoryTtl);
      return snapshot;
    };

    const doc = options.dedupe
      ? await QueryDeduplicator.dedupe(cacheKey, fetchDoc)
      : await fetchDoc();

    results[index] = doc;
  });

  await Promise.all(fetchPromises);

  return results as DocumentSnapshot[];
}

// ==================== CACHED QUERY READS ====================

/**
 * Execute a Firestore query with caching
 */
export async function getCachedQuery<T>(
  query: Query<T>,
  cacheKey: string,
  options: {
    memoryTtl?: number;
    sessionCache?: boolean;
    localTtl?: number;
    dedupe?: boolean;
  } = {}
): Promise<QuerySnapshot<T>> {
  return cachedQuery(`query:${cacheKey}`, () => getDocs(query), {
    memoryTtl: options.memoryTtl ?? CACHE_TIMES.SHORT, // 1 minute default for queries
    sessionCache: options.sessionCache ?? false,
    localTtl: options.localTtl ?? 0,
    dedupe: options.dedupe ?? true,
  });
}

// ==================== BATCH WRITES ====================

/**
 * Batch write helper that automatically handles Firestore's 500 doc limit
 */
export async function batchWrite(
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    ref: DocumentReference;
    data?: Record<string, unknown>;
  }>
): Promise<void> {
  const BATCH_SIZE = 500;
  const batches: (typeof operations)[] = [];

  // Split into chunks of 500
  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    batches.push(operations.slice(i, i + BATCH_SIZE));
  }

  // Execute batches sequentially to avoid overwhelming Firestore
  for (const batchOps of batches) {
    const batch = writeBatch(db);

    for (const op of batchOps) {
      switch (op.type) {
        case 'set':
          if (op.data) batch.set(op.ref, op.data);
          break;
        case 'update':
          if (op.data) batch.update(op.ref, op.data);
          break;
        case 'delete':
          batch.delete(op.ref);
          break;
      }
    }

    await batch.commit();
  }

  // Invalidate cache for affected documents
  operations.forEach(op => {
    invalidateCache(`doc:${op.ref.path}`);
  });
}

// ==================== OPTIMISTIC UPDATES ====================

/**
 * Optimistic update helper for social interactions
 * Updates local state immediately while updating Firestore in background
 */
export class OptimisticUpdateManager {
  private static pendingUpdates = new Map<string, unknown>();

  /**
   * Apply an optimistic update
   */
  static apply<T>(key: string, optimisticData: T): void {
    this.pendingUpdates.set(key, optimisticData);
    MemoryCache.set(key, optimisticData, CACHE_TIMES.MEDIUM);
  }

  /**
   * Confirm an optimistic update succeeded
   */
  static confirm(key: string): void {
    this.pendingUpdates.delete(key);
  }

  /**
   * Rollback an optimistic update that failed
   */
  static rollback<T>(key: string, originalData: T): void {
    this.pendingUpdates.delete(key);
    MemoryCache.set(key, originalData, CACHE_TIMES.MEDIUM);
    invalidateCache(key);
  }

  /**
   * Check if an update is pending
   */
  static isPending(key: string): boolean {
    return this.pendingUpdates.has(key);
  }
}

// ==================== PREFETCH HELPERS ====================

/**
 * Prefetch documents in the background to warm the cache
 */
export async function prefetchDocs(
  docRefs: DocumentReference[]
): Promise<void> {
  // Use low priority to not interfere with user actions
  if ('requestIdleCallback' in window) {
    (
      window as Window & { requestIdleCallback: (callback: () => void) => void }
    ).requestIdleCallback(() => {
      getCachedDocs(docRefs, { memoryTtl: CACHE_TIMES.LONG });
    });
  } else {
    setTimeout(() => {
      getCachedDocs(docRefs, { memoryTtl: CACHE_TIMES.LONG });
    }, 100);
  }
}

/**
 * Prefetch a query in the background
 */
export async function prefetchQuery<T>(
  query: Query<T>,
  cacheKey: string
): Promise<void> {
  if ('requestIdleCallback' in window) {
    (
      window as Window & { requestIdleCallback: (callback: () => void) => void }
    ).requestIdleCallback(() => {
      getCachedQuery(query, cacheKey, { memoryTtl: CACHE_TIMES.LONG });
    });
  } else {
    setTimeout(() => {
      getCachedQuery(query, cacheKey, { memoryTtl: CACHE_TIMES.LONG });
    }, 100);
  }
}

// ==================== CACHE INVALIDATION HELPERS ====================

/**
 * Invalidate document cache
 */
export function invalidateDoc(docPath: string): void {
  invalidateCache(`doc:${docPath}`);
}

/**
 * Invalidate query cache
 */
export function invalidateQuery(cacheKey: string): void {
  invalidateCache(`query:${cacheKey}`);
}

/**
 * Invalidate all user-related caches
 */
export function invalidateUserCache(userId: string): void {
  // This is a simplified version - in production you'd want to track all user-related keys
  invalidateCache(`doc:users/${userId}`);
  invalidateCache(`query:user_sessions_${userId}`);
  invalidateCache(`query:user_activities_${userId}`);
}

// ==================== SMART PAGINATION ====================

/**
 * Pagination helper that caches pages
 */
export class PaginationCache<T> {
  private pages: Map<string, T[]> = new Map();
  private cursors: Map<string, unknown> = new Map();

  constructor(private pageSize: number = 20) {}

  setPage(_cursor: string, items: T[]): void {
    this.pages.set(cursor, items);
  }

  getPage(_cursor: string): T[] | null {
    return this.pages.get(cursor) ?? null;
  }

  setCursor(page: string, _cursor: unknown): void {
    this.cursors.set(page, cursor);
  }

  getCursor(page: string): unknown {
    return this.cursors.get(page);
  }

  clear(): void {
    this.pages.clear();
    this.cursors.clear();
  }

  /**
   * Get all cached items as a flat array
   */
  getAllItems(): T[] {
    const items: T[] = [];
    for (const page of this.pages.values()) {
      items.push(...page);
    }
    return items;
  }
}

// ==================== FIRESTORE READ OPTIMIZATION ====================

/**
 * Optimize field selection to reduce bandwidth
 * Note: Firestore charges by document reads, not by data transferred,
 * but reducing payload size improves performance
 */
export function selectFields<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): Partial<T> {
  const result: Partial<T> = {};
  for (const field of fields) {
    if (field in data) {
      result[field] = data[field];
    }
  }
  return result;
}

/**
 * Strip undefined values before writing to Firestore
 * This prevents errors and reduces storage size
 */
export function sanitizeData<T extends Record<string, unknown>>(data: T): T {
  const sanitized = { ...data } as Record<string, unknown>;
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
    // Also handle nested objects
    else if (
      typeof sanitized[key] === 'object' &&
      sanitized[key] !== null &&
      !Array.isArray(sanitized[key]) &&
      !(sanitized[key] instanceof Date)
    ) {
      sanitized[key] = sanitizeData(sanitized[key] as Record<string, unknown>);
    }
  });
  return sanitized as T;
}
