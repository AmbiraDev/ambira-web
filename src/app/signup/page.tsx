import { SignupForm } from '@/components/SignupForm'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'

export default function SignupPage() {
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-white px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-[#3C3C3C]">Join Focumo</h2>
            <p className="mt-2 text-sm text-[#777777]">
              Start your productivity journey with friends
            </p>
          </div>
          <div className="bg-white p-10 rounded-2xl border-2 border-[#E5E5E5]">
            <SignupForm />
          </div>
        </div>
      </div>
      {/* PWA Install Prompt - Always show on mobile signup page */}
      <PWAInstallPrompt alwaysShowOnMobile={true} />
    </>
  )
}
