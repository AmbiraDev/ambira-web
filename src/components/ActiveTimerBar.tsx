'use client';

import React from 'react';
import Link from 'next/link';
import { useTimer } from '@/contexts/TimerContext';
import { TimerDisplay } from './TimerDisplay';

interface ActiveTimerBarProps {
  className?: string;
}

export const ActiveTimerBar: React.FC<ActiveTimerBarProps> = ({ className = '' }) => {
  const { timerState, pauseTimer, resumeTimer } = useTimer();

  // Don't render if no active timer
  if (!timerState.currentProject || (!timerState.isRunning && timerState.pausedDuration === 0)) {
    return null;
  }

  return (
    <div className={`bg-white border-b border-gray-200 shadow-sm ${className}`}>
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Left side - Timer info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                timerState.isRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`} />
              <span className="text-sm font-medium text-gray-700">
                {timerState.isRunning ? 'Running' : 'Paused'}
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              <span className="font-medium">{timerState.currentProject.name}</span>
              {timerState.selectedTasks.length > 0 && (
                <span className="ml-1">• {timerState.selectedTasks.length} task(s)</span>
              )}
            </div>
          </div>

          {/* Center - Timer display */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center space-x-4">
              <TimerDisplay className="text-lg" />
              
              {/* Quick controls */}
              <div className="flex items-center space-x-2">
                {timerState.isRunning ? (
                  <button 
                    onClick={async () => {
                      try {
                        await pauseTimer();
                      } catch (error) {
                        console.error('Failed to pause timer:', error);
                      }
                    }}
                    className="p-1 text-gray-600 hover:text-yellow-600 transition-colors"
                    title="Pause timer"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                ) : (
                  <button 
                    onClick={async () => {
                      try {
                        await resumeTimer();
                      } catch (error) {
                        console.error('Failed to resume timer:', error);
                      }
                    }}
                    className="p-1 text-gray-600 hover:text-green-600 transition-colors"
                    title="Resume timer"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            {/* Connection status */}
            {!timerState.isConnected && (
              <div className="flex items-center space-x-1 text-orange-600 text-xs">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Offline</span>
              </div>
            )}

            {/* Auto-save indicator */}
            {timerState.lastAutoSave && (
              <div className="text-xs text-gray-500">
                Saved {Math.floor((Date.now() - timerState.lastAutoSave.getTime()) / 1000)}s ago
              </div>
            )}

            {/* Timer page link */}
            <Link 
              href="/timer"
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              View Timer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
