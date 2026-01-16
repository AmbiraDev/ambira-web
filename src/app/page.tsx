/**
 * Home/Feed Route (Clean Architecture)
 *
 * This route file ONLY handles routing concerns.
 * All business logic is delegated to FeedPageContent and LandingPageContent components.
 */

'use client'

import { useAuth } from '@/hooks/useAuth'
import { FeedPageContent } from '@/features/feed/components/FeedPageContent'
import { LandingPageContent } from '@/features/feed/components/LandingPageContent'
import { LoadingScreen } from '@/components/LoadingScreen'

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <>
      {/* Show loading screen while checking authentication */}
      {isLoading && <LoadingScreen />}

      {/* Show feed for authenticated users - No top header on desktop like Duolingo */}
      {!isLoading && isAuthenticated && <FeedPageContent />}

      {/* Show landing page for unauthenticated users */}
      {!isLoading && !isAuthenticated && <LandingPageContent />}
    </>
  )
}
