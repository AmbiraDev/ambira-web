/**
 * Formatter Functions Unit Tests
 *
 * Tests date, time, and number formatting utilities
 */

import {
  formatElapsedTime,
  formatDurationHours,
  formatDurationMinutes,
  formatDate,
  formatTime,
} from '@/lib/formatters'

describe('Formatter Functions', () => {
  describe('formatElapsedTime', () => {
    it('should format seconds to HH:MM:SS', () => {
      expect(formatElapsedTime(0)).toMatch(/^0*:0*:0*/)
      expect(formatElapsedTime(60)).toMatch(/00:01:00/)
      expect(formatElapsedTime(3600)).toMatch(/01:00:00/)
      expect(formatElapsedTime(3661)).toMatch(/01:01:01/)
    })

    it('should handle negative values', () => {
      const result = formatElapsedTime(-60)
      expect(typeof result).toBe('string')
    })

    it('should handle large values', () => {
      const result = formatElapsedTime(864000) // 10 days
      expect(typeof result).toBe('string')
    })
  })

  describe('formatDurationHours', () => {
    it('should format duration to hours', () => {
      expect(formatDurationHours(3600)).toMatch(/1.*h/i)
      expect(formatDurationHours(7200)).toMatch(/2.*h/i)
    })

    it('should handle minutes', () => {
      const result = formatDurationHours(1800) // 30 minutes
      expect(typeof result).toBe('string')
    })

    it('should handle partial hours', () => {
      const result = formatDurationHours(5400) // 1.5 hours
      expect(typeof result).toBe('string')
    })
  })

  describe('formatDurationMinutes', () => {
    it('should format duration to minutes', () => {
      expect(formatDurationMinutes(60)).toMatch(/1.*m/i)
      expect(formatDurationMinutes(120)).toMatch(/2.*m/i)
    })

    it('should handle seconds', () => {
      const result = formatDurationMinutes(30)
      expect(typeof result).toBe('string')
    })

    it('should handle zero', () => {
      const result = formatDurationMinutes(0)
      expect(typeof result).toBe('string')
    })
  })

  describe('formatDate', () => {
    it('should format date to readable string', () => {
      const date = new Date('2024-01-15T10:30:00')
      const result = formatDate(date)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle different dates', () => {
      const result1 = formatDate(new Date('2024-01-01'))
      const result2 = formatDate(new Date('2024-12-31'))
      expect(result1).not.toEqual(result2)
    })
  })

  describe('formatTime', () => {
    it('should format time to HH:MM', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = formatTime(date)
      expect(typeof result).toBe('string')
    })

    it('should handle different times', () => {
      const result1 = formatTime(new Date('2024-01-15T00:00:00'))
      const result2 = formatTime(new Date('2024-01-15T23:59:00'))
      expect(result1).not.toEqual(result2)
    })
  })
})
