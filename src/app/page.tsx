/**
 * Home/Feed Route (Clean Architecture)
 *
 * This route file ONLY handles routing concerns.
 * All business logic is delegated to FeedPageContent and LandingPageContent components.
 */

'use client';

import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/HeaderComponent';
import { FeedPageContent } from '@/features/feed/components/FeedPageContent';
import { LandingPageContent } from '@/features/feed/components/LandingPageContent';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
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
        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header />
        </div>
        <FeedPageContent />
      </>
    );
  }

  // Show landing page for unauthenticated users
  return <LandingPageContent />;
}
