'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Project, ProjectStats } from '@/types'
import { useActivityStats } from '@/hooks/useActivitiesQuery'
import { IconRenderer } from '@/components/IconRenderer'

interface ProjectCardProps {
  project: Project
  stats?: ProjectStats
  onEdit?: (project: Project) => void
  onDelete?: (project: Project) => void
  onArchive?: (project: Project) => void
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  stats,
  onEdit,
  onDelete,
  onArchive,
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Use React Query to fetch stats with 1hr cache
  const { data: fetchedStats, isLoading: isLoadingStats } = useActivityStats(project.id, {
    enabled: !stats, // Only fetch if stats not provided as prop
  })

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const currentStats = stats || fetchedStats

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
  }

  const colorClass = colorClasses[project.color as keyof typeof colorClasses] || 'bg-gray-500'

  // Calculate progress percentage
  const weeklyProgress = project.weeklyTarget
    ? ((currentStats?.weeklyHours || 0) / project.weeklyTarget) * 100
    : 0
  const totalProgress = project.totalTarget
    ? ((currentStats?.totalHours || 0) / project.totalTarget) * 100
    : 0

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault()
    e.stopPropagation()
    action()
    setShowMenu(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 relative group h-full flex flex-col">
      <Link
        href={`/activities/${project.id}`}
        className="block p-6 flex-1 flex flex-col min-h-[280px]"
      >
        {/* Header with icon and menu */}
        <div className="flex items-start justify-between mb-5 flex-shrink-0">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center p-2 shadow-sm"
            style={{ backgroundColor: project.color }}
          >
            <IconRenderer iconName={project.icon} size={40} />
          </div>
          <button
            onClick={handleMenuToggle}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>

        {/* Project info */}
        <div className="mb-5 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {project.description}
          </p>
        </div>

        {/* Progress indicators */}
        <div className="flex-1 flex flex-col justify-end">
          {isLoadingStats ? (
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-2.5 bg-gray-200 rounded-full w-full"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-2.5 bg-gray-200 rounded-full w-3/4"></div>
              </div>
            </div>
          ) : currentStats ? (
            <div className="space-y-4">
              {/* Weekly progress */}
              {project.weeklyTarget && (
                <div>
                  <div className="flex justify-between text-xs font-medium text-gray-700 mb-2">
                    <span>This week</span>
                    <span className="text-gray-900">
                      {(currentStats.weeklyHours || 0).toFixed(1)}h / {project.weeklyTarget}h
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`${colorClass} h-2.5 rounded-full transition-all duration-300 shadow-sm`}
                      style={{ width: `${Math.min(100, weeklyProgress)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Total progress */}
              {project.totalTarget && (
                <div>
                  <div className="flex justify-between text-xs font-medium text-gray-700 mb-2">
                    <span>Total</span>
                    <span className="text-gray-900">
                      {(currentStats.totalHours || 0).toFixed(1)}h / {project.totalTarget}h
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`${colorClass} h-2.5 rounded-full transition-all duration-300 shadow-sm`}
                      style={{ width: `${Math.min(100, totalProgress)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">No targets set</div>
          )}
        </div>
      </Link>

      {/* Dropdown menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute top-16 right-4 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-10 min-w-[150px]"
        >
          <button
            onClick={(e) => handleAction(e, () => onEdit?.(project))}
            className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
          {project.status === 'active' ? (
            <button
              onClick={(e) => handleAction(e, () => onArchive?.(project))}
              className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Archive
            </button>
          ) : (
            <button
              onClick={(e) => handleAction(e, () => onArchive?.(project))}
              className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Restore
            </button>
          )}
          <div className="my-1 border-t border-gray-100"></div>
          <button
            onClick={(e) => handleAction(e, () => onDelete?.(project))}
            className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
