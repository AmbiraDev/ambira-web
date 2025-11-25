'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Session, Project, SessionFilters, SessionSort } from '@/types'
import { firebaseProjectApi, firebaseSessionApi } from '@/lib/api'
import { MoreVertical } from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'

export const SessionHistory: React.FC = () => {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [filters, setFilters] = useState<SessionFilters>({})
  const [sort, setSort] = useState<SessionSort>({
    field: 'startTime',
    direction: 'desc',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMenuForSession, setShowMenuForSession] = useState<string | null>(null)
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        // Load projects and user's sessions from Firebase
        const [projectsData, sessionsResp] = await Promise.all([
          firebaseProjectApi.getProjects(),
          firebaseSessionApi.getSessions(20, {}),
        ])

        setProjects(projectsData)
        setSessions(sessionsResp.sessions)
        setTotalCount(sessionsResp.totalCount)
        setHasMore(sessionsResp.hasMore)
      } catch {
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Load sessions when filters or sort change
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true)
        const sessionsResp = await firebaseSessionApi.getSessions(20, {
          ...filters,
          search: searchQuery,
        })

        setSessions(sessionsResp.sessions)
        setTotalCount(sessionsResp.totalCount)
        setHasMore(sessionsResp.hasMore)
      } catch {
      } finally {
        setIsLoading(false)
      }
    }

    loadSessions()
  }, [filters, sort, currentPage, searchQuery])

  const handleFiltersChange = (newFilters: SessionFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleSortChange = (newSort: SessionSort) => {
    setSort(newSort)
    setCurrentPage(1)
  }

  const handleSessionEdit = (sessionId: string) => {
    router.push(`/sessions/${sessionId}/edit`)
  }

  const handleSessionDelete = (sessionId: string) => {
    setDeleteConfirmSession(sessionId)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmSession) return

    try {
      setIsDeleting(true)
      await firebaseSessionApi.deleteSession(deleteConfirmSession)

      // Reload sessions from Firebase
      const sessionsResp = await firebaseSessionApi.getSessions(20, {
        ...filters,
        search: searchQuery,
      })
      setSessions(sessionsResp.sessions)
      setTotalCount(sessionsResp.totalCount)
      setHasMore(sessionsResp.hasMore)
      setDeleteConfirmSession(null)
    } catch {
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getProjectName = (projectId: string | undefined): string => {
    if (!projectId) return 'Unknown Project'
    const project = projects.find((p) => p.id === projectId)
    return project ? project.name : 'Unknown Project'
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'everyone':
        return '🌍'
      case 'followers':
        return '👥'
      case 'private':
        return '🔒'
      default:
        return '🔒'
    }
  }

  const getFeelingEmoji = (rating?: number) => {
    if (!rating) return '😐'
    switch (rating) {
      case 1:
        return '😞'
      case 2:
        return '😕'
      case 3:
        return '😐'
      case 4:
        return '🙂'
      case 5:
        return '😊'
      default:
        return '😐'
    }
  }

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search sessions..."
            />
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
            <select
              value={filters.projectId || ''}
              onChange={(e) =>
                handleFiltersChange({
                  ...filters,
                  projectId: e.target.value || undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
              onChange={(e) =>
                handleFiltersChange({
                  ...filters,
                  dateFrom: e.target.value ? new Date(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
              onChange={(e) =>
                handleFiltersChange({
                  ...filters,
                  dateTo: e.target.value ? new Date(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div className="mt-4 flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={`${sort.field}-${sort.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-')
              handleSortChange({
                field: (field || 'startTime') as 'startTime' | 'duration' | 'title',
                direction: (direction || 'desc') as 'asc' | 'desc',
              })
            }}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="startTime-desc">Date (Newest First)</option>
            <option value="startTime-asc">Date (Oldest First)</option>
            <option value="duration-desc">Duration (Longest First)</option>
            <option value="duration-asc">Duration (Shortest First)</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Session List */}
      <div className="bg-white rounded-lg shadow">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg">No sessions found</p>
            <p className="text-sm mt-2">Try adjusting your filters or start a new session</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{session.title}</h3>
                      <span className="text-sm text-gray-500">
                        {getVisibilityIcon(session.visibility)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getFeelingEmoji(session.howFelt)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span>{getProjectName(session.projectId)}</span>
                      <span>•</span>
                      <span>{formatDate(session.startTime)}</span>
                      <span>•</span>
                      <span className="font-medium">{formatDuration(session.duration)}</span>
                    </div>

                    {session.description && (
                      <p className="text-gray-700 text-sm mb-3">{session.description}</p>
                    )}

                    {session.tags && session.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {session.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Options Menu */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowMenuForSession(showMenuForSession === session.id ? null : session.id)
                      }
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {showMenuForSession === session.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={() => {
                            handleSessionEdit(session.id)
                            setShowMenuForSession(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Edit session
                        </button>
                        <button
                          onClick={() => {
                            handleSessionDelete(session.id)
                            setShowMenuForSession(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                        >
                          Delete session
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalCount > 20 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {sessions.length} of {totalCount} sessions
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">Page {currentPage}</span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!hasMore}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmSession !== null}
        onClose={() => setDeleteConfirmSession(null)}
        onConfirm={confirmDelete}
        title="Delete Session"
        message="Are you sure you want to delete this session? This action cannot be undone and all associated data will be permanently removed."
        confirmText="Delete Session"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
