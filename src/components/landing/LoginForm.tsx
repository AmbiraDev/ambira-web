import React from 'react';
import { GoogleAuthButton } from './GoogleAuthButton';

interface LoginFormProps {
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loginData: {
    email: string;
    password: string;
  };
  loginErrors: {
    email?: string;
    password?: string;
  };
  error: string | null;
  isLoading: boolean;
  isMobile?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onGoogleSignIn,
  onChange,
  loginData,
  loginErrors,
  error,
  isLoading,
  isMobile = false,
}) => {
  return (
    <form onSubmit={onSubmit} className={isMobile ? 'space-y-3' : 'space-y-6'}>
      {/* Google Sign-In Button */}
      <GoogleAuthButton
        onClick={onGoogleSignIn}
        disabled={isLoading}
        buttonText="Continue with Google"
        className={isMobile ? 'py-3 text-sm' : 'px-6 py-4 text-lg'}
      />

      {/* Divider */}
      <div className={`flex items-center gap-3 ${isMobile ? 'my-3' : 'my-4'}`}>
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-gray-500 text-xs md:text-sm">or</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor={isMobile ? 'mobile-login-email' : 'login_email'}
          className={`block font-medium text-gray-700 ${isMobile ? 'text-xs mb-1' : 'text-sm mb-2'}`}
        >
          Email{isMobile ? '' : ' address'}
        </label>
        <input
          id={isMobile ? 'mobile-login-email' : 'login_email'}
          name="email"
          type="email"
          autoComplete="email"
          value={loginData.email}
          onChange={onChange}
          className={`w-full border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 ${
            loginErrors.email ? 'border-red-300' : 'border-gray-300'
          } ${isMobile ? 'px-3 py-2.5 text-base' : 'px-4 py-4 text-lg'}`}
          placeholder={isMobile ? 'Email' : 'Enter your email'}
        />
        {loginErrors.email && (
          <p className={`mt-${isMobile ? '1' : '2'} text-sm text-red-600`}>
            {loginErrors.email}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor={isMobile ? 'mobile-login-password' : 'login_password'}
          className={`block font-medium text-gray-700 ${isMobile ? 'text-xs mb-1' : 'text-sm mb-2'}`}
        >
          Password
        </label>
        <input
          id={isMobile ? 'mobile-login-password' : 'login_password'}
          name="password"
          type="password"
          autoComplete="current-password"
          value={loginData.password}
          onChange={onChange}
          className={`w-full border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 ${
            loginErrors.password ? 'border-red-300' : 'border-gray-300'
          } ${isMobile ? 'px-3 py-2.5 text-base' : 'px-4 py-4 text-lg'}`}
          placeholder={isMobile ? 'Password' : 'Enter your password'}
        />
        {loginErrors.password && (
          <p className={`mt-${isMobile ? '1' : '2'} text-sm text-red-600`}>
            {loginErrors.password}
          </p>
        )}
      </div>

      {/* Error Message - Desktop only (shown above button) */}
      {!isMobile && error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full bg-[#0066CC] text-white font-semibold rounded-lg hover:bg-[#0051D5] transition-colors ${
          isMobile ? 'py-4 min-h-[44px]' : 'py-4 px-4 text-lg'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading
          ? isMobile
            ? 'Logging in...'
            : 'Signing in...'
          : isMobile
            ? 'Log In'
            : 'Sign In'}
      </button>
    </form>
  );
};
