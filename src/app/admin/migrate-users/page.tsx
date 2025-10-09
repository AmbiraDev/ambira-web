'use client';

import { useState } from 'react';
import { firebaseUserApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';

export default function MigrateUsersPage() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    if (!user) {
      setError('You must be logged in to run migration');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const migrationResult = await firebaseUserApi.migrateUsersToLowercase();
      setResult(migrationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Migration Tool</h1>
          <p className="text-gray-600 mb-6">
            This tool adds lowercase fields (usernameLower, nameLower) to existing users
            to enable case-insensitive search.
          </p>

          <button
            onClick={runMigration}
            disabled={isRunning || !user}
            className={`px-6 py-3 rounded-lg font-medium ${
              isRunning || !user
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#007AFF] text-white hover:bg-[#0056D6]'
            }`}
          >
            {isRunning ? 'Running Migration...' : 'Run Migration'}
          </button>

          {!user && (
            <p className="mt-4 text-red-600">
              Please log in to run the migration.
            </p>
          )}

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
                <p>Total users: {result.total}</p>
                <p>Successfully migrated: {result.success}</p>
                <p>Failed: {result.failed}</p>
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
  );
}
