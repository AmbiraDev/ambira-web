'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/HeaderComponent';
import { ImageUpload } from '@/components/ImageUpload';
import { Group, UpdateGroupData } from '@/types';
import { firebaseApi } from '@/lib/api';
import { uploadImage } from '@/lib/imageUpload';

export default function GroupSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupId = params.id as string;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    category: 'other' as
      | 'work'
      | 'study'
      | 'side-project'
      | 'learning'
      | 'other',
    type: 'other' as 'just-for-fun' | 'professional' | 'competitive' | 'other',
    privacySetting: 'public' as 'public' | 'approval-required',
    imageUrl: '',
  });

  // Image upload state
  const [groupImages, setGroupImages] = useState<File[]>([]);
  const [groupImagePreviews, setGroupImagePreviews] = useState<string[]>([]);

  const loadGroup = useCallback(async () => {
    try {
      setIsLoading(true);
      const groupData = await firebaseApi.group.getGroup(groupId);

      if (!groupData) {
        router.push('/groups');
        return;
      }

      // Check if user is admin
      if (!groupData.adminUserIds.includes(user!.id)) {
        router.push(`/groups/${groupId}`);
        return;
      }

      setGroup(groupData);
      setFormData({
        name: groupData.name,
        description: groupData.description,
        location: groupData.location || '',
        category: groupData.category,
        type: groupData.type,
        privacySetting: groupData.privacySetting,
        imageUrl: groupData.imageUrl || '',
      });

      // Set existing image as preview if it exists
      if (groupData.imageUrl) {
        setGroupImagePreviews([groupData.imageUrl]);
      }
    } catch {
      console.error('Error loading group');
      setError('Failed to load group');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, user, router]);

  useEffect(() => {
    if (groupId && user) {
      loadGroup();
    }
  }, [groupId, user, loadGroup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!group || !user) return;

    setIsSaving(true);
    setError(null);

    try {
      // Upload new group image if provided
      let imageUrl = formData.imageUrl;
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
          setIsSaving(false);
          return;
        }
      }

      const updateData: UpdateGroupData = {
        name: formData.name,
        description: formData.description,
        location: formData.location || undefined,
        category: formData.category,
        type: formData.type,
        privacySetting: formData.privacySetting,
        imageUrl: imageUrl || undefined,
      };

      await firebaseApi.group.updateGroup(groupId, updateData);
      router.push(`/groups/${groupId}`);
    } catch (_error) {
      console.error('Error updating group:', error);
      setError('Failed to update group. Please try again.');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/groups/${groupId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in
          </h1>
          <p className="text-gray-600">
            You need to be logged in to edit groups.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Group not found
            </h1>
            <button
              onClick={() => router.push('/groups')}
              className="bg-[#007AFF] text-white px-4 py-2 rounded-lg hover:bg-[#0051D5]"
            >
              Back to Groups
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Group</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg border border-gray-200 p-8"
        >
          {/* Image Upload */}
          <div className="mb-8">
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
                // Clear the imageUrl from formData when user uploads a new image
                if (images.length > 0) {
                  setFormData({ ...formData, imageUrl: '' });
                }
              }}
              placeholder="Upload group picture"
              disabled={isSaving}
            />
            <p className="text-xs text-gray-500 mt-2">
              Recommended size: 248×248 px (max 5MB)
            </p>
          </div>

          <p className="text-sm text-gray-600 mb-6 italic">
            Fields marked with * are required
          </p>

          {/* Group Name */}
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Group Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
              placeholder="Enter group name"
            />
          </div>

          {/* Location */}
          <div className="mb-6">
            <label
              htmlFor="location"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Location
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={e =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
              placeholder="Enter location"
            />
          </div>

          {/* Category */}
          <div className="mb-6">
            <label
              htmlFor="category"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={e =>
                setFormData({
                  ...formData,
                  category: e.target.value as
                    | 'work'
                    | 'study'
                    | 'side-project'
                    | 'learning'
                    | 'other',
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent bg-white"
            >
              <option value="work">Work</option>
              <option value="study">Study</option>
              <option value="side-project">Side Project</option>
              <option value="learning">Learning</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Type */}
          <div className="mb-6">
            <label
              htmlFor="type"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Group Type
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={e =>
                setFormData({
                  ...formData,
                  type: e.target.value as
                    | 'just-for-fun'
                    | 'professional'
                    | 'competitive'
                    | 'other',
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent bg-white"
            >
              <option value="just-for-fun">Just For Fun</option>
              <option value="professional">Professional</option>
              <option value="competitive">Competitive</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div className="mb-8">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Description *
            </label>
            <textarea
              id="description"
              required
              value={formData.description}
              onChange={e => {
                // Limit to 4 lines (3 newlines)
                const newlineCount = (e.target.value.match(/\n/g) || []).length;
                if (newlineCount <= 3) {
                  setFormData({ ...formData, description: e.target.value });
                }
              }}
              rows={4}
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent resize-none"
              placeholder="Describe your group"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#FC4C02] text-white font-medium rounded-md hover:bg-[#FC4C02]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-6 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
