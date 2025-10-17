'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActivities } from '@/contexts/ActivitiesContext';
import { suggestedProjects, SuggestedProject } from '@/lib/onboarding/sampleProjects';
import { firebaseAuthApi } from '@/lib/firebaseApi';

export default function OnboardingSetupPage() {
  const router = useRouter();
  const { createActivity } = useActivities();
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSelectProject = async (project: SuggestedProject) => {
    if (selectedProjects.has(project.name)) {
      // Already selected, do nothing
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await createActivity({
        name: project.name,
        description: project.description,
        color: project.color,
        icon: project.icon,
      });

      setSelectedProjects((prev) => new Set(prev).add(project.name));
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateCustom = async () => {
    if (!customName.trim()) {
      setError('Please enter a project name');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await createActivity({
        name: customName.trim(),
        description: customDescription.trim() || '',
        color: '#007AFF',
        icon: 'flat-color-icons:briefcase',
      });

      setSelectedProjects((prev) => new Set(prev).add(customName.trim()));
      setCustomName('');
      setCustomDescription('');
      setShowCustomForm(false);
    } catch (err) {
      console.error('Failed to create custom project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleContinue = async () => {
    if (selectedProjects.size === 0) {
      setError('Please create at least one project to continue');
      return;
    }

    try {
      await firebaseAuthApi.updateOnboardingStep(2);
      router.push('/onboarding/timer-intro');
    } catch (err) {
      console.error('Failed to update onboarding step:', err);
      // Still navigate even if update fails
      router.push('/onboarding/timer-intro');
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-6 sm:py-8 overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4">
            <span className="text-3xl">📁</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Create Your First Project
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Projects help you organize different areas of your life. Choose from our suggestions or create your own.
          </p>
        </div>

        {/* Success Indicator */}
        {selectedProjects.size > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-center">
            <p className="text-green-800 font-medium">
              ✓ {selectedProjects.size} project{selectedProjects.size > 1 ? 's' : ''} created
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Suggested Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          {suggestedProjects.map((project) => {
            const isSelected = selectedProjects.has(project.name);
            return (
              <button
                key={project.name}
                onClick={() => handleSelectProject(project)}
                disabled={isCreating || isSelected}
                className={`relative p-4 sm:p-5 rounded-xl border-2 text-left transition-all active:scale-95 ${
                  isSelected
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-[#007AFF] hover:bg-blue-50'
                } ${isCreating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${project.color}15` }}
                  >
                    <span className="text-2xl">
                      {project.icon === 'flat-color-icons:briefcase' && '💼'}
                      {project.icon === 'flat-color-icons:reading' && '📚'}
                      {project.icon === 'flat-color-icons:electronics' && '💻'}
                      {project.icon === 'flat-color-icons:sports-mode' && '🏃'}
                      {project.icon === 'flat-color-icons:gallery' && '🎨'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Project Section */}
        {!showCustomForm ? (
          <button
            onClick={() => setShowCustomForm(true)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#007AFF] hover:bg-blue-50 transition-all active:scale-95"
          >
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <span className="text-xl">➕</span>
              <span className="font-medium">Create Custom Project</span>
            </div>
          </button>
        ) : (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Custom Project</h3>
              <button
                onClick={() => {
                  setShowCustomForm(false);
                  setCustomName('');
                  setCustomDescription('');
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g., Podcast Production"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="What kind of work will you track here?"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent resize-none text-base"
              />
            </div>

            <button
              onClick={handleCreateCustom}
              disabled={isCreating || !customName.trim()}
              className="w-full px-4 py-3 text-white bg-[#007AFF] rounded-lg font-medium hover:bg-[#0051D5] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        )}

        {/* Continue Button - Fixed at bottom on mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 sm:relative sm:border-0 sm:bg-transparent sm:p-0 sm:mt-8">
          <button
            onClick={handleContinue}
            disabled={selectedProjects.size === 0}
            className="w-full px-6 py-4 text-lg font-semibold text-white bg-[#007AFF] rounded-xl hover:bg-[#0051D5] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
          >
            Continue
          </button>
        </div>

        {/* Bottom spacer for fixed button on mobile */}
        <div className="h-20 sm:hidden" />
      </div>
    </div>
  );
}
