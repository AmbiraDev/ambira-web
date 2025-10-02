'use client';

import React from 'react';
import { Session, Project } from '@/types';

interface PostStatsProps {
  session: Session;
  project: Project;
  className?: string;
}

export const PostStats: React.FC<PostStatsProps> = ({ 
  session, 
  project, 
  className = '' 
}) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const completedTasks = session.tasks?.filter(task => task.status === 'completed').length || 0;
  const totalTasks = session.tasks?.length || 0;

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="grid grid-cols-3 gap-4 text-center">
        {/* Duration */}
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {formatDuration(session.duration)}
          </div>
          <div className="text-xs text-gray-600 uppercase tracking-wide">
            Duration
          </div>
        </div>

        {/* Tasks Completed */}
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {completedTasks}/{totalTasks}
          </div>
          <div className="text-xs text-gray-600 uppercase tracking-wide">
            Tasks
          </div>
        </div>

        {/* Project Badge */}
        <div>
          <div className="flex items-center justify-center">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: project.color }}
            >
              {project.icon}
            </div>
          </div>
          <div className="text-xs text-gray-600 uppercase tracking-wide mt-1">
            Project
          </div>
        </div>
      </div>

      {/* Session Title */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
          {session.title}
        </h3>
        {session.description && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {session.description}
          </p>
        )}
      </div>

      {/* Tags */}
      {session.tags && session.tags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-1">
            {session.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800"
              >
                #{tag}
              </span>
            ))}
            {session.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                +{session.tags.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* How Felt */}
      {session.howFelt && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">How it felt:</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((rating) => (
                <span
                  key={rating}
                  className={`text-sm ${
                    rating <= session.howFelt!
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostStats;
