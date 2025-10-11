'use client';

import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CommentWithDetails } from '@/types';
import { firebaseCommentApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  totalCommentCount: number;
  onCommentCountChange?: (count: number) => void;
}

const COMMENTS_PER_PAGE = 10;

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  totalCommentCount,
  onCommentCountChange
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithDetails[]>([]);
  const [allComments, setAllComments] = useState<CommentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(totalCommentCount / COMMENTS_PER_PAGE);

  useEffect(() => {
    if (isOpen) {
      loadAllComments();
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (allComments.length > 0) {
      updateDisplayedComments();
    }
  }, [currentPage, allComments]);

  const loadAllComments = async () => {
    try {
      setIsLoading(true);
      const response = await firebaseCommentApi.getSessionComments(sessionId, 100);
      setAllComments(response.comments);
      updateDisplayedComments();
    } catch (err: any) {
      // Permission errors are handled gracefully in firebaseApi
      // Real errors will still surface but won't spam console
      setAllComments([]);
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

      setAllComments([newComment, ...allComments]);
      setComments([newComment, ...comments.slice(0, COMMENTS_PER_PAGE - 1)]);

      if (onCommentCountChange) {
        onCommentCountChange(totalCommentCount + 1);
      }
    } catch (err: any) {
      console.error('Failed to create comment:', err);
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
      setAllComments(updateComment(allComments));
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
      setAllComments(removeComment(allComments));

      if (onCommentCountChange) {
        onCommentCountChange(totalCommentCount - 1);
      }
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      throw err;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-none sm:rounded-2xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-gray-900 font-semibold text-lg">
            Comments ({totalCommentCount})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Comment Input */}
        <div className="p-4 border-b border-gray-200">
          <CommentInput
            sessionId={sessionId}
            placeholder="Add a comment..."
            onSubmit={handleCreateComment}
            autoFocus={true}
          />
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  currentUserId={user?.id}
                  compact={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Previous</span>
            </button>

            <span className="text-sm text-gray-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <span className="text-sm font-medium">Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsModal;
