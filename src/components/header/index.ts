/**
 * Header Module Barrel Export
 *
 * Provides a clean public API for the header components.
 * Import the main Header component and optionally sub-components if needed.
 *
 * @example
 * ```tsx
 * // Import main component
 * import Header from '@/components/header';
 *
 * // Import sub-components if needed
 * import { SearchBar, Navigation } from '@/components/header';
 * ```
 */

// Main component (default export)
export { default } from './Header';

// Sub-components (named exports for testing and reusability)
export { default as SearchBar } from './SearchBar';
export { default as Navigation } from './Navigation';
export { default as TimerStatus } from './TimerStatus';
export { default as ProfileMenu } from './ProfileMenu';
export { default as MobileMenu } from './MobileMenu';
export { default as Logo } from './Logo';
export { default as AuthButtons } from './AuthButtons';

// Types (for consumers who need them)
export type {
  SearchBarProps,
  NavigationProps,
  TimerStatusProps,
  ProfileMenuProps,
  MobileMenuProps,
  LogoProps,
  AuthButtonsProps,
  SearchFilter,
  NavLink,
} from './header.types';

// Constants (rarely needed by consumers, but available)
export {
  NAV_LINKS,
  SEARCH_FILTERS,
  ROUTES,
  EXTERNAL_LINKS,
} from './header.constants';

// Utilities (for advanced use cases)
export {
  isActivePath,
  getSearchFilterLabel,
  buildSearchUrl,
  getUserInitials,
} from './header.utils';
