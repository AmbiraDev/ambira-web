import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { firebaseSessionApi, firebaseUserApi, firebaseApi } from '@/lib/firebaseApi';
import { CACHE_KEYS, CACHE_TIMES } from '@/lib/queryClient';
import { Session, UserStats, UserProfile, User as UserType, Project, Task, Group, Challenge } from '@/types';

// ==================== USER HOOKS ====================

export function useUserStats(userId: string, options?: Partial<UseQueryOptions<UserStats>>) {
  return useQuery({
    queryKey: CACHE_KEYS.USER_STATS(userId),
    queryFn: () => firebaseUserApi.getUserStats(userId),
    staleTime: CACHE_TIMES.VERY_LONG, // 1 hour cache for stats
    ...options,
  });
}

export function useUserProfile(userId: string, options?: Partial<UseQueryOptions<UserProfile | null>>) {
  return useQuery({
    queryKey: CACHE_KEYS.USER_PROFILE(userId),
    queryFn: () => firebaseUserApi.getUserProfile(userId),
    staleTime: CACHE_TIMES.LONG, // 15 minutes cache
    ...options,
  });
}

export function useUserSessions(userId: string, limit: number = 50, options?: Partial<UseQueryOptions<Session[]>>) {
  return useQuery({
    queryKey: CACHE_KEYS.USER_SESSIONS(userId, limit),
    queryFn: () => firebaseSessionApi.getUserSessions(userId, limit, true),
    staleTime: CACHE_TIMES.MEDIUM, // 5 minutes cache
    ...options,
  });
}

export function useUserFollowers(userId: string, options?: Partial<UseQueryOptions<UserType[]>>) {
  return useQuery({
    queryKey: CACHE_KEYS.USER_FOLLOWERS(userId),
    queryFn: async () => {
      try {
        return await firebaseUserApi.getFollowers(userId);
      } catch (error) {
        // Return empty array on permission errors
        return [];
      }
    },
    staleTime: CACHE_TIMES.LONG, // 15 minutes cache
    retry: false, // Don't retry on permission errors
    ...options,
  });
}

export function useUserFollowing(userId: string, options?: Partial<UseQueryOptions<UserType[]>>) {
  return useQuery({
    queryKey: CACHE_KEYS.USER_FOLLOWING(userId),
    queryFn: async () => {
      try {
        return await firebaseUserApi.getFollowing(userId);
      } catch (error) {
        // Return empty array on permission errors
        return [];
      }
    },
    staleTime: CACHE_TIMES.LONG, // 15 minutes cache
    retry: false, // Don't retry on permission errors
    ...options,
  });
}

// ==================== SESSION HOOKS ====================

export function useSession(sessionId: string, options?: Partial<UseQueryOptions<Session | null>>) {
  return useQuery({
    queryKey: CACHE_KEYS.SESSION(sessionId),
    queryFn: () => firebaseSessionApi.getSession(sessionId),
    staleTime: CACHE_TIMES.MEDIUM, // 5 minutes cache
    ...options,
  });
}

export function useFeedSessions(
  limit: number = 20,
  cursor?: string,
  filters?: any,
  options?: Partial<UseQueryOptions<{ sessions: any[]; hasMore: boolean; nextCursor?: string }>>
) {
  return useQuery({
    queryKey: CACHE_KEYS.FEED_SESSIONS(limit, cursor, filters),
    queryFn: () => firebaseApi.post.getFeedSessions(limit, cursor, filters),
    staleTime: CACHE_TIMES.SHORT, // 1 minute cache for feed
    gcTime: CACHE_TIMES.MEDIUM, // Keep in cache for 5 minutes after becoming stale
    ...options,
  });
}

// Hook for loading more sessions with caching
export function useFeedSessionsPaginated(
  limit: number = 20,
  cursor: string | undefined,
  filters?: any,
  options?: Partial<UseQueryOptions<{ sessions: any[]; hasMore: boolean; nextCursor?: string }>>
) {
  return useQuery({
    queryKey: CACHE_KEYS.FEED_SESSIONS(limit, cursor, filters),
    queryFn: () => firebaseApi.post.getFeedSessions(limit, cursor, filters),
    staleTime: CACHE_TIMES.MEDIUM, // 5 minute cache for paginated results (they don't change as often)
    gcTime: CACHE_TIMES.LONG, // Keep in cache for 15 minutes
    enabled: !!cursor, // Only fetch when cursor is provided
    ...options,
  });
}

// ==================== PROJECT HOOKS ====================

export function useProjects(userId: string, options?: Partial<UseQueryOptions<Project[]>>) {
  return useQuery({
    queryKey: CACHE_KEYS.PROJECTS(userId),
    queryFn: () => firebaseApi.project.getProjects(),
    staleTime: CACHE_TIMES.LONG, // 15 minutes cache
    ...options,
  });
}

// ==================== TASK HOOKS ====================

export function useTasks(userId: string, options?: Partial<UseQueryOptions<Task[]>>) {
  return useQuery({
    queryKey: CACHE_KEYS.TASKS(userId),
    queryFn: () => firebaseApi.task.getAllTasks(),
    staleTime: CACHE_TIMES.SHORT, // 1 minute cache for tasks (frequently updated)
    ...options,
  });
}

// ==================== GROUP HOOKS ====================

export function useGroups(filters?: any, options?: Partial<UseQueryOptions<Group[]>>) {
  return useQuery({
    queryKey: CACHE_KEYS.GROUPS(filters),
    queryFn: () => firebaseApi.group.searchGroups(filters, 10),
    staleTime: CACHE_TIMES.LONG, // 15 minutes cache
    ...options,
  });
}

export function useGroup(groupId: string, options?: Partial<UseQueryOptions<Group | null>>) {
  return useQuery({
    queryKey: CACHE_KEYS.GROUP(groupId),
    queryFn: () => firebaseApi.group.getGroup(groupId),
    staleTime: CACHE_TIMES.LONG, // 15 minutes cache
    ...options,
  });
}

export function useUserGroups(userId: string, options?: Partial<UseQueryOptions<Group[]>>) {
  return useQuery({
    queryKey: CACHE_KEYS.USER_GROUPS(userId),
    queryFn: () => firebaseApi.group.getUserGroups(userId),
    staleTime: CACHE_TIMES.LONG, // 15 minutes cache
    ...options,
  });
}

// ==================== CHALLENGE HOOKS ====================

export function useChallenges(filters?: any, options?: Partial<UseQueryOptions<Challenge[]>>) {
  return useQuery({
    queryKey: CACHE_KEYS.CHALLENGES(filters),
    queryFn: () => firebaseApi.challenge.getChallenges(filters),
    staleTime: CACHE_TIMES.LONG, // 15 minutes cache
    ...options,
  });
}

// ==================== SUGGESTED CONTENT HOOKS ====================

export function useSuggestedUsers(options?: Partial<UseQueryOptions<any[]>>) {
  return useQuery({
    queryKey: CACHE_KEYS.SUGGESTED_USERS(),
    queryFn: async () => {
      const { users } = await firebaseUserApi.searchUsers('', 1, 10);
      return users.slice(0, 3);
    },
    staleTime: CACHE_TIMES.VERY_LONG, // 1 hour cache
    ...options,
  });
}

export function useSuggestedGroups(options?: Partial<UseQueryOptions<Group[]>>) {
  return useQuery({
    queryKey: CACHE_KEYS.SUGGESTED_GROUPS(),
    queryFn: async () => {
      const groups = await firebaseApi.group.searchGroups({}, 10);
      return groups.slice(0, 3);
    },
    staleTime: CACHE_TIMES.VERY_LONG, // 1 hour cache
    ...options,
  });
}

// ==================== STREAK HOOKS ====================

export function useStreak(userId: string, options?: Partial<UseQueryOptions<any>>) {
  return useQuery({
    queryKey: CACHE_KEYS.STREAK(userId),
    queryFn: () => firebaseApi.streak.getStreakStats(userId),
    staleTime: CACHE_TIMES.MEDIUM, // 5 minutes cache
    ...options,
  });
}

// ==================== CACHE INVALIDATION HELPERS ====================

export function useInvalidateUserData() {
  const queryClient = useQueryClient();
  
  return (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.USER_STATS(userId) });
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.USER_PROFILE(userId) });
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.USER_SESSIONS(userId) });
  };
}

export function useInvalidateFeed() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    queryClient.invalidateQueries({ queryKey: ['sessions', 'feed'] });
  };
}

export function useInvalidateProjects() {
  const queryClient = useQueryClient();
  
  return (userId: string) => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PROJECTS(userId) });
  };
}

export function useInvalidateTasks() {
  const queryClient = useQueryClient();
  
  return (userId: string) => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TASKS(userId) });
  };
}
