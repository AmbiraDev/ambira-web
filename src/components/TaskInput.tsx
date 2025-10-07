'use client';

import React, { useState } from 'react';
import { CreateTaskData } from '@/types';
import { useToast } from '@/contexts/ToastContext';

interface TaskInputProps {
  projectId: string;
  onCreateTask: (data: CreateTaskData) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({
  projectId,
  onCreateTask,
  isLoading = false,
  placeholder = 'Add a new task...',
  disabled = false
}) => {
  const { success, error: showError } = useToast();
  const [taskName, setTaskName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskName.trim() || isSubmitting || disabled) return;

    try {
      setIsSubmitting(true);
      const trimmedName = taskName.trim();
      await onCreateTask({
        name: trimmedName,
        projectId,
      });
      success('Task added!');
      setTaskName('');
    } catch (error) {
      console.error('Failed to create task:', error);
      showError('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading || isSubmitting || disabled}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] disabled:bg-gray-100 disabled:cursor-not-allowed"
        aria-label="Task name"
        maxLength={200}
      />
      <button
        type="submit"
        disabled={!taskName.trim() || isLoading || isSubmitting || disabled}
        className="px-3 py-2 bg-[#007AFF] text-white border border-[#007AFF] rounded-lg hover:bg-[#0051D5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Add task"
      >
        {isSubmitting ? '+' : '+'}
      </button>
    </form>
  );
};
