'use client';

import React, { useState, useEffect } from 'react';
import { useTimer } from '@/features/timer/hooks';
import { useAuth } from '@/hooks/useAuth';
import { useActivities } from '@/hooks/useActivitiesQuery';
import {
  Play,
  Pause,
  ChevronDown,
  Check,
  Flag,
  Edit3,
  ArrowLeft,
} from 'lucide-react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { uploadImages } from '@/lib/imageUpload';
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
    getElapsedTime,
    getFormattedTime,
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    resetTimer,
  } = useTimer();
  const { user } = useAuth();
  const { data: projects = [] } = useActivities(user?.id);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [visibility, setVisibility] = useState<
    'everyone' | 'followers' | 'private'
  >('everyone');
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
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [showActivityError, setShowActivityError] = useState(false);
  const [customStartTime, setCustomStartTime] = useState<Date | null>(null);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);

  // Only show user's custom activities
  const allActivities: Activity[] = projects || [];

  // Load last used activity from local storage on mount
  useEffect(() => {
    const savedActivityId = localStorage.getItem('lastSessionActivity');

    if (savedActivityId && projects) {
      // Validate that the saved activity still exists
      const activityExists = projects.some(p => p.id === savedActivityId);
      if (activityExists) {
        setSelectedActivityId(savedActivityId);
      } else {
        // Clear stale activity ID from localStorage
        localStorage.removeItem('lastSessionActivity');
      }
    }
  }, [projects]);

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

  // Initialize adjusted duration when finish modal opens
  useEffect(() => {
    if (showFinishModal) {
      const elapsed = getElapsedTime();
      setAdjustedDuration(elapsed);

      // Calculate start time based on elapsed duration (now - duration)
      const now = new Date();
      const calculatedStartTime = new Date(now.getTime() - elapsed * 1000);
      setStartTime(calculatedStartTime);
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
  }, [
    timerState.isRunning,
    timerState.startTime,
    timerState.pausedDuration,
    getElapsedTime,
  ]);

  // Auto-generate session title based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    let timeOfDay = 'Morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
    else if (hour >= 17) timeOfDay = 'Evening';

    setSessionTitle(`${timeOfDay} Work Session`);
  }, []);

  const handleStartTimer = async () => {
    // Validate activity is selected and exists
    if (
      !selectedActivityId ||
      !allActivities.find(a => a.id === selectedActivityId)
    ) {
      // Show error state and open activity picker
      setShowActivityError(true);
      setShowActivityPicker(true);
      // Clear error after 3 seconds
      setTimeout(() => setShowActivityError(false), 3000);
      return;
    }

    try {
      await startTimer(selectedActivityId, customStartTime || undefined);
      // Reset custom start time after starting
      setCustomStartTime(null);
      setShowTimePickerModal(false);
    } catch {
      console.error('Failed to start timer');
      alert('Failed to start timer. Please try again.');
    }
  };

  const handlePauseTimer = async () => {
    try {
      await pauseTimer();
    } catch {
      console.error('Failed to pause timer');
    }
  };

  const handleResumeTimer = async () => {
    try {
      await resumeTimer();
    } catch {
      console.error('Failed to resume timer');
    }
  };

  const handleImagesChange = (images: File[], previewUrls: string[]) => {
    setSelectedImages(images);
    setImagePreviewUrls(previewUrls);
  };

  // Helper to format Date to time input value (HH:MM)
  const formatTimeForInput = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Handle start time change
  const handleStartTimeChange = (timeString: string) => {
    const parts = timeString.split(':');
    if (parts.length !== 2) return;

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    // Validate the parsed values are valid numbers
    if (isNaN(hours) || isNaN(minutes)) return;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return;

    const newStartTime = new Date(startTime);
    newStartTime.setHours(hours, minutes, 0, 0);

    setStartTime(newStartTime);
    // Duration stays the same, we're just shifting when it started
  };

  // Handle duration slider change
  const handleDurationSliderChange = (value: number | number[]) => {
    // Extract numeric value from slider (handle both single value and array)
    const val = typeof value === 'number' ? value : (value[0] ?? 0);
    const max = getElapsedTime();

    // Validate we have valid numeric values
    if (isNaN(val) || isNaN(max)) return;

    // Allow snapping to max even if not divisible by 900
    const newDuration = val >= max - 450 ? max : val;
    setAdjustedDuration(newDuration);
    // Start time stays the same
  };

  const handleFinishTimer = async () => {
    try {
      // Validate required fields
      if (!sessionTitle.trim()) {
        alert('Please enter a session title');
        return;
      }

      // Validate activity selection
      if (!selectedActivityId && !timerState.currentProject) {
        alert('Please select an activity before saving');
        setShowActivityPicker(true);
        return;
      }

      // Upload images first if any
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        setIsUploadingImages(true);
        try {
          const uploadResults = await uploadImages(selectedImages);
          imageUrls = uploadResults.map(result => result.url);
        } catch {
          console.error('Failed to upload images');
          alert(
            'Failed to upload images. Session will be saved without images.'
          );
        } finally {
          setIsUploadingImages(false);
        }
      }

      // Finish the timer and create session
      await finishTimer(
        sessionTitle,
        sessionDescription,
        undefined, // tags
        howFelt,
        privateNotes,
        {
          visibility,
          showStartTime: false,
          publishToFeeds: true,
          customDuration: adjustedDuration,
          images: imageUrls,
        }
      );

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
    } catch (_error) {
      console.error('Failed to finish timer');
      const errorMessage =
        _error instanceof Error
          ? _error.message
          : 'Failed to save session. Please try again.';
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
    } catch {
      console.error('Failed to cancel timer');
      alert('Failed to cancel session. Please try again.');
    }
  };

  // Define selectedActivity before any early returns so it's available in all code paths
  const selectedActivity =
    allActivities.find(a => a.id === selectedActivityId) ||
    timerState.currentProject;
  const needsActivity =
    allActivities.length === 0 && !timerState.currentProject;

  // When completing a session, show ONLY the completion UI
  if (showFinishModal) {
    return (
      <>
        <div className="min-h-screen bg-white">
          <div className="max-w-2xl mx-auto h-full">
            <div className="p-4 sm:p-6 w-full min-h-screen">
              {/* Header with Resume and Save Session title */}
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => setShowFinishModal(false)}
                  className="text-[#0066CC] hover:text-[#0051D5] font-semibold text-base"
                >
                  Resume
                </button>
                <h3 className="text-base font-semibold text-gray-900">
                  Save Session
                </h3>
                <div className="w-16"></div> {/* Spacer for centering */}
              </div>
              {/* Reuse existing completion UI from below */}
              <div className="space-y-3 sm:space-y-4">
                {/* Session Title */}
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={e => setSessionTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-base"
                  placeholder="Afternoon Work Session"
                />

                {/* Description */}
                <textarea
                  value={sessionDescription}
                  onChange={e => setSessionDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-base"
                  rows={3}
                  placeholder="How'd it go? Share more about your session."
                />

                {/* Activity Selection */}
                <div className="relative">
                  <button
                    onClick={() => setShowActivityPicker(!showActivityPicker)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] bg-white cursor-pointer text-base flex items-center gap-3 hover:border-gray-400 transition-colors min-h-[44px]"
                  >
                    {selectedActivity ? (
                      <>
                        <IconRenderer
                          iconName={selectedActivity.icon}
                          className="w-5 h-5 flex-shrink-0"
                          style={{ color: selectedActivity.color }}
                        />
                        <span className="flex-1 text-left">
                          {selectedActivity.name}
                        </span>
                      </>
                    ) : (
                      <span className="flex-1 text-left text-gray-500">
                        Select an activity
                      </span>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>

                  {/* Dropdown Menu */}
                  {showActivityPicker && (
                    <>
                      {/* Backdrop for closing */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowActivityPicker(false)}
                      />

                      {/* Dropdown content */}
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                        {allActivities.length === 0 ? (
                          <div className="p-4 text-center">
                            <p className="text-sm text-gray-600 mb-3">
                              No activities yet
                            </p>
                            <Link
                              href="/activities/new"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0051D5] transition-colors text-sm font-medium"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                              Create Activity
                            </Link>
                          </div>
                        ) : (
                          <>
                            {allActivities.map(activity => (
                              <button
                                key={activity.id}
                                onClick={() => {
                                  setSelectedActivityId(activity.id);
                                  setShowActivityPicker(false);
                                }}
                                className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                                  selectedActivityId === activity.id
                                    ? 'bg-blue-50'
                                    : ''
                                }`}
                              >
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{
                                    backgroundColor: `${activity.color}20`,
                                  }}
                                >
                                  <IconRenderer
                                    iconName={activity.icon}
                                    className="w-4 h-4"
                                    style={{ color: activity.color }}
                                  />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <div className="text-sm font-medium text-gray-900">
                                    {activity.name}
                                  </div>
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
                                <svg
                                  className="w-4 h-4 text-[#0066CC]"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                              </div>
                              <span className="text-sm">
                                Create New Activity
                              </span>
                            </Link>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Image Upload */}
                <div className="max-w-md">
                  <ImageUpload
                    maxImages={3}
                    maxSizeMB={5}
                    images={selectedImages}
                    previewUrls={imagePreviewUrls}
                    onImagesChange={handleImagesChange}
                    uploadMode="deferred"
                    showProgress={false}
                  />
                </div>

                {/* Duration Adjuster */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Adjust Duration
                  </label>
                  <div className="space-y-3">
                    {/* Start Time Input */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formatTimeForInput(startTime)}
                        onChange={e => handleStartTimeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-sm"
                      />
                    </div>

                    <div className="py-2 px-1">
                      <Slider
                        min={0}
                        max={getElapsedTime()}
                        step={900}
                        value={adjustedDuration}
                        onChange={handleDurationSliderChange}
                        trackStyle={{ backgroundColor: '#0066CC', height: 6 }}
                        railStyle={{ backgroundColor: '#E5E7EB', height: 6 }}
                        handleStyle={{
                          backgroundColor: 'white',
                          border: '3px solid #0066CC',
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
                      <span className="font-semibold text-base text-gray-900">
                        {getFormattedTime(adjustedDuration)}
                      </span>
                      <span>{getFormattedTime(getElapsedTime())}</span>
                    </div>
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={e =>
                      setVisibility(
                        e.target.value as 'everyone' | 'followers' | 'private'
                      )
                    }
                    className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] appearance-none bg-white min-h-[44px]"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                    }}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="followers">Followers</option>
                    <option value="private">Only You</option>
                  </select>
                </div>

                {/* Discard Session Link */}
                <div className="pt-2 pb-1 text-center">
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-red-600 hover:text-red-700 text-base font-medium"
                  >
                    Discard Session
                  </button>
                </div>

                {/* Save Session Button */}
                <button
                  onClick={handleFinishTimer}
                  disabled={!sessionTitle.trim() || isUploadingImages}
                  className="w-full px-4 py-3 bg-[#0066CC] text-white rounded-lg hover:bg-[#0051D5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base"
                >
                  {isUploadingImages ? 'Uploading...' : 'Save Session'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Confirmation Modal - Portal-style overlay */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Discard Session?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to discard this session? All progress will
                be lost.
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
                  Discard
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
      {/* Back Button - Top Left (Mobile Only) */}
      <Link
        href="/"
        className="md:hidden fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 hover:opacity-70 transition-opacity"
        aria-label="Go back to home"
      >
        <ArrowLeft className="w-6 h-6 text-gray-700" />
      </Link>

      {/* Centered Timer Container */}
      <div className="w-full max-w-2xl px-4 flex flex-col items-center space-y-8">
        {/* Large Timer Display */}
        <div className="text-center w-full">
          <div
            className="text-7xl md:text-8xl lg:text-9xl font-mono font-bold text-gray-900 mb-8 tracking-tight"
            aria-label={`Timer: ${Math.floor(displayTime / 3600)} hours, ${Math.floor((displayTime % 3600) / 60)} minutes, ${displayTime % 60} seconds`}
          >
            {getFormattedTime(displayTime)}
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-8">
            {!timerState.isRunning && !timerState.startTime && (
              <>
                <button
                  onClick={handleStartTimer}
                  disabled={
                    !selectedActivityId ||
                    !allActivities.find(a => a.id === selectedActivityId)
                  }
                  className={`inline-flex items-center justify-center gap-3 px-10 py-4 rounded-xl text-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation ${
                    selectedActivityId &&
                    allActivities.find(a => a.id === selectedActivityId)
                      ? 'bg-[#0066CC] hover:bg-[#0051D5] text-white focus-visible:ring-[#0066CC]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-6 h-6" />
                  <span>Start</span>
                </button>

                <Link
                  href="/record-manual"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 touch-manipulation"
                >
                  <Edit3 className="w-5 h-5" />
                  <span>Manual</span>
                </Link>

                <button
                  onClick={() => setShowTimePickerModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 touch-manipulation"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    {customStartTime
                      ? `From ${Math.floor(
                          (new Date().getTime() - customStartTime.getTime()) /
                            1000 /
                            60 /
                            60
                        )}h ${Math.floor(
                          ((new Date().getTime() - customStartTime.getTime()) /
                            1000 /
                            60) %
                            60
                        )}m ago`
                      : 'Start From'}
                  </span>
                </button>
              </>
            )}

            {timerState.isRunning && (
              <button
                onClick={handlePauseTimer}
                className="px-10 py-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-3 transition-all text-lg font-semibold"
              >
                <Pause className="w-6 h-6" />
                <span>Pause</span>
              </button>
            )}

            {!timerState.isRunning && timerState.startTime && (
              <>
                <button
                  onClick={handleResumeTimer}
                  className="px-10 py-4 rounded-xl bg-[#0066CC] hover:bg-[#0051D5] text-white flex items-center gap-3 transition-all text-lg font-semibold"
                >
                  <Play className="w-6 h-6" />
                  <span>Resume</span>
                </button>
                <button
                  onClick={() => setShowFinishModal(true)}
                  className="px-10 py-4 rounded-xl bg-[#34C759] hover:bg-[#2FB84D] text-white flex items-center gap-3 transition-all text-lg font-semibold"
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
            Activity{' '}
            {showActivityError && (
              <span className="text-red-600 ml-1">
                - Please select an activity
              </span>
            )}
          </label>
          <button
            onClick={() => setShowActivityPicker(!showActivityPicker)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 bg-white cursor-pointer text-base flex items-center gap-3 transition-colors ${
              showActivityError
                ? 'border-red-500 ring-2 ring-red-200 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-[#0066CC] focus:border-[#0066CC] hover:border-gray-400'
            }`}
          >
            {selectedActivity ? (
              <>
                <IconRenderer
                  iconName={selectedActivity.icon}
                  className="w-6 h-6 flex-shrink-0"
                  style={{ color: selectedActivity.color }}
                />
                <span className="flex-1 text-left font-medium">
                  {selectedActivity.name}
                </span>
              </>
            ) : (
              <span className="flex-1 text-left text-gray-500">
                Select an activity
              </span>
            )}
            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </button>

          {/* Dropdown Menu */}
          {showActivityPicker && (
            <>
              {/* Backdrop for closing */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActivityPicker(false)}
              />

              {/* Dropdown content */}
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                {allActivities.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      No activities yet
                    </p>
                    <Link
                      href="/activities/new"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0051D5] transition-colors text-sm font-medium"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Create Activity
                    </Link>
                  </div>
                ) : (
                  <>
                    {allActivities.map(activity => (
                      <button
                        key={activity.id}
                        onClick={() => {
                          setSelectedActivityId(activity.id);
                          setShowActivityPicker(false);
                          setShowActivityError(false);
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
                          <div className="text-sm font-medium text-gray-900">
                            {activity.name}
                          </div>
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
                        <svg
                          className="w-4 h-4 text-[#0066CC]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
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

        {/* No Activities Message - Minimalist design below activity selector */}
        {needsActivity && (
          <div className="w-full max-w-xl border border-gray-300 rounded-lg p-6 bg-white">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Create your first activity to get started
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Activities help you organize your work sessions. You'll need at
              least one activity before you can start tracking time.
            </p>
            <Link
              href="/activities/new"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#0066CC] text-white rounded-lg hover:bg-[#0051D5] transition-colors text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Activity
            </Link>
          </div>
        )}
      </div>

      {/* Time Picker Modal */}
      {showTimePickerModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Start From Past Time
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Set when you actually started working. Your session will begin
              from that time.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={
                    customStartTime
                      ? new Date(
                          customStartTime.getTime() -
                            customStartTime.getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .slice(0, 16)
                      : new Date(
                          new Date().getTime() -
                            new Date().getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .slice(0, 16)
                  }
                  onChange={e => {
                    if (e.target.value) {
                      setCustomStartTime(new Date(e.target.value));
                    } else {
                      setCustomStartTime(null);
                    }
                  }}
                  max={new Date(
                    new Date().getTime() -
                      new Date().getTimezoneOffset() * 60000
                  )
                    .toISOString()
                    .slice(0, 16)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-base"
                />
              </div>

              {customStartTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    <strong>Duration:</strong>{' '}
                    {Math.floor(
                      (new Date().getTime() - customStartTime.getTime()) /
                        1000 /
                        60 /
                        60
                    )}
                    h{' '}
                    {Math.floor(
                      ((new Date().getTime() - customStartTime.getTime()) /
                        1000 /
                        60) %
                        60
                    )}
                    m
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setCustomStartTime(null);
                  setShowTimePickerModal(false);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowTimePickerModal(false)}
                className="flex-1 px-4 py-3 bg-[#0066CC] text-white rounded-xl hover:bg-[#0051D5] transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
