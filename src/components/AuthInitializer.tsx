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

'use client';

import { useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { firebaseAuthApi } from '@/lib/api/auth';
import { AUTH_KEYS } from '@/lib/react-query/auth.queries';
import type { AuthUser } from '@/types';

interface AuthInitializerProps {
  children: ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);
  const redirectHandledRef = useRef(false);

  // Memoize navigation to avoid re-renders
  const navigateToHome = useCallback(() => {
    router.push('/');
  }, [router]);

  useEffect(() => {
    let authUnsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {
      // STEP 1: Check for Google OAuth redirect result
      // This MUST happen before setting up the auth listener
      // getRedirectResult can only be called once per redirect
      try {
        const redirectResult =
          await firebaseAuthApi.handleGoogleRedirectResult();

        if (redirectResult) {
          redirectHandledRef.current = true;

          // Update React Query cache immediately
          queryClient.setQueryData(AUTH_KEYS.session(), redirectResult.user);

          // Stop loading
          setIsInitializing(false);

          // Navigate to home after successful redirect
          navigateToHome();
          return; // Exit early - redirect handled
        }
      } catch (error) {
        console.error('[AuthInitializer] ❌ Google redirect error:', error);
        // Continue with normal auth flow even if redirect check fails
        setIsInitializing(false);
      }

      // STEP 2: Set up Firebase auth state listener
      authUnsubscribe = firebaseAuthApi.onAuthStateChanged(
        async firebaseUser => {
          // Skip if we already handled redirect
          if (redirectHandledRef.current) {
            redirectHandledRef.current = false; // Reset for next time
            return;
          }

          try {
            if (firebaseUser) {
              // User is signed in - fetch full user data from Firestore
              const userData = await firebaseAuthApi.getCurrentUser();

              // Update React Query cache
              queryClient.setQueryData(AUTH_KEYS.session(), userData);
            } else {
              // User is signed out
              // Clear React Query cache
              queryClient.setQueryData(AUTH_KEYS.session(), null);
            }
          } catch (error) {
            console.error(
              '[AuthInitializer] ❌ Auth state change error:',
              error
            );

            // On error, assume user is not authenticated
            queryClient.setQueryData(AUTH_KEYS.session(), null);
          } finally {
            setIsInitializing(false);
          }
        }
      );
    };

    // Start initialization
    initializeAuth();

    // Cleanup: Unsubscribe from Firebase listener on unmount
    return () => {
      if (authUnsubscribe) {
        authUnsubscribe();
      }
    };
  }, [queryClient, navigateToHome]);

  // Show loading spinner during initial auth check
  // This prevents flash of unauthenticated content
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Auth initialized - render app
  return <>{children}</>;
}
