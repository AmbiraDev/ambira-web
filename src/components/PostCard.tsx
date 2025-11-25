'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { SessionWithDetails, User } from '@/types'
import PostStats from './PostStats'
import PostInteractions from './PostInteractions'
import CommentList from './CommentList'

interface PostCardProps {
  post: SessionWithDetails
  onSupport: (postId: string) => Promise<void>
  onRemoveSupport: (postId: string) => Promise<void>
  onShare: (postId: string) => Promise<void>
  className?: string
  showComments?: boolean
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onSupport,
  onRemoveSupport,
  onShare,
  className = '',
  showComments = false,
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showCommentSection, setShowCommentSection] = useState(showComments)

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const postDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    // Format time as "h:mm am/pm"
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    // Check if today
    if (postDate.getTime() === today.getTime()) {
      return `Today at ${timeStr}`
    }

    // Check if yesterday
    if (postDate.getTime() === yesterday.getTime()) {
      return `Yesterday at ${timeStr}`
    }

    // Otherwise show full date: "Month Day, Year at h:mm am/pm"
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    return `${dateStr} at ${timeStr}`
  }

  const getUserInitials = (user: User): string => {
    return user.name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

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
      'bg-gradient-to-br from-cyan-400 to-cyan-600',
    ]
    const hash = (userId || '').split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return (
      colors[hash % colors.length] || colors[0] || 'bg-gradient-to-br from-orange-400 to-orange-600'
    )
  }

  return (
    <article
      className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}
    >
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* User Avatar */}
            {post.user.profilePicture ? (
              <Image
                src={post.user.profilePicture}
                alt={post.user.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
              />
            ) : (
              <div
                className={`w-12 h-12 ${getUserColor(post.user.id)} rounded-full flex items-center justify-center shadow-sm`}
              >
                <span className="text-base font-semibold text-white">
                  {getUserInitials(post.user)}
                </span>
              </div>
            )}

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 hover:text-orange-600 cursor-pointer transition-colors truncate">
                  {post.user.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="hover:text-gray-900 cursor-pointer transition-colors">
                  @{post.user.username}
                </span>
                <span>•</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
                {post.user.location && (
                  <>
                    <span>•</span>
                    <span className="truncate">{post.user.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Options Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  Edit post
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  Delete post
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50">
                  Report post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Post Description */}
        {post.description && (
          <div className="mt-4">
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{post.description}</p>
          </div>
        )}
      </div>

      {/* Session Stats */}
      <div className="px-4 pb-4">
        <PostStats session={post} project={post.activity || post.project} />
      </div>

      {/* Support Summary */}
      {post.supportCount > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex -space-x-2">
              {/* Show first 3 supporter avatars */}
              {[...Array(Math.min(3, post.supportCount))].map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white"
                />
              ))}
            </div>
            <span className="font-medium">
              {post.supportCount} {post.supportCount === 1 ? 'person' : 'people'} gave support
            </span>
          </div>
        </div>
      )}

      {/* Post Interactions */}
      <PostInteractions
        postId={post.id}
        supportCount={post.supportCount}
        commentCount={post.commentCount}
        isSupported={post.isSupported || false}
        onSupport={onSupport}
        onRemoveSupport={onRemoveSupport}
        onShare={onShare}
        onCommentClick={() => setShowCommentSection(!showCommentSection)}
      />

      {/* Comments Section */}
      {showCommentSection && (
        <div className="border-t border-gray-200">
          <CommentList sessionId={post.id} initialCommentCount={post.commentCount} />
        </div>
      )}
    </article>
  )
}

export default PostCard
