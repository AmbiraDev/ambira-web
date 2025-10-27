'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SessionWithDetails, FeedFilters } from '@/types';
import { firebaseApi } from '@/lib/api';
import SessionCard from './SessionCard';
import { useFeedInfinite } from '@/features/feed/hooks';
import { useSupportSession, useDeleteSession } from '@/features/sessions/hooks';
import { useAuth } from '@/hooks/useAuth';
import ConfirmDialog from './ConfirmDialog';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Users, Search, ChevronUp } from 'lucide-react';

// Session Card Skeleton Component
const SessionCardSkeleton: React.FC = () => (
  <div className="bg-white border-b md:border md:border-gray-200 md:rounded-lg p-4 animate-pulse">
    {/* Header - User Info */}
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
    </div>

    {/* Session Title */}
    <div className="mb-3">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
    </div>

    {/* Description */}
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>

    {/* Stats Bar */}
    <div className="flex items-center gap-4 py-3 mb-3 border-t border-b border-gray-100">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
      <div className="h-4 bg-gray-200 rounded w-24"></div>
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </div>

    {/* Action Buttons */}
    <div className="flex items-center justify-between">
      <div className="flex gap-4">
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-12"></div>
    </div>
  </div>
);

interface FeedProps {
  filters?: FeedFilters;
  className?: string;
  initialLimit?: number;
  showEndMessage?: boolean;
  showGroupInfo?: boolean;
}

export const Feed: React.FC<FeedProps> = ({
  filters = {},
  className = '',
  initialLimit = 10,
  showEndMessage = true,
  showGroupInfo = false
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hasNewSessions, setHasNewSessions] = useState(false);
  const [newSessionsCount, setNewSessionsCount] = useState(0);
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ref for infinite scroll trigger element
  const loadMoreTriggerRef = React.useRef<HTMLDivElement>(null);

  // Use new infinite scroll hook
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useFeedInfinite(user?.id || '', filters, initialLimit);

  // Flatten pages into allSessions
  const allSessions = useMemo(() => {
    return data?.pages.flatMap(page => page.sessions) || [];
  }, [data]);

  const hasMore = hasNextPage || false;
  const isLoadingMore = isFetchingNextPage;

  // New mutations using feature hooks
  const supportMutation = useSupportSession(user?.id);
  const deleteSessionMutation = useDeleteSession();

  // Refresh sessions and invalidate cache
  const refreshSessions = useCallback(() => {
    setHasNewSessions(false);
    setNewSessionsCount(0);
    // Invalidate all feed caches to force refetch
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    refetch();
  }, [refetch, queryClient]);

  // Auto-refresh feed when coming from session creation
  useEffect(() => {
    const shouldRefresh = searchParams?.get('refresh');
    if (shouldRefresh === 'true') {
      // Clear the URL parameter
      router.replace('/', { scroll: false });
      // Trigger immediate refresh
      refreshSessions();
    }
  }, [searchParams, router, refreshSessions]);

  // Load more sessions - now uses React Query infinite scroll
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchNextPage();
    }
  }, [isLoadingMore, hasMore, fetchNextPage]);

  // Check for new sessions periodically - only when page is visible
  useEffect(() => {
    if (allSessions.length === 0) return;

    // Track if page is currently visible
    let isPageVisible = !document.hidden;

    const checkForNewSessions = async () => {
      // Skip check if page is not visible
      if (!isPageVisible) return;

      try {
        // Use queryClient to check cache first, then fetch if stale
        const cachedData = queryClient.getQueryData(['feed', 'sessions', 5, undefined, filters]);

        let response;
        if (cachedData) {
          response = cachedData as { sessions: any[] };
        } else {
          response = await firebaseApi.post.getFeedSessions(5, undefined, filters);
        }

        const newSessionIds = response.sessions.map(s => s.id);
        const currentSessionIds = allSessions.slice(0, 5).map(s => s.id);

        const newCount = newSessionIds.filter(id => !currentSessionIds.includes(id)).length;
        if (newCount > 0) {
          setHasNewSessions(true);
          setNewSessionsCount(newCount);
        }
      } catch (err) {
        // Silently fail
      }
    };

    // Update visibility state when page visibility changes
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      // Check immediately when page becomes visible
      if (isPageVisible) {
        checkForNewSessions();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check every 2 minutes when visible (reduced frequency saves resources)
    const interval = setInterval(checkForNewSessions, 120000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [allSessions, filters, queryClient]);

  // Handle support with optimistic updates via React Query
  const handleSupport = useCallback(async (sessionId: string) => {
    supportMutation.mutate({ sessionId, action: 'support' });
  }, [supportMutation]);

  // Handle remove support with optimistic updates via React Query
  const handleRemoveSupport = useCallback(async (sessionId: string) => {
    supportMutation.mutate({ sessionId, action: 'unsupport' });
  }, [supportMutation]);

  // Handle share
  const handleShare = useCallback(async (sessionId: string) => {
    try {
      const sessionUrl = `${window.location.origin}/sessions/${sessionId}`;

      if (navigator.share) {
        // Use native share API on mobile
        await navigator.share({
          title: 'Check out this session on Ambira',
          text: 'Look at this productive session!',
          url: sessionUrl
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(sessionUrl);
        // Could show success toast here
      }
    } catch (err: any) {
      // Silently ignore if user cancels the share dialog
      if (err.name === 'AbortError') {
        return;
      }
      // Could show error toast here
    }
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (sessionId: string) => {
    setDeleteConfirmSession(sessionId);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmSession) return;

    try {
      setIsDeleting(true);
      await deleteSessionMutation.mutateAsync(deleteConfirmSession);
      setDeleteConfirmSession(null);
    } catch (err: any) {
      // Could show error toast here
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmSession, deleteSessionMutation]);

  // Memoize top 10 session IDs string to create stable dependency
  // This prevents useEffect from re-running when sessions array changes but top 10 IDs remain same
  const top10SessionIdsString = useMemo(() => {
    const MAX_LISTENERS = 10;
    return allSessions.slice(0, MAX_LISTENERS).map(session => session.id).join(',');
  }, [allSessions]);

  // Real-time updates for support counts (throttled to reduce reads)
  // Only listen to the first 10 sessions to reduce overhead
  useEffect(() => {
    if (allSessions.length === 0 || !top10SessionIdsString) return;

    // Parse session IDs from memoized string
    const sessionIds = top10SessionIdsString.split(',').filter(Boolean);
    if (sessionIds.length === 0) return;

    const unsubscribe = firebaseApi.post.listenToSessionUpdates(sessionIds, (updates) => {
      setAllSessions(prev => prev.map(session => {
        const update = updates[session.id];
        if (update) {
          return {
            ...session,
            supportCount: update.supportCount > 0 ? update.supportCount : session.supportCount,
            isSupported: update.isSupported !== undefined ? update.isSupported : session.isSupported
          };
        }
        return session;
      }));
    });

    return unsubscribe;
  }, [top10SessionIdsString]); // Only re-run when top 10 IDs change

  // Infinite scroll using IntersectionObserver
  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      {
        root: null, // viewport
        rootMargin: '200px', // Trigger 200px before reaching the element
        threshold: 0,
      }
    );

    observer.observe(trigger);

    return () => {
      if (trigger) {
        observer.unobserve(trigger);
      }
    };
  }, [loadMore, hasMore, isLoadingMore]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <SessionCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    const errorMessage = String(error);
    const isPermissionError = errorMessage.includes('permission') || errorMessage.includes('insufficient');

    return (
      <div className={`text-center py-8 px-4 ${className}`} role="alert" aria-live="polite">
        <div className="text-red-600 mb-4">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2" aria-hidden="true" />
          <p className="font-medium text-sm sm:text-base">Failed to load sessions</p>
          <p className="text-sm text-gray-600 mt-1">
            {isPermissionError
              ? 'There was a permissions issue loading the feed. This may be due to security rules that need updating.'
              : errorMessage
            }
          </p>
          {isPermissionError && (
            <p className="text-xs text-gray-500 mt-2">
              If you're the app administrator, try deploying the latest Firestore security rules.
            </p>
          )}
        </div>
        <button
          onClick={refreshSessions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (allSessions.length === 0) {
    // Determine empty state content based on feed type
    const feedType = filters?.type || 'all';

    let emptyStateContent = {
      title: 'Your feed is empty',
      message: 'Follow people to see their productive sessions in your feed and get inspired by their work!',
      buttonText: 'Find People to Follow',
      buttonAction: () => router.push('/discover/people')
    };

    if (feedType === 'group-members-unfollowed') {
      emptyStateContent = {
        title: 'No sessions yet',
        message: 'When group members you don\'t follow post sessions, they\'ll appear here!',
        buttonText: 'Discover Groups',
        buttonAction: () => router.push('/groups')
      };
    } else if (feedType === 'user') {
      emptyStateContent = {
        title: 'No sessions yet',
        message: 'Start tracking your productive sessions to build your profile!',
        buttonText: 'Start a Session',
        buttonAction: () => router.push('/timer')
      };
    } else if (feedType === 'following') {
      emptyStateContent = {
        title: 'Your feed is empty',
        message: 'Follow people to see their productive sessions in your feed and get inspired by their work!',
        buttonText: 'Find People to Follow',
        buttonAction: () => router.push('/discover/people')
      };
    }

    return (
      <div className={`text-center py-12 px-4 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="text-gray-500 mb-8">
            <Users className="w-20 h-20 mx-auto mb-4 text-gray-400" />
            <h3 className="font-bold text-xl text-gray-900 mb-2">{emptyStateContent.title}</h3>
            <p className="text-base text-gray-600 leading-relaxed">
              {emptyStateContent.message}
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={emptyStateContent.buttonAction}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0051D5] transition-colors duration-200 font-semibold text-base shadow-md hover:shadow-lg"
          >
            <Search className="w-5 h-5" />
            {emptyStateContent.buttonText}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* New sessions indicator */}
      {hasNewSessions && (
        <div className="mb-4 sticky top-0 z-10">
          <button
            onClick={refreshSessions}
            className="w-full py-3 px-3 sm:px-4 bg-gradient-to-r from-[#007AFF] to-[#0051D5] text-white rounded-lg shadow-lg hover:shadow-xl transition-colors duration-200 flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
            aria-label={`${newSessionsCount} new sessions available, click to refresh`}
          >
            <ChevronUp className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">
              {newSessionsCount} new {newSessionsCount === 1 ? 'session' : 'sessions'} - Click to refresh
            </span>
          </button>
        </div>
      )}

      {/* Sessions */}
      <div className="space-y-0 md:space-y-0">
        {allSessions.map((session, index) => {
          const isOwnSession = user && session.userId === user.id;
          // First 2 sessions are above the fold on most screens
          const isAboveFold = index < 2;
          return (
            <SessionCard
              key={session.id}
              session={session}
              onSupport={handleSupport}
              onRemoveSupport={handleRemoveSupport}
              onShare={handleShare}
              onEdit={isOwnSession ? (sessionId) => router.push(`/sessions/${sessionId}/edit`) : undefined}
              onDelete={isOwnSession ? handleDelete : undefined}
              showGroupInfo={showGroupInfo}
              isAboveFold={isAboveFold}
              priority={isAboveFold}
            />
          );
        })}
      </div>

      {/* Infinite scroll trigger element */}
      {hasMore && !isLoadingMore && (
        <div ref={loadMoreTriggerRef} className="h-4" aria-hidden="true" />
      )}

      {/* Load more indicator */}
      {isLoadingMore && (
        <div className="text-center py-4" role="status" aria-live="polite">
          <div className="inline-flex items-center space-x-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" aria-hidden="true"></div>
            <span className="text-sm">Loading more sessions...</span>
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

      {/* End of feed */}
      {showEndMessage && !hasMore && allSessions.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          You've reached the end of the feed
        </div>
      )}
    </div>
  );
};

export default Feed;
