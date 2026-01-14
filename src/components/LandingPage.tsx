'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { SignupCredentials } from '@/types'
import { firebaseUserApi } from '@/lib/api'
import Header from './HeaderComponent'
import PWAInstallPrompt from './PWAInstallPrompt'
import Footer from './Footer'

export const LandingPage: React.FC = () => {
  const { login, signup, signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSignup, setShowSignup] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  })
  const [signupData, setSignupData] = useState<SignupCredentials>({
    email: '',
    password: '',
    name: '',
    username: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [signupErrors, setSignupErrors] = useState<
    Partial<SignupCredentials & { confirmPassword: string }>
  >({})
  const [loginErrors, setLoginErrors] = useState<{
    email?: string
    password?: string
  }>({})
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await signInWithGoogle()
      // Navigation is handled by AuthContext after successful authentication
      // No need to manually navigate here - AuthContext will update isAuthenticated
      // and the page component will automatically show the authenticated view
    } catch (err: unknown) {
      // Don't show error or clear loading if redirect is in progress
      // (user is being redirected to Google)
      const errorMessage =
        err && typeof err === 'object' && 'message' in err ? String(err.message) : ''
      if (errorMessage !== 'REDIRECT_IN_PROGRESS') {
        setError(errorMessage || 'Failed to sign in with Google. Please try again.')
        setIsLoading(false)
      }
      // If REDIRECT_IN_PROGRESS, keep loading state - browser will redirect
    }
  }

  const handleSignupWithEmail = () => {
    setShowSignup(true)
    setError(null)
  }

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData((prev) => ({ ...prev, [name]: value }))

    // Clear field-specific error when user starts typing
    if (loginErrors[name as keyof typeof loginErrors]) {
      setLoginErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    // Clear submit error
    if (error) {
      setError('')
    }
  }

  const validateLoginForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {}

    if (!loginData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!loginData.password) {
      newErrors.password = 'Password is required'
    }

    setLoginErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateLoginForm()) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await login(loginData)
      // Navigation is handled by AuthContext after successful authentication
      // No need to manually navigate here - AuthContext will update isAuthenticated
      // and the page component will automatically show the authenticated view
    } catch (err: unknown) {
      // Handle specific Firebase errors with user-friendly messages
      const errorMessage =
        err && typeof err === 'object' && 'message' in err ? String(err.message) : ''
      if (errorMessage.includes('auth/user-not-found')) {
        setError('No account found with this email address. Please sign up or check your email.')
      } else if (errorMessage.includes('auth/wrong-password')) {
        setError('Incorrect password. Please try again.')
      } else if (errorMessage.includes('auth/invalid-email')) {
        setError('Please enter a valid email address.')
      } else if (errorMessage.includes('auth/too-many-requests')) {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError('Failed to sign in. Please check your credentials and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === 'confirmPassword') {
      setConfirmPassword(value)
    } else {
      setSignupData((prev) => ({ ...prev, [name]: value }))
    }

    // Clear field-specific error when user starts typing
    if (signupErrors[name as keyof (SignupCredentials & { confirmPassword: string })]) {
      setSignupErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    // Clear submit error
    if (error) {
      setError('')
    }

    // Reset username availability when username changes
    if (name === 'username') {
      setUsernameAvailable(null)
    }
  }

  // Debounced username availability check
  useEffect(() => {
    const checkUsername = async () => {
      const username = signupData.username.trim()

      // Only check if username meets minimum requirements
      if (username.length < 3) {
        setUsernameAvailable(null)
        return
      }

      // Validate username format
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setUsernameAvailable(null)
        return
      }

      setUsernameCheckLoading(true)
      try {
        const available = await firebaseUserApi.checkUsernameAvailability(username)
        setUsernameAvailable(available)
      } catch {
        // Set to null to indicate check couldn't be completed
        // Registration will still proceed with server-side validation
        setUsernameAvailable(null)
      } finally {
        setUsernameCheckLoading(false)
      }
    }

    // Debounce: wait 1000ms after user stops typing
    const timeoutId = setTimeout(checkUsername, 1000)
    return () => clearTimeout(timeoutId)
  }, [signupData.username])

  const validateSignupForm = (): boolean => {
    const newErrors: Partial<SignupCredentials & { confirmPassword: string }> = {}

    if (!signupData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (signupData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!signupData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (signupData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(signupData.username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    } else if (usernameAvailable === false) {
      newErrors.username = 'Username is already taken'
    } else if (usernameCheckLoading) {
      newErrors.username = 'Checking username availability...'
    }

    if (!signupData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!signupData.password) {
      newErrors.password = 'Password is required'
    } else if (signupData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (signupData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setSignupErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateSignupForm()) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await signup(signupData)
      // Navigation is handled by AuthContext after successful authentication
      // No need to manually navigate here - AuthContext will update isAuthenticated
      // and the page component will automatically show the authenticated view
    } catch (err: unknown) {
      // Handle specific Firebase errors with user-friendly messages
      const errorMessage =
        err && typeof err === 'object' && 'message' in err ? String(err.message) : ''
      if (errorMessage.includes('auth/email-already-in-use')) {
        setError(
          'This email address is already registered. Please try logging in instead or use a different email.'
        )
      } else if (errorMessage.includes('auth/weak-password')) {
        setError(
          'Password is too weak. Please choose a stronger password with at least 6 characters.'
        )
      } else if (errorMessage.includes('auth/invalid-email')) {
        setError('Please enter a valid email address.')
      } else {
        setError('Failed to create account. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section - Full screen on mobile, with header space on desktop */}
      <main className="min-h-screen md:h-[calc(100vh-56px)] flex flex-col md:items-center md:justify-center px-4 md:px-8 py-8 md:pt-0">
        {/* Mobile View - Compact version similar to desktop */}
        {!showLogin && !showSignup && (
          <div className="md:hidden w-full max-w-md mx-auto flex flex-col justify-center min-h-[calc(100vh-4rem)]">
            {/* Welcome Text - No Logo */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold text-[#3C3C3C] mb-1">Welcome to Focumo</h1>
              <p className="text-base text-[#777777]">Study, work, and build with your friends.</p>
            </div>

            {/* Already a Member Header */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-lg text-[#777777]">Already a Member?</span>
              <button
                onClick={() => setShowLogin(true)}
                className="px-5 py-2 bg-[#58CC02] text-white hover:brightness-105 rounded-2xl transition-all font-bold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 border-2 border-b-4 border-[#45A000] active:border-b-2 active:translate-y-[2px]"
              >
                Log In
              </button>
            </div>

            {/* CTA Buttons - Duolingo Style */}
            <div className="space-y-3">
              {/* Google Sign Up Button - Outline Duolingo Style */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-5 py-3 bg-white text-[#3C3C3C] font-bold rounded-2xl border-2 border-b-4 border-[#DADADA] hover:bg-[#F7F7F7] active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign Up With Google
              </button>

              {/* Email Sign Up Button - Green Duolingo Style */}
              <button
                onClick={handleSignupWithEmail}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-5 py-3 bg-[#58CC02] text-white font-bold rounded-2xl border-2 border-b-4 border-[#45A000] hover:brightness-105 active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] "
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Sign Up With Email'
                )}
              </button>
            </div>

            {/* Legal Text */}
            <p className="text-sm text-[#777777] text-center mt-6">
              By continuing, you are agreeing to our{' '}
              <Link href="/terms" className="text-[#58CC02] hover:text-[#45A000]">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[#58CC02] hover:text-[#45A000]">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        )}

        {/* Mobile Auth Forms */}
        {(showLogin || showSignup) && (
          <div className="md:hidden flex-1 flex flex-col py-6 px-2 overflow-y-auto">
            {/* Close Button and Title */}
            <div className="mb-4 relative">
              <button
                onClick={() => {
                  setShowLogin(false)
                  setShowSignup(false)
                }}
                className="absolute right-0 top-0 text-gray-600 p-2"
                aria-label="Close form"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <h1 className="text-2xl font-extrabold text-[#3C3C3C] pt-2">
                {showLogin ? 'Log In to Focumo' : 'Create Your Account'}
              </h1>
            </div>

            {/* Forms content from desktop view will be duplicated here */}
            <div className="flex-1">
              {showLogin ? (
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  {/* OAuth Buttons - Duolingo Outline Style */}
                  <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-5 py-3 bg-white text-[#3C3C3C] font-bold rounded-2xl border-2 border-b-4 border-[#DADADA] hover:bg-[#F7F7F7] active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-gray-500 text-xs">or</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  <div>
                    <label
                      htmlFor="mobile-login-email"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      id="mobile-login-email"
                      name="email"
                      type="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      className="w-full px-4 py-3 bg-[#F7F7F7] border-2 border-b-4 border-[#E5E5E5] rounded-xl text-[#3C3C3C] font-semibold focus:border-[#58CC02] focus:bg-white focus:outline-none placeholder:text-[#AFAFAF]"
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="mobile-login-password"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Password
                    </label>
                    <input
                      id="mobile-login-password"
                      name="password"
                      type="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      className="w-full px-4 py-3 bg-[#F7F7F7] border-2 border-b-4 border-[#E5E5E5] rounded-xl text-[#3C3C3C] font-semibold focus:border-[#58CC02] focus:bg-white focus:outline-none placeholder:text-[#AFAFAF]"
                      placeholder="Password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-5 py-3 bg-[#58CC02] text-white font-bold rounded-2xl border-2 border-b-4 border-[#45A000] hover:brightness-105 active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] "
                  >
                    {isLoading ? 'Logging in...' : 'Log In'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignupSubmit} className="space-y-3">
                  {/* Google Button - Duolingo Outline Style */}
                  <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-5 py-3 bg-white text-[#3C3C3C] font-bold rounded-2xl border-2 border-b-4 border-[#DADADA] hover:bg-[#F7F7F7] active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={signupData.name}
                      onChange={handleSignupChange}
                      className={`w-full px-4 py-3 border rounded-md text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 ${
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
                        className={`w-full px-4 py-3 pr-10 border rounded-md text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 ${
                          signupErrors.username
                            ? 'border-red-300'
                            : usernameAvailable === true
                              ? 'border-green-300'
                              : usernameAvailable === false
                                ? 'border-red-300'
                                : 'border-gray-300'
                        }`}
                        placeholder="Choose a username"
                      />
                      {usernameCheckLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#58CC02]"></div>
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
                      <p className="mt-1 text-xs text-red-600">{signupErrors.username}</p>
                    )}
                    {!signupErrors.username &&
                      usernameAvailable === true &&
                      signupData.username.trim().length >= 3 && (
                        <p className="mt-1 text-xs text-green-600">Username is available!</p>
                      )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email address
                    </label>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={signupData.email}
                      onChange={handleSignupChange}
                      className={`w-full px-4 py-3 border rounded-md text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 ${
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
                      className={`w-full px-4 py-3 border rounded-md text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 ${
                        signupErrors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Create a password"
                    />
                    {signupErrors.password && (
                      <p className="mt-1 text-xs text-red-600">{signupErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={handleSignupChange}
                      className={`w-full px-4 py-3 border rounded-md text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 ${
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
                    className="w-full flex items-center justify-center px-5 py-3 bg-[#58CC02] text-white font-bold rounded-2xl border-2 border-b-4 border-[#45A000] hover:brightness-105 active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] "
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
            <p className="text-sm text-[#777777] text-center mt-6">
              By continuing, you are agreeing to our{' '}
              <Link href="/terms" className="text-[#58CC02] hover:text-[#45A000]">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[#58CC02] hover:text-[#45A000]">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        )}

        {/* Desktop View */}
        <div className="hidden md:block max-w-md w-full">
          {/* Welcome Text - No Logo */}
          {!showLogin && !showSignup && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-[#3C3C3C] mb-2">Welcome to Focumo</h1>
                <p className="text-lg text-[#777777]">Study, work, and build with your friends.</p>
              </div>

              {/* Already a Member Header */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-2xl text-[#777777]">Already a Member?</span>
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-6 py-2 bg-[#58CC02] text-white hover:brightness-105 rounded-2xl transition-all font-bold text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 border-2 border-b-4 border-[#45A000] active:border-b-2 active:translate-y-[2px]"
                >
                  Log In
                </button>
              </div>
            </>
          )}

          {/* Login Form Header - No Logo */}
          {showLogin && (
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-[#3C3C3C] mb-2">Welcome Back</h1>
              <p className="text-lg text-[#777777]">Sign in to your account</p>
            </div>
          )}

          {/* Signup Form Header - No Logo */}
          {showSignup && (
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-[#3C3C3C] mb-2">Create Your Account</h1>
              <p className="text-lg text-[#777777]">
                Join Focumo and start tracking your productivity
              </p>
            </div>
          )}

          {/* Auth Card */}
          <div className="p-8 mb-6">
            {!showSignup && !showLogin ? (
              <>
                {/* Sign-in Options - Duolingo Style */}
                <div className="space-y-4">
                  {/* Google Sign Up Button - Duolingo Outline Style */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-5 py-3 bg-white text-[#3C3C3C] font-bold rounded-2xl border-2 border-b-4 border-[#DADADA] hover:bg-[#F7F7F7] active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                  >
                    <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign Up With Google
                  </button>

                  {/* Email Sign Up Button - Duolingo Green Style */}
                  <button
                    onClick={handleSignupWithEmail}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-5 py-3 bg-[#58CC02] text-white font-bold rounded-2xl border-2 border-b-4 border-[#45A000] hover:brightness-105 active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] "
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
                    aria-label="Go back to login options"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleLoginSubmit} className="space-y-6">
                  {/* Google Sign-In Button - Duolingo Outline Style */}
                  <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-5 py-3 bg-white text-[#3C3C3C] font-bold rounded-2xl border-2 border-b-4 border-[#DADADA] hover:bg-[#F7F7F7] active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                  >
                    <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-gray-500 text-sm">or</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      htmlFor="login_email"
                    >
                      Email address
                    </label>
                    <input
                      id="login_email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      className={`w-full px-4 py-4 text-lg border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 ${loginErrors.email ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter your email"
                    />
                    {loginErrors.email && (
                      <p className="mt-2 text-sm text-red-600">{loginErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      htmlFor="login_password"
                    >
                      Password
                    </label>
                    <input
                      id="login_password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      className={`w-full px-4 py-4 text-lg border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 ${loginErrors.password ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter your password"
                    />
                    {loginErrors.password && (
                      <p className="mt-2 text-sm text-red-600">{loginErrors.password}</p>
                    )}
                  </div>

                  {/* Error Message - Display before submit button */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-5 py-3 bg-[#58CC02] text-white font-bold rounded-2xl border-2 border-b-4 border-[#45A000] hover:brightness-105 active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] "
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setShowSignup(false)}
                    className="text-gray-400 hover:text-gray-600"
                    type="button"
                    aria-label="Go back to signup options"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
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
                      className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 ${
                        signupErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {signupErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{signupErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                        className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 ${
                          signupErrors.username
                            ? 'border-red-300'
                            : usernameAvailable === true
                              ? 'border-green-300'
                              : usernameAvailable === false
                                ? 'border-red-300'
                                : 'border-gray-300'
                        }`}
                        placeholder="Choose a username"
                      />
                      {usernameCheckLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#58CC02]"></div>
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
                      <p className="mt-1 text-sm text-red-600">{signupErrors.username}</p>
                    )}
                    {!signupErrors.username &&
                      usernameAvailable === true &&
                      signupData.username.trim().length >= 3 && (
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
                      className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 ${
                        signupErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                    />
                    {signupErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{signupErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={signupData.password}
                      onChange={handleSignupChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 ${
                        signupErrors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Create a password"
                    />
                    {signupErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{signupErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={handleSignupChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02] focus-visible:ring-offset-2 ${
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
                    className="w-full flex items-center justify-center px-5 py-3 bg-[#58CC02] text-white font-bold rounded-2xl border-2 border-b-4 border-[#45A000] hover:brightness-105 active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] "
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
          </div>

          {/* Legal Text */}
          <p className="text-sm text-[#777777] text-center">
            By continuing, you are agreeing to our{' '}
            <Link href="/terms" className="text-[#58CC02] hover:text-[#45A000]">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[#58CC02] hover:text-[#45A000]">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>

      {/* Footer - Use the minimalist Footer component */}
      {/* Hide footer on mobile when in login/signup mode */}
      <div className={showLogin || showSignup ? 'hidden md:block' : ''}>
        <Footer />
      </div>

      {/* PWA Install Prompt - Always show on mobile when in login/signup mode */}
      <PWAInstallPrompt alwaysShowOnMobile={showLogin || showSignup} />
    </div>
  )
}
