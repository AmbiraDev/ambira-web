'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import { ImageUpload } from '@/components/ImageUpload';
import { CreateGroupData } from '@/types';
import { firebaseApi } from '@/lib/api';
import { uploadImage } from '@/lib/imageUpload';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const categoryOptions = [
  { value: 'work', label: 'Work' },
  { value: 'study', label: 'Study' },
  { value: 'side-project', label: 'Side Project' },
  { value: 'learning', label: 'Learning' },
  { value: 'other', label: 'Other' },
];

const typeOptions = [
  { value: 'just-for-fun', label: 'Just for Fun' },
  { value: 'professional', label: 'Professional' },
  { value: 'competitive', label: 'Competitive' },
  { value: 'other', label: 'Other' },
];

export default function CreateGroupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateGroupData>({
    name: '',
    description: '',
    location: '',
    category: 'work',
    type: 'just-for-fun',
    privacySetting: 'public', // Always public
  });

  // Image upload state
  const [groupImages, setGroupImages] = useState<File[]>([]);
  const [groupImagePreviews, setGroupImagePreviews] = useState<string[]>([]);

  const handleChange = (field: keyof CreateGroupData, value: string) => {
    // For description, limit to 4 lines (3 newlines)
    if (field === 'description') {
      const newlineCount = (value.match(/\n/g) || []).length;
      if (newlineCount > 3) {
        return; // Don't update if more than 3 newlines
      }
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear error when user makes changes
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Group name is required';
    }
    if (formData.name.length < 3) {
      return 'Group name must be at least 3 characters';
    }
    if (formData.name.length > 60) {
      return 'Group name must be less than 60 characters';
    }
    if (!formData.description.trim()) {
      return 'Description is required';
    }
    if (formData.description.length < 10) {
      return 'Description must be at least 10 characters';
    }
    if (formData.description.length > 200) {
      return 'Description must be less than 200 characters';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to create a group');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Upload group image if provided
      let imageUrl: string | undefined;
      if (groupImages.length > 0) {
        try {
          const imageFile = groupImages[0];
          if (imageFile !== undefined) {
            const result = await uploadImage(imageFile, 'group-images');
            imageUrl = result.url;
          }
        } catch (uploadError) {
          console.error('Error uploading group image:', uploadError);
          setError(
            uploadError instanceof Error
              ? uploadError.message
              : 'Failed to upload group image'
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Create group data with image URL
      const groupDataWithImage: CreateGroupData = {
        ...formData,
        imageUrl,
      };

      const newGroup = await firebaseApi.group.createGroup(
        groupDataWithImage,
        user.id
      );

      // Navigate to the new group page
      router.push(`/groups/${newGroup.id}`);
    } catch (_error) {
      console.error('Error creating group:', _error);
      setError(
        _error instanceof Error
          ? _error.message
          : 'Failed to create group. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in
          </h1>
          <p className="text-gray-600">
            You need to be logged in to create a group.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden md:block">
        <Header />
      </div>
      <MobileHeader title="Create Group" />

      <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {/* Back button */}
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Group
          </h1>
          <p className="text-sm text-gray-600">
            Fields marked with <span className="text-red-500">*</span> are
            required
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group Picture */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Group Picture
            </label>
            <ImageUpload
              singleImage={true}
              maxSizeMB={5}
              images={groupImages}
              previewUrls={groupImagePreviews}
              onImagesChange={(images, previews) => {
                setGroupImages(images);
                setGroupImagePreviews(previews);
              }}
              placeholder="Upload group picture"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional - Add a picture to represent your group
            </p>
          </div>

          {/* Group Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g., Morning Productivity Club"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] bg-white transition-colors"
              maxLength={60}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.name.length}/60 characters
            </p>
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Location
            </label>
            <input
              type="text"
              id="location"
              value={formData.location || ''}
              onChange={e => handleChange('location', e.target.value)}
              placeholder="e.g., San Francisco, CA"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] bg-white transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={e => handleChange('category', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] bg-white transition-colors"
              disabled={isSubmitting}
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Group Type */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Group Type
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={e => handleChange('type', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] bg-white transition-colors"
              disabled={isSubmitting}
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Tell people what your group is about..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] bg-white transition-colors resize-none"
              maxLength={200}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-[#0066CC] text-white text-sm font-semibold rounded-lg hover:bg-[#0051D5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Group...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      <BottomNavigation />
    </div>
  );
}
