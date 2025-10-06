'use client';

import React, { useState } from 'react';
import { CommentWithDetails } from '@/types';
import CommentInput from './CommentInput';
import Link from 'next/link';
import { Heart, MessageCircle, ChevronDown, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface CommentItemProps {
  comment: CommentWithDetails;
  onReply: (commentId: string, content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
  onUnlike: (commentId: string) => Promise<void>;
  onLoadReplies: (commentId: string) => Promise<void>;
  currentUserId?: string;
  depth?: number;
  maxDepth?: number;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onUnlike,
  onLoadReplies,
  currentUserId,
  depth = 0,
  maxDepth = 3
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showEditInput, setShowEditInput] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUserId === comment.userId;
  const canReply = depth < maxDepth;

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

  const handleReplySubmit = async (content: string) => {
    await onReply(comment.id, content);
    setShowReplyInput(false);
    if (!showReplies && comment.replyCount > 0) {
      setShowReplies(true);
      await onLoadReplies(comment.id);
    }
  };

  const handleEditSubmit = async (content: string) => {
    await onEdit(comment.id, content);
    setShowEditInput(false);
  };

  const handleDelete = async () => {
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

  const handleLikeToggle = async () => {
    if (comment.isLiked) {
      await onUnlike(comment.id);
    } else {
      await onLike(comment.id);
    }
  };

  const handleToggleReplies = async () => {
    if (!showReplies && comment.replies && comment.replies.length === 0) {
      await onLoadReplies(comment.id);
    }
    setShowReplies(!showReplies);
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
    <div className={`${depth > 0 ? 'ml-8' : ''}`}>
      <div className="flex gap-3">
        {/* User Avatar */}
        {comment.user.profilePicture ? (
          <img
            src={comment.user.profilePicture}
            alt={comment.user.name}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className={`w-8 h-8 ${getUserColor(comment.user.id)} rounded-full flex items-center justify-center flex-shrink-0`}>
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
              <div className="relative ml-auto">
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

          {/* Actions */}
          {!showEditInput && (
            <div className="flex items-center gap-4 text-xs">
              <button
                onClick={handleLikeToggle}
                className={`flex items-center gap-1 font-medium transition-colors ${
                  comment.isLiked
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
              </button>

              {canReply && (
                <button
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  className="font-medium text-gray-500 hover:text-[#007AFF] transition-colors flex items-center gap-1"
                >
                  <MessageCircle className="w-4 h-4" />
                  Reply
                </button>
              )}

              {comment.replyCount > 0 && (
                <button
                  onClick={handleToggleReplies}
                  className="font-medium text-gray-500 hover:text-[#007AFF] transition-colors flex items-center gap-1"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${showReplies ? 'rotate-180' : ''}`} />
                  {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          )}

          {/* Reply Input */}
          {showReplyInput && canReply && (
            <div className="mt-3">
              <CommentInput
                sessionId={comment.sessionId}
                parentId={comment.id}
                placeholder={`Reply to ${comment.user.name}...`}
                autoFocus
                onSubmit={handleReplySubmit}
                onCancel={() => setShowReplyInput(false)}
              />
            </div>
          )}

          {/* Nested Replies */}
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLike={onLike}
                  onUnlike={onUnlike}
                  onLoadReplies={onLoadReplies}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;

