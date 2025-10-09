'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Project, ProjectStats } from '@/types';
import { useProjects } from '@/contexts/ProjectsContext';
import { IconRenderer } from '@/components/IconRenderer';

interface ProjectCardProps {
  project: Project;
  stats?: ProjectStats;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onArchive?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  stats,
  onEdit,
  onDelete,
  onArchive,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [projectStats, setProjectStats] = useState<ProjectStats | undefined>(stats);
  const { getProjectStats } = useProjects();

  // Load stats if not provided
  React.useEffect(() => {
    if (!stats && !projectStats) {
      loadStats();
    }
  }, [project.id]);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const fetchedStats = await getProjectStats(project.id);
      setProjectStats(fetchedStats);
    } catch (error) {
      console.error('Failed to load project stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const currentStats = stats || projectStats;

  // Color mapping for project colors
  const colorClasses = {
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
  };

  const colorClass = colorClasses[project.color as keyof typeof colorClasses] || 'bg-gray-500';

  // Calculate progress percentage
  const weeklyProgress = project.weeklyTarget ? ((currentStats?.weeklyHours || 0) / project.weeklyTarget) * 100 : 0;
  const totalProgress = project.totalTarget ? ((currentStats?.totalHours || 0) / project.totalTarget) * 100 : 0;

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
    setShowMenu(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 relative group">
      <Link href={`/activities/${project.id}`} className="block p-6">
        {/* Header with icon and menu */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center p-1.5"
            style={{ backgroundColor: project.color }}
          >
            <IconRenderer iconName={project.icon} size={40} />
          </div>
          <button
            onClick={handleMenuToggle}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>

        {/* Project info */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
        </div>

        {/* Progress indicators */}
        {isLoadingStats ? (
          <div className="space-y-3">
            <div className="animate-pulse">
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-2 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ) : currentStats ? (
          <div className="space-y-3">
            {/* Weekly progress */}
            {project.weeklyTarget && (
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>This week</span>
                  <span>{(currentStats.weeklyHours || 0).toFixed(1)}h / {project.weeklyTarget}h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${colorClass} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(100, weeklyProgress)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Total progress */}
            {project.totalTarget && (
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Total</span>
                  <span>{(currentStats.totalHours || 0).toFixed(1)}h / {project.totalTarget}h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${colorClass} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(100, totalProgress)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            No targets set
          </div>
        )}
      </Link>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute top-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
          <button
            onClick={(e) => handleAction(e, () => onEdit?.(project))}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
          {project.status === 'active' ? (
            <button
              onClick={(e) => handleAction(e, () => onArchive?.(project))}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Archive
            </button>
          ) : (
            <button
              onClick={(e) => handleAction(e, () => onArchive?.(project))}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Restore
            </button>
          )}
          <button
            onClick={(e) => handleAction(e, () => onDelete?.(project))}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
