'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TimerContextType, TimerState, ActiveTimer, Project, Task, Session, CreateSessionData } from '@/types';
import { timerApi, taskApi, projectApi, authApi } from '@/lib/api';
import { mockTimerApi, mockTaskApi, mockProjectApi } from '@/lib/mockApi';
import { firebaseProjectApi, firebaseTaskApi, firebaseSessionApi } from '@/lib/firebaseApi';
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

  // Also react to raw Firebase auth state changes (covers cross-origin reloads)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        loadActiveTimer();
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto-save timer state every 30 seconds
  useEffect(() => {
    if (!timerState.isRunning || !timerState.activeTimerId) return;

    const interval = setInterval(async () => {
      try {
        if (timerState.currentProject) {
          // Persist the current running state
          await firebaseSessionApi.saveActiveSession({
            startTime: timerState.startTime || new Date(),
            projectId: timerState.currentProject.id,
            selectedTaskIds: timerState.selectedTasks.map(t => t.id),
            pausedDuration: 0,
            isPaused: false,
          });
        }
        setTimerState(prev => ({ ...prev, lastAutoSave: new Date() }));
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.activeTimerId, timerState.pausedDuration, timerState.selectedTasks]);

  // Refresh active timer when window regains focus (handles switching origins/ports)
  useEffect(() => {
    const handleFocus = () => {
      // If we don't have a running timer locally, try to pull from server
      if (!timerState.isRunning && !timerState.activeTimerId) {
        loadActiveTimer();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [timerState.isRunning, timerState.activeTimerId]);

  // Calculate elapsed time in seconds
  const getElapsedTime = useCallback((): number => {
    if (!timerState.startTime) return 0;
    // When paused, the pausedDuration represents total elapsed so far
    if (!timerState.isRunning) {
      return timerState.pausedDuration || 0;
    }
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - timerState.startTime.getTime()) / 1000);
    return Math.max(0, elapsed);
  }, [timerState.startTime, timerState.pausedDuration, timerState.isRunning]);

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
      if (!user) return;

      const activeSession = await firebaseSessionApi.getActiveSession();
      if (!activeSession) return;

      // Get project and task details
      const projects = await firebaseProjectApi.getProjects();
      const project = projects.find(p => p.id === activeSession.projectId);
      
      if (!project) {
        console.error('Project not found for active session');
        return;
      }

      // Get task details
      const selectedTasks = [];
      try {
        const projectTasks = await firebaseTaskApi.getProjectTasks(activeSession.projectId);
        selectedTasks.push(...projectTasks.filter(task => 
          activeSession.selectedTaskIds.includes(task.id)
        ));
      } catch (error) {
        console.error('Failed to load tasks for active session:', error);
      }

      // Set timer state
      setTimerState({
        isRunning: !activeSession.isPaused,
        startTime: activeSession.startTime,
        pausedDuration: activeSession.pausedDuration,
        currentProject: project,
        selectedTasks,
        activeTimerId: `active_${Date.now()}`,
        isConnected: true,
        lastAutoSave: null,
      });

      console.log('Active timer loaded successfully');
    } catch (error) {
      console.error('Failed to load active timer:', error);
    }
  };

  // Start timer
  const startTimer = async (projectId: string, taskIds: string[] = []): Promise<void> => {
    try {
      if (!user) {
        throw new Error('User must be authenticated to start timer');
      }

      const now = new Date();
      
      // Get project details
      const projects = await firebaseProjectApi.getProjects();
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Get task details for selected tasks
      const selectedTasks = [];
      try {
        // Get all tasks for the project
        const projectTasks = await firebaseTaskApi.getProjectTasks(projectId);
        const selectedTaskObjects = projectTasks.filter(task => taskIds.includes(task.id));
        selectedTasks.push(...selectedTaskObjects);
      } catch (error) {
        console.warn('Failed to load project tasks:', error);
      }

      // Save active session to Firebase
      await firebaseSessionApi.saveActiveSession({
        startTime: now,
        projectId,
        selectedTaskIds: taskIds,
        pausedDuration: 0,
        isPaused: false
      });

      const timerId = `timer_${Date.now()}_${user.uid}`;
      
      setTimerState({
        isRunning: true,
        startTime: now,
        pausedDuration: 0,
        currentProject: project,
        selectedTasks,
        activeTimerId: timerId,
        isConnected: true,
        lastAutoSave: now,
      });

      console.log('Timer started successfully with Firebase integration');
    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    }
  };

  // Pause timer
  const pauseTimer = async (): Promise<void> => {
    if (!timerState.activeTimerId || !timerState.isRunning) return;

    try {
      const currentElapsed = getElapsedTime();
      
      // Save paused state to Firebase
      if (timerState.currentProject) {
        await firebaseSessionApi.saveActiveSession({
          startTime: timerState.startTime!,
          projectId: timerState.currentProject.id,
          selectedTaskIds: timerState.selectedTasks.map(t => t.id),
          pausedDuration: currentElapsed,
          isPaused: true
        });
      }
      
      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        pausedDuration: currentElapsed,
      }));

      console.log('Timer paused successfully');
    } catch (error) {
      console.error('Failed to pause timer:', error);
      throw error;
    }
  };

  // Resume timer
  const resumeTimer = async (): Promise<void> => {
    if (!timerState.activeTimerId || timerState.isRunning) return;

    try {
      // Calculate the new start time to account for paused duration
      const now = new Date();
      const adjustedStartTime = new Date(now.getTime() - (timerState.pausedDuration * 1000));
      
      // Save resumed state to Firebase
      if (timerState.currentProject) {
        await firebaseSessionApi.saveActiveSession({
          startTime: adjustedStartTime,
          projectId: timerState.currentProject.id,
          selectedTaskIds: timerState.selectedTasks.map(t => t.id),
          pausedDuration: 0,
          isPaused: false
        });
      }
      
      setTimerState(prev => ({
        ...prev,
        isRunning: true,
        startTime: adjustedStartTime,
        pausedDuration: 0,
      }));

      console.log('Timer resumed successfully');
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
    privateNotes?: string,
    options?: { visibility?: 'everyone' | 'followers' | 'private'; showStartTime?: boolean; hideTaskNames?: boolean; publishToFeeds?: boolean }
  ): Promise<Session> => {
    if (!timerState.activeTimerId || !timerState.currentProject) {
      throw new Error('No active timer to finish');
    }

    try {
      const finalDuration = getElapsedTime();
      const sessionData: CreateSessionData = {
        projectId: timerState.currentProject.id,
        title,
        description,
        duration: finalDuration,
        startTime: timerState.startTime!,
        taskIds: timerState.selectedTasks.map(task => task.id),
        tags,
        visibility: options?.visibility,
        showStartTime: options?.showStartTime,
        hideTaskNames: options?.hideTaskNames,
        publishToFeeds: options?.publishToFeeds,
        howFelt,
        privateNotes,
      };

      // Save session to Firebase
      const session = await firebaseSessionApi.createSession(sessionData);

      // Clear active session
      await firebaseSessionApi.clearActiveSession();

      console.log('Session saved to Firebase successfully');

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
      // Clear active session from Firebase
      await firebaseSessionApi.clearActiveSession();
      console.log('Timer cancelled and cleared from Firebase');
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
