'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoginCredentials } from '@/types';

export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginCredentials>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear field-specific error when user starts typing
    if (errors[name as keyof LoginCredentials]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Clear submit error
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginCredentials> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await login(formData);

      // Check for invite context in sessionStorage
      const inviteContextStr =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('inviteContext')
          : null;

      if (inviteContextStr) {
        try {
          const inviteContext = JSON.parse(inviteContextStr);

          // Clear the invite context
          sessionStorage.removeItem('inviteContext');

          // Redirect based on invite type
          if (inviteContext.type === 'group' && inviteContext.groupId) {
            router.push(`/invite/group/${inviteContext.groupId}`);
            return;
          }
        } catch (error) {
          console.error('Error parsing invite context:', error);
        }
      }

      // Get redirect URL from query params
      const redirectTo = searchParams.get('redirect') || '/';
      router.push(redirectTo);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Login failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {submitError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {submitError}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-md shadow-sm placeholder-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.email ? 'border-destructive' : 'border-border'
            }`}
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="mt-2 text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-md shadow-sm placeholder-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.password ? 'border-destructive' : 'border-border'
            }`}
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="mt-2 text-sm text-destructive">{errors.password}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Signing in...
            </div>
          ) : (
            'Sign in'
          )}
        </button>

        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <a
              href="/signup"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </form>
  );
};
