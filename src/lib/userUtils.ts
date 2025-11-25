/**
 * User-related utility functions
 * Consolidates duplicate user utility logic from across components
 */

import { COLORS } from '@/config/constants'

/**
 * Generate user initials from name
 * Takes the first letter of the first two words
 * Examples: "John Doe" → "JD", "Alice" → "AL", "Bob Smith Jones" → "BS"
 *
 * @param name - User's full name
 * @returns Two-letter uppercase initials
 */
export function getUserInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return 'NA'
  }

  return name
    .trim()
    .split(' ')
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Generate a consistent color for a user based on their ID
 * Uses a hash function to deterministically map user IDs to colors
 * Returns a Tailwind gradient class
 *
 * @param userId - User ID to hash
 * @returns Tailwind CSS gradient class string
 */
export function getUserColor(userId: string): string {
  if (!userId || userId.length === 0) {
    return COLORS.USER_AVATAR_GRADIENTS[0]
  }

  // Simple hash function to convert userId to a number
  const hash = userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)

  // Use modulo to select a color from the array
  const index = hash % COLORS.USER_AVATAR_GRADIENTS.length
  return (
    COLORS.USER_AVATAR_GRADIENTS[index] ??
    COLORS.USER_AVATAR_GRADIENTS[0] ??
    'bg-gradient-to-br from-brand-primary to-brand-primary-dark'
  )
}

/**
 * Generate a consistent hex color for a user based on their ID
 * Alternative to getUserColor that returns a hex value instead of a gradient class
 *
 * @param userId - User ID to hash
 * @returns Hex color string (e.g., "#FC4C02")
 */
export function getUserColorHex(userId: string): string {
  if (!userId || userId.length === 0) {
    return COLORS.USER_AVATAR_HEX[0]
  }

  // Simple hash function to convert userId to a number
  const hash = userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)

  // Use modulo to select a color from the array
  const index = hash % COLORS.USER_AVATAR_HEX.length
  return COLORS.USER_AVATAR_HEX[index] ?? COLORS.USER_AVATAR_HEX[0] ?? '#FC4C02'
}

/**
 * Generate a consistent background style object for a user avatar
 * Useful for inline styles when Tailwind classes can't be used
 *
 * @param userId - User ID to hash
 * @returns React CSSProperties object with background gradient
 */
export function getUserAvatarStyle(userId: string): React.CSSProperties {
  const colorHex = getUserColorHex(userId)

  // Generate a gradient from the base color
  return {
    background: `linear-gradient(135deg, ${colorHex}dd, ${colorHex})`,
  }
}

/**
 * Format username for display (with @ prefix)
 *
 * @param username - Username without @
 * @returns Username with @ prefix
 */
export function formatUsername(username: string): string {
  if (!username) return ''
  return username.startsWith('@') ? username : `@${username}`
}

/**
 * Validate username format
 * Rules: 3-30 characters, alphanumeric + underscores only, no spaces
 *
 * @param username - Username to validate
 * @returns True if valid, false otherwise
 */
export function isValidUsername(username: string): boolean {
  if (!username) return false

  // Remove @ prefix if present
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username

  // Check length (3-30 characters)
  if (cleanUsername.length < 3 || cleanUsername.length > 30) {
    return false
  }

  // Check format: alphanumeric + underscores only
  const usernameRegex = /^[a-zA-Z0-9_]+$/
  return usernameRegex.test(cleanUsername)
}

/**
 * Get username validation error message
 *
 * @param username - Username to validate
 * @returns Error message or null if valid
 */
export function getUsernameError(username: string): string | null {
  if (!username || username.trim().length === 0) {
    return 'Username is required'
  }

  const cleanUsername = username.startsWith('@') ? username.slice(1) : username

  if (cleanUsername.length < 3) {
    return 'Username must be at least 3 characters'
  }

  if (cleanUsername.length > 30) {
    return 'Username must be 30 characters or less'
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!usernameRegex.test(cleanUsername)) {
    return 'Username can only contain letters, numbers, and underscores'
  }

  return null
}

/**
 * Truncate a name to a maximum length with ellipsis
 *
 * @param name - Name to truncate
 * @param maxLength - Maximum length (default: 20)
 * @returns Truncated name with ellipsis if needed
 */
export function truncateName(name: string, maxLength: number = 20): string {
  if (!name) return ''
  if (name.length <= maxLength) return name
  return `${name.slice(0, maxLength)}...`
}

/**
 * Format follower count for display
 * Examples: 0 → "0", 1 → "1", 1000 → "1K", 1500000 → "1.5M"
 *
 * @param count - Number of followers
 * @returns Formatted count string
 */
export function formatFollowerCount(count: number): string {
  if (count < 1000) {
    return count.toString()
  }

  if (count < 1000000) {
    const k = count / 1000
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`
  }

  const m = count / 1000000
  return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`
}

/**
 * Get user display name with fallback
 *
 * @param user - User object with name and username
 * @returns Display name (name if available, otherwise username)
 */
export function getUserDisplayName(user: { name?: string; username?: string }): string {
  return user.name || user.username || 'Unknown User'
}
