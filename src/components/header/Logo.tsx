import Link from 'next/link'
import Image from 'next/image'
import type { LogoProps } from './header.types'
import { DIMENSIONS, ROUTES } from './header.constants'

/**
 * Logo Component
 *
 * Displays the Ambira logo and links to the home page.
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
      aria-label="Ambira home"
    >
      <Image
        src="/logo.svg"
        alt="Ambira"
        width={DIMENSIONS.LOGO_SIZE}
        height={DIMENSIONS.LOGO_SIZE}
        className="w-10 h-10"
        priority
      />
    </Link>
  )
}
