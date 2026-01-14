/**
 * Loading Screen Component
 *
 * Displays a full-screen splash page with the Focumo branding.
 * Features a large animated logo with breathing effect and tagline.
 *
 * Design: Premium, Duolingo-inspired splash experience
 * - Clean white background
 * - Large green gradient logo with smooth breathing animation
 * - Subtle tagline with fade-in effect
 * - Animated loading indicator
 */

'use client'

export function LoadingScreen() {
  return (
    <>
      {/* Minimal header for semantic HTML - visually hidden */}
      <header className="sr-only" role="banner" aria-label="Loading">
        <nav role="navigation" aria-label="Loading navigation">
          <span>Loading...</span>
        </nav>
      </header>

      <main
        role="main"
        className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden"
      >
        {/* Subtle background gradient orb */}
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-br from-[#58CC02]/10 to-[#1CB0F6]/5 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />

        <div className="relative flex flex-col items-center justify-center gap-6">
          {/* Main Logo */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tight bg-gradient-to-r from-[#58CC02] to-[#45A000] bg-clip-text text-transparent animate-[breathe_3s_ease-in-out_infinite]">
            Focumo
          </h1>

          {/* Animated loading dots */}
          <div className="flex items-center gap-2 mt-8 animate-[fadeIn_1s_ease-out_0.6s_both]">
            <div className="w-2.5 h-2.5 bg-[#58CC02] rounded-full animate-[bounce_1s_ease-in-out_infinite]" />
            <div className="w-2.5 h-2.5 bg-[#58CC02] rounded-full animate-[bounce_1s_ease-in-out_0.2s_infinite]" />
            <div className="w-2.5 h-2.5 bg-[#58CC02] rounded-full animate-[bounce_1s_ease-in-out_0.4s_infinite]" />
          </div>
        </div>
      </main>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes breathe {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.02);
            opacity: 0.95;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
