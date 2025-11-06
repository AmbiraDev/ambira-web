'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { CommentWithDetails } from '@/types';
import Link from 'next/link';
import { Trash2, Heart, MoreVertical } from 'lucide-react';
import { formatTimeAgo } from '@/lib/formatters';
import { getUserInitials } from '@/lib/userUtils';

interface CommentItemProps {
  comment: CommentWithDetails;
  onDelete?: (commentId: string) => Promise<void>;
  onLike?: (commentId: string, action: 'like' | 'unlike') => void;
  currentUserId?: string;
  sessionId?: string;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onDelete,
  onLike,
  currentUserId,
  sessionId: _sessionId,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState(comment.isLiked);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(
    comment.likeCount
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Update optimistic state when prop changes (from cache invalidation)
  useEffect(() => {
    setOptimisticLiked(comment.isLiked);
    setOptimisticLikeCount(comment.likeCount);
  }, [comment.isLiked, comment.likeCount]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const isOwner = currentUserId === comment.userId;
  const canDelete = isOwner && !!onDelete;

  const renderContent = (text: string) => {
    // Highlight mentions
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <Link
            key={index}
            href={`/profile/${username}`}
            className="text-[#0066CC] hover:text-[#0051D5] font-medium"
          >
            {part}
          </Link>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsMenuOpen(false);
    if (window.confirm('Are you sure you want to delete this comment?')) {
      setIsDeleting(true);
      try {
        await onDelete(comment.id);
      } catch (err) {
        setIsDeleting(false);
      }
    }
  };

  const handleLike = () => {
    if (!onLike || !currentUserId || isLiking) return;

    // Optimistic update
    const action = optimisticLiked ? 'unlike' : 'like';
    const newLiked = !optimisticLiked;
    const newCount = newLiked
      ? optimisticLikeCount + 1
      : Math.max(0, optimisticLikeCount - 1);

    setOptimisticLiked(newLiked);
    setOptimisticLikeCount(newCount);
    setIsLiking(true);

    // Call the mutation
    onLike(comment.id, action);

    // Reset loading state after a short delay to prevent rapid clicking
    setTimeout(() => setIsLiking(false), 500);
  };

  if (isDeleting) {
    return (
      <div className="flex gap-3 opacity-50">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-1 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {/* User Avatar */}
      <Link
        href={`/profile/${comment.user.username}`}
        className="shrink-0 mt-1.5 sm:mt-2"
      >
        {comment.user.profilePicture ? (
          <div className="w-10 h-10 relative rounded-full overflow-hidden border border-gray-200">
            <Image
              src={comment.user.profilePicture}
              alt={comment.user.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
            <span className="text-sm font-semibold text-gray-600">
              {getUserInitials(comment.user.name)}
            </span>
          </div>
        )}
      </Link>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-2">
              <Link href={`/profile/${comment.user.username}`}>
                <span className="text-sm font-semibold text-gray-900 hover:text-[#0066CC] transition-colors">
                  {comment.user.name}
                </span>
              </Link>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>
            {/* Comment Text */}
            <p className="text-sm text-gray-900 whitespace-pre-wrap break-words mt-0.5">
              {renderContent(comment.content)}
            </p>
          </div>

          {/* More Menu */}
          {canDelete && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="More options"
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
              >
                <MoreVertical className="w-4 h-4" aria-hidden="true" />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    role="menuitem"
                    aria-label="Delete comment"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Like Button */}
        {currentUserId && (
          <div className="flex items-center gap-2 -mt-1 sm:mt-1.5">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                optimisticLiked
                  ? 'text-red-600 hover:text-red-700'
                  : 'text-gray-500 hover:text-red-600'
              } ${isLiking ? 'opacity-70' : ''}`}
              disabled={!onLike || isLiking}
              aria-label={
                optimisticLiked
                  ? `Unlike comment (${optimisticLikeCount} ${optimisticLikeCount === 1 ? 'like' : 'likes'})`
                  : `Like comment (${optimisticLikeCount} ${optimisticLikeCount === 1 ? 'like' : 'likes'})`
              }
            >
              <Heart
                className={`w-3.5 h-3.5 ${optimisticLiked ? 'fill-current' : ''}`}
                aria-hidden="true"
              />
              {optimisticLikeCount > 0 && (
                <span>
                  {optimisticLikeCount > 1
                    ? `${optimisticLikeCount} like${optimisticLikeCount > 1 ? 's' : ''}`
                    : '1 like'}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
