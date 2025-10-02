'use client';

import React, { useState, useEffect } from 'react';
import { Session, Project, SessionFilters, SessionSort } from '@/types';
import { firebaseProjectApi, firebaseSessionApi } from '@/lib/firebaseApi';

export const SessionHistory: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState<SessionFilters>({});
  const [sort, setSort] = useState<SessionSort>({ field: 'startTime', direction: 'desc' });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        // Load projects and user's sessions from Firebase
        const [projectsData, sessionsResp] = await Promise.all([
          firebaseProjectApi.getProjects(),
          firebaseSessionApi.getSessions(1, 20, {})
        ]);

        setProjects(projectsData);
        setSessions(sessionsResp.sessions);
        setTotalCount(sessionsResp.totalCount);
        setHasMore(sessionsResp.hasMore);
      } catch (error) {
        console.error('Failed to load session history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load sessions when filters or sort change
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        const sessionsResp = await firebaseSessionApi.getSessions(
          currentPage,
          20,
          { ...filters, search: searchQuery }
        );

        setSessions(sessionsResp.sessions);
        setTotalCount(sessionsResp.totalCount);
        setHasMore(sessionsResp.hasMore);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [filters, sort, currentPage, searchQuery]);

  const handleFiltersChange = (newFilters: SessionFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: SessionSort) => {
    setSort(newSort);
    setCurrentPage(1);
  };

  const handleSessionEdit = (session: Session) => {
    // TODO: Implement session editing
    console.log('Edit session:', session);
  };

  const handleSessionDelete = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Delete session:', sessionId);
      
      // TODO: Reload sessions from Firebase
      // Reload sessions
      const sessionsResp = await firebaseSessionApi.getSessions(
        currentPage,
        20,
        { ...filters, search: searchQuery }
      );
      setSessions(sessionsResp.sessions);
      setTotalCount(sessionsResp.totalCount);
      setHasMore(sessionsResp.hasMore);
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    }
  };

  const handleSessionArchive = async (sessionId: string) => {
    try {
      console.log('Archive session:', sessionId);
      
      // TODO: Reload sessions from Firebase
      // Reload sessions
      const sessionsResp = await firebaseSessionApi.getSessions(
        currentPage,
        20,
        { ...filters, search: searchQuery }
      );
      setSessions(sessionsResp.sessions);
      setTotalCount(sessionsResp.totalCount);
      setHasMore(sessionsResp.hasMore);
    } catch (error) {
      console.error('Failed to archive session:', error);
      alert('Failed to archive session. Please try again.');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'everyone':
        return '🌍';
      case 'followers':
        return '👥';
      case 'private':
        return '🔒';
      default:
        return '🔒';
    }
  };

  const getFeelingEmoji = (rating?: number) => {
    if (!rating) return '😐';
    switch (rating) {
      case 1: return '😞';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '🙂';
      case 5: return '😊';
      default: return '😐';
    }
  };

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project
            </label>
            <select
              value={filters.projectId || ''}
              onChange={(e) => handleFiltersChange({ ...filters, projectId: e.target.value || undefined })}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
              onChange={(e) => handleFiltersChange({ 
                ...filters, 
                dateFrom: e.target.value ? new Date(e.target.value) : undefined 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
              onChange={(e) => handleFiltersChange({ 
                ...filters, 
                dateTo: e.target.value ? new Date(e.target.value) : undefined 
              })}
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
              const [field, direction] = e.target.value.split('-');
              handleSortChange({ field: field as any, direction: direction as any });
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

                    {session.tags.length > 0 && (
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

                    {session.tasks.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Tasks:</span> {session.tasks.map(t => t.name).join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSessionEdit(session)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit session"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleSessionArchive(session.id)}
                      className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                      title="Archive session"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6m0 0l6-6m-6 6V3" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleSessionDelete(session.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete session"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {currentPage}
            </span>
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
    </div>
  );
};
