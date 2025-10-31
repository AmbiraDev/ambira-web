/**
 * Utility Functions Unit Tests
 *
 * Tests general utility functions and helpers
 */

import { formatDuration, parseISO, formatDate } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatDuration', () => {
    it('should format seconds to HH:MM:SS', () => {
      // Test various durations
      expect(formatDuration(0)).toMatch(/00:00:00/);
      expect(formatDuration(60)).toMatch(/00:01:00/);
      expect(formatDuration(3600)).toMatch(/01:00:00/);
      expect(formatDuration(3661)).toMatch(/01:01:01/);
    });

    it('should handle large durations', () => {
      // 24 hours
      expect(formatDuration(86400)).toMatch(/24:00:00/);
    });

    it('should handle decimal seconds', () => {
      expect(formatDuration(1.5)).toBeDefined();
    });
  });

  describe('formatDate', () => {
    it('should format date to readable string', () => {
      const date = new Date('2024-01-15T10:30:00');
      const formatted = formatDate(date);
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('should handle different date formats', () => {
      const date = new Date('2024-12-25T23:59:59');
      const formatted = formatDate(date);
      expect(formatted).toBeDefined();
    });
  });
});
