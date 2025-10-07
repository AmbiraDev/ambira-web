'use client';

import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Share2 } from 'lucide-react';

interface SessionInteractionsProps {
  sessionId: string;
  supportCount: number;
  commentCount: number;
  isSupported: boolean;
  supportedBy?: string[];
  onSupport: (sessionId: string) => Promise<void>;
  onRemoveSupport: (sessionId: string) => Promise<void>;
  onShare: (sessionId: string) => Promise<void>;
  onCommentClick?: () => void;
  onLikesClick?: () => void;
  onViewAllCommentsClick?: () => void;
  className?: string;
}

export const SessionInteractions: React.FC<SessionInteractionsProps> = ({
  sessionId,
  supportCount,
  commentCount,
  isSupported,
  supportedBy = [],
  onSupport,
  onRemoveSupport,
  onShare,
  onCommentClick,
  onLikesClick,
  onViewAllCommentsClick,
  className = ''
}) => {
  const [isSupporting, setIsSupporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleSupport = async () => {
    if (isSupporting) return;

    setIsSupporting(true);
    try {
      if (isSupported) {
        await onRemoveSupport(sessionId);
      } else {
        await onSupport(sessionId);
      }
    } catch (error) {
      console.error('Failed to update support:', error);
    } finally {
      setIsSupporting(false);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;

    setIsSharing(true);
    try {
      await onShare(sessionId);
    } catch (error) {
      console.error('Failed to share session:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className={className}>
      {/* Counts section */}
      <div className="px-4 pb-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          {supportCount > 0 && (
            <button
              onClick={onLikesClick}
              className="hover:text-blue-600 hover:underline transition-colors"
            >
              {supportCount} {supportCount === 1 ? 'like' : 'likes'}
            </button>
          )}
        </div>
      </div>

      {/* Action buttons - LinkedIn style */}
      <div className="border-t border-b border-gray-200 px-2">
        <div className="flex items-center justify-around">
          {/* Like button */}
          <button
            onClick={handleSupport}
            disabled={isSupporting}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors flex-1 justify-center ${
              isSupporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <ThumbsUp
              className={`w-5 h-5 transition-colors ${
                isSupported
                  ? 'fill-blue-600 text-blue-600'
                  : 'text-gray-600'
              }`}
              strokeWidth={1.5}
            />
            <span className={`font-medium text-sm ${
              isSupported ? 'text-blue-600' : 'text-gray-600'
            }`}>
              Like
            </span>
          </button>

          {/* Comment button */}
          <button
            onClick={onCommentClick}
            className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors flex-1 justify-center"
          >
            <MessageSquare
              className="w-5 h-5 text-gray-600"
              strokeWidth={1.5}
            />
            <span className="font-medium text-sm text-gray-600">
              Comment
            </span>
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            disabled={isSharing}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors flex-1 justify-center ${
              isSharing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <Share2
              className="w-5 h-5 text-gray-600"
              strokeWidth={1.5}
            />
            <span className="font-medium text-sm text-gray-600">
              Send
            </span>
          </button>
        </div>
      </div>

      {/* View all comments button - show if there are any comments */}
      {commentCount > 0 && (
        <div className="px-4 pt-2 pb-1">
          <button
            onClick={onViewAllCommentsClick}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            View all {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionInteractions;
