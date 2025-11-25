'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronDown, Check, Plus } from 'lucide-react'
import { Activity, ActivityType } from '@/types'
import { IconRenderer } from '@/components/IconRenderer'
import { useAuth } from '@/hooks/useAuth'
import { useAllActivityTypes } from '@/hooks/useActivityTypes'
import { useRecentActivities } from '@/hooks/useActivityPreferences'

interface ActivityPickerProps {
  selectedActivityId: string
  setSelectedActivityId: (id: string) => void
  allActivities?: Activity[] // Legacy support - will be deprecated
  selectedActivity: Activity | ActivityType | null
  showError?: boolean
  onErrorClear?: () => void
}

export function ActivityPicker({
  selectedActivityId,
  setSelectedActivityId,
  allActivities: legacyActivities, // Keep for backward compatibility
  selectedActivity,
  showError,
  onErrorClear,
}: ActivityPickerProps) {
  const [showDropdown, setShowDropdown] = React.useState(false)
  const { user } = useAuth()

  // Use new hooks if user is available, otherwise fall back to legacy prop
  const { data: allActivitiesFromHook } = useAllActivityTypes(user?.id || '', {
    enabled: !!user?.id,
  })
  const { data: recentActivitiesPrefs } = useRecentActivities(user?.id || '', 5, {
    enabled: !!user?.id,
  })

  // Convert ActivityType[] to Activity[] for compatibility
  const allActivities = React.useMemo(() => {
    if (legacyActivities) return legacyActivities
    if (!allActivitiesFromHook) return []
    return allActivitiesFromHook.map(
      (type): Activity => ({
        id: type.id,
        name: type.name,
        description: type.description || '',
        icon: type.icon,
        color: type.defaultColor, // Use defaultColor from ActivityType
        userId: type.userId || '',
        status: 'active',
        createdAt: type.createdAt, // Already a Date object
        updatedAt: type.updatedAt, // Already a Date object
      })
    )
  }, [legacyActivities, allActivitiesFromHook])

  // Get recent activity IDs and map to full Activity objects
  const recentActivities = React.useMemo(() => {
    if (!recentActivitiesPrefs || !allActivities.length) return []

    const recentIds = recentActivitiesPrefs.map((pref) => pref.typeId)
    return recentIds
      .map((id) => allActivities.find((a) => a.id === id))
      .filter((a): a is Activity => a !== undefined)
  }, [recentActivitiesPrefs, allActivities])

  // Sort all activities to show recent ones first
  const sortedAllActivities = React.useMemo(() => {
    if (!recentActivitiesPrefs || !allActivities.length) return allActivities

    const recentIds = new Set(recentActivitiesPrefs.map((pref) => pref.typeId))
    const recentMap = new Map(recentActivitiesPrefs.map((pref, index) => [pref.typeId, index]))

    return [...allActivities].sort((a, b) => {
      const aIsRecent = recentIds.has(a.id)
      const bIsRecent = recentIds.has(b.id)

      // Both recent - sort by recency order
      if (aIsRecent && bIsRecent) {
        return (recentMap.get(a.id) ?? 0) - (recentMap.get(b.id) ?? 0)
      }

      // One recent, one not - recent comes first
      if (aIsRecent) return -1
      if (bIsRecent) return 1

      // Neither recent - maintain original order
      return 0
    })
  }, [recentActivitiesPrefs, allActivities])

  const handleActivitySelect = (activityId: string) => {
    setSelectedActivityId(activityId)
    setShowDropdown(false)
    onErrorClear?.()
  }

  return (
    <div className="relative w-full">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label={
          selectedActivity
            ? `Selected activity: ${selectedActivity.name}. Click to change activity.`
            : 'Select an activity'
        }
        aria-haspopup="listbox"
        aria-expanded={showDropdown}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 bg-white cursor-pointer text-base flex items-center gap-3 transition-colors ${
          showError
            ? 'border-red-500 ring-2 ring-red-200 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-[#0066CC] focus:border-[#0066CC] hover:border-gray-400'
        }`}
      >
        {selectedActivity ? (
          <>
            <IconRenderer
              iconName={selectedActivity.icon}
              className="w-6 h-6 text-gray-700 flex-shrink-0"
              aria-hidden="true"
            />
            <span className="flex-1 text-left font-medium">{selectedActivity.name}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-gray-500">Select an activity</span>
        )}
        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop for closing */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
            aria-hidden="true"
          />

          {/* Dropdown content */}
          <div
            role="listbox"
            aria-label="Select an activity"
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto"
          >
            {allActivities.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-600 mb-3">No activities yet</p>
                <Link
                  href="/settings/activities"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0051D5] transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create Activity
                </Link>
              </div>
            ) : (
              <>
                {/* Horizontal Recent Activities Bar */}
                {recentActivities.length > 0 && (
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Recent
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                      {recentActivities.map((activity) => (
                        <button
                          key={activity.id}
                          role="option"
                          aria-selected={selectedActivityId === activity.id}
                          onClick={() => handleActivitySelect(activity.id)}
                          className={`flex flex-col items-center gap-1.5 flex-shrink-0 p-2 rounded-lg transition-all hover:bg-gray-50 ${
                            selectedActivityId === activity.id
                              ? 'bg-blue-50 ring-2 ring-blue-200'
                              : ''
                          }`}
                          aria-label={`${activity.name} activity`}
                        >
                          <IconRenderer
                            iconName={activity.icon}
                            className="w-6 h-6 text-gray-700"
                            aria-hidden="true"
                          />
                          <span className="text-xs font-medium text-gray-700 max-w-[60px] truncate">
                            {activity.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vertical All Activities List */}
                <div className="py-1">
                  <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    All Activities
                  </p>
                  {sortedAllActivities.map((activity) => {
                    const isCustom =
                      allActivitiesFromHook?.find((t) => t.id === activity.id)?.isSystem === false

                    return (
                      <button
                        key={activity.id}
                        role="option"
                        aria-selected={selectedActivityId === activity.id}
                        onClick={() => handleActivitySelect(activity.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors ${
                          selectedActivityId === activity.id ? 'bg-blue-50' : ''
                        }`}
                        aria-label={`${activity.name} activity${isCustom ? ' (custom)' : ''}`}
                      >
                        <IconRenderer
                          iconName={activity.icon}
                          className="w-5 h-5 text-gray-700 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <div className="flex-1 text-left min-w-0 flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{activity.name}</span>
                          {isCustom && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              Custom
                            </span>
                          )}
                        </div>
                        {selectedActivityId === activity.id && (
                          <Check
                            className="w-4 h-4 text-blue-500 flex-shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Add Custom Activity Button */}
                <Link
                  href="/settings/activities"
                  className="w-full flex items-center gap-3 px-3 py-3 border-t border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
                  aria-label="Add custom activity"
                >
                  <Plus className="w-5 h-5 text-gray-600 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm">Add custom activity</span>
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
