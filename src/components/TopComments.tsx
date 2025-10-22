'use client';

import React, { useState, useEffect } from 'react';
import { CommentWithDetails } from '@/types';
import { firebaseCommentApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import { useCommentLikeMutation } from '@/hooks/useMutations';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TopCommentsProps {
  sessionId: string;
  totalCommentCount: number;
  onCommentCountChange?: (count: number) => void;
  autoFocus?: boolean;
  initialExpanded?: boolean;
}

const COMMENTS_PER_PAGE = 5;

export const TopComments: React.FC<TopCommentsProps> = ({
  sessionId,
  totalCommentCount,
  onCommentCountChange,
  autoFocus = false,
  initialExpanded = false
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithDetails[]>([]);
  const [allComments, setAllComments] = useState<CommentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(totalCommentCount / COMMENTS_PER_PAGE);
  const likeMutation = useCommentLikeMutation(sessionId);

  useEffect(() => {
    loadTopComments();
  }, [sessionId]);

  useEffect(() => {
    if (isExpanded) {
      loadAllComments();
    }
  }, [isExpanded, sessionId]);

  // Reload comments when totalCommentCount changes (e.g., from CommentsModal)
  useEffect(() => {
    if (isExpanded) {
      loadAllComments();
    } else {
      loadTopComments();
    }
  }, [totalCommentCount]);

  useEffect(() => {
    if (isExpanded && allComments.length > 0) {
      updateDisplayedComments();
    }
  }, [currentPage, allComments, isExpanded]);

  const loadTopComments = async () => {
    try {
      setIsLoading(true);
      const topComments = await firebaseCommentApi.getTopComments(sessionId, 2);
      setComments(topComments);
    } catch (err: any) {
      console.error('Failed to load top comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllComments = async () => {
    try {
      setIsLoading(true);
      const response = await firebaseCommentApi.getSessionComments(sessionId, 100);
      setAllComments(response.comments);
      updateDisplayedComments();
    } catch (err: any) {
      console.error('Failed to load all comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDisplayedComments = () => {
    const startIndex = (currentPage - 1) * COMMENTS_PER_PAGE;
    const endIndex = startIndex + COMMENTS_PER_PAGE;
    setComments(allComments.slice(startIndex, endIndex));
  };

  const handleCreateComment = async (content: string) => {
    try {
      const newComment = await firebaseCommentApi.createComment({
        sessionId,
        content
      });

      if (isExpanded) {
        setAllComments([newComment, ...allComments]);
        setComments([newComment, ...comments.slice(0, COMMENTS_PER_PAGE - 1)]);
      } else {
        setComments([newComment, ...comments.slice(0, 1)]);
      }

      if (onCommentCountChange) {
        onCommentCountChange(totalCommentCount + 1);
      }
    } catch (err: any) {
      console.error('Failed to create comment:', err);
      throw err;
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await firebaseCommentApi.deleteComment(commentId);

      const removeComment = (items: CommentWithDetails[]): CommentWithDetails[] => {
        return items.filter(comment => {
          if (comment.id === commentId) return false;
          if (comment.replies) {
            comment.replies = removeComment(comment.replies);
          }
          return true;
        });
      };

      setComments(removeComment(comments));
      if (isExpanded) {
        setAllComments(removeComment(allComments));
      }

      if (onCommentCountChange) {
        onCommentCountChange(totalCommentCount - 1);
      }
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      throw err;
    }
  };

  const handleLike = (commentId: string, action: 'like' | 'unlike') => {
    likeMutation.mutate({ commentId, action });
  };

  if (isLoading && !isExpanded) {
    return (
      <div className="border-t border-gray-100 px-4 py-3 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0 && totalCommentCount === 0 && !autoFocus) {
    return null;
  }

  return (
    <div className={(isExpanded || (comments.length > 0 && !isExpanded)) ? 'hidden md:block md:border-t md:border-gray-100' : ''}>
      <div className="px-4 py-2 space-y-2">
        {/* Comments List - Only show in collapsed view if there are comments (hidden on mobile) */}
        {!isExpanded && comments.length > 0 && (
          <>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                sessionId={sessionId}
                onDelete={handleDelete}
                onLike={handleLike}
                currentUserId={user?.id}
              />
            ))}

            {/* See all comments link */}
            {totalCommentCount > 2 && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-sm text-gray-500 hover:text-gray-900 font-medium py-2 transition-colors"
              >
                See all {totalCommentCount} {totalCommentCount === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </>
        )}


        {/* Expanded Comments */}
        {isExpanded && (
          <>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                sessionId={sessionId}
                onDelete={handleDelete}
                onLike={handleLike}
                currentUserId={user?.id}
              />
            ))}
          </>
        )}

        {/* Comment Input - Only show when expanded or autoFocus */}
        {(isExpanded || autoFocus) && (
          <div className={`${isExpanded ? 'pt-2 border-t border-gray-100' : ''}`}>
            <CommentInput
              sessionId={sessionId}
              placeholder="Add a comment..."
              onSubmit={handleCreateComment}
              autoFocus={autoFocus}
            />
          </div>
        )}

        {/* Pagination Controls - Only in expanded view */}
        {isExpanded && totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            <span className="text-sm text-gray-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        )}

        {/* Collapse Button */}
        {isExpanded && (
          <button
            onClick={() => {
              setIsExpanded(false);
              setCurrentPage(1);
              loadTopComments();
            }}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium py-1"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
};

export default TopComments;
