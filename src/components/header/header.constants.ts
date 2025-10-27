/**
 * Constants for Header components
 * Centralizes all magic values, timing, and configuration
 */

import type { NavLink, SearchFilter } from './header.types';

/**
 * Timing constants (in milliseconds)
 */
export const TIMING = {
  /** Delay before closing dropdown menus on mouse leave */
  DROPDOWN_CLOSE_DELAY: 200,
  /** Timer update interval for active sessions */
  TIMER_UPDATE_INTERVAL: 1000,
} as const;

/**
 * Dimensions and sizes
 */
export const DIMENSIONS = {
  /** Logo width and height */
  LOGO_SIZE: 48,
  /** Profile picture size */
  PROFILE_PICTURE_SIZE: 36,
  /** Maximum container width */
  MAX_CONTAINER_WIDTH: 1400,
  /** Header height */
  HEADER_HEIGHT: 56, // h-14 = 3.5rem = 56px
} as const;

/**
 * Color constants (using Tailwind classes and hex values)
 */
export const COLORS = {
  /** Primary brand color */
  PRIMARY: '#007AFF',
  /** Primary hover state */
  PRIMARY_HOVER: '#0051D5',
  /** Discord brand color */
  DISCORD: '#5865F2',
  /** Discord hover state */
  DISCORD_HOVER: '#4752C4',
  /** Success green for active sessions */
  SUCCESS: '#34C759',
  /** Success green hover */
  SUCCESS_HOVER: 'rgb(22, 163, 74)', // green-700
} as const;

/**
 * Search filter options
 */
export const SEARCH_FILTERS: ReadonlyArray<{
  value: SearchFilter;
  label: string;
}> = [
  { value: 'people', label: 'People' },
  { value: 'groups', label: 'Groups' },
  { value: 'challenges', label: 'Challenges' },
] as const;

/**
 * Navigation links configuration
 */
export const NAV_LINKS: ReadonlyArray<NavLink> = [
  { href: '/feed', label: 'Dashboard' },
  { href: '/groups', label: 'Groups' },
  { href: '/activities', label: 'Activities' },
  { href: '/analytics', label: 'Analytics' },
] as const;

/**
 * Profile menu links configuration
 */
export const PROFILE_MENU_LINKS: ReadonlyArray<NavLink> = [
  { href: '/profile', label: 'My Profile' },
  { href: '/settings', label: 'Settings' },
] as const;

/**
 * External links
 */
export const EXTERNAL_LINKS = {
  DISCORD_COMMUNITY: 'https://discord.gg/wFMeNmCpdQ',
} as const;

/**
 * Route paths
 */
export const ROUTES = {
  HOME: '/',
  FEED: '/feed',
  TIMER: '/timer',
  AUTH: '/auth',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  RECORD_MANUAL: '/record-manual',
  SEARCH: '/search',
} as const;

/**
 * CSS class name patterns
 */
export const CLASS_NAMES = {
  /** Active nav link styles */
  NAV_LINK_ACTIVE: 'text-gray-900',
  /** Inactive nav link styles */
  NAV_LINK_INACTIVE: 'text-gray-600 hover:text-[#007AFF]',
  /** Active nav indicator */
  NAV_INDICATOR: 'absolute bottom-0 left-0 right-0 h-0.5 bg-[#007AFF]',
  /** Dropdown menu base */
  DROPDOWN_MENU: 'absolute right-0 top-full mt-2 z-20 bg-white border border-gray-300 shadow-lg',
  /** Button base styles */
  BUTTON_PRIMARY: 'flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white hover:bg-[#0051D5] rounded-md transition-colors whitespace-nowrap font-semibold text-sm',
  BUTTON_SECONDARY: 'flex items-center gap-2 px-4 py-2 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors whitespace-nowrap font-semibold text-sm',
} as const;
