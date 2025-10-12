'use client';

import React, { useState } from 'react';
import { CreateGroupData } from '@/types';
import { Globe, Lock } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGroupData) => Promise<void>;
  isLoading?: boolean;
  isFullPage?: boolean; // New prop to control full-page vs modal rendering
}

// Preset icons (same as CreateProjectModal)
const availableIcons = [
  '💻', '⚛️', '💪', '📚', '🎨', '🏃', '🎵', '🔬', '📝', '🚀'
];

// Preset colors (same as CreateProjectModal)
const availableColors = [
  { name: 'orange', class: 'bg-orange-500', hex: '#f97316' },
  { name: 'blue', class: 'bg-blue-500', hex: '#3b82f6' },
  { name: 'green', class: 'bg-green-500', hex: '#22c55e' },
  { name: 'purple', class: 'bg-purple-500', hex: '#a855f7' },
  { name: 'red', class: 'bg-red-500', hex: '#ef4444' },
  { name: 'yellow', class: 'bg-yellow-500', hex: '#eab308' },
  { name: 'pink', class: 'bg-pink-500', hex: '#ec4899' },
  { name: 'indigo', class: 'bg-indigo-500', hex: '#6366f1' },
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
    icon: '💻',
    color: 'orange',
    category: 'other',
    type: 'just-for-fun',
    privacySetting: 'public',
    location: '',
    imageUrl: '',
    bannerUrl: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle ESC key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isLoading, onClose]);

  const handleInputChange = (field: keyof CreateGroupData, value: any) => {
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
        icon: '💻',
        color: 'orange',
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

  if (!isOpen) return null;

  // Shared form content
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Preview */}
            <div className="flex flex-col items-center pb-6 border-b border-gray-200">
              <div className={`w-24 h-24 ${availableColors.find(c => c.name === formData.color)?.class || 'bg-orange-500'} rounded-xl flex items-center justify-center text-white text-4xl mb-3 shadow-md`}>
                {formData.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {formData.name || 'Group Name'}
              </h3>
              <p className="text-sm text-gray-500 mt-1 text-center max-w-md">
                {formData.description || 'Group description'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition-colors ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter group name"
                  maxLength={50}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  autoFocus
                />
                {errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] resize-none transition-colors ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe what this group is about"
                  rows={3}
                  maxLength={500}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.description.length}/500 characters
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Icon Picker */}
              <div>
                <label id="icon-picker-label" className="block text-sm font-semibold text-gray-900 mb-3">
                  Icon
                </label>
                <div className="grid grid-cols-5 gap-3" role="radiogroup" aria-labelledby="icon-picker-label">
                  {availableIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      role="radio"
                      aria-checked={formData.icon === icon}
                      onClick={() => handleInputChange('icon', icon)}
                      className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl transition-all ${
                        formData.icon === icon
                          ? 'border-[#007AFF] bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      aria-label={`Select ${icon} icon`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label id="color-picker-label" className="block text-sm font-semibold text-gray-900 mb-3">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-3" role="radiogroup" aria-labelledby="color-picker-label">
                  {availableColors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      role="radio"
                      aria-checked={formData.color === color.name}
                      onClick={() => handleInputChange('color', color.name)}
                      className={`w-14 h-14 rounded-lg border-2 transition-all ${
                        formData.color === color.name
                          ? 'border-gray-800 scale-110 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={`Select ${color.name} color`}
                    >
                      {formData.color === color.name && (
                        <svg className="w-6 h-6 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Privacy Setting */}
            <div className="pt-6 border-t border-gray-200">
              <label id="privacy-label" className="block text-sm font-semibold text-gray-900 mb-3">
                Privacy Setting *
              </label>
              <div className="space-y-3" role="radiogroup" aria-labelledby="privacy-label">
                <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.privacySetting === 'public'
                    ? 'border-[#007AFF] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="privacySetting"
                    value="public"
                    checked={formData.privacySetting === 'public'}
                    onChange={(e) => handleInputChange('privacySetting', e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-900">Public</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Anyone can join instantly</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.privacySetting === 'approval-required'
                    ? 'border-[#007AFF] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="privacySetting"
                    value="approval-required"
                    checked={formData.privacySetting === 'approval-required'}
                    onChange={(e) => handleInputChange('privacySetting', e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold text-gray-900">Approval Required</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Admins must approve new members</p>
                  </div>
                </label>
              </div>
            </div>

      {/* Actions */}
      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0056D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
        >
          {isLoading ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </form>
  );

  // Full-page view (rendered inline within the page)
  if (isFullPage) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Create New Group</h2>
            {formContent}
          </div>
        </div>
      </div>
    );
  }

  // Modal view (popup style)
  return (
    <div
      className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center z-40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-group-title"
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h2 id="create-group-title" className="text-xl sm:text-2xl font-bold text-gray-900">Create New Group</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              aria-label="Close dialog"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {formContent}
        </div>
      </div>
    </div>
  );
}
