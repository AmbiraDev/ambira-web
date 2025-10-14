'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SessionWithDetails, FeedFilters } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';
import SessionCard from './SessionCard';
import { useFeedSessions, useFeedSessionsPaginated } from '@/hooks/useCache';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmDialog from './ConfirmDialog';
import { useSupportMutation, useDeleteSessionMutation } from '@/hooks/useMutations';
import { useQueryClient } from '@tanstack/react-query';

interface FeedProps {
  filters?: FeedFilters;
  className?: string;
  initialLimit?: number;
  showEndMessage?: boolean;
}

export const Feed: React.FC<FeedProps> = ({
  filters = {},
  className = '',
  initialLimit = 10,
  showEndMessage = true
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasNewSessions, setHasNewSessions] = useState(false);
  const [newSessionsCount, setNewSessionsCount] = useState(0);
  const [allSessions, setAllSessions] = useState<SessionWithDetails[]>([]);
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shouldLoadMore, setShouldLoadMore] = useState(false);

  // Ref for infinite scroll trigger element
  const loadMoreTriggerRef = React.useRef<HTMLDivElement>(null);

  // Use React Query for initial feed load with caching
  const { data, isLoading, error, refetch, isFetching } = useFeedSessions(initialLimit, undefined, filters, {
    enabled: true,
  });

  // Use React Query for pagination with caching
  const { data: paginatedData, isLoading: isLoadingMore, isFetching: isFetchingMore } = useFeedSessionsPaginated(
    initialLimit,
    shouldLoadMore ? nextCursor : undefined,
    filters,
    {
      enabled: shouldLoadMore && !!nextCursor,
    }
  );

  // Log cache behavior
  useEffect(() => {
    if (isFetching && !isLoading) {
      console.log('📡 Refetching initial feed data from server (cache is stale)');
    } else if (!isFetching && data) {
      console.log('✅ Using cached feed data');
    }
  }, [isFetching, isLoading, data]);

  useEffect(() => {
    if (isFetchingMore && !isLoadingMore) {
      console.log('📡 Refetching paginated data from server (cache is stale)');
    } else if (!isFetchingMore && paginatedData && shouldLoadMore) {
      console.log('✅ Using cached paginated data');
    }
  }, [isFetchingMore, isLoadingMore, paginatedData, shouldLoadMore]);

  const [hasMore, setHasMore] = useState(true);

  // Optimistic mutations
  const supportMutation = useSupportMutation(user?.id);
  const deleteSessionMutation = useDeleteSessionMutation();

  // Update sessions when initial data changes
  useEffect(() => {
    if (data) {
      console.log('=== FEED DEBUG (Initial Load) ===');
      console.log('Feed filter:', filters);
      console.log('Total sessions loaded:', data.sessions.length);
      console.log('Has more:', data.hasMore);
      console.log('Next cursor:', data.nextCursor);
      console.log('Cache status: Using React Query cache');
      console.log('==================');

      setAllSessions(data.sessions);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
      setShouldLoadMore(false); // Reset load more trigger
    }
  }, [data, filters]);

  // Handle paginated data
  useEffect(() => {
    if (paginatedData && shouldLoadMore) {
      console.log('=== FEED DEBUG (Pagination) ===');
      console.log('Paginated sessions loaded:', paginatedData.sessions.length);
      console.log('Has more:', paginatedData.hasMore);
      console.log('Next cursor:', paginatedData.nextCursor);
      console.log('Cache status: Using React Query cache');
      console.log('==================');

      setAllSessions(prev => [...prev, ...paginatedData.sessions]);
      setHasMore(paginatedData.hasMore);
      setNextCursor(paginatedData.nextCursor);
      setShouldLoadMore(false); // Reset load more trigger
    }
  }, [paginatedData, shouldLoadMore]);

  // Refresh sessions and invalidate cache
  const refreshSessions = useCallback(() => {
    setAllSessions([]);
    setNextCursor(undefined);
    setHasNewSessions(false);
    setNewSessionsCount(0);
    setShouldLoadMore(false);
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

  // Load more sessions - now uses React Query hook
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && nextCursor) {
      console.log('Triggering load more with cursor:', nextCursor);
      setShouldLoadMore(true);
    }
  }, [isLoadingMore, hasMore, nextCursor]);

  // Check for new sessions periodically - using cache
  useEffect(() => {
    if (allSessions.length === 0) return;

    const checkForNewSessions = async () => {
      try {
        // Use queryClient to check cache first, then fetch if stale
        const cachedData = queryClient.getQueryData(['feed', 'sessions', 5, undefined, filters]);

        let response;
        if (cachedData) {
          response = cachedData as { sessions: any[] };
          console.log('New sessions check: Using cached data');
        } else {
          response = await firebaseApi.post.getFeedSessions(5, undefined, filters);
          console.log('New sessions check: Fetched from DB');
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

    // Check every 60 seconds (reduced from 30 to limit DB calls)
    const interval = setInterval(checkForNewSessions, 60000);
    return () => clearInterval(interval);
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
        console.log('Link copied to clipboard');
      }
    } catch (err: any) {
      // Silently ignore if user cancels the share dialog
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Failed to share session:', err);
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
      console.error('Failed to delete session:', err);
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
        console.log('IntersectionObserver triggered:', {
          isIntersecting: entry.isIntersecting,
          hasMore,
          isLoadingMore,
          nextCursor
        });

        if (entry.isIntersecting && hasMore && !isLoadingMore && nextCursor) {
          console.log('Loading more sessions...');
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
  }, [loadMore, hasMore, isLoadingMore, nextCursor]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
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
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (allSessions.length === 0) {
    return (
      <div className={`text-center py-8 px-4 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="text-gray-500 mb-6">
            <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-semibold text-lg text-gray-900 mb-2">No sessions yet</p>
            <p className="text-sm text-gray-600">
              Be the first to share your productive session!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/discover/people')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors font-medium text-sm sm:min-w-[180px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Find People
            </button>
            <button
              onClick={() => router.push('/timer')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0051D5] transition-colors font-medium text-sm shadow-sm sm:min-w-[180px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Record Session
            </button>
          </div>
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
            className="w-full py-3 px-3 sm:px-4 bg-gradient-to-r from-[#007AFF] to-[#0051D5] text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
            aria-label={`${newSessionsCount} new sessions available, click to refresh`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span className="truncate">
              {newSessionsCount} new {newSessionsCount === 1 ? 'session' : 'sessions'} - Click to refresh
            </span>
          </button>
        </div>
      )}

      {/* Sessions */}
      <div className="space-y-0 md:space-y-0">
        {allSessions.map((session) => {
          const isOwnSession = user && session.userId === user.id;
          return (
            <SessionCard
              key={session.id}
              session={session}
              onSupport={handleSupport}
              onRemoveSupport={handleRemoveSupport}
              onShare={handleShare}
              onEdit={isOwnSession ? (sessionId) => router.push(`/sessions/${sessionId}/edit`) : undefined}
              onDelete={isOwnSession ? handleDelete : undefined}
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
