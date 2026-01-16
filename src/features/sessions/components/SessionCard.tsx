'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { SessionWithDetails } from '@/types'
import SessionInteractions from './SessionInteractions'
import TopComments from '@/features/feed/components/TopComments'
import LikesModal from '@/features/social/components/LikesModal'
import CommentsModal from '@/features/comments/components/CommentsModal'
import { PrefetchLink } from '@/components/PrefetchLink'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { firebaseApi } from '@/lib/api'
import { MoreVertical, Clock, Target } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatSessionDate, formatDuration } from '@/lib/formatters'
import { getUserInitials } from '@/lib/userUtils'

interface SessionCardProps {
  session: SessionWithDetails
  onSupport: (sessionId: string) => Promise<void>
  onRemoveSupport: (sessionId: string) => Promise<void>
  onShare: (sessionId: string) => Promise<void>
  onDelete?: (sessionId: string) => Promise<void>
  onEdit?: (sessionId: string) => void
  className?: string
  showComments?: boolean
  showGroupInfo?: boolean
  isAboveFold?: boolean // Add prop to indicate if card is above the fold
  priority?: boolean // Add prop for image priority loading
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onSupport,
  onRemoveSupport,
  onShare,
  onDelete,
  onEdit,
  className = '',
  showGroupInfo = false,
  isAboveFold = false,
  priority = false,
}) => {
  const router = useRouter()
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [localCommentCount, setLocalCommentCount] = useState(session.commentCount || 0)
  const [showLikesModal, setShowLikesModal] = useState(false)
  const [showCommentsModal, setShowCommentsModal] = useState(false)
  const [expandComments, setExpandComments] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const commentSectionRef = useRef<HTMLDivElement>(null)

  // Check if user is following the session author
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (user && session.userId !== user.id && showGroupInfo) {
        try {
          const isUserFollowing = await firebaseApi.user.isFollowing(user.id, session.userId)
          setIsFollowing(isUserFollowing)
        } catch {
          // Error checking follow status - silently fail
        }
      }
    }
    checkFollowStatus()
  }, [user, session.userId, showGroupInfo])

  // Handle follow/unfollow
  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user || isFollowLoading) return

    setIsFollowLoading(true)
    try {
      if (isFollowing) {
        await firebaseApi.user.unfollowUser(session.userId)
        setIsFollowing(false)
      } else {
        await firebaseApi.user.followUser(session.userId)
        setIsFollowing(true)
      }
    } catch {
      // Error toggling follow - silently fail
    } finally {
      setIsFollowLoading(false)
    }
  }

  // Close menu when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [showMenu])

  // Handle comment icon click - different behavior for mobile vs desktop
  const handleCommentClick = () => {
    // Check if mobile (window width < 768px which is md breakpoint)
    const isMobile = window.innerWidth < 768

    if (isMobile) {
      // Mobile: Open modal
      setShowCommentsModal(true)
    } else {
      // Desktop: Expand inline and scroll to comment section
      setExpandComments(true)
      // Scroll to comment section after a short delay to allow expansion
      setTimeout(() => {
        commentSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }, 100)
    }
  }

  // Guard: Return null if user data is missing (during architecture migration)
  if (!session.user) {
    return null
  }

  // Get activity display name with fallback
  // If activity/project objects exist, use their names
  // Otherwise, if activityId/projectId exists, format it nicely (e.g., "coding" -> "Coding")
  const getActivityDisplayName = () => {
    if (session.activity?.name) return session.activity.name
    if (session.project?.name) return session.project.name

    // Fallback: format the activityId or projectId
    const id = session.activityId || session.projectId
    if (id) {
      // Convert kebab-case to Title Case (e.g., "side-project" -> "Side Project")
      return id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ')
    }

    return 'N/A'
  }

  const activityDisplayName = getActivityDisplayName()

  return (
    <article className={cn('bg-white mb-4', className)}>
      {/* Session Header */}
      <div className="flex items-center justify-between lg:px-5 pt-5 pb-4">
        <PrefetchLink
          href={`/profile/${session.user.username}`}
          prefetchProfile={session.user.username}
          prefetchUserId={session.user.id}
          className="flex items-center gap-4 md:gap-4 min-w-0 flex-1 group"
        >
          {/* User Avatar - Duolingo style with gradient ring */}
          {session.user.profilePicture ? (
            <div className="w-14 h-14 min-w-[3.5rem] aspect-square rounded-full overflow-hidden flex-shrink-0 p-0.5 bg-gradient-to-br from-[#58CC02] to-[#45A000] group-hover:scale-105 transition-transform">
              <Image
                src={session.user.profilePicture}
                alt={session.user.name}
                width={56}
                height={56}
                quality={90}
                className="w-full h-full object-cover rounded-full border-2 border-white"
                priority={isAboveFold || priority}
                loading={isAboveFold || priority ? 'eager' : 'lazy'}
              />
            </div>
          ) : (
            <div className="w-14 h-14 min-w-[3.5rem] aspect-square rounded-full flex items-center justify-center flex-shrink-0 p-0.5 bg-gradient-to-br from-[#58CC02] to-[#45A000] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-[#3C3C3C] font-bold text-base">
                  {getUserInitials(session.user.name)}
                </span>
              </div>
            </div>
          )}

          {/* User Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#4B4B4B] text-lg md:text-xl hover:text-[#58CC02] transition-colors truncate tracking-tight">
                {session.user.name}
              </span>
              {/* Follow button - Mobile only when showGroupInfo is true */}
              {showGroupInfo && user && session.userId !== user.id && (
                <button
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  className={cn(
                    'md:hidden text-sm font-extrabold transition-colors duration-200 whitespace-nowrap flex-shrink-0 uppercase tracking-wide px-2.5 py-1.5 rounded-lg',
                    isFollowing ? 'text-[#AFAFAF] bg-[#F7F7F7]' : 'text-[#1CB0F6] bg-[#DDF4FF]'
                  )}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
            <div className="text-sm text-[#AFAFAF] font-bold uppercase tracking-wide">
              {formatSessionDate(session.createdAt)}
            </div>
          </div>
        </PrefetchLink>

        {/* Options Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-[#AFAFAF] hover:text-[#3C3C3C] hover:bg-[#F7F7F7] rounded-xl p-2 transition-colors duration-200 min-h-[44px] min-w-[44px]"
            aria-label="Session options"
            aria-expanded={showMenu}
            aria-haspopup="true"
          >
            <MoreVertical className="w-6 h-6" aria-hidden="true" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border-2 border-[#E5E5E5] py-2 z-10 overflow-hidden"
              role="menu"
              aria-label="Session options menu"
            >
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(session.id)
                    setShowMenu(false)
                  }}
                  className="w-full px-5 py-3 text-left text-sm font-bold text-[#4B4B4B] hover:bg-[#F7F7F7] transition-colors duration-200"
                  role="menuitem"
                >
                  EDIT SESSION
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete(session.id)
                    setShowMenu(false)
                  }}
                  className="w-full px-5 py-3 text-left text-sm font-bold text-[#FF4B4B] hover:bg-[#FFF5F5] transition-colors duration-200"
                  role="menuitem"
                >
                  DELETE SESSION
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title and Description */}
      <Link href={`/sessions/${session.id}`} className="lg:px-5 pb-5 block cursor-pointer group">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#4B4B4B] mb-3 leading-tight group-hover:text-[#1CB0F6] transition-colors duration-200">
          {session.title || 'Focus Session'}
        </h3>
        {session.description && (
          <div>
            <p
              className={cn(
                'text-[#777777] text-lg md:text-xl whitespace-pre-wrap break-words font-medium leading-relaxed',
                !isExpanded && session.description.length > 280 && 'line-clamp-3 sm:line-clamp-4'
              )}
            >
              {session.description.length > 1000
                ? session.description.slice(0, 1000)
                : session.description}
            </p>
            {session.description.length > 280 && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setIsExpanded(!isExpanded)
                }}
                className="text-[#AFAFAF] text-base font-bold mt-2 hover:text-[#777777] transition-colors duration-200 flex items-center uppercase tracking-wide"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Show less description' : 'Show more description'}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </Link>

      {/* Stats - Landing page style with colored icons */}
      <Link href={`/sessions/${session.id}`} className="lg:px-5 pb-5 block cursor-pointer">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#F7F7F7] rounded-xl p-4 border border-[#E5E5E5]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1CB0F6] to-[#0088CC] rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[#3C3C3C] font-extrabold text-lg">
                {formatDuration(session.duration)}
              </span>
            </div>
          </div>
          <div className="bg-[#F7F7F7] rounded-xl p-4 border border-[#E5E5E5]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#58CC02] to-[#45A000] rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span
                className="text-[#3C3C3C] font-extrabold text-lg truncate"
                title={activityDisplayName}
              >
                {activityDisplayName}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Interactions */}
      <div className="lg:px-5 py-2">
        <SessionInteractions
          sessionId={session.id}
          supportCount={session.supportCount}
          commentCount={localCommentCount}
          isSupported={session.isSupported || false}
          supportedBy={session.supportedBy}
          onSupport={onSupport}
          onRemoveSupport={onRemoveSupport}
          onShare={onShare}
          onShareImage={() => router.push(`/sessions/${session.id}/share`)}
          isOwnPost={session.userId === user?.id}
          onCommentClick={handleCommentClick}
          onLikesClick={() => setShowLikesModal(true)}
        />
      </div>

      {/* Top Comments Section */}
      <div ref={commentSectionRef} className="lg:px-5">
        <TopComments
          sessionId={session.id}
          totalCommentCount={localCommentCount}
          onCommentCountChange={setLocalCommentCount}
          initialExpanded={expandComments}
        />
      </div>

      {/* Likes Modal */}
      <LikesModal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        userIds={session.supportedBy || []}
        totalLikes={session.supportCount}
      />

      {/* Comments Modal */}
      <CommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        sessionId={session.id}
        session={session}
        totalCommentCount={localCommentCount}
        onCommentCountChange={setLocalCommentCount}
      />
    </article>
  )
}

export default SessionCard
