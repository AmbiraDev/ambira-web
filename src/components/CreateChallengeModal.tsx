'use client';

import React, { useState } from 'react';
import { CreateChallengeData, Project } from '@/types';
import { Button } from '@/components/ui/button';
import {
  X,
  Target,
  TrendingUp,
  Zap,
  Timer,
  Award,
  Plus,
  Trash2,
} from 'lucide-react';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateChallengeData) => Promise<void>;
  groupId?: string;
  projects: Project[];
  isLoading: boolean;
}

const challengeTypes = [
  {
    type: 'most-activity' as const,
    label: 'Most Activity',
    icon: TrendingUp,
    description: 'Compete to log the most productive hours',
    goalLabel: 'Target Hours',
    goalPlaceholder: 'e.g., 40',
  },
  {
    type: 'fastest-effort' as const,
    label: 'Fastest Effort',
    icon: Zap,
    description: 'Achieve the best tasks-per-hour ratio',
    goalLabel: 'Target Ratio',
    goalPlaceholder: 'e.g., 5.0',
  },
  {
    type: 'longest-session' as const,
    label: 'Longest Session',
    icon: Timer,
    description: 'Record the longest single work session',
    goalLabel: 'Target Hours',
    goalPlaceholder: 'e.g., 8',
  },
  {
    type: 'group-goal' as const,
    label: 'Group Goal',
    icon: Target,
    description: 'Work together to reach a collective target',
    goalLabel: 'Total Hours Goal',
    goalPlaceholder: 'e.g., 1000',
  },
];

export default function CreateChallengeModal({
  isOpen,
  onClose,
  onSubmit,
  groupId,
  projects,
  isLoading,
}: CreateChallengeModalProps) {
  const [formData, setFormData] = useState<CreateChallengeData>({
    groupId,
    name: '',
    description: '',
    type: 'most-activity',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    goalValue: undefined,
    rules: '',
    projectIds: [],
    rewards: [],
  });

  const [newReward, setNewReward] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle ESC key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Challenge name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Challenge name must be at least 3 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Challenge name must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Challenge description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (formData.startDate >= formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    const now = new Date();
    if (formData.startDate < now) {
      newErrors.startDate = 'Start date cannot be in the past';
    }

    if (formData.goalValue !== undefined && formData.goalValue <= 0) {
      newErrors.goalValue = 'Goal value must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    field: string,
    value: string | Date | number | undefined | string[]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        groupId,
        name: '',
        description: '',
        type: 'most-activity',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        goalValue: undefined,
        rules: '',
        projectIds: [],
        rewards: [],
      });
      setNewReward('');
      setErrors({});
    } catch (error) {
      console.error('Failed to create challenge:', error);
      setErrors({ submit: 'Failed to create challenge. Please try again.' });
    }
  };

  const selectedType = challengeTypes.find(t => t.type === formData.type)!;

  const addReward = () => {
    if (newReward.trim() && !formData.rewards?.includes(newReward.trim())) {
      setFormData(prev => ({
        ...prev,
        rewards: [...(prev.rewards || []), newReward.trim()],
      }));
      setNewReward('');
    }
  };

  const removeReward = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rewards: prev.rewards?.filter((_, i) => i !== index) || [],
    }));
  };

  const toggleProject = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      projectIds: prev.projectIds?.includes(projectId)
        ? prev.projectIds.filter(id => id !== projectId)
        : [...(prev.projectIds || []), projectId],
    }));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-challenge-title"
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2
            id="create-challenge-title"
            className="text-lg sm:text-xl font-semibold text-gray-900"
          >
            Create New Challenge
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Banner */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="challenge-name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Challenge Name *
              </label>
              <input
                type="text"
                id="challenge-name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter challenge name"
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={
                  errors.name ? 'challenge-name-error' : undefined
                }
                autoFocus
              />
              {errors.name && (
                <p
                  id="challenge-name-error"
                  className="text-red-500 text-sm mt-1"
                  role="alert"
                >
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe what this challenge is about"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>
          </div>

          {/* Challenge Type */}
          <div>
            <label
              id="challenge-type-label"
              className="block text-sm font-medium text-gray-700 mb-3"
            >
              Challenge Type *
            </label>
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
              role="radiogroup"
              aria-labelledby="challenge-type-label"
            >
              {challengeTypes.map(type => {
                const Icon = type.icon;
                const isSelected = formData.type === type.type;

                return (
                  <button
                    key={type.type}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() =>
                      setFormData(prev => ({ ...prev, type: type.type }))
                    }
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    aria-label={`${type.label}: ${type.description}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon
                        className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}
                        aria-hidden="true"
                      />
                      <span
                        className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}
                      >
                        {type.label}
                      </span>
                    </div>
                    <p
                      className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}
                    >
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedType.goalLabel} (Optional)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.goalValue || ''}
              onChange={e =>
                handleInputChange(
                  'goalValue',
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.goalValue ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={selectedType.goalPlaceholder}
            />
            {errors.goalValue && (
              <p className="text-red-500 text-sm mt-1">{errors.goalValue}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Leave empty for no specific target goal
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="datetime-local"
                value={formData.startDate.toISOString().slice(0, 16)}
                onChange={e =>
                  handleInputChange('startDate', new Date(e.target.value))
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="datetime-local"
                value={formData.endDate.toISOString().slice(0, 16)}
                onChange={e =>
                  handleInputChange('endDate', new Date(e.target.value))
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Project Filter */}
          {projects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eligible Projects (Optional)
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Select which projects count toward this challenge. Leave empty
                to include all projects.
              </p>
              <div className="flex flex-wrap gap-2">
                {projects.map(project => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => toggleProject(project.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      formData.projectIds?.includes(project.id)
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {project.icon} {project.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rules & Requirements (Optional)
            </label>
            <textarea
              value={formData.rules || ''}
              onChange={e =>
                setFormData(prev => ({ ...prev, rules: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any specific rules or requirements for this challenge"
            />
          </div>

          {/* Rewards */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rewards (Optional)
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newReward}
                  onChange={e => setNewReward(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a reward (e.g., Badge, Recognition, Prize)"
                  onKeyPress={e =>
                    e.key === 'Enter' && (e.preventDefault(), addReward())
                  }
                />
                <Button type="button" onClick={addReward} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.rewards && formData.rewards.length > 0 && (
                <div className="space-y-1">
                  {formData.rewards.map((reward, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-yellow-50 px-3 py-2 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          {reward}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeReward(index)}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Challenge'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
