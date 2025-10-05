'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Task, UpdateTaskData } from '@/types';
import { Edit, Archive, Trash2, MoreVertical, Circle, CheckCircle2 } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onUpdateTask: (id: string, data: UpdateTaskData, projectId?: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  projectId?: string;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  showCheckbox?: boolean;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSaveEdit?: (name: string) => void;
  availableProjects?: Array<{ id: string; name: string; icon?: string }>;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onUpdateTask,
  onDeleteTask,
  projectId,
  isSelected = false,
  onToggleSelect,
  showCheckbox = false,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  availableProjects = [],
}) => {
  const [editName, setEditName] = useState(task.name);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleStatusToggle = async () => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // If marking as complete, add visual feedback first
      if (task.status === 'active') {
        // Add strike-through effect immediately
        const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
        if (taskElement) {
          const taskNameElement = taskElement.querySelector('span');
          if (taskNameElement) {
            taskNameElement.classList.add('line-through', 'opacity-60');
          }
        }
        
        // Wait a moment for visual effect, then update status
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const newStatus = task.status === 'completed' ? 'active' : 'completed';
      await onUpdateTask(task.id, { status: newStatus }, projectId);
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchive = async () => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      await onUpdateTask(task.id, { status: 'archived' }, projectId);
    } catch (error) {
      console.error('Failed to archive task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${task.name}"?`)) {
      try {
        await onDeleteTask(task.id);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleAssignToProject = async (projectId: string) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      await onUpdateTask(task.id, { projectId });
      setShowAssignMenu(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to assign task to project:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim() && editName.trim() !== task.name) {
      onSaveEdit?.(editName.trim());
    } else {
      onCancelEdit?.();
    }
  };

  const handleEditCancel = () => {
    setEditName(task.name);
    onCancelEdit?.();
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'completed':
        return 'text-green-600';
      case 'archived':
        return 'text-gray-500';
      default:
        return 'text-gray-700';
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
        <form onSubmit={handleEditSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={!editName.trim()}
            className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-300 text-sm"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleEditCancel}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            Cancel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      data-task-id={task.id}
      className={`flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg transition-colors ${
        isSelected ? 'bg-orange-50 border-orange-200' : 'hover:bg-gray-50'
      }`}
    >
      {/* Status button - circle */}
      <button
        onClick={handleStatusToggle}
        disabled={isUpdating}
        className="flex-shrink-0 transition-all duration-300 disabled:opacity-50"
        title={task.status === 'completed' ? 'Mark as active' : 'Mark as completed'}
      >
        {task.status === 'completed' ? (
          <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-500" />
        ) : task.status === 'archived' ? (
          <CheckCircle2 className="w-6 h-6 text-gray-400 fill-gray-400" />
        ) : (
          <Circle className="w-6 h-6 text-gray-800 hover:text-gray-600" />
        )}
      </button>

      {/* Task name */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm md:text-base break-words ${getStatusColor()} ${
          task.status === 'completed' ? 'line-through' : ''
        }`}>
          {task.name}
        </span>
        {task.completedAt && (
          <div className="text-xs text-gray-500 mt-1">
            Completed {task.completedAt.toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Actions - Desktop: Individual buttons, Mobile: Three-dot menu */}
      <div className="flex items-center gap-1">
        {/* Desktop - Individual buttons */}
        <div className="hidden md:flex items-center gap-1">
          {task.status === 'active' && (
            <button
              onClick={onStartEdit}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Edit task"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {task.status !== 'archived' && (
            <button
              onClick={handleArchive}
              disabled={isUpdating}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Archive task"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={isUpdating}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile - Three-dot menu */}
        <div className="md:hidden relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && !showAssignMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
              {task.status === 'active' && onStartEdit && (
                <button
                  onClick={() => {
                    onStartEdit();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}

              {!task.projectId && availableProjects.length > 0 && (
                <button
                  onClick={() => setShowAssignMenu(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Assign to Project</span>
                </button>
              )}

              {task.status !== 'archived' && (
                <button
                  onClick={() => {
                    handleArchive();
                    setShowMenu(false);
                  }}
                  disabled={isUpdating}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Archive className="w-4 h-4" />
                  <span>Archive</span>
                </button>
              )}

              <button
                onClick={() => {
                  handleDelete();
                  setShowMenu(false);
                }}
                disabled={isUpdating}
                className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          )}

          {/* Assignment submenu */}
          {showMenu && showAssignMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px] max-h-[300px] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Select Project</span>
                <button
                  onClick={() => setShowAssignMenu(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              {availableProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleAssignToProject(project.id)}
                  disabled={isUpdating}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {project.icon && <span className="text-lg">{project.icon}</span>}
                  <span>{project.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
