'use client';

import React, { useState, useEffect } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useProjects } from '@/contexts/ProjectsContext';
import { useTasks } from '@/contexts/TasksContext';
import { Play, Pause, Square, X, ChevronDown, Check, Flag, Image as ImageIcon, XCircle, Edit3, CheckSquare } from 'lucide-react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { SessionTasks } from './SessionTasks';
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
  const [showTasks, setShowTasks] = useState(true);

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

      setShowFinishModal(false);

      // Reset all session state
      setSessionTitle('');
      setSessionDescription('');
      setPrivateNotes('');
      setHowFelt(3);

      // Wait a moment to ensure state is cleared, then navigate
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to analytics page after saving
      window.location.href = '/you?tab=sessions';
    } catch (error) {
      console.error('Failed to finish timer:', error);
      alert('Failed to save session. Please try again.');
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
      // Route to feed page
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to cancel timer:', error);
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
  const selectedActivity = allActivities.find(a => a.id === selectedActivityId) || timerState.currentProject;

  // Show "Create Activity First" prompt if no activities exist
  if (allActivities.length === 0 && !timerState.currentProject) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Create an activity first!</h2>
            <p className="text-gray-600">
              You need to create at least one activity before you can start tracking your time.
            </p>
          </div>

          {/* Action Button */}
          <Link
            href="/projects/new?redirect=/timer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0051D5] transition-colors font-medium shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Your First Activity
          </Link>

          {/* Back Link */}
          <button
            onClick={() => window.history.back()}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Mobile: Full-screen centered layout */}
      <div className="md:hidden flex flex-col h-screen fixed inset-0 overflow-hidden">
        {/* Floating Back Button */}
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 z-10 p-2 text-gray-600 hover:text-gray-900 active:scale-95 transition-all"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Timer at top - Fixed/Sticky */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center px-4 pt-12 pb-6 bg-white">
          <div className="text-center">
            <div className="text-6xl font-bold tracking-tight text-gray-900 font-mono" aria-label={`Timer: ${Math.floor(displayTime / 3600)} hours, ${Math.floor((displayTime % 3600) / 60)} minutes, ${displayTime % 60} seconds`}>
              {getFormattedTime(displayTime)}
            </div>
          </div>
        </div>

        {/* Scrollable Task List Container */}
        <div className="flex-1 overflow-y-auto px-4 pb-65">
          <div className="w-full max-w-md mx-auto">
            <SessionTasks />
          </div>
        </div>

        {/* Fixed Bottom Controls - Strava Style */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-6 safe-area-bottom">
          <div className="flex items-end justify-center gap-6 max-w-md mx-auto">
            {/* Activity Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setShowActivityPicker(true)}
                className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all border-2 active:scale-95"
                style={selectedActivityId && selectedActivity ? {
                  backgroundColor: `${selectedActivity.color}20`,
                  borderColor: selectedActivity.color
                } : {
                  backgroundColor: '#F3F4F6',
                  borderColor: '#D1D5DB'
                }}
              >
                {selectedActivity?.icon ? (
                  <IconRenderer iconName={selectedActivity.icon} className="w-7 h-7 text-gray-700" />
                ) : (
                  <IconRenderer iconName="Folder" className="w-7 h-7 text-gray-700" />
                )}
              </button>
              <span className="text-xs text-gray-600 font-medium">Activity</span>
            </div>

            {/* Center: Main Action Button */}
            {!timerState.isRunning && !timerState.startTime && (
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={handleStartTimer}
                  disabled={!selectedActivityId}
                  className={`w-24 h-24 rounded-2xl flex items-center justify-center transition-all shadow-xl ${
                    selectedActivityId
                      ? 'bg-[#34C759] hover:bg-[#2FB84D] active:scale-95'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <span className="text-xs text-gray-600 font-medium">Record</span>
              </div>
            )}

            {/* Manual Button */}
            {!timerState.isRunning && !timerState.startTime && (
              <div className="flex flex-col items-center gap-1">
                <Link
                  href="/record-manual"
                  className="w-16 h-16 rounded-xl bg-[#007AFF] hover:bg-[#0051D5] active:scale-95 flex items-center justify-center transition-all shadow-lg"
                >
                  <Edit3 className="w-6 h-6 text-white" />
                </Link>
                <span className="text-xs text-gray-600 font-medium">Manual</span>
              </div>
            )}

            {/* Pause Button - When Running */}
            {timerState.isRunning && (
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={handlePauseTimer}
                  className="w-24 h-24 rounded-2xl bg-[#FC4C02] hover:bg-[#E04502] active:scale-95 flex items-center justify-center transition-all shadow-xl"
                >
                  <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                </button>
                <span className="text-xs text-gray-600 font-medium">Pause</span>
              </div>
            )}

            {/* Resume and Finish - When Paused */}
            {!timerState.isRunning && timerState.startTime && (
              <>
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={handleResumeTimer}
                    className="w-20 h-20 rounded-xl bg-[#34C759] hover:bg-[#2FB84D] active:scale-95 flex items-center justify-center transition-all shadow-xl"
                  >
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <span className="text-xs text-gray-600 font-medium">Resume</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setShowFinishModal(true)}
                    className="w-20 h-20 rounded-xl bg-[#FC4C02] hover:bg-[#E04502] active:scale-95 flex items-center justify-center transition-all shadow-xl"
                  >
                    <Flag className="w-7 h-7 text-white" />
                  </button>
                  <span className="text-xs text-gray-600 font-medium">Finish</span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Desktop: Two-column layout */}
      <div className={`hidden md:grid ${showTasks ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6 lg:gap-12 pb-4 px-4 max-w-7xl mx-auto transition-all duration-500 ease-in-out`}>
        {/* Left Column - Timer & Controls */}
        <div className={`flex flex-col items-center ${showTasks ? 'justify-start' : 'justify-center mx-auto'} space-y-3 lg:space-y-8 lg:sticky lg:top-24 pt-8 transition-all duration-500 ease-in-out`}>
          {/* Large Timer Display */}
          <div className="text-center w-full">
            <div className="text-6xl md:text-7xl lg:text-9xl font-mono font-bold text-gray-900 mb-4 lg:mb-8" aria-label={`Timer: ${Math.floor(displayTime / 3600)} hours, ${Math.floor((displayTime % 3600) / 60)} minutes, ${displayTime % 60} seconds`}>
              {getFormattedTime(displayTime)}
            </div>

            {/* Tasks Toggle Button */}
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setShowTasks(!showTasks)}
                className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200"
                aria-label={showTasks ? "Hide tasks" : "Show tasks"}
              >
                <CheckSquare className="w-6 h-6" />
              </button>
            </div>

            {/* Timer Controls - Square Rounded Buttons with Text */}
            <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
              {!timerState.isRunning && !timerState.startTime && (
                <>
                  <button
                    onClick={handleStartTimer}
                    disabled={!selectedActivityId}
                    className={`px-8 md:px-12 py-3 md:py-5 rounded-xl flex items-center gap-2 md:gap-3 transition-all text-base md:text-xl font-semibold ${
                      selectedActivityId
                        ? 'bg-[#34C759] hover:bg-[#2FB84D] text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Start</span>
                  </button>

                  <Link
                    href="/record-manual"
                    className="px-6 md:px-8 py-2.5 md:py-4 rounded-xl bg-[#007AFF] hover:bg-[#0051D5] text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-xl text-sm md:text-lg font-semibold"
                  >
                    <Edit3 className="w-5 h-5 md:w-6 md:h-6" />
                    <span>Manual</span>
                  </Link>
                </>
              )}

              {timerState.isRunning && (
                <button
                  onClick={handlePauseTimer}
                  className="px-8 md:px-12 py-3 md:py-5 rounded-xl bg-[#FC4C02] hover:bg-[#E04502] text-white flex items-center gap-2 md:gap-3 transition-all shadow-lg hover:shadow-xl text-base md:text-xl font-semibold"
                >
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  <span>Pause</span>
                </button>
              )}

              {!timerState.isRunning && timerState.startTime && (
                <>
                  <button
                    onClick={handleResumeTimer}
                    className="px-6 md:px-10 py-3 md:py-4 rounded-xl bg-[#34C759] hover:bg-[#2FB84D] text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-xl text-base md:text-lg font-semibold"
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Resume</span>
                  </button>
                  <button
                    onClick={() => setShowFinishModal(true)}
                    className="px-6 md:px-10 py-3 md:py-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-xl text-base md:text-lg font-semibold"
                  >
                    <Flag className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    <span>Finish</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Activity Dropdown - Custom with icon support */}
          <div className="w-full max-w-xl relative">
            <button
              onClick={() => setShowActivityPicker(!showActivityPicker)}
              className="w-full px-3 md:px-4 py-2 md:py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white cursor-pointer text-sm md:text-base flex items-center gap-2 hover:border-gray-400 transition-colors"
            >
              {selectedActivity ? (
                <>
                  <IconRenderer iconName={selectedActivity.icon} className="w-5 h-5 flex-shrink-0" style={{ color: selectedActivity.color }} />
                  <span className="flex-1 text-left">{selectedActivity.name}</span>
                </>
              ) : (
                <span className="flex-1 text-left text-gray-500">Select an activity</span>
              )}
              <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {showActivityPicker && (
              <>
                {/* Backdrop for closing */}
                <div className="fixed inset-0 z-10" onClick={() => setShowActivityPicker(false)} />

                {/* Dropdown content */}
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
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
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column - Tasks */}
        {showTasks && (
          <div className="flex items-start justify-center w-full transition-all duration-500 ease-in-out">
            <div className="w-full max-w-2xl pb-8">
              <SessionTasks />
            </div>
          </div>
        )}
      </div>

      {/* Session Completion Page-like container (not modal) */}
      {showFinishModal && (
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-auto shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Complete Session</h3>
              <button onClick={() => setShowFinishModal(false)} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>

            <div className="space-y-3">
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

              {/* Activity Selection - Custom button */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity
                </label>
                <button
                  onClick={() => setShowActivityPicker(!showActivityPicker)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white cursor-pointer text-sm flex items-center gap-2 hover:border-gray-400 transition-colors"
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
                    </div>
                  </>
                )}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]"
                  rows={2}
                  placeholder="Personal reflections (never shown publicly)"
                />
              </div>

              {/* Duration Adjuster */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjust Duration
                </label>
                <div className="space-y-2">
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
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>0m</span>
                    <span className="font-semibold text-gray-900">{getFormattedTime(adjustedDuration)}</span>
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
              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex-1 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinishTimer}
                  disabled={!sessionTitle.trim() || isUploadingImages}
                  className="flex-1 px-3 py-2 bg-[#007AFF] text-white border border-[#007AFF] rounded-lg hover:bg-[#0051D5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingImages ? 'Uploading...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Activity Picker Modal - for the circular button */}
      {showActivityPicker && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowActivityPicker(false)} />

          {/* Modal content */}
          <div className="relative bg-white w-full rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Select Activity</h2>
              <button
                onClick={() => setShowActivityPicker(false)}
                className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {allActivities.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => {
                    setSelectedActivityId(activity.id);
                    setShowActivityPicker(false);
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${
                    selectedActivityId === activity.id
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${activity.color}20` }}
                  >
                    <IconRenderer
                      iconName={activity.icon}
                      className="w-6 h-6"
                      style={{ color: activity.color }}
                    />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-gray-900">{activity.name}</div>
                    {activity.description && (
                      <div className="text-sm text-gray-500 truncate">{activity.description}</div>
                    )}
                  </div>
                  {selectedActivityId === activity.id && (
                    <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
