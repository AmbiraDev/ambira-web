import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { mockAuthApi } from '@/lib/mockApi';

// Mock the mockApi
jest.mock('@/lib/mockApi', () => ({
  mockAuthApi: {
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    verifyToken: jest.fn(),
  },
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, signup, logout } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="isLoading">{isLoading.toString()}</div>
      <button onClick={() => login({ email: 'test@test.com', password: 'password' })}>
        Login
      </button>
      <button onClick={() => signup({ email: 'test@test.com', password: 'password', name: 'Test User', username: 'testuser' })}>
        Signup
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  it('should provide initial state correctly', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('isLoading')).toHaveTextContent('true');
  });

  it('should handle successful login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      name: 'Test User',
      username: 'testuser',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockResponse = {
      user: mockUser,
      token: 'mock-token',
    };

    (mockAuthApi.login as jest.Mock).mockResolvedValue(mockResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    const loginButton = screen.getByText('Login');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(mockAuthApi.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should handle login error', async () => {
    const error = new Error('Invalid credentials');
    (mockAuthApi.login as jest.Mock).mockRejectedValue(error);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    const loginButton = screen.getByText('Login');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(mockAuthApi.login).toHaveBeenCalled();
    });

    // Should not redirect on error
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should handle successful signup', async () => {
    const mockUser = {
      id: '2',
      email: 'new@test.com',
      name: 'New User',
      username: 'newuser',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockResponse = {
      user: mockUser,
      token: 'mock-token-2',
    };

    (mockAuthApi.signup as jest.Mock).mockResolvedValue(mockResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    const signupButton = screen.getByText('Signup');
    await userEvent.click(signupButton);

    await waitFor(() => {
      expect(mockAuthApi.signup).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password',
        name: 'Test User',
        username: 'testuser',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('New User');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should handle signup error', async () => {
    const error = new Error('Email already exists');
    (mockAuthApi.signup as jest.Mock).mockRejectedValue(error);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    const signupButton = screen.getByText('Signup');
    await userEvent.click(signupButton);

    await waitFor(() => {
      expect(mockAuthApi.signup).toHaveBeenCalled();
    });

    // Should not redirect on error
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should handle logout', async () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      name: 'Test User',
      username: 'testuser',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockResponse = {
      user: mockUser,
      token: 'mock-token',
    };

    (mockAuthApi.login as jest.Mock).mockResolvedValue(mockResponse);
    (mockAuthApi.logout as jest.Mock).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // First login
    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    const loginButton = screen.getByText('Login');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });

    // Then logout
    const logoutButton = screen.getByText('Logout');
    await userEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockAuthApi.logout).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should initialize with existing token', async () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      name: 'Test User',
      username: 'testuser',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockAuthApi.verifyToken as jest.Mock).mockResolvedValue(true);
    (mockAuthApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    // Mock the API to return a token
    const mockApi = require('@/lib/api');
    mockApi.authApi.getToken = jest.fn().mockReturnValue('existing-token');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });
  });
});
