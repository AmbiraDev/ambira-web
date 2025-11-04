'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText } from 'lucide-react';
import { Activity } from '@/types';
import { ActivityCard } from './ActivityCard';
import { useAuth } from '@/hooks/useAuth';
import {
  useActivities,
  useDeleteActivity,
  useArchiveActivity,
  useRestoreActivity,
} from '@/hooks/useActivitiesQuery';
import { isEmpty } from '@/lib/utils';

interface ActivityListProps {
  onEditActivity?: (activity: Activity) => void;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  onEditActivity,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: activities = [], isLoading, error } = useActivities(user?.id);
  const deleteActivityMutation = useDeleteActivity();
  const archiveActivityMutation = useArchiveActivity();
  const restoreActivityMutation = useRestoreActivity();
  const [deleteConfirm, setDeleteConfirm] = useState<Activity | null>(null);

  // Display all activities without filtering (no active filters applied)
  const filteredActivities = activities;

  const handleDelete = async (activity: Activity) => {
    try {
      await deleteActivityMutation.mutateAsync(activity.id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete activity:', err);
    }
  };

  const handleArchive = async (activity: Activity) => {
    try {
      await archiveActivityMutation.mutateAsync(activity.id);
    } catch (err) {
      console.error('Failed to archive activity:', err);
    }
  };

  const handleRestore = async (activity: Activity) => {
    try {
      await restoreActivityMutation.mutateAsync(activity.id);
    } catch (err) {
      console.error('Failed to restore activity:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for header */}
        <div className="flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="flex gap-2">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>

        {/* Loading skeleton for filters */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>

        {/* Loading skeleton for activity cards */}
        {/* Showing 6 skeleton cards to fill a typical viewport (2 rows × 3 columns on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-transparent rounded-xl border border-gray-200/60 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gray-200/80 rounded-xl"></div>
                  <div className="w-5 h-5 bg-gray-200/80 rounded"></div>
                </div>
                <div className="mb-4">
                  <div className="h-6 bg-gray-200/80 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200/80 rounded w-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-2.5 bg-gray-200/80 rounded-full w-full"></div>
                  <div className="h-2.5 bg-gray-200/80 rounded-full w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">
          Error loading activities
        </div>
        <p className="text-gray-600 mb-4">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
              Activities
            </h1>
            <p className="text-gray-600 text-sm">
              {filteredActivities.length} activit
              {filteredActivities.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/activities/new')}
              aria-label="Create new activity"
              className="bg-[#0066CC] text-white px-5 py-2.5 rounded-lg hover:bg-[#0051D5] transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              New Activity
            </button>
          </div>
        </div>
      </div>

      {/* Activities Grid/List */}
      {isEmpty(filteredActivities) ? (
        <div className="bg-transparent rounded-xl border border-gray-200/60 p-8 md:p-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#0066CC] to-[#0051D5] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FileText className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              No activities yet
            </h3>
            <p className="text-sm md:text-base text-gray-600 mb-6">
              Activities help you organize your work sessions and track progress
              over time. Create your first activity to get started!
            </p>
            <button
              onClick={() => router.push('/activities/new')}
              aria-label="Create your first activity"
              className="inline-flex items-center gap-2 bg-[#0066CC] text-white px-6 py-3 rounded-xl hover:bg-[#0051D5] transition-colors font-medium shadow-sm mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 min-h-[44px]"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              Create Your First Activity
            </button>
            <p className="text-xs text-gray-500">
              Tip: You can assign tasks to activities and track time spent on
              each one
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map(activity => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onEdit={onEditActivity}
              onDelete={activity => setDeleteConfirm(activity)}
              onArchive={
                activity.status === 'active' ? handleArchive : handleRestore
              }
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
          onClick={e => {
            if (e.target === e.currentTarget) {
              setDeleteConfirm(null);
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              setDeleteConfirm(null);
            }
          }}
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 max-w-md w-full shadow-xl motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Delete Activity
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900">
                "{deleteConfirm.name}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-5 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 min-h-[44px]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
