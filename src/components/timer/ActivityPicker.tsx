'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, Check } from 'lucide-react';
import { Activity } from '@/types';
import { IconRenderer } from '@/components/IconRenderer';

interface ActivityPickerProps {
  selectedActivityId: string;
  setSelectedActivityId: (id: string) => void;
  allActivities: Activity[];
  selectedActivity: Activity | null;
  showError?: boolean;
  onErrorClear?: () => void;
}

export function ActivityPicker({
  selectedActivityId,
  setSelectedActivityId,
  allActivities,
  selectedActivity,
  showError,
  onErrorClear,
}: ActivityPickerProps) {
  const [showDropdown, setShowDropdown] = React.useState(false);

  const handleActivitySelect = (activityId: string) => {
    setSelectedActivityId(activityId);
    setShowDropdown(false);
    onErrorClear?.();
  };

  return (
    <div className="relative w-full">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
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
              className="w-6 h-6 flex-shrink-0"
              style={{ color: selectedActivity.color }}
            />
            <span className="flex-1 text-left font-medium">
              {selectedActivity.name}
            </span>
          </>
        ) : (
          <span className="flex-1 text-left text-gray-500">
            Select an activity
          </span>
        )}
        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop for closing */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown content */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            {allActivities.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-600 mb-3">No activities yet</p>
                <Link
                  href="/activities/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0051D5] transition-colors text-sm font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Create Activity
                </Link>
              </div>
            ) : (
              <>
                {allActivities.map(activity => (
                  <button
                    key={activity.id}
                    onClick={() => handleActivitySelect(activity.id)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                      selectedActivityId === activity.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${activity.color}20` }}
                    >
                      <IconRenderer
                        iconName={activity.icon}
                        className="w-4 h-4"
                        style={{ color: activity.color }}
                      />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {activity.name}
                      </div>
                    </div>
                    {selectedActivityId === activity.id && (
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
                <Link
                  href="/activities/new"
                  className="w-full flex items-center gap-3 p-3 border-t border-gray-200 hover:bg-gray-50 transition-colors text-gray-900 font-medium"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100">
                    <svg
                      className="w-4 h-4 text-[#0066CC]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <span className="text-sm">Create New Activity</span>
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
