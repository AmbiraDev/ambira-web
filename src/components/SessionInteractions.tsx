'use client';

import React, { useState } from 'react';

interface SessionInteractionsProps {
  sessionId: string;
  supportCount: number;
  commentCount: number;
  isSupported: boolean;
  onSupport: (sessionId: string) => Promise<void>;
  onRemoveSupport: (sessionId: string) => Promise<void>;
  onShare: (sessionId: string) => Promise<void>;
  onCommentClick?: () => void;
  className?: string;
}

export const SessionInteractions: React.FC<SessionInteractionsProps> = ({
  sessionId,
  supportCount,
  commentCount,
  isSupported,
  onSupport,
  onRemoveSupport,
  onShare,
  onCommentClick,
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
    <div className={`flex items-center justify-between py-4 px-6 border-t border-gray-200 ${className}`}>
      {/* Left side - Support and Comments */}
      <div className="flex items-center gap-1">
        {/* Support Button */}
        <button
          onClick={handleSupport}
          disabled={isSupporting}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
            isSupported
              ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
              : 'text-gray-600 hover:bg-gray-100 hover:text-orange-600'
          } ${isSupporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <svg
            className="w-5 h-5"
            fill={isSupported ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={isSupported ? 0 : 2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className="text-sm">
            {isSupported ? 'Supported' : 'Give Support'}
          </span>
        </button>

        {/* Comments */}
        <button
          onClick={onCommentClick}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="text-sm">
            Comment {commentCount > 0 && `(${commentCount})`}
          </span>
        </button>
      </div>

      {/* Right side - Share */}
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 hover:text-green-600 transition-all ${
          isSharing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
          />
        </svg>
        <span className="text-sm">Share</span>
      </button>
    </div>
  );
};

export default SessionInteractions;
