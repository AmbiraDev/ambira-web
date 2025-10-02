'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContextType, AuthUser, LoginCredentials, SignupCredentials } from '@/types';
import { authApi } from '@/lib/api';
import { mockAuthApi } from '@/lib/mockApi';

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
    const initializeAuth = async () => {
      try {
        const token = authApi.getToken();
        if (token) {
          // Verify token and get user data
          const isValid = await mockAuthApi.verifyToken(token);
          if (isValid) {
            const userData = await mockAuthApi.getCurrentUser(token);
            setUser(userData);
          } else {
            // Token is invalid, clear it
            authApi.clearToken();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authApi.clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Use mock API for now
      const response = await mockAuthApi.login(credentials);
      
      // Store token and user data
      authApi.setToken(response.token);
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
      
      // Use mock API for now
      const response = await mockAuthApi.signup(credentials);
      
      // Store token and user data
      authApi.setToken(response.token);
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

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Call logout API
      await mockAuthApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call result
      authApi.clearToken();
      setUser(null);
      router.push('/login');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
