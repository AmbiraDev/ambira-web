'use client';

import React from 'react';
import { Session, Project } from '@/types';

interface SessionStatsProps {
  session: Session;
  project: Project;
  className?: string;
}

export const SessionStats: React.FC<SessionStatsProps> = ({
  session,
  project,
  className = '',
}) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div
      className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Session Title with Project Badge */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-semibold shadow-sm flex-shrink-0"
            style={{ backgroundColor: project.color }}
          >
            {project.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
              {session.title}
            </h3>
            <p className="text-sm text-gray-600 truncate">{project.name}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid - Strava Style */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Duration */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
              Duration
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatDuration(session.duration)}
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {session.tags && session.tags.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {session.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionStats;
