'use client';

import React from 'react';
import { PostWithDetails, User } from '@/types';
import PostStats from './PostStats';
import PostInteractions from './PostInteractions';

interface PostCardProps {
  post: PostWithDetails;
  onSupport: (postId: string) => Promise<void>;
  onRemoveSupport: (postId: string) => Promise<void>;
  onShare: (postId: string) => Promise<void>;
  className?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onSupport,
  onRemoveSupport,
  onShare,
  className = ''
}) => {
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
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-rose-500'
    ];
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <article className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {/* Post Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* User Avatar */}
            <div className={`w-10 h-10 ${getUserColor(post.user.id)} rounded-full flex items-center justify-center flex-shrink-0`}>
              <span className="text-sm font-medium text-white">
                {getUserInitials(post.user)}
              </span>
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {post.user.name}
                </h3>
                <span className="text-gray-500 text-sm">
                  @{post.user.username}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <span>{formatTimeAgo(post.createdAt)}</span>
                {post.user.location && (
                  <>
                    <span>•</span>
                    <span>{post.user.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Options Menu */}
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        {/* Post Text */}
        {post.content && (
          <div className="mb-4">
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>
        )}

        {/* Session Stats */}
        <PostStats 
          session={post.session} 
          project={post.project}
          className="mb-0"
        />
      </div>

      {/* Post Interactions */}
      <PostInteractions
        postId={post.id}
        supportCount={post.supportCount}
        commentCount={post.commentCount}
        isSupported={post.isSupported || false}
        onSupport={onSupport}
        onRemoveSupport={onRemoveSupport}
        onShare={onShare}
      />
    </article>
  );
};

export default PostCard;
