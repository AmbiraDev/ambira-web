import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a date and time string in the user's local timezone
 * @param dateString - Date in YYYY-MM-DD format
 * @param timeString - Time in HH:MM format (24-hour)
 * @returns Date object in local timezone
 *
 * NOTE: DO NOT use `new Date("YYYY-MM-DDTHH:MM")` as it interprets the time as UTC!
 * This function correctly parses the date components to create a Date in local time.
 */
export function parseLocalDateTime(dateString: string, timeString: string): Date {
  const dateParts = dateString.split('-').map(Number);
  const timeParts = timeString.split(':').map(Number);

  const year = dateParts[0] ?? 1970;
  const month = dateParts[1] ?? 1;
  const day = dateParts[2] ?? 1;
  const hours = timeParts[0] ?? 0;
  const minutes = timeParts[1] ?? 0;

  // month is 0-indexed in JavaScript Date constructor
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Safely convert value to number with fallback
 * Protects against NaN and Infinity that can cause display/calculation issues
 *
 * @param value - Value to convert to number
 * @param fallback - Fallback value if conversion fails (default: 0)
 * @returns Converted number or fallback
 *
 * @example
 * safeNumber('123') // 123
 * safeNumber('abc') // 0
 * safeNumber(null, 10) // 10
 * safeNumber(Infinity, 0) // 0
 */
export const safeNumber = (value: any, fallback: number = 0): number => {
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? fallback : num;
};

/**
 * Safely parse integer with fallback
 * Protects against NaN from invalid string parsing
 *
 * @param value - Value to parse as integer
 * @param fallback - Fallback value if parsing fails (default: 0)
 * @returns Parsed integer or fallback
 *
 * @example
 * safeParseInt('123') // 123
 * safeParseInt('12.9') // 12
 * safeParseInt('abc') // 0
 */
export const safeParseInt = (value: any, fallback: number = 0): number => {
  const num = parseInt(value, 10);
  return isNaN(num) ? fallback : num;
};

/**
 * Safely parse float with fallback
 * Protects against NaN from invalid string parsing
 *
 * @param value - Value to parse as float
 * @param fallback - Fallback value if parsing fails (default: 0)
 * @returns Parsed float or fallback
 *
 * @example
 * safeParseFloat('123.45') // 123.45
 * safeParseFloat('abc') // 0
 * safeParseFloat(null, 1.5) // 1.5
 */
export const safeParseFloat = (value: any, fallback: number = 0): number => {
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
};

/**
 * Check if an array is null, undefined, or empty
 * Consolidates duplicate empty array checks throughout the codebase
 *
 * @param arr - Array to check (can be null or undefined)
 * @returns True if array is null, undefined, or has length 0
 *
 * @example
 * isEmpty([]) // true
 * isEmpty(null) // true
 * isEmpty(undefined) // true
 * isEmpty([1, 2, 3]) // false
 */
export function isEmpty<T>(arr: T[] | null | undefined): boolean {
  return !arr || arr.length === 0;
}
