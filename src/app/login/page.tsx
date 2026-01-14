import { Metadata } from 'next'
import { LoginForm } from '@/components/LoginForm'
import { Suspense } from 'react'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import { LoadingScreen } from '@/components/LoadingScreen'

export const metadata: Metadata = {
  title: 'Sign In - Focumo',
  description: 'Sign in to Focumo to track your productivity and stay motivated with friends',
}

function LoginContent() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-8">
      {/* Skip to main content link - keyboard navigation only (hidden on mobile) */}
      <a
        href="#login-form"
        className="sr-only md:focus:not-sr-only md:focus:absolute md:focus:top-4 md:focus:left-4 md:focus:z-50 md:focus:px-4 md:focus:py-2 md:focus:bg-white md:focus:text-[#58CC02] md:focus:rounded md:focus:shadow-lg md:focus:outline-none md:focus:ring-2 md:focus:ring-[#58CC02]"
      >
        Skip to login form
      </a>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-[#3C3C3C]">Sign in to Focumo</h2>
          <p className="mt-2 text-sm text-[#777777]">
            Welcome back! Sign in to continue tracking your productivity.
          </p>
        </div>
        <div id="login-form" className="bg-white p-10 rounded-2xl border-2 border-[#E5E5E5]">
          <LoginForm />
        </div>
      </div>
    </main>
  )
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
  )
}
