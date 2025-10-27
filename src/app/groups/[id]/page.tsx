/**
 * Group Detail Route (Clean Architecture)
 *
 * This route file ONLY handles routing concerns.
 * All business logic is delegated to the GroupDetailPage feature component.
 */

'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import { GroupDetailPage } from '@/features/groups/components/GroupDetailPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function GroupPage(props: { params: Promise<{ id: string }> }) {
  // Use React's `use` hook to unwrap the promise in a client component
  const params = use(props.params);

  return (
    <ProtectedRoute>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <div className="min-h-screen bg-gray-50">
          {/* Desktop Header */}
          <div className="hidden sm:block">
            <Header />
          </div>

          {/* Feature Component - All logic is here */}
          <GroupDetailPage groupId={params.id} />
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}

function ErrorFallback() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden sm:block">
        <Header />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Error loading group
        </h2>
        <p className="text-gray-600 mb-6">
          Something went wrong while loading this group.
        </p>
        <button
          onClick={() => router.push('/groups')}
          className="bg-[#007AFF] text-white px-4 py-2 rounded-lg hover:bg-[#0051D5]"
        >
          Back to Groups
        </button>
      </div>
    </div>
  );
}
