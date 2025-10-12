'use client';

import React, { useState, useEffect } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useProjects } from '@/contexts/ProjectsContext';
import { useTasks } from '@/contexts/TasksContext';
import { Play, Pause, Square, X, ChevronDown, Check, Flag, Image as ImageIcon, XCircle, Edit3 } from 'lucide-react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { uploadImages, compressImage } from '@/lib/imageUpload';
import { ImageUpload } from '@/components/ImageUpload';
import Link from 'next/link';
import { Activity } from '@/types';
import { IconRenderer } from '@/components/IconRenderer';

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
  const [visibility, setVisibility] = useState<'everyone' | 'followers' | 'private'>('everyone');
  const [showStartTime, setShowStartTime] = useState(false);
  const [hideTaskNames, setHideTaskNames] = useState(false);
  const [publishToFeeds, setPublishToFeeds] = useState(true);
  const [howFelt, setHowFelt] = useState<number>(3);
  const [privateNotes, setPrivateNotes] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [displayTime, setDisplayTime] = useState(0);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [adjustedDuration, setAdjustedDuration] = useState(0);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Only show user's custom activities
  const allActivities: Activity[] = projects;

  // Load last used activity from local storage on mount
  useEffect(() => {
    const savedActivityId = localStorage.getItem('lastSessionActivity');

    if (savedActivityId) {
      setSelectedActivityId(savedActivityId);
    }
  }, []);

  // Initialize selectedActivityId from timerState if there's an active session
  useEffect(() => {
    if (timerState.currentProject && !selectedActivityId) {
      setSelectedActivityId(timerState.currentProject.id);
    }
  }, [timerState.currentProject, selectedActivityId]);

  // Save activity to local storage whenever it changes
  useEffect(() => {
    if (selectedActivityId) {
      localStorage.setItem('lastSessionActivity', selectedActivityId);
    }
  }, [selectedActivityId]);

  // Count completed tasks in this session
  useEffect(() => {
    const completedInSession = selectedTasks.filter(task => task.status === 'completed').length;
    setCompletedTasksCount(completedInSession);
  }, [selectedTasks]);

  // Initialize adjusted duration when finish modal opens
  useEffect(() => {
    if (showFinishModal) {
      const elapsed = getElapsedTime();
      // Round to nearest 15 minutes, but allow max value
      const rounded = Math.floor(elapsed / 900) * 900;
      setAdjustedDuration(elapsed);
    }
  }, [showFinishModal, getElapsedTime]);

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
    if (!selectedActivityId) {
      alert('Please select an activity first');
      return;
    }

    try {
      await startTimer(selectedActivityId, selectedTaskIds);
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

  const handleImagesChange = (images: File[], previewUrls: string[]) => {
    setSelectedImages(images);
    setImagePreviewUrls(previewUrls);
  };

  const handleFinishTimer = async () => {
    try {
      console.log('💾 Starting session save...');

      // Validate required fields
      if (!sessionTitle.trim()) {
        alert('Please enter a session title');
        return;
      }

      // Upload images first if any
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        setIsUploadingImages(true);
        try {
          const uploadResults = await uploadImages(selectedImages);
          imageUrls = uploadResults.map(result => result.url);
          console.log('📸 Images uploaded:', imageUrls);
        } catch (error) {
          console.error('Failed to upload images:', error);
          alert('Failed to upload images. Session will be saved without images.');
        } finally {
          setIsUploadingImages(false);
        }
      }

      // Finish the timer and create session
      const session = await finishTimer(
        sessionTitle,
        sessionDescription,
        [], // tags removed
        howFelt,
        privateNotes,
        {
          visibility,
          showStartTime,
          hideTaskNames,
          publishToFeeds,
          customDuration: adjustedDuration,
          images: imageUrls
        }
      );
      console.log('✅ Session saved successfully:', session.id);

      // Reset modal and form state
      setShowFinishModal(false);
      setSessionTitle('');
      setSessionDescription('');
      setPrivateNotes('');
      setHowFelt(3);
      setSelectedImages([]);
      setImagePreviewUrls([]);

      // Wait a moment to ensure state is cleared, then navigate
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to home feed with refresh parameter to trigger immediate refresh
      window.location.href = '/?refresh=true';
    } catch (error) {
      console.error('Failed to finish timer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save session. Please try again.';
      alert(errorMessage);
    }
  };

  const handleCancelTimer = async () => {
    try {
      await resetTimer();
      setShowFinishModal(false);
      setShowCancelConfirm(false);
      // Reset all state
      setSessionTitle('');
      setSessionDescription('');
      setPrivateNotes('');
      setHowFelt(3);
      setSelectedImages([]);
      setImagePreviewUrls([]);
      // Route to feed page
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to cancel timer:', error);
      alert('Failed to cancel session. Please try again.');
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

  // Define selectedActivity before any early returns so it's available in all code paths
  const selectedActivity = allActivities.find(a => a.id === selectedActivityId) || timerState.currentProject;
  const needsActivity = allActivities.length === 0 && !timerState.currentProject;

  // When completing a session, show ONLY the completion UI
  if (showFinishModal) {
    return (
      <>
        <div className="min-h-screen sm:min-h-[calc(100vh-120px)] bg-gray-50 sm:bg-transparent">
          <div className="max-w-3xl mx-auto h-full sm:h-auto">
            <div className="bg-white sm:rounded-lg p-4 sm:p-6 w-full sm:shadow min-h-screen sm:min-h-0">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Complete Session</h3>
                <button onClick={() => setShowFinishModal(false)} className="text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center">Close</button>
              </div>
              {/* Reuse existing completion UI from below */}
              <div className="space-y-3 sm:space-y-4">
              {/* Session Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Title *
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]"
                  rows={3}
                  placeholder="How did the session go? What did you accomplish?"
                />
              </div>

              {/* Image Upload */}
              <ImageUpload
                label="Add Images (Optional, max 3)"
                maxImages={3}
                maxSizeMB={5}
                images={selectedImages}
                previewUrls={imagePreviewUrls}
                onImagesChange={handleImagesChange}
                uploadMode="deferred"
                showProgress={false}
              />

              {/* Activity Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity
                </label>
                <button
                  onClick={() => setShowActivityPicker(!showActivityPicker)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white cursor-pointer text-sm flex items-center gap-2 hover:border-gray-400 transition-colors min-h-[44px]"
                >
                  {selectedActivity ? (
                    <>
                      <IconRenderer iconName={selectedActivity.icon} className="w-5 h-5 flex-shrink-0" style={{ color: selectedActivity.color }} />
                      <span className="flex-1 text-left">{selectedActivity.name}</span>
                    </>
                  ) : (
                    <span className="flex-1 text-left text-gray-500">Select an activity</span>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {showActivityPicker && (
                  <>
                    {/* Backdrop for closing */}
                    <div className="fixed inset-0 z-10" onClick={() => setShowActivityPicker(false)} />

                    {/* Dropdown content */}
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                      {allActivities.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-600 mb-3">No activities yet</p>
                          <Link
                            href="/projects/new?redirect=/timer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#0051D5] transition-colors text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create Activity
                          </Link>
                        </div>
                      ) : (
                        <>
                          {allActivities.map((activity) => (
                            <button
                              key={activity.id}
                              onClick={() => {
                                setSelectedActivityId(activity.id);
                                setShowActivityPicker(false);
                              }}
                              className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                                selectedActivityId === activity.id ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${activity.color}20` }}
                              >
                                <IconRenderer
                                  iconName={activity.icon}
                                  className="w-4 h-4"
                                  style={{ color: activity.color }}
                                />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="text-sm font-medium text-gray-900">{activity.name}</div>
                              </div>
                              {selectedActivityId === activity.id && (
                                <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              )}
                            </button>
                          ))}
                          <Link
                            href="/activities/new"
                            className="w-full flex items-center gap-3 p-3 border-t border-gray-200 hover:bg-gray-50 transition-colors text-gray-900 font-medium"
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100">
                              <svg className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                            <span className="text-sm">Create New Activity</span>
                          </Link>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Private Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Private Notes
                </label>
                <textarea
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]"
                  rows={2}
                  placeholder="Personal reflections (never shown publicly)"
                />
              </div>

              {/* Privacy and Publishing Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] appearance-none bg-white min-h-[44px]"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23666\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="followers">Followers</option>
                    <option value="private">Only You</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Options</label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 min-h-[36px]">
                    <input type="checkbox" checked={showStartTime} onChange={(e) => setShowStartTime(e.target.checked)} className="w-4 h-4 flex-shrink-0" />
                    Show start time
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 min-h-[36px]">
                    <input type="checkbox" checked={hideTaskNames} onChange={(e) => setHideTaskNames(e.target.checked)} className="w-4 h-4 flex-shrink-0" />
                    Don't show task names
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 min-h-[36px]">
                    <input type="checkbox" checked={publishToFeeds} onChange={(e) => setPublishToFeeds(e.target.checked)} className="w-4 h-4 flex-shrink-0" />
                    Publish to home/group feeds
                  </label>
                </div>
              </div>

              {/* Duration Adjuster */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Adjust Duration
                </label>
                <div className="space-y-3">
                  <div className="py-2 px-1">
                    <Slider
                      min={0}
                      max={getElapsedTime()}
                      step={900}
                      value={adjustedDuration}
                      onChange={(value) => {
                        const val = typeof value === 'number' ? value : value[0];
                        const max = getElapsedTime();
                        // Allow snapping to max even if not divisible by 900
                        if (val >= max - 450) {
                          setAdjustedDuration(max);
                        } else {
                          setAdjustedDuration(val);
                        }
                      }}
                      trackStyle={{ backgroundColor: '#007AFF', height: 6 }}
                      railStyle={{ backgroundColor: '#E5E7EB', height: 6 }}
                      handleStyle={{
                        backgroundColor: 'white',
                        border: '3px solid #007AFF',
                        width: 20,
                        height: 20,
                        marginTop: -7,
                        boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)',
                        opacity: 1,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 px-1">
                    <span>0m</span>
                    <span className="font-semibold text-base text-gray-900">{getFormattedTime(adjustedDuration)}</span>
                    <span>{getFormattedTime(getElapsedTime())}</span>
                  </div>
                </div>
              </div>

              {/* Session Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Session Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Duration: {getFormattedTime(adjustedDuration)}</div>
                  <div>Tasks completed: {completedTasksCount} of {selectedTasks.length}</div>
                  <div>Activity: {allActivities.find(a => a.id === selectedActivityId)?.name || timerState.currentProject?.name || 'Unassigned'}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 sm:static bg-white -mx-4 sm:mx-0 -mb-4 sm:mb-0 px-4 sm:px-0 py-4 sm:py-0 border-t sm:border-t-0 border-gray-200 sm:border-0">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex-1 px-3 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinishTimer}
                  disabled={!sessionTitle.trim() || isUploadingImages}
                  className="flex-1 px-3 py-3 bg-[#007AFF] text-white border border-[#007AFF] rounded-lg hover:bg-[#0051D5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                >
                  {isUploadingImages ? 'Uploading...' : 'Save'}
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Confirmation Modal - Portal-style overlay */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cancel Session?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this session? All progress will be lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Keep Session
                </button>
                <button
                  onClick={handleCancelTimer}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Main timer UI - only show when not completing a session
  return (
    <div className="min-h-screen bg-white flex items-start justify-center pt-20">
      {/* No Activities Banner - Show prominent message when no activities exist */}
      {needsActivity && (
        <div className="absolute top-0 left-0 right-0 bg-blue-50 border-b border-blue-200 px-4 py-3 md:py-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 md:mt-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-blue-900 mb-1">Create your first activity to get started</h3>
                <p className="text-xs md:text-sm text-blue-700">Activities help you organize your work sessions. You'll need at least one activity before you can start tracking time.</p>
              </div>
            </div>
            <Link
              href="/projects/new?redirect=/timer"
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Activity
            </Link>
          </div>
        </div>
      )}

      {/* Centered Timer Container */}
      <div className="w-full max-w-2xl px-4 flex flex-col items-center space-y-8">
        {/* Large Timer Display */}
        <div className="text-center w-full">
          <div className="text-7xl md:text-8xl lg:text-9xl font-mono font-bold text-gray-900 mb-8 tracking-tight" aria-label={`Timer: ${Math.floor(displayTime / 3600)} hours, ${Math.floor((displayTime % 3600) / 60)} minutes, ${displayTime % 60} seconds`}>
            {getFormattedTime(displayTime)}
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-8">
            {!timerState.isRunning && !timerState.startTime && (
              <>
                <button
                  onClick={handleStartTimer}
                  disabled={!selectedActivityId}
                  className={`inline-flex items-center justify-center gap-3 px-10 py-4 rounded-xl text-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation ${
                    selectedActivityId
                      ? 'bg-[#34C759] hover:bg-[#2FB84D] text-white focus-visible:ring-[#34C759]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-6 h-6" />
                  <span>Start</span>
                </button>

                <Link
                  href="/record-manual"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#007AFF] text-white hover:bg-[#0051D5] transition-colors text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 touch-manipulation"
                >
                  <Edit3 className="w-5 h-5" />
                  <span>Manual</span>
                </Link>
              </>
            )}

            {timerState.isRunning && (
              <button
                onClick={handlePauseTimer}
                className="px-10 py-4 rounded-lg bg-[#FC4C02] hover:bg-[#E04502] text-white flex items-center gap-3 transition-all text-lg font-semibold"
              >
                <Pause className="w-6 h-6" />
                <span>Pause</span>
              </button>
            )}

            {!timerState.isRunning && timerState.startTime && (
              <>
                <button
                  onClick={handleResumeTimer}
                  className="px-8 py-4 rounded-lg bg-[#34C759] hover:bg-[#2FB84D] text-white flex items-center gap-2 transition-all text-lg font-semibold"
                >
                  <Play className="w-6 h-6" />
                  <span>Resume</span>
                </button>
                <button
                  onClick={() => setShowFinishModal(true)}
                  className="px-8 py-4 rounded-lg bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2 transition-all text-lg font-semibold"
                >
                  <Flag className="w-6 h-6" />
                  <span>Finish</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Activity Dropdown */}
        <div className="w-full max-w-xl relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activity
          </label>
          <button
            onClick={() => setShowActivityPicker(!showActivityPicker)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white cursor-pointer text-base flex items-center gap-3 hover:border-gray-400 transition-colors"
          >
            {selectedActivity ? (
              <>
                <IconRenderer iconName={selectedActivity.icon} className="w-6 h-6 flex-shrink-0" style={{ color: selectedActivity.color }} />
                <span className="flex-1 text-left font-medium">{selectedActivity.name}</span>
              </>
            ) : (
              <span className="flex-1 text-left text-gray-500">Select an activity</span>
            )}
            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </button>

          {/* Dropdown Menu */}
          {showActivityPicker && (
            <>
              {/* Backdrop for closing */}
              <div className="fixed inset-0 z-10" onClick={() => setShowActivityPicker(false)} />

              {/* Dropdown content */}
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                {allActivities.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-600 mb-3">No activities yet</p>
                    <Link
                      href="/projects/new?redirect=/timer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#0051D5] transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Activity
                    </Link>
                  </div>
                ) : (
                  <>
                    {allActivities.map((activity) => (
                      <button
                        key={activity.id}
                        onClick={() => {
                          setSelectedActivityId(activity.id);
                          setShowActivityPicker(false);
                        }}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                          selectedActivityId === activity.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${activity.color}20` }}
                        >
                          <IconRenderer
                            iconName={activity.icon}
                            className="w-4 h-4"
                            style={{ color: activity.color }}
                          />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-sm font-medium text-gray-900">{activity.name}</div>
                        </div>
                        {selectedActivityId === activity.id && (
                          <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                    <Link
                      href="/activities/new"
                      className="w-full flex items-center gap-3 p-3 border-t border-gray-200 hover:bg-gray-50 transition-colors text-gray-900 font-medium"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100">
                        <svg className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <span className="text-sm">Create New Activity</span>
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};
