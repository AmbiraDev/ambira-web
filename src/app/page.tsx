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

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {/* Skip to content link for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-[#007AFF] focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
        >
          Skip to main content
        </a>
        <div id="main-content" className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show feed for authenticated users
  if (isAuthenticated) {
    return (
      <>
        {/* Skip to content link for keyboard navigation */}
        <a
          href="#main-feed"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-[#007AFF] focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
        >
          Skip to main feed
        </a>
        {/* Desktop Header */}
        <header className="hidden md:block">
          <Header />
        </header>
        <FeedPageContent />
      </>
    );
  }

  // Show landing page for unauthenticated users
  return <LandingPageContent />;
}
