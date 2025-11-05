'use client';

import React, { useState, useEffect } from 'react';
import { useTimer } from '@/features/timer/hooks';
import { useAuth } from '@/hooks/useAuth';
import { Project, CreateSessionData } from '@/types';
import { TimerDisplay } from './TimerDisplay';
import { SaveSession } from './SaveSession';
import { firebaseApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SessionTimerProps {
  className?: string;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({
  className = '',
}) => {
  const { timerState, startTimer } = useTimer();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        // TODO: Load projects from Firebase
        const projectList: Project[] = []; // await mockProjectApi.getProjects(token);
        setProjects(projectList);

        // If timer already has a project selected, use it
        if (timerState.currentProject) {
          setSelectedProjectId(timerState.currentProject.id);
        }
      } catch {}
    };

    if (user) {
      loadProjects();
    }
  }, [user, timerState.currentProject]);

  const handleStartTimer = async () => {
    if (!selectedProjectId) return;

    try {
      setIsLoading(true);
      await startTimer(selectedProjectId);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishModalOpen = () => {
    setShowFinishModal(true);
  };

  const isActive = timerState.isRunning || timerState.pausedDuration > 0;

  return (
    <div className={cn('max-w-4xl mx-auto p-6', className)}>
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Focus Session
          </h1>
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
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">Choose a project...</option>
              {projects.map(project => (
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
                <h3 className="font-medium text-gray-900">
                  {timerState.currentProject.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {timerState.currentProject.description}
                </p>
              </div>
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
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">You're offline</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Your timer will continue running. Changes will sync when you
              reconnect.
            </p>
          </div>
        )}
      </div>

      {/* Finish Session Modal */}
      {showFinishModal && (
        <SaveSession
          onSave={async data => {
            try {
              // Create session data
              const sessionData: CreateSessionData = {
                ...data,
              };

              // Create session and post if visibility allows
              if (data.visibility !== 'private') {
                // Show post creation modal for non-private sessions
                // For now, we'll create the session with a basic post
                await firebaseApi.session.createSessionWithPost(
                  sessionData,
                  data.description || `Completed ${data.title}`,
                  data.visibility
                );
              } else {
                // Create private session only
                await firebaseApi.session.createSession(sessionData);
              }

              setShowFinishModal(false);
              // Timer will be finished by the context
            } catch (error) {
              throw error;
            }
          }}
          onCancel={() => setShowFinishModal(false)}
          initialData={{
            projectId: timerState.currentProject?.id || '',
            activityId: timerState.currentProject?.id || '',
            title: '',
            description: '',
            duration: timerState.pausedDuration || 0,
            startTime: timerState.startTime || new Date(),
            tags: [],
            visibility: 'everyone',
            howFelt: 3,
            privateNotes: '',
          }}
          isLoading={false}
        />
      )}
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
  className = '',
}) => {
  const { timerState, pauseTimer, resumeTimer, resetTimer } = useTimer();
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    try {
      setIsLoading(true);
      await onStart();
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      setIsLoading(true);
      await pauseTimer();
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setIsLoading(true);
      await resumeTimer();
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        'Are you sure you want to reset the timer? This will discard the current session.'
      )
    ) {
      try {
        setIsLoading(true);
        await resetTimer();
      } catch {
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isActive = timerState.isRunning || timerState.pausedDuration > 0;

  return (
    <div
      className={cn('flex items-center justify-center space-x-3', className)}
    >
      {!isActive ? (
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
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
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
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
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
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
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Finish</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isLoading}
            className="px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            <span>Reset</span>
          </button>
        </>
      )}

      {/* Connection status indicator */}
      {!timerState.isConnected && (
        <div className="flex items-center space-x-1 text-orange-600 text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>Offline</span>
        </div>
      )}
    </div>
  );
};
