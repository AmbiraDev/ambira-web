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
            className="text-[#007AFF] hover:text-[#0051D5] font-medium"
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
        console.error('Failed to delete comment:', err);
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
      <div className="flex gap-2 opacity-50">
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
      <Link href={`/profile/${comment.user.username}`} className="shrink-0">
        {comment.user.profilePicture ? (
          <Image
            src={comment.user.profilePicture}
            alt={comment.user.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {getUserInitials(comment.user.name)}
            </span>
          </div>
        )}
      </Link>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2 min-w-0">
            <Link href={`/profile/${comment.user.username}`}>
              <span className="text-sm font-semibold text-gray-900 hover:text-[#007AFF] transition-colors">
                {comment.user.name}
              </span>
            </Link>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatTimeAgo(comment.createdAt)}
            </span>
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

        {/* Comment Text */}
        <p className="text-[15px] text-gray-900 whitespace-pre-wrap break-words mt-0.5">
          {renderContent(comment.content)}
        </p>

        {/* Like Button */}
        {currentUserId && (
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${
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
                className={`w-4 h-4 ${optimisticLiked ? 'fill-current' : ''}`}
                aria-hidden="true"
              />
              {optimisticLikeCount > 0 && (
                <span className="text-xs font-medium">
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
