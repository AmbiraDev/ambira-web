/**
 * Unified Auth Hook
 *
 * This hook provides the complete auth API that components consume.
 * It replaces the old AuthContext with React Query-based auth state.
 *
 * BACKWARD COMPATIBILITY:
 * - Maintains the same API shape as the old AuthContext
 * - Components can switch with minimal changes
 * - All auth state comes from React Query cache
 *
 * USAGE:
 * ```typescript
 * const { user, isAuthenticated, isLoading, login, logout } = useAuth();
 * ```
 */

import {
  useAuth as useAuthQuery,
  useLogin,
  useSignup,
  useGoogleSignIn,
  useLogout,
} from '@/lib/react-query/auth.queries';
import type { LoginCredentials, SignupCredentials } from '@/types';

export function useAuth() {
  // Get auth state from React Query
  const { data: user, isLoading } = useAuthQuery();

  // Get mutations
  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const googleSignInMutation = useGoogleSignIn();
  const logoutMutation = useLogout();

  // Derived state
  const isAuthenticated = !!user;

  return {
    // State
    user: user || null,
    currentUser: user || null, // Alias for backward compatibility
    isAuthenticated,
    isLoading,

    // Mutations with Promise API (matches old context)
    login: async (credentials: LoginCredentials): Promise<void> => {
      await loginMutation.mutateAsync(credentials);
    },

    signup: async (credentials: SignupCredentials): Promise<void> => {
      await signupMutation.mutateAsync(credentials);
    },

    signInWithGoogle: async (): Promise<void> => {
      await googleSignInMutation.mutateAsync();
    },

    logout: async (): Promise<void> => {
      await logoutMutation.mutateAsync();
    },

    // Mutation states (for loading/error UI)
    loginMutation,
    signupMutation,
    googleSignInMutation,
    logoutMutation,
  };
}

/**
 * Backward compatibility export
 * Some files may import { useAuth } from '@/contexts/AuthContext'
 * This ensures they can switch to '@/hooks/useAuth' seamlessly
 */
export { useAuth as default };
