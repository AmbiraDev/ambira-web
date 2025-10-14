'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Session } from '@/types';
import { X, XCircle, Image as ImageIcon } from 'lucide-react';
import { uploadImages } from '@/lib/imageUpload';
import { useProjects } from '@/contexts/ProjectsContext';

interface EditSessionModalProps {
  session: Session;
  onClose: () => void;
  onSave: (sessionId: string, data: {
    title: string;
    description?: string;
    projectId?: string;
    tags?: string[];
    visibility?: 'everyone' | 'followers' | 'private';
    images?: string[];
  }) => Promise<void>;
  isPage?: boolean;
}


export const EditSessionModal: React.FC<EditSessionModalProps> = ({
  session,
  onClose,
  onSave,
  isPage = false
}) => {
  const { projects } = useProjects();

  const [title, setTitle] = useState(session.title || '');
  const [description, setDescription] = useState(session.description || '');
  const [selectedProjectId, setSelectedProjectId] = useState(session.projectId || '');
  const [visibility, setVisibility] = useState<'everyone' | 'followers' | 'private'>(
    session.visibility || 'everyone'
  );
  const [existingImages, setExistingImages] = useState<string[]>(session.images || []);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update state when session prop changes (important for modal reuse)
  useEffect(() => {
    console.log('📝 EditSessionModal session changed:', {
      id: session.id,
      title: session.title,
      images: session.images,
      imageCount: session.images?.length || 0
    });

    setTitle(session.title || '');
    setDescription(session.description || '');
    setSelectedProjectId(session.projectId || '');
    setVisibility(session.visibility || 'everyone');
    setExistingImages(session.images || []);
    setSelectedImages([]);
    setImagePreviewUrls([]);
  }, [session.id]);

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
    console.log('📸 Files selected in edit modal:', files.length);

    const totalImages = existingImages.length + selectedImages.length + files.length;

    if (totalImages > 3) {
      alert('Maximum 3 images allowed');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles: File[] = [];
    const previewUrls: string[] = [];

    for (const file of files) {
      console.log('📸 Processing:', file.name, file.type, `${(file.size / 1024 / 1024).toFixed(2)}MB`);

      // Check if it's HEIC - we'll handle conversion during upload
      const isHeic = file.type === 'image/heic' ||
                     file.type === 'image/heif' ||
                     file.name.toLowerCase().endsWith('.heic') ||
                     file.name.toLowerCase().endsWith('.heif');

      if (file.size > maxSize) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        alert(`Image "${file.name}" is too large (${sizeMB}MB). Maximum size is 5MB.`);
        continue;
      }

      // Allow HEIC files as well as regular images
      if (!file.type.startsWith('image/') && !isHeic) {
        alert(`"${file.name}" is not an image file.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      console.log('✅ Added preview for:', file.name);
      validFiles.push(file);
      previewUrls.push(previewUrl);
    }

    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);
      setImagePreviewUrls(prev => [...prev, ...previewUrls]);
      console.log('✅ Total images after adding:', existingImages.length + selectedImages.length + validFiles.length);
    }
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]);
      return newUrls;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
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
        } catch (error) {
          console.error('Failed to upload images:', error);
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

      await onSave(session.id, {
        title,
        description: description || undefined,
        projectId: selectedProjectId || undefined,
        visibility,
        images: allImages.length > 0 ? allImages : undefined,
      });

      onClose();
    } catch (error) {
      console.error('Failed to save session:', error);
      alert('Failed to save session. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

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
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
      {isPage && (
        <div className="px-4 md:px-0 py-4">
          <h2 className="text-2xl font-bold text-gray-900">Edit Session</h2>
        </div>
      )}

        {/* Content */}
        <div className={`${isPage ? '' : ''} px-4 md:px-0 space-y-6`}>
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF]"
              rows={3}
              placeholder="How did the session go? What did you accomplish?"
            />
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
                    <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
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
                      >
                        <X className="w-4 h-4 flex-shrink-0" />
                      </button>
                    </div>
                  ))}
                  {/* New images */}
                  {imagePreviewUrls.map((url, index) => (
                    <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
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
                      >
                        <X className="w-4 h-4 flex-shrink-0" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {totalImages < 3 && (
                <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#007AFF] hover:bg-gray-50 transition-colors min-h-[120px]">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">
                    {totalImages === 0 ? 'Add images' : `Add ${3 - totalImages} more`}
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
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white text-sm appearance-none"
            >
              <option value="">Unassigned</option>
              {projects?.map((project) => (
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
              onChange={(e) => setVisibility(e.target.value as any)}
              className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white appearance-none"
            >
              <option value="everyone">Everyone</option>
              <option value="followers">Followers</option>
              <option value="private">Only You</option>
            </select>
          </div>
        </div>

      {/* Footer */}
      <div className={`${isPage ? 'px-4 md:px-0 py-6' : 'sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4'} flex gap-3`}>
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
          className="flex-1 px-4 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#0056D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading Images...' : isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </>
  );

  if (isPage) {
    return (
      <>
        {formContent}
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {formContent}
      </div>
    </div>
  );
};
