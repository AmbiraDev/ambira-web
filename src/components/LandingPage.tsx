'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SignupCredentials } from '@/types';
import { firebaseUserApi } from '@/lib/firebaseApi';
import Header from './HeaderComponent';
import PWAInstallPrompt from './PWAInstallPrompt';

export const LandingPage: React.FC = () => {
  const { login, signup, signInWithGoogle } = useAuth();
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

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();

      // Check for redirect parameter
      const redirectTo = searchParams.get('redirect');
      router.push(redirectTo || '/');
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError('Failed to sign in with Google. Please try again.');
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
    } catch (error: any) {
      // Log error for debugging but don't show to user
      console.warn('Username availability check failed:', error.message);
      // Set to null to indicate check couldn't be completed
      // Registration will still proceed with server-side validation
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

  const [carouselIndex, setCarouselIndex] = useState(0);

  const benefits = [
    {
      title: "Track your active life in one place",
      description: "Record all your productivity sessions and track your progress over time",
      image: "📊"
    },
    {
      title: "Stay motivated with friends",
      description: "Share your achievements and compete in challenges with your community",
      image: "🏆"
    },
    {
      title: "Build lasting habits",
      description: "Track streaks and celebrate milestones as you reach your goals",
      image: "🔥"
    },
    {
      title: "Join groups & challenges",
      description: "Connect with like-minded people and push each other to succeed",
      image: "👥"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hide header on mobile */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Hero Section - Full screen on mobile, with header space on desktop */}
      <main className="h-screen md:h-[calc(100vh-56px)] flex flex-col md:items-center md:justify-center px-4 md:px-8">
        {/* Mobile Carousel View - Only show when not in login/signup mode */}
        {!showLogin && !showSignup && (
          <div className="md:hidden flex-1 flex flex-col justify-between py-12 pb-8">
            {/* Logo */}
            <div className="text-center">
              <div className="w-48 h-48 flex items-center justify-center mx-auto mb-6">
                <Image
                  src="/logo.svg"
                  alt="Ambira Logo"
                  width={192}
                  height={192}
                  priority
                />
              </div>
            </div>

          {/* Swipeable Carousel */}
          <div className="flex-1 flex flex-col justify-center">
            <div
              className="overflow-hidden touch-pan-x"
              onTouchStart={(e) => {
                const touch = e.touches[0];
                e.currentTarget.setAttribute('data-start-x', touch.clientX.toString());
              }}
              onTouchEnd={(e) => {
                const startX = parseInt(e.currentTarget.getAttribute('data-start-x') || '0');
                const endX = e.changedTouches[0].clientX;
                const diff = startX - endX;

                if (Math.abs(diff) > 50) {
                  if (diff > 0 && carouselIndex < benefits.length - 1) {
                    setCarouselIndex(carouselIndex + 1);
                  } else if (diff < 0 && carouselIndex > 0) {
                    setCarouselIndex(carouselIndex - 1);
                  }
                }
              }}
            >
              <div className="text-center px-4">
                <div className="text-6xl mb-6">{benefits[carouselIndex].image}</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{benefits[carouselIndex].title}</h2>
                <p className="text-lg text-gray-600">{benefits[carouselIndex].description}</p>
              </div>
            </div>

            {/* Dots Indicator - Actual circles */}
            <div className="flex justify-center gap-2.5 mt-8">
              {benefits.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all flex-shrink-0 ${
                    index === carouselIndex ? 'bg-[#007AFF]' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSignupWithEmail}
              className="w-full py-4 bg-[#007AFF] text-white font-semibold text-lg rounded-xl hover:bg-[#0056D6] transition-colors"
            >
              Join for free
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="w-full py-4 text-[#007AFF] font-semibold text-lg"
            >
              Log in
            </button>
          </div>
          </div>
        )}

        {/* Mobile Auth Forms */}
        {(showLogin || showSignup) && (
          <div className="md:hidden flex-1 flex flex-col py-6 px-2 overflow-y-auto">
            {/* Close Button and Title */}
            <div className="mb-4 relative">
              <button
                onClick={() => {
                  setShowLogin(false);
                  setShowSignup(false);
                }}
                className="absolute right-0 top-0 text-gray-600 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900 pt-2">
                {showLogin ? 'Log in to Ambira' : 'Create an Account'}
              </h1>
            </div>

            {/* Forms content from desktop view will be duplicated here */}
            <div className="flex-1">
              {showLogin ? (
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  {/* OAuth Buttons */}
                  <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center py-3 border border-gray-300 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-gray-500 text-xs">or</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  <div>
                    <label htmlFor="mobile-login-email" className="block text-xs font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="mobile-login-email"
                      name="email"
                      type="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <label htmlFor="mobile-login-password" className="block text-xs font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      id="mobile-login-password"
                      name="password"
                      type="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                      placeholder="Password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-[#007AFF] text-white font-semibold rounded-xl hover:bg-[#0056D6] transition-colors"
                  >
                    {isLoading ? 'Logging in...' : 'Log In'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignupSubmit} className="space-y-3">
                  {/* Google Button */}
                  <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center py-3 border-2 border-gray-300 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-gray-500 text-sm">or</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={signupData.name}
                      onChange={handleSignupChange}
                      className={`w-full px-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#007AFF] ${
                        signupErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {signupErrors.name && (
                      <p className="mt-1 text-xs text-red-600">{signupErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <div className="relative">
                      <input
                        name="username"
                        type="text"
                        autoComplete="username"
                        value={signupData.username}
                        onChange={handleSignupChange}
                        className={`w-full px-4 py-3 pr-10 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#007AFF] ${
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
                      <p className="mt-1 text-xs text-red-600">{signupErrors.username}</p>
                    )}
                    {!signupErrors.username && usernameAvailable === true && signupData.username.trim().length >= 3 && (
                      <p className="mt-1 text-xs text-green-600">Username is available!</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={signupData.email}
                      onChange={handleSignupChange}
                      className={`w-full px-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#007AFF] ${
                        signupErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                    />
                    {signupErrors.email && (
                      <p className="mt-1 text-xs text-red-600">{signupErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={signupData.password}
                      onChange={handleSignupChange}
                      className={`w-full px-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#007AFF] ${
                        signupErrors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Create a password"
                    />
                    {signupErrors.password && (
                      <p className="mt-1 text-xs text-red-600">{signupErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={handleSignupChange}
                      className={`w-full px-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#007AFF] ${
                        signupErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Confirm your password"
                    />
                    {signupErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">{signupErrors.confirmPassword}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-[#007AFF] text-white font-semibold text-lg rounded-xl hover:bg-[#0056D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating account...
                      </div>
                    ) : (
                      'Create account'
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Legal Text */}
            <p className="text-sm text-gray-600 text-center mt-6">
              By continuing, you are agreeing to our{' '}
              <Link href="/terms" className="text-[#007AFF]">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[#007AFF]">Privacy Policy</Link>.
            </p>
          </div>
        )}

        {/* Desktop View */}
        <div className="hidden md:block max-w-md w-full">
          {/* Logo and Welcome - Hide when login form is active */}
          {!showLogin && !showSignup && (
            <>
              <div className="text-center mb-8">
                <div className="w-48 h-48 flex items-center justify-center mx-auto mb-6">
                  <Image
                    src="/logo.svg"
                    alt="Ambira Logo"
                    width={192}
                    height={192}
                    priority
                  />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Ambira</h1>
                <p className="text-lg text-gray-600">
                  Study, work, and build with your friends.
                </p>
              </div>

              {/* Already a Member Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl text-gray-600">
                  Already a Member?{' '}
                  <button
                    onClick={() => setShowLogin(true)}
                    className="text-[#007AFF] font-semibold hover:text-[#0056D6] transition-colors"
                  >
                    Log In
                  </button>
                </h2>
              </div>
            </>
          )}

          {/* Login Form Header - Show when login form is active */}
          {showLogin && (
            <div className="text-center mb-8">
              <div className="w-48 h-48 flex items-center justify-center mx-auto mb-6">
                <Image
                  src="/logo.svg"
                  alt="Ambira Logo"
                  width={192}
                  height={192}
                  priority
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-lg text-gray-600">
                Sign in to your account
              </p>
            </div>
          )}

          {/* Signup Form Header - Show when signup form is active */}
          {showSignup && (
            <div className="text-center mb-8">
              <div className="w-48 h-48 flex items-center justify-center mx-auto mb-6">
                <Image
                  src="/logo.svg"
                  alt="Ambira Logo"
                  width={192}
                  height={192}
                  priority
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Ambira</h1>
              <p className="text-lg text-gray-600">
                Create your account
              </p>
            </div>
          )}

          {/* Auth Card */}
          <div className="p-8 mb-6">
            {!showSignup && !showLogin ? (
              <>
                {/* Sign-in Options - Only show when not in login or signup mode */}
                <div className="space-y-4">
                  {/* Google Sign Up Button */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-6 py-4 border-2 border-gray-300 text-gray-900 font-semibold text-lg rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign Up With Google
                  </button>

                  {/* Email Sign Up Button */}
                  <button
                    onClick={handleSignupWithEmail}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-6 py-4 bg-[#007AFF] text-white font-semibold text-lg rounded-lg hover:bg-[#0056D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      'Sign Up With Email'
                    )}
                  </button>
                </div>
              </>
            ) : showLogin ? (
              <>
                {/* Email Login Form - Show only when in login mode */}
                <div className="flex items-center justify-between mb-6">
                  <button 
                    onClick={() => setShowLogin(false)} 
                    className="text-gray-400 hover:text-gray-600" 
                    type="button"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleLoginSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="login_email">Email address</label>
                    <input
                      id="login_email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      className={`w-full px-4 py-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent ${loginErrors.email ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter your email"
                    />
                    {loginErrors.email && <p className="mt-2 text-sm text-red-600">{loginErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="login_password">Password</label>
                    <input
                      id="login_password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      className={`w-full px-4 py-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent ${loginErrors.password ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter your password"
                    />
                    {loginErrors.password && <p className="mt-2 text-sm text-red-600">{loginErrors.password}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-4 px-4 rounded-lg text-lg font-semibold text-white bg-[#007AFF] hover:bg-[#0056D6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007AFF] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
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
          <p className="text-sm text-gray-900 text-center">
            By continuing, you are agreeing to our{' '}
            <Link href="/terms" className="text-[#007AFF] hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-[#007AFF] hover:underline">Privacy Policy</Link>
            .
          </p>
        </div>
      </main>

      {/* Footer */}
      {/* Hide footer on mobile when in login/signup mode */}
      <footer className={`bg-white border-t border-gray-200 py-12 ${(showLogin || showSignup) ? 'hidden md:block' : ''}`}>
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Image
                    src="/logo.svg"
                    alt="Ambira Logo"
                    width={32}
                    height={32}
                  />
                </div>
                <span className="text-xl font-bold text-[#007AFF]">Ambira</span>
              </div>
              <p className="text-sm text-gray-600 max-w-xs">
                Track focus sessions, hit goals, and share progress with friends.
              </p>
            </div>

            {/* Link Columns */}
            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Product</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/features" className="text-gray-600 hover:text-[#007AFF]">Features</Link></li>
                  <li><Link href="/projects" className="text-gray-600 hover:text-[#007AFF]">Projects</Link></li>
                  <li><Link href="/groups" className="text-gray-600 hover:text-[#007AFF]">Groups</Link></li>
                  <li><Link href="/challenges" className="text-gray-600 hover:text-[#007AFF]">Challenges</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Resources</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/about" className="text-gray-600 hover:text-[#007AFF]">About</Link></li>
                  <li><Link href="/feed" className="text-gray-600 hover:text-[#007AFF]">Community</Link></li>
                  <li><Link href="/sessions" className="text-gray-600 hover:text-[#007AFF]">Sessions</Link></li>
                  <li><Link href="/tasks" className="text-gray-600 hover:text-[#007AFF]">Tasks</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/help" className="text-gray-600 hover:text-[#007AFF]">Help Center</Link></li>
                  <li><Link href="/contact" className="text-gray-600 hover:text-[#007AFF]">Contact</Link></li>
                  <li><Link href="/status" className="text-gray-600 hover:text-[#007AFF]">Status</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/privacy" className="text-gray-600 hover:text-[#007AFF]">Privacy</Link></li>
                  <li><Link href="/terms" className="text-gray-600 hover:text-[#007AFF]">Terms</Link></li>
                  <li><Link href="/cookies" className="text-gray-600 hover:text-[#007AFF]">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
            <span>© {new Date().getFullYear()} Ambira, Inc.</span>
            <div className="space-x-4 mt-2 md:mt-0">
              <Link href="/privacy" className="hover:text-[#007AFF]">Privacy</Link>
              <Link href="/terms" className="hover:text-[#007AFF]">Terms</Link>
              <Link href="/contact" className="hover:text-[#007AFF]">Contact</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* PWA Install Prompt - Always show on mobile when in login/signup mode */}
      <PWAInstallPrompt alwaysShowOnMobile={showLogin || showSignup} />
    </div>
  );
};
