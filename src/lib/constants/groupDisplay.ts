/**
 * Display configuration constants for group list items.
 * Centralizes magic numbers and provides consistent configuration
 * across all group display components.
 */

/**
 * Group display configuration with text truncation lengths
 * for different screen sizes and content types.
 *
 * Values are used by SuggestedGroupListItem and MyGroupListItem
 * to ensure consistent display across mobile and desktop views.
 */
export const GROUP_DISPLAY_CONFIG = {
  /**
   * Text truncation lengths for different content and screen sizes
   */
  TRUNCATE_LENGTHS: {
    /** Group name truncation on mobile screens (max 30 characters) */
    NAME_MOBILE: 30,
    /** Group name truncation on desktop screens (max 60 characters) */
    NAME_DESKTOP: 60,
    /** Group location truncation on mobile screens (max 20 characters) */
    LOCATION_MOBILE: 20,
    /** Group description truncation on desktop screens (max 150 characters) */
    DESCRIPTION_DESKTOP: 150,
  },
  /** Maximum number of suggested groups to display (5 per design) */
  SUGGESTED_GROUPS_LIMIT: 5,
} as const

/**
 * Type definition for the GROUP_DISPLAY_CONFIG constant.
 * Useful for referencing the configuration type in other modules.
 *
 * @example
 * import type { GroupDisplayConfig } from '@/lib/constants/groupDisplay';
 * const config: GroupDisplayConfig = GROUP_DISPLAY_CONFIG;
 */
export type GroupDisplayConfig = typeof GROUP_DISPLAY_CONFIG
