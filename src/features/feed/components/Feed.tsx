'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SessionWithDetails, FeedFilters } from '@/types'
import { firebaseApi } from '@/lib/api'
import SessionCard from '@/features/sessions/components/SessionCard'
import { useFeedInfinite, FeedResult } from '@/features/feed/hooks'
import { useSupportSession, useDeleteSession } from '@/features/sessions/hooks'
import { useAuth } from '@/hooks/useAuth'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Users,
  Search,
  ChevronUp,
  Clock,
  Target,
  Heart,
  MessageCircle,
} from 'lucide-react'
import {
  getLastViewedFeedTime,
  updateLastViewedFeedTime,
  countNewSessions,
} from '@/lib/hooks/useFeedViewedState'

// Sample Session Card Component for Empty State
interface SampleSession {
  id: string
  userName: string
  initials: string
  timeAgo: string
  title: string
  description?: string
  duration: string
  activity: string
  supportCount: number
  commentCount: number
}

const sampleSessions: SampleSession[] = [
  {
    id: '1',
    userName: 'Alex Chen',
    initials: 'AC',
    timeAgo: '2 hours ago',
    title: 'Deep Work on Project Features',
    description:
      'Finally cracked that tricky algorithm! Feeling accomplished after a solid focused session.',
    duration: '2h 45m',
    activity: 'Coding',
    supportCount: 24,
    commentCount: 5,
  },
  {
    id: '2',
    userName: 'Sarah Johnson',
    initials: 'SJ',
    timeAgo: '4 hours ago',
    title: 'Morning Study Session',
    description: 'Preparing for finals. Made great progress on the organic chemistry chapter!',
    duration: '1h 30m',
    activity: 'Study',
    supportCount: 18,
    commentCount: 3,
  },
  {
    id: '3',
    userName: 'Mike Rivera',
    initials: 'MR',
    timeAgo: '6 hours ago',
    title: 'Writing Sprint',
    description: 'Got 2,000 words down on my novel draft. The story is really coming together now.',
    duration: '3h 15m',
    activity: 'Writing',
    supportCount: 31,
    commentCount: 8,
  },
]

const SampleSessionCard: React.FC<{ session: SampleSession }> = ({ session }) => (
  <article className="bg-white py-5 lg:px-6 border-b border-[#E5E5E5] lg:border lg:rounded-2xl lg:mb-4">
    {/* Session Header */}
    <div className="flex items-center gap-4 mb-5">
      {/* User Avatar - Matching landing page style */}
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#58CC02] to-[#45A000] p-0.5">
        <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
          <span className="text-[#3C3C3C] font-bold text-base">{session.initials}</span>
        </div>
      </div>
      {/* User Info */}
      <div>
        <p className="text-[#3C3C3C] font-extrabold text-lg">{session.userName}</p>
        <p className="text-[#AFAFAF] text-sm font-bold">{session.timeAgo}</p>
      </div>
    </div>

    {/* Title */}
    <h3 className="text-[#3C3C3C] text-2xl font-extrabold mb-3">{session.title}</h3>

    {/* Description */}
    {session.description && (
      <p className="text-[#777777] text-base leading-relaxed mb-5">{session.description}</p>
    )}

    {/* Stats - Matching landing page card style */}
    <div className="grid grid-cols-2 gap-3 mb-5">
      <div className="bg-[#F7F7F7] rounded-xl p-4 border border-[#E5E5E5]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#1CB0F6] to-[#0088CC] rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[#3C3C3C] font-extrabold text-lg">{session.duration}</span>
        </div>
      </div>
      <div className="bg-[#F7F7F7] rounded-xl p-4 border border-[#E5E5E5]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#58CC02] to-[#45A000] rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[#3C3C3C] font-extrabold text-lg">{session.activity}</span>
        </div>
      </div>
    </div>

    {/* Interactions */}
    <div className="flex items-center gap-5 text-[#AFAFAF]">
      <div className="flex items-center gap-2">
        <Heart className="w-6 h-6" />
        <span className="font-bold text-base">{session.supportCount}</span>
      </div>
      <div className="flex items-center gap-2">
        <MessageCircle className="w-6 h-6" />
        <span className="font-bold text-base">{session.commentCount}</span>
      </div>
    </div>
  </article>
)

// Session Card Skeleton Component
const SessionCardSkeleton: React.FC = () => (
  <div className="bg-white border-b lg:border lg:border-gray-200 lg:rounded-lg p-3 lg:p-4 animate-pulse">
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
)

interface FeedProps {
  filters?: FeedFilters
  className?: string
  initialLimit?: number
  showEndMessage?: boolean
  showGroupInfo?: boolean
}

export const Feed: React.FC<FeedProps> = ({
  filters = {},
  className = '',
  initialLimit: _initialLimit = 10,
  showEndMessage = true,
  showGroupInfo = false,
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [hasNewSessions, setHasNewSessions] = useState(false)
  const [newSessionsCount, setNewSessionsCount] = useState(0)
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Ref for infinite scroll trigger element
  const loadMoreTriggerRef = React.useRef<HTMLDivElement>(null)

  // Use new infinite scroll hook
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useFeedInfinite(user?.id || '', filters, { limit: _initialLimit })

  // Flatten pages into allSessions
  // Note: Casting to SessionWithDetails[] for compatibility during architecture migration
  // The data structure comes from useFeedInfinite which returns InfiniteData<FeedResult>
  // where each page is a FeedResult with sessions: Session[] property
  const allSessions = useMemo(() => {
    if (!data?.pages) return []
    // TypeScript can't infer the page type from useInfiniteQuery, so we cast
    const sessions = (data.pages as FeedResult[]).flatMap((page) => {
      return page.sessions || []
    }) as unknown as SessionWithDetails[]

    return sessions
  }, [data])

  const hasMore = hasNextPage || false
  const isLoadingMore = isFetchingNextPage

  // New mutations using feature hooks
  const supportMutation = useSupportSession(user?.id)
  const deleteSessionMutation = useDeleteSession()

  // Refresh sessions and invalidate cache
  const refreshSessions = useCallback(() => {
    setHasNewSessions(false)
    setNewSessionsCount(0)
    // Update localStorage to mark these sessions as viewed
    updateLastViewedFeedTime()
    // Invalidate all feed caches to force refetch
    queryClient.invalidateQueries({ queryKey: ['feed'] })
    refetch()
  }, [refetch, queryClient])

  // Auto-refresh feed when coming from session creation
  useEffect(() => {
    const shouldRefresh = searchParams?.get('refresh')
    if (shouldRefresh === 'true') {
      // Clear the URL parameter
      router.replace('/', { scroll: false })
      // Trigger immediate refresh
      refreshSessions()
    }
  }, [searchParams, router, refreshSessions])

  // Load more sessions - now uses React Query infinite scroll
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchNextPage()
    }
  }, [isLoadingMore, hasMore, fetchNextPage])

  // Check for new sessions when user returns to tab
  // Only checks when page becomes visible to minimize Firestore reads
  useEffect(() => {
    if (allSessions.length === 0) return

    const checkForNewSessions = async () => {
      // Skip check if page is not visible
      if (document.hidden) return

      try {
        // Use queryClient to check cache first, then fetch if stale
        const cachedData = queryClient.getQueryData(['feed', 'sessions', 5, undefined, filters])

        let response
        if (cachedData) {
          response = cachedData as { sessions: SessionWithDetails[] }
        } else {
          response = await firebaseApi.post.getFeedSessions(5, undefined, filters)
        }

        // Get the last viewed time from localStorage
        const lastViewedTime = getLastViewedFeedTime()

        // Count sessions that are actually new (created after lastViewedTime)
        const newCount = countNewSessions(response.sessions, lastViewedTime)

        if (newCount > 0) {
          setHasNewSessions(true)
          setNewSessionsCount(newCount)
        } else {
          // No new sessions since last view
          setHasNewSessions(false)
          setNewSessionsCount(0)
        }
      } catch {
        // Silently fail
      }
    }

    // Check for new sessions when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForNewSessions()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [allSessions, filters, queryClient, setHasNewSessions, setNewSessionsCount])

  // Handle support with optimistic updates via React Query
  const handleSupport = useCallback(
    async (sessionId: string) => {
      supportMutation.mutate({ sessionId, action: 'support' })
    },
    [supportMutation]
  )

  // Handle remove support with optimistic updates via React Query
  const handleRemoveSupport = useCallback(
    async (sessionId: string) => {
      supportMutation.mutate({ sessionId, action: 'unsupport' })
    },
    [supportMutation]
  )

  // Handle share
  const handleShare = useCallback(async (sessionId: string) => {
    try {
      const sessionUrl = `${window.location.origin}/sessions/${sessionId}`

      if (navigator.share) {
        // Use native share API on mobile
        await navigator.share({
          title: 'Check out this session on Focumo',
          text: 'Look at this productive session!',
          url: sessionUrl,
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(sessionUrl)
        // Could show success toast here
      }
    } catch (err: unknown) {
      // Silently ignore if user cancels the share dialog
      if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
        return
      }
      // Could show error toast here
    }
  }, [])

  // Handle delete
  const handleDelete = useCallback(async (sessionId: string) => {
    setDeleteConfirmSession(sessionId)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmSession) return

    try {
      setIsDeleting(true)
      await deleteSessionMutation.mutateAsync(deleteConfirmSession)
      setDeleteConfirmSession(null)
    } catch {
      // Could show error toast here
    } finally {
      setIsDeleting(false)
    }
  }, [deleteConfirmSession, deleteSessionMutation])

  // Memoize top 3 session IDs string to create stable dependency
  // This prevents useEffect from re-running when sessions array changes but top 3 IDs remain same
  // Reduced from 10 to 3 to minimize Firestore real-time listener costs
  const top3SessionIdsString = useMemo(() => {
    const MAX_LISTENERS = 3
    return allSessions
      .slice(0, MAX_LISTENERS)
      .map((session) => session.id)
      .join(',')
  }, [allSessions])

  // Real-time updates for support counts on top 3 sessions
  // Only listen to the first 3 sessions to reduce overhead (reduced from 10 for cost optimization)
  // Invalidates React Query cache when sessions receive supports from other users
  useEffect(() => {
    if (allSessions.length === 0 || !top3SessionIdsString) return

    // Parse session IDs from memoized string
    const sessionIds = top3SessionIdsString.split(',').filter(Boolean)
    if (sessionIds.length === 0) return

    // Register listener and invalidate cache when sessions are updated
    // This ensures real-time support counts from other users are reflected
    const unsubscribe = firebaseApi.post.listenToSessionUpdates(sessionIds, (updates) => {
      // Invalidate affected sessions in React Query cache
      // updates is a Record<sessionId, { supportCount, isSupported }>
      if (updates && Object.keys(updates).length > 0) {
        queryClient.invalidateQueries({
          queryKey: ['feed'],
          refetchType: 'none', // Don't auto-refetch, just mark as stale
        })
      }
    })

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top3SessionIdsString, queryClient]) // Only re-run when top 3 IDs change or queryClient changes

  // Infinite scroll using IntersectionObserver
  useEffect(() => {
    const trigger = loadMoreTriggerRef.current
    if (!trigger) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      {
        root: null, // viewport
        rootMargin: '200px', // Trigger 200px before reaching the element
        threshold: 0,
      }
    )

    observer.observe(trigger)

    return () => {
      if (trigger) {
        observer.unobserve(trigger)
      }
    }
  }, [loadMore, hasMore, isLoadingMore])

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <SessionCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    const errorMessage = String(error)
    const isPermissionError =
      errorMessage.includes('permission') || errorMessage.includes('insufficient')

    return (
      <div className={`text-center py-8 px-4 ${className}`} role="alert" aria-live="polite">
        <div className="text-red-600 mb-4">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2" aria-hidden="true" />
          <p className="font-medium text-sm sm:text-base">Failed to load sessions</p>
          <p className="text-sm text-gray-600 mt-1">
            {isPermissionError
              ? 'There was a permissions issue loading the feed. This may be due to security rules that need updating.'
              : errorMessage}
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
    )
  }

  if (allSessions.length === 0) {
    // Determine empty state content based on feed type
    const feedType = filters?.type || 'all'

    let emptyStateContent = {
      title: 'Your feed is empty',
      message:
        'Follow people to see their productive sessions in your feed and get inspired by their work!',
      buttonText: 'Find People to Follow',
      buttonAction: () => router.push('/discover/people'),
    }

    if (feedType === 'group-members-unfollowed') {
      emptyStateContent = {
        title: 'No sessions yet',
        message: "When group members you don't follow post sessions, they'll appear here!",
        buttonText: 'Discover Groups',
        buttonAction: () => router.push('/groups'),
      }
    } else if (feedType === 'user') {
      emptyStateContent = {
        title: 'No sessions yet',
        message: 'Start tracking your productive sessions to build your profile!',
        buttonText: 'Start a Session',
        buttonAction: () => router.push('/timer'),
      }
    } else if (feedType === 'following') {
      emptyStateContent = {
        title: 'Your feed is empty',
        message:
          'Follow people to see their productive sessions in your feed and get inspired by their work!',
        buttonText: 'Find People to Follow',
        buttonAction: () => router.push('/discover/people'),
      }
    }

    return (
      <div className={className}>
        {/* Header with CTA - Hidden on mobile, only show on lg+ screens */}
        <div className="hidden lg:block text-center py-8 px-4">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <Users className="w-16 h-16 mx-auto mb-3 text-[#AFAFAF]" />
              <h3 className="font-extrabold text-xl text-[#3C3C3C] mb-2">
                {emptyStateContent.title}
              </h3>
              <p className="text-base text-[#777777] leading-relaxed">
                {emptyStateContent.message}
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={emptyStateContent.buttonAction}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1CB0F6] text-white rounded-2xl hover:brightness-105 transition-all font-bold text-base border-2 border-b-4 border-[#0088CC] active:border-b-2 active:translate-y-[2px]"
            >
              <Search className="w-5 h-5" />
              {emptyStateContent.buttonText}
            </button>
          </div>
        </div>

        {/* Sample Posts Section - Only show when this is the last feed (showEndMessage=true) */}
        {showEndMessage && (
          <div className="lg:pt-6">
            {/* "See what others are sharing" - Hidden on mobile */}
            <div className="hidden lg:block text-center mb-4">
              <p className="text-sm font-bold text-[#AFAFAF] uppercase tracking-wide">
                See what others are sharing
              </p>
            </div>
            <div>
              {sampleSessions.map((session) => (
                <SampleSessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <main role="main" aria-label="Activity feed" className={className}>
      {/* New sessions indicator */}
      {hasNewSessions && (
        <div className="mb-4 sticky top-0 z-10" role="status" aria-live="polite">
          <button
            onClick={refreshSessions}
            className="w-full py-3 px-3 sm:px-4 bg-gradient-to-r from-[#0066CC] to-[#0051D5] text-white rounded-lg shadow-lg hover:shadow-xl transition-colors duration-200 flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
            aria-label={`${newSessionsCount} new sessions available, click to refresh`}
          >
            <ChevronUp className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">
              {newSessionsCount} new {newSessionsCount === 1 ? 'session' : 'sessions'} - Click to
              refresh
            </span>
          </button>
        </div>
      )}

      {/* Sessions */}
      <ul aria-label="Activity sessions" role="feed" className="space-y-0 lg:space-y-0">
        {allSessions.map((session, index) => {
          const isOwnSession = user && session.userId === user.id
          // First 2 sessions are above the fold on most screens
          const isAboveFold = index < 2

          return (
            <li
              key={session.id}
              role="article"
              aria-posinset={index + 1}
              aria-setsize={allSessions.length}
            >
              <SessionCard
                session={session}
                onSupport={handleSupport}
                onRemoveSupport={handleRemoveSupport}
                onShare={handleShare}
                onEdit={
                  isOwnSession
                    ? (sessionId) => router.push(`/sessions/${sessionId}/edit`)
                    : undefined
                }
                onDelete={isOwnSession ? handleDelete : undefined}
                showGroupInfo={showGroupInfo}
                isAboveFold={isAboveFold}
                priority={isAboveFold}
              />
            </li>
          )
        })}
      </ul>

      {/* Infinite scroll trigger element */}
      {hasMore && !isLoadingMore && (
        <div ref={loadMoreTriggerRef} className="h-4" aria-hidden="true" />
      )}

      {/* Load more indicator */}
      {isLoadingMore && (
        <div className="text-center py-4" role="status" aria-live="polite">
          <div className="inline-flex items-center space-x-2 text-gray-600">
            <div
              className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"
              aria-hidden="true"
            ></div>
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
        <div role="status" aria-live="polite" className="text-center py-4 text-gray-500 text-sm">
          You've reached the end of the feed
        </div>
      )}
    </main>
  )
}

export default Feed
