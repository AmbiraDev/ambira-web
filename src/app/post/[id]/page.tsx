'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import { SessionWithDetails, CommentWithDetails } from '@/types';
import { firebaseApi } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, Eye, TrendingUp } from 'lucide-react';

type ActivityTab = 'overview' | 'comments';

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
  const [activeTab, setActiveTab] = useState<ActivityTab>('overview');
  const [isSupporting, setIsSupporting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  useEffect(() => {
    if (activityId && user) {
      loadSessionData();
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, user]);

  const loadSessionData = async () => {
    try {
      setIsLoading(true);
      const sessionData =
        await firebaseApi.session.getSessionWithDetails(activityId);
      setSession(sessionData as unknown as SessionWithDetails);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isPermissionError =
        errorMessage.includes('permission') ||
        errorMessage.includes('Permission');
      const isNotFound =
        errorMessage.includes('not found') ||
        errorMessage.includes('Not found');

      if (isPermissionError || isNotFound) {
        setSession(null);
      } else {
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isPermissionError =
        errorMessage.includes('permission') ||
        errorMessage.includes('Permission');
      if (!isPermissionError) {
        console.error('Error loading comments:', error);
      }
    }
  };

  const handleSupport = async () => {
    if (!session || isSupporting) return;

    try {
      setIsSupporting(true);
      if (session.isSupported) {
        await firebaseApi.post.removeSupportFromSession(session.id);
      } else {
        await firebaseApi.post.supportSession(session.id);
      }
      await loadSessionData();
    } catch {
      console.error('Error toggling support');
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
    } catch {
      console.error('Error posting comment');
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const activityDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    // Format time as "h:mm am/pm"
    const timeStr = new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Check if today
    if (activityDate.getTime() === today.getTime()) {
      return `Today at ${timeStr}`;
    }

    // Check if yesterday
    if (activityDate.getTime() === yesterday.getTime()) {
      return `Yesterday at ${timeStr}`;
    }

    // Otherwise show full date: "Month Day, Year at h:mm am/pm"
    const dateStr = new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return `${dateStr} at ${timeStr}`;
  };

  // Calculate engagement metrics (X-like analytics)
  const totalEngagements =
    (session?.supportCount || 0) + (session?.commentCount || 0);
  const impressions = 0; // Placeholder - would need to implement view tracking
  const engagementRate =
    impressions > 0
      ? ((totalEngagements / impressions) * 100).toFixed(1)
      : '0.0';

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to view activities
          </h1>
          <p className="text-gray-600">
            You need to be logged in to view activity details.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="h-48 bg-gray-200 rounded-xl"></div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Unable to view activity
            </h1>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              This activity doesn't exist, has been deleted, or is set to
              private.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#0066CC] text-white px-6 py-2.5 rounded-lg hover:bg-[#0051D5] transition-colors"
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Activity Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
          {/* User Info Bar */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <Link
              href={`/profile/${session.user.username}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit"
            >
              {session.user.profilePicture ? (
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100">
                  <Image
                    src={session.user.profilePicture}
                    alt={session.user.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FC4C02] to-[#FC4C02]/80 flex items-center justify-center ring-2 ring-gray-100">
                  <span className="text-white font-semibold text-lg">
                    {session.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <div className="font-semibold text-gray-900">
                  {session.user.name}
                </div>
                <div className="text-sm text-gray-500">
                  @{session.user.username}
                </div>
              </div>
            </Link>
          </div>

          {/* Activity Content */}
          <div className="px-6 py-6">
            {/* Activity Badge */}
            <Link
              href={`/activities/${session.activityId}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors mb-4"
            >
              <span className="text-xl">{session.activity.icon || '📊'}</span>
              <span className="text-sm font-medium text-gray-900">
                {session.activity.name}
              </span>
            </Link>

            {/* Title & Description */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {session.title}
            </h1>
            {session.description && (
              <p className="text-gray-700 text-lg mb-4 whitespace-pre-line">
                {session.description}
              </p>
            )}

            {/* Duration & Date */}
            <div className="flex items-center gap-4 text-gray-500 text-sm mb-6">
              <span className="font-medium text-gray-900">
                {formatTime(session.duration)}
              </span>
              <span>•</span>
              <span>{formatTimeAgo(session.createdAt)}</span>
              {session.showStartTime && (
                <>
                  <span>•</span>
                  <span>
                    {new Date(session.startTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </>
              )}
            </div>

            {/* Engagement Stats Bar */}
            <div className="flex items-center gap-6 text-gray-600 text-sm border-t border-gray-100 pt-4">
              <button className="flex items-center gap-2 hover:text-gray-900 transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>{session.commentCount}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-gray-900 transition-colors">
                <Heart
                  className={`w-4 h-4 ${session.isSupported ? 'fill-red-500 text-red-500' : ''}`}
                />
                <span>{session.supportCount}</span>
              </button>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{impressions}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={handleSupport}
              disabled={isSupporting}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all font-medium ${
                session.isSupported
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <Heart
                className={`w-5 h-5 ${session.isSupported ? 'fill-current' : ''}`}
              />
              <span>{session.isSupported ? 'Supported' : 'Support'}</span>
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0066CC] text-white rounded-xl hover:bg-[#0051D5] transition-colors font-medium border border-[#0066CC]"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Comment</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 bg-white rounded-t-xl">
          <nav className="flex gap-8 px-6" aria-label="Activity tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
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
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Engagement Overview - X Style */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Engagement
                </h3>

                {/* Main Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-center mb-2">
                      <Eye className="w-6 h-6 text-[#0066CC]" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {impressions}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Impressions
                    </div>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-center mb-2">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {totalEngagements}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Engagements
                    </div>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-center mb-2">
                      <Heart className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {session.supportCount}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Supports</div>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-center mb-2">
                      <MessageCircle className="w-6 h-6 text-[#0066CC]" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {session.commentCount}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Comments</div>
                  </div>
                </div>

                {/* Engagement Rate */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium text-gray-600">
                        Engagement Rate
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Engagements ÷ Impressions
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {engagementRate}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0066CC] to-[#0051D5] h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, parseFloat(engagementRate))}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Engagement Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Engagement Breakdown
                </h3>

                <div className="space-y-4">
                  {/* Supports */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Supports
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {session.supportCount} (
                        {totalEngagements > 0
                          ? Math.round(
                              (session.supportCount / totalEngagements) * 100
                            )
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${totalEngagements > 0 ? (session.supportCount / totalEngagements) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Comments */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-[#0066CC]" />
                        <span className="text-sm font-medium text-gray-700">
                          Comments
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {session.commentCount} (
                        {totalEngagements > 0
                          ? Math.round(
                              (session.commentCount / totalEngagements) * 100
                            )
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#0066CC] h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${totalEngagements > 0 ? (session.commentCount / totalEngagements) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Details */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Activity Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="font-semibold text-gray-900">
                      {formatTime(session.duration)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Date</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(session.startTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Visibility</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {session.visibility}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-600">Activity</span>
                    <Link
                      href={`/activities/${session.activityId}`}
                      className="text-sm font-medium text-[#0066CC] hover:text-[#0051D5] transition-colors"
                    >
                      {session.activity.name}
                    </Link>
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
                  <h3 className="text-base font-medium text-gray-900 mb-4">
                    Add a comment
                  </h3>
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handlePostComment}
                      disabled={!newComment.trim() || isPostingComment}
                      className="bg-[#0066CC] text-white px-6 py-2 rounded-lg hover:bg-[#0051D5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {isPostingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-medium text-gray-900 mb-6">
                  Comments ({comments.length})
                </h3>
                {comments.length > 0 ? (
                  <div className="space-y-6">
                    {comments.map(comment => (
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
                              className="font-semibold text-gray-900 hover:text-[#0066CC] transition-colors"
                            >
                              {comment.user.name}
                            </Link>
                            <p className="text-gray-700 mt-1">
                              {comment.content}
                            </p>
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
    </div>
  );
}

export default function ActivityDetailPageWrapper({
  params,
}: ActivityDetailPageProps) {
  const [activityId, setActivityId] = React.useState<string>('');

  React.useEffect(() => {
    params.then(({ id }) => setActivityId(id));
  }, [params]);

  return (
    <ProtectedRoute>
      {!activityId ? (
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-gray-200 rounded-xl"></div>
              <div className="h-48 bg-gray-200 rounded-xl"></div>
              <div className="h-96 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      ) : (
        <ActivityDetailContent activityId={activityId} />
      )}
    </ProtectedRoute>
  );
}
