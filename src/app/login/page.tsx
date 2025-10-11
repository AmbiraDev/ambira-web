'use client';

import { LoginForm } from '@/components/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Image from 'next/image';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async () => {
    try {
      setIsLoading(true);
      await login({
        email: 'demo@ambira.com',
        password: 'demouser123'
      });
      
      // Check for redirect parameter
      const redirectTo = searchParams.get('redirect');
      router.push(redirectTo || '/');
    } catch (err) {
      console.error('Demo login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <Image
              src="/logo.svg"
              alt="Ambira"
              width={64}
              height={64}
              className="w-16 h-16"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Sign in to Ambira
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Sign in to continue tracking your productivity.
          </p>
        </div>
        <div className="bg-white p-10 rounded-xl shadow-lg border border-gray-200">
          <LoginForm />

          {/* Demo Login Button */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <button
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="mt-6 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#007AFF] hover:bg-[#0056D6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007AFF] disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in as Demo User'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <LoginContent />
      </Suspense>
      {/* PWA Install Prompt - Always show on mobile login page */}
      <PWAInstallPrompt alwaysShowOnMobile={true} />
    </>
  );
}
