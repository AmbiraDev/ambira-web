'use client';

import React, { useState, useEffect } from 'react';
import { CommentWithDetails } from '@/types';
import { firebaseCommentApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TopCommentsProps {
  sessionId: string;
  totalCommentCount: number;
  onCommentCountChange?: (count: number) => void;
}

const COMMENTS_PER_PAGE = 5;

export const TopComments: React.FC<TopCommentsProps> = ({
  sessionId,
  totalCommentCount,
  onCommentCountChange
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithDetails[]>([]);
  const [allComments, setAllComments] = useState<CommentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(totalCommentCount / COMMENTS_PER_PAGE);

  useEffect(() => {
    loadTopComments();
  }, [sessionId]);

  useEffect(() => {
    if (isExpanded) {
      loadAllComments();
    }
  }, [isExpanded, sessionId]);

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

  const handleReply = async (parentId: string, content: string) => {
    try {
      const newReply = await firebaseCommentApi.createComment({
        sessionId,
        content,
        parentId
      });

      const updateComments = (items: CommentWithDetails[]): CommentWithDetails[] => {
        return items.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replyCount: comment.replyCount + 1,
              replies: [...(comment.replies || []), newReply]
            };
          }
          return comment;
        });
      };

      setComments(updateComments(comments));
      if (isExpanded) {
        setAllComments(updateComments(allComments));
      }
    } catch (err: any) {
      console.error('Failed to reply to comment:', err);
      throw err;
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    try {
      await firebaseCommentApi.updateComment(commentId, { content });

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
      if (isExpanded) {
        setAllComments(updateComment(allComments));
      }
    } catch (err: any) {
      console.error('Failed to edit comment:', err);
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

  const handleLike = async (commentId: string) => {
    try {
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
      if (isExpanded) {
        setAllComments(updateLike(allComments));
      }
      await firebaseCommentApi.likeComment(commentId);
    } catch (err: any) {
      console.error('Failed to like comment:', err);
      isExpanded ? loadAllComments() : loadTopComments();
    }
  };

  const handleUnlike = async (commentId: string) => {
    try {
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
      if (isExpanded) {
        setAllComments(updateLike(allComments));
      }
      await firebaseCommentApi.unlikeComment(commentId);
    } catch (err: any) {
      console.error('Failed to unlike comment:', err);
      isExpanded ? loadAllComments() : loadTopComments();
    }
  };

  const handleLoadReplies = async (commentId: string) => {
    try {
      const replies = await firebaseCommentApi.getReplies(commentId);

      const updateReplies = (items: CommentWithDetails[]): CommentWithDetails[] => {
        return items.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, replies };
          }
          return comment;
        });
      };

      setComments(updateReplies(comments));
      if (isExpanded) {
        setAllComments(updateReplies(allComments));
      }
    } catch (err: any) {
      console.error('Failed to load replies:', err);
      throw err;
    }
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

  if (comments.length === 0 && totalCommentCount === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-100">
      <div className="px-4 py-3 space-y-3">
        {/* Comments List */}
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={handleReply}
            onEdit={isExpanded ? handleEdit : undefined}
            onDelete={isExpanded ? handleDelete : undefined}
            onLike={handleLike}
            onUnlike={handleUnlike}
            onLoadReplies={handleLoadReplies}
            currentUserId={user?.id}
            compact={!isExpanded}
            showReplies={isExpanded}
          />
        ))}

        {/* Show More Button */}
        {!isExpanded && totalCommentCount > 2 && (
          <button
            onClick={() => {
              setIsExpanded(true);
              setCurrentPage(1);
            }}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium py-1"
          >
            Show more comments
          </button>
        )}

        {/* Comment Input - Always visible */}
        <div className="pt-2 border-t border-gray-100">
          <CommentInput
            sessionId={sessionId}
            placeholder="Add a comment, @ to mention"
            onSubmit={handleCreateComment}
          />
        </div>

        {/* Expanded View with Pagination */}
        {isExpanded && (
          <>
            {/* Pagination Controls */}
            {totalPages > 1 && (
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
          </>
        )}
      </div>
    </div>
  );
};

export default TopComments;
