'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useSessionComments,
  useCreateComment,
  useDeleteComment,
  useCommentLike,
} from '@/features/comments/hooks';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';

interface CommentListProps {
  sessionId: string;
  onCommentCountChange?: (count: number) => void;
  showPagination?: boolean;
  commentsPerPage?: number;
  initialCommentCount?: number;
}

export const CommentList: React.FC<CommentListProps> = ({
  sessionId,
  onCommentCountChange,
  initialCommentCount: _initialCommentCount,
}) => {
  const { user } = useAuth();
  const [showInput, setShowInput] = useState(false);

  // Use new React Query hooks
  const {
    data: commentsResponse,
    isLoading,
    error: queryError,
    refetch,
  } = useSessionComments(sessionId, 20);

  const createCommentMutation = useCreateComment({
    onSuccess: () => {
      setShowInput(false);
      // Update parent component's count
      if (onCommentCountChange && commentsResponse) {
        onCommentCountChange(commentsResponse.comments.length + 1);
      }
    },
  });

  const deleteCommentMutation = useDeleteComment({
    onSuccess: () => {
      // Update parent component's count
      if (onCommentCountChange && commentsResponse) {
        onCommentCountChange(Math.max(0, commentsResponse.comments.length - 1));
      }
    },
  });

  const likeMutation = useCommentLike(sessionId);

  const comments = commentsResponse?.comments || [];
  const hasMore = commentsResponse?.hasMore || false;
  const error = queryError?.message || null;

  const handleCreateComment = async (content: string) => {
    try {
      await createCommentMutation.mutateAsync({
        sessionId,
        content,
      });
    } catch (err: unknown) {
      console.error('Failed to create comment:', err);
      throw err;
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteCommentMutation.mutateAsync({ commentId, sessionId });
    } catch (err: unknown) {
      console.error('Failed to delete comment:', err);
      throw err;
    }
  };

  const handleLike = (commentId: string, action: 'like' | 'unlike') => {
    likeMutation.mutate({ commentId, action });
  };

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-2.5 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4">
        <div className="text-center text-red-600 mb-4">{error}</div>
        <button
          onClick={() => refetch()}
          className="w-full py-2 text-sm font-medium text-[#0066CC] hover:text-[#0051D5]"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Comment Count Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-900">
          {comments.length > 0
            ? `${comments.length} ${comments.length === 1 ? 'Comment' : 'Comments'}`
            : 'Comments'}
        </h3>
      </div>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-3 mb-3">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={handleDelete}
              onLike={handleLike}
              currentUserId={user?.id}
            />
          ))}

          {/* Load More indicator - pagination can be added later if needed */}
          {hasMore && (
            <div className="text-center text-sm text-gray-500 py-2">
              Showing first {comments.length} comments
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 text-sm mb-3">
          No comments yet. Be the first to comment!
        </div>
      )}

      {/* Comment Input - Always at bottom */}
      <div className="border-t border-gray-200 pt-3">
        {showInput ? (
          <CommentInput
            sessionId={sessionId}
            placeholder="Add a comment, @ to mention"
            autoFocus
            onSubmit={handleCreateComment}
            onCancel={() => setShowInput(false)}
          />
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="w-full text-left px-4 py-3 text-gray-500 border border-gray-300 rounded-lg hover:border-[#0066CC] transition-colors"
          >
            Add a comment, @ to mention
          </button>
        )}
      </div>
    </div>
  );
};

export default CommentList;
