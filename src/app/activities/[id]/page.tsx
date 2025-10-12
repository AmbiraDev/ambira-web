'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import { SessionWithDetails, CommentWithDetails } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Calendar, Heart, MessageCircle, TrendingUp, Target, Flame, Activity as ActivityIcon, ArrowLeft, Award, Zap, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, ComposedChart, BarChart, Bar } from 'recharts';

type ActivityTab = 'statistics' | 'comments';
type TimePeriod = '7D' | '2W' | '4W' | '3M' | '1Y';

interface ChartDataPoint {
  name: string;
  hours: number;
  sessions?: number;
}

interface ActivityDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function ActivityDetailContent({ activityId }: { activityId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [comments, setComments] = useState<CommentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActivityTab>('statistics');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7D');
  const [isSupporting, setIsSupporting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  useEffect(() => {
    console.log('[Activity Detail Page] Mounted with ID:', activityId);
    if (activityId && user) {
      loadSessionData();
      loadComments();
    }
  }, [activityId, user]);

  const loadSessionData = async () => {
    try {
      setIsLoading(true);
      console.log('[Activity Detail] Loading session:', activityId);
      const sessionData = await firebaseApi.session.getSessionWithDetails(activityId);
      console.log('[Activity Detail] Session loaded successfully:', sessionData?.title);
      setSession(sessionData);
    } catch (error: any) {
      console.log('[Activity Detail] Error loading session:', error?.message);

      // Check if it's a permission error (expected for private/restricted sessions)
      const isPermissionError = error?.message?.includes('permission') || error?.message?.includes('Permission');
      const isNotFound = error?.message?.includes('not found') || error?.message?.includes('Not found');

      if (isPermissionError) {
        console.log('[Activity Detail] Permission denied - session is private or restricted');
        setSession(null);
      } else if (isNotFound) {
        console.log('[Activity Detail] Session not found in database');
        setSession(null);
      } else {
        // Log unexpected errors
        console.error('[Activity Detail] Unexpected error:', error);
        setSession(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await firebaseApi.comment.getSessionComments(activityId);
      setComments(response.comments);
    } catch (error: any) {
      // Check if it's a permission error (expected for private/restricted sessions)
      const isPermissionError = error?.message?.includes('permission') || error?.message?.includes('Permission');

      if (isPermissionError) {
        // This is expected - user can't view comments for restricted sessions
        setComments([]);
      } else {
        // Log unexpected errors
        console.error('Error loading comments:', error);
      }
    }
  };

  const handleSupport = async () => {
    if (!session || isSupporting) return;

    try {
      setIsSupporting(true);
      if (session.isSupported) {
        await firebaseApi.session.unsupportSession(session.id);
      } else {
        await firebaseApi.session.supportSession(session.id);
      }
      await loadSessionData();
    } catch (error) {
      console.error('Error toggling support:', error);
    } finally {
      setIsSupporting(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || isPostingComment) return;

    try {
      setIsPostingComment(true);
      await firebaseApi.comment.createComment({
        sessionId: activityId,
        content: newComment.trim(),
      });
      setNewComment('');
      await loadComments();
      await loadSessionData();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsPostingComment(false);
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(date);
  };

  // Mock chart data - in a real implementation, this would fetch historical data for this activity
  const chartData = useMemo(() => {
    if (!session) return [];

    const data: ChartDataPoint[] = [];
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (timePeriod === '7D') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);

        // For demo purposes, show this session's data on its date
        const sessionDate = new Date(session.startTime);
        const hoursWorked = day.toDateString() === sessionDate.toDateString()
          ? session.duration / 3600
          : Math.random() * 3; // Mock data for other days
        const sessionsCount = day.toDateString() === sessionDate.toDateString() ? 1 : Math.floor(Math.random() * 3);

        data.push({
          name: dayNames[day.getDay()],
          hours: Number(hoursWorked.toFixed(2)),
          sessions: sessionsCount
        });
      }
    } else if (timePeriod === '2W') {
      // Last 14 days
      for (let i = 13; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);

        const sessionDate = new Date(session.startTime);
        const hoursWorked = day.toDateString() === sessionDate.toDateString()
          ? session.duration / 3600
          : Math.random() * 3;
        const sessionsCount = day.toDateString() === sessionDate.toDateString() ? 1 : Math.floor(Math.random() * 3);

        data.push({
          name: `${dayNames[day.getDay()]} ${day.getDate()}`,
          hours: Number(hoursWorked.toFixed(2)),
          sessions: sessionsCount
        });
      }
    } else if (timePeriod === '4W') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));

        data.push({
          name: `Week ${4 - i}`,
          hours: Number((Math.random() * 10 + 5).toFixed(2)),
          sessions: Math.floor(Math.random() * 10 + 5)
        });
      }
    } else if (timePeriod === '3M') {
      // Last 3 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 2; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(month.getMonth() - i);

        data.push({
          name: monthNames[month.getMonth()],
          hours: Number((Math.random() * 40 + 20).toFixed(2)),
          sessions: Math.floor(Math.random() * 30 + 15)
        });
      }
    } else if (timePeriod === '1Y') {
      // Last 12 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(month.getMonth() - i);

        data.push({
          name: monthNames[month.getMonth()],
          hours: Number((Math.random() * 50 + 10).toFixed(2)),
          sessions: Math.floor(Math.random() * 40 + 10)
        });
      }
    }

    return data;
  }, [session, timePeriod]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view activities</h1>
          <p className="text-gray-600">You need to be logged in to view activity details.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
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

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to view activity</h1>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              This activity doesn't exist, has been deleted, or is set to private.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#007AFF] text-white px-6 py-2.5 rounded-lg hover:bg-[#0051D5] transition-colors"
            >
              Back to Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Session Header */}
            <div className="mb-6">
              <div className="flex items-start gap-6">
                {/* Session Icon/Avatar */}
                <div
                  className="w-32 h-32 rounded-full bg-gradient-to-br shadow-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${session.activity.color || '#007AFF'} 0%, ${session.activity.color || '#007AFF'}dd 100%)`
                  }}
                >
                  <span className="text-6xl">{session.activity.icon || '📊'}</span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Session Title */}
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{session.title}</h1>

                  {/* Activity Badge and User */}
                  <div className="flex items-center gap-3 mb-3">
                    <Link
                      href={`/projects/${session.activityId}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {session.activity.name}
                      </span>
                    </Link>
                    <span className="text-gray-400">•</span>
                    <Link
                      href={`/profile/${session.user.username}`}
                      className="text-sm text-gray-600 hover:text-[#007AFF] transition-colors"
                    >
                      {session.user.name}
                    </Link>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{formatTimeAgo(session.createdAt)}</span>
                  </div>

                  {/* Description */}
                  {session.description && (
                    <p className="text-gray-700 mb-4 whitespace-pre-line">{session.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex gap-8" aria-label="Activity tabs">
                <button
                  onClick={() => setActiveTab('statistics')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'statistics'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Statistics
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'comments'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Comments ({session.commentCount})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'statistics' && (
                <div className="space-y-6">
                  {/* Header with Time Period Selector */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <h2 className="text-xl font-bold text-gray-900">Session Analytics</h2>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {(['7D', '2W', '4W', '3M', '1Y'] as TimePeriod[]).map((period) => (
                          <button
                            key={period}
                            onClick={() => setTimePeriod(period)}
                            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                              timePeriod === period
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Main Chart - Hours Tracked */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">Hours Tracked</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Time spent on this activity</p>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <TrendingUp className="w-5 h-5" />
                        <span>Line chart</span>
                      </div>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={chartData}
                          margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#007AFF" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={false}
                            dy={8}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={false}
                            width={35}
                            domain={[0, 'dataMax + 0.5']}
                            tickFormatter={(value) => `${value}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(0, 0, 0, 0.85)',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              color: 'white',
                            }}
                            formatter={(value: number) => [`${value.toFixed(1)}h`, 'Hours']}
                            cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="hours"
                            stroke="none"
                            fill="url(#colorHours)"
                          />
                          <Line
                            type="monotone"
                            dataKey="hours"
                            stroke="#007AFF"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{
                              r: 4,
                              fill: '#007AFF',
                              stroke: 'white',
                              strokeWidth: 2
                            }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Secondary Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sessions Over Time */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-base font-medium text-gray-900 mb-4">Sessions over time</h3>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                          >
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 11, fill: '#9ca3af' }}
                              axisLine={false}
                              tickLine={false}
                              width={30}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '12px',
                                color: 'white',
                              }}
                            />
                            <Bar
                              dataKey="sessions"
                              fill="#007AFF"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-base font-medium text-gray-900 mb-4">Key metrics</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-sm font-medium text-gray-900">Total time</div>
                            <div className="text-xs text-gray-500">This period</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {chartData.reduce((sum, d) => sum + d.hours, 0).toFixed(1)}h
                            </div>
                            <div className="text-xs text-green-600">↑ 100%</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-sm font-medium text-gray-900">Avg per day</div>
                            <div className="text-xs text-gray-500">Average</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {(chartData.reduce((sum, d) => sum + d.hours, 0) / chartData.length).toFixed(1)}h
                            </div>
                            <div className="text-xs text-green-600">↑ 100%</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-sm font-medium text-gray-900">Peak day</div>
                            <div className="text-xs text-gray-500">Highest</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {Math.max(...chartData.map(d => d.hours)).toFixed(1)}h
                            </div>
                            <div className="text-xs text-gray-500">
                              {chartData.find(d => d.hours === Math.max(...chartData.map(d => d.hours)))?.name}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="text-sm text-gray-600 mb-1">Total hours</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {chartData.reduce((sum, d) => sum + d.hours, 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <span>↑</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="text-sm text-gray-600 mb-1">Sessions</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {chartData.reduce((sum, d) => sum + (d.sessions || 0), 0)}
                      </div>
                      <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <span>↑</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="text-sm text-gray-600 mb-1">Active days</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {chartData.filter(d => d.hours > 0).length}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        of {chartData.length}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="text-sm text-gray-600 mb-1">Consistency</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {((chartData.filter(d => d.hours > 0).length / chartData.length) * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <span>↑</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-6">
                  {/* Comment Input */}
                  {session.allowComments !== false && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-base font-medium text-gray-900 mb-4">Add a comment</h3>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={handlePostComment}
                          disabled={!newComment.trim() || isPostingComment}
                          className="bg-[#007AFF] text-white px-6 py-2 rounded-lg hover:bg-[#0051D5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isPostingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-base font-medium text-gray-900 mb-4">
                      Comments ({comments.length})
                    </h3>
                    {comments.length > 0 ? (
                      <div className="space-y-6">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Link href={`/profile/${comment.user.username}`}>
                              {comment.user.profilePicture ? (
                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                  <Image
                                    src={comment.user.profilePicture}
                                    alt={comment.user.name}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FC4C02] to-[#FC4C02]/80 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-semibold text-sm">
                                    {comment.user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </Link>
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <Link
                                  href={`/profile/${comment.user.username}`}
                                  className="font-semibold text-gray-900 hover:text-[#007AFF] transition-colors"
                                >
                                  {comment.user.name}
                                </Link>
                                <p className="text-gray-700 mt-1">{comment.content}</p>
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>{formatTimeAgo(comment.createdAt)}</span>
                                {comment.likeCount > 0 && (
                                  <span>{comment.likeCount} likes</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No comments yet. Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            {/* Session Details Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Session Details</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="font-semibold text-gray-900">{formatTime(session.duration)}</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Date</span>
                  <span className="text-sm text-gray-900">{formatDate(session.startTime)}</span>
                </div>

                {session.showStartTime && (
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Started</span>
                    <span className="text-sm text-gray-900">
                      {new Date(session.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Supports</span>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-gray-900">{session.supportCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Comments</span>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#007AFF]" />
                    <span className="font-semibold text-gray-900">{session.commentCount}</span>
                  </div>
                </div>
              </div>

              {/* Engagement Buttons */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <button
                  onClick={handleSupport}
                  disabled={isSupporting}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium ${
                    session.isSupported
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${session.isSupported ? 'fill-current' : ''}`} />
                  <span>{session.isSupported ? 'Supported' : 'Support'}</span>
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0051D5] transition-colors font-medium"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>View Comments</span>
                </button>
              </div>
            </div>

            {/* Activity Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Activity</h3>
              <Link
                href={`/projects/${session.activityId}`}
                className="block"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: session.activity.color || '#007AFF' }}
                  >
                    <span className="text-white text-2xl">{session.activity.icon || '📊'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {session.activity.name}
                    </div>
                    {session.activity.description && (
                      <div className="text-sm text-gray-600 truncate mt-0.5">
                        {session.activity.description}
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              {/* User Info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Posted by</div>
                <Link
                  href={`/profile/${session.user.username}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  {session.user.profilePicture ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-100">
                      <Image
                        src={session.user.profilePicture}
                        alt={session.user.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FC4C02] to-[#FC4C02]/80 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {session.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{session.user.name}</div>
                    <div className="text-xs text-gray-500 truncate">@{session.user.username}</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActivityDetailPageWrapper({ params }: ActivityDetailPageProps) {
  const [activityId, setActivityId] = React.useState<string>('');

  React.useEffect(() => {
    params.then(({ id }) => setActivityId(id));
  }, [params]);

  return (
    <ProtectedRoute>
      {!activityId ? (
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
        <ActivityDetailContent activityId={activityId} />
      )}
    </ProtectedRoute>
  );
}
