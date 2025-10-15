'use client';

import { LoginForm } from '@/components/LoginForm';
import { Suspense } from 'react';
import Image from 'next/image';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

function LoginContent() {
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
