'use client'

import { useAuth } from '@/hooks/useAuth'
import { LandingPage } from '@/components/LandingPage'
import { LoadingScreen } from '@/components/LoadingScreen'

export default function AuthPage() {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />
  }

  // Redirect authenticated users to feed
  if (isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/feed'
    }
    return null
  }

  // Show landing/auth page if not authenticated
  return <LandingPage />
}
