'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { SessionWithDetails, User } from '@/types';
import SessionStats from './SessionStats';
import SessionInteractions from './SessionInteractions';
import CommentList from './CommentList';
import { MoreVertical, Heart, MessageCircle, Share2, Clock, ListTodo, Tag } from 'lucide-react';
import Link from 'next/link';

interface SessionCardProps {
  session: SessionWithDetails;
  onSupport: (sessionId: string) => Promise<void>;
  onRemoveSupport: (sessionId: string) => Promise<void>;
  onShare: (sessionId: string) => Promise<void>;
  onDelete?: (sessionId: string) => Promise<void>;
  onEdit?: (sessionId: string) => void;
  className?: string;
  showComments?: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onSupport,
  onRemoveSupport,
  onShare,
  onDelete,
  onEdit,
  className = '',
  showComments = false
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showCommentSection, setShowCommentSection] = useState(showComments);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const getUserInitials = (user: User): string => {
    return user.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserColor = (userId: string): string => {
    // Generate consistent color based on user ID
    const colors = [
      'bg-gradient-to-br from-orange-400 to-orange-600',
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
      'bg-gradient-to-br from-teal-400 to-teal-600',
      'bg-gradient-to-br from-cyan-400 to-cyan-600'
    ];
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <article className={`bg-white rounded-lg md:border md:border-gray-200 md:shadow-sm mb-4 md:mb-6 ${className}`}>
      {/* Session Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Link href={`/profile/${session.user.username}`} className="flex items-center gap-3">
          {/* User Avatar */}
          {session.user.profilePicture ? (
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white">
              <Image
                src={session.user.profilePicture}
                alt={session.user.name}
                width={80}
                height={80}
                quality={90}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-[#FC4C02] rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white">
              <span className="text-white font-semibold text-sm">
                {getUserInitials(session.user)}
              </span>
            </div>
          )}

          {/* User Info */}
          <div>
            <div className="font-semibold text-gray-900 text-base hover:underline">{session.user.name}</div>
            <div className="text-xs text-gray-500">{formatTimeAgo(session.createdAt)}</div>
          </div>
        </Link>

        {/* Options Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(session.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit session
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete(session.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                >
                  Delete session
                </button>
              )}
              <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50">
                Report session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title and Description */}
      <div className="px-4 pb-3">
        <h3 className="text-2xl font-bold text-gray-900 mb-1">
          {session.title || 'Focus Session'}
        </h3>
        {session.description && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {session.description}
          </p>
        )}
      </div>

      {/* Stats - Strava style */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Time</div>
            <div className="text-lg font-semibold text-gray-900">{formatTime(session.duration)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Project</div>
            <div className="text-lg font-semibold text-gray-900 truncate">{session.project?.name || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center border-t border-gray-100">
        <button
          onClick={() => session.isSupported ? onRemoveSupport(session.id) : onSupport(session.id)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg
            className={`w-6 h-6 ${session.isSupported ? 'fill-red-500 text-red-500' : ''}`}
            fill={session.isSupported ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-sm font-medium">{session.supportCount || 0}</span>
        </button>

        <div className="w-px h-6 bg-gray-200"></div>

        <button
          onClick={() => setShowCommentSection(!showCommentSection)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-medium">{session.commentCount || 0}</span>
        </button>

        <div className="w-px h-6 bg-gray-200"></div>

        <button
          onClick={() => onShare(session.id)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>

      {/* Comments Section */}
      {showCommentSection && (
        <div className="border-t border-gray-200">
          <CommentList sessionId={session.id} initialCommentCount={session.commentCount} />
        </div>
      )}

    </article>
  );
};

export default SessionCard;
