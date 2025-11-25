/**
 * Utility Functions Unit Tests
 * Tests core utility and helper functions
 */

import { cn, parseLocalDateTime, safeNumber, safeParseInt, safeParseFloat } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn - className utility', () => {
    it('should merge classnames', () => {
      const result = cn('px-2', 'py-1')
      expect(result).toContain('px-2')
      expect(result).toContain('py-1')
    })

    it('should handle conditional classes', () => {
      const result = cn('px-2', true && 'py-1', false && 'hidden')
      expect(result).toContain('px-2')
      expect(result).toContain('py-1')
      expect(result).not.toContain('hidden')
    })

    it('should merge tailwind conflicts', () => {
      const result = cn('px-2', 'px-4')
      expect(result).toContain('px-4')
      expect(result).not.toContain('px-2')
    })
  })

  describe('parseLocalDateTime', () => {
    it('should parse date and time to Date object', () => {
      const result = parseLocalDateTime('2024-01-15', '10:30')
      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(0) // January is 0
      expect(result.getDate()).toBe(15)
      expect(result.getHours()).toBe(10)
      expect(result.getMinutes()).toBe(30)
    })

    it('should handle single digit months and days', () => {
      const result = parseLocalDateTime('2024-01-05', '09:05')
      expect(result.getDate()).toBe(5)
      expect(result.getMonth()).toBe(0)
      expect(result.getHours()).toBe(9)
      expect(result.getMinutes()).toBe(5)
    })

    it('should handle midnight', () => {
      const result = parseLocalDateTime('2024-01-15', '00:00')
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
    })
  })

  describe('safeNumber', () => {
    it('should convert valid strings to numbers', () => {
      expect(safeNumber('123')).toBe(123)
      expect(safeNumber('123.45')).toBe(123.45)
    })

    it('should return fallback for invalid input', () => {
      expect(safeNumber('abc')).toBe(0)
      expect(safeNumber('abc', 10)).toBe(10)
    })

    it('should handle null and undefined', () => {
      expect(safeNumber(null)).toBe(0)
      expect(safeNumber(undefined)).toBe(0)
      expect(safeNumber(null, 42)).toBe(42)
    })

    it('should reject NaN and Infinity', () => {
      expect(safeNumber(NaN)).toBe(0)
      expect(safeNumber(Infinity)).toBe(0)
      expect(safeNumber(NaN, 5)).toBe(5)
    })

    it('should handle numeric input', () => {
      expect(safeNumber(123)).toBe(123)
      expect(safeNumber(0)).toBe(0)
    })
  })

  describe('safeParseInt', () => {
    it('should parse valid integers', () => {
      expect(safeParseInt('123')).toBe(123)
      expect(safeParseInt('123abc')).toBe(123)
    })

    it('should truncate decimals', () => {
      expect(safeParseInt('123.99')).toBe(123)
    })

    it('should return fallback for invalid input', () => {
      expect(safeParseInt('abc')).toBe(0)
      expect(safeParseInt('abc', 5)).toBe(5)
    })

    it('should handle null and undefined', () => {
      expect(safeParseInt(null)).toBe(0)
      expect(safeParseInt(undefined)).toBe(0)
    })

    it('should handle numeric input', () => {
      expect(safeParseInt(123)).toBe(123)
      expect(safeParseInt(123.99)).toBe(123)
    })
  })

  describe('safeParseFloat', () => {
    it('should parse valid floats', () => {
      expect(safeParseFloat('123.45')).toBe(123.45)
      expect(safeParseFloat('123')).toBe(123)
    })

    it('should return fallback for invalid input', () => {
      expect(safeParseFloat('abc')).toBe(0)
      expect(safeParseFloat('abc', 3.14)).toBe(3.14)
    })

    it('should handle null and undefined', () => {
      expect(safeParseFloat(null)).toBe(0)
      expect(safeParseFloat(undefined)).toBe(0)
    })

    it('should handle numeric input', () => {
      expect(safeParseFloat(123.45)).toBe(123.45)
      expect(safeParseFloat(0)).toBe(0)
    })

    it('should handle edge cases', () => {
      expect(safeParseFloat('0.1')).toBeCloseTo(0.1)
      expect(safeParseFloat('-123.45')).toBe(-123.45)
    })
  })
})
