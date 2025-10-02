'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from './HeaderComponent';

export const LandingPage: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await login({
        email: 'demo@ambira.com',
        password: 'demo'
      });
      router.push('/');
    } catch (err) {
      setError('Failed to login with demo account');
      console.error('Demo login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupWithEmail = () => {
    router.push('/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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

          {/* Sign-in Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
              Sign in to your account
            </h2>

            {/* Sign-up Options */}
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
                  <Link href="/login" className="text-[#007AFF] hover:text-[#0056D6] font-medium">
                    Log In
                  </Link>
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
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
