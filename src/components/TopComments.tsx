'use client';

import React, { useState, useEffect } from 'react';
import { CommentWithDetails } from '@/types';
import { firebaseCommentApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import CommentItem from './CommentItem';
import Link from 'next/link';

interface TopCommentsProps {
  sessionId: string;
  totalCommentCount: number;
}

export const TopComments: React.FC<TopCommentsProps> = ({
  sessionId,
  totalCommentCount
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTopComments();
  }, [sessionId]);

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

  const handleLike = async (commentId: string) => {
    try {
      // Optimistic update
      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, isLiked: true, likeCount: comment.likeCount + 1 };
          }
          return comment;
        })
      );
      await firebaseCommentApi.likeComment(commentId);
    } catch (err: any) {
      console.error('Failed to like comment:', err);
      // Revert optimistic update
      loadTopComments();
    }
  };

  const handleUnlike = async (commentId: string) => {
    try {
      // Optimistic update
      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, isLiked: false, likeCount: Math.max(0, comment.likeCount - 1) };
          }
          return comment;
        })
      );
      await firebaseCommentApi.unlikeComment(commentId);
    } catch (err: any) {
      console.error('Failed to unlike comment:', err);
      // Revert optimistic update
      loadTopComments();
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-3 space-y-3">
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
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onLike={handleLike}
            onUnlike={handleUnlike}
            currentUserId={user?.id}
            compact={true}
            showReplies={false}
          />
        ))}

        {totalCommentCount > 0 && (
          <Link
            href={`/sessions/${sessionId}`}
            className="block text-sm text-gray-600 hover:text-gray-900 font-medium py-1"
          >
            See all {totalCommentCount} {totalCommentCount === 1 ? 'comment' : 'comments'}
          </Link>
        )}
      </div>
    </div>
  );
};

export default TopComments;
