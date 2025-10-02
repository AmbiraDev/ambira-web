'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TimerContextType, TimerState, ActiveTimer, Project, Task, Session, CreateSessionData } from '@/types';
import { timerApi, taskApi, projectApi, authApi } from '@/lib/api';
import { mockTimerApi, mockTaskApi, mockProjectApi } from '@/lib/mockApi';
import { firebaseProjectApi } from '@/lib/firebaseApi';
import { auth } from '@/lib/firebase';
import { useAuth } from './AuthContext';

// Create context
const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Custom hook to use timer context
export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

// Timer provider component
interface TimerProviderProps {
  children: ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Helper function to get auth token
  const getAuthToken = async (): Promise<string> => {
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    // Get Firebase auth token
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      throw new Error('No Firebase user found');
    }
    
    try {
      const token = await firebaseUser.getIdToken();
      return token;
    } catch (error) {
      throw new Error('Failed to get Firebase auth token');
    }
  };

  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    pausedDuration: 0,
    currentProject: null,
    selectedTasks: [],
    activeTimerId: null,
    isConnected: true,
    lastAutoSave: null,
  });

  // Network connectivity monitoring
  useEffect(() => {
    const updateOnlineStatus = () => {
      setTimerState(prev => ({ ...prev, isConnected: navigator.onLine }));
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Load active timer on mount
  useEffect(() => {
    if (user) {
      loadActiveTimer();
    }
  }, [user]);

  // Auto-save timer state every 30 seconds
  useEffect(() => {
    if (!timerState.isRunning || !timerState.activeTimerId) return;

    const interval = setInterval(async () => {
      try {
        // TODO: Implement Firebase auto-save
        // For now, just update the local state
        setTimerState(prev => ({ ...prev, lastAutoSave: new Date() }));
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.activeTimerId, timerState.pausedDuration, timerState.selectedTasks]);

  // Calculate elapsed time in seconds
  const getElapsedTime = useCallback((): number => {
    if (!timerState.startTime) return 0;
    
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - timerState.startTime.getTime()) / 1000);
    return Math.max(0, elapsed - timerState.pausedDuration);
  }, [timerState.startTime, timerState.pausedDuration]);

  // Format time as HH:MM:SS
  const getFormattedTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Load active timer from server
  const loadActiveTimer = async (): Promise<void> => {
    try {
      // TODO: Implement Firebase active timer loading
      // For now, we'll skip loading active timers to avoid mock API issues
      console.log('Active timer loading disabled - Firebase implementation needed');
    } catch (error) {
      console.error('Failed to load active timer:', error);
    }
  };

  // Start timer
  const startTimer = async (projectId: string, taskIds: string[] = []): Promise<void> => {
    try {
      // TODO: Implement Firebase timer start
      // For now, start timer locally without server sync
      const now = new Date();
      
      setTimerState({
        isRunning: true,
        startTime: now,
        pausedDuration: 0,
        currentProject: null, // Will be set by the component
        selectedTasks: [], // Will be set by the component
        activeTimerId: `local_${Date.now()}`, // Generate local ID
        isConnected: false, // Not connected to server
        lastAutoSave: now,
      });
    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    }
  };

  // Pause timer
  const pauseTimer = async (): Promise<void> => {
    if (!timerState.activeTimerId || !timerState.isRunning) return;

    try {
      // TODO: Implement Firebase timer pause
      console.log('Timer paused locally');

      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        pausedDuration: getElapsedTime(),
      }));
    } catch (error) {
      console.error('Failed to pause timer:', error);
      throw error;
    }
  };

  // Resume timer
  const resumeTimer = async (): Promise<void> => {
    if (!timerState.activeTimerId || timerState.isRunning) return;

    try {
      const token = await getAuthToken();
      // TODO: Implement Firebase timer pause
      console.log('Timer paused locally');

      setTimerState(prev => ({
        ...prev,
        isRunning: true,
        startTime: new Date(), // Reset start time for calculation
      }));
    } catch (error) {
      console.error('Failed to resume timer:', error);
      throw error;
    }
  };

  // Finish timer
  const finishTimer = async (
    title: string,
    description?: string,
    tags?: string[],
    howFelt?: number,
    privateNotes?: string
  ): Promise<Session> => {
    if (!timerState.activeTimerId || !timerState.currentProject) {
      throw new Error('No active timer to finish');
    }

    try {
      const token = await getAuthToken();
      const finalDuration = getElapsedTime();
      const sessionData: CreateSessionData = {
        projectId: timerState.currentProject.id,
        title,
        description,
        duration: finalDuration,
        startTime: timerState.startTime!,
        taskIds: timerState.selectedTasks.map(task => task.id),
        tags,
        howFelt,
        privateNotes,
      };

      // TODO: Implement Firebase session finish
      console.log('Session finished locally');
      const session = { id: `local_${Date.now()}`, ...sessionData }; // Create local session object

      // Reset timer state
      setTimerState({
        isRunning: false,
        startTime: null,
        pausedDuration: 0,
        currentProject: null,
        selectedTasks: [],
        activeTimerId: null,
        isConnected: true,
        lastAutoSave: null,
      });

      return session;
    } catch (error) {
      console.error('Failed to finish timer:', error);
      throw error;
    }
  };

  // Reset timer (cancel without saving)
  const resetTimer = async (): Promise<void> => {
    if (!timerState.activeTimerId) return;

    try {
      const token = await getAuthToken();
      // TODO: Implement Firebase timer cancel
      console.log('Timer cancelled locally');
    } catch (error) {
      console.error('Failed to cancel timer:', error);
    }

    setTimerState({
      isRunning: false,
      startTime: null,
      pausedDuration: 0,
      currentProject: null,
      selectedTasks: [],
      activeTimerId: null,
      isConnected: true,
      lastAutoSave: null,
    });
  };

  // Update selected tasks
  const updateSelectedTasks = async (taskIds: string[]): Promise<void> => {
    if (!timerState.activeTimerId || !timerState.currentProject) return;

    try {
      // TODO: Implement Firebase task loading and timer update
      console.log('Tasks loaded and timer updated locally');
      
      // For now, just update the local state
      setTimerState(prev => ({ 
        ...prev, 
        selectedTasks: taskIds.map(id => ({ id, name: `Task ${id}`, status: 'active' } as any)) // Mock task objects
      }));
    } catch (error) {
      console.error('Failed to update selected tasks:', error);
      throw error;
    }
  };

  const value: TimerContextType = {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    resetTimer,
    updateSelectedTasks,
    loadActiveTimer,
    getElapsedTime,
    getFormattedTime,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};
