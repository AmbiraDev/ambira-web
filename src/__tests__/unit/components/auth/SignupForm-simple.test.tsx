import React from 'react';
import { render, screen } from '@testing-library/react';
import { SignupForm } from '@/components/SignupForm';

// Mock the auth context
const mockSignup = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
  }),
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('SignupForm - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  it('should render signup form with all required fields', () => {
    render(<SignupForm />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    expect(() => {
      render(<SignupForm />);
    }).not.toThrow();
  });

  it('should have proper form accessibility', () => {
    render(<SignupForm />);

    const nameInput = screen.getByLabelText(/full name/i);
    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    expect(nameInput).toHaveAttribute('type', 'text');
    expect(nameInput).toHaveAttribute('autocomplete', 'name');
    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(usernameInput).toHaveAttribute('autocomplete', 'username');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('autocomplete', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('autocomplete', 'new-password');
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should have login link', () => {
    render(<SignupForm />);

    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
