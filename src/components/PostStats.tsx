'use client';

import React, { useState } from 'react';
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
  const [showAllTasks, setShowAllTasks] = useState(false);
  
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Task tracking not implemented at session level
  const completedTasks: any[] = [];
  const totalTasks = 0;

  return (
    <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden ${className}`}>
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
            <p className="text-sm text-gray-600 truncate">
              {project.name}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid - Strava Style */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Duration */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
              Duration
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatDuration(session.duration)}
            </div>
          </div>

          {/* Tasks Completed */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
              Tasks
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {completedTasks.length}
              {totalTasks > 0 && (
                <span className="text-base font-normal text-gray-500 ml-1">
                  / {totalTasks}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Completed Tasks Expandable List */}
      {completedTasks.length > 0 && !session.hideTaskNames && (
        <div className="border-t border-gray-200">
          <button
            onClick={() => setShowAllTasks(!showAllTasks)}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
          >
            <span className="text-sm font-medium text-gray-700">
              {completedTasks.length} {completedTasks.length === 1 ? 'task' : 'tasks'} completed
            </span>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${showAllTasks ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showAllTasks && (
            <div className="px-4 pb-3 space-y-2">
              {completedTasks.map((task, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700 flex-1">{task.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

export default PostStats;
