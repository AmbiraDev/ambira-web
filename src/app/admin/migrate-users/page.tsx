'use client'

import { useState, useEffect } from 'react'
import { firebaseUserApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function MigrateUsersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{
    success: number
    failed: number
    total: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.push('/')
    }
  }, [user, isLoading, router])

  const runMigration = async () => {
    if (!user || !user.isAdmin) {
      setError('You must be an admin to run migration')
      return
    }

    setIsRunning(true)
    setError(null)
    setResult(null)

    try {
      const migrationResult = await firebaseUserApi.migrateUsersToLowercase()
      setResult(migrationResult)
    } catch (_error) {
      setError(_error instanceof Error ? _error.message : 'Migration failed')
    } finally {
      setIsRunning(false)
    }
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // Show access denied if not admin
  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Migration Tool</h1>
          <p className="text-gray-600 mb-6">
            This tool adds lowercase fields (usernameLower, nameLower) to existing users to enable
            case-insensitive search.
          </p>

          <button
            onClick={runMigration}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-medium ${
              isRunning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#0066CC] text-white hover:bg-[#0051D5]'
            }`}
          >
            {isRunning ? 'Running Migration...' : 'Run Migration'}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Migration Complete</h3>
              <div className="text-green-700 space-y-1">
                <p>Successfully migrated: {result.success}</p>
                {result.failed > 0 && <p>Failed: {result.failed}</p>}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Important Notes</h3>
            <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
              <li>This migration processes up to 500 users at a time</li>
              <li>Existing users with lowercase fields will be skipped</li>
              <li>New users will automatically have lowercase fields added</li>
              <li>Check the browser console for detailed migration logs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
