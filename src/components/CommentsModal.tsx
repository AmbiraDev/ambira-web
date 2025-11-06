'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SessionWithDetails } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import {
  useSessionComments,
  useCreateComment,
  useDeleteComment,
  useCommentLike,
} from '@/features/comments/hooks';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import Link from 'next/link';
import Image from 'next/image';
import { debug } from '@/lib/debug';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  session?: SessionWithDetails;
  totalCommentCount: number;
  onCommentCountChange?: (count: number) => void;
}

const COMMENTS_PER_PAGE = 5;

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  session,
  totalCommentCount,
  onCommentCountChange,
}) => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch comments when modal is open
  const {
    data: commentsResponse,
    isLoading,
    refetch,
  } = useSessionComments(sessionId, 100, {
    enabled: isOpen, // Only fetch when modal is open
  });

  const createCommentMutation = useCreateComment({
    onSuccess: () => {
      if (onCommentCountChange) {
        onCommentCountChange(totalCommentCount + 1);
      }
      // Refetch comments to show the new comment immediately
      refetch();
    },
  });

  const deleteCommentMutation = useDeleteComment({
    onSuccess: () => {
      if (onCommentCountChange) {
        onCommentCountChange(Math.max(0, totalCommentCount - 1));
      }
      // Refetch comments to update the list immediately
      refetch();
    },
  });

  const likeMutation = useCommentLike(sessionId);

  const allComments = commentsResponse?.comments || [];
  const totalPages = Math.ceil(allComments.length / COMMENTS_PER_PAGE);

  // Calculate paginated comments
  const comments = allComments.slice(
    (currentPage - 1) * COMMENTS_PER_PAGE,
    currentPage * COMMENTS_PER_PAGE
  );

  // Refetch when modal opens
  useEffect(() => {
    if (isOpen) {
      refetch();
      setCurrentPage(1); // Reset to first page
    }
  }, [isOpen, sessionId, refetch]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleCreateComment = async (content: string) => {
    try {
      await createCommentMutation.mutateAsync({
        sessionId,
        content,
      });
    } catch (err: unknown) {
      debug.error('CommentsModal - Failed to create comment:', err);
      throw err;
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteCommentMutation.mutateAsync({ commentId, sessionId });
    } catch (err: unknown) {
      debug.error('CommentsModal - Failed to delete comment:', err);
      throw err;
    }
  };

  const handleLike = (commentId: string, action: 'like' | 'unlike') => {
    likeMutation.mutate({ commentId, action });
  };

  if (!isOpen) return null;

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDistance = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-white sm:bg-black/60 sm:flex sm:items-center sm:justify-center sm:p-4"
      onClick={e => {
        // Only close on backdrop click for desktop
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white w-full h-full sm:rounded-2xl sm:max-w-2xl sm:h-auto sm:max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Navigation Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 -ml-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close comments and return to home"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" aria-hidden="true" />
            <span className="text-base font-medium text-gray-900">Home</span>
          </button>
          <h1 className="text-base font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
            Comments
          </h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Session Info Card */}
        {session && (
          <div className="px-4 py-2.5 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1.5">
                {session.title || 'Focus Session'}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Link
                  href={`/profile/${session.user.username}`}
                  className="flex items-center gap-2 hover:text-gray-900"
                >
                  {session.user.profilePicture ? (
                    <Image
                      src={session.user.profilePicture}
                      alt={session.user.name}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-[10px] font-semibold text-gray-600">
                        {getUserInitials(session.user.name)}
                      </span>
                    </div>
                  )}
                  <span className="font-medium">{session.user.name}</span>
                </Link>
                <span>·</span>
                <span>{formatDate(session.createdAt)}</span>
                {session.duration && (
                  <>
                    <span>·</span>
                    <span>{formatDistance(session.duration)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comments list - scrollable area */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-4">
                {comments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    sessionId={sessionId}
                    onDelete={handleDelete}
                    onLike={handleLike}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm font-medium">Previous</span>
            </button>

            <span className="text-sm text-gray-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage(prev => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <span className="text-sm font-medium">Next</span>
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Comment Input - Fixed at bottom, above nav bar */}
        <div className="px-4 pb-3 bg-white flex-shrink-0">
          <CommentInput
            placeholder="Add a comment"
            onSubmit={handleCreateComment}
            autoFocus={false}
          />
        </div>
        {/* Safe area padding for mobile bottom navigation */}
        <div className="h-20 sm:h-0 flex-shrink-0 bg-white"></div>
      </div>
    </div>
  );
};

export default CommentsModal;
