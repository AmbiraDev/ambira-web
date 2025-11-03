/**
 * You Route (Clean Architecture)
 *
 * This route file ONLY handles routing concerns.
 * All business logic is delegated to the YouPageContent component.
 */

'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { YouPageContent } from '@/features/you/components/YouPageContent';

export default function YouPage() {
  return (
    <ProtectedRoute>
      <YouPageContent />
    </ProtectedRoute>
  );
}
