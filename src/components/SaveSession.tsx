'use client';

import React, { useState, useEffect } from 'react';
import { SessionFormData, Project } from '@/types';
import { firebaseApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ERROR_MESSAGES } from '@/config/errorMessages';
import { debug } from '@/lib/debug';

interface SaveSessionProps {
  onSave: (data: SessionFormData) => Promise<void>;
  onCancel: () => void;
  initialData: Partial<SessionFormData>;
  isLoading?: boolean;
}

const TAGS = [
  'Study',
  'Work',
  'Side Project',
  'Reading',
  'Learning',
  'Exercise',
  'Creative',
  'Other',
];

const PRIVACY_OPTIONS = [
  { value: 'everyone', label: 'Everyone', description: 'Visible to all users' },
  {
    value: 'followers',
    label: 'Followers',
    description: 'Visible to your followers',
  },
  { value: 'private', label: 'Only You', description: 'Private to you only' },
];

export const SaveSession: React.FC<SaveSessionProps> = ({
  onSave,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<SessionFormData>({
    activityId: (initialData.activityId ||
      initialData.projectId ||
      '') as string,
    projectId: initialData.projectId || '',
    title: initialData.title || '',
    description: initialData.description || '',
    duration: initialData.duration || 0,
    startTime: initialData.startTime || new Date(),
    tags: initialData.tags || [],
    visibility: initialData.visibility || 'everyone',
    privateNotes: initialData.privateNotes || '',
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;

      try {
        const projectList = await firebaseApi.project.getProjects();
        setProjects(projectList);

        // Set initial project if provided
        if (initialData.projectId && !formData.projectId) {
          setFormData(prev => ({ ...prev, projectId: initialData.projectId! }));
        }
      } catch {
        debug.error('SaveSession - Failed to load projects');
      }
    };

    loadProjects();
  }, [user, initialData.projectId, formData.projectId]);

  // Generate smart title based on time of day and project
  useEffect(() => {
    if (!formData.title && formData.projectId) {
      const project = projects.find(p => p.id === formData.projectId);
      const hour = new Date().getHours();

      let timeOfDay = '';
      if (hour < 12) timeOfDay = 'Morning';
      else if (hour < 17) timeOfDay = 'Afternoon';
      else timeOfDay = 'Evening';

      const smartTitle = project
        ? `${timeOfDay} ${project.name} Session`
        : `${timeOfDay} Work Session`;
      setFormData(prev => ({ ...prev, title: smartTitle }));
    }
  }, [formData.projectId, formData.title, projects]);

  const handleInputChange = (field: keyof SessionFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = formData.tags || [];
    const isSelected = currentTags.includes(tag);
    const newTags = isSelected
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];

    setFormData(prev => ({ ...prev, tags: newTags }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectId) {
      newErrors.projectId = 'Please select a project';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Please enter a session title';
    }

    if (formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
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
      // Save the session
      await onSave(formData);

      // Note: Post creation is now handled by the onSave callback
      // The parent component (SessionTimer/ManualEntry) will handle creating the post
      // using firebaseApi.session.createSessionWithPost if visibility !== 'private'
    } catch {
      debug.error('SaveSession - Failed to save session');
      setErrors({ submit: ERROR_MESSAGES.SESSION_SAVE_FAILED });
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Save Session</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project *
            </label>
            <select
              value={formData.projectId}
              onChange={e => handleInputChange('projectId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.projectId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            >
              <option value="">Select a project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="text-red-500 text-sm mt-1">{errors.projectId}</p>
            )}
          </div>

          {/* Session Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="What did you work on?"
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Duration Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Session Duration</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatDuration(formData.duration)}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Started: {formData.startTime.toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={e => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="What did you accomplish?"
              disabled={isLoading}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    (formData.tags || []).includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Privacy
            </label>
            <select
              value={formData.visibility}
              onChange={e =>
                handleInputChange(
                  'visibility',
                  e.target.value as 'everyone' | 'followers' | 'private'
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {PRIVACY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          {/* Removed howFelt per requirements */}

          {/* Private Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Private Notes
            </label>
            <textarea
              value={formData.privateNotes || ''}
              onChange={e => handleInputChange('privateNotes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Any private notes about this session..."
              disabled={isLoading}
            />
          </div>

          {/* Error Messages */}
          {errors.submit && (
            <div className="text-red-500 text-sm">{errors.submit}</div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
