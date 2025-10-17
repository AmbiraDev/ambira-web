'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActivities } from '@/contexts/ActivitiesContext';
import { suggestedProjects, SuggestedProject } from '@/lib/onboarding/sampleProjects';

interface QuickSetupProps {
  onComplete: () => void;
  onBack: () => void;
}

export const QuickSetup: React.FC<QuickSetupProps> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState<'select' | 'confirm' | 'next-steps'>('select');
  const [selectedProject, setSelectedProject] = useState<SuggestedProject | null>(null);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createActivity } = useActivities();
  const router = useRouter();

  const handleSelectProject = (project: SuggestedProject) => {
    setSelectedProject(project);
    setIsCustom(false);
    setCustomName(project.name);
    setCustomDescription(project.description);
    setStep('confirm');
  };

  const handleCustomProject = () => {
    setIsCustom(true);
    setSelectedProject(null);
    setCustomName('');
    setCustomDescription('');
    setStep('confirm');
  };

  const handleCreateProject = async () => {
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
        color: selectedProject?.color || '#007AFF',
        icon: selectedProject?.icon || 'flat-color-icons:briefcase',
      });

      setStep('next-steps');
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartSession = () => {
    router.push('/timer');
    onComplete();
  };

  const handleSkipToFeed = () => {
    onComplete();
  };

  if (step === 'select') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📁</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your First Project</h2>
            <p className="text-gray-600">
              Projects help you organize your work sessions. Choose a suggested project or create your own.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {suggestedProjects.map((project) => (
              <button
                key={project.name}
                onClick={() => handleSelectProject(project)}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#007AFF] hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
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
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
                    <p className="text-sm text-gray-600">{project.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleCustomProject}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#007AFF] hover:bg-blue-50 transition-all mb-6"
          >
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <span className="text-2xl">➕</span>
              <span className="font-medium">Create Custom Project</span>
            </div>
          </button>

          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              onClick={onComplete}
              className="px-4 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">
              {isCustom ? '✏️' : (
                <>
                  {selectedProject?.icon === 'flat-color-icons:briefcase' && '💼'}
                  {selectedProject?.icon === 'flat-color-icons:reading' && '📚'}
                  {selectedProject?.icon === 'flat-color-icons:electronics' && '💻'}
                  {selectedProject?.icon === 'flat-color-icons:sports-mode' && '🏃'}
                  {selectedProject?.icon === 'flat-color-icons:gallery' && '🎨'}
                </>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isCustom ? 'Create Custom Project' : 'Confirm Project Details'}
            </h2>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g., Work, Learning, Side Project"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('select')}
              disabled={isCreating}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleCreateProject}
              disabled={isCreating || !customName.trim()}
              className="flex-1 px-4 py-3 text-white bg-[#007AFF] rounded-lg font-medium hover:bg-[#0051D5] transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'next-steps') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Created!</h2>
            <p className="text-gray-600">
              Great! You've created your first project. Now you're ready to start tracking your work.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⏱️</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Start Your First Session</h3>
                <p className="text-sm text-gray-600">
                  Click the timer to start tracking time on your project. When you finish, save your session to build your streak!
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleStartSession}
              className="w-full px-4 py-3 text-white bg-[#007AFF] rounded-lg font-medium hover:bg-[#0051D5] transition-colors"
            >
              Start Session Now
            </button>
            <button
              onClick={handleSkipToFeed}
              className="w-full px-4 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Explore Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
