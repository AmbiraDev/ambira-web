/**
 * React Query Auth Hooks
 *
 * This module provides React Query hooks for authentication state management.
 * This is the ONLY place where React Query is used for authentication functionality.
 *
 * CRITICAL PATTERNS:
 * - Firebase onAuthStateChanged listener updates React Query cache
 * - Auth state cached with infinite staleTime (managed by Firebase listener)
 * - All mutations (login, signup, logout) update cache optimistically
 * - Handles OAuth redirect flows and session persistence
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { firebaseAuthApi } from '@/lib/api/auth';
import type { AuthUser, LoginCredentials, SignupCredentials } from '@/types';

/**
 * Cache Keys for Auth
 * Hierarchical structure for efficient cache invalidation
 */
export const AUTH_KEYS = {
  all: () => ['auth'] as const,
  session: () => [...AUTH_KEYS.all(), 'session'] as const,
  user: (userId: string) => [...AUTH_KEYS.all(), 'user', userId] as const,
} as const;

/**
 * Hook to get current auth state from React Query cache
 *
 * This hook reads from the cache that's updated by Firebase onAuthStateChanged.
 * It does NOT make a direct Firebase call on every render.
 *
 * The cache is updated by AuthInitializer component's Firebase listener.
 */
export function useAuth() {
  return useQuery({
    queryKey: AUTH_KEYS.session(),
    queryFn: async () => {
      // This is only called on initial mount or when cache is invalidated
      try {
        return await firebaseAuthApi.getCurrentUser();
      } catch (_error) {
        // User is not authenticated
        return null;
      }
    },
    staleTime: Infinity, // Never auto-refetch - managed by Firebase listener
    retry: false, // Don't retry auth checks
    refetchOnWindowFocus: false, // Firebase listener handles this
    refetchOnMount: false, // Firebase listener handles this
    refetchOnReconnect: false, // Firebase listener handles this
  });
}

/**
 * Login mutation
 * Logs in with email/password and updates auth cache
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      return await firebaseAuthApi.login(credentials);
    },
    onSuccess: data => {
      // Update auth cache with logged-in user
      queryClient.setQueryData(AUTH_KEYS.session(), data.user);

      // Navigate to home
      router.push('/');
    },
    onError: error => {
      // Error is already formatted by firebaseAuthApi
      console.error('[useLogin] Login failed:', error);
    },
  });
}

/**
 * Signup mutation
 * Creates new account and updates auth cache
 */
export function useSignup() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: SignupCredentials) => {
      return await firebaseAuthApi.signup(credentials);
    },
    onSuccess: data => {
      // Update auth cache with new user
      queryClient.setQueryData(AUTH_KEYS.session(), data.user);

      // Navigate to home
      router.push('/');
    },
    onError: error => {
      console.error('[useSignup] Signup failed:', error);
    },
  });
}

/**
 * Google Sign-In mutation
 * Handles Google OAuth popup flow
 */
export function useGoogleSignIn() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      return await firebaseAuthApi.signInWithGoogle();
    },
    onSuccess: data => {
      // Update auth cache with Google user
      queryClient.setQueryData(AUTH_KEYS.session(), data.user);

      // Navigate to home
      router.push('/');
    },
    onError: (error: any) => {
      // Special case: redirect in progress (mobile OAuth)
      if (error?.message === 'REDIRECT_IN_PROGRESS') {
        // Don't show error - page will redirect
        return;
      }
      console.error('[useGoogleSignIn] Google sign-in failed:', error);
    },
  });
}

/**
 * Logout mutation
 * Signs out and clears all user-specific caches
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      await firebaseAuthApi.logout();
    },
    onMutate: async () => {
      // Optimistically clear auth state
      queryClient.setQueryData(AUTH_KEYS.session(), null);
    },
    onSuccess: () => {
      // Clear ALL caches (user-specific data should not persist)
      queryClient.clear();

      // Ensure auth cache is null
      queryClient.setQueryData(AUTH_KEYS.session(), null);

      // Navigate to landing page
      router.push('/');
    },
    onError: error => {
      console.error('[useLogout] Logout failed:', error);

      // Still navigate and clear cache even on error
      queryClient.clear();
      queryClient.setQueryData(AUTH_KEYS.session(), null);
      router.push('/');
    },
  });
}

/**
 * Update profile mutation
 * Updates user profile and refreshes auth cache
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<AuthUser>) => {
      // This would call firebaseUserApi.updateProfile
      // For now, just return the updated user
      const currentUser = queryClient.getQueryData<AuthUser>(
        AUTH_KEYS.session()
      );
      if (!currentUser) {
        throw new Error('Not authenticated');
      }
      return { ...currentUser, ...updates };
    },
    onSuccess: updatedUser => {
      // Update auth cache
      queryClient.setQueryData(AUTH_KEYS.session(), updatedUser);
    },
  });
}

/**
 * Delete account mutation
 * Deletes user account and clears all caches
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      // This would call firebaseUserApi.deleteAccount
      // For now, just logout
      await firebaseAuthApi.logout();
    },
    onSuccess: () => {
      // Clear all caches
      queryClient.clear();
      queryClient.setQueryData(AUTH_KEYS.session(), null);

      // Navigate to landing
      router.push('/');
    },
  });
}

/**
 * Check username availability
 * Used during signup to validate username
 */
export function useCheckUsernameAvailability() {
  return useMutation({
    mutationFn: async (username: string) => {
      return await firebaseAuthApi.checkUsernameAvailability(username);
    },
  });
}
