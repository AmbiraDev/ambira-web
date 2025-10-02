'use client';

import React, { useState, useEffect } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useTasks } from '@/contexts/TasksContext';
import { useProjects } from '@/contexts/ProjectsContext';
import { GlobalTasks } from './GlobalTasks';

interface SessionTimerEnhancedProps {
  projectId: string;
}

export const SessionTimerEnhanced: React.FC<SessionTimerEnhancedProps> = () => {
  const { 
    timerState, 
    updateSelectedTasks, 
    getElapsedTime, 
    getFormattedTime,
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    resetTimer
  } = useTimer();
  const { tasks } = useTasks();
  const { projects } = useProjects();

  const selectedTasks = timerState.selectedTasks || [];
  const selectedTaskIds = selectedTasks.map(task => task.id);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionTags, setSessionTags] = useState<string[]>([]);
  const [howFelt, setHowFelt] = useState<number>(3);
  const [privateNotes, setPrivateNotes] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Count completed tasks in this session
  useEffect(() => {
    const completedInSession = selectedTasks.filter(task => task.status === 'completed').length;
    setCompletedTasksCount(completedInSession);
  }, [selectedTasks]);

  // Auto-generate session title based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    let timeOfDay = 'Morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
    else if (hour >= 17) timeOfDay = 'Evening';
    
    setSessionTitle(`${timeOfDay} Work Session`);
  }, []);

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

  const handleStartTimer = async () => {
    if (!selectedProjectId) {
      alert('Please select a project first');
      return;
    }
    
    try {
      await startTimer(selectedProjectId, selectedTaskIds);
    } catch (error) {
      console.error('Failed to start timer:', error);
      alert('Failed to start timer. Please try again.');
    }
  };

  const handlePauseTimer = async () => {
    try {
      await pauseTimer();
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  const handleResumeTimer = async () => {
    try {
      await resumeTimer();
    } catch (error) {
      console.error('Failed to resume timer:', error);
    }
  };

  const handleFinishTimer = async () => {
    try {
      await finishTimer(
        sessionTitle,
        sessionDescription,
        sessionTags,
        howFelt,
        privateNotes
      );
      setShowFinishModal(false);
      alert('Session saved successfully!');
    } catch (error) {
      console.error('Failed to finish timer:', error);
      alert('Failed to save session. Please try again.');
    }
  };

  const handleCancelTimer = async () => {
    if (confirm('Are you sure you want to cancel this session? All progress will be lost.')) {
      try {
        await resetTimer();
        setShowFinishModal(false);
      } catch (error) {
        console.error('Failed to cancel timer:', error);
      }
    }
  };


  const getProjectColor = (projectId: string | undefined) => {
    if (!projectId) return 'bg-gray-500';
    const project = projects.find(p => p.id === projectId);
    const colorClasses = {
      orange: 'bg-orange-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
    };
    return colorClasses[project?.color as keyof typeof colorClasses] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Focus Session</h2>
            <p className="text-gray-600">Track your work and stay productive</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-green-600">
              {getFormattedTime(getElapsedTime())}
            </div>
            <div className="text-sm text-gray-600">
              {completedTasksCount} of {selectedTasks.length} tasks completed
            </div>
          </div>
        </div>

        {/* Project Selection */}
        {!timerState.isRunning && !timerState.startTime && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Project</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedProjectId === project.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${getProjectColor(project.id)} rounded-lg flex items-center justify-center text-white text-xl`}>
                      {project.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{project.name}</div>
                      <div className="text-sm text-gray-600">{project.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {projects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📁</div>
                <p>No projects found</p>
                <p className="text-sm">Create a project first to start a timer</p>
              </div>
            )}
          </div>
        )}

        {/* Timer Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          {!timerState.isRunning && !timerState.startTime && (
            <button
              onClick={handleStartTimer}
              disabled={!selectedProjectId}
              className={`px-8 py-3 rounded-lg transition-colors font-medium text-lg ${
                selectedProjectId
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {selectedProjectId ? 'Start Timer' : 'Select a Project First'}
            </button>
          )}
          
          {timerState.isRunning && (
            <button
              onClick={handlePauseTimer}
              className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              Pause
            </button>
          )}
          
          {!timerState.isRunning && timerState.startTime && (
            <button
              onClick={handleResumeTimer}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Resume
            </button>
          )}
          
          {timerState.startTime && (
            <button
              onClick={() => setShowFinishModal(true)}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Finish
            </button>
          )}
        </div>

        {/* Current Project */}
        {(timerState.currentProject || selectedProjectId) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${getProjectColor(timerState.currentProject?.id || selectedProjectId)} rounded-lg flex items-center justify-center text-white text-lg`}>
                {(timerState.currentProject || projects.find(p => p.id === selectedProjectId))?.icon}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {(timerState.currentProject || projects.find(p => p.id === selectedProjectId))?.name}
                </div>
                <div className="text-sm text-gray-600">
                  {(timerState.currentProject || projects.find(p => p.id === selectedProjectId))?.description}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Management Section - Using GlobalTasks Component */}
      <GlobalTasks
        selectedTaskIds={selectedTaskIds}
        onToggleTaskSelection={handleTaskToggle}
        showSelection={true}
      />

      {/* Session Completion Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Complete Session</h3>
              <button
                onClick={() => setShowFinishModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Session Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Title *
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter session title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="How did the session go? What did you accomplish?"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Study', 'Work', 'Side Project', 'Reading', 'Learning'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (sessionTags.includes(tag)) {
                          setSessionTags(sessionTags.filter(t => t !== tag));
                        } else {
                          setSessionTags([...sessionTags, tag]);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm ${
                        sessionTags.includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* How did it feel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How did it feel? (Private)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setHowFelt(rating)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        howFelt >= rating
                          ? 'bg-yellow-400 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Private Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Private Notes
                </label>
                <textarea
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Personal reflections (never shown publicly)"
                />
              </div>

              {/* Session Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Session Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Duration: {getFormattedTime(getElapsedTime())}</div>
                  <div>Tasks completed: {completedTasksCount} of {selectedTasks.length}</div>
                  <div>Project: {timerState.currentProject?.name}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCancelTimer}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel Session
                </button>
                <button
                  onClick={handleFinishTimer}
                  disabled={!sessionTitle.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
