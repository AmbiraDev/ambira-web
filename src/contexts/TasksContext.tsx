'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TaskContextType, Task, CreateTaskData, UpdateTaskData, BulkTaskUpdate, TaskStats } from '@/types';
import { firebaseTaskApi } from '@/lib/firebaseApi';
import { useAuth } from './AuthContext';

// Create context
const TasksContext = createContext<TaskContextType | undefined>(undefined);

// Custom hook to use tasks context
export const useTasks = (): TaskContextType => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};

// Tasks provider component
interface TasksProviderProps {
  children: ReactNode;
}

export const TasksProvider: React.FC<TasksProviderProps> = ({ children }) => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tasks for a project
  const getProjectTasks = useCallback(async (projectId: string): Promise<Task[]> => {
    try {
      const projectTasks = await firebaseTaskApi.getProjectTasks(projectId);
      return projectTasks;
    } catch (error) {
      console.error('Failed to load project tasks:', error);
      throw error;
    }
  }, []);

  // Create a new task
  const createTask = useCallback(async (data: CreateTaskData): Promise<Task> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newTask = await firebaseTaskApi.createTask(data);
      
      // Optimistically update local state
      setTasks(prev => [...prev, newTask]);
      
      return newTask;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update a task
  const updateTask = useCallback(async (id: string, data: UpdateTaskData, projectId: string): Promise<Task> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedTask = await firebaseTaskApi.updateTask(id, data, projectId);
      
      // Optimistically update local state
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
      
      return updatedTask;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a task
  const deleteTask = useCallback(async (id: string, projectId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await firebaseTaskApi.deleteTask(id, projectId);
      
      // Optimistically update local state
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Bulk update tasks
  const bulkUpdateTasks = useCallback(async (update: BulkTaskUpdate, projectId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await firebaseTaskApi.bulkUpdateTasks(update, projectId);
      
      // Optimistically update local state
      setTasks(prev => prev.map(task => 
        update.taskIds.includes(task.id) 
          ? { ...task, status: update.status, completedAt: update.status === 'completed' ? new Date() : undefined }
          : task
      ));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update tasks';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get task statistics
  const getTaskStats = useCallback(async (projectId: string): Promise<TaskStats> => {
    try {
      return await firebaseTaskApi.getTaskStats(projectId);
    } catch (error) {
      console.error('Failed to load task stats:', error);
      throw error;
    }
  }, []);

  // Load tasks for a project and update state
  const loadProjectTasks = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const projectTasks = await getProjectTasks(projectId);
      setTasks(projectTasks);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tasks';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getProjectTasks]);

  // Clear tasks when user changes
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setError(null);
    }
  }, [user]);

  const value: TaskContextType = {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    bulkUpdateTasks,
    getProjectTasks,
    getTaskStats,
    loadProjectTasks,
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
};
