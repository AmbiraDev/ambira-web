'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContextType, AuthUser, LoginCredentials, SignupCredentials } from '@/types';
import { firebaseAuthApi } from '@/lib/firebaseApi';

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const redirectHandledRef = useRef(false);

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Memoize the navigation function to avoid re-renders
  const navigateToHome = useCallback(() => {
    router.push('/');
  }, [router]);

  // Initialize auth state on mount
  useEffect(() => {
    let authUnsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {

      // Check for Google redirect result FIRST (important for mobile sign-in)
      // This MUST happen before setting up the auth listener because getRedirectResult
      // can only be called once per redirect
      console.log('[AuthContext] 🔍 Checking for Google redirect result...');
      try {
        const redirectResult = await firebaseAuthApi.handleGoogleRedirectResult();

        if (redirectResult) {
          console.log('[AuthContext] ✅ Google redirect successful! User:', redirectResult.user.email);
          redirectHandledRef.current = true;
          // Set user immediately and stop loading
          setUser(redirectResult.user);
          setIsLoading(false);
          // Navigate to home after successful redirect
          navigateToHome();
          return; // Exit early since we handled the redirect
        } else {
          console.log('[AuthContext] ℹ️ No redirect result found (normal page load)');
        }
      } catch (error) {
        console.error('[AuthContext] ❌ Google redirect result ERROR:', error);
        console.error('[AuthContext] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        // Set loading to false even on error so user isn't stuck
        setIsLoading(false);
        // Continue with normal auth flow even if redirect check fails
      }

      // Set up the auth state listener
      authUnsubscribe = firebaseAuthApi.onAuthStateChanged(async (firebaseUser) => {

        // If we already handled the redirect, skip this callback
        if (redirectHandledRef.current) {
          return;
        }

        try {
          if (firebaseUser) {
            const userData = await firebaseAuthApi.getCurrentUser();
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('[AuthContext] Auth state change error:', error);
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      });
    };

    initializeAuth();

    return () => {
      if (authUnsubscribe) {
        authUnsubscribe();
      }
    };
  }, [navigateToHome]);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await firebaseAuthApi.login(credentials);
      
      setUser(response.user);
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (credentials: SignupCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await firebaseAuthApi.signup(credentials);
      
      setUser(response.user);
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Google function
  const signInWithGoogle = async (): Promise<void> => {
    try {
      const response = await firebaseAuthApi.signInWithGoogle();

      setUser(response.user);

      // Redirect to home page
      router.push('/');
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      // Special case: if redirect is in progress, don't throw error
      // The page will redirect away, so we just return normally
      if (error?.message === 'REDIRECT_IN_PROGRESS') {
        // Just return - the browser will redirect and page will reload
        return;
      }

      // For all other errors, throw so the UI can handle them
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Call logout API
      await firebaseAuthApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call result
      setUser(null);
      // Send user to landing page which includes sign in/up
      router.push('/');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
