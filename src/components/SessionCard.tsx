'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { SessionWithDetails, User } from '@/types';
import SessionStats from './SessionStats';
import SessionInteractions from './SessionInteractions';
import TopComments from './TopComments';
import { ImageGallery } from './ImageGallery';
import LikesModal from './LikesModal';
import CommentsModal from './CommentsModal';
import { MoreVertical, Heart, MessageCircle, Share2, Clock, ListTodo, Tag } from 'lucide-react';
import Link from 'next/link';

interface SessionCardProps {
  session: SessionWithDetails;
  onSupport: (sessionId: string) => Promise<void>;
  onRemoveSupport: (sessionId: string) => Promise<void>;
  onShare: (sessionId: string) => Promise<void>;
  onDelete?: (sessionId: string) => Promise<void>;
  onEdit?: (sessionId: string) => void;
  className?: string;
  showComments?: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onSupport,
  onRemoveSupport,
  onShare,
  onDelete,
  onEdit,
  className = '',
  showComments = false
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(session.commentCount || 0);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [expandComments, setExpandComments] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);

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

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const getUserInitials = (user: User): string => {
    return user.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserColor = (userId: string): string => {
    // Generate consistent color based on user ID
    const colors = [
      'bg-gradient-to-br from-orange-400 to-orange-600',
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
      'bg-gradient-to-br from-teal-400 to-teal-600',
      'bg-gradient-to-br from-cyan-400 to-cyan-600'
    ];
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <article className={`bg-white md:rounded-lg md:border md:border-gray-200 md:shadow-sm mb-0 md:mb-4 border-b border-gray-200 md:border-b-0 ${className}`}>
      {/* Session Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Link href={`/profile/${session.user.username}`} className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
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
              />
            </div>
          ) : (
            <div className="w-10 h-10 min-w-[2.5rem] aspect-square bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white">
              <span className="text-gray-600 font-semibold text-sm">
                {getUserInitials(session.user)}
              </span>
            </div>
          )}

          {/* User Info */}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 text-sm md:text-base hover:underline truncate">{session.user.name}</div>
            <div className="text-xs text-gray-500">{formatTimeAgo(session.createdAt)}</div>
          </div>
        </Link>

        {/* Options Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-colors min-h-[44px] min-w-[44px]"
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
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
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
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                  role="menuitem"
                >
                  Delete session
                </button>
              )}
              <button
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                role="menuitem"
              >
                Report session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title and Description */}
      <div className="px-4 pb-3">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 leading-tight">
          {session.title || 'Focus Session'}
        </h3>
        {session.description && (
          <div>
            <p className={`text-gray-600 text-sm md:text-base whitespace-pre-wrap break-words ${!isExpanded && session.description.length > 280 ? 'line-clamp-3 sm:line-clamp-4' : ''}`}>
              {session.description.length > 1000 ? session.description.slice(0, 1000) : session.description}
            </p>
            {session.description.length > 280 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[#007AFF] text-sm font-semibold mt-1 hover:underline min-h-[44px] flex items-center"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Show less description' : 'Show more description'}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image Gallery */}
      {session.images && session.images.length > 0 && (
        <div className="px-4 pb-4">
          <ImageGallery images={session.images} />
        </div>
      )}

      {/* Stats - Strava style */}
      <div className="px-4 pb-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Time</div>
            <div className="text-base font-semibold text-gray-900">{formatTime(session.duration)}</div>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 mb-1">Project</div>
            <div className="text-base font-semibold text-gray-900 truncate">{session.project?.name || 'N/A'}</div>
          </div>
        </div>
      </div>

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
          autoFocus={showCommentInput}
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
        totalCommentCount={localCommentCount}
        onCommentCountChange={setLocalCommentCount}
      />

    </article>
  );
};

export default SessionCard;
