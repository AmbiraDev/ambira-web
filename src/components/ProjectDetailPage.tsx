'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Project, ProjectStats, Session } from '@/types';
import { useProject, useProjects } from '@/contexts/ProjectsContext';
import { useTasks } from '@/contexts/TasksContext';
import { CreateProjectModal } from './CreateProjectModal';
import { TaskList } from './TaskList';
import { firebaseSessionApi } from '@/lib/firebaseApi';
import { ProjectProgressView } from './ProjectProgressView';
import { IconRenderer } from './IconRenderer';

interface ProjectDetailPageProps {
  projectId: string;
}

type TabType = 'progress' | 'tasks' | 'sessions' | 'profile';

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ projectId }) => {
  const router = useRouter();
  const { project, isLoading } = useProject(projectId);
  const { getProjectStats, updateProject, deleteProject, archiveProject } = useProjects();
  const { tasks, createTask, updateTask, deleteTask, bulkUpdateTasks, loadProjectTasks } = useTasks();
  const [activeTab, setActiveTab] = useState<TabType>('progress');
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Load project stats and tasks
  useEffect(() => {
    if (project) {
      console.log('Loading tasks for project:', projectId, project.name);
      loadStats();
      loadProjectTasks(projectId);
    }
  }, [project, projectId, loadProjectTasks]);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const projectStats = await getProjectStats(projectId);
      setStats(projectStats);
    } catch (error) {
      console.error('Failed to load project stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleArchive = async () => {
    if (!project) return;
    
    try {
      await archiveProject(project.id);
      router.push('/projects');
    } catch (error) {
      console.error('Failed to archive project:', error);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    
    if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      try {
        await deleteProject(project.id);
        router.push('/projects');
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
              <div>
                <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 bg-gray-200 rounded w-20"></div>
              <div className="h-10 bg-gray-200 rounded w-20"></div>
              <div className="h-10 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <IconRenderer iconName="flat-color-icons:folder" size={80} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Project not found</h3>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.push('/projects')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Color mapping
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

  const tabs = [
    { id: 'progress', label: 'Progress', icon: '📊' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'sessions', label: 'Sessions', icon: '⏱️' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-16 h-16 ${colorClass} rounded-lg flex items-center justify-center p-2`}>
            <IconRenderer iconName={project.icon} size={48} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600">{project.description}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleArchive}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {project.status === 'active' ? 'Archive' : 'Restore'}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'progress' && (
          <ProjectProgressView projectId={project.id} />
        )}
        {activeTab === 'tasks' && (
          <TasksTab
            project={project}
            tasks={tasks}
            onCreateTask={createTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onBulkUpdateTasks={bulkUpdateTasks}
            selectedTaskIds={selectedTaskIds}
            onToggleTaskSelection={handleToggleTaskSelection}
          />
        )}
        {activeTab === 'sessions' && (
          <SessionsTab project={project} />
        )}
        {activeTab === 'profile' && (
          <ProfileTab project={project} stats={stats} />
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <CreateProjectModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            loadStats();
          }}
        />
      )}
    </div>
  );
};

// Tasks Tab Component
interface TasksTabProps {
  project: Project;
  tasks: any[];
  onCreateTask: (data: { name: string; projectId: string }) => Promise<void>;
  onUpdateTask: (id: string, data: any) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onBulkUpdateTasks: (update: any) => Promise<void>;
  selectedTaskIds: string[];
  onToggleTaskSelection: (taskId: string) => void;
}

type TaskSubTabType = 'active' | 'completed' | 'archived';

const TasksTab: React.FC<TasksTabProps> = ({ 
  project, 
  tasks, 
  onCreateTask, 
  onUpdateTask, 
  onDeleteTask, 
  onBulkUpdateTasks,
  selectedTaskIds,
  onToggleTaskSelection
}) => {
  const [activeSubTab, setActiveSubTab] = React.useState<TaskSubTabType>('active');

  // Debug logging
  React.useEffect(() => {
    console.log('TasksTab received tasks:', tasks.length, tasks);
  }, [tasks]);

  const subTabs = [
    { id: 'active', label: 'Active', icon: '⭕' },
    { id: 'completed', label: 'Completed', icon: '✅' },
    { id: 'archived', label: 'Archived', icon: '📦' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex border-b border-gray-200">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === tab.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task list for current sub-tab */}
      <TaskList
        tasks={tasks}
        projectId={project.id}
        status={activeSubTab}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onCreateTask={onCreateTask}
        onBulkUpdateTasks={onBulkUpdateTasks}
        showBulkActions={true}
        selectedTaskIds={selectedTaskIds}
        onToggleTaskSelection={onToggleTaskSelection}
      />
    </div>
  );
};

// Sessions Tab Component
interface SessionsTabProps {
  project: Project;
}

const SessionsTab: React.FC<SessionsTabProps> = ({ project }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const resp = await firebaseSessionApi.getSessions(1, 50, { projectId: project.id });
        setSessions(resp.sessions);
      } catch (e) {
        console.error('Failed to load project sessions', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [project.id]);

  const formatDuration = (seconds: number): string => {
    const m = Math.round(seconds / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem ? `${h}h ${rem}m` : `${h}h`;
  };

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (date: Date): string => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getVisibilityIcon = (visibility?: string) => {
    switch (visibility) {
      case 'everyone': return '🌍';
      case 'followers': return '👥';
      case 'private': return '🔒';
      default: return '🔒';
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">⏱️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions yet</h3>
          <p className="text-gray-600 mb-6">Start tracking your work to see sessions here</p>
          <button className="bg-orange-500 text-white px-6 py-2.5 rounded-lg hover:bg-orange-600 transition-colors font-medium">
            Start Timer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sessions.map((s) => (
            <div 
              key={s.id} 
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {s.title || 'Untitled Session'}
                    </h4>
                    <span className="text-sm opacity-60">{getVisibilityIcon(s.visibility)}</span>
                  </div>
                  {s.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{s.description}</p>
                  )}
                </div>
                <div className="ml-4 flex flex-col items-end">
                  <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg font-bold text-lg">
                    {formatDuration(s.duration)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(s.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatTime(s.startTime)}</span>
                  </div>
                </div>
                
                {s.tags && s.tags.length > 0 && (
                  <div className="flex gap-1.5">
                    {s.tags.slice(0, 3).map((tag, idx) => (
                      <span 
                        key={idx}
                        className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {s.tags.length > 3 && (
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                        +{s.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {s.tasks && s.tasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span className="text-gray-600">
                      {s.tasks.length} task{s.tasks.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 truncate max-w-md">
                      {s.tasks.map(t => t.name).join(', ')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Profile Tab Component
interface ProfileTabProps {
  project: Project;
  stats: ProjectStats | null;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ project, stats }) => {
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Project Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {/* Project Icon */}
        <div className={`w-24 h-24 ${colorClass} rounded-2xl flex items-center justify-center mb-4 p-3`}>
          <IconRenderer iconName={project.icon} size={72} />
        </div>

        {/* Name and Description */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
        {project.description && (
          <p className="text-gray-600 mb-4">{project.description}</p>
        )}

        {/* Project Stats */}
        <div className="flex gap-8 mb-4">
          <div>
            <div className="text-sm text-gray-600">Total Hours</div>
            <div className="text-xl font-bold">
              {(stats?.totalHours || 0).toFixed(1)}h
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Sessions</div>
            <div className="text-xl font-bold">
              {stats?.sessionCount || 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Status</div>
            <div className="text-xl font-bold capitalize">
              {project.status}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="text-sm text-gray-600 space-y-1">
          <div>Created: {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          {project.updatedAt && (
            <div>Last updated: {new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          )}
        </div>
      </div>

      {/* Goals Section (if targets are set) */}
      {(project.weeklyTarget || project.totalTarget) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Goals</h2>
          <div className="space-y-4">
            {project.weeklyTarget && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Weekly Target</span>
                  <span className="font-medium">{(stats?.weeklyHours || 0).toFixed(1)}h / {project.weeklyTarget}h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${colorClass} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(100, stats?.weeklyProgressPercentage || 0)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {(stats?.weeklyProgressPercentage || 0).toFixed(1)}% complete
                </div>
              </div>
            )}

            {project.totalTarget && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Total Target</span>
                  <span className="font-medium">{(stats?.totalHours || 0).toFixed(1)}h / {project.totalTarget}h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${colorClass} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(100, stats?.totalProgressPercentage || 0)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {(stats?.totalProgressPercentage || 0).toFixed(1)}% complete
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
