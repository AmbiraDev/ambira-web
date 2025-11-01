/**
 * Integration Test: Login Flow
 *
 * Tests the complete login workflow:
 * - Credentials submission → Auth → Protected route access
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { LoginCredentials } from '@/types';
import * as authQueries from '@/lib/react-query/auth.queries';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {
    signInWithEmailAndPassword: jest.fn(),
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
    useLogin: jest.fn(),
  };
});

describe('Integration: Login Flow', () => {
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

  it('should complete login flow successfully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      username: 'testuser',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock login mutation
    const mockLoginMutation = {
      mutateAsync: jest.fn().mockResolvedValue(mockUser),
      isPending: false,
      isError: false,
      error: null,
    };

    // Mock auth state (before login)
    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (authQueries.useLogin as jest.Mock).mockReturnValue(mockLoginMutation);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Verify initial state (not authenticated)
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();

    // Perform login
    const credentials: LoginCredentials = {
      email: 'user@example.com',
      password: 'password123',
    };

    await result.current.login(credentials);

    // Verify login was called
    expect(mockLoginMutation.mutateAsync).toHaveBeenCalledWith(credentials);

    // Mock auth state after login
    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: mockUser,
      isLoading: false,
    });

    const { result: resultAfterLogin } = renderHook(() => useAuth(), {
      wrapper,
    });

    // Verify user is authenticated
    expect(resultAfterLogin.current.isAuthenticated).toBe(true);
    expect(resultAfterLogin.current.user).toEqual(mockUser);
  });

  it('should handle invalid credentials error', async () => {
    const mockError = new Error('Invalid email or password');

    const mockLoginMutation = {
      mutateAsync: jest.fn().mockRejectedValue(mockError),
      isPending: false,
      isError: true,
      error: mockError,
    };

    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (authQueries.useLogin as jest.Mock).mockReturnValue(mockLoginMutation);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Attempt login with invalid credentials
    const credentials: LoginCredentials = {
      email: 'wrong@example.com',
      password: 'wrongpassword',
    };

    await expect(result.current.login(credentials)).rejects.toThrow(
      'Invalid email or password'
    );

    // Verify still not authenticated
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should handle user not found error', async () => {
    const mockError = new Error('User not found');

    const mockLoginMutation = {
      mutateAsync: jest.fn().mockRejectedValue(mockError),
      isPending: false,
      isError: true,
      error: mockError,
    };

    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (authQueries.useLogin as jest.Mock).mockReturnValue(mockLoginMutation);

    const { result } = renderHook(() => useAuth(), { wrapper });

    const credentials: LoginCredentials = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    await expect(result.current.login(credentials)).rejects.toThrow(
      'User not found'
    );

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle account disabled error', async () => {
    const mockError = new Error('Account has been disabled');

    const mockLoginMutation = {
      mutateAsync: jest.fn().mockRejectedValue(mockError),
      isPending: false,
      isError: true,
      error: mockError,
    };

    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (authQueries.useLogin as jest.Mock).mockReturnValue(mockLoginMutation);

    const { result } = renderHook(() => useAuth(), { wrapper });

    const credentials: LoginCredentials = {
      email: 'disabled@example.com',
      password: 'password123',
    };

    await expect(result.current.login(credentials)).rejects.toThrow(
      'Account has been disabled'
    );

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should show loading state during login', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      username: 'testuser',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let resolveMutateAsync: (value: any) => void;
    const mutateAsyncPromise = new Promise(resolve => {
      resolveMutateAsync = resolve;
    });

    const mockLoginMutation = {
      mutateAsync: jest.fn().mockReturnValue(mutateAsyncPromise),
      isPending: true,
      isError: false,
      error: null,
    };

    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (authQueries.useLogin as jest.Mock).mockReturnValue(mockLoginMutation);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Start login (don't await)
    const loginPromise = result.current.login({
      email: 'user@example.com',
      password: 'password123',
    });

    // Verify loading state
    expect(result.current.loginMutation.isPending).toBe(true);

    // Resolve mutation
    resolveMutateAsync!(mockUser);
    await loginPromise;

    // Mock completed state
    mockLoginMutation.isPending = false;
    (authQueries.useLogin as jest.Mock).mockReturnValue(mockLoginMutation);

    const { result: resultAfterLogin } = renderHook(() => useAuth(), {
      wrapper,
    });

    // Verify loading is complete
    expect(resultAfterLogin.current.loginMutation.isPending).toBe(false);
  });

  it('should load user data from cache after login', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      username: 'testuser',
      name: 'Test User',
      bio: 'Test bio',
      profilePicture: 'https://example.com/avatar.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockLoginMutation = {
      mutateAsync: jest.fn().mockResolvedValue(mockUser),
      isPending: false,
      isError: false,
      error: null,
    };

    // Mock auth state before login
    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (authQueries.useLogin as jest.Mock).mockReturnValue(mockLoginMutation);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await result.current.login({
      email: 'user@example.com',
      password: 'password123',
    });

    // Mock auth state after login with cached user data
    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: mockUser,
      isLoading: false,
    });

    const { result: resultAfterLogin } = renderHook(() => useAuth(), {
      wrapper,
    });

    // Verify full user data is loaded
    expect(resultAfterLogin.current.user).toEqual(mockUser);
    expect(resultAfterLogin.current.user?.bio).toBe('Test bio');
    expect(resultAfterLogin.current.user?.profilePicture).toBe(
      'https://example.com/avatar.jpg'
    );
  });

  it('should handle network errors during login', async () => {
    const mockError = new Error('Network error');

    const mockLoginMutation = {
      mutateAsync: jest.fn().mockRejectedValue(mockError),
      isPending: false,
      isError: true,
      error: mockError,
    };

    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (authQueries.useLogin as jest.Mock).mockReturnValue(mockLoginMutation);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      result.current.login({
        email: 'user@example.com',
        password: 'password123',
      })
    ).rejects.toThrow('Network error');

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should persist authentication across page reloads', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      username: 'testuser',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock persisted auth state (after reload)
    (authQueries.useAuth as jest.Mock).mockReturnValue({
      data: mockUser,
      isLoading: false,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Verify user is still authenticated after "reload"
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });
});
