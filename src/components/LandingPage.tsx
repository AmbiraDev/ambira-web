'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SignupCredentials } from '@/types';
import Header from './HeaderComponent';

export const LandingPage: React.FC = () => {
  const { login, signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [signupData, setSignupData] = useState<SignupCredentials>({
    email: '',
    password: '',
    name: '',
    username: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupErrors, setSignupErrors] = useState<Partial<SignupCredentials & { confirmPassword: string }>>({});
  const [loginErrors, setLoginErrors] = useState<{email?: string; password?: string}>({});
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const handleDemoLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await login({
        email: 'demo@ambira.com',
        password: 'demouser123'
      });
      
      // Check for redirect parameter
      const redirectTo = searchParams.get('redirect');
      router.push(redirectTo || '/');
    } catch (err) {
      setError('Failed to login with demo account');
      console.error('Demo login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithEmail = () => {
    setShowLogin(true);
    setError(null);
  };

  const handleSignupWithEmail = () => {
    setShowSignup(true);
    setError(null);
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user starts typing
    if (loginErrors[name as keyof typeof loginErrors]) {
      setLoginErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Clear submit error
    if (error) {
      setError('');
    }
  };

  const validateLoginForm = (): boolean => {
    const newErrors: {email?: string; password?: string} = {};

    if (!loginData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!loginData.password) {
      newErrors.password = 'Password is required';
    }

    setLoginErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLoginForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await login(loginData);
      
      // Check for redirect parameter
      const redirectTo = searchParams.get('redirect');
      router.push(redirectTo || '/');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific Firebase errors with user-friendly messages
      if (err.message?.includes('auth/user-not-found')) {
        setError('No account found with this email address. Please sign up or check your email.');
      } else if (err.message?.includes('auth/wrong-password')) {
        setError('Incorrect password. Please try again.');
      } else if (err.message?.includes('auth/invalid-email')) {
        setError('Please enter a valid email address.');
      } else if (err.message?.includes('auth/too-many-requests')) {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Failed to sign in. Please check your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setSignupData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear field-specific error when user starts typing
    if (signupErrors[name as keyof (SignupCredentials & { confirmPassword: string })]) {
      setSignupErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Clear submit error
    if (error) {
      setError('');
    }

    // Check username availability when username changes
    if (name === 'username' && value.trim().length >= 3) {
      checkUsernameAvailability(value.trim());
    } else if (name === 'username') {
      setUsernameAvailable(null);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    try {
      setUsernameCheckLoading(true);
      const available = await firebaseUserApi.checkUsernameAvailability(username);
      setUsernameAvailable(available);
    } catch (error) {
      console.error('Username check error:', error);
      setUsernameAvailable(null);
    } finally {
      setUsernameCheckLoading(false);
    }
  };

  const validateSignupForm = (): boolean => {
    const newErrors: Partial<SignupCredentials & { confirmPassword: string }> = {};

    if (!signupData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (signupData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!signupData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (signupData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(signupData.username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    } else if (usernameAvailable === false) {
      newErrors.username = 'Username is already taken';
    } else if (usernameCheckLoading) {
      newErrors.username = 'Checking username availability...';
    }

    if (!signupData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
      newErrors.email = 'Email is invalid';
    } else if (signupData.email === 'demo@ambira.com') {
      newErrors.email = 'This email is reserved for demo purposes. Please use the "Sign In as Demo User" button instead.';
    }

    if (!signupData.password) {
      newErrors.password = 'Password is required';
    } else if (signupData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (signupData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setSignupErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSignupForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await signup(signupData);
      
      // Check for redirect parameter
      const redirectTo = searchParams.get('redirect');
      router.push(redirectTo || '/');
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Handle specific Firebase errors with user-friendly messages
      if (err.message?.includes('auth/email-already-in-use')) {
        setError('This email address is already registered. Please try logging in instead or use a different email.');
      } else if (err.message?.includes('auth/weak-password')) {
        setError('Password is too weak. Please choose a stronger password with at least 6 characters.');
      } else if (err.message?.includes('auth/invalid-email')) {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section - 100vh minus header height */}
      <main className="h-[calc(100vh-56px)] flex items-center justify-center px-8">
        <div className="max-w-md w-full">
          {/* Logo and Welcome */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#007AFF] rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Ambira</h1>
            <p className="text-lg text-gray-600">
              Your productivity tracking companion
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border border-gray-200">
            {!showSignup ? (
              <>
                <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
                  Sign in to your account
                </h2>

                {/* Sign-in Options */}
                <div className="space-y-4">
                  {/* Demo Login Button - Prominent */}
                  <button
                    onClick={handleDemoLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-6 py-4 bg-[#007AFF] text-white font-semibold text-lg rounded-lg hover:bg-[#0056D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <span className="mr-3">🎯</span>
                        Sign In as Demo User
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                  </div>

                  {/* Sign Up With Email */}
                  <button
                    onClick={handleSignupWithEmail}
                    className="w-full flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:border-[#007AFF] hover:text-[#007AFF] transition-colors"
                  >
                    <span className="mr-2">📧</span>
                    Sign Up With Email
                  </button>

                  {/* Login Link */}
                  <div className="text-center pt-4">
                    <p className="text-gray-600">
                      Already have an account?{' '}
                      <button
                        onClick={() => setShowSignup(true)}
                        className="text-[#007AFF] hover:text-[#0056D6] font-medium"
                      >
                        Log In
                      </button>
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Create your account
                  </h2>
                  <button
                    onClick={() => setShowSignup(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Signup Form */}
                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={signupData.name}
                      onChange={handleSignupChange}
                      className={`w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent ${
                        signupErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {signupErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{signupErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        value={signupData.username}
                        onChange={handleSignupChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent ${
                          signupErrors.username ? 'border-red-300' : 
                          usernameAvailable === true ? 'border-green-300' :
                          usernameAvailable === false ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Choose a username"
                      />
                      {usernameCheckLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                      {!usernameCheckLoading && usernameAvailable === true && signupData.username.trim().length >= 3 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {!usernameCheckLoading && usernameAvailable === false && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {signupErrors.username && (
                      <p className="mt-1 text-sm text-red-600">{signupErrors.username}</p>
                    )}
                    {!signupErrors.username && usernameAvailable === true && signupData.username.trim().length >= 3 && (
                      <p className="mt-1 text-sm text-green-600">Username is available!</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={signupData.email}
                      onChange={handleSignupChange}
                      className={`w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent ${
                        signupErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                    />
                    {signupErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{signupErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={signupData.password}
                      onChange={handleSignupChange}
                      className={`w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent ${
                        signupErrors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Create a password"
                    />
                    {signupErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{signupErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={handleSignupChange}
                      className={`w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent ${
                        signupErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Confirm your password"
                    />
                    {signupErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{signupErrors.confirmPassword}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#007AFF] hover:bg-[#0056D6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007AFF] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating account...
                      </div>
                    ) : (
                      'Create account'
                    )}
                  </button>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <button
                        onClick={() => setShowSignup(false)}
                        className="font-medium text-[#007AFF] hover:text-[#0056D6]"
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                </form>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {error}
                  </div>
                  {error.includes('already registered') && (
                    <button
                      onClick={() => setShowSignup(false)}
                      className="ml-3 text-red-700 hover:text-red-800 underline text-xs font-medium"
                    >
                      Switch to Login
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Legal Text */}
          <p className="text-xs text-gray-500 text-center">
            By continuing, you are agreeing to our{' '}
            <Link href="/terms" className="text-[#007AFF] hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-[#007AFF] hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Left Side - Logo and Apps */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Ambira</span>
              </div>
              
              {/* App Store Buttons */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-center w-32 h-10 bg-black text-white rounded text-xs font-medium">
                  Download on App Store
                </div>
                <div className="flex items-center justify-center w-32 h-10 bg-black text-white rounded text-xs font-medium">
                  GET IT ON Google Play
                </div>
              </div>

              {/* Social Media Icons */}
              <div className="flex space-x-3">
                {['twitter', 'youtube', 'instagram', 'linkedin', 'facebook'].map((social) => (
                  <div key={social} className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-600">{social[0].toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Link Columns */}
            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/features" className="text-gray-600 hover:text-orange-500">What's New</Link></li>
                  <li><Link href="/stories" className="text-gray-600 hover:text-orange-500">Stories</Link></li>
                  <li><Link href="/routes" className="text-gray-600 hover:text-orange-500">Routes</Link></li>
                  <li><Link href="/about" className="text-gray-600 hover:text-orange-500">About</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Subscription</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/family-plan" className="text-gray-600 hover:text-orange-500">Family Plan</Link></li>
                  <li><Link href="/student-discount" className="text-gray-600 hover:text-orange-500">Student Discount</Link></li>
                  <li><Link href="/teacher" className="text-gray-600 hover:text-orange-500">Teacher</Link></li>
                  <li><Link href="/military-discount" className="text-gray-600 hover:text-orange-500">Military & Medical</Link></li>
                  <li><Link href="/send-gift" className="text-gray-600 hover:text-orange-500">Send a Gift</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/business" className="text-gray-600 hover:text-orange-500">Business</Link></li>
                  <li><Link href="/partner-center" className="text-gray-600 hover:text-orange-500">Partner Center</Link></li>
                  <li><Link href="/careers" className="text-gray-600 hover:text-orange-500">Careers</Link></li>
                  <li><Link href="/press" className="text-gray-600 hover:text-orange-500">Press</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Privacy</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/cookie-policy" className="text-gray-600 hover:text-orange-500">Cookie Policy</Link></li>
                  <li><Link href="/privacy-settings" className="text-gray-600 hover:text-orange-500">Privacy Settings</Link></li>
                  <li><Link href="/terms" className="text-gray-600 hover:text-orange-500">Terms</Link></li>
                  <li><Link href="/login" className="text-gray-600 hover:text-orange-500">Log In</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
