'use client';

import React, { useState } from 'react';
import { CommentWithDetails } from '@/types';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';

interface CommentItemProps {
  comment: CommentWithDetails;
  onDelete?: (commentId: string) => Promise<void>;
  currentUserId?: string;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onDelete,
  currentUserId
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUserId === comment.userId;
  const canDelete = isOwner && !!onDelete;

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const commentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Format time as "h:mm am/pm"
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Check if today
    if (commentDate.getTime() === today.getTime()) {
      return `Today at ${timeStr}`;
    }

    // Check if yesterday
    if (commentDate.getTime() === yesterday.getTime()) {
      return `Yesterday at ${timeStr}`;
    }

    // Otherwise show full date: "Month Day, Year at h:mm am/pm"
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return `${dateStr} at ${timeStr}`;
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

  if (isDeleting) {
    return (
      <div className="flex gap-3 opacity-50">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-3">
        {/* User Avatar */}
        <Link href={`/profile/${comment.user.username}`} className="shrink-0">
          {comment.user.profilePicture ? (
            <img
              src={comment.user.profilePicture}
              alt={comment.user.name}
              className="w-8 h-8 min-w-[2rem] min-h-[2rem] rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 min-w-[2rem] min-h-[2rem] bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-600">
                {getUserInitials(comment.user.name)}
              </span>
            </div>
          )}
        </Link>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/profile/${comment.user.username}`}>
              <span className="text-sm font-semibold text-gray-900 hover:text-[#007AFF] transition-colors">
                {comment.user.name}
              </span>
            </Link>
            <span className="text-xs text-gray-500">
              {formatTimeAgo(comment.createdAt)}
            </span>

            {/* Delete Button */}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="ml-auto text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                title="Delete comment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Comment Text */}
          <p className="text-sm text-gray-900 mb-2 whitespace-pre-wrap break-words">
            {renderContent(comment.content)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommentItem;

