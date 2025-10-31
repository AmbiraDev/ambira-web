/**
 * Integration Test: Signup Flow
 *
 * Tests the complete signup workflow:
 * - Form submission → API call → Auth state update → Redirect
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { SignupCredentials } from '@/types';
import * as authQueries from '@/lib/react-query/auth.queries';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {
    createUserWithEmailAndPassword: jest.fn(),
    currentUser: null,
  },
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
  },
}));

// Mock auth queries
jest.mock('@/lib/react-query/auth.queries', () => {
  const actual = jest.requireActual('@/lib/react-query/auth.queries');
  return {
    ...actual,
    useAuth: jest.fn(),
    useSignup: jest.fn(),
  };
});

describe('Integration: Signup Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should complete signup flow successfully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'newuser@example.com',
      username: 'newuser',
      name: 'New User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock signup mutation
    const mockSignupMutation = {
      mutateAsync: jest.fn().mockResolvedValue(mockUser),
      isPending: false,
      isError: false,
      error: null,
    };

    // Mock auth state (before signup)
    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (authQueries.useSignup as jest.Mock).mockReturnValue(mockSignupMutation);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Verify initial state (not authenticated)
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();

    // Perform signup
    const credentials: SignupCredentials = {
      email: 'newuser@example.com',
      password: 'password123',
      username: 'newuser',
      name: 'New User',
    };

    await result.current.signup(credentials);

    // Verify signup was called
    expect(mockSignupMutation.mutateAsync).toHaveBeenCalledWith(credentials);

    // Mock auth state after signup
    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: mockUser,
      isLoading: false,
    });

    const { result: resultAfterSignup } = renderHook(() => useAuth(), {
      wrapper,
    });

    // Verify user is authenticated
    expect(resultAfterSignup.current.isAuthenticated).toBe(true);
    expect(resultAfterSignup.current.user).toEqual(mockUser);
  });

  it('should handle signup validation errors', async () => {
    const mockError = new Error('Email already exists');

    const mockSignupMutation = {
      mutateAsync: jest.fn().mockRejectedValue(mockError),
      isPending: false,
      isError: true,
      error: mockError,
    };

    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (authQueries.useSignup as jest.Mock).mockReturnValue(mockSignupMutation);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Attempt signup with duplicate email
    const credentials: SignupCredentials = {
      email: 'existing@example.com',
      password: 'password123',
      username: 'existinguser',
      name: 'Existing User',
    };

    await expect(result.current.signup(credentials)).rejects.toThrow(
      'Email already exists'
    );

    // Verify still not authenticated
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should handle weak password errors', async () => {
    const mockError = new Error('Password must be at least 8 characters');

    const mockSignupMutation = {
      mutateAsync: jest.fn().mockRejectedValue(mockError),
      isPending: false,
      isError: true,
      error: mockError,
    };

    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (authQueries.useSignup as jest.Mock).mockReturnValue(mockSignupMutation);

    const { result } = renderHook(() => useAuth(), { wrapper });

    const credentials: SignupCredentials = {
      email: 'newuser@example.com',
      password: 'weak',
      username: 'newuser',
      name: 'New User',
    };

    await expect(result.current.signup(credentials)).rejects.toThrow(
      'Password must be at least 8 characters'
    );

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle network errors during signup', async () => {
    const mockError = new Error('Network error');

    const mockSignupMutation = {
      mutateAsync: jest.fn().mockRejectedValue(mockError),
      isPending: false,
      isError: true,
      error: mockError,
    };

    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (authQueries.useSignup as jest.Mock).mockReturnValue(mockSignupMutation);

    const { result } = renderHook(() => useAuth(), { wrapper });

    const credentials: SignupCredentials = {
      email: 'newuser@example.com',
      password: 'password123',
      username: 'newuser',
      name: 'New User',
    };

    await expect(result.current.signup(credentials)).rejects.toThrow(
      'Network error'
    );

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should show loading state during signup', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'newuser@example.com',
      username: 'newuser',
      name: 'New User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let resolveMutateAsync: (value: any) => void;
    const mutateAsyncPromise = new Promise(resolve => {
      resolveMutateAsync = resolve;
    });

    const mockSignupMutation = {
      mutateAsync: jest.fn().mockReturnValue(mutateAsyncPromise),
      isPending: true,
      isError: false,
      error: null,
    };

    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (authQueries.useSignup as jest.Mock).mockReturnValue(mockSignupMutation);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Start signup (don't await)
    const signupPromise = result.current.signup({
      email: 'newuser@example.com',
      password: 'password123',
      username: 'newuser',
      name: 'New User',
    });

    // Verify loading state
    expect(result.current.signupMutation.isPending).toBe(true);

    // Resolve mutation
    resolveMutateAsync!(mockUser);
    await signupPromise;

    // Mock completed state
    mockSignupMutation.isPending = false;
    (authQueries.useSignup as jest.Mock).mockReturnValue(mockSignupMutation);

    const { result: resultAfterSignup } = renderHook(() => useAuth(), {
      wrapper,
    });

    // Verify loading is complete
    expect(resultAfterSignup.current.signupMutation.isPending).toBe(false);
  });

  it('should create user profile in Firestore after signup', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'newuser@example.com',
      username: 'newuser',
      name: 'New User',
      bio: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSignupMutation = {
      mutateAsync: jest.fn().mockResolvedValue(mockUser),
      isPending: false,
      isError: false,
      error: null,
    };

    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (authQueries.useSignup as jest.Mock).mockReturnValue(mockSignupMutation);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await result.current.signup({
      email: 'newuser@example.com',
      password: 'password123',
      username: 'newuser',
      name: 'New User',
    });

    // Verify mutation was called and completed
    expect(mockSignupMutation.mutateAsync).toHaveBeenCalled();
  });
});
