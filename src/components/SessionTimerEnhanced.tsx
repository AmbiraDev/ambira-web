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
  const [displayTime, setDisplayTime] = useState(0);

  // Count completed tasks in this session
  useEffect(() => {
    const completedInSession = selectedTasks.filter(task => task.status === 'completed').length;
    setCompletedTasksCount(completedInSession);
  }, [selectedTasks]);

  // Update display time every second when timer is running
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[calc(100vh-120px)]">
      {/* Left Column - Timer & Controls */}
      <div className="flex flex-col items-center justify-center space-y-12 sticky top-6">
        {/* Large Timer Display */}
        <div className="text-center">
          <div className="text-9xl font-mono font-bold text-[#007AFF] mb-8">
            {getFormattedTime(displayTime)}
          </div>

          {/* Timer Controls - Pill Buttons with Text */}
          <div className="flex items-center justify-center gap-4">
            {!timerState.isRunning && !timerState.startTime && (
              <button
                onClick={handleStartTimer}
                disabled={!selectedProjectId}
                className={`px-12 py-5 rounded-full flex items-center gap-3 transition-all text-xl font-semibold ${
                  selectedProjectId
                    ? 'bg-[#FC4C02] hover:bg-[#E04502] text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Start</span>
              </button>
            )}
            
            {timerState.isRunning && (
              <button
                onClick={handlePauseTimer}
                className="px-12 py-5 rounded-full bg-[#FC4C02] hover:bg-[#E04502] text-white flex items-center gap-3 transition-all shadow-lg hover:shadow-xl text-xl font-semibold"
              >
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                <span>Pause</span>
              </button>
            )}
            
            {!timerState.isRunning && timerState.startTime && (
              <>
                <button
                  onClick={handleResumeTimer}
                  className="px-12 py-5 rounded-full bg-[#FC4C02] hover:bg-[#E04502] text-white flex items-center gap-3 transition-all shadow-lg hover:shadow-xl text-xl font-semibold"
                >
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Resume</span>
                </button>
                <button
                  onClick={() => setShowFinishModal(true)}
                  className="px-12 py-5 rounded-full bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-3 transition-all shadow-lg hover:shadow-xl text-xl font-semibold"
                >
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h2v2H3V3zm4 0h2v2H7V3zm4 0h2v2h-2V3zm4 0h2v2h-2V3zm4 0h2v2h-2V3zM3 7h2v2H3V7zm16 0h2v2h-2V7zM3 11h2v2H3v-2zm4 0h2v2H7v-2zm8 0h2v2h-2v-2zm4 0h2v2h-2v-2zM3 15h2v2H3v-2zm16 0h2v2h-2v-2zM3 19h2v2H3v-2zm4 0h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
                  </svg>
                  <span>Finish</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Project & Tag Dropdowns */}
        <div className="w-full max-w-xl grid grid-cols-2 gap-4">
          {/* Project Dropdown */}
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={timerState.isRunning || timerState.startTime !== null}
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.icon} {project.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Tag Dropdown */}
          <div className="relative">
            <select
              value={sessionTags[0] || ''}
              onChange={(e) => setSessionTags(e.target.value ? [e.target.value] : [])}
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white appearance-none cursor-pointer text-base"
            >
              <option value="">Select Tag</option>
              <option value="Study">Study</option>
              <option value="Work">Work</option>
              <option value="Side Project">Side Project</option>
              <option value="Reading">Reading</option>
              <option value="Learning">Learning</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Tasks */}
      <div className="flex items-start justify-center">
        <div className="w-full max-w-2xl">
          <GlobalTasks
            selectedTaskIds={selectedTaskIds}
            onToggleTaskSelection={handleTaskToggle}
            showSelection={true}
          />
        </div>
      </div>

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
