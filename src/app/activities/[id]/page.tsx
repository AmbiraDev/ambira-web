'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import { IconRenderer } from '@/components/IconRenderer';
import { useProjects } from '@/contexts/ProjectsContext';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseApi } from '@/lib/firebaseApi';
import { Project, ProjectStats, SessionWithDetails } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, TrendingUp, Settings, ChevronDown, Play } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

type ActivityTab = 'overview' | 'sessions' | 'analytics';
type TimePeriod = 'day' | 'week' | 'month' | 'year';

interface ChartDataPoint {
  name: string;
  hours: number;
}

function ProjectDetailContent({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { projects, getProjectStats } = useProjects();

  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [activeTab, setActiveTab] = useState<ActivityTab>('overview');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    loadProjectData();
  }, [projectId, projects]);

  useEffect(() => {
    processChartData();
  }, [sessions, timePeriod]);

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

      // Load sessions
      setIsLoadingSessions(true);
      try {
        if (user?.id) {
          const userSessions = await firebaseApi.session.getUserSessions(
            user.id,
            50,
            true
          );
          // Filter sessions for this project
          const projectSessions = userSessions.filter(s =>
            s.activityId === projectId || s.projectId === projectId
          );
          setSessions(projectSessions);
        }
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

  const processChartData = () => {
    const now = new Date();
    const data: ChartDataPoint[] = [];

    if (timePeriod === 'day') {
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now);
        hour.setHours(hour.getHours() - i);
        const hourLabel = hour.getHours().toString().padStart(2, '0');

        const hoursWorked = sessions.length > 0 ? sessions
          .filter(s => {
            const sessionDate = new Date(s.createdAt);
            return sessionDate.getHours() === hour.getHours() &&
                   sessionDate.toDateString() === hour.toDateString();
          })
          .reduce((sum, s) => sum + s.duration / 3600, 0) : 0;

        data.push({ name: hourLabel, hours: Number(hoursWorked.toFixed(2)) });
      }
    } else if (timePeriod === 'week') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);

        const hoursWorked = sessions.length > 0 ? sessions
          .filter(s => new Date(s.createdAt).toDateString() === day.toDateString())
          .reduce((sum, s) => sum + s.duration / 3600, 0) : 0;

        data.push({
          name: dayNames[day.getDay()],
          hours: Number(hoursWorked.toFixed(2))
        });
      }
    } else if (timePeriod === 'month') {
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));

        const hoursWorked = sessions.length > 0 ? sessions
          .filter(s => {
            const sessionDate = new Date(s.createdAt);
            return sessionDate >= weekStart && sessionDate <= weekEnd;
          })
          .reduce((sum, s) => sum + s.duration / 3600, 0) : 0;

        data.push({
          name: `Week ${4 - i}`,
          hours: Number(hoursWorked.toFixed(2))
        });
      }
    } else if (timePeriod === 'year') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(month.getMonth() - i);

        const hoursWorked = sessions.length > 0 ? sessions
          .filter(s => {
            const sessionDate = new Date(s.createdAt);
            return sessionDate.getMonth() === month.getMonth() &&
                   sessionDate.getFullYear() === month.getFullYear();
          })
          .reduce((sum, s) => sum + s.duration / 3600, 0) : 0;

        data.push({
          name: monthNames[month.getMonth()],
          hours: Number(hoursWorked.toFixed(2))
        });
      }
    }

    setChartData(data);
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
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  const getPeriodLabel = (period: TimePeriod): string => {
    switch (period) {
      case 'day':
        return 'Last 24 Hours';
      case 'week':
        return 'Last 7 Days';
      case 'month':
        return 'Last 4 Weeks';
      case 'year':
        return 'Last 12 Months';
      default:
        return 'Last 7 Days';
    }
  };

  if (isLoading || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Main Content */}
        <div className="flex-1">
            {/* Activity Header */}
            <div className="mb-6">
              <div className="flex items-start gap-4">
                {/* Activity Icon */}
                <div
                  className="w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md bg-gray-100"
                >
                  <IconRenderer iconName={project.icon} size={64} />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Activity Name and Settings Icon */}
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                    <button
                      onClick={() => router.push(`/activities/${projectId}/edit`)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Edit activity"
                    >
                      <Settings className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-gray-700 mb-4 whitespace-pre-line max-h-24 overflow-y-auto">{project.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex gap-8" aria-label="Activity tabs">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'sessions'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sessions
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'analytics'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analytics
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Overview content */}
                </div>
              )}

              {activeTab === 'sessions' && (
                <div>
                  {/* Sessions content */}
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Analytics content */}
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
