/**
 * Loading Screen Component
 *
 * Displays a full-screen white background with a pulsing Ambira logo
 * and bold "ambira" text centered on the screen.
 *
 * Design: Clean, professional loading experience
 * - Background: White
 * - Pulsing blue Ambira logo
 * - Bold "ambira" text below logo
 * - Smooth pulse animation
 * - Includes header for semantic HTML compliance
 */

'use client';

import Image from 'next/image';

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
        className="fixed inset-0 bg-white flex items-center justify-center"
      >
        <div className="flex flex-col items-center justify-center">
          {/* Pulsing Ambira Logo */}
          <div className="mb-6 animate-pulse">
            <Image
              src="/logo.svg"
              alt="Ambira"
              width={120}
              height={120}
              className="w-[120px] h-[120px]"
              priority
            />
          </div>

          {/* Bold "Ambira" Text */}
          <h1 className="text-[#305CDE] text-3xl font-bold tracking-wide">
            Ambira
          </h1>
        </div>
      </main>
    </>
  );
}
