'use client';

import React, { useState } from 'react';
import { Task, UpdateTaskData } from '@/types';

interface TaskItemProps {
  task: Task;
  onUpdateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  showCheckbox?: boolean;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSaveEdit?: (name: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onUpdateTask,
  onDeleteTask,
  isSelected = false,
  onToggleSelect,
  showCheckbox = false,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
}) => {
  const [editName, setEditName] = useState(task.name);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusToggle = async () => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      const newStatus = task.status === 'completed' ? 'active' : 'completed';
      await onUpdateTask(task.id, { status: newStatus });
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
      await onUpdateTask(task.id, { status: 'archived' });
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

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return '✅';
      case 'archived':
        return '📦';
      default:
        return '⭕';
    }
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
    <div className={`flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg transition-colors ${
      isSelected ? 'bg-orange-50 border-orange-200' : 'hover:bg-gray-50'
    }`}>
      {/* Selection checkbox */}
      {showCheckbox && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect?.(task.id)}
          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
        />
      )}

      {/* Status icon */}
      <button
        onClick={handleStatusToggle}
        disabled={isUpdating}
        className="text-lg hover:scale-110 transition-transform disabled:opacity-50"
        title={task.status === 'completed' ? 'Mark as active' : 'Mark as completed'}
      >
        {getStatusIcon()}
      </button>

      {/* Task name */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm ${getStatusColor()} ${
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

      {/* Actions */}
      <div className="flex items-center gap-1">
        {task.status === 'active' && (
          <button
            onClick={onStartEdit}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Edit task"
          >
            ✏️
          </button>
        )}
        
        {task.status !== 'archived' && (
          <button
            onClick={handleArchive}
            disabled={isUpdating}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Archive task"
          >
            📦
          </button>
        )}
        
        <button
          onClick={handleDelete}
          disabled={isUpdating}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
          title="Delete task"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};
