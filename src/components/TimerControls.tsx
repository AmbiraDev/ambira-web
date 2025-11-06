'use client';

import React, { useState } from 'react';
import { useTimer } from '@/features/timer/hooks';

interface TimerControlsProps {
  className?: string;
  onFinish?: () => void;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  className = '',
  onFinish,
}) => {
  const { timerState, startTimer, pauseTimer, resumeTimer, resetTimer } =
    useTimer();
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    // This would typically open a modal to select project
    // For now, we'll assume a project is already selected
    if (timerState.currentProject) {
      try {
        setIsLoading(true);
        await startTimer(timerState.currentProject.id);
      } catch {
      } finally {
        setIsLoading(false);
      }
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

  const handleFinish = () => {
    if (onFinish) {
      onFinish();
    }
  };

  const isActive = timerState.isRunning || timerState.pausedDuration > 0;

  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      {!isActive ? (
        <button
          onClick={handleStart}
          disabled={isLoading || !timerState.currentProject}
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
              className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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
            onClick={handleFinish}
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
