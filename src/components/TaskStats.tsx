'use client';

import React, { useState, useEffect } from 'react';
import { TaskStats as TaskStatsType } from '@/types';
import { useTasks } from '@/contexts/TasksContext';

interface TaskStatsProps {
  projectId: string;
}

export const TaskStats: React.FC<TaskStatsProps> = ({ projectId }) => {
  const { getTaskStats } = useTasks();
  const [stats, setStats] = useState<TaskStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, [projectId]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const taskStats = await getTaskStats(projectId);
      setStats(taskStats);
    } catch (error) {
      console.error('Failed to load task stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <p>No task statistics available</p>
      </div>
    );
  }

  const getProductiveHourText = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Tasks</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalTasks}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Active Tasks</div>
          <div className="text-2xl font-bold text-orange-600">{stats.activeTasks}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Archived</div>
          <div className="text-2xl font-bold text-gray-600">{stats.archivedTasks}</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tasks completed today</span>
              <span className="font-medium text-green-600">{stats.tasksCompletedToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tasks completed this week</span>
              <span className="font-medium text-blue-600">{stats.tasksCompletedThisWeek}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Insights</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg tasks per session</span>
              <span className="font-medium">{stats.averageTasksPerSession}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Most productive hour</span>
              <span className="font-medium text-orange-600">
                {getProductiveHourText(stats.mostProductiveHour)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Visualization */}
      {stats.totalTasks > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion Rate</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Completed</span>
                <span className="font-medium">
                  {stats.completedTasks} / {stats.totalTasks} 
                  ({Math.round((stats.completedTasks / stats.totalTasks) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Active</span>
                <span className="font-medium">
                  {stats.activeTasks} / {stats.totalTasks}
                  ({Math.round((stats.activeTasks / stats.totalTasks) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(stats.activeTasks / stats.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
