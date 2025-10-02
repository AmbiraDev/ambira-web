'use client';

import React, { useState, useEffect } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useTasks } from '@/contexts/TasksContext';
import { useProjects } from '@/contexts/ProjectsContext';
import { GlobalTasks } from './GlobalTasks';

interface SessionTimerEnhancedProps {
  projectId: string;
}

export const SessionTimerEnhanced: React.FC<SessionTimerEnhancedProps> = () => {
  const { timerState, updateSelectedTasks, getElapsedTime, getFormattedTime } = useTimer();
  const { tasks } = useTasks();
  const { projects } = useProjects();

  const selectedTasks = timerState.selectedTasks || [];
  const selectedTaskIds = selectedTasks.map(task => task.id);

  // Count completed tasks in this session
  useEffect(() => {
    const completedInSession = selectedTasks.filter(task => task.status === 'completed').length;
    setCompletedTasksCount(completedInSession);
  }, [selectedTasks]);

  const handleTaskToggle = async (taskId: string) => {
    const isSelected = selectedTaskIds.includes(taskId);
    
    if (isSelected) {
      // Remove from selection
      const newSelectedIds = selectedTaskIds.filter(id => id !== taskId);
      await updateSelectedTasks(newSelectedIds);
    } else {
      // Add to selection
      const newSelectedIds = [...selectedTaskIds, taskId];
      await updateSelectedTasks(newSelectedIds);
    }
  };


  const getProjectColor = (projectId: string | undefined) => {
    if (!projectId) return 'bg-gray-500';
    const project = projects.find(p => p.id === projectId);
    const colorClasses = {
      orange: 'bg-orange-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
    };
    return colorClasses[project?.color as keyof typeof colorClasses] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Focus Session</h2>
            <p className="text-gray-600">Track your work and stay productive</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-green-600">
              {getFormattedTime(getElapsedTime())}
            </div>
            <div className="text-sm text-gray-600">
              {completedTasksCount} of {selectedTasks.length} tasks completed
            </div>
          </div>
        </div>

        {/* Current Project */}
        {timerState.currentProject && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${getProjectColor(timerState.currentProject.id)} rounded-lg flex items-center justify-center text-white text-lg`}>
                {timerState.currentProject.icon}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{timerState.currentProject.name}</div>
                <div className="text-sm text-gray-600">{timerState.currentProject.description}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Management Section - Using GlobalTasks Component */}
      <GlobalTasks
        selectedTaskIds={selectedTaskIds}
        onToggleTaskSelection={handleTaskToggle}
        showSelection={true}
      />
    </div>
  );
};
