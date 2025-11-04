'use client';

import React, { useState, useEffect } from 'react';
import { Session, Project } from '@/types';

interface PostCreationModalProps {
  session: Session;
  project: Project;
  onSubmit: (
    description: string,
    visibility: 'everyone' | 'followers' | 'private'
  ) => Promise<void>;
  onSkip: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const PostCreationModal: React.FC<PostCreationModalProps> = ({
  session,
  project,
  onSubmit,
  onSkip,
  onCancel,
  isOpen,
}) => {
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<
    'everyone' | 'followers' | 'private'
  >('everyone');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(description, visibility);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Task tracking not implemented at session level
  const completedTasks = 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Share Your Session
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            Tell your followers about this productive session
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Session Summary */}
          <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-semibold shadow-lg"
                style={{ backgroundColor: project.color }}
              >
                {project.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">
                  {session.title}
                </h3>
                <p className="text-gray-600">{project.name}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-semibold text-gray-900">
                      {formatDuration(session.duration)}
                    </span>
                  </div>
                  {completedTasks > 0 && (
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-semibold text-gray-900">
                        {completedTasks} tasks
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description Input */}
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What did you accomplish? (Optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Share your progress, learnings, or reflections with your followers..."
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-500">
                {description.length} / 500 characters
              </span>
              {description.length > 500 && (
                <span className="text-sm text-red-500">
                  Too long! Please keep it under 500 characters.
                </span>
              )}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="px-6 pb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who can see this?
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('everyone')}
                disabled={isSubmitting}
                className={`p-3 rounded-lg border-2 transition-all ${
                  visibility === 'everyone'
                    ? 'border-orange-500 bg-orange-50 text-orange-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-center">
                  <svg
                    className="w-6 h-6 mx-auto mb-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="font-medium text-sm">Everyone</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('followers')}
                disabled={isSubmitting}
                className={`p-3 rounded-lg border-2 transition-all ${
                  visibility === 'followers'
                    ? 'border-orange-500 bg-orange-50 text-orange-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-center">
                  <svg
                    className="w-6 h-6 mx-auto mb-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <div className="font-medium text-sm">Followers</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('private')}
                disabled={isSubmitting}
                className={`p-3 rounded-lg border-2 transition-all ${
                  visibility === 'private'
                    ? 'border-orange-500 bg-orange-50 text-orange-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-center">
                  <svg
                    className="w-6 h-6 mx-auto mb-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <div className="font-medium text-sm">Only You</div>
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              type="button"
              onClick={onSkip}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={isSubmitting || description.length > 500}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:transform-none"
            >
              {isSubmitting ? 'Posting...' : 'Share Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostCreationModal;
