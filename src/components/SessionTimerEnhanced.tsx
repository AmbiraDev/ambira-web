'use client';

import React, { useState, useEffect } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useProjects } from '@/contexts/ProjectsContext';
import { useTasks } from '@/contexts/TasksContext';
import { Play, Pause, Square, X, ChevronDown, Check, Flag, Image as ImageIcon, XCircle, Edit3 } from 'lucide-react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { GlobalTasks } from './GlobalTasks';
import { uploadImages, compressImage } from '@/lib/imageUpload';
import Image from 'next/image';
import Link from 'next/link';

interface SessionTimerEnhancedProps {
  projectId: string;
}
interface TagConfig {
  name: string;
  color: string;
  bgColor: string;
}

const TAG_CONFIGS: TagConfig[] = [
  { name: 'Study', color: '#3B82F6', bgColor: '#DBEAFE' },      // Blue
  { name: 'Work', color: '#8B5CF6', bgColor: '#EDE9FE' },        // Purple
  { name: 'Side Project', color: '#F59E0B', bgColor: '#FEF3C7' }, // Amber
  { name: 'Reading', color: '#10B981', bgColor: '#D1FAE5' },     // Green
  { name: 'Learning', color: '#EC4899', bgColor: '#FCE7F3' },    // Pink
];

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
  const [visibility, setVisibility] = useState<'everyone' | 'followers' | 'private'>('everyone');
  const [showStartTime, setShowStartTime] = useState(false);
  const [hideTaskNames, setHideTaskNames] = useState(false);
  const [publishToFeeds, setPublishToFeeds] = useState(true);
  const [howFelt, setHowFelt] = useState<number>(3);
  const [privateNotes, setPrivateNotes] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [displayTime, setDisplayTime] = useState(0);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [adjustedDuration, setAdjustedDuration] = useState(0);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Load last used project and tag from local storage on mount
  useEffect(() => {
    const savedProjectId = localStorage.getItem('lastSessionProject');
    const savedTag = localStorage.getItem('lastSessionTag');
    
    if (savedProjectId) {
      setSelectedProjectId(savedProjectId);
    }
    if (savedTag) {
      setSessionTags([savedTag]);
    }
  }, []);

  // Initialize selectedProjectId from timerState if there's an active session
  useEffect(() => {
    if (timerState.currentProject && !selectedProjectId) {
      setSelectedProjectId(timerState.currentProject.id);
    }
  }, [timerState.currentProject]);

  // Save project to local storage whenever it changes
  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('lastSessionProject', selectedProjectId);
    }
  }, [selectedProjectId]);

  // Save tag to local storage whenever it changes
  useEffect(() => {
    if (sessionTags.length > 0 && sessionTags[0]) {
      localStorage.setItem('lastSessionTag', sessionTags[0]);
    }
  }, [sessionTags]);

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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('📸 Files selected:', files.length);

    if (files.length + selectedImages.length > 3) {
      alert('Maximum 3 images allowed');
      return;
    }

    // Validate file size (max 5MB per image)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles: File[] = [];
    const previewUrls: string[] = [];

    for (const file of files) {
      console.log('📸 Processing file:', file.name, file.type, `${(file.size / 1024 / 1024).toFixed(2)}MB`);

      // Check if it's HEIC - we'll handle conversion during upload
      const isHeic = file.type === 'image/heic' ||
                     file.type === 'image/heif' ||
                     file.name.toLowerCase().endsWith('.heic') ||
                     file.name.toLowerCase().endsWith('.heif');

      // Check file size
      if (file.size > maxSize) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        alert(`Image "${file.name}" is too large (${sizeMB}MB). Maximum size is 5MB.`);
        continue;
      }

      // Allow HEIC files as well as regular images
      if (!file.type.startsWith('image/') && !isHeic) {
        alert(`"${file.name}" is not an image file. Please use JPG, PNG, GIF, WebP, or HEIC.`);
        continue;
      }

      try {
        // No compression - just use the original file
        const processedFile = file;

        // Create preview URL
        const previewUrl = URL.createObjectURL(processedFile);
        console.log(`✅ Added image: ${file.name}, preview URL: ${previewUrl}`);

        validFiles.push(processedFile);
        previewUrls.push(previewUrl);
      } catch (error) {
        console.error('❌ Error processing image:', error);
        alert(`Failed to process "${file.name}". Please try another image.`);
      }
    }

    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);
      setImagePreviewUrls(prev => [...prev, ...previewUrls]);
      console.log('✅ Total images now:', validFiles.length + selectedImages.length);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index]);
      return newUrls;
    });
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
        sessionTags,
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
      setSessionTags([]);
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
      setSessionTags([]);
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
        <div className="min-h-[calc(100vh-120px)]">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg p-6 w-full shadow">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Complete Session</h3>
                <button onClick={() => setShowFinishModal(false)} className="text-gray-500 hover:text-gray-700">Close</button>
              </div>
              {/* Reuse existing completion UI from below */}
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

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Images (Optional, max 3)
                </label>
                <div className="space-y-3">
                  {/* Image Previews */}
                  {imagePreviewUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={url}
                            alt={`Preview ${index + 1}`}
                            width={300}
                            height={300}
                            quality={90}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  {selectedImages.length < 3 && (
                    <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#007AFF] hover:bg-gray-50 transition-colors min-h-[120px]">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">
                        {imagePreviewUrls.length === 0 ? 'Add images' : `Add ${3 - imagePreviewUrls.length} more`}
                      </span>
                      <span className="text-xs text-gray-400">
                        JPG, PNG, HEIC (max 5MB each)
                      </span>
                      <input
                        type="file"
                        accept="image/*,.heic,.heif"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Project and Tags - Side by Side */}
              <div className="grid grid-cols-2 gap-3">
                {/* Project Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white text-sm appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23666\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}
                  >
                    <option value="">Unassigned</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.icon} {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-base">🏷️</span>
                    </div>
                    <select
                      value={sessionTags[0] || ''}
                      onChange={(e) => setSessionTags(e.target.value ? [e.target.value] : [])}
                      className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white text-sm appearance-none"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23666\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}
                    >
                      <option value="">Select Tag</option>
                      {TAG_CONFIGS.map((tagConfig) => (
                        <option key={tagConfig.name} value={tagConfig.name}>
                          {tagConfig.name}
                        </option>
                      ))}
                    </select>
                  </div>
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

              {/* Privacy and Publishing Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23666\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="followers">Followers</option>
                    <option value="private">Only You</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Options</label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={showStartTime} onChange={(e) => setShowStartTime(e.target.checked)} />
                    Show start time
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={hideTaskNames} onChange={(e) => setHideTaskNames(e.target.checked)} />
                    Don't show task names
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={publishToFeeds} onChange={(e) => setPublishToFeeds(e.target.checked)} />
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
                  <div>Project: {projects.find(p => p.id === selectedProjectId)?.name || timerState.currentProject?.name || 'Unassigned'}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel Session
                </button>
                <button
                  onClick={handleFinishTimer}
                  disabled={!sessionTitle.trim() || isUploadingImages}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingImages ? 'Uploading Images...' : 'Save Session'}
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
                  Cancel Session
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Main timer UI - only show when not completing a session
  const selectedProject = projects.find(p => p.id === selectedProjectId) || timerState.currentProject;
  const selectedTag = sessionTags[0];
  const selectedTagConfig = TAG_CONFIGS.find(t => t.name === selectedTag);

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
            <div className="text-6xl font-bold tracking-tight text-gray-900">
              {getFormattedTime(displayTime)}
            </div>
          </div>
        </div>

        {/* Scrollable Task List Container */}
        <div className="flex-1 overflow-y-auto px-4 pb-65">
          <div className="w-full max-w-md mx-auto">
            <GlobalTasks
              selectedTaskIds={selectedTaskIds}
              onToggleTaskSelection={handleTaskToggle}
              showSelection={true}
            />
          </div>
        </div>

        {/* Fixed Bottom Controls - Strava Style */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-6 safe-area-bottom">
          <div className="flex items-end justify-center gap-6 max-w-md mx-auto">
            {/* Project Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setShowProjectPicker(true)}
                className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all border-2 active:scale-95"
                style={selectedProjectId && selectedProject ? {
                  backgroundColor: `${selectedProject.color}20`,
                  borderColor: selectedProject.color
                } : {
                  backgroundColor: '#F3F4F6',
                  borderColor: '#D1D5DB'
                }}
              >
                <span className="text-2xl">{selectedProject?.icon || '📁'}</span>
              </button>
              <span className="text-xs text-gray-600 font-medium">Project</span>
            </div>

            {/* Center: Main Action Button */}
            {!timerState.isRunning && !timerState.startTime && (
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={handleStartTimer}
                  disabled={!selectedProjectId}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl ${
                    selectedProjectId
                      ? 'bg-[#22C55E] hover:bg-[#16A34A] active:scale-95'
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
                  className="w-16 h-16 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] active:scale-95 flex items-center justify-center transition-all shadow-lg"
                >
                  <Edit3 className="w-6 h-6 text-white" />
                </Link>
                <span className="text-xs text-gray-600 font-medium">Manual</span>
              </div>
            )}

            {/* Tag Button */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setShowTagPicker(true)}
                className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all border-2 active:scale-95"
                style={selectedTagConfig ? {
                  backgroundColor: selectedTagConfig.bgColor,
                  borderColor: selectedTagConfig.color
                } : {
                  backgroundColor: '#F3F4F6',
                  borderColor: '#D1D5DB'
                }}
              >
                <span className="text-2xl">🏷️</span>
              </button>
              <span className="text-xs text-gray-600 font-medium">Tag</span>
            </div>

            {/* Pause Button - Centered */}
            {timerState.isRunning && (
              <>
                <div className="w-16"></div> {/* Spacer */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={handlePauseTimer}
                    className="w-24 h-24 rounded-full bg-gray-900 hover:bg-gray-800 active:scale-95 flex items-center justify-center transition-all shadow-xl"
                  >
                    <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  </button>
                  <span className="text-xs text-gray-600 font-medium">Pause</span>
                </div>
                <div className="w-16"></div> {/* Spacer */}
              </>
            )}

            {/* Resume & Finish - Centered */}
            {!timerState.isRunning && timerState.startTime && (
              <>
                <div className="w-16"></div> {/* Spacer */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={handleResumeTimer}
                      className="w-20 h-20 rounded-full bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 flex items-center justify-center transition-all shadow-xl"
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
                      className="w-20 h-20 rounded-full bg-[#FC4C02] hover:bg-[#E04502] active:scale-95 flex items-center justify-center transition-all shadow-xl"
                    >
                      <Flag className="w-7 h-7 text-white" />
                    </button>
                    <span className="text-xs text-gray-600 font-medium">Finish</span>
                  </div>
                </div>
                <div className="w-16"></div> {/* Spacer */}
              </>
            )}
          </div>
        </div>

        {/* Project Picker Modal - Slide up with timer visible */}
        {showProjectPicker && (
          <div
            className="fixed inset-0 z-50 flex items-end"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowProjectPicker(false);
            }}
          >
            <div className="bg-white w-full rounded-t-3xl p-6 max-h-[60vh] overflow-y-auto shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Select Project</h2>
                <button
                  onClick={() => setShowProjectPicker(false)}
                  className="p-2 text-gray-500 hover:text-gray-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                {/* Unassigned Option */}
                <button
                  onClick={() => {
                    setSelectedProjectId('');
                    setShowProjectPicker(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    !selectedProjectId
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <span className="text-3xl">📁</span>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900">Unassigned</div>
                    <div className="text-sm text-gray-500">No project selected</div>
                  </div>
                  {!selectedProjectId && (
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Project List */}
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setShowProjectPicker(false);
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                      selectedProjectId === project.id
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-3xl">{project.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-gray-500">{project.description}</div>
                      )}
                    </div>
                    {selectedProjectId === project.id && (
                      <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tag Picker Modal - Slide up with timer visible */}
        {showTagPicker && (
          <div
            className="fixed inset-0 z-50 flex items-end"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowTagPicker(false);
            }}
          >
            <div className="bg-white w-full rounded-t-3xl p-6 max-h-[60vh] overflow-y-auto shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Select Tag</h2>
                <button
                  onClick={() => setShowTagPicker(false)}
                  className="p-2 text-gray-500 hover:text-gray-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                {TAG_CONFIGS.map((tagConfig) => (
                  <button
                    key={tagConfig.name}
                    onClick={() => {
                      setSessionTags([tagConfig.name]);
                      setShowTagPicker(false);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all border-2"
                    style={selectedTag === tagConfig.name ? {
                      backgroundColor: tagConfig.bgColor,
                      borderColor: tagConfig.color
                    } : {
                      backgroundColor: '#F9FAFB',
                      borderColor: 'transparent'
                    }}
                  >
                    <span className="text-2xl">🏷️</span>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">{tagConfig.name}</div>
                    </div>
                    {selectedTag === tagConfig.name && (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ color: tagConfig.color }}>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Two-column layout */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 pb-4 px-4 max-w-7xl mx-auto">
        {/* Left Column - Timer & Controls */}
        <div className="flex flex-col items-center justify-start space-y-6 lg:space-y-8 lg:sticky lg:top-24 pt-8">
          {/* Large Timer Display */}
          <div className="text-center w-full">
            <div className="text-6xl md:text-7xl lg:text-9xl font-mono font-bold text-gray-900 mb-4 lg:mb-8">
              {getFormattedTime(displayTime)}
            </div>

            {/* Timer Controls - Pill Buttons with Text */}
            <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
              {!timerState.isRunning && !timerState.startTime && (
                <>
                  <button
                    onClick={handleStartTimer}
                    disabled={!selectedProjectId}
                    className={`px-8 md:px-12 py-3 md:py-5 rounded-full flex items-center gap-2 md:gap-3 transition-all text-base md:text-xl font-semibold ${
                      selectedProjectId
                        ? 'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-lg hover:shadow-xl'
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
                    className="px-6 md:px-8 py-2.5 md:py-4 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-xl text-sm md:text-lg font-semibold"
                  >
                    <Edit3 className="w-5 h-5 md:w-6 md:h-6" />
                    <span>Manual</span>
                  </Link>
                </>
              )}

              {timerState.isRunning && (
                <button
                  onClick={handlePauseTimer}
                  className="px-8 md:px-12 py-3 md:py-5 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 md:gap-3 transition-all shadow-lg hover:shadow-xl text-base md:text-xl font-semibold"
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
                    className="px-6 md:px-10 py-3 md:py-4 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-xl text-base md:text-lg font-semibold"
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Resume</span>
                  </button>
                  <button
                    onClick={() => setShowFinishModal(true)}
                    className="px-6 md:px-10 py-3 md:py-4 rounded-full bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-xl text-base md:text-lg font-semibold"
                  >
                    <Flag className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    <span>Finish</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Project & Tag Dropdowns */}
          <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {/* Project Dropdown */}
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white appearance-none cursor-pointer text-sm md:text-base"
              >
                <option value="">Unassigned</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.icon} {project.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Tag Dropdown */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 md:pl-4 pointer-events-none z-10">
                <span className="text-lg">🏷️</span>
              </div>
              <select
                value={sessionTags[0] || ''}
                onChange={(e) => setSessionTags(e.target.value ? [e.target.value] : [])}
                className="w-full pl-10 md:pl-12 pr-10 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white appearance-none cursor-pointer text-sm md:text-base"
              >
                <option value="">Select Tag</option>
                {TAG_CONFIGS.map((tagConfig) => (
                  <option key={tagConfig.name} value={tagConfig.name}>
                    {tagConfig.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Tasks */}
        <div className="flex items-start justify-center w-full">
          <div className="w-full max-w-2xl max-h-[60vh] overflow-y-auto pb-8">
            <GlobalTasks
              selectedTaskIds={selectedTaskIds}
              onToggleTaskSelection={handleTaskToggle}
              showSelection={true}
            />
          </div>
        </div>
      </div>

      {/* Session Completion Page-like container (not modal) */}
      {showFinishModal && (
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-auto shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Complete Session</h3>
              <button onClick={() => setShowFinishModal(false)} className="text-gray-500 hover:text-gray-700">Close</button>
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

              {/* Project and Tags - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Project Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23666\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}
                  >
                    <option value="">Unassigned</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.icon} {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-base">🏷️</span>
                    </div>
                    <select
                      value={sessionTags[0] || ''}
                      onChange={(e) => setSessionTags(e.target.value ? [e.target.value] : [])}
                      className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white appearance-none"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23666\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}
                    >
                      <option value="">Select Tag</option>
                      {TAG_CONFIGS.map((tagConfig) => (
                        <option key={tagConfig.name} value={tagConfig.name}>
                          {tagConfig.name}
                        </option>
                      ))}
                    </select>
                  </div>
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
                  <div>Project: {projects.find(p => p.id === selectedProjectId)?.name || timerState.currentProject?.name || 'Unassigned'}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel Session
                </button>
                <button
                  onClick={handleFinishTimer}
                  disabled={!sessionTitle.trim() || isUploadingImages}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingImages ? 'Uploading Images...' : 'Save Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
