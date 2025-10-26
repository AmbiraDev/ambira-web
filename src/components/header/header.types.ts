/**
 * Type definitions for Header components
 * Centralizes all header-related TypeScript interfaces and types
 */

/**
 * Search filter types for filtering search results
 */
export type SearchFilter = 'people' | 'groups' | 'challenges';

/**
 * Props for SearchBar component
 */
export interface SearchBarProps {
  /** Whether the search bar is currently open/expanded */
  isOpen: boolean;
  /** Callback to toggle search bar open/closed state */
  onToggle: () => void;
}

/**
 * Props for Navigation component
 */
export interface NavigationProps {
  /** Current pathname for active link highlighting */
  pathname: string;
}

/**
 * Props for TimerStatus component
 */
export interface TimerStatusProps {
  /** Current pathname to determine display mode */
  pathname: string;
}

/**
 * Props for ProfileMenu component
 */
export interface ProfileMenuProps {
  /** Currently authenticated user */
  user: {
    name: string;
    profilePicture?: string;
  };
}

/**
 * Props for MobileMenu component
 */
export interface MobileMenuProps {
  /** Whether the mobile menu is currently open */
  isOpen: boolean;
  /** Callback to toggle mobile menu open/closed state */
  onToggle: () => void;
  /** Current pathname for active link highlighting */
  pathname: string;
}

/**
 * Props for Logo component
 */
export interface LogoProps {
  /** Optional className for styling overrides */
  className?: string;
}

/**
 * Props for AuthButtons component
 */
export interface AuthButtonsProps {
  /** Whether to show in mobile view */
  isMobile?: boolean;
}

/**
 * Navigation link configuration
 */
export interface NavLink {
  /** Link href */
  href: string;
  /** Display label */
  label: string;
  /** Icon component (optional) */
  icon?: React.ComponentType<{ className?: string }>;
}
