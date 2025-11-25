/**
 * Application-wide constants and configuration values
 * Extracted from magic numbers throughout the codebase for better maintainability
 */

/**
 * Color constants for user avatars and UI elements
 */
export const COLORS = {
  /**
   * Gradient colors for user avatars
   * Used to generate consistent colors based on user ID
   */
  USER_AVATAR_GRADIENTS: [
    'bg-gradient-to-br from-orange-400 to-orange-600',
    'bg-gradient-to-br from-blue-400 to-blue-600',
    'bg-gradient-to-br from-green-400 to-green-600',
    'bg-gradient-to-br from-purple-400 to-purple-600',
    'bg-gradient-to-br from-pink-400 to-pink-600',
    'bg-gradient-to-br from-indigo-400 to-indigo-600',
    'bg-gradient-to-br from-teal-400 to-teal-600',
    'bg-gradient-to-br from-cyan-400 to-cyan-600',
  ] as const,

  /**
   * Hex color values for user avatars
   * Alternative to gradients for simpler implementations
   */
  USER_AVATAR_HEX: [
    '#FC4C02', // Brand Orange
    '#0066CC', // Electric Blue
    '#34C759', // Success Green
    '#FF9500', // Warning Orange
    '#AF52DE', // Purple
    '#FF2D55', // Pink
  ] as const,
} as const

/**
 * Cache time-to-live (TTL) values in milliseconds
 * Used across caching layers (memory, session, local storage)
 */
export const CACHE_TIMES = {
  /**
   * Real-time data that needs frequent updates (30 seconds)
   * Use for: active timers, live notifications
   */
  REAL_TIME: 30 * 1000,

  /**
   * Short-term cache for frequently changing data (1 minute)
   * Use for: feed data, user status
   */
  SHORT: 1 * 60 * 1000,

  /**
   * Medium-term cache for semi-static data (5 minutes)
   * Use for: user profiles, project lists
   */
  MEDIUM: 5 * 60 * 1000,

  /**
   * Long-term cache for relatively static data (15 minutes)
   * Use for: app configuration, static content
   */
  LONG: 15 * 60 * 1000,

  /**
   * Extended cache for rarely changing data (1 hour)
   * Use for: achievements, statistics
   */
  EXTENDED: 60 * 60 * 1000,

  /**
   * Daily cache for daily aggregates (24 hours)
   * Use for: daily reports, analytics
   */
  DAILY: 24 * 60 * 60 * 1000,

  /**
   * Weekly cache for weekly data (7 days)
   * Use for: weekly statistics, historical data
   */
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
} as const

/**
 * Pagination configuration
 */
export const PAGINATION = {
  /**
   * Default number of items per page
   */
  DEFAULT_LIMIT: 20,

  /**
   * Maximum items that can be requested at once
   * Prevents excessive Firestore reads
   */
  MAX_LIMIT: 100,

  /**
   * Minimum items per page
   */
  MIN_LIMIT: 5,

  /**
   * Feed initial load limit
   * Optimized for above-the-fold content
   */
  FEED_INITIAL: 10,

  /**
   * Feed pagination increment
   */
  FEED_PAGE_SIZE: 20,

  /**
   * Comments per page
   */
  COMMENTS_PER_PAGE: 10,

  /**
   * Notifications per page
   */
  NOTIFICATIONS_PER_PAGE: 20,
} as const

/**
 * Timeout values in milliseconds
 */
export const TIMEOUTS = {
  /**
   * Standard API request timeout (15 seconds)
   */
  API_REQUEST: 15000,

  /**
   * Image upload timeout (30 seconds)
   */
  IMAGE_UPLOAD: 30000,

  /**
   * Firestore query timeout (10 seconds)
   */
  FIREBASE_QUERY: 10000,

  /**
   * Network request timeout (5 seconds)
   */
  NETWORK_REQUEST: 5000,

  /**
   * Auth token refresh timeout (30 seconds)
   */
  AUTH_REFRESH: 30000,

  /**
   * Debounce delay for search inputs (300ms)
   */
  SEARCH_DEBOUNCE: 300,

  /**
   * Debounce delay for auto-save (1 second)
   */
  AUTOSAVE_DEBOUNCE: 1000,

  /**
   * Toast notification duration (3 seconds)
   */
  TOAST_DURATION: 3000,
} as const

/**
 * File size limits in bytes
 */
export const FILE_LIMITS = {
  /**
   * Maximum image file size (5MB)
   */
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,

  /**
   * Maximum avatar file size (2MB)
   */
  MAX_AVATAR_SIZE: 2 * 1024 * 1024,

  /**
   * Maximum total upload size for multiple files (20MB)
   */
  MAX_TOTAL_UPLOAD: 20 * 1024 * 1024,
} as const

/**
 * Text length limits
 */
export const TEXT_LIMITS = {
  /**
   * Session title maximum length
   */
  SESSION_TITLE_MAX: 200,

  /**
   * Session description maximum length
   */
  SESSION_DESCRIPTION_MAX: 2000,

  /**
   * Comment maximum length
   */
  COMMENT_MAX: 500,

  /**
   * Bio maximum length
   */
  BIO_MAX: 160,

  /**
   * Username minimum length
   */
  USERNAME_MIN: 3,

  /**
   * Username maximum length
   */
  USERNAME_MAX: 30,
} as const

/**
 * Animation durations in milliseconds
 */
export const ANIMATION = {
  /**
   * Fast transition (150ms)
   */
  FAST: 150,

  /**
   * Normal transition (200ms)
   */
  NORMAL: 200,

  /**
   * Slow transition (300ms)
   */
  SLOW: 300,

  /**
   * Page transition duration
   */
  PAGE_TRANSITION: 400,
} as const
