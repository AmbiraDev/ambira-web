/**
 * Constants for Header components - Duolingo Style
 * Centralizes all magic values, timing, and configuration
 */

import type { NavLink, SearchFilter } from './header.types'

/**
 * Timing constants (in milliseconds)
 */
export const TIMING = {
  /** Delay before closing dropdown menus on mouse leave */
  DROPDOWN_CLOSE_DELAY: 200,
  /** Timer update interval for active sessions */
  TIMER_UPDATE_INTERVAL: 1000,
} as const

/**
 * Dimensions and sizes
 */
export const DIMENSIONS = {
  /** Logo width and height */
  LOGO_SIZE: 40,
  /** Profile picture size */
  PROFILE_PICTURE_SIZE: 36,
  /** Maximum container width */
  MAX_CONTAINER_WIDTH: 1400,
  /** Header height */
  HEADER_HEIGHT: 64, // h-16 = 4rem = 64px
} as const

/**
 * Color constants - Duolingo palette (Light Mode)
 */
export const COLORS = {
  /** Primary brand color - Duolingo Green */
  PRIMARY: '#58CC02',
  /** Primary hover state */
  PRIMARY_HOVER: '#7ED321',
  /** Primary dark for borders */
  PRIMARY_DARK: '#45A000',
  /** Secondary - Duolingo Blue */
  SECONDARY: '#1CB0F6',
  /** Secondary dark */
  SECONDARY_DARK: '#0088CC',
  /** Discord brand color */
  DISCORD: '#5865F2',
  /** Discord hover state */
  DISCORD_HOVER: '#4752C4',
  /** Success green for active sessions */
  SUCCESS: '#58CC02',
  /** Gold for achievements */
  GOLD: '#FFD900',
  /** Background */
  BACKGROUND: '#F7F7F7',
  /** Card background */
  CARD_BACKGROUND: '#FFFFFF',
  /** Border color */
  BORDER: '#E5E5E5',
  /** Text primary */
  TEXT_PRIMARY: '#3C3C3C',
  /** Text muted */
  TEXT_MUTED: '#AFAFAF',
} as const

/**
 * Search filter options
 */
export const SEARCH_FILTERS: ReadonlyArray<{
  value: SearchFilter
  label: string
}> = [
  { value: 'people', label: 'People' },
  { value: 'groups', label: 'Groups' },
  { value: 'challenges', label: 'Challenges' },
] as const

/**
 * Navigation links configuration
 */
export const NAV_LINKS: ReadonlyArray<NavLink> = [
  { href: '/feed', label: 'Dashboard' },
  { href: '/groups', label: 'Groups' },
  { href: '/analytics', label: 'Analytics' },
] as const

/**
 * Profile menu links configuration
 */
export const PROFILE_MENU_LINKS: ReadonlyArray<NavLink> = [
  { href: '/profile', label: 'My Profile' },
  { href: '/settings', label: 'Settings' },
] as const

/**
 * External links
 */
export const EXTERNAL_LINKS = {
  DISCORD_COMMUNITY: 'https://discord.gg/wFMeNmCpdQ',
} as const

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
} as const

/**
 * CSS class name patterns - Duolingo Style (Light Mode)
 */
export const CLASS_NAMES = {
  /** Active nav link styles */
  NAV_LINK_ACTIVE: 'text-[#58CC02]',
  /** Inactive nav link styles */
  NAV_LINK_INACTIVE: 'text-[#AFAFAF] hover:text-[#58CC02]',
  /** Active nav indicator */
  NAV_INDICATOR: 'absolute bottom-0 left-0 right-0 h-1 bg-[#58CC02] rounded-full',
  /** Dropdown menu base */
  DROPDOWN_MENU:
    'absolute right-0 top-full mt-2 z-20 bg-white border-2 border-[#E5E5E5] shadow-lg rounded-2xl',
  /** Button base styles - Duolingo style */
  BUTTON_PRIMARY:
    'flex items-center gap-2 px-5 py-3 bg-[#58CC02] text-white hover:brightness-105 rounded-2xl transition-all whitespace-nowrap font-bold text-sm border-2 border-b-4 border-[#45A000] active:border-b-2 active:translate-y-[2px]',
  BUTTON_SECONDARY:
    'flex items-center gap-2 px-5 py-3 bg-[#1CB0F6] text-white hover:brightness-105 rounded-2xl transition-all whitespace-nowrap font-bold text-sm border-2 border-b-4 border-[#0088CC] active:border-b-2 active:translate-y-[2px]',
} as const
