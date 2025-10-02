'use client';

import React, { useState, useEffect } from 'react';
import { CreateTaskData, BulkTaskUpdate } from '@/types';
import { useTasks } from '@/contexts/TasksContext';
import { useProjects } from '@/contexts/ProjectsContext';
import { TaskInput } from './TaskInput';
import { TaskItem } from './TaskItem';

interface GlobalTasksProps {
  onTaskSelect?: (task: any) => void;
  selectedTaskIds?: string[];
  onToggleTaskSelection?: (taskId: string) => void;
  showSelection?: boolean;
}

export const GlobalTasks: React.FC<GlobalTasksProps> = ({
  onTaskSelect,
  selectedTaskIds = [],
  onToggleTaskSelection,
  showSelection = false,
}) => {
  const { tasks, createTask, updateTask, deleteTask, bulkUpdateTasks, loadProjectTasksAndAdd, getAllTasks } = useTasks();
  const { projects } = useProjects();
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'archived'>('all');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all tasks (project tasks + unassigned tasks)
  useEffect(() => {
    const loadAllTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load unassigned tasks first
        await getAllTasks();
        
        // Load tasks for each project and add them to the existing tasks
        for (const project of projects) {
          await loadProjectTasksAndAdd(project.id);
        }
      } catch (error) {
        console.error('Failed to load all tasks:', error);
        setError('Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (projects.length > 0) {
      loadAllTasks();
    }
  }, [projects, getAllTasks, loadProjectTasksAndAdd]);

  const filteredTasks = tasks.filter(task => {
    const projectMatch = filterProject === 'all' || 
      (filterProject === 'unassigned' ? !task.projectId : task.projectId === filterProject);
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    return projectMatch && statusMatch;
  });

  const handleCreateTask = async (data: CreateTaskData) => {
    try {
      setIsCreating(true);
      await createTask(data);
    } finally {
      setIsCreating(false);
    }
  };

  const handleBulkUpdate = async (update: BulkTaskUpdate) => {
    try {
      await bulkUpdateTasks(update);
      setSelectedTasks([]);
    } catch (error) {
      console.error('Failed to bulk update tasks:', error);
    }
  };

  const handleTaskToggle = (taskId: string) => {
    if (onToggleTaskSelection) {
      onToggleTaskSelection(taskId);
    } else {
      setSelectedTasks(prev => 
        prev.includes(taskId) 
          ? prev.filter(id => id !== taskId)
          : [...prev, taskId]
      );
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

  const currentSelectedTasks = showSelection ? selectedTaskIds : selectedTasks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">All Tasks</h2>
        <div className="text-sm text-gray-600">
          {filteredTasks.length} tasks
          {currentSelectedTasks.length > 0 && ` • ${currentSelectedTasks.length} selected`}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Project:</label>
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

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Add new task */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Add New Task</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <TaskInput
              projectId={filterProject === 'all' || filterProject === 'unassigned' ? '' : filterProject}
              onCreateTask={handleCreateTask}
              isLoading={isCreating}
              placeholder={filterProject === 'all' || filterProject === 'unassigned' ? "Select a project first..." : "Enter task name..."}
              disabled={filterProject === 'all' || filterProject === 'unassigned'}
            />
          </div>
          {filterProject !== 'all' && filterProject !== 'unassigned' && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Will be added to:</span>
              <span className="font-medium">{getProjectName(filterProject)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {currentSelectedTasks.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-orange-800">
              {currentSelectedTasks.length} tasks selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkUpdate({ taskIds: currentSelectedTasks, status: 'completed' })}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
              >
                Complete All
              </button>
              <button
                onClick={() => handleBulkUpdate({ taskIds: currentSelectedTasks, status: 'archived' })}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
              >
                Archive All
              </button>
              <button
                onClick={() => setSelectedTasks([])}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>No tasks found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add a new task</p>
          </div>
        ) : (
          (() => {
            // Group tasks by project
            const groupedTasks = filteredTasks.reduce((groups, task) => {
              const projectId = task.projectId || 'unassigned';
              if (!groups[projectId]) {
                groups[projectId] = [];
              }
              groups[projectId].push(task);
              return groups;
            }, {} as Record<string, typeof filteredTasks>);

            return Object.entries(groupedTasks).map(([projectId, tasks]) => (
              <div key={projectId} className="bg-white border border-gray-200 rounded-lg p-4">
                {/* Project header */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <div className={`w-3 h-3 rounded-full ${getProjectColor(projectId === 'unassigned' ? null : projectId)}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {projectId === 'unassigned' ? 'Unassigned Tasks' : getProjectName(projectId)}
                  </span>
                  <span className="text-xs text-gray-500">({tasks.length})</span>
                </div>

                {/* Tasks in this project */}
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3">
                      {/* Task content */}
                      <div className="flex-1">
                        <TaskItem
                          task={task}
                          onUpdateTask={updateTask}
                          onDeleteTask={deleteTask}
                          isSelected={currentSelectedTasks.includes(task.id)}
                          onToggleSelect={handleTaskToggle}
                          showCheckbox={true}
                        />
                      </div>

                      {/* Project assignment for unassigned tasks */}
                      {!task.projectId && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Assign to:</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                updateTask(task.id, { projectId: e.target.value });
                              }
                            }}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="">Select project...</option>
                            {projects.map(project => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()
        )}
      </div>
    </div>
  );
};
