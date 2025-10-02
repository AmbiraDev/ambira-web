'use client';

import React, { useState, useEffect } from 'react';
import { Task, UpdateTaskData } from '@/types';
import { useTimer } from '@/contexts/TimerContext';
import { useTasks } from '@/contexts/TasksContext';

interface TaskTimerProps {
  projectId: string;
}

export const TaskTimer: React.FC<TaskTimerProps> = ({ projectId }) => {
  const { timerState, updateSelectedTasks } = useTimer();
  const { tasks, updateTask, createTask } = useTasks();
  const [newTaskName, setNewTaskName] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);

  // Filter tasks for this project
  const projectTasks = tasks.filter(task => task.projectId === projectId);
  const activeTasks = projectTasks.filter(task => task.status === 'active');
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
        projectId,
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Session Tasks</h3>
        <div className="text-sm text-gray-600">
          {completedTasksCount} of {selectedTasks.length} completed
        </div>
      </div>

      {/* Add new task during timer */}
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
            {isCreatingTask ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>

      {/* Selected tasks */}
      {selectedTasks.length > 0 ? (
        <div className="space-y-2">
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
                <span className={`text-sm ${
                  task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                }`}>
                  {task.name}
                </span>
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
          <p className="text-xs mt-1">Add tasks above or select from project tasks</p>
        </div>
      )}

      {/* Available project tasks */}
      {activeTasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Available Tasks:</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {activeTasks
              .filter(task => !selectedTaskIds.includes(task.id))
              .slice(0, 5)
              .map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleTaskToggle(task.id)}
                  className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  + {task.name}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
