/**
 * Settings → Activities Page Route
 *
 * This route file ONLY handles routing concerns.
 * All business logic is delegated to the ActivitiesSettingsPageContent component.
 *
 * Note: Cannot export metadata because ProtectedRoute is a client component
 */

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ActivitiesSettingsPageContent } from '@/features/settings/components/ActivitiesSettingsPageContent';

export default function ActivitiesSettingsPage() {
  return (
    <ProtectedRoute>
      <ActivitiesSettingsPageContent />
    </ProtectedRoute>
  );
}
