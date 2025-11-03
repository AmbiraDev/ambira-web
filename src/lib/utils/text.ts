/**
 * Text manipulation utilities for consistent text handling across components
 */

/**
 * Truncates text to a maximum length and adds ellipsis if needed.
 * Handles undefined/null values gracefully.
 *
 * @param text - The text to truncate (can be undefined or null)
 * @param maxLength - Maximum length before truncation
 * @returns The original text if shorter than maxLength, truncated text with '...' if longer, or undefined if input is falsy
 *
 * @example
 * truncateText('Hello World', 8) // 'Hello Wo...'
 * truncateText('Hi', 8) // 'Hi'
 * truncateText(undefined, 8) // undefined
 * truncateText(null, 8) // null
 */
export function truncateText(
  text: string | undefined | null,
  maxLength: number
): string | undefined | null {
  if (!text) return text;
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

/**
 * Truncates text specifically for mobile displays (shorter length)
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length for mobile view
 * @returns Truncated text or original text
 *
 * @example
 * truncateTextMobile('Long Group Name Here', 30) // 'Long Group Name Here...'
 */
export function truncateTextMobile(
  text: string | undefined | null,
  maxLength: number
): string | undefined | null {
  return truncateText(text, maxLength);
}

/**
 * Truncates text specifically for desktop displays (longer length)
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length for desktop view
 * @returns Truncated text or original text
 *
 * @example
 * truncateTextDesktop('Long Group Name Here', 60) // 'Long Group Name Here'
 */
export function truncateTextDesktop(
  text: string | undefined | null,
  maxLength: number
): string | undefined | null {
  return truncateText(text, maxLength);
}
