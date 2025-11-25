'use client'

import React from 'react'
import { SessionWithDetails } from '@/types'
import PostCard from './PostCard'

interface PostProps {
  post: SessionWithDetails
  onSupport: (postId: string) => Promise<void>
  onRemoveSupport: (postId: string) => Promise<void>
  onShare: (postId: string) => Promise<void>
  className?: string
  variant?: 'full' | 'compact'
}

export const Post: React.FC<PostProps> = ({
  post,
  onSupport,
  onRemoveSupport,
  onShare,
  className = '',
}) => {
  // For now, we'll use PostCard for both variants
  // In the future, we could create a more detailed full view
  return (
    <PostCard
      post={post}
      onSupport={onSupport}
      onRemoveSupport={onRemoveSupport}
      onShare={onShare}
      className={className}
    />
  )
}

export default Post
