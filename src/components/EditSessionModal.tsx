'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Session } from '@/types';
import { X, Image as ImageIcon } from 'lucide-react';
import { uploadImages } from '@/lib/imageUpload';
import { useAuth } from '@/hooks/useAuth';
import { useActivities } from '@/hooks/useActivitiesQuery';
import { parseLocalDateTime, cn } from '@/lib/utils';

interface EditSessionModalProps {
  session: Session;
  onClose: () => void;
  onSave: (
    sessionId: string,
    data: {
      title: string;
      description?: string;
      projectId?: string;
      tags?: string[];
      visibility?: 'everyone' | 'followers' | 'private';
      images?: string[];
      startTime?: Date;
      duration?: number;
    }
  ) => Promise<void>;
  isPage?: boolean;
}

export const EditSessionModal: React.FC<EditSessionModalProps> = ({
  session,
  onClose,
  onSave,
  isPage = false,
}) => {
  const { user } = useAuth();
  const { data: projects = [] } = useActivities(user?.id);

  const [title, setTitle] = useState(session.title || '');
  const [description, setDescription] = useState(session.description || '');
  const [selectedProjectId, setSelectedProjectId] = useState(
    session.projectId || ''
  );
  const [visibility, setVisibility] = useState<
    'everyone' | 'followers' | 'private'
  >(session.visibility || 'everyone');
  const [existingImages, setExistingImages] = useState<string[]>(
    session.images || []
  );
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Date/time state
  const [sessionDate, setSessionDate] = useState(() => {
    const date = new Date(session.startTime);
    return date.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState(() => {
    const date = new Date(session.startTime);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  const [durationHours, setDurationHours] = useState(() => {
    return String(Math.floor(session.duration / 3600));
  });
  const [durationMinutes, setDurationMinutes] = useState(() => {
    return String(Math.floor((session.duration % 3600) / 60));
  });

  // Update state when session prop changes (important for modal reuse)
  useEffect(() => {
    setTitle(session.title || '');
    setDescription(session.description || '');
    setSelectedProjectId(session.projectId || '');
    setVisibility(session.visibility || 'everyone');
    setExistingImages(session.images || []);
    setSelectedImages([]);
    setImagePreviewUrls([]);

    // Update date/time fields
    const date = new Date(session.startTime);
    setSessionDate(date.toISOString().split('T')[0]);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    setStartTime(`${hours}:${minutes}`);
    setDurationHours(String(Math.floor(session.duration / 3600)));
    setDurationMinutes(String(Math.floor((session.duration % 3600) / 60)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]); // Only reset form when session ID changes (new session loaded)

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const totalImages =
      existingImages.length + selectedImages.length + files.length;

    if (totalImages > 3) {
      alert('Maximum 3 images allowed');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles: File[] = [];
    const previewUrls: string[] = [];

    for (const file of files) {
      // Check if it's HEIC - we'll handle conversion during upload
      const isHeic =
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif');

      if (file.size > maxSize) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        alert(
          `Image "${file.name}" is too large (${sizeMB}MB). Maximum size is 5MB.`
        );
        continue;
      }

      // Allow HEIC files as well as regular images
      if (!file.type.startsWith('image/') && !isHeic) {
        alert(`"${file.name}" is not an image file.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      validFiles.push(file);
      previewUrls.push(previewUrl);
    }

    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);
      setImagePreviewUrls(prev => [...prev, ...previewUrls]);
    }
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      const urlToRevoke = prev[index];
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
      return newUrls;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    // Validate duration
    const hours = parseInt(durationHours) || 0;
    const minutes = parseInt(durationMinutes) || 0;
    const totalDuration = hours * 3600 + minutes * 60;

    if (totalDuration <= 0) {
      alert('Duration must be greater than 0');
      return;
    }

    setIsSaving(true);
    try {
      // Upload new images if any
      let newImageUrls: string[] = [];
      if (selectedImages.length > 0) {
        setIsUploading(true);
        try {
          const uploadResults = await uploadImages(selectedImages);
          newImageUrls = uploadResults.map(result => result.url);
        } catch (err) {
          alert('Failed to upload images. Please try again.');
          setIsSaving(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls];

      // Parse the new start time
      const newStartTime = parseLocalDateTime(
        sessionDate || '',
        startTime || ''
      );

      await onSave(session.id, {
        title,
        description: description || undefined,
        projectId: selectedProjectId || undefined,
        visibility,
        images: allImages.length > 0 ? allImages : undefined,
        startTime: newStartTime,
        duration: totalDuration,
      });

      onClose();
    } catch (err) {
      alert('Failed to save session. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Clean up preview URLs on unmount
  useEffect(() => {
    const urlsToClean = imagePreviewUrls;
    return () => {
      urlsToClean.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  const totalImages = existingImages.length + selectedImages.length;

  const formContent = (
    <>
      {/* Header */}
      {!isPage && (
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Edit Session</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      )}
      {isPage && (
        <div className="px-4 md:px-0 py-4">
          <h2 className="text-2xl font-bold text-gray-900">Edit Session</h2>
        </div>
      )}

      {/* Content */}
      <div className={cn('px-4 md:px-0 space-y-6')}>
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
            placeholder="Enter session title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
            rows={3}
            placeholder="How did the session go? What did you accomplish?"
          />
        </div>

        {/* Date and Time Section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Session Timing
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
                onChange={e => setSessionDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Date of your session</p>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
              <p className="text-xs text-gray-500 mt-1">When you started</p>
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
                  value={durationHours}
                  onChange={e => setDurationHours(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Hours</p>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Minutes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images (Optional, max 3)
            {/* Debug info */}
            <span className="ml-2 text-xs text-gray-400">
              ({existingImages.length} existing, {selectedImages.length} new)
            </span>
          </label>
          <div className="space-y-3">
            {/* Existing & New Image Previews */}
            {(existingImages.length > 0 || imagePreviewUrls.length > 0) && (
              <div className="grid grid-cols-3 gap-2">
                {/* Existing images */}
                {existingImages.map((url, index) => (
                  <div
                    key={`existing-${index}`}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    <Image
                      src={url}
                      alt={`Image ${index + 1}`}
                      width={300}
                      height={300}
                      quality={90}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {/* New images */}
                {imagePreviewUrls.map((url, index) => (
                  <div
                    key={`new-${index}`}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
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
                      onClick={() => handleRemoveNewImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {totalImages < 3 && (
              <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#0066CC] hover:bg-gray-50 transition-colors min-h-[120px]">
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">
                  {totalImages === 0
                    ? 'Add images'
                    : `Add ${3 - totalImages} more`}
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

        {/* Project Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project
          </label>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] bg-white text-sm appearance-none"
          >
            <option value="">Unassigned</option>
            {projects?.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
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
            className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] bg-white appearance-none"
          >
            <option value="everyone">Everyone</option>
            <option value="followers">Followers</option>
            <option value="private">Only You</option>
          </select>
        </div>
      </div>

      {/* Footer */}
      <div
        className={cn(
          'flex gap-3',
          isPage
            ? 'px-4 md:px-0 py-6'
            : 'sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4'
        )}
      >
        <button
          onClick={onClose}
          disabled={isSaving || isUploading}
          className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!title.trim() || isSaving || isUploading}
          className="flex-1 px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0051D5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading
            ? 'Uploading Images...'
            : isSaving
              ? 'Saving...'
              : 'Save Changes'}
        </button>
      </div>
    </>
  );

  if (isPage) {
    return <>{formContent}</>;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {formContent}
      </div>
    </div>
  );
};
