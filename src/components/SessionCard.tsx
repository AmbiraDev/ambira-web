'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { SessionWithDetails } from '@/types';
import SessionInteractions from './SessionInteractions';
import TopComments from './TopComments';
import { ImageGallery } from './ImageGallery';
import LikesModal from './LikesModal';
import CommentsModal from './CommentsModal';
import { PrefetchLink } from './PrefetchLink';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { firebaseApi } from '@/lib/api';
import { MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { cn, isEmpty } from '@/lib/utils';
import { formatSessionDate, formatDuration } from '@/lib/formatters';
import { getUserInitials } from '@/lib/userUtils';

interface SessionCardProps {
  session: SessionWithDetails;
  onSupport: (sessionId: string) => Promise<void>;
  onRemoveSupport: (sessionId: string) => Promise<void>;
  onShare: (sessionId: string) => Promise<void>;
  onDelete?: (sessionId: string) => Promise<void>;
  onEdit?: (sessionId: string) => void;
  className?: string;
  showComments?: boolean;
  showGroupInfo?: boolean;
  isAboveFold?: boolean; // Add prop to indicate if card is above the fold
  priority?: boolean; // Add prop for image priority loading
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
  const router = useRouter();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(
    session.commentCount || 0
  );
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  // Check if user is following the session author
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (user && session.userId !== user.id && showGroupInfo) {
        try {
          const isUserFollowing = await firebaseApi.user.isFollowing(
            user.id,
            session.userId
          );
          setIsFollowing(isUserFollowing);
        } catch (error) {
          // Error checking follow status - silently fail
        }
      }
    };
    checkFollowStatus();
  }, [user, session.userId, showGroupInfo]);

  // Handle follow/unfollow
  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await firebaseApi.user.unfollowUser(session.userId);
        setIsFollowing(false);
      } else {
        await firebaseApi.user.followUser(session.userId);
        setIsFollowing(true);
      }
    } catch (error) {
      // Error toggling follow - silently fail
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Close menu when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showMenu]);

  // Guard: Return null if user data is missing (during architecture migration)
  if (!session.user) {
    return null;
  }

  return (
    <article
      className={cn(
        'bg-white md:rounded-lg md:border md:border-gray-200 md:shadow-sm mb-0 md:mb-4 border-b-[6px] border-gray-200 md:border-b-0 hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Session Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <PrefetchLink
          href={`/profile/${session.user.username}`}
          prefetchProfile={session.user.username}
          prefetchUserId={session.user.id}
          className="flex items-center gap-2 md:gap-3 min-w-0 flex-1"
        >
          {/* User Avatar */}
          {session.user.profilePicture ? (
            <div className="w-10 h-10 min-w-[2.5rem] aspect-square rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white">
              <Image
                src={session.user.profilePicture}
                alt={session.user.name}
                width={40}
                height={40}
                quality={90}
                className="w-full h-full object-cover"
                priority={isAboveFold || priority}
                loading={isAboveFold || priority ? 'eager' : 'lazy'}
              />
            </div>
          ) : (
            <div className="w-10 h-10 min-w-[2.5rem] aspect-square bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white">
              <span className="text-gray-600 font-semibold text-sm">
                {getUserInitials(session.user.name)}
              </span>
            </div>
          )}

          {/* User Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm md:text-base hover:underline truncate">
                {session.user.name}
              </span>
              {/* Follow button - Mobile only when showGroupInfo is true */}
              {showGroupInfo && user && session.userId !== user.id && (
                <button
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  className={cn(
                    'md:hidden text-xs font-semibold transition-colors duration-200 whitespace-nowrap flex-shrink-0',
                    isFollowing
                      ? 'text-gray-600 hover:text-gray-900'
                      : 'text-[#007AFF] hover:text-[#0051D5]'
                  )}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {formatSessionDate(session.createdAt)}
            </div>
          </div>
        </PrefetchLink>

        {/* Options Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-colors duration-200 min-h-[44px] min-w-[44px]"
            aria-label="Session options"
            aria-expanded={showMenu}
            aria-haspopup="true"
          >
            <MoreVertical className="w-5 h-5" aria-hidden="true" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
              role="menu"
              aria-label="Session options menu"
            >
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(session.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  role="menuitem"
                >
                  Edit session
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete(session.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 transition-colors duration-200"
                  role="menuitem"
                >
                  Delete session
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title and Description */}
      <Link
        href={`/sessions/${session.id}`}
        className="px-4 pb-3 block cursor-pointer"
      >
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 leading-tight hover:text-[#007AFF] transition-colors duration-200">
          {session.title || 'Focus Session'}
        </h3>
        {session.description && (
          <div>
            <p
              className={cn(
                'text-gray-600 text-sm md:text-base whitespace-pre-wrap break-words',
                !isExpanded &&
                  session.description.length > 280 &&
                  'line-clamp-3 sm:line-clamp-4'
              )}
            >
              {session.description.length > 1000
                ? session.description.slice(0, 1000)
                : session.description}
            </p>
            {session.description.length > 280 && (
              <button
                onClick={e => {
                  e.preventDefault();
                  setIsExpanded(!isExpanded);
                }}
                className="text-[#007AFF] text-sm font-semibold mt-1 hover:underline transition-colors duration-200 min-h-[44px] flex items-center"
                aria-expanded={isExpanded}
                aria-label={
                  isExpanded ? 'Show less description' : 'Show more description'
                }
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </Link>

      {/* Image Gallery */}
      {!isEmpty(session.images) && (
        <div className="px-4 pb-4">
          <ImageGallery
            images={session.images || []}
            priority={isAboveFold || priority}
          />
        </div>
      )}

      {/* Stats - Strava style */}
      <Link
        href={`/sessions/${session.id}`}
        className="px-4 pb-2 block cursor-pointer hover:bg-gray-50/50 transition-colors duration-200"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Time</div>
            <div className="text-base font-semibold text-gray-900">
              {formatDuration(session.duration)}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-1">Activity</div>
            <div
              className="text-base font-semibold text-gray-900 truncate"
              title={session.activity?.name || session.project?.name || 'N/A'}
            >
              {session.activity?.name || session.project?.name || 'N/A'}
            </div>
          </div>
        </div>
      </Link>

      {/* Interactions */}
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
        onCommentClick={() => setShowCommentsModal(true)}
        onLikesClick={() => setShowLikesModal(true)}
        onViewAllCommentsClick={() => setShowCommentsModal(true)}
      />

      {/* Top Comments Section */}
      <div ref={commentSectionRef}>
        <TopComments
          sessionId={session.id}
          totalCommentCount={localCommentCount}
          onCommentCountChange={setLocalCommentCount}
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
  );
};

export default SessionCard;
