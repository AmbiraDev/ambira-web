'use client';

import React, { useState } from 'react';
import { CreateProjectData } from '@/types';
import { useProjects } from '@/contexts/ProjectsContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createProject } = useProjects();
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    icon: '💻',
    color: 'orange',
    weeklyTarget: undefined,
    totalTarget: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateProjectData>>({});

  // Preset icons
  const availableIcons = [
    '💻', '⚛️', '💪', '📚', '🎨', '🏃', '🎵', '🔬', '📝', '🚀'
  ];

  // Preset colors
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

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateProjectData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Project name must be less than 50 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    } else if (formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    if (formData.weeklyTarget && (formData.weeklyTarget < 0 || formData.weeklyTarget > 168)) {
      newErrors.weeklyTarget = 'Weekly target must be between 0 and 168 hours';
    }

    if (formData.totalTarget && (formData.totalTarget < 0 || formData.totalTarget > 10000)) {
      newErrors.totalTarget = 'Total target must be between 0 and 10,000 hours';
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
      setIsSubmitting(true);
      const project = await createProject({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        weeklyTarget: formData.weeklyTarget || undefined,
        totalTarget: formData.totalTarget || undefined,
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        icon: '💻',
        color: 'orange',
        weeklyTarget: undefined,
        totalTarget: undefined,
      });
      setErrors({});

      onSuccess?.(project.id);
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
      setErrors({ name: 'Failed to create project. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateProjectData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center z-40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Project Preview */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="text-center">
                <div className={`w-20 h-20 ${availableColors.find(c => c.name === formData.color)?.class || 'bg-orange-500'} rounded-lg flex items-center justify-center text-white text-3xl mx-auto mb-4`}>
                  {formData.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {formData.name || 'Project Name'}
                </h3>
                <p className="text-sm text-gray-600">
                  {formData.description || 'Project description'}
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter project name"
                maxLength={50}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your project"
                rows={3}
                maxLength={200}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.description.length}/200 characters
              </p>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {availableIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleInputChange('icon', icon)}
                    className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xl transition-colors ${
                      formData.icon === icon
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleInputChange('color', color.name)}
                    className={`w-12 h-12 rounded-lg border-2 transition-colors ${
                      formData.color === color.name
                        ? 'border-gray-900 scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {formData.color === color.name && (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Targets */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="weeklyTarget" className="block text-sm font-medium text-gray-700 mb-2">
                  Weekly Target (hours)
                </label>
                <input
                  type="number"
                  id="weeklyTarget"
                  value={formData.weeklyTarget || ''}
                  onChange={(e) => handleInputChange('weeklyTarget', e.target.value ? Number(e.target.value) : undefined)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.weeklyTarget ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                  max="168"
                  step="0.5"
                />
                {errors.weeklyTarget && (
                  <p className="mt-1 text-sm text-red-600">{errors.weeklyTarget}</p>
                )}
              </div>

              <div>
                <label htmlFor="totalTarget" className="block text-sm font-medium text-gray-700 mb-2">
                  Total Target (hours)
                </label>
                <input
                  type="number"
                  id="totalTarget"
                  value={formData.totalTarget || ''}
                  onChange={(e) => handleInputChange('totalTarget', e.target.value ? Number(e.target.value) : undefined)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.totalTarget ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                  max="10000"
                  step="1"
                />
                {errors.totalTarget && (
                  <p className="mt-1 text-sm text-red-600">{errors.totalTarget}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
