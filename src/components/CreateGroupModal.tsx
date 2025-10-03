'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CreateGroupData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
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
  isLoading = false 
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Group</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
