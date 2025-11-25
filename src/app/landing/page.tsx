/**
 * Landing Page Route
 *
 * This is a standalone landing page accessible to both authenticated and unauthenticated users.
 * Linked from the "About" section in the footer.
 */

'use client'

import { LandingPageContent } from '@/features/feed/components/LandingPageContent'

export default function LandingPage() {
  return <LandingPageContent />
}
