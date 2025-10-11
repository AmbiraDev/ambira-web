'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { SessionFormData, Project, CreateSessionData } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ArrowLeft, Check, Image as ImageIcon, XCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { uploadImages, compressImage } from '@/lib/imageUpload';

const PRIVACY_OPTIONS = [
  { value: 'everyone', label: 'Everyone', description: 'Visible to all users' },
  { value: 'followers', label: 'Followers', description: 'Visible to your followers' },
  { value: 'private', label: 'Only You', description: 'Private to you only' },
];

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
            console.log(`✅ Successfully converted HEIC file: ${file.name}`);
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
      
      // Parse the session date and start time
      const sessionDateTime = new Date(`${sessionDate}T${startTime}`);
      
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
          setErrors({ submit: 'Failed to upload images. Please try again.' });
          setIsUploadingImages(false);
          setIsLoading(false);
          return;
        }
        setIsUploadingImages(false);
      }
      
      const formData: CreateSessionData = {
        projectId,
        title,
        description,
        duration,
        startTime: sessionDateTime,
        taskIds: [],
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Manual</h1>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Log a session that you completed earlier
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
          
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
              rows={4}
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

          {/* Date and Time Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4">
              When did this session happen?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
            <div className="mt-3 sm:mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration *
              </label>
              <div className="flex gap-2 sm:gap-3">
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
            <div className="space-y-2">
              {PRIVACY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={visibility === option.value}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                    disabled={isLoading}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Private Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Private Notes (Only visible to you)
            </label>
            <textarea
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              rows={3}
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
          <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-white -mx-4 sm:mx-0 -mb-4 sm:mb-0 px-4 sm:px-0 py-4 sm:py-0 border-t sm:border-t-0 border-gray-200 sm:border-0 sm:static">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 min-h-[48px]"
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
