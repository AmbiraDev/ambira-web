/**
 * Activities Settings Page Content Component
 *
 * Modern redesign with:
 * - Compact table-style list with hover interactions
 * - Inline edit/delete actions with smooth transitions
 * - Visual status indicators (recently used, session count badges)
 * - Improved visual hierarchy and scanability
 * - Micro-interactions (hover states, icon animations)
 * - Progressive disclosure of actions
 */

'use client';

import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  Activity as ActivityIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserCustomActivityTypes } from '@/hooks/useActivityTypes';
import { getAllActivitiesWithUsage } from '@/lib/api/userActivityPreferences';
import { IconRenderer } from '@/components/IconRenderer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import Footer from '@/components/Footer';
import { CreateCustomActivityModal } from './CreateCustomActivityModal';
import { EditCustomActivityModal } from './EditCustomActivityModal';
import { DeleteCustomActivityModal } from './DeleteCustomActivityModal';
import { ActivityType } from '@/types';

const MAX_CUSTOM_ACTIVITIES = 10;

interface ActivityWithStats extends ActivityType {
  lastUsed?: Date;
  sessionCount: number;
  totalHours: number;
}

export function ActivitiesSettingsPageContent() {
  const { user } = useAuth();
  const { data: customActivities = [], isLoading } = useUserCustomActivityTypes(
    user?.id || ''
  );

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(
    null
  );

  // Activity stats (session count, hours)
  const [activitiesWithStats, setActivitiesWithStats] = useState<
    ActivityWithStats[]
  >([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Load activity stats when custom activities change
  React.useEffect(() => {
    if (!user?.id || customActivities.length === 0) {
      setActivitiesWithStats([]);
      return;
    }

    setStatsLoading(true);
    getAllActivitiesWithUsage(user.id)
      .then(allActivitiesWithUsage => {
        // Filter to only custom activities and map to ActivityWithStats
        const customWithStats = customActivities.map(activity => {
          const usageData = allActivitiesWithUsage.find(
            a => a.id === activity.id
          );
          return {
            ...activity,
            lastUsed: usageData?.lastUsed,
            sessionCount: usageData?.useCount || 0,
            totalHours: 0, // TODO: Calculate from sessions (not available in useCount)
          };
        });

        // Sort by last used descending (most recent first)
        customWithStats.sort((a, b) => {
          if (!a.lastUsed && !b.lastUsed) return 0;
          if (!a.lastUsed) return 1;
          if (!b.lastUsed) return -1;
          return b.lastUsed.getTime() - a.lastUsed.getTime();
        });

        setActivitiesWithStats(customWithStats);
      })
      .catch(error => {
        // Fallback: Use activities without stats
        setActivitiesWithStats(
          customActivities.map(activity => ({
            ...activity,
            sessionCount: 0,
            totalHours: 0,
          }))
        );
      })
      .finally(() => {
        setStatsLoading(false);
      });
  }, [user?.id, customActivities]);

  // Get existing activity names for duplicate validation
  const existingNames = customActivities.map(a => a.name);

  // Handlers for opening modals
  const handleEditClick = (activity: ActivityType) => {
    setSelectedActivity(activity);
    setShowEditModal(true);
  };

  const handleDeleteClick = (activity: ActivityType) => {
    setSelectedActivity(activity);
    setShowDeleteModal(true);
  };

  // Handler for modal success (refresh data)
  const handleModalSuccess = () => {
    // React Query will automatically refetch
    // No manual refresh needed thanks to cache invalidation in hooks
  };

  // Check if at limit
  const isAtLimit = customActivities.length >= MAX_CUSTOM_ACTIVITIES;

  // Format relative time
  const formatRelativeTime = (date: Date | undefined): string => {
    if (!date) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="hidden lg:block">
        <Header />
      </div>
      <div className="lg:hidden">
        <MobileHeader title="Custom Activities" showBackButton={true} />
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24 lg:pb-8">
        {/* Page Header with Action */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Custom Activities
            </h1>
            <p className="text-gray-600">
              Create and manage custom activity types for unique projects or
              hobbies.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={isAtLimit}
            className="w-full sm:w-auto flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Activity
          </Button>
        </div>

        {/* Activity Limit Banner */}
        {isAtLimit ? (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center mt-0.5">
              <span className="text-white text-xs font-bold">
                {MAX_CUSTOM_ACTIVITIES}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900">
                Maximum activities reached
              </p>
              <p className="text-sm text-orange-700 mt-0.5">
                Delete an activity to create a new one. You can have up to{' '}
                {MAX_CUSTOM_ACTIVITIES} custom activities.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-900 font-medium">
              {customActivities.length} of {MAX_CUSTOM_ACTIVITIES} custom
              activities
            </span>
            <span className="text-xs text-blue-600 font-semibold px-2 py-1 bg-blue-100 rounded">
              {MAX_CUSTOM_ACTIVITIES - customActivities.length} remaining
            </span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 rounded" />
                        <div className="h-8 w-8 bg-gray-200 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && customActivities.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mx-auto mb-4">
                <ActivityIcon className="h-8 w-8 text-[#0066CC]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No custom activities yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create custom activities to track time on unique projects,
                hobbies, or goals beyond the 10 default activities.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="min-h-[44px]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Activity
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Activity List */}
        {!isLoading && activitiesWithStats.length > 0 && (
          <div className="bg-white rounded-lg">
            {activitiesWithStats.map((activity, index) => {
              const isRecentlyUsed =
                activity.lastUsed &&
                new Date().getTime() - activity.lastUsed.getTime() <
                  7 * 24 * 60 * 60 * 1000; // 7 days

              return (
                <div
                  key={activity.id}
                  className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                    index !== 0 ? 'border-t border-gray-100' : ''
                  }`}
                >
                  {/* Activity Icon */}
                  <div
                    className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: activity.defaultColor }}
                  >
                    <IconRenderer
                      iconName={activity.icon}
                      className="w-6 h-6 text-white"
                    />
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {activity.name}
                      </h3>
                      {isRecentlyUsed && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </div>
                    {activity.description && (
                      <p className="text-sm text-gray-600 truncate">
                        {activity.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {activity.lastUsed
                            ? formatRelativeTime(activity.lastUsed)
                            : 'Never used'}
                        </span>
                      </div>
                      {activity.sessionCount > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <ActivityIcon className="h-3.5 w-3.5" />
                          <span>
                            {activity.sessionCount}{' '}
                            {activity.sessionCount === 1
                              ? 'session'
                              : 'sessions'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(activity)}
                      className="min-h-[44px] min-w-[44px] hover:bg-blue-50 hover:text-[#0066CC]"
                      aria-label="Edit activity"
                    >
                      <Pencil className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(activity)}
                      className="min-h-[44px] min-w-[44px] hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete activity"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNavigation />
      </div>

      {/* Modals */}
      <CreateCustomActivityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleModalSuccess}
        existingNames={existingNames}
      />

      <EditCustomActivityModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleModalSuccess}
        activity={selectedActivity}
        existingNames={existingNames}
      />

      <DeleteCustomActivityModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleModalSuccess}
        activity={selectedActivity}
        sessionCount={
          selectedActivity
            ? activitiesWithStats.find(a => a.id === selectedActivity.id)
                ?.sessionCount || 0
            : 0
        }
        totalHours={
          selectedActivity
            ? activitiesWithStats.find(a => a.id === selectedActivity.id)
                ?.totalHours || 0
            : 0
        }
      />
    </div>
  );
}
