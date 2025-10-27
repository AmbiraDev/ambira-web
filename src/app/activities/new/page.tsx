'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/HeaderComponent';
import { CreateActivityData } from '@/types';
import { useCreateActivity } from '@/hooks/useActivitiesQuery';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { IconSelector } from '@/components/IconSelector';
import { ColorSelector } from '@/components/ColorSelector';
import { Icon } from '@iconify/react';
import { ArrowLeft } from 'lucide-react';

// Available icons from Iconify flat-color-icons
const AVAILABLE_ICONS = [
  { name: 'briefcase', icon: 'flat-color-icons:briefcase', label: 'Work' },
  { name: 'reading', icon: 'flat-color-icons:reading', label: 'Study' },
  {
    name: 'electronics',
    icon: 'flat-color-icons:electronics',
    label: 'Programming',
  },
  {
    name: 'graduation-cap',
    icon: 'flat-color-icons:graduation-cap',
    label: 'Learning',
  },
  { name: 'idea', icon: 'flat-color-icons:idea', label: 'Ideas' },
  { name: 'document', icon: 'flat-color-icons:document', label: 'Writing' },
  { name: 'template', icon: 'flat-color-icons:template', label: 'Design' },
  { name: 'gallery', icon: 'flat-color-icons:gallery', label: 'Gallery' },
  { name: 'music', icon: 'flat-color-icons:music', label: 'Music' },
  { name: 'video-file', icon: 'flat-color-icons:video-file', label: 'Video' },
  { name: 'camera', icon: 'flat-color-icons:camera', label: 'Camera' },
  {
    name: 'sports-mode',
    icon: 'flat-color-icons:sports-mode',
    label: 'Sports',
  },
  { name: 'like', icon: 'flat-color-icons:like', label: 'Health' },
  { name: 'binoculars', icon: 'flat-color-icons:binoculars', label: 'Explore' },
  { name: 'timeline', icon: 'flat-color-icons:timeline', label: 'Timeline' },
  { name: 'bullish', icon: 'flat-color-icons:bullish', label: 'Goals' },
  { name: 'flash-on', icon: 'flat-color-icons:flash-on', label: 'Energy' },
  {
    name: 'advertising',
    icon: 'flat-color-icons:advertising',
    label: 'Marketing',
  },
  {
    name: 'collaboration',
    icon: 'flat-color-icons:collaboration',
    label: 'Team',
  },
  {
    name: 'positive-dynamic',
    icon: 'flat-color-icons:positive-dynamic',
    label: 'Growth',
  },
  { name: 'approval', icon: 'flat-color-icons:approval', label: 'Approval' },
  { name: 'ratings', icon: 'flat-color-icons:ratings', label: 'Favorite' },
  { name: 'calendar', icon: 'flat-color-icons:calendar', label: 'Calendar' },
  { name: 'todo-list', icon: 'flat-color-icons:todo-list', label: 'Tasks' },
  { name: 'ok', icon: 'flat-color-icons:ok', label: 'Complete' },
  { name: 'globe', icon: 'flat-color-icons:globe', label: 'Globe' },
  { name: 'headset', icon: 'flat-color-icons:headset', label: 'Audio' },
  { name: 'video-call', icon: 'flat-color-icons:video-call', label: 'Call' },
  {
    name: 'smartphone-tablet',
    icon: 'flat-color-icons:smartphone-tablet',
    label: 'Mobile',
  },
  {
    name: 'parallel-tasks',
    icon: 'flat-color-icons:parallel-tasks',
    label: 'Database',
  },
  { name: 'package', icon: 'flat-color-icons:package', label: 'Package' },
  { name: 'workflow', icon: 'flat-color-icons:workflow', label: 'Workflow' },
  { name: 'settings', icon: 'flat-color-icons:settings', label: 'Settings' },
  { name: 'mind-map', icon: 'flat-color-icons:mind-map', label: 'Planning' },
  {
    name: 'business-contact',
    icon: 'flat-color-icons:business-contact',
    label: 'Contact',
  },
  {
    name: 'calculator',
    icon: 'flat-color-icons:calculator',
    label: 'Calculator',
  },
  { name: 'puzzle', icon: 'flat-color-icons:puzzle', label: 'Puzzle' },
  { name: 'support', icon: 'flat-color-icons:support', label: 'Support' },
  { name: 'planner', icon: 'flat-color-icons:planner', label: 'Planner' },
  { name: 'faq', icon: 'flat-color-icons:faq', label: 'FAQ' },
  {
    name: 'money-transfer',
    icon: 'flat-color-icons:money-transfer',
    label: 'Finance',
  },
  { name: 'survey', icon: 'flat-color-icons:survey', label: 'Survey' },
  { name: 'data-sheet', icon: 'flat-color-icons:data-sheet', label: 'Data' },
  {
    name: 'filing-cabinet',
    icon: 'flat-color-icons:filing-cabinet',
    label: 'Files',
  },
  { name: 'key', icon: 'flat-color-icons:key', label: 'Security' },
  { name: 'shop', icon: 'flat-color-icons:shop', label: 'Shop' },
  { name: 'donate', icon: 'flat-color-icons:donate', label: 'Donate' },
  { name: 'news', icon: 'flat-color-icons:news', label: 'News' },
  { name: 'alarm-clock', icon: 'flat-color-icons:alarm-clock', label: 'Clock' },
  {
    name: 'tree-structure',
    icon: 'flat-color-icons:tree-structure',
    label: 'Structure',
  },
  {
    name: 'organization',
    icon: 'flat-color-icons:organization',
    label: 'Organization',
  },
  {
    name: 'bulleted-list',
    icon: 'flat-color-icons:bulleted-list',
    label: 'List',
  },
  {
    name: 'voice-presentation',
    icon: 'flat-color-icons:voice-presentation',
    label: 'Present',
  },
  { name: 'bar-chart', icon: 'flat-color-icons:bar-chart', label: 'Chart' },
  { name: 'overtime', icon: 'flat-color-icons:overtime', label: 'Overtime' },
  {
    name: 'multiple-inputs',
    icon: 'flat-color-icons:multiple-inputs',
    label: 'Input',
  },
  { name: 'rules', icon: 'flat-color-icons:rules', label: 'Rules' },
  {
    name: 'podium-with-speaker',
    icon: 'flat-color-icons:podium-with-speaker',
    label: 'Speaker',
  },
  { name: 'database', icon: 'flat-color-icons:database', label: 'Database' },
  { name: 'cloud', icon: 'flat-color-icons:cloud', label: 'Cloud' },
  { name: 'linux', icon: 'flat-color-icons:linux', label: 'Linux' },
  { name: 'android-os', icon: 'flat-color-icons:android-os', label: 'Android' },
  { name: 'apple', icon: 'flat-color-icons:iphone', label: 'iOS' },
  { name: 'diploma', icon: 'flat-color-icons:diploma', label: 'Diploma' },
  { name: 'manager', icon: 'flat-color-icons:manager', label: 'Manager' },
  { name: 'business', icon: 'flat-color-icons:business', label: 'Business' },
  {
    name: 'engineering',
    icon: 'flat-color-icons:engineering',
    label: 'Engineering',
  },
  { name: 'home', icon: 'flat-color-icons:home', label: 'Home' },
  { name: 'services', icon: 'flat-color-icons:services', label: 'Services' },
  { name: 'library', icon: 'flat-color-icons:library', label: 'Library' },
  { name: 'landscape', icon: 'flat-color-icons:landscape', label: 'Nature' },
  {
    name: 'basketball',
    icon: 'flat-color-icons:basketball',
    label: 'Basketball',
  },
  {
    name: 'automotive',
    icon: 'flat-color-icons:automotive',
    label: 'Automotive',
  },
  { name: 'shipped', icon: 'flat-color-icons:shipped', label: 'Shipping' },
  { name: 'factory', icon: 'flat-color-icons:factory', label: 'Factory' },
  { name: 'about', icon: 'flat-color-icons:about', label: 'About' },
  { name: 'light', icon: 'flat-color-icons:light', label: 'Light' },
  { name: 'search', icon: 'flat-color-icons:search', label: 'Search' },
  { name: 'add-image', icon: 'flat-color-icons:add-image', label: 'Add Image' },
  { name: 'film-reel', icon: 'flat-color-icons:film-reel', label: 'Film' },
  {
    name: 'stack-of-photos',
    icon: 'flat-color-icons:stack-of-photos',
    label: 'Photos',
  },
  {
    name: 'self-service-kiosk',
    icon: 'flat-color-icons:self-service-kiosk',
    label: 'Kiosk',
  },
  {
    name: 'inspection',
    icon: 'flat-color-icons:inspection',
    label: 'Inspection',
  },
  {
    name: 'briefcase-2',
    icon: 'flat-color-icons:business-contact',
    label: 'Business Contact',
  },
  {
    name: 'conference-call',
    icon: 'flat-color-icons:conference-call',
    label: 'Conference',
  },
  { name: 'cursor', icon: 'flat-color-icons:cursor', label: 'Cursor' },
  { name: 'display', icon: 'flat-color-icons:display', label: 'Display' },
  { name: 'feedback', icon: 'flat-color-icons:feedback', label: 'Feedback' },
  {
    name: 'self-destruct-button',
    icon: 'flat-color-icons:delete-database',
    label: 'Delete',
  },
  {
    name: 'idea-sharing',
    icon: 'flat-color-icons:idea-sharing',
    label: 'Ideas Sharing',
  },
  { name: 'sports', icon: 'flat-color-icons:sports-mode', label: 'Sports' },
  { name: 'grid', icon: 'flat-color-icons:grid', label: 'Grid' },
  { name: 'puzzle-2', icon: 'flat-color-icons:puzzle', label: 'Puzzle' },
];

// Color options
const AVAILABLE_COLORS = [
  // Warm Colors
  { name: 'red', hex: '#ef4444', label: 'Red' },
  { name: 'rose', hex: '#f43f5e', label: 'Rose' },
  { name: 'pink', hex: '#ec4899', label: 'Pink' },
  { name: 'fuchsia', hex: '#d946ef', label: 'Fuchsia' },
  { name: 'orange', hex: '#f97316', label: 'Orange' },
  { name: 'amber', hex: '#f59e0b', label: 'Amber' },
  { name: 'yellow', hex: '#eab308', label: 'Yellow' },
  { name: 'lime', hex: '#84cc16', label: 'Lime' },

  // Cool Colors
  { name: 'green', hex: '#22c55e', label: 'Green' },
  { name: 'emerald', hex: '#10b981', label: 'Emerald' },
  { name: 'teal', hex: '#14b8a6', label: 'Teal' },
  { name: 'cyan', hex: '#06b6d4', label: 'Cyan' },
  { name: 'sky', hex: '#0ea5e9', label: 'Sky' },
  { name: 'blue', hex: '#3b82f6', label: 'Blue' },
  { name: 'indigo', hex: '#6366f1', label: 'Indigo' },
  { name: 'violet', hex: '#8b5cf6', label: 'Violet' },
  { name: 'purple', hex: '#a855f7', label: 'Purple' },

  // Neutrals
  { name: 'slate', hex: '#64748b', label: 'Slate' },
  { name: 'gray', hex: '#6b7280', label: 'Gray' },
  { name: 'zinc', hex: '#71717a', label: 'Zinc' },
  { name: 'neutral', hex: '#737373', label: 'Neutral' },
  { name: 'stone', hex: '#78716c', label: 'Stone' },

  // Additional vibrant colors
  { name: 'coral', hex: '#ff6b6b', label: 'Coral' },
  { name: 'peach', hex: '#ffb088', label: 'Peach' },
  { name: 'mint', hex: '#7bed9f', label: 'Mint' },
  { name: 'lavender', hex: '#c29dff', label: 'Lavender' },
  { name: 'turquoise', hex: '#06d6a0', label: 'Turquoise' },
  { name: 'navy', hex: '#1e3a8a', label: 'Navy' },
  { name: 'burgundy', hex: '#9f1239', label: 'Burgundy' },
  { name: 'olive', hex: '#84a98c', label: 'Olive' },
  { name: 'mustard', hex: '#d4a373', label: 'Mustard' },
  { name: 'salmon', hex: '#fa8072', label: 'Salmon' },
  { name: 'crimson', hex: '#dc143c', label: 'Crimson' },
  { name: 'forest', hex: '#2d6a4f', label: 'Forest' },
];

function CreateActivityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const createActivity = useCreateActivity();
  const [formData, setFormData] = useState<CreateActivityData>({
    name: '',
    description: '',
    icon: 'briefcase',
    color: 'orange',
    weeklyTarget: undefined,
    totalTarget: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateActivityData, string>>
  >({});
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateActivityData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Activity name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Activity name must be less than 50 characters';
    }

    if (formData.description.trim() && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    if (
      formData.weeklyTarget &&
      (formData.weeklyTarget < 0 || formData.weeklyTarget > 168)
    ) {
      newErrors.weeklyTarget = 'Weekly target must be between 0 and 168 hours';
    }

    if (
      formData.totalTarget &&
      (formData.totalTarget < 0 || formData.totalTarget > 10000)
    ) {
      newErrors.totalTarget = 'Total target must be between 0 and 10,000 hours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'briefcase',
      color: 'orange',
      weeklyTarget: undefined,
      totalTarget: undefined,
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSuccessMessage('');

      // Convert icon name to full Iconify string and color name to hex
      const selectedIcon = AVAILABLE_ICONS.find(i => i.name === formData.icon);
      const selectedColor = AVAILABLE_COLORS.find(
        c => c.name === formData.color
      );

      if (!createActivity) {
        throw new Error('Create activity function is not available');
      }

      await createActivity.mutateAsync({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon: selectedIcon?.icon || 'flat-color-icons:briefcase',
        color: selectedColor?.hex || '#f97316',
        weeklyTarget: formData.weeklyTarget || undefined,
        totalTarget: formData.totalTarget || undefined,
      });

      setSuccessMessage('Activity created successfully!');
      resetForm();

      setTimeout(() => {
        // Redirect to the specified path or default to /activities
        router.push(redirectPath || '/activities');
      }, 1500);
    } catch (_err) {
      console.error('Failed to create activity:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to create activity. Please try again.';
      setErrors({ name: errorMessage });
      setSuccessMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof CreateActivityData,
    value: string | number | undefined
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Get current icon string - always has a fallback to first icon
  const iconData =
    AVAILABLE_ICONS.find(i => i.name === formData.icon) || AVAILABLE_ICONS[0]!;

  // Get current color - always has a fallback to first color
  const colorData =
    AVAILABLE_COLORS.find(c => c.name === formData.color) ||
    AVAILABLE_COLORS[0]!;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href={redirectPath || '/timer'}
            className="flex items-center justify-center w-10 h-10 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">New Activity</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 md:py-8">
        <div className="bg-white md:rounded-lg md:shadow-md p-4 md:p-8">
          {/* Desktop Header - Only show on desktop */}
          <div className="hidden md:block mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Activity
            </h1>
            <p className="text-gray-600 mt-2">
              {redirectPath
                ? 'Create your first activity to start tracking your time'
                : 'Set up a new activity to track your productivity'}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <svg
                className="w-5 h-5 text-green-600 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
          )}

          {/* Preview Card */}
          <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 md:gap-4">
              <div
                className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center shadow-lg p-2"
                style={{ backgroundColor: colorData?.hex }}
              >
                <Icon
                  icon={iconData?.icon}
                  width={40}
                  height={40}
                  className="md:w-12 md:h-12"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                  {formData.name || 'Activity Name'}
                </h2>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {formData.description || 'Activity description'}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Activity Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Activity Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition-colors ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter activity name"
                maxLength={50}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] resize-none transition-colors ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your activity (optional)"
                rows={3}
                maxLength={200}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.description.length}/200 characters
              </p>
            </div>

            {/* Icon Selector */}
            <div>
              <label
                htmlFor="icon"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Icon
              </label>
              <IconSelector
                icons={AVAILABLE_ICONS}
                value={formData.icon}
                onChange={iconName => handleInputChange('icon', iconName)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Choose an icon that represents this activity
              </p>
            </div>

            {/* Color Selector */}
            <div>
              <label
                htmlFor="color"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Color
              </label>
              <ColorSelector
                colors={AVAILABLE_COLORS}
                value={formData.color}
                onChange={colorName => handleInputChange('color', colorName)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Pick a color to identify this activity
              </p>
            </div>

            {/* Weekly Target */}
            <div>
              <label
                htmlFor="weeklyTarget"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Weekly Target (hours)
              </label>
              <input
                type="number"
                id="weeklyTarget"
                value={formData.weeklyTarget || ''}
                onChange={e =>
                  handleInputChange(
                    'weeklyTarget',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition-colors ${
                  errors.weeklyTarget ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Optional"
                min="0"
                max="168"
                step="0.5"
              />
              {errors.weeklyTarget && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.weeklyTarget}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Set a weekly goal for this activity
              </p>
            </div>

            {/* Total Target */}
            <div>
              <label
                htmlFor="totalTarget"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Total Target (hours)
              </label>
              <input
                type="number"
                id="totalTarget"
                value={formData.totalTarget || ''}
                onChange={e =>
                  handleInputChange(
                    'totalTarget',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition-colors ${
                  errors.totalTarget ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Optional"
                min="0"
                max="10000"
                step="1"
              />
              {errors.totalTarget && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.totalTarget}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Set an overall activity goal
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push(redirectPath || '/activities')}
                className="flex-1 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0056D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
              >
                {isSubmitting ? 'Creating...' : 'Create Activity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CreateActivityPage() {
  return (
    <ProtectedRoute>
      <CreateActivityContent />
    </ProtectedRoute>
  );
}
