'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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

  // Initialize auth state on mount
  useEffect(() => {
    let authUnsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {
      console.log('[AuthContext] ========================================');
      console.log('[AuthContext] Initializing auth...');
      console.log('[AuthContext] Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
      console.log('[AuthContext] ========================================');

      // Check for Google redirect result FIRST (important for mobile sign-in)
      // This MUST happen before setting up the auth listener because getRedirectResult
      // can only be called once per redirect
      try {
        console.log('[AuthContext] Checking for Google redirect result...');
        const redirectResult = await firebaseAuthApi.handleGoogleRedirectResult();
        console.log('[AuthContext] Redirect result received:', redirectResult);

        if (redirectResult) {
          console.log('[AuthContext] ✅ Google redirect sign-in successful!');
          console.log('[AuthContext] User data:', {
            id: redirectResult.user.id,
            email: redirectResult.user.email,
            username: redirectResult.user.username,
            name: redirectResult.user.name
          });
          redirectHandledRef.current = true;
          // Set user immediately and stop loading
          setUser(redirectResult.user);
          setIsLoading(false);
          // Don't navigate yet - let the auth state listener handle it
          console.log('[AuthContext] Redirect user set, setting up listener...');
        } else {
          console.log('[AuthContext] ❌ No redirect result found (redirectResult is null)');
        }
      } catch (error) {
        console.error('[AuthContext] ❌ Google redirect result ERROR:', error);
        console.error('[AuthContext] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        // Continue with normal auth flow even if redirect check fails
      }

      // Set up the auth state listener
      console.log('[AuthContext] Setting up auth state listener...');
      authUnsubscribe = firebaseAuthApi.onAuthStateChanged(async (firebaseUser) => {
        console.log('[AuthContext] Auth state changed. FirebaseUser:', firebaseUser ? firebaseUser.uid : 'null');

        // If we already handled the redirect, skip the auth state listener
        if (redirectHandledRef.current) {
          console.log('[AuthContext] Skipping auth state change - redirect already handled');
          setIsLoading(false);
          return;
        }

        try {
          if (firebaseUser) {
            const userData = await firebaseAuthApi.getCurrentUser();
            console.log('[AuthContext] User data loaded for:', userData.username);
            setUser(userData);
          } else {
            console.log('[AuthContext] User signed out');
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
  }, [router]);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await firebaseAuthApi.login(credentials);
      console.log('Login response:', response);
      
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
      setIsLoading(true);

      const response = await firebaseAuthApi.signInWithGoogle();
      console.log('Google sign-in response:', response);

      setUser(response.user);

      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
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
