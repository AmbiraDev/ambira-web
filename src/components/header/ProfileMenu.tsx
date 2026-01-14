'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import type { ProfileMenuProps } from './header.types'
import { TIMING, DIMENSIONS, PROFILE_MENU_LINKS, ROUTES } from './header.constants'
import { getUserInitials } from './header.utils'

/**
 * ProfileMenu Component
 *
 * Displays user profile picture/avatar with a dropdown menu.
 * Features:
 * - Hover-activated dropdown with delay
 * - Click on avatar navigates to profile
 * - Dropdown contains profile and settings links
 *
 * Follows Single Responsibility Principle by managing only profile menu UI.
 *
 * @example
 * ```tsx
 * <ProfileMenu user={{ name: 'John Doe', profilePicture: '/avatar.jpg' }} />
 * ```
 */
export default function ProfileMenu({ user }: ProfileMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Handles mouse enter on profile container
   * Cancels any pending close timer and opens menu
   */
  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setIsMenuOpen(true)
  }

  /**
   * Handles mouse leave on profile container
   * Sets a delayed close timer for better UX
   */
  const handleMouseLeave = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
    }
    closeTimerRef.current = setTimeout(() => {
      setIsMenuOpen(false)
    }, TIMING.DROPDOWN_CLOSE_DELAY)
  }

  /**
   * Toggles menu open/closed
   */
  const handleToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <div className="relative">
      {/* Profile Container - Hover triggers dropdown */}
      <div
        className="flex items-center gap-1 cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Profile Picture - Click to go to profile */}
        <Link
          href={ROUTES.PROFILE}
          className="text-[#AFAFAF] hover:text-[#58CC02] transition-colors"
          aria-label="Go to profile"
        >
          {user.profilePicture ? (
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 p-0.5 bg-gradient-to-br from-[#58CC02] to-[#45A000] transition-all">
              <Image
                src={user.profilePicture}
                alt={user.name}
                width={DIMENSIONS.PROFILE_PICTURE_SIZE}
                height={DIMENSIONS.PROFILE_PICTURE_SIZE}
                quality={90}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 p-0.5 bg-gradient-to-br from-[#58CC02] to-[#45A000] transition-all">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-[#3C3C3C]">
                  {getUserInitials(user.name)}
                </span>
              </div>
            </div>
          )}
        </Link>

        {/* Dropdown Icon */}
        <button
          onClick={handleToggle}
          className="p-1 text-[#AFAFAF] hover:text-[#58CC02] transition-colors"
          aria-label="Toggle profile menu"
          aria-expanded={isMenuOpen}
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div
          className="absolute right-0 top-full mt-2 z-20 w-48 bg-white border-2 border-[#E5E5E5] shadow-lg overflow-hidden rounded-2xl"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="menu"
        >
          <div className="py-2">
            {PROFILE_MENU_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-4 py-3 text-sm font-semibold text-[#3C3C3C] hover:bg-[#F7F7F7] transition-colors"
                role="menuitem"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
