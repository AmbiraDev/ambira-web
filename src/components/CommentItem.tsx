'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CommentWithDetails } from '@/types';
import CommentInput from './CommentInput';
import Link from 'next/link';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface CommentItemProps {
  comment: CommentWithDetails;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  currentUserId?: string;
  compact?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onEdit,
  onDelete,
  currentUserId,
  compact = false
}) => {
  const [showEditInput, setShowEditInput] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUserId === comment.userId;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserColor = (userId: string): string => {
    const colors = [
      'bg-gradient-to-br from-orange-400 to-orange-600',
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
    ];
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
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

  const handleEditSubmit = async (content: string) => {
    if (!onEdit) return;
    await onEdit(comment.id, content);
    setShowEditInput(false);
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
        {comment.user.profilePicture ? (
          <img
            src={comment.user.profilePicture}
            alt={comment.user.name}
            className="w-8 h-8 min-w-[2rem] min-h-[2rem] rounded-full object-cover shrink-0"
          />
        ) : (
          <div className={`w-8 h-8 min-w-[2rem] min-h-[2rem] ${getUserColor(comment.user.id)} rounded-full flex items-center justify-center shrink-0`}>
            <span className="text-xs font-semibold text-white">
              {getUserInitials(comment.user.name)}
            </span>
          </div>
        )}

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
            {comment.isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
            
            {/* Menu Button */}
            {isOwner && !showEditInput && (
              <div className="relative ml-auto" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={() => {
                        setShowEditInput(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment Text or Edit Input */}
          {showEditInput ? (
            <div className="mb-2">
              <CommentInput
                sessionId={comment.sessionId}
                initialValue={comment.content}
                placeholder="Edit your comment..."
                autoFocus
                onSubmit={handleEditSubmit}
                onCancel={() => setShowEditInput(false)}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-900 mb-2 whitespace-pre-wrap break-words">
              {renderContent(comment.content)}
            </p>
          )}

        </div>
      </div>
    </div>
  );
};

export default CommentItem;

