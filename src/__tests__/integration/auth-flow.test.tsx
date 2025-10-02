import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginForm } from '@/components/LoginForm';
import { SignupForm } from '@/components/SignupForm';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/protected',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the API
jest.mock('@/lib/api', () => ({
  authApi: {
    setToken: jest.fn(),
    clearToken: jest.fn(),
    getToken: jest.fn(),
  },
}));

// Mock the mock API
jest.mock('@/lib/mockApi', () => ({
  mockAuthApi: {
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    verifyToken: jest.fn(),
  },
}));

const { mockAuthApi } = require('@/lib/mockApi');

// Test components
const ProtectedContent = () => <div data-testid="protected-content">Protected Content</div>;

const AuthTestApp = () => (
  <AuthProvider>
    <div>
      <ProtectedRoute>
        <ProtectedContent />
      </ProtectedRoute>
      <LoginForm />
      <SignupForm />
    </div>
  </AuthProvider>
);

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Complete Signup Flow', () => {
    it('should complete full signup flow', async () => {
      const user = userEvent.setup();
      
      const mockUser = {
        id: '1',
        email: 'newuser@test.com',
        name: 'New User',
        username: 'newuser',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        user: mockUser,
        token: 'mock-token',
      };

      mockAuthApi.signup.mockResolvedValue(mockResponse);
      mockAuthApi.verifyToken.mockResolvedValue(true);
      mockAuthApi.getCurrentUser.mockResolvedValue(mockUser);

      render(<AuthTestApp />);

      // Should initially show login form (not authenticated)
      expect(screen.getByText('Sign in to Ambira')).toBeInTheDocument();

      // Fill out signup form
      const nameInput = screen.getByLabelText(/full name/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const signupButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'New User');
      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@test.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(signupButton);

      // Should show loading state
      expect(screen.getByText('Creating account...')).toBeInTheDocument();

      // Wait for signup to complete
      await waitFor(() => {
        expect(mockAuthApi.signup).toHaveBeenCalledWith({
          email: 'newuser@test.com',
          password: 'password123',
          name: 'New User',
          username: 'newuser',
        });
      });

      // Should redirect to home
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should handle signup errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockAuthApi.signup.mockRejectedValue(new Error('Email already exists'));

      render(<AuthTestApp />);

      // Fill out signup form with existing email
      const nameInput = screen.getByLabelText(/full name/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const signupButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'Test User');
      await user.type(usernameInput, 'testuser');
      await user.type(emailInput, 'existing@test.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(signupButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Complete Login Flow', () => {
    it('should complete full login flow', async () => {
      const user = userEvent.setup();
      
      const mockUser = {
        id: '1',
        email: 'demo@ambira.com',
        name: 'Demo User',
        username: 'demo',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        user: mockUser,
        token: 'mock-token',
      };

      mockAuthApi.login.mockResolvedValue(mockResponse);
      mockAuthApi.verifyToken.mockResolvedValue(true);
      mockAuthApi.getCurrentUser.mockResolvedValue(mockUser);

      render(<AuthTestApp />);

      // Fill out login form
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'demo@ambira.com');
      await user.type(passwordInput, 'anypassword');
      await user.click(loginButton);

      // Should show loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument();

      // Wait for login to complete
      await waitFor(() => {
        expect(mockAuthApi.login).toHaveBeenCalledWith({
          email: 'demo@ambira.com',
          password: 'anypassword',
        });
      });

      // Should redirect to home
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should handle login errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockAuthApi.login.mockRejectedValue(new Error('Invalid credentials'));

      render(<AuthTestApp />);

      // Fill out login form with wrong credentials
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'demo@ambira.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(loginButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Protected Route Flow', () => {
    it('should redirect unauthenticated users to login', async () => {
      mockAuthApi.verifyToken.mockResolvedValue(false);

      render(<AuthTestApp />);

      // Should redirect to login with redirect parameter
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Fprotected');
      });

      // Should not show protected content
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should allow authenticated users to access protected routes', async () => {
      const mockUser = {
        id: '1',
        email: 'demo@ambira.com',
        name: 'Demo User',
        username: 'demo',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthApi.getToken.mockReturnValue('valid-token');
      mockAuthApi.verifyToken.mockResolvedValue(true);
      mockAuthApi.getCurrentUser.mockResolvedValue(mockUser);

      render(<AuthTestApp />);

      // Should show protected content
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Logout Flow', () => {
    it('should complete logout flow', async () => {
      const user = userEvent.setup();
      
      const mockUser = {
        id: '1',
        email: 'demo@ambira.com',
        name: 'Demo User',
        username: 'demo',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Start authenticated
      mockAuthApi.getToken.mockReturnValue('valid-token');
      mockAuthApi.verifyToken.mockResolvedValue(true);
      mockAuthApi.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthApi.logout.mockResolvedValue(undefined);

      render(<AuthTestApp />);

      // Should show protected content initially
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      // Find and click logout button (assuming it's in the protected content)
      const logoutButton = screen.getByText('Logout');
      await user.click(logoutButton);

      // Should call logout API
      await waitFor(() => {
        expect(mockAuthApi.logout).toHaveBeenCalled();
      });

      // Should redirect to login
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Form Validation Integration', () => {
    it('should validate login form properly', async () => {
      const user = userEvent.setup();
      render(<AuthTestApp />);

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(loginButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      // Should not call API
      expect(mockAuthApi.login).not.toHaveBeenCalled();
    });

    it('should validate signup form properly', async () => {
      const user = userEvent.setup();
      render(<AuthTestApp />);

      const signupButton = screen.getByRole('button', { name: /create account/i });
      await user.click(signupButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Username is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
        expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
      });

      // Should not call API
      expect(mockAuthApi.signup).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockAuthApi.login.mockRejectedValue(new Error('Network error'));

      render(<AuthTestApp />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@test.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle API timeout gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock a timeout
      mockAuthApi.login.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      render(<AuthTestApp />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@test.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Request timeout')).toBeInTheDocument();
      });
    });
  });
});
