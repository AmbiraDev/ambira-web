'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { SessionFormData, Project, CreateSessionData } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ArrowLeft, Check, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { uploadImages, compressImage } from '@/lib/imageUpload';
import { parseLocalDateTime } from '@/lib/utils';
import Header from '@/components/HeaderComponent';

interface DeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const DeleteConfirm: React.FC<DeleteConfirmProps> = ({ isOpen, onClose, onDelete }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 md:hidden flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-lg p-5 w-full max-w-sm shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Delete Image?
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            This image will be removed from your session.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 active:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 active:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default function ManualSessionRecorder() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'everyone' | 'followers' | 'private'>('everyone');
  const [privateNotes, setPrivateNotes] = useState('');
  
  // Manual time inputs
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  const [endTime, setEndTime] = useState('10:00');
  const [manualDurationHours, setManualDurationHours] = useState('1');
  const [manualDurationMinutes, setManualDurationMinutes] = useState('0');
  
  // Image upload state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [actionSheetIndex, setActionSheetIndex] = useState<number | null>(null);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      
      try {
        const projectList = await firebaseApi.project.getProjects();
        setProjects(projectList);
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };

    loadProjects();
  }, [user]);

  // Auto-generate title based on time of day and project
  useEffect(() => {
    if (!title && projectId) {
      const project = projects.find(p => p.id === projectId);
      const hour = new Date().getHours();
      
      let timeOfDay = '';
      if (hour < 12) timeOfDay = 'Morning';
      else if (hour < 17) timeOfDay = 'Afternoon';
      else timeOfDay = 'Evening';
      
      const smartTitle = project ? `${timeOfDay} ${project.name} Session` : `${timeOfDay} Work Session`;
      setTitle(smartTitle);
    }
  }, [projectId, projects]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + selectedImages.length > 3) {
      alert('Maximum 3 images allowed');
      return;
    }

    const validFiles: File[] = [];
    const previewUrls: string[] = [];

    for (const file of files) {
      try {
        // Convert HEIC to JPEG first
        let processedFile = file;
        
        // Check if it's HEIC and convert
        const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                      file.name.toLowerCase().endsWith('.heif') ||
                      file.type === 'image/heic' || 
                      file.type === 'image/heif';
        
        if (isHeic) {
          try {
            // Dynamically import heic2any - handle both default and named exports
            const heic2anyModule = await import('heic2any');
            const heic2any = heic2anyModule.default || heic2anyModule;
            
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.9
            });
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            processedFile = new File(
              [blob],
              file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
              { type: 'image/jpeg' }
            );
          } catch (error) {
            console.error('Error converting HEIC:', error);
            // More helpful error message
            alert(`HEIC conversion is currently unavailable. Please convert ${file.name} to JPG or PNG before uploading, or try refreshing the page.`);
            continue;
          }
        }

        if (!processedFile.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`);
          continue;
        }

        if (processedFile.size > 10 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum size is 10MB`);
          continue;
        }

        validFiles.push(processedFile);
        const previewUrl = URL.createObjectURL(processedFile);
        previewUrls.push(previewUrl);
      } catch (error) {
        console.error('Error processing image:', error);
        alert(`Failed to process ${file.name}`);
      }
    }

    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);
      setImagePreviewUrls(prev => [...prev, ...previewUrls]);
    }
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const calculateDuration = (): number => {
    // Use manual duration input
    const hours = parseInt(manualDurationHours) || 0;
    const minutes = parseInt(manualDurationMinutes) || 0;
    return (hours * 3600) + (minutes * 60);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!projectId) {
      newErrors.projectId = 'Please select a project';
    }

    if (!title.trim()) {
      newErrors.title = 'Please enter a session title';
    }

    const duration = calculateDuration();
    if (duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }

    if (!sessionDate) {
      newErrors.sessionDate = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) {
      return;
    }

    setIsLoading(true);

    try {
      const duration = calculateDuration();

      // Parse the session date and start time in local timezone
      // NOTE: Using parseLocalDateTime to avoid UTC interpretation issues
      const sessionDateTime = parseLocalDateTime(sessionDate, startTime);

      // Upload images first if any
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        setIsUploadingImages(true);
        try {
          const uploadResults = await uploadImages(selectedImages);
          imageUrls = uploadResults.map(result => result.url);
        } catch (error) {
          console.error('Failed to upload images:', error);
          setErrors({ submit: 'Failed to upload images. Please try again.' });
          setIsUploadingImages(false);
          setIsLoading(false);
          return;
        }
        setIsUploadingImages(false);
      }
      
      const formData: CreateSessionData = {
        activityId: '',
        projectId,
        title,
        description,
        duration,
        startTime: sessionDateTime,
        tags: [],
        visibility,
        privateNotes,
        images: imageUrls,
      };

      // Create session with post
      await firebaseApi.session.createSessionWithPost(formData, description, visibility);

      // Invalidate caches to refresh UI immediately
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['user', 'sessions', user.id] });
        queryClient.invalidateQueries({ queryKey: ['user', 'stats', user.id] });
        queryClient.invalidateQueries({ queryKey: ['streak', user.id] });
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        queryClient.invalidateQueries({ queryKey: ['sessions', 'feed'] });
      }

      // Show success message
      success('Session created successfully!');

      // Redirect to home feed
      router.push('/');
    } catch (error) {
      console.error('Failed to create manual session:', error);
      showError('Failed to create session. Please try again.');
      setErrors({ submit: 'Failed to create session. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Header - hidden on mobile */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile Back Button with Title */}
      <div className="md:hidden pt-4 px-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={isLoading}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Log Manual Session</h1>
      </div>

      {/* Desktop Page Title */}
      <div className="hidden md:block bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-3">
          <h1 className="text-2xl font-bold text-gray-900">Log Manual Session</h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.projectId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="text-red-500 text-sm mt-1">{errors.projectId}</p>
            )}
          </div>

          {/* Session Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Morning Work Session"
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="What did you accomplish during this session?"
              disabled={isLoading}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos (Optional)
            </label>
            <div className="space-y-2">
              {/* Image Previews */}
              {imagePreviewUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={url}
                        alt={`Preview ${index + 1}`}
                        width={300}
                        height={300}
                        quality={90}
                        className="w-full h-full object-cover"
                        unoptimized
                        onClick={() => setActionSheetIndex(index)}
                      />
                      {/* Desktop X button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="hidden md:block absolute top-1 right-1 p-0.5 text-white hover:text-red-500 transition-colors"
                        aria-label="Remove image"
                        style={{ filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.9))' }}
                      >
                        <X className="w-5 h-5" strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Delete confirmation modal */}
              <DeleteConfirm
                isOpen={actionSheetIndex !== null}
                onClose={() => setActionSheetIndex(null)}
                onDelete={() => {
                  if (actionSheetIndex !== null) {
                    handleRemoveImage(actionSheetIndex);
                    setActionSheetIndex(null);
                  }
                }}
              />

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

          {/* Date and Time Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              When did this session happen?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.sessionDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Select the date of your session</p>
                {errors.sessionDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.sessionDate}</p>
                )}
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">When you started working</p>
              </div>
            </div>

            {/* Duration */}
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration *
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={manualDurationHours}
                    onChange={(e) => setManualDurationHours(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.duration ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Hours</p>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={manualDurationMinutes}
                    onChange={(e) => setManualDurationMinutes(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.duration ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Minutes</p>
                </div>
              </div>
              {errors.duration && (
                <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
              )}
            </div>
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Privacy
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'everyone' | 'followers' | 'private')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
              disabled={isLoading}
            >
              <option value="everyone">Everyone - Visible to all users</option>
              <option value="followers">Followers - Visible to your followers</option>
              <option value="private">Only You - Private to you only</option>
            </select>
          </div>

          {/* Private Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Private Notes <span className="text-xs text-gray-500">(Only visible to you)</span>
            </label>
            <textarea
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Personal reflections, learnings, or notes..."
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 min-h-[48px]"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
              disabled={isLoading || isUploadingImages}
            >
              {isUploadingImages ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading Images...
                </>
              ) : isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Create Session
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
