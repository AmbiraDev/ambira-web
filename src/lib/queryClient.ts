import { QueryClient } from '@tanstack/react-query';

// Create a query client with optimized cache settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 1 time
      retry: 1,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      // Don't refetch on reconnect if data is fresh
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Cache keys for different data types
export const CACHE_KEYS = {
  // User data
  USER_STATS: (userId: string) => ['user', 'stats', userId],
  USER_PROFILE: (userId: string) => ['user', 'profile', userId],
  USER_SESSIONS: (userId: string, limit?: number) => ['user', 'sessions', userId, limit],
  USER_FOLLOWERS: (userId: string) => ['user', 'followers', userId],
  USER_FOLLOWING: (userId: string) => ['user', 'following', userId],
  
  // Session data
  SESSION: (sessionId: string) => ['session', sessionId],
  SESSIONS: (userId: string) => ['sessions', userId],
  SESSIONS_FEED: (filters?: any) => ['sessions', 'feed', filters],
  ACTIVE_SESSION: (userId: string) => ['active-session', userId],
  
  // Project data
  PROJECTS: (userId: string) => ['projects', userId],
  PROJECT: (projectId: string) => ['project', projectId],
  ACTIVITY_STATS: (activityId: string) => ['activity', 'stats', activityId],
  
  // Task data
  TASKS: (userId: string) => ['tasks', userId],
  TASK: (taskId: string) => ['task', taskId],
  
  // Group data
  GROUPS: (filters?: any) => ['groups', filters],
  GROUP: (groupId: string) => ['group', groupId],
  GROUP_MEMBERS: (groupId: string) => ['group', 'members', groupId],
  USER_GROUPS: (userId: string) => ['user', 'groups', userId],
  
  // Challenge data
  CHALLENGES: (filters?: any) => ['challenges', filters],
  CHALLENGE: (challengeId: string) => ['challenge', challengeId],
  USER_CHALLENGES: (userId: string) => ['user', 'challenges', userId],
  CHALLENGE_PROGRESS: (challengeId: string, userId: string) => ['challenge', 'progress', challengeId, userId],
  
  // Feed data
  FEED_SESSIONS: (limit?: number, cursor?: string, filters?: any) => 
    ['feed', 'sessions', limit, cursor, filters],
  
  // Comments
  COMMENTS: (sessionId: string) => ['comments', sessionId],
  
  // Suggested content
  SUGGESTED_USERS: () => ['suggested', 'users'],
  SUGGESTED_GROUPS: () => ['suggested', 'groups'],
  
  // Streak data
  STREAK: (userId: string) => ['streak', userId],
  
  // Analytics data (longer cache time)
  ANALYTICS_CHART: (userId: string, period: string) => ['analytics', 'chart', userId, period],
  ANALYTICS_CATEGORIES: (userId: string, period: string) => ['analytics', 'categories', userId, period],

  // Notifications
  NOTIFICATIONS: (userId: string) => ['notifications', userId],
};

// Cache time configurations for different data types
export const CACHE_TIMES = {
  // Very short cache (30 seconds) - for real-time data
  REAL_TIME: 30 * 1000,
  
  // Short cache (1 minute) - for frequently changing data
  SHORT: 1 * 60 * 1000,
  
  // Medium cache (5 minutes) - default for most data
  MEDIUM: 5 * 60 * 1000,
  
  // Long cache (15 minutes) - for relatively static data
  LONG: 15 * 60 * 1000,
  
  // Very long cache (1 hour) - for analytics and statistics
  VERY_LONG: 60 * 60 * 1000,
  
  // Infinite cache - for data that rarely changes
  INFINITE: Infinity,
};
