'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CommentWithDetails } from '@/types';
import Link from 'next/link';
import { Trash2, Heart, MoreVertical } from 'lucide-react';

interface CommentItemProps {
  comment: CommentWithDetails;
  sessionId: string;
  onDelete?: (commentId: string) => Promise<void>;
  onLike?: (commentId: string, action: 'like' | 'unlike') => void;
  currentUserId?: string;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  sessionId,
  onDelete,
  onLike,
  currentUserId
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState(comment.isLiked);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(comment.likeCount);
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

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Less than 1 minute
    if (diffInSeconds < 60) {
      return 'just now';
    }

    // Less than 1 hour
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }

    // Less than 1 day
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }

    // Less than 7 days
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }

    // Less than 4 weeks
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}w`;
    }

    // Otherwise show months or date
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}mo`;
    }

    // More than a year
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y`;
  };

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
      } catch (error) {
        console.error('Failed to delete comment:', error);
        setIsDeleting(false);
      }
    }
  };

  const handleLike = () => {
    if (!onLike || !currentUserId || isLiking) return;

    // Optimistic update
    const action = optimisticLiked ? 'unlike' : 'like';
    const newLiked = !optimisticLiked;
    const newCount = newLiked ? optimisticLikeCount + 1 : Math.max(0, optimisticLikeCount - 1);

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
    <div>
      <div className="flex gap-2.5">
        {/* User Avatar */}
        <Link href={`/profile/${comment.user.username}`} className="shrink-0">
          {comment.user.profilePicture ? (
            <img
              src={comment.user.profilePicture}
              alt={comment.user.name}
              className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] bg-gray-100 rounded-full flex items-center justify-center">
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
              <Link href={`/profile/${comment.user.username}`}>
                <span className="text-sm font-semibold text-gray-900 hover:text-[#007AFF] transition-colors">
                  {comment.user.name}
                </span>
              </Link>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>

            {/* More Menu */}
            {canDelete && (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="More options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
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
            <div className="flex items-center gap-2 mt-1.5">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 transition-colors ${
                  optimisticLiked
                    ? 'text-red-600 hover:text-red-700'
                    : 'text-gray-500 hover:text-red-600'
                } ${isLiking ? 'opacity-70' : ''}`}
                disabled={!onLike || isLiking}
              >
                <Heart
                  className={`w-[18px] h-[18px] ${optimisticLiked ? 'fill-current' : ''}`}
                />
                {optimisticLikeCount > 0 && (
                  <span className="text-xs font-medium">{optimisticLikeCount > 1 ? `${optimisticLikeCount} like${optimisticLikeCount > 1 ? 's' : ''}` : '1 like'}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;

