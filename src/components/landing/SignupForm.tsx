import React from 'react';
import { SignupCredentials } from '@/types';
import { GoogleAuthButton } from './GoogleAuthButton';

interface SignupFormProps {
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  signupData: SignupCredentials;
  confirmPassword: string;
  signupErrors: Partial<SignupCredentials & { confirmPassword: string }>;
  error: string | null;
  isLoading: boolean;
  usernameCheckLoading: boolean;
  usernameAvailable: boolean | null;
  isMobile?: boolean;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSubmit,
  onGoogleSignIn,
  onChange,
  signupData,
  confirmPassword,
  signupErrors,
  error,
  isLoading,
  usernameCheckLoading,
  usernameAvailable,
  isMobile = false,
}) => {
  return (
    <form onSubmit={onSubmit} className={isMobile ? 'space-y-3' : 'space-y-4'}>
      {/* Google Button */}
      <GoogleAuthButton
        onClick={onGoogleSignIn}
        disabled={isLoading}
        buttonText="Continue with Google"
        className={
          isMobile ? 'py-3 font-medium min-h-[44px]' : 'px-6 py-4 font-medium'
        }
      />

      {/* Divider */}
      <div className={`flex items-center gap-3 ${isMobile ? 'my-3' : ''}`}>
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-gray-500 text-sm">or</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* Error Message */}
      {isMobile && error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label
          htmlFor={isMobile ? 'mobile-signup-name' : 'name'}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Full Name
        </label>
        <input
          id={isMobile ? 'mobile-signup-name' : 'name'}
          name="name"
          type="text"
          autoComplete="name"
          value={signupData.name}
          onChange={onChange}
          className={`w-full border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 ${
            signupErrors.name ? 'border-red-300' : 'border-gray-300'
          } ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2 shadow-sm placeholder-gray-400'}`}
          placeholder={
            isMobile ? 'Enter your full name' : 'Enter your full name'
          }
        />
        {signupErrors.name && (
          <p
            className={`mt-1 ${isMobile ? 'text-xs' : 'text-sm'} text-red-600`}
          >
            {signupErrors.name}
          </p>
        )}
      </div>

      {/* Username */}
      <div>
        <label
          htmlFor={isMobile ? 'mobile-signup-username' : 'username'}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Username
        </label>
        <div className="relative">
          <input
            id={isMobile ? 'mobile-signup-username' : 'username'}
            name="username"
            type="text"
            autoComplete="username"
            value={signupData.username}
            onChange={onChange}
            className={`w-full pr-10 border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 ${
              signupErrors.username
                ? 'border-red-300'
                : usernameAvailable === true
                  ? 'border-green-300'
                  : usernameAvailable === false
                    ? 'border-red-300'
                    : 'border-gray-300'
            } ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2 shadow-sm placeholder-gray-400'}`}
            placeholder="Choose a username"
          />
          {usernameCheckLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
          {!usernameCheckLoading &&
            usernameAvailable === true &&
            signupData.username.trim().length >= 3 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-opacity duration-200">
                <svg
                  className="h-4 w-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          {!usernameCheckLoading && usernameAvailable === false && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-opacity duration-200">
              <svg
                className="h-4 w-4 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
        </div>
        {signupErrors.username && (
          <p
            className={`mt-1 ${isMobile ? 'text-xs' : 'text-sm'} text-red-600`}
          >
            {signupErrors.username}
          </p>
        )}
        {!signupErrors.username &&
          usernameAvailable === true &&
          signupData.username.trim().length >= 3 && (
            <p
              className={`mt-1 ${isMobile ? 'text-xs' : 'text-sm'} text-green-600`}
            >
              Username is available!
            </p>
          )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor={isMobile ? 'mobile-signup-email' : 'email'}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email address
        </label>
        <input
          id={isMobile ? 'mobile-signup-email' : 'email'}
          name="email"
          type="email"
          autoComplete="email"
          value={signupData.email}
          onChange={onChange}
          className={`w-full border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 ${
            signupErrors.email ? 'border-red-300' : 'border-gray-300'
          } ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2 shadow-sm placeholder-gray-400'}`}
          placeholder="Enter your email"
        />
        {signupErrors.email && (
          <p
            className={`mt-1 ${isMobile ? 'text-xs' : 'text-sm'} text-red-600`}
          >
            {signupErrors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor={isMobile ? 'mobile-signup-password' : 'password'}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <input
          id={isMobile ? 'mobile-signup-password' : 'password'}
          name="password"
          type="password"
          autoComplete="new-password"
          value={signupData.password}
          onChange={onChange}
          className={`w-full border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 ${
            signupErrors.password ? 'border-red-300' : 'border-gray-300'
          } ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2 shadow-sm placeholder-gray-400'}`}
          placeholder="Create a password"
        />
        {signupErrors.password && (
          <p
            className={`mt-1 ${isMobile ? 'text-xs' : 'text-sm'} text-red-600`}
          >
            {signupErrors.password}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor={
            isMobile ? 'mobile-signup-confirmPassword' : 'confirmPassword'
          }
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirm Password
        </label>
        <input
          id={isMobile ? 'mobile-signup-confirmPassword' : 'confirmPassword'}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={onChange}
          className={`w-full border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 ${
            signupErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
          } ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2 shadow-sm placeholder-gray-400'}`}
          placeholder="Confirm your password"
        />
        {signupErrors.confirmPassword && (
          <p
            className={`mt-1 ${isMobile ? 'text-xs' : 'text-sm'} text-red-600`}
          >
            {signupErrors.confirmPassword}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full bg-[#007AFF] text-white font-semibold rounded-lg hover:bg-[#0056D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isMobile
            ? 'py-4 text-lg min-h-[44px]'
            : 'py-3 px-4 text-sm border border-transparent shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007AFF]'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div
              className={`animate-spin rounded-full border-b-2 border-white ${isMobile ? 'h-5 w-5 mr-2' : 'h-4 w-4 mr-2'}`}
            ></div>
            Creating account...
          </div>
        ) : (
          'Create account'
        )}
      </button>
    </form>
  );
};
