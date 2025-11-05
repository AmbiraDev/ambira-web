/**
 * Activities Settings Page Content Component
 *
 * Manages custom activities with:
 * - Card-based list showing name, icon, last used, stats
 * - Create button at top
 * - Edit/Delete actions per card
 * - Activity limit indicator (X/10 custom activities)
 * - Empty state for no custom activities
 * - Sorting: Recently used first
 */

'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';
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
import { formatDistanceToNow } from 'date-fns';

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
        console.error('Failed to load activity stats:', error);
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

  // Handler for opening edit modal
  const handleEditClick = (activity: ActivityType) => {
    setSelectedActivity(activity);
    setShowEditModal(true);
  };

  // Handler for opening delete modal
  const handleDeleteClick = (activity: ActivityWithStats) => {
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
      <main className="max-w-4xl mx-auto px-4 py-8 pb-24 lg:pb-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Custom Activities
          </h1>
          <p className="text-gray-600">
            Create and manage your custom activity types. Use these activities
            when tracking time on unique projects or hobbies.
          </p>
        </div>

        {/* Create Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={isAtLimit}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Activity
          </Button>
          {isAtLimit && (
            <p className="text-sm text-orange-600 mt-2">
              You have reached the maximum of {MAX_CUSTOM_ACTIVITIES} custom
              activities. Delete an activity to create a new one.
            </p>
          )}
        </div>

        {/* Activity Limit Counter */}
        <div className="mb-6 flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
          <span className="text-sm text-gray-600">Custom Activities:</span>
          <span className="text-sm font-semibold text-gray-900">
            {customActivities.length} / {MAX_CUSTOM_ACTIVITIES}
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && customActivities.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No custom activities yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create custom activities to track time on unique projects,
                hobbies, or goals.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Activity
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Activity Cards List */}
        {!isLoading && activitiesWithStats.length > 0 && (
          <div className="space-y-4">
            {activitiesWithStats.map(activity => (
              <Card
                key={activity.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: activity.defaultColor }}
                    >
                      <IconRenderer
                        iconName={activity.icon}
                        className="w-6 h-6"
                        style={{ color: '#FFFFFF' }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      {/* Name */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {activity.name}
                      </h3>

                      {/* Description */}
                      {activity.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {activity.description}
                        </p>
                      )}

                      {/* Stats Row */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {/* Last Used */}
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {activity.lastUsed ? (
                            <span>
                              {formatDistanceToNow(activity.lastUsed, {
                                addSuffix: true,
                              })}
                            </span>
                          ) : (
                            <span>Never used</span>
                          )}
                        </div>

                        {/* Session Count */}
                        {activity.sessionCount > 0 && (
                          <div>
                            {activity.sessionCount} session
                            {activity.sessionCount === 1 ? '' : 's'}
                          </div>
                        )}

                        {/* Total Hours (if available) */}
                        {activity.totalHours > 0 && (
                          <div>
                            {activity.totalHours.toFixed(1)} hour
                            {activity.totalHours === 1 ? '' : 's'} total
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(activity)}
                        aria-label="Edit activity"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(activity)}
                        aria-label="Delete activity"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
