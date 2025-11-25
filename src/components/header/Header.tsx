'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import NotificationIcon from '../NotificationIcon'
import Logo from './Logo'
import SearchBar from './SearchBar'
import Navigation from './Navigation'
import TimerStatus from './TimerStatus'
import ProfileMenu from './ProfileMenu'
import MobileMenu from './MobileMenu'
import AuthButtons from './AuthButtons'

/**
 * Header Component
 *
 * Main application header with responsive design.
 * Orchestrates all header sub-components without managing their internal state.
 *
 * Features:
 * - Logo with home link
 * - Collapsible search bar
 * - Desktop navigation
 * - Timer status and session actions
 * - Profile menu with dropdown
 * - Mobile menu for responsive design
 * - Authentication buttons for non-authenticated users
 * - Notifications
 *
 * This refactored version follows:
 * - Single Responsibility Principle: Orchestrates child components only
 * - Open/Closed Principle: New features added via new child components
 * - Composition over inheritance
 * - Airbnb React style guidelines
 *
 * @example
 * ```tsx
 * import Header from '@/components/header/Header';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       <Header />
 *       <main>{children}</main>
 *     </>
 *   );
 * }
 * ```
 */
export default function Header() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Local UI state (simple toggles only)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header
      role="banner"
      aria-label="Site header"
      className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm"
    >
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left side: Logo + Search + Navigation */}
          <div className="flex items-center space-x-4 ml-8">
            <Logo />

            {/* Search - Only show when authenticated */}
            {user && (
              <SearchBar isOpen={isSearchOpen} onToggle={() => setIsSearchOpen(!isSearchOpen)} />
            )}

            {/* Desktop Navigation - Only show when search is closed AND user is authenticated */}
            {!isSearchOpen && user && <Navigation pathname={pathname} />}
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center space-x-3">
            {/* Auth Buttons - Only show when NOT authenticated */}
            {!user && <AuthButtons />}

            {/* Session Actions / Timer Status - Only show when authenticated */}
            {user && <TimerStatus pathname={pathname} />}

            {/* Notifications - Only show when authenticated */}
            {user && (
              <NotificationIcon className="hidden md:flex p-2 text-gray-600 hover:text-[#0066CC] transition-colors" />
            )}

            {/* Profile Menu - Only show when authenticated */}
            {user && <ProfileMenu user={user} />}

            {/* Mobile Menu Toggle - Only show when authenticated */}
            {user && (
              <MobileMenu
                isOpen={isMobileMenuOpen}
                onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                pathname={pathname}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
