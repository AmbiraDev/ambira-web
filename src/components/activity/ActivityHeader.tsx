'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import { IconRenderer } from '@/components/IconRenderer';
import { Activity } from '@/types';

interface ActivityHeaderProps {
  activity: Activity;
  onSettingsClick: () => void;
}

export function ActivityHeader({
  activity,
  onSettingsClick,
}: ActivityHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start gap-4">
        {/* Activity Icon */}
        <div className="w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md bg-gray-100">
          <IconRenderer iconName={activity.icon} size={64} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Activity Name and Settings Icon */}
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {activity.name}
            </h1>
            <button
              onClick={onSettingsClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Edit activity"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Description */}
          {activity.description && (
            <p className="text-gray-700 mb-4 whitespace-pre-line max-h-24 overflow-y-auto">
              {activity.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
