/**
 * Own Profile Route (Clean Architecture)
 *
 * This route file ONLY handles routing concerns.
 * All business logic is delegated to the OwnProfilePageContent component.
 */

'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { OwnProfilePageContent } from '@/features/profile/components/OwnProfilePageContent';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <OwnProfilePageContent />
    </ProtectedRoute>
  );
}
