'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import type { MobileMenuProps } from './header.types'
import { NAV_LINKS } from './header.constants'
import { isActivePath } from './header.utils'

/**
 * MobileMenu Component
 *
 * Handles mobile navigation with a collapsible menu.
 * Features:
 * - Hamburger menu toggle button
 * - Collapsible navigation drawer
 * - Active route highlighting
 *
 * Follows Single Responsibility Principle by managing only mobile navigation UI.
 *
 * @example
 * ```tsx
 * <MobileMenu
 *   isOpen={isMobileMenuOpen}
 *   onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
 *   pathname="/feed"
 * />
 * ```
 */
export default function MobileMenu({ isOpen, onToggle, pathname }: MobileMenuProps) {
  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        className="md:hidden p-2 text-[#AFAFAF] hover:text-[#58CC02] transition-colors"
        onClick={onToggle}
        aria-label="Toggle mobile menu"
        aria-expanded={isOpen}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="md:hidden border-t-2 border-[#E5E5E5] bg-white shadow-lg">
          <nav className="py-4 space-y-2" role="navigation">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = isActivePath(pathname, href)

              return (
                <Link
                  key={href}
                  href={href}
                  className={`block px-4 py-3 transition-colors font-bold ${
                    isActive
                      ? 'text-[#58CC02] bg-[#F7F7F7]'
                      : 'text-[#3C3C3C] hover:text-[#58CC02] hover:bg-[#F7F7F7]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={onToggle}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </>
  )
}
