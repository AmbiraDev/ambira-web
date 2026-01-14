import Link from 'next/link'
import type { LogoProps } from './header.types'
import { ROUTES } from './header.constants'

/**
 * Logo Component
 *
 * Displays the Focumo text logo and links to the home page.
 * Simple, focused component following Single Responsibility Principle.
 *
 * @example
 * ```tsx
 * <Logo />
 * ```
 */
export default function Logo({ className }: LogoProps) {
  return (
    <Link
      href={ROUTES.HOME}
      className={`flex items-center flex-shrink-0 ${className || ''}`}
      aria-label="Focumo home"
    >
      <span className="text-4xl font-black text-[#58CC02]">Focumo</span>
    </Link>
  )
}
