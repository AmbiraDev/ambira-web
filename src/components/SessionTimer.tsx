'use client';

import React, { useState, useEffect } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useAuth } from '@/contexts/AuthContext';
import { projectApi, taskApi, authApi } from '@/lib/api';
import { mockProjectApi, mockTaskApi } from '@/lib/mockApi';
import { Project, Task } from '@/types';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';

interface SessionTimerProps {
  className?: string;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({ className = '' }) => {
  const { timerState, startTimer, updateSelectedTasks } = useTimer();
  const { user } = useAuth();

  // Helper function to get auth token
  const getAuthToken = (): string => {
    const token = authApi.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  };
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const token = getAuthToken();
        const projectList = await mockProjectApi.getProjects(token);
        setProjects(projectList);
        
        // If timer already has a project selected, use it
        if (timerState.currentProject) {
          setSelectedProjectId(timerState.currentProject.id);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };

    if (user) {
      loadProjects();
    }
  }, [user, timerState.currentProject]);

  // Load tasks when project changes
  useEffect(() => {
    const loadTasks = async () => {
      if (!selectedProjectId) {
        setTasks([]);
        return;
      }

      try {
        const token = getAuthToken();
        const taskList = await mockTaskApi.getProjectTasks(selectedProjectId, token);
        setTasks(taskList.filter(task => task.status === 'active'));
        
        // If timer already has tasks selected, use them
        if (timerState.selectedTasks.length > 0) {
          setSelectedTaskIds(timerState.selectedTasks.map(task => task.id));
        }
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    };

    loadTasks();
  }, [selectedProjectId, timerState.selectedTasks]);

  const handleStartTimer = async () => {
    if (!selectedProjectId) return;

    try {
      setIsLoading(true);
      await startTimer(selectedProjectId, selectedTaskIds);
    } catch (error) {
      console.error('Failed to start timer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: string) => {
    const newSelectedTaskIds = selectedTaskIds.includes(taskId)
      ? selectedTaskIds.filter(id => id !== taskId)
      : [...selectedTaskIds, taskId];

    setSelectedTaskIds(newSelectedTaskIds);

    // Update timer if it's running
    if (timerState.isRunning && timerState.activeTimerId) {
      try {
        await updateSelectedTasks(newSelectedTaskIds);
      } catch (error) {
        console.error('Failed to update selected tasks:', error);
      }
    }
  };

  const handleFinishModalOpen = () => {
    setShowFinishModal(true);
  };

  const isActive = timerState.isRunning || timerState.pausedDuration > 0;

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Focus Session</h1>
          <p className="text-gray-600">Track your work and stay productive</p>
        </div>

        {/* Timer Display */}
        <div className="mb-8">
          <TimerDisplay className="mb-4" showMilliseconds={false} />
        </div>

        {/* Project Selection */}
        {!isActive && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">Choose a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Current Project Display (when timer is active) */}
        {isActive && timerState.currentProject && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {timerState.currentProject.icon || 'P'}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{timerState.currentProject.name}</h3>
                <p className="text-sm text-gray-600">{timerState.currentProject.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Task Selection */}
        {selectedProjectId && tasks.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tasks (Optional)
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tasks.map((task) => (
                <label key={task.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.includes(task.id)}
                    onChange={() => handleTaskToggle(task.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-700">{task.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Selected Tasks Display (when timer is active) */}
        {isActive && timerState.selectedTasks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Tasks</h3>
            <div className="space-y-2">
              {timerState.selectedTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{task.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timer Controls */}
        <div className="flex justify-center">
          <CustomTimerControls 
            onFinish={handleFinishModalOpen}
            onStart={handleStartTimer}
            className="mb-4"
          />
        </div>

        {/* Connection Status */}
        {!timerState.isConnected && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2 text-orange-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">You're offline</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Your timer will continue running. Changes will sync when you reconnect.
            </p>
          </div>
        )}
      </div>

      {/* Finish Session Modal */}
      {showFinishModal && (
        <FinishSessionModal
          onClose={() => setShowFinishModal(false)}
          onFinish={(data) => {
            setShowFinishModal(false);
            // Handle finish logic
          }}
        />
      )}
    </div>
  );
};

// Finish Session Modal Component
interface FinishSessionModalProps {
  onClose: () => void;
  onFinish: (data: any) => void;
}

const FinishSessionModal: React.FC<FinishSessionModalProps> = ({ onClose, onFinish }) => {
  const { timerState, finishTimer } = useTimer();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [howFelt, setHowFelt] = useState<number>(3);
  const [privateNotes, setPrivateNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFinish = async () => {
    if (!title.trim()) {
      alert('Please enter a session title');
      return;
    }

    try {
      setIsLoading(true);
      const session = await finishTimer(title, description, tags, howFelt, privateNotes);
      onFinish(session);
    } catch (error) {
      console.error('Failed to finish session:', error);
      alert('Failed to save session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Finish Session</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What did you work on?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="What did you accomplish?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How did you feel? (1-5)
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setHowFelt(rating)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    howFelt === rating
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Private Notes
            </label>
            <textarea
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Any private notes about this session..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleFinish}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {isLoading ? 'Saving...' : 'Finish Session'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom Timer Controls for SessionTimer
interface CustomTimerControlsProps {
  onFinish: () => void;
  onStart: () => void;
  className?: string;
}

const CustomTimerControls: React.FC<CustomTimerControlsProps> = ({ 
  onFinish, 
  onStart,
  className = '' 
}) => {
  const { timerState, pauseTimer, resumeTimer, resetTimer } = useTimer();
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    try {
      setIsLoading(true);
      await onStart();
    } catch (error) {
      console.error('Failed to start timer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      setIsLoading(true);
      await pauseTimer();
    } catch (error) {
      console.error('Failed to pause timer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setIsLoading(true);
      await resumeTimer();
    } catch (error) {
      console.error('Failed to resume timer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset the timer? This will discard the current session.')) {
      try {
        setIsLoading(true);
        await resetTimer();
      } catch (error) {
        console.error('Failed to reset timer:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isActive = timerState.isRunning || timerState.pausedDuration > 0;

  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      {!isActive ? (
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          <span>{isLoading ? 'Starting...' : 'Start'}</span>
        </button>
      ) : (
        <>
          {timerState.isRunning ? (
            <button
              onClick={handlePause}
              disabled={isLoading}
              className="px-6 py-3 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{isLoading ? 'Pausing...' : 'Pause'}</span>
            </button>
          ) : (
            <button
              onClick={handleResume}
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>{isLoading ? 'Resuming...' : 'Resume'}</span>
            </button>
          )}

          <button
            onClick={onFinish}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Finish</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isLoading}
            className="px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>Reset</span>
          </button>
        </>
      )}

      {/* Connection status indicator */}
      {!timerState.isConnected && (
        <div className="flex items-center space-x-1 text-orange-600 text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Offline</span>
        </div>
      )}
    </div>
  );
};
