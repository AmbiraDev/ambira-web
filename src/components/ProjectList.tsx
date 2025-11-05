'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/types';
import { ProjectCard } from './ProjectCard';
import { useAuth } from '@/hooks/useAuth';
import {
  useActivities,
  useDeleteActivity,
  useArchiveActivity,
  useRestoreActivity,
} from '@/hooks/useActivitiesQuery';

interface ProjectListProps {
  onCreateProject?: () => void;
  onEditProject?: (project: Project) => void;
}

// const STORAGE_KEY = 'projectViewMode';

export const ProjectList: React.FC<ProjectListProps> = ({ onEditProject }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: projects = [], isLoading, error } = useActivities(user?.id);
  const deleteProjectMutation = useDeleteActivity();
  const archiveProjectMutation = useArchiveActivity();
  const restoreProjectMutation = useRestoreActivity();
  // const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null);

  // // Load view mode from localStorage on mount
  // useEffect(() => {
  //   const savedViewMode = localStorage.getItem(STORAGE_KEY);
  //   if (savedViewMode === 'grid' || savedViewMode === 'list') {
  //     setViewMode(savedViewMode);
  //   }
  // }, []);

  // // Save view mode to localStorage whenever it changes
  // const handleViewModeChange = (mode: 'grid' | 'list') => {
  //   setViewMode(mode);
  //   localStorage.setItem(STORAGE_KEY, mode);
  // };

  // Show all projects
  const filteredProjects = projects;

  const handleDelete = async (project: Project) => {
    try {
      await deleteProjectMutation.mutateAsync(project.id);
      setDeleteConfirm(null);
    } catch {}
  };

  const handleArchive = async (project: Project) => {
    try {
      if (project.status === 'archived') {
        await restoreProjectMutation.mutateAsync(project.id);
      } else {
        await archiveProjectMutation.mutateAsync(project.id);
      }
    } catch {}
  };

  const handleRestore = async (project: Project) => {
    try {
      await restoreProjectMutation.mutateAsync(project.id);
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for header */}
        <div className="flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="flex gap-2">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>

        {/* Loading skeleton for filters */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>

        {/* Loading skeleton for project cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                </div>
                <div className="mb-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">
          Error loading activities
        </div>
        <p className="text-gray-600 mb-4">
          {error instanceof Error ? error.message : String(error)}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Activities
            </h1>
            <p className="text-gray-600 text-sm">
              {filteredProjects.length} activit
              {filteredProjects.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/activities/new')}
              className="bg-[#0066CC] text-white px-5 py-2.5 rounded-lg hover:bg-[#0051D5] transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              New Activity
            </button>
            {/* View mode toggle removed - grid view only */}
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 md:p-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#0066CC] to-[#0051D5] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg
                className="w-8 h-8 md:w-10 md:h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              No activities yet
            </h3>
            <p className="text-sm md:text-base text-gray-600 mb-6">
              Activities help you organize your work sessions and track progress
              over time. Create your first activity to get started!
            </p>
            <button
              onClick={() => router.push('/activities/new')}
              className="inline-flex items-center gap-2 bg-[#0066CC] text-white px-6 py-3 rounded-xl hover:bg-[#0051D5] transition-colors font-medium shadow-sm mb-4"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Your First Activity
            </button>
            <p className="text-xs text-gray-500">
              Tip: You can assign tasks to activities and track time spent on
              each one
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={onEditProject}
              onDelete={project => setDeleteConfirm(project)}
              onArchive={
                project.status === 'active' ? handleArchive : handleRestore
              }
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={e => {
            if (e.target === e.currentTarget) {
              setDeleteConfirm(null);
            }
          }}
        >
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Delete Activity
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900">
                "{deleteConfirm.name}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-5 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors shadow-sm hover:shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
