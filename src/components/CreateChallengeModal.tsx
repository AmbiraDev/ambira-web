'use client';

import React, { useState } from 'react';
import { CreateChallengeData, Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Target,
  TrendingUp,
  Zap,
  Timer,
  Calendar,
  Users,
  Award,
  Plus,
  Trash2
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
    goalPlaceholder: 'e.g., 40'
  },
  {
    type: 'fastest-effort' as const,
    label: 'Fastest Effort',
    icon: Zap,
    description: 'Achieve the best tasks-per-hour ratio',
    goalLabel: 'Target Ratio',
    goalPlaceholder: 'e.g., 5.0'
  },
  {
    type: 'longest-session' as const,
    label: 'Longest Session',
    icon: Timer,
    description: 'Record the longest single work session',
    goalLabel: 'Target Hours',
    goalPlaceholder: 'e.g., 8'
  },
  {
    type: 'group-goal' as const,
    label: 'Group Goal',
    icon: Target,
    description: 'Work together to reach a collective target',
    goalLabel: 'Total Hours Goal',
    goalPlaceholder: 'e.g., 1000'
  }
];

export default function CreateChallengeModal({
  isOpen,
  onClose,
  onSubmit,
  groupId,
  projects,
  isLoading
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
    rewards: []
  });

  const [newReward, setNewReward] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      alert('Please enter a challenge name');
      return;
    }
    if (!formData.description.trim()) {
      alert('Please enter a challenge description');
      return;
    }
    if (formData.startDate >= formData.endDate) {
      alert('End date must be after start date');
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
        rewards: []
      });
      setNewReward('');
    } catch (error) {
      console.error('Failed to create challenge:', error);
    }
  };

  const selectedType = challengeTypes.find(t => t.type === formData.type)!;
  const SelectedIcon = selectedType.icon;

  const addReward = () => {
    if (newReward.trim() && !formData.rewards?.includes(newReward.trim())) {
      setFormData(prev => ({
        ...prev,
        rewards: [...(prev.rewards || []), newReward.trim()]
      }));
      setNewReward('');
    }
  };

  const removeReward = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rewards: prev.rewards?.filter((_, i) => i !== index) || []
    }));
  };

  const toggleProject = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      projectIds: prev.projectIds?.includes(projectId)
        ? prev.projectIds.filter(id => id !== projectId)
        : [...(prev.projectIds || []), projectId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Challenge</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challenge Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter challenge name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what this challenge is about"
                required
              />
            </div>
          </div>

          {/* Challenge Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Challenge Type *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {challengeTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.type;
                
                return (
                  <button
                    key={type.type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: type.type }))}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {type.label}
                      </span>
                    </div>
                    <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
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
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                goalValue: e.target.value ? parseFloat(e.target.value) : undefined 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={selectedType.goalPlaceholder}
            />
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
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  startDate: new Date(e.target.value) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="datetime-local"
                value={formData.endDate.toISOString().slice(0, 16)}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  endDate: new Date(e.target.value) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Project Filter */}
          {projects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eligible Projects (Optional)
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Select which projects count toward this challenge. Leave empty to include all projects.
              </p>
              <div className="flex flex-wrap gap-2">
                {projects.map((project) => (
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
              onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
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
                  onChange={(e) => setNewReward(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a reward (e.g., Badge, Recognition, Prize)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addReward())}
                />
                <Button type="button" onClick={addReward} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.rewards && formData.rewards.length > 0 && (
                <div className="space-y-1">
                  {formData.rewards.map((reward, index) => (
                    <div key={index} className="flex items-center justify-between bg-yellow-50 px-3 py-2 rounded-md">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">{reward}</span>
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
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Challenge'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}