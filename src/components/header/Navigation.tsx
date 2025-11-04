'use client';

import Link from 'next/link';
import type { NavigationProps } from './header.types';
import { NAV_LINKS, CLASS_NAMES } from './header.constants';
import { isActivePath, cn } from './header.utils';

/**
 * Navigation Component
 *
 * Renders the main desktop navigation links with active state highlighting.
 * Follows Single Responsibility Principle by managing only navigation UI.
 *
 * Features:
 * - Active route highlighting
 * - Bottom border indicator for active link
 * - Hover states for inactive links
 *
 * @example
 * ```tsx
 * <Navigation pathname="/feed" />
 * ```
 */
export default function Navigation({ pathname }: NavigationProps) {
  return (
    <nav className="hidden md:flex items-center space-x-6 h-14">
      {NAV_LINKS.map(({ href, label }) => {
        const isActive = isActivePath(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'text-base font-[450] transition-colors h-full relative flex items-center',
              isActive
                ? CLASS_NAMES.NAV_LINK_ACTIVE
                : CLASS_NAMES.NAV_LINK_INACTIVE
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {label}
            {isActive && <div className={CLASS_NAMES.NAV_INDICATOR} />}
          </Link>
        );
      })}
    </nav>
  );
}
