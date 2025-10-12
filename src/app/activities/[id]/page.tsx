'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import { IconRenderer } from '@/components/IconRenderer';
import { useProjects } from '@/contexts/ProjectsContext';
import { useTasks } from '@/contexts/TasksContext';
import { firebaseApi } from '@/lib/firebaseApi';
import { Project, ProjectStats, Task, Session, SessionWithDetails } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Target, TrendingUp, CheckCircle2, Circle, Plus, Edit, Trash2 } from 'lucide-react';

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function ProjectDetailContent({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { projects, getProjectStats, updateProject, deleteProject } = useProjects();
  const { tasks: allTasks, loadProjectTasks, createTask, updateTask, deleteTask } = useTasks();

  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [newTaskName, setNewTaskName] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [projectId, projects]);

  const loadProjectData = async () => {
    try {
      setIsLoading(true);

      // Find project in context
      const foundProject = projects.find(p => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
      }

      // Load stats
      setIsLoadingStats(true);
      try {
        const projectStats = await getProjectStats(projectId);
        setStats(projectStats);
      } catch (error) {
        console.error('Error loading project stats:', error);
      } finally {
        setIsLoadingStats(false);
      }

      // Load tasks
      try {
        await loadProjectTasks(projectId);
        const projectTasks = allTasks.filter(t => t.activityId === projectId || t.projectId === projectId);
        setTasks(projectTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      }

      // Load sessions
      setIsLoadingSessions(true);
      try {
        const userSessions = await firebaseApi.session.getUserSessions(
          firebaseApi.auth.getCurrentUserId(),
          50,
          true
        );
        // Filter sessions for this project
        const projectSessions = userSessions.filter(s =>
          s.activityId === projectId || s.projectId === projectId
        );
        setSessions(projectSessions.slice(0, 10)); // Show latest 10
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setIsLoadingSessions(false);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskName.trim() || isCreatingTask) return;

    try {
      setIsCreatingTask(true);
      await createTask({
        name: newTaskName.trim(),
        activityId: projectId,
      });
      setNewTaskName('');
      await loadProjectTasks(projectId);
      const projectTasks = allTasks.filter(t => t.activityId === projectId || t.projectId === projectId);
      setTasks(projectTasks);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      await updateTask(task.id, {
        status: task.status === 'completed' ? 'active' : 'completed',
      }, projectId);
      await loadProjectTasks(projectId);
      const projectTasks = allTasks.filter(t => t.activityId === projectId || t.projectId === projectId);
      setTasks(projectTasks);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
              <div className="h-24 bg-gray-200 rounded-lg"></div>
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const activeTasks = tasks.filter(t => t.status === 'active');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const weeklyProgress = project.weeklyTarget && stats
    ? (stats.weeklyHours / project.weeklyTarget) * 100
    : 0;
  const totalProgress = project.totalTarget && stats
    ? (stats.totalHours / project.totalTarget) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/activities')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Activities</span>
        </button>

        {/* Project Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
          <div className="flex items-start gap-6">
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: project.color }}
            >
              <IconRenderer iconName={project.icon} size={48} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-gray-600 text-lg mb-4">{project.description}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/timer')}
                  className="bg-[#007AFF] text-white px-6 py-2.5 rounded-lg hover:bg-[#0051D5] transition-colors font-medium"
                >
                  Start Timer
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement edit functionality
                    alert('Edit functionality coming soon');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#007AFF]" />
              </div>
              <div className="text-sm font-medium text-gray-600">Total Hours</div>
            </div>
            {isLoadingStats ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <div className="text-3xl font-bold text-gray-900">
                {(stats?.totalHours || 0).toFixed(1)}h
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#34C759]" />
              </div>
              <div className="text-sm font-medium text-gray-600">This Week</div>
            </div>
            {isLoadingStats ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <div className="text-3xl font-bold text-gray-900">
                {(stats?.weeklyHours || 0).toFixed(1)}h
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm font-medium text-gray-600">Sessions</div>
            </div>
            {isLoadingStats ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <div className="text-3xl font-bold text-gray-900">
                {stats?.sessionCount || 0}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-sm font-medium text-gray-600">Tasks Done</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {completedTasks.length}
            </div>
          </div>
        </div>

        {/* Goals Progress */}
        {(project.weeklyTarget || project.totalTarget) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Goals</h2>
            <div className="space-y-6">
              {project.weeklyTarget && (
                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                    <span>Weekly Target</span>
                    <span className="text-gray-900">
                      {(stats?.weeklyHours || 0).toFixed(1)}h / {project.weeklyTarget}h
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-300 shadow-sm"
                      style={{
                        width: `${Math.min(100, weeklyProgress)}%`,
                        backgroundColor: project.color
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {project.totalTarget && (
                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                    <span>Total Target</span>
                    <span className="text-gray-900">
                      {(stats?.totalHours || 0).toFixed(1)}h / {project.totalTarget}h
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-300 shadow-sm"
                      style={{
                        width: `${Math.min(100, totalProgress)}%`,
                        backgroundColor: project.color
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tasks Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tasks</h2>

            {/* Add Task */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                placeholder="Add a new task..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
              />
              <button
                onClick={handleCreateTask}
                disabled={!newTaskName.trim() || isCreatingTask}
                className="bg-[#007AFF] text-white px-4 py-2 rounded-lg hover:bg-[#0051D5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Active Tasks */}
            {activeTasks.length > 0 && (
              <div className="space-y-2 mb-4">
                {activeTasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="flex-shrink-0"
                    >
                      <Circle className="w-5 h-5 text-gray-400 hover:text-[#007AFF] transition-colors" />
                    </button>
                    <span className="flex-1 text-gray-900">{task.name}</span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">
                  Completed ({completedTasks.length})
                </div>
                <div className="space-y-2">
                  {completedTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group opacity-60"
                    >
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="flex-shrink-0"
                      >
                        <CheckCircle2 className="w-5 h-5 text-[#34C759]" />
                      </button>
                      <span className="flex-1 text-gray-600 line-through">{task.name}</span>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tasks yet. Add one to get started!</p>
              </div>
            )}
          </div>

          {/* Recent Sessions Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Sessions</h2>
              <Link
                href={`/activities?project=${projectId}`}
                className="text-sm text-[#007AFF] hover:text-[#0051D5] font-medium"
              >
                View All
              </Link>
            </div>

            {isLoadingSessions ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map(session => (
                  <Link
                    key={session.id}
                    href={`/post/${session.id}`}
                    className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{session.title}</h3>
                      <span className="text-sm font-medium text-gray-900">
                        {formatTime(session.duration)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{formatDate(session.startTime)}</span>
                      {session.tasks && session.tasks.length > 0 && (
                        <span>{session.tasks.length} tasks</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No sessions yet. Start a timer to track your work!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPageWrapper({ params }: ProjectDetailPageProps) {
  const [projectId, setProjectId] = React.useState<string>('');

  React.useEffect(() => {
    params.then(({ id }) => setProjectId(id));
  }, [params]);

  return (
    <ProtectedRoute>
      {!projectId ? (
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-[1400px] mx-auto px-4 py-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        <ProjectDetailContent projectId={projectId} />
      )}
    </ProtectedRoute>
  );
}
