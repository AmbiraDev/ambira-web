/**
 * Settings Route (Clean Architecture)
 *
 * This route file ONLY handles routing concerns.
 * All business logic is delegated to the SettingsPageContent component.
 */

'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { SettingsPageContent } from '@/features/settings/components/SettingsPageContent'

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  )
}
