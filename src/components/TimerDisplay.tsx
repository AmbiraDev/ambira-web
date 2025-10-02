'use client';

import React, { useState, useEffect } from 'react';
import { useTimer } from '@/contexts/TimerContext';

interface TimerDisplayProps {
  className?: string;
  showMilliseconds?: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  className = '', 
  showMilliseconds = false 
}) => {
  const { timerState, getElapsedTime, getFormattedTime } = useTimer();
  const [displayTime, setDisplayTime] = useState(0);

  // Update display time every second
  useEffect(() => {
    if (!timerState.isRunning) {
      setDisplayTime(timerState.pausedDuration);
      return;
    }

    const interval = setInterval(() => {
      setDisplayTime(getElapsedTime());
    }, 1000);

    // Set initial time
    setDisplayTime(getElapsedTime());

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.startTime, timerState.pausedDuration, getElapsedTime]);

  const formatTime = (seconds: number): string => {
    if (showMilliseconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 100);
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    
    return getFormattedTime(seconds);
  };

  return (
    <div className={`font-mono text-center ${className}`}>
      <div className={`text-4xl font-bold ${
        timerState.isRunning 
          ? 'text-green-600' 
          : timerState.pausedDuration > 0 
            ? 'text-yellow-600' 
            : 'text-gray-400'
      }`}>
        {formatTime(displayTime)}
      </div>
      {timerState.currentProject && (
        <div className="text-sm text-gray-600 mt-1">
          {timerState.currentProject.name}
        </div>
      )}
    </div>
  );
};
