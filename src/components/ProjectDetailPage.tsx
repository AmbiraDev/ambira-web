'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Project, ProjectStats } from '@/types';
import { useProject, useProjects } from '@/contexts/ProjectsContext';
import { useTasks } from '@/contexts/TasksContext';
import { CreateProjectModal } from './CreateProjectModal';
import { TaskList } from './TaskList';

interface ProjectDetailPageProps {
  projectId: string;
}

type TabType = 'overview' | 'tasks' | 'sessions';

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ projectId }) => {
  const router = useRouter();
  const { project, isLoading } = useProject(projectId);
  const { getProjectStats, updateProject, deleteProject, archiveProject } = useProjects();
  const { tasks, createTask, updateTask, deleteTask, bulkUpdateTasks, loadProjectTasks } = useTasks();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
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
          <div className="text-gray-400 text-6xl mb-4">📁</div>
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
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'sessions', label: 'Sessions', icon: '⏱️' },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-16 h-16 ${colorClass} rounded-lg flex items-center justify-center text-white text-2xl`}>
            {project.icon}
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
        {activeTab === 'overview' && (
          <OverviewTab project={project} stats={stats} isLoadingStats={isLoadingStats} />
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

// Overview Tab Component
interface OverviewTabProps {
  project: Project;
  stats: ProjectStats | null;
  isLoadingStats: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ project, stats, isLoadingStats }) => {
  if (isLoadingStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Hours</div>
          <div className="text-2xl font-bold text-gray-900">{(stats?.totalHours || 0).toFixed(1)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Weekly Hours</div>
          <div className="text-2xl font-bold text-gray-900">{(stats?.weeklyHours || 0).toFixed(1)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Sessions</div>
          <div className="text-2xl font-bold text-gray-900">{stats?.sessionCount || 0}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Current Streak</div>
          <div className="text-2xl font-bold text-gray-900">{stats?.currentStreak || 0} days</div>
        </div>
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        {project.weeklyTarget && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">This week</span>
                <span className="font-medium">{(stats?.weeklyHours || 0).toFixed(1)}h / {project.weeklyTarget}h</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, stats?.weeklyProgressPercentage || 0)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600">
                {(stats?.weeklyProgressPercentage || 0).toFixed(1)}% complete
              </div>
            </div>
          </div>
        )}

        {/* Total Progress */}
        {project.totalTarget && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Progress</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overall</span>
                <span className="font-medium">{(stats?.totalHours || 0).toFixed(1)}h / {project.totalTarget}h</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, stats?.totalProgressPercentage || 0)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600">
                {(stats?.totalProgressPercentage || 0).toFixed(1)}% complete
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>Activity chart coming soon</p>
        </div>
      </div>
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
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Sessions</h3>
        <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
          Start Timer
        </button>
      </div>
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">⏱️</div>
        <p>Session tracking coming soon</p>
      </div>
    </div>
  );
};
