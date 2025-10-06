'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CreateGroupData } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  X,
  Upload,
  Globe,
  Lock,
  MapPin,
  Image as ImageIcon
} from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGroupData) => Promise<void>;
  isLoading?: boolean;
  isFullPage?: boolean; // New prop to control full-page vs modal rendering
}

const categoryOptions = [
  { value: 'work', label: 'Work' },
  { value: 'study', label: 'Study' },
  { value: 'side-project', label: 'Side Project' },
  { value: 'learning', label: 'Learning' },
  { value: 'other', label: 'Other' }
];

const typeOptions = [
  { value: 'just-for-fun', label: 'Just for Fun' },
  { value: 'professional', label: 'Professional' },
  { value: 'competitive', label: 'Competitive' },
  { value: 'other', label: 'Other' }
];

const privacyOptions = [
  { value: 'public', label: 'Public', description: 'Anyone can join instantly' },
  { value: 'approval-required', label: 'Approval Required', description: 'Admins must approve new members' }
];

export default function CreateGroupModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  isFullPage = false
}: CreateGroupModalProps) {
  const [formData, setFormData] = useState<CreateGroupData>({
    name: '',
    description: '',
    category: 'other',
    type: 'just-for-fun',
    privacySetting: 'public',
    location: '',
    imageUrl: '',
    bannerUrl: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CreateGroupData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Group name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Group name must be less than 50 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Group description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (formData.location && formData.location.length > 100) {
      newErrors.location = 'Location must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        name: '',
        description: '',
        category: 'other',
        type: 'just-for-fun',
        privacySetting: 'public',
        location: '',
        imageUrl: '',
        bannerUrl: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleImageUpload = (type: 'imageUrl' | 'bannerUrl', file: File) => {
    // In a real implementation, you would upload the file to a storage service
    // and get the URL back. For now, we'll just create a local URL.
    const url = URL.createObjectURL(file);
    handleInputChange(type, url);
  };

  if (!isOpen) return null;

  // Full-page view (rendered inline within the page)
  if (isFullPage) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">Create New Group</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {renderFormContent()}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-[#007AFF] text-white rounded-lg hover:bg-[#0056D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Modal view (original popup style)
  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Create New Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {renderFormContent()}

          {/* Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#0056D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Extracted form content to avoid duplication
  function renderFormContent() {
    return (
      <>
          {/* Group Name */}
          <div>
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter group name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this group is about..."
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            <div className="flex justify-between mt-1">
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
              <p className="text-sm text-gray-500 ml-auto">
                {formData.description.length}/500
              </p>
            </div>
          </div>

          {/* Category and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white text-sm appearance-none"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] bg-white text-sm appearance-none"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Privacy Setting */}
          <div>
            <Label htmlFor="privacySetting">Privacy Setting *</Label>
            <div className="space-y-2">
              {privacyOptions.map((option) => (
                <label key={option.value} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="privacySetting"
                    value={option.value}
                    checked={formData.privacySetting === option.value}
                    onChange={(e) => handleInputChange('privacySetting', e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {option.value === 'public' ? (
                        <Globe className="w-4 h-4 text-green-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-orange-600" />
                      )}
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location (Optional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, Country"
                className="pl-10"
              />
            </div>
            {errors.location && (
              <p className="text-sm text-red-600 mt-1">{errors.location}</p>
            )}
          </div>

          {/* Group Image */}
          <div>
            <Label>Group Image (Optional)</Label>
            <div className="mt-2">
              {formData.imageUrl ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <Image
                    src={formData.imageUrl}
                    alt="Group preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleInputChange('imageUrl', '')}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload('imageUrl', file);
                    }}
                    className="hidden"
                  />
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </label>
              )}
            </div>
          </div>
      </>
    );
  }
}
