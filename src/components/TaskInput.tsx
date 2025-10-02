'use client';

import React, { useState } from 'react';
import { CreateTaskData } from '@/types';

interface TaskInputProps {
  projectId: string;
  onCreateTask: (data: CreateTaskData) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
}

export const TaskInput: React.FC<TaskInputProps> = ({
  projectId,
  onCreateTask,
  isLoading = false,
  placeholder = 'Add a new task...'
}) => {
  const [taskName, setTaskName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCreateTask({
        name: taskName.trim(),
        projectId,
      });
      setTaskName('');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading || isSubmitting}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={!taskName.trim() || isLoading || isSubmitting}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Adding...' : 'Add'}
      </button>
    </form>
  );
};
