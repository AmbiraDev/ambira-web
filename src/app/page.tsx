/**
 * Home/Feed Route (Clean Architecture)
 *
 * This route file ONLY handles routing concerns.
 * All business logic is delegated to FeedPageContent and LandingPageContent components.
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/HeaderComponent';
import { FeedPageContent } from '@/features/feed/components/FeedPageContent';
import { LandingPageContent } from '@/features/feed/components/LandingPageContent';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      {/* Skip to content link - keyboard navigation only (hidden on mobile) */}
      <a
        href={isAuthenticated ? '#main-feed' : '#hero-section'}
        className="sr-only md:focus:not-sr-only md:focus:absolute md:focus:top-4 md:focus:left-4 md:focus:z-50 md:focus:px-4 md:focus:py-2 md:focus:bg-white md:focus:text-[#0066CC] md:focus:rounded md:focus:shadow-lg md:focus:outline-none md:focus:ring-2 md:focus:ring-[#0066CC]"
      >
        Skip to main content
      </a>

      {/* Show loading spinner while checking authentication */}
      {isLoading && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div
            id="main-content"
            className="flex flex-col items-center space-y-4"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066CC]"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      )}

      {/* Show feed for authenticated users */}
      {!isLoading && isAuthenticated && (
        <>
          {/* Desktop Header */}
          <header className="hidden md:block">
            <Header />
          </header>
          <FeedPageContent />
        </>
      )}

      {/* Show landing page for unauthenticated users */}
      {!isLoading && !isAuthenticated && <LandingPageContent />}
    </>
  );
}
