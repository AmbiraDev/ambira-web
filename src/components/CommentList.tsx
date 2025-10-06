'use client';

import React, { useState, useEffect } from 'react';
import { CommentWithDetails } from '@/types';
import { firebaseCommentApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';

interface CommentListProps {
  sessionId: string;
  initialCommentCount?: number;
  onCommentCountChange?: (count: number) => void;
  showPagination?: boolean;
  commentsPerPage?: number;
}

export const CommentList: React.FC<CommentListProps> = ({
  sessionId,
  initialCommentCount = 0,
  onCommentCountChange
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);

  // Load initial comments
  useEffect(() => {
    loadComments();
  }, [sessionId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await firebaseCommentApi.getSessionComments(sessionId, 10);
      setComments(response.comments);
      setHasMore(response.hasMore);
    } catch (err: any) {
      console.error('Failed to load comments:', err);
      setError(err.message || 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreComments = async () => {
    if (!hasMore || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      // In a real implementation, you'd pass the last document for pagination
      // For now, this is a placeholder
      const response = await firebaseCommentApi.getSessionComments(sessionId, 10);
      setComments([...comments, ...response.comments]);
      setHasMore(response.hasMore);
    } catch (err: any) {
      console.error('Failed to load more comments:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCreateComment = async (content: string) => {
    try {
      const newComment = await firebaseCommentApi.createComment({
        sessionId,
        content
      });

      // Add to the beginning of the list with optimistic update
      const newComments = [newComment, ...comments];
      setComments(newComments);
      setShowInput(false);

      // Update parent component's count
      if (onCommentCountChange) {
        onCommentCountChange(newComments.length);
      }
    } catch (err: any) {
      console.error('Failed to create comment:', err);
      throw err;
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    try {
      const newReply = await firebaseCommentApi.createComment({
        sessionId,
        content,
        parentId
      });

      // Update the comments list to add the reply
      setComments(prevComments => 
        prevComments.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replyCount: comment.replyCount + 1,
              replies: [...(comment.replies || []), newReply]
            };
          }
          return comment;
        })
      );
    } catch (err: any) {
      console.error('Failed to reply to comment:', err);
      throw err;
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    try {
      await firebaseCommentApi.updateComment(commentId, { content });
      
      // Update the comment in the list
      const updateComment = (items: CommentWithDetails[]): CommentWithDetails[] => {
        return items.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, content, isEdited: true, updatedAt: new Date() };
          }
          if (comment.replies) {
            return { ...comment, replies: updateComment(comment.replies) };
          }
          return comment;
        });
      };
      
      setComments(updateComment(comments));
    } catch (err: any) {
      console.error('Failed to edit comment:', err);
      throw err;
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await firebaseCommentApi.deleteComment(commentId);

      // Remove the comment from the list
      const removeComment = (items: CommentWithDetails[]): CommentWithDetails[] => {
        return items.filter(comment => {
          if (comment.id === commentId) return false;
          if (comment.replies) {
            comment.replies = removeComment(comment.replies);
          }
          return true;
        });
      };

      const newComments = removeComment(comments);
      setComments(newComments);

      // Update parent component's count
      if (onCommentCountChange) {
        onCommentCountChange(newComments.length);
      }
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      throw err;
    }
  };

  const handleLike = async (commentId: string) => {
    try {
      // Optimistic update
      const updateLike = (items: CommentWithDetails[]): CommentWithDetails[] => {
        return items.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, isLiked: true, likeCount: comment.likeCount + 1 };
          }
          if (comment.replies) {
            return { ...comment, replies: updateLike(comment.replies) };
          }
          return comment;
        });
      };
      
      setComments(updateLike(comments));
      await firebaseCommentApi.likeComment(commentId);
    } catch (err: any) {
      console.error('Failed to like comment:', err);
      // Revert optimistic update
      loadComments();
      throw err;
    }
  };

  const handleUnlike = async (commentId: string) => {
    try {
      // Optimistic update
      const updateLike = (items: CommentWithDetails[]): CommentWithDetails[] => {
        return items.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, isLiked: false, likeCount: Math.max(0, comment.likeCount - 1) };
          }
          if (comment.replies) {
            return { ...comment, replies: updateLike(comment.replies) };
          }
          return comment;
        });
      };
      
      setComments(updateLike(comments));
      await firebaseCommentApi.unlikeComment(commentId);
    } catch (err: any) {
      console.error('Failed to unlike comment:', err);
      // Revert optimistic update
      loadComments();
      throw err;
    }
  };

  const handleLoadReplies = async (commentId: string) => {
    try {
      const replies = await firebaseCommentApi.getReplies(commentId);
      
      // Update the comment with loaded replies
      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, replies };
          }
          return comment;
        })
      );
    } catch (err: any) {
      console.error('Failed to load replies:', err);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
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
        <div className="text-center text-red-600 mb-4">
          {error}
        </div>
        <button
          onClick={loadComments}
          className="w-full py-2 text-sm font-medium text-[#007AFF] hover:text-[#0051D5]"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Comment Count Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          {comments.length > 0 ? `${comments.length} ${comments.length === 1 ? 'Comment' : 'Comments'}` : 'Comments'}
        </h3>
      </div>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4 mb-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onLike={handleLike}
              onUnlike={handleUnlike}
              onLoadReplies={handleLoadReplies}
              currentUserId={user?.id}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <button
              onClick={loadMoreComments}
              disabled={isLoadingMore}
              className="w-full py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? 'Loading...' : 'Load more comments'}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 text-sm mb-4">
          No comments yet. Be the first to comment!
        </div>
      )}

      {/* Comment Input - Always at bottom */}
      <div className="border-t border-gray-200 pt-4">
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
            className="w-full text-left px-4 py-3 text-gray-500 border border-gray-300 rounded-lg hover:border-[#007AFF] transition-colors"
          >
            Add a comment, @ to mention
          </button>
        )}
      </div>
    </div>
  );
};

export default CommentList;

