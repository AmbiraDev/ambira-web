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

export default function GroupPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Desktop Header */}
        <div className="hidden sm:block">
          <Header />
        </div>

        {/* Feature Component - All logic is here */}
        <GroupDetailPage groupId={params.id} />
      </div>
    </ProtectedRoute>
  );
}
