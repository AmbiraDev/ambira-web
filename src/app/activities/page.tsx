/**
 * Activities Stats Page
 *
 * Shows all activities with usage statistics
 */

import { Metadata } from 'next'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Header from '@/components/HeaderComponent'
import MobileHeader from '@/components/MobileHeader'
import BottomNavigation from '@/components/BottomNavigation'

export const metadata: Metadata = {
  title: 'Activities - Ambira',
  description: 'View all your activities and usage statistics',
}

export default function ActivitiesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="hidden lg:block">
          <Header />
        </div>
        <div className="lg:hidden">
          <MobileHeader title="Activities" showBackButton={true} />
        </div>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 py-8 pb-24 lg:pb-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Activities</h1>
            <p className="text-gray-600">Track your productivity across all activities</p>
          </div>

          {/* Placeholder content */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Activity statistics coming soon...</p>
          </div>
        </main>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 lg:hidden">
          <BottomNavigation />
        </div>
      </div>
    </ProtectedRoute>
  )
}
