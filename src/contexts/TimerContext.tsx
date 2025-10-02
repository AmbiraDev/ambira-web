'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TimerContextType, TimerState, ActiveTimer, Project, Task, Session, CreateSessionData } from '@/types';
import { timerApi, taskApi, projectApi, authApi } from '@/lib/api';
import { mockTimerApi, mockTaskApi, mockProjectApi } from '@/lib/mockApi';
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
  const getAuthToken = (): string => {
    const token = authApi.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
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
        const token = getAuthToken();
        const elapsedTime = getElapsedTime();
        await mockTimerApi.updateActiveTimer(
          timerState.activeTimerId!,
          timerState.pausedDuration,
          timerState.selectedTasks.map(task => task.id),
          token
        );
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
      const token = getAuthToken();
      const activeTimer = await mockTimerApi.getActiveTimer(token);
      if (activeTimer) {
        // Load project and tasks
        const [project, tasks] = await Promise.all([
          mockProjectApi.getProject(activeTimer.projectId, token),
          mockTaskApi.getProjectTasks(activeTimer.projectId, token)
        ]);

        const selectedTasks = tasks.filter(task => activeTimer.selectedTaskIds.includes(task.id));

        setTimerState({
          isRunning: true, // Active timer is always running (paused duration handled separately)
          startTime: new Date(activeTimer.startTime),
          pausedDuration: activeTimer.pausedDuration,
          currentProject: project,
          selectedTasks,
          activeTimerId: activeTimer.id,
          isConnected: true,
          lastAutoSave: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to load active timer:', error);
    }
  };

  // Start timer
  const startTimer = async (projectId: string, taskIds: string[] = []): Promise<void> => {
    try {
      const token = getAuthToken();
      const [activeTimer, project, tasks] = await Promise.all([
        mockTimerApi.startSession(projectId, taskIds, token),
        mockProjectApi.getProject(projectId, token),
        mockTaskApi.getProjectTasks(projectId, token)
      ]);

      const selectedTasks = tasks.filter(task => taskIds.includes(task.id));

      setTimerState({
        isRunning: true,
        startTime: new Date(activeTimer.startTime),
        pausedDuration: 0,
        currentProject: project,
        selectedTasks,
        activeTimerId: activeTimer.id,
        isConnected: true,
        lastAutoSave: new Date(),
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
      const token = getAuthToken();
      const currentElapsed = getElapsedTime();
      await mockTimerApi.updateActiveTimer(
        timerState.activeTimerId,
        currentElapsed,
        timerState.selectedTasks.map(task => task.id),
        token
      );

      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        pausedDuration: currentElapsed,
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
      const token = getAuthToken();
      await mockTimerApi.updateActiveTimer(
        timerState.activeTimerId,
        timerState.pausedDuration,
        timerState.selectedTasks.map(task => task.id),
        token
      );

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
      const token = getAuthToken();
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

      const session = await mockTimerApi.finishSession(timerState.activeTimerId, sessionData, token);

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
      const token = getAuthToken();
      await mockTimerApi.cancelActiveTimer(timerState.activeTimerId, token);
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
      const token = getAuthToken();
      const tasks = await mockTaskApi.getProjectTasks(timerState.currentProject.id, token);
      const selectedTasks = tasks.filter(task => taskIds.includes(task.id));

      await mockTimerApi.updateActiveTimer(
        timerState.activeTimerId,
        timerState.pausedDuration,
        taskIds,
        token
      );

      setTimerState(prev => ({ ...prev, selectedTasks }));
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
