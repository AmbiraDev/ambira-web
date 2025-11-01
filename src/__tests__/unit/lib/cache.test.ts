/**
 * Cache Utility Functions Unit Tests
 *
 * Tests cache operations and memory management
 */

import { getFromCache, setInCache, clearCache, cacheHasKey } from '@/lib/cache';

describe('Cache Utilities', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('setInCache and getFromCache', () => {
    it('should store and retrieve values from cache', () => {
      // ARRANGE
      const key = 'test-key';
      const value = { id: 1, name: 'Test' };

      // ACT
      setInCache(key, value);
      const result = getFromCache(key);

      // ASSERT
      expect(result).toEqual(value);
    });

    it('should return undefined for missing keys', () => {
      // ACT
      const result = getFromCache('nonexistent-key');

      // ASSERT
      expect(result).toBeUndefined();
    });

    it('should support overwriting values', () => {
      // ARRANGE
      const key = 'test-key';
      const value1 = { id: 1 };
      const value2 = { id: 2 };

      // ACT
      setInCache(key, value1);
      setInCache(key, value2);
      const result = getFromCache(key);

      // ASSERT
      expect(result).toEqual(value2);
    });

    it('should handle various data types', () => {
      // Test strings
      setInCache('string-key', 'test-value');
      expect(getFromCache('string-key')).toBe('test-value');

      // Test numbers
      setInCache('number-key', 42);
      expect(getFromCache('number-key')).toBe(42);

      // Test arrays
      setInCache('array-key', [1, 2, 3]);
      expect(getFromCache('array-key')).toEqual([1, 2, 3]);

      // Test booleans
      setInCache('bool-key', true);
      expect(getFromCache('bool-key')).toBe(true);
    });
  });

  describe('cacheHasKey', () => {
    it('should return true for existing keys', () => {
      // ARRANGE
      setInCache('existing-key', 'value');

      // ACT
      const hasKey = cacheHasKey('existing-key');

      // ASSERT
      expect(hasKey).toBe(true);
    });

    it('should return false for missing keys', () => {
      // ACT
      const hasKey = cacheHasKey('nonexistent-key');

      // ASSERT
      expect(hasKey).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached values', () => {
      // ARRANGE
      setInCache('key-1', 'value-1');
      setInCache('key-2', 'value-2');

      // ACT
      clearCache();

      // ASSERT
      expect(getFromCache('key-1')).toBeUndefined();
      expect(getFromCache('key-2')).toBeUndefined();
    });

    it('should allow adding new values after clear', () => {
      // ARRANGE
      setInCache('key-1', 'value-1');
      clearCache();

      // ACT
      setInCache('key-2', 'value-2');
      const result = getFromCache('key-2');

      // ASSERT
      expect(result).toBe('value-2');
      expect(getFromCache('key-1')).toBeUndefined();
    });
  });
});
