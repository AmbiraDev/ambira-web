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
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);

  // month is 0-indexed in JavaScript Date constructor
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}
