import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/protected-page',
}));

// Mock the auth hook
jest.mock('@/hooks/useAuth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Test component to render inside ProtectedRoute
const TestComponent = () => (
  <div data-testid="protected-content">Protected Content</div>
);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  it('should render children when user is authenticated', async () => {
    (mockUseAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user' },
      currentUser: { id: 'test-user' },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      loginMutation: {},
      signupMutation: {},
      googleSignInMutation: {},
      logoutMutation: {},
    } as any);

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated', async () => {
    (mockUseAuth as jest.Mock).mockReturnValue({
      user: null,
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      loginMutation: {},
      signupMutation: {},
      googleSignInMutation: {},
      logoutMutation: {},
    } as any);

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/?redirect=%2Fprotected-page');
    });

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should show loading spinner while checking authentication', () => {
    (mockUseAuth as jest.Mock).mockReturnValue({
      user: null,
      currentUser: null,
      isAuthenticated: false,
      isLoading: true,
      login: jest.fn(),
      signup: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      loginMutation: {},
      signupMutation: {},
      googleSignInMutation: {},
      logoutMutation: {},
    } as any);

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should show loading spinner while checking authentication status', () => {
    (mockUseAuth as jest.Mock).mockReturnValue({
      user: null,
      currentUser: null,
      isAuthenticated: false,
      isLoading: true,
      login: jest.fn(),
      signup: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      loginMutation: {},
      signupMutation: {},
      googleSignInMutation: {},
      logoutMutation: {},
    } as any);

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should not render children when not authenticated', async () => {
    (mockUseAuth as jest.Mock).mockReturnValue({
      user: null,
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      loginMutation: {},
      signupMutation: {},
      googleSignInMutation: {},
      logoutMutation: {},
    } as any);

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('should handle authentication state changes', async () => {
    // Start with loading
    (mockUseAuth as jest.Mock).mockReturnValue({
      user: null,
      currentUser: null,
      isAuthenticated: false,
      isLoading: true,
      login: jest.fn(),
      signup: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      loginMutation: {},
      signupMutation: {},
      googleSignInMutation: {},
      logoutMutation: {},
    } as any);

    const { rerender } = render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Then become authenticated
    (mockUseAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user' },
      currentUser: { id: 'test-user' },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      loginMutation: {},
      signupMutation: {},
      googleSignInMutation: {},
      logoutMutation: {},
    } as any);

    rerender(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should handle authentication state changes to unauthenticated', async () => {
    // Start with loading
    (mockUseAuth as jest.Mock).mockReturnValue({
      user: null,
      currentUser: null,
      isAuthenticated: false,
      isLoading: true,
      login: jest.fn(),
      signup: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      loginMutation: {},
      signupMutation: {},
      googleSignInMutation: {},
      logoutMutation: {},
    } as any);

    const { rerender } = render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Then become unauthenticated
    (mockUseAuth as jest.Mock).mockReturnValue({
      user: null,
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      loginMutation: {},
      signupMutation: {},
      googleSignInMutation: {},
      logoutMutation: {},
    } as any);

    rerender(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/?redirect=%2Fprotected-page');
    });

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should preserve redirect URL with special characters', async () => {
    // Mock a different pathname with special characters
    jest.doMock('next/navigation', () => ({
      useRouter: () => ({
        push: mockPush,
      }),
      usePathname: () => '/protected-page?param=value&other=test',
    }));

    (mockUseAuth as jest.Mock).mockReturnValue({
      user: null,
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      loginMutation: {},
      signupMutation: {},
      googleSignInMutation: {},
      logoutMutation: {},
    } as any);

    render(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/?redirect=%2Fprotected-page');
    });
  });
});
