import { Metadata } from 'next';
import { LoginForm } from '@/components/LoginForm';
import { Suspense } from 'react';
import Image from 'next/image';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { LoadingScreen } from '@/components/LoadingScreen';

export const metadata: Metadata = {
  title: 'Sign In - Ambira',
  description:
    'Sign in to Ambira to track your productivity and stay motivated with friends',
};

function LoginContent() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-8">
      {/* Skip to main content link - keyboard navigation only (hidden on mobile) */}
      <a
        href="#login-form"
        className="sr-only md:focus:not-sr-only md:focus:absolute md:focus:top-4 md:focus:left-4 md:focus:z-50 md:focus:px-4 md:focus:py-2 md:focus:bg-white md:focus:text-[#0066CC] md:focus:rounded md:focus:shadow-lg md:focus:outline-none md:focus:ring-2 md:focus:ring-[#0066CC]"
      >
        Skip to login form
      </a>

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
        <div
          id="login-form"
          className="bg-white p-10 rounded-xl shadow-lg border border-gray-200"
        >
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <LoginContent />
      </Suspense>
      {/* PWA Install Prompt - Always show on mobile login page */}
      <PWAInstallPrompt alwaysShowOnMobile={true} />
    </>
  );
}
