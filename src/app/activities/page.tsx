'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ActivityList } from '@/components/ActivityList';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { Activity } from '@/types';

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectsContent() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleEditActivity = (activity: Activity) => {
    router.push(`/activities/${activity.id}/edit`);
  };

  return (
    <div className="min-h-screen bg-white md:bg-gray-50">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <MobileHeader title="Activities" />
      </div>

      {/* Content */}
      <div className="pb-32 md:pb-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 md:py-8">
          <Suspense fallback={<LoadingState />}>
            <ActivityList onEditActivity={handleEditActivity} />
          </Suspense>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <ProjectsContent />
    </ProtectedRoute>
  );
}
