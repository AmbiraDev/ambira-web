'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PostWithDetails, FeedFilters } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';
import Post from './Post';

interface FeedProps {
  filters?: FeedFilters;
  className?: string;
}

export const Feed: React.FC<FeedProps> = ({ 
  filters = {}, 
  className = '' 
}) => {
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);

  const loadPosts = useCallback(async (cursor?: string, append = false) => {
    try {
      if (!append) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const response = await firebaseApi.post.getFeedPosts(20, cursor, filters);
      
      if (append) {
        setPosts(prev => [...prev, ...response.posts]);
      } else {
        setPosts(response.posts);
      }
      
      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
    } catch (err: any) {
      console.error('Failed to load posts:', err);
      setError(err.message || 'Failed to load posts');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters]);

  // Load initial posts
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Load more posts
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && nextCursor) {
      loadPosts(nextCursor, true);
    }
  }, [isLoadingMore, hasMore, nextCursor, loadPosts]);

  // Refresh posts
  const refreshPosts = useCallback(() => {
    setPosts([]);
    setNextCursor(undefined);
    setHasNewPosts(false);
    setNewPostsCount(0);
    loadPosts();
  }, [loadPosts]);

  // Check for new posts periodically
  useEffect(() => {
    if (posts.length === 0) return;

    const checkForNewPosts = async () => {
      try {
        const response = await firebaseApi.post.getFeedPosts(5, undefined, filters);
        const newPostIds = response.posts.map(p => p.id);
        const currentPostIds = posts.slice(0, 5).map(p => p.id);
        
        const newCount = newPostIds.filter(id => !currentPostIds.includes(id)).length;
        if (newCount > 0) {
          setHasNewPosts(true);
          setNewPostsCount(newCount);
        }
      } catch (err) {
        // Silently fail
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkForNewPosts, 30000);
    return () => clearInterval(interval);
  }, [posts, filters]);

  // Handle support
  const handleSupport = useCallback(async (postId: string) => {
    try {
      await firebaseApi.post.supportPost(postId);
      
      // Optimistic update
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isSupported: true, 
              supportCount: post.supportCount + 1 
            }
          : post
      ));
    } catch (err: any) {
      console.error('Failed to support post:', err);
      // Could show error toast here
    }
  }, []);

  // Handle remove support
  const handleRemoveSupport = useCallback(async (postId: string) => {
    try {
      await firebaseApi.post.removeSupport(postId);
      
      // Optimistic update
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isSupported: false, 
              supportCount: Math.max(0, post.supportCount - 1)
            }
          : post
      ));
    } catch (err: any) {
      console.error('Failed to remove support:', err);
      // Could show error toast here
    }
  }, []);

  // Handle share
  const handleShare = useCallback(async (postId: string) => {
    try {
      const postUrl = `${window.location.origin}/posts/${postId}`;
      
      if (navigator.share) {
        // Use native share API on mobile
        await navigator.share({
          title: 'Check out this session on Ambira',
          text: 'Look at this productive session!',
          url: postUrl
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(postUrl);
        // Could show success toast here
        console.log('Link copied to clipboard');
      }
    } catch (err: any) {
      console.error('Failed to share post:', err);
      // Could show error toast here
    }
  }, []);

  // Real-time updates for support counts
  useEffect(() => {
    if (posts.length === 0) return;

    const postIds = posts.map(post => post.id);
    const unsubscribe = firebaseApi.post.listenToPostUpdates(postIds, (updates) => {
      setPosts(prev => prev.map(post => {
        const update = updates[post.id];
        if (update) {
          return {
            ...post,
            supportCount: update.supportCount > 0 ? update.supportCount : post.supportCount,
            isSupported: update.isSupported !== undefined ? update.isSupported : post.isSupported
          };
        }
        return post;
      }));
    });

    return unsubscribe;
  }, [posts.map(p => p.id).join(',')]); // Re-run when post IDs change

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="font-medium">Failed to load posts</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
        <button
          onClick={refreshPosts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="font-medium">No posts yet</p>
          <p className="text-sm text-gray-600 mt-1">
            Be the first to share your productive session!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* New posts indicator */}
      {hasNewPosts && (
        <div className="mb-4 sticky top-0 z-10">
          <button
            onClick={refreshPosts}
            className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span>
              {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'} - Click to refresh
            </span>
          </button>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            onSupport={handleSupport}
            onRemoveSupport={handleRemoveSupport}
            onShare={handleShare}
          />
        ))}
      </div>

      {/* Load more indicator */}
      {isLoadingMore && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-sm">Loading more posts...</span>
          </div>
        </div>
      )}

      {/* End of feed */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          You've reached the end of the feed
        </div>
      )}
    </div>
  );
};

export default Feed;
