/**
 * Debug utility for conditional logging based on environment
 * Replaces console.log/warn/error statements throughout the codebase
 */

/**
 * Check if running in development environment
 */
export const isDevelopment: boolean = process.env.NODE_ENV === 'development';

/**
 * Debug logging functions that only output in development mode
 */
export const debug = {
  /**
   * Log informational messages (only in development)
   * @param args - Arguments to log
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log warning messages (only in development)
   * @param args - Arguments to log
   */
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log error messages (only in development)
   * @param args - Arguments to log
   */
  error: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
};
