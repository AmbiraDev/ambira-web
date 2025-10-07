'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SessionWithDetails, CommentWithDetails } from '@/types';
import { firebaseSessionApi, firebaseCommentApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import SessionCard from '@/components/SessionCard';
import CommentInput from '@/components/CommentInput';
import CommentItem from '@/components/CommentItem';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const COMMENTS_PER_PAGE = 10;

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [comments, setComments] = useState<CommentWithDetails[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(totalComments / COMMENTS_PER_PAGE);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    loadComments();
  }, [sessionId, currentPage]);

  const loadSession = async () => {
    try {
      setIsLoadingSession(true);
      const sessionData = await firebaseSessionApi.getSessionWithDetails(sessionId);
      setSession(sessionData);
      setTotalComments(sessionData.commentCount || 0);
    } catch (err: any) {
      console.error('Failed to load session:', err);
      setError(err.message || 'Failed to load session');
    } finally {
      setIsLoadingSession(false);
    }
  };

  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      setError(null);
      const response = await firebaseCommentApi.getSessionComments(sessionId, COMMENTS_PER_PAGE);
      setComments(response.comments);
    } catch (err: any) {
      // Permission errors are handled gracefully in firebaseApi, so this should only catch real errors
      setError(err.message || 'Failed to load comments');
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleCreateComment = async (content: string) => {
    try {
      const newComment = await firebaseCommentApi.createComment({
        sessionId,
        content
      });

      // Add to the beginning of the list
      setComments([newComment, ...comments]);
      setTotalComments(prev => prev + 1);
      
      // Reload session to update comment count
      loadSession();
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

      setComments(removeComment(comments));
      setTotalComments(prev => prev - 1);
      
      // Reload session to update comment count
      loadSession();
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

  const handleSupport = async (sessionId: string) => {
    // Implement support logic
  };

  const handleRemoveSupport = async (sessionId: string) => {
    // Implement remove support logic
  };

  const handleShare = async (sessionId: string) => {
    // Implement share logic
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Link href="/" className="text-[#007AFF] hover:text-[#0051D5]">
              Go back to feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Session</h1>
        </div>
      </div>

      {/* Session Card */}
      <div className="max-w-2xl mx-auto">
        <SessionCard
          session={session}
          onSupport={handleSupport}
          onRemoveSupport={handleRemoveSupport}
          onShare={handleShare}
          showComments={false}
        />
      </div>

      {/* Comments Section */}
      <div className="max-w-2xl mx-auto bg-white border-t border-gray-200">
        <div className="px-4 py-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {totalComments} {totalComments === 1 ? 'Comment' : 'Comments'}
          </h2>

          {/* Comment Input */}
          <div className="mb-6">
            <CommentInput
              sessionId={sessionId}
              placeholder="Add a comment, @ to mention"
              onSubmit={handleCreateComment}
            />
          </div>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="space-y-4">
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
          ) : comments.length > 0 ? (
            <>
              <div className="space-y-4 mb-6">
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
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage =
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1);

                      const showEllipsis =
                        (page === 2 && currentPage > 3) ||
                        (page === totalPages - 1 && currentPage < totalPages - 2);

                      if (showEllipsis) {
                        return (
                          <span key={page} className="px-2 text-gray-500">
                            ...
                          </span>
                        );
                      }

                      if (!showPage) return null;

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[40px] h-10 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-[#007AFF] text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
