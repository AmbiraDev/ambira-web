'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Initialize auth state on mount
  useEffect(() => {
    const unsubscribe = firebaseAuthApi.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('Firebase user authenticated:', firebaseUser.uid);
          const userData = await firebaseAuthApi.getCurrentUser();
          console.log('User data loaded:', userData);
          setUser(userData);
        } else {
          console.log('No Firebase user authenticated');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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
