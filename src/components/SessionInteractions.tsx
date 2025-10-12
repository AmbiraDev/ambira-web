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
      {/* Desktop layout - original Strava style */}
      <div className="hidden md:block">
        {/* Counts section - top left */}
        <div className="px-4 pb-3 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            {supportCount > 0 && (
              <button
                onClick={onLikesClick}
                className="hover:text-gray-900 hover:underline transition-colors font-medium"
              >
                {supportCount} {supportCount === 1 ? 'like' : 'likes'}
              </button>
            )}
          </div>
        </div>

        {/* Action buttons - Strava style (bottom right on desktop) */}
        <div className="border-t border-gray-200 px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            {/* Like button */}
            <button
              onClick={handleSupport}
              disabled={isSupporting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors ${
                isSupporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              title="Like"
            >
              <ThumbsUp
                className={`w-5 h-5 transition-colors ${
                  isSupported
                    ? 'fill-gray-700 text-gray-700'
                    : 'text-gray-600'
                }`}
                strokeWidth={1.5}
              />
              <span className={`text-sm font-medium ${
                isSupported ? 'text-gray-700' : 'text-gray-600'
              }`}>
                {supportCount > 0 ? supportCount : ''}
              </span>
            </button>

            {/* Comment button */}
            <button
              onClick={onCommentClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Comment"
            >
              <MessageSquare
                className="w-5 h-5 text-gray-600"
                strokeWidth={1.5}
              />
              <span className="text-sm font-medium text-gray-600">
                {commentCount > 0 ? commentCount : ''}
              </span>
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors ${
                isSharing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              title="Share"
            >
              <Share2
                className="w-5 h-5 text-gray-600"
                strokeWidth={1.5}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile layout - LinkedIn style */}
      <div className="md:hidden">
        {/* Counts section */}
        <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-600">
          <button
            onClick={onLikesClick}
            className="hover:text-gray-900 transition-colors"
            disabled={supportCount === 0}
          >
            {supportCount} {supportCount === 1 ? 'like' : 'likes'}
          </button>
          <button
            onClick={onCommentClick}
            className="hover:text-gray-900 transition-colors"
          >
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </button>
        </div>

        {/* Action buttons - 3 equal width columns */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-1">
            {/* Like button */}
            <button
              onClick={handleSupport}
              disabled={isSupporting}
              className={`flex flex-col items-center justify-center py-2 rounded hover:bg-gray-50 transition-colors ${
                isSupporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              title="Like"
            >
              <ThumbsUp
                className={`w-6 h-6 transition-colors ${
                  isSupported
                    ? 'fill-gray-700 text-gray-700'
                    : 'text-gray-600'
                }`}
                strokeWidth={1.5}
              />
            </button>

            {/* Comment button */}
            <button
              onClick={onCommentClick}
              className="flex flex-col items-center justify-center py-2 rounded hover:bg-gray-50 transition-colors"
              title="Comment"
            >
              <MessageSquare
                className="w-6 h-6 text-gray-600"
                strokeWidth={1.5}
              />
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className={`flex flex-col items-center justify-center py-2 rounded hover:bg-gray-50 transition-colors ${
                isSharing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              title="Share"
            >
              <Share2
                className="w-6 h-6 text-gray-600"
                strokeWidth={1.5}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionInteractions;
