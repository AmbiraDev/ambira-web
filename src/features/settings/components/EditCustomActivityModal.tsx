/**
 * Edit Custom Activity Modal
 *
 * Allows users to edit an existing custom activity type with:
 * - Name (required, max 50 chars)
 * - Icon (emoji picker, required)
 * - Color (color picker, required)
 * - Description (optional, max 200 chars)
 *
 * Validates:
 * - No duplicate names (excluding current activity)
 * - Required fields
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useUpdateCustomActivity } from '@/hooks/useActivityTypes';
import { Button } from '@/components/ui/button';
import { ActivityType } from '@/types';

interface EditCustomActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  activity: ActivityType | null;
  existingNames?: string[]; // For duplicate validation
}

export const EditCustomActivityModal: React.FC<
  EditCustomActivityModalProps
> = ({ isOpen, onClose, onSuccess, activity, existingNames = [] }) => {
  const updateMutation = useUpdateCustomActivity();

  const [formData, setFormData] = useState({
    name: '',
    icon: '🎯',
    color: '#0066CC',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when activity changes
  useEffect(() => {
    if (isOpen && activity) {
      setFormData({
        name: activity.name,
        icon: activity.icon,
        color: activity.defaultColor,
        description: activity.description || '',
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, activity]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, isSubmitting]);

  // Preset emoji icons
  const availableIcons = [
    '🎯',
    '🎸',
    '🎮',
    '🎨',
    '🎭',
    '🎪',
    '🎬',
    '🎤',
    '🎧',
    '🎹',
    '📸',
    '🎥',
    '✏️',
    '📐',
    '🔨',
    '🔧',
    '⚙️',
    '🧰',
    '🔬',
    '🧪',
    '🧬',
    '💊',
    '🧘',
    '🏋️',
    '🚴',
    '⛷️',
    '🏊',
    '⚽',
    '🏀',
    '🎾',
    '🏐',
    '🏓',
    '🎱',
    '🎳',
    '🎿',
    '🛹',
    '🏹',
    '🎣',
    '🧗',
    '🤿',
    '🏄',
  ];

  // Preset colors
  const availableColors = [
    { name: 'Electric Blue', hex: '#0066CC' },
    { name: 'Orange', hex: '#FC4C02' },
    { name: 'Green', hex: '#34C759' },
    { name: 'Purple', hex: '#A855F7' },
    { name: 'Red', hex: '#EF4444' },
    { name: 'Yellow', hex: '#EAB308' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Indigo', hex: '#6366F1' },
    { name: 'Teal', hex: '#14B8A6' },
    { name: 'Lime', hex: '#84CC16' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Activity name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Activity name must be less than 50 characters';
    } else if (
      activity &&
      formData.name.toLowerCase().trim() !==
        activity.name.toLowerCase().trim() &&
      existingNames
        .map(n => n.toLowerCase().trim())
        .includes(formData.name.toLowerCase().trim())
    ) {
      newErrors.name = 'An activity with this name already exists';
    }

    // Icon validation
    if (!formData.icon) {
      newErrors.icon = 'Please select an icon';
    }

    // Color validation
    if (!formData.color) {
      newErrors.color = 'Please select a color';
    }

    // Description validation (optional but has max length)
    if (formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activity || !validateForm()) return;

    setIsSubmitting(true);

    try {
      await updateMutation.mutateAsync({
        typeId: activity.id,
        data: {
          name: formData.name.trim(),
          icon: formData.icon,
          defaultColor: formData.color,
          description: formData.description.trim() || undefined,
        },
      });

      // Success
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handling
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update custom activity';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !activity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Custom Activity
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name Field */}
          <div>
            <label
              htmlFor="activity-name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Activity Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="activity-name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] disabled:opacity-50 disabled:bg-gray-50 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Guitar Practice"
              maxLength={50}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.name.length}/50 characters
            </p>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-10 gap-2">
              {availableIcons.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  disabled={isSubmitting}
                  className={`h-10 w-10 flex items-center justify-center text-xl rounded-lg border-2 transition-all disabled:opacity-50 ${
                    formData.icon === icon
                      ? 'border-[#0066CC] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-label={`Select ${icon} icon`}
                >
                  {icon}
                </button>
              ))}
            </div>
            {errors.icon && (
              <p className="mt-1 text-sm text-red-500">{errors.icon}</p>
            )}
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {availableColors.map(color => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.hex })}
                  disabled={isSubmitting}
                  className={`h-10 rounded-lg border-2 transition-all disabled:opacity-50 ${
                    formData.color === color.hex
                      ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  aria-label={`Select ${color.name} color`}
                  title={color.name}
                />
              ))}
            </div>
            {errors.color && (
              <p className="mt-1 text-sm text-red-500">{errors.color}</p>
            )}
          </div>

          {/* Description Field (Optional) */}
          <div>
            <label
              htmlFor="activity-description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description (Optional)
            </label>
            <textarea
              id="activity-description"
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] disabled:opacity-50 disabled:bg-gray-50 resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Brief description of this activity..."
              rows={3}
              maxLength={200}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-2">Preview:</p>
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: formData.color }}
              >
                {formData.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {formData.name || 'Activity Name'}
                </p>
                {formData.description && (
                  <p className="text-sm text-gray-500 truncate">
                    {formData.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
