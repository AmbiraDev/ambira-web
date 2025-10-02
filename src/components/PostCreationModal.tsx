'use client';

import React, { useState } from 'react';
import { Session, Project } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';

interface PostCreationModalProps {
  session: Session;
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (postId?: string) => void;
}

export const PostCreationModal: React.FC<PostCreationModalProps> = ({
  session,
  project,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'everyone' | 'followers' | 'private'>('everyone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Please add a description for your post');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update session visibility and create post
      await firebaseApi.session.createSessionWithPost(
        {
          projectId: session.projectId,
          title: session.title,
          description: session.description,
          duration: session.duration,
          startTime: session.startTime,
          taskIds: session.tasks.map(task => task.id),
          tags: session.tags,
          howFelt: session.howFelt,
          privateNotes: session.privateNotes
        },
        content,
        visibility
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create post:', err);
      setError(err.message || 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setContent('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Share Your Session
                </h3>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Session Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{session.title}</h4>
                    <p className="text-sm text-gray-600">{project.name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {formatDuration(session.duration)}
                    </div>
                    <div className="text-gray-600">Duration</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {session.tasks.filter(t => t.status === 'completed').length}/{session.tasks.length}
                    </div>
                    <div className="text-gray-600">Tasks</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {session.tags.length}
                    </div>
                    <div className="text-gray-600">Tags</div>
                  </div>
                </div>
              </div>

              {/* Content Input */}
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  What did you accomplish? *
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share what you worked on, what you learned, or any insights from this session..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                  maxLength={500}
                  disabled={isLoading}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {content.length}/500 characters
                  </span>
                </div>
              </div>

              {/* Visibility Settings */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who can see this post?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="everyone"
                      checked={visibility === 'everyone'}
                      onChange={(e) => setVisibility(e.target.value as any)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Everyone - Public post visible to all users
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="followers"
                      checked={visibility === 'followers'}
                      onChange={(e) => setVisibility(e.target.value as any)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Followers - Only people who follow you
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={visibility === 'private'}
                      onChange={(e) => setVisibility(e.target.value as any)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Private - Save session without posting
                    </span>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading || !content.trim()}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {visibility === 'private' ? 'Saving...' : 'Posting...'}
                  </>
                ) : (
                  visibility === 'private' ? 'Save Session' : 'Share Post'
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostCreationModal;
