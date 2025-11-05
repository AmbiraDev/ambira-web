/**
 * Create Custom Activity Modal
 *
 * Allows users to create a new custom activity type with:
 * - Name (required, max 50 chars)
 * - Icon (emoji picker, required)
 * - Color (color picker, required)
 * - Description (optional, max 200 chars)
 *
 * Validates:
 * - No duplicate names
 * - Required fields
 * - Max 10 custom activities limit (enforced at API level)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateCustomActivity } from '@/hooks/useActivityTypes';
import { IconRenderer } from '@/components/IconRenderer';
import { Button } from '@/components/ui/button';

interface CreateCustomActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  existingNames?: string[]; // For duplicate validation
}

export const CreateCustomActivityModal: React.FC<
  CreateCustomActivityModalProps
> = ({ isOpen, onClose, onSuccess, existingNames = [] }) => {
  const createMutation = useCreateCustomActivity();

  const [formData, setFormData] = useState({
    name: '',
    icon: 'mdi:folder',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        icon: 'mdi:folder',
        description: '',
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

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

  // Preset flat-color-icons
  const availableIcons = [
    'flat-color-icons:folder',
    'flat-color-icons:music',
    'flat-color-icons:video-file',
    'flat-color-icons:gallery',
    'flat-color-icons:camera',
    'flat-color-icons:portrait-mode',
    'flat-color-icons:sports-mode',
    'flat-color-icons:home',
    'flat-color-icons:shop',
    'flat-color-icons:business-contact',
    'flat-color-icons:template',
    'flat-color-icons:todo-list',
    'flat-color-icons:ideas',
    'flat-color-icons:electronics',
    'flat-color-icons:settings',
    'flat-color-icons:search',
    'flat-color-icons:services',
    'flat-color-icons:data-configuration',
    'flat-color-icons:organization',
    'flat-color-icons:briefcase',
    'flat-color-icons:reading',
    'flat-color-icons:book',
    'flat-color-icons:document',
    'flat-color-icons:graduation-cap',
    'flat-color-icons:education',
    'flat-color-icons:voice-presentation',
    'flat-color-icons:conference-call',
    'flat-color-icons:collaboration',
    'flat-color-icons:advertising',
    'flat-color-icons:news',
    'flat-color-icons:radio',
    'flat-color-icons:video-call',
    'flat-color-icons:phone',
    'flat-color-icons:smartphone',
    'flat-color-icons:calculator',
    'flat-color-icons:biotech',
    'flat-color-icons:gift',
    'flat-color-icons:cafe',
    'flat-color-icons:travel',
    'flat-color-icons:automotive',
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Activity name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Activity name must be less than 50 characters';
    } else if (
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

    // Description validation (optional but has max length)
    if (formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        icon: formData.icon,
        defaultColor: '#0066CC', // Default blue color for custom activities
        description: formData.description.trim() || undefined,
      });

      // Success
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handling
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create custom activity';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-activity-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2
            id="create-activity-title"
            className="text-xl font-semibold text-gray-900"
          >
            Create Custom Activity
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" aria-hidden="true" />
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
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'activity-name-error' : undefined}
            />
            {errors.name && (
              <p
                id="activity-name-error"
                className="mt-1 text-sm text-red-500"
                role="alert"
              >
                {errors.name}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.name.length}/50 characters
            </p>
          </div>

          {/* Icon Picker */}
          <div>
            <label
              id="icon-picker-label"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Icon <span className="text-red-500">*</span>
            </label>
            <div
              className="grid grid-cols-10 gap-2"
              role="radiogroup"
              aria-labelledby="icon-picker-label"
              aria-required="true"
            >
              {availableIcons.map(icon => (
                <button
                  key={icon}
                  type="button"
                  role="radio"
                  aria-checked={formData.icon === icon}
                  onClick={() => setFormData({ ...formData, icon })}
                  disabled={isSubmitting}
                  className={`h-10 w-10 flex items-center justify-center rounded-lg border-2 transition-all disabled:opacity-50 bg-white ${
                    formData.icon === icon
                      ? 'border-[#0066CC] ring-2 ring-blue-100'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  aria-label={`Select ${icon.split(':')[1] || icon} icon`}
                >
                  <IconRenderer
                    iconName={icon}
                    className="w-5 h-5 text-gray-700"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
            {errors.icon && (
              <p
                id="icon-error"
                className="mt-1 text-sm text-red-500"
                role="alert"
              >
                {errors.icon}
              </p>
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
              aria-invalid={!!errors.description}
              aria-describedby={
                errors.description ? 'activity-description-error' : undefined
              }
            />
            {errors.description && (
              <p
                id="activity-description-error"
                className="mt-1 text-sm text-red-500"
                role="alert"
              >
                {errors.description}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-2">Preview:</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-white border border-gray-200">
                <IconRenderer
                  iconName={formData.icon}
                  className="w-5 h-5 text-gray-700"
                />
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
            <div
              className="p-3 bg-red-50 border border-red-200 rounded-lg"
              role="alert"
            >
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
              {isSubmitting ? 'Creating...' : 'Create Activity'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
