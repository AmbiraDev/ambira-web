'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ActivityList } from '@/components/ActivityList';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Activity } from '@/types';

/**
 * Detailed loading skeleton matching ActivityList's design
 * Provides consistent user experience during data fetching
 */
function LoadingState() {
  return (
    <div className="space-y-6">
      {/* Loading skeleton for header */}
      <div className="flex justify-between items-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="flex gap-2">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>

      {/* Loading skeleton for filters */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>

      {/* Loading skeleton for activity cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="animate-pulse">
            <div className="bg-transparent rounded-xl border border-gray-200/60 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gray-200/80 rounded-xl"></div>
                <div className="w-5 h-5 bg-gray-200/80 rounded"></div>
              </div>
              <div className="mb-4">
                <div className="h-6 bg-gray-200/80 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200/80 rounded w-full"></div>
              </div>
              <div className="space-y-3">
                <div className="h-2.5 bg-gray-200/80 rounded-full w-full"></div>
                <div className="h-2.5 bg-gray-200/80 rounded-full w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitiesContent() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleEditActivity = (activity: Activity) => {
    router.push(`/activities/${activity.id}/edit`);
  };

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 flex flex-col">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <MobileHeader title="Activities" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-32 md:pb-8 min-h-[calc(100vh-3.5rem)]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <ErrorBoundary
            onError={(error, errorInfo) => {
              // Log errors for monitoring/debugging
              console.error('Activities page error:', error);
              console.error('Error component stack:', errorInfo.componentStack);
            }}
          >
            <Suspense fallback={<LoadingState />}>
              <ActivityList onEditActivity={handleEditActivity} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>

      {/* Footer - hidden on mobile */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
}

export default function ActivitiesPage() {
  return (
    <ProtectedRoute>
      <ActivitiesContent />
    </ProtectedRoute>
  );
}
