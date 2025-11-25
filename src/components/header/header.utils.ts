/**
 * Utility functions for Header components
 * Pure functions with no side effects for business logic
 */

import type { SearchFilter } from './header.types'
import { SEARCH_FILTERS } from './header.constants'

/**
 * Determines if a given path is the active route
 *
 * @param currentPath - The current pathname from router
 * @param targetPath - The path to check against
 * @returns True if the target path is active
 *
 * @example
 * isActive('/feed/123', '/feed') // true
 * isActive('/feed', '/') // false
 * isActive('/', '/') // true
 */
export function isActivePath(currentPath: string, targetPath: string): boolean {
  if (targetPath === '/') {
    return currentPath === '/'
  }
  return currentPath.startsWith(targetPath)
}

/**
 * Gets the display label for a search filter
 *
 * @param filter - The search filter type
 * @returns The human-readable label
 *
 * @example
 * getSearchFilterLabel('people') // 'People'
 * getSearchFilterLabel('groups') // 'Groups'
 */
export function getSearchFilterLabel(filter: SearchFilter): string {
  const filterConfig = SEARCH_FILTERS.find((f) => f.value === filter)
  return filterConfig?.label ?? 'People'
}

/**
 * Constructs a search URL with query parameters
 *
 * @param query - The search query string
 * @param filter - The search filter type
 * @returns The constructed search URL
 *
 * @example
 * buildSearchUrl('john doe', 'people')
 * // '/search?q=john%20doe&type=people'
 */
export function buildSearchUrl(query: string, filter: SearchFilter): string {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return ''
  }

  const params = new URLSearchParams({
    q: trimmedQuery,
    type: filter,
  })

  return `/search?${params.toString()}`
}

/**
 * Gets user initials from name for avatar fallback
 *
 * @param name - User's full name
 * @returns First character of name in uppercase
 *
 * @example
 * getUserInitials('John Doe') // 'J'
 * getUserInitials('jane') // 'J'
 */
export function getUserInitials(name: string): string {
  return name.charAt(0).toUpperCase()
}

/**
 * Determines if the user is on the timer page
 *
 * @param pathname - Current pathname
 * @returns True if on timer page
 */
export function isOnTimerPage(pathname: string): boolean {
  return pathname.startsWith('/timer')
}

/**
 * Determines if timer should be shown in header
 *
 * @param hasActiveSession - Whether there's an active or paused session
 * @param pathname - Current pathname
 * @returns True if timer should be shown in header
 */
export function shouldShowHeaderTimer(hasActiveSession: boolean, pathname: string): boolean {
  return hasActiveSession && !isOnTimerPage(pathname)
}

/**
 * Combines class names conditionally
 * Simple alternative to clsx for this specific use case
 *
 * @param classes - Array of class names or conditional class objects
 * @returns Combined class string
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
