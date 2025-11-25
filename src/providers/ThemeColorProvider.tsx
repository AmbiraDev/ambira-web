/**
 * ThemeColorProvider - Manages the theme-color meta tag for PWA
 *
 * Ensures the browser's theme color (the color of the address bar/status bar
 * on mobile devices) stays white throughout the application.
 *
 * Note: Previously used for dynamic theme changes, but now just ensures
 * consistency with the white theme-color defined in layout.tsx metadata.
 */

'use client'

import { useLayoutEffect, type ReactNode } from 'react'

export function ThemeColorProvider({ children }: { children: ReactNode }) {
  // Ensure theme color is white on mount (belt and suspenders with layout.tsx)
  useLayoutEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor && metaThemeColor.getAttribute('content') !== '#ffffff') {
      metaThemeColor.setAttribute('content', '#ffffff')
    }
  }, [])

  return <>{children}</>
}
