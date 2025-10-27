'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { ImageIcon, X, AlertCircle, Loader2 } from 'lucide-react';

interface DeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const DeleteConfirm: React.FC<DeleteConfirmProps> = ({
  isOpen,
  onClose,
  onDelete,
}) => {
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
          onClick={e => e.stopPropagation()}
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

interface ImageUploadProps {
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Maximum file size in MB */
  maxSizeMB?: number;
  /** Accepted file types (e.g., ['image/jpeg', 'image/png']) */
  acceptedTypes?: string[];
  /** Show accepted types hint */
  showTypeHint?: boolean;
  /** Current images (for controlled component) */
  images?: File[];
  /** Preview URLs (for controlled component) */
  previewUrls?: string[];
  /** Callback when images change */
  onImagesChange?: (images: File[], previewUrls: string[]) => void;
  /** Upload mode: 'instant' uploads immediately, 'deferred' waits for form submission */
  uploadMode?: 'instant' | 'deferred';
  /** Upload function for instant mode */
  onUpload?: (files: File[]) => Promise<string[]>;
  /** Label text */
  label?: string;
  /** Show upload progress */
  showProgress?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Show as single image picker (for profile pictures) */
  singleImage?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  maxImages = 3,
  maxSizeMB = 5,
  acceptedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
  ],
  showTypeHint = true,
  images = [],
  previewUrls = [],
  onImagesChange,
  uploadMode = 'deferred',
  onUpload,
  label,
  showProgress = true,
  placeholder,
  disabled = false,
  singleImage = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [actionSheetIndex, setActionSheetIndex] = useState<number | null>(null);

  const maxSize = maxSizeMB * 1024 * 1024;
  const effectiveMaxImages = singleImage ? 1 : maxImages;

  const formatFileTypes = () => {
    const types = acceptedTypes.map(type => {
      const ext = type.split('/')[1]?.toUpperCase();
      if (ext === 'JPEG') return 'JPG';
      return ext;
    });
    return types.join(', ');
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxSize) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      return {
        valid: false,
        error: `"${file.name}" is too large (${sizeMB}MB). Maximum size is ${maxSizeMB}MB.`,
      };
    }

    // Check file type
    const isHeic =
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif');

    if (
      !acceptedTypes.includes(file.type) &&
      !isHeic &&
      !file.type.startsWith('image/')
    ) {
      return {
        valid: false,
        error: `"${file.name}" is not a supported file type. Please use ${formatFileTypes()}.`,
      };
    }

    return { valid: true };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError('');

    if (files.length + images.length > effectiveMaxImages) {
      setError(
        `Maximum ${effectiveMaxImages} ${effectiveMaxImages === 1 ? 'image' : 'images'} allowed`
      );
      return;
    }

    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    // Validate each file
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        continue;
      }

      validFiles.push(file);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      newPreviewUrls.push(previewUrl);
    }

    if (validFiles.length === 0) {
      return;
    }

    // Handle instant upload mode
    if (uploadMode === 'instant' && onUpload) {
      try {
        setIsUploading(true);
        setUploadProgress(0);

        // Simulate progress (you can replace with actual upload progress)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const uploadedUrls = await onUpload(validFiles);

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Call onChange with uploaded URLs (you might want to handle this differently)
        onImagesChange?.(
          [...images, ...validFiles],
          [...previewUrls, ...uploadedUrls]
        );

        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to upload images');
        setIsUploading(false);
        setUploadProgress(0);
        // Clean up preview URLs on error
        newPreviewUrls.forEach(url => URL.revokeObjectURL(url));
      }
    } else {
      // Deferred mode - just store files and previews
      onImagesChange?.(
        [...images, ...validFiles],
        [...previewUrls, ...newPreviewUrls]
      );
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => {
      if (i === index) {
        // Revoke object URL to free memory
        const url = previewUrls[i];
        if (url) {
          URL.revokeObjectURL(url);
        }
        return false;
      }
      return true;
    });

    onImagesChange?.(newImages, newPreviewUrls);
    setError('');
  };

  const getPlaceholderText = () => {
    if (placeholder) return placeholder;
    if (singleImage) return 'Upload profile picture';
    if (previewUrls.length === 0) return 'Add images';
    return `Add ${effectiveMaxImages - previewUrls.length} more`;
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Image Previews */}
      {previewUrls.length > 0 && (
        <div
          className={`grid gap-2 ${singleImage ? 'grid-cols-1' : 'grid-cols-3'}`}
        >
          {previewUrls.map((url, index) => (
            <div
              key={index}
              className={`relative rounded-lg overflow-hidden bg-gray-100 ${
                singleImage ? 'aspect-square max-w-[200px]' : 'aspect-square'
              }`}
            >
              <Image
                src={url}
                alt={`Preview ${index + 1}`}
                width={300}
                height={300}
                quality={90}
                className="w-full h-full object-cover"
                unoptimized
                onClick={() => !disabled && setActionSheetIndex(index)}
              />
              {!disabled && (
                <>
                  {/* Desktop X button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="hidden md:block absolute top-1 right-1 p-0.5 text-white hover:text-red-500 transition-colors"
                    aria-label="Remove image"
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.9))',
                    }}
                  >
                    <X className="w-5 h-5" strokeWidth={3} />
                  </button>

                  {/* Mobile tap indicator */}
                  <div className="md:hidden absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="opacity-0 hover:opacity-100 transition-opacity">
                      <div className="bg-black/20 rounded-full p-2">
                        <X className="w-6 h-6 text-white" strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                </>
              )}
              {/* File size indicator */}
              {images[index] && (
                <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                  {(images[index].size / 1024 / 1024).toFixed(1)}MB
                </div>
              )}
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

      {/* Upload Progress */}
      {isUploading && showProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {previewUrls.length < effectiveMaxImages && !disabled && (
        <label
          className={`flex flex-col items-center justify-center gap-2 px-8 py-8 border-[3px] border-dashed rounded-lg cursor-pointer transition-colors max-w-[240px] ${
            isUploading
              ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
              : 'border-[#007AFF] hover:border-[#0051D5] hover:bg-gray-50'
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-sm font-medium text-blue-600">
                Uploading...
              </span>
            </>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-[#007AFF]" />
              <span className="text-sm font-medium text-[#007AFF]">
                {getPlaceholderText()}
              </span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',') + ',.heic,.heif'}
            multiple={!singleImage}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
        </label>
      )}

      {/* Helper text for max images */}
      {!singleImage &&
        previewUrls.length > 0 &&
        previewUrls.length < effectiveMaxImages && (
          <p className="text-xs text-gray-500 text-center">
            {previewUrls.length} of {effectiveMaxImages} images selected
          </p>
        )}
    </div>
  );
};
