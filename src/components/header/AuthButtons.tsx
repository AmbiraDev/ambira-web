import Link from 'next/link'
import type { AuthButtonsProps } from './header.types'
import { ROUTES } from './header.constants'

/**
 * AuthButtons Component - Duolingo Style
 *
 * Displays authentication button for non-authenticated users.
 * Features:
 * - "Have an account?" text with Sign In button (default)
 * - "Focus Now" button when on scrolled landing page
 *
 * Follows Single Responsibility Principle by managing only auth-related CTAs.
 *
 * @example
 * ```tsx
 * <AuthButtons />
 * <AuthButtons showFocusNow={true} />
 * ```
 */
export default function AuthButtons({ isMobile = false, showFocusNow = false }: AuthButtonsProps) {
  const containerClass = isMobile
    ? 'flex flex-col gap-3 w-full'
    : 'hidden md:flex items-center gap-3'

  return (
    <div className={containerClass}>
      {/* Sign In Section */}
      <div className="flex items-center gap-3">
        {!isMobile && !showFocusNow && (
          <span className="text-[#AFAFAF] text-sm font-semibold">Have an account?</span>
        )}
        <Link
          href={ROUTES.AUTH}
          className="flex items-center gap-2 px-5 py-3 bg-[#58CC02] text-white hover:brightness-105 rounded-2xl transition-all whitespace-nowrap font-bold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 min-h-[48px] justify-center border-2 border-b-4 border-[#45A000] active:border-b-2 active:translate-y-[2px]"
        >
          <span>{showFocusNow ? 'Start Now' : 'Sign in'}</span>
        </Link>
      </div>
    </div>
  )
}
