/**
 * Auth Initializer Component
 *
 * This component sets up the Firebase auth state listener once at the app root.
 * It replaces the heavyweight AuthProvider with a lightweight initializer.
 *
 * CRITICAL RESPONSIBILITIES:
 * 1. Subscribe to Firebase onAuthStateChanged
 * 2. Update React Query cache when Firebase auth changes
 * 3. Handle OAuth redirect results (Google sign-in on mobile)
 * 4. Show loading state during initial auth check
 *
 * ARCHITECTURE:
 * - NO Context API usage
 * - Just side effects + children rendering
 * - Auth state lives in React Query cache
 */

'use client'

import { useEffect, useState, useRef, useCallback, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { firebaseAuthApi } from '@/lib/api/auth'
import { isFirebaseInitialized } from '@/lib/firebase'
import { AUTH_KEYS } from '@/lib/react-query/auth.queries'
import { LoadingScreen } from '@/components/LoadingScreen'

interface AuthInitializerProps {
  children: ReactNode
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const redirectHandledRef = useRef(false)

  // Check if this is a public page
  // pathname is available both on server and client in Next.js App Router
  const isPublicPage = pathname === '/login' || pathname === '/signup' || pathname === '/auth'

  // For public pages, skip the loading state entirely
  const [isInitializing, setIsInitializing] = useState(() => !isPublicPage)

  // Memoize navigation to avoid re-renders
  const navigateToHome = useCallback(() => {
    router.push('/')
  }, [router])

  useEffect(() => {
    // Public pages should render immediately without waiting for auth
    if (isPublicPage) {
      // Ensure we're not initializing
      setIsInitializing(false)

      // Still set up auth listener in background, but don't block rendering
      if (isFirebaseInitialized) {
        firebaseAuthApi.onAuthStateChanged(async (firebaseUser) => {
          try {
            if (firebaseUser) {
              // Add small delay to allow Firestore to create user document
              await new Promise((resolve) => setTimeout(resolve, 100))
              const userData = await firebaseAuthApi.getCurrentUser()
              queryClient.setQueryData(AUTH_KEYS.session(), userData)
            } else {
              queryClient.setQueryData(AUTH_KEYS.session(), null)
            }
          } catch (_err) {
            // Silently handle permission errors during auth state changes
            // This is expected when user is signing in/out
            queryClient.setQueryData(AUTH_KEYS.session(), null)
          }
        })
      }
      return
    }

    if (!isFirebaseInitialized) {
      // Firebase is disabled (missing env vars) - treat as signed out
      queryClient.setQueryData(AUTH_KEYS.session(), null)
      setIsInitializing(false)
      return
    }

    let authUnsubscribe: (() => void) | null = null
    let timeoutId: NodeJS.Timeout | null = null

    const initializeAuth = async () => {
      // STEP 1: Check for Google OAuth redirect result
      // This MUST happen before setting up the auth listener
      // getRedirectResult can only be called once per redirect

      // Set timeout FIRST to ensure we don't hang if redirect check hangs
      timeoutId = setTimeout(() => {
        queryClient.setQueryData(AUTH_KEYS.session(), null)
        setIsInitializing(false)
      }, 5000)

      try {
        const redirectResult = await firebaseAuthApi.handleGoogleRedirectResult()

        if (redirectResult) {
          redirectHandledRef.current = true

          // Clear timeout since we're done initializing
          if (timeoutId) clearTimeout(timeoutId)

          // Update React Query cache immediately
          queryClient.setQueryData(AUTH_KEYS.session(), redirectResult.user)

          // Stop loading
          setIsInitializing(false)

          // Navigate to home after successful redirect
          navigateToHome()
          return // Exit early - redirect handled
        }
      } catch (_err) {
        // Clear timeout since we're done initializing
        if (timeoutId) clearTimeout(timeoutId)
        // Continue with normal auth flow even if redirect check fails
        setIsInitializing(false)
      }

      // STEP 2: Set up Firebase auth state listener
      try {
        authUnsubscribe = firebaseAuthApi.onAuthStateChanged(async (firebaseUser) => {
          // Skip if we already handled redirect
          if (redirectHandledRef.current) {
            redirectHandledRef.current = false // Reset for next time
            return
          }

          try {
            if (firebaseUser) {
              // User is signed in - fetch full user data from Firestore
              const userData = await firebaseAuthApi.getCurrentUser()

              // Update React Query cache
              queryClient.setQueryData(AUTH_KEYS.session(), userData)
            } else {
              // User is signed out
              // Clear React Query cache
              queryClient.setQueryData(AUTH_KEYS.session(), null)
            }
          } catch (_err) {
            // On error, assume user is not authenticated
            queryClient.setQueryData(AUTH_KEYS.session(), null)
          } finally {
            // Clear timeout since we're done initializing
            if (timeoutId) clearTimeout(timeoutId)
            setIsInitializing(false)
          }
        })
      } catch (_err) {
        // Clear timeout since we're done initializing
        if (timeoutId) clearTimeout(timeoutId)

        // Firebase failed to initialize - clear auth state and continue
        queryClient.setQueryData(AUTH_KEYS.session(), null)
        setIsInitializing(false)
      }
    }

    // Start initialization
    initializeAuth()

    // Cleanup: Unsubscribe from Firebase listener on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (authUnsubscribe) {
        authUnsubscribe()
      }
    }
  }, [queryClient, navigateToHome, pathname, isPublicPage])

  // Public pages should render immediately without loading screen
  // This prevents test timeouts and provides better UX
  if (isPublicPage) {
    return <>{children}</>
  }

  // Show loading state during initial auth check for protected pages
  // This prevents flash of unauthenticated content
  if (isInitializing) {
    return <LoadingScreen />
  }

  // Auth initialized - render app
  return <>{children}</>
}
