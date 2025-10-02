'use client';

import React, { useState, useEffect } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useTasks } from '@/contexts/TasksContext';
import { useProjects } from '@/contexts/ProjectsContext';

interface SessionTimerEnhancedProps {
  projectId: string;
}

export const SessionTimerEnhanced: React.FC<SessionTimerEnhancedProps> = () => {
  const { timerState, updateSelectedTasks, getElapsedTime, getFormattedTime } = useTimer();
  const { tasks, createTask, updateTask, loadProjectTasks } = useTasks();
  const { projects } = useProjects();
  const [filterProject, setFilterProject] = useState<string>('all');
  const [newTaskName, setNewTaskName] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);

  // Load tasks for all projects
  useEffect(() => {
    const loadAllTasks = async () => {
      for (const project of projects) {
        await loadProjectTasks(project.id);
      }
    };
    if (projects.length > 0) {
      loadAllTasks();
    }
  }, [projects, loadProjectTasks]);

  // Filter tasks based on selected project
  const filteredTasks = tasks.filter(task => {
    if (filterProject === 'all') return true;
    if (filterProject === 'unassigned') return !task.projectId;
    return task.projectId === filterProject;
  });

  const activeTasks = filteredTasks.filter(task => task.status === 'active');
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

  const handleTaskComplete = async (taskId: string) => {
    try {
      await updateTask(taskId, { status: 'completed' });
      // Update the selected tasks in timer state
      const updatedSelectedTasks = selectedTasks.map(task => 
        task.id === taskId ? { ...task, status: 'completed' as const, completedAt: new Date() } : task
      );
      await updateSelectedTasks(updatedSelectedTasks.map(task => task.id));
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim() || isCreatingTask) return;

    try {
      setIsCreatingTask(true);
      const newTask = await createTask({
        name: newTaskName.trim(),
        projectId: filterProject === 'all' || filterProject === 'unassigned' ? '' : filterProject,
      });
      
      // Add to selected tasks
      const newSelectedIds = [...selectedTaskIds, newTask.id];
      await updateSelectedTasks(newSelectedIds);
      
      setNewTaskName('');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const getProjectName = (projectId: string | undefined) => {
    if (!projectId) return 'Unassigned';
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
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

      {/* Task Management Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Session Tasks</h3>
          
          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by project:</label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>

        {/* Add new task during session */}
        <form onSubmit={handleCreateTask} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="Add task for this session..."
              disabled={isCreatingTask}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={!newTaskName.trim() || isCreatingTask}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 transition-colors"
            >
              {isCreatingTask ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>

        {/* Selected tasks */}
        {selectedTasks.length > 0 ? (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-gray-700">Selected Tasks:</h4>
            {selectedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <button
                  onClick={() => handleTaskToggle(task.id)}
                  className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center hover:border-orange-500 transition-colors"
                >
                  {selectedTaskIds.includes(task.id) && (
                    <span className="text-orange-500">✓</span>
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getProjectColor(task.projectId)}`}></div>
                    <span className={`text-sm ${
                      task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {task.name}
                    </span>
                    <span className="text-xs text-gray-500">({getProjectName(task.projectId)})</span>
                  </div>
                </div>

                {task.status === 'active' && (
                  <button
                    onClick={() => handleTaskComplete(task.id)}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                  >
                    Complete
                  </button>
                )}

                {task.status === 'completed' && (
                  <span className="text-green-600 text-sm">✓ Completed</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <div className="text-2xl mb-2">📝</div>
            <p className="text-sm">No tasks selected for this session</p>
            <p className="text-xs mt-1">Add tasks above or select from available tasks</p>
          </div>
        )}

        {/* Available tasks */}
        {activeTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Available Tasks:</h4>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {activeTasks
                .filter(task => !selectedTaskIds.includes(task.id))
                .slice(0, 10)
                .map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleTaskToggle(task.id)}
                    className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center gap-2"
                  >
                    <div className={`w-2 h-2 rounded-full ${getProjectColor(task.projectId)}`}></div>
                    <span>+ {task.name}</span>
                    <span className="text-xs text-gray-400">({getProjectName(task.projectId)})</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
