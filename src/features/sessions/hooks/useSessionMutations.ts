/**
 * Session Mutation Hooks - React Query Boundary
 *
 * All write operations for sessions (delete, support, update).
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { SessionService, SupportSessionData } from '../services/SessionService';
import { SESSION_KEYS } from './useSessions';
import { Session } from '@/types';

const sessionService = new SessionService();

// Context types for optimistic updates
interface DeleteSessionContext {
  previousFeedData: [any, any][];
  previousSession: unknown;
}

interface SupportSessionContext {
  previousFeedData: [any, any][];
  previousSession: unknown;
}

interface UpdateSessionContext {
  previousSession: unknown;
}

/**
 * Delete a session
 *
 * @example
 * const deleteMutation = useDeleteSession();
 * deleteMutation.mutate(sessionId);
 */
export function useDeleteSession(
  options?: Partial<UseMutationOptions<void, Error, string, DeleteSessionContext>>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, DeleteSessionContext>({
    mutationFn: (sessionId) => sessionService.deleteSession(sessionId),

    onMutate: async (sessionId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      await queryClient.cancelQueries({ queryKey: SESSION_KEYS.detail(sessionId) });

      // Snapshot
      const previousFeedData = queryClient.getQueriesData({ queryKey: ['feed'] });
      const previousSession = queryClient.getQueryData(SESSION_KEYS.detail(sessionId));

      // Optimistically remove from feed
      queryClient.setQueriesData<any>({ queryKey: ['feed'] }, (old: any) => {
        if (!old) return old;

        if (Array.isArray(old)) {
          return old.filter((s: any) => s.id !== sessionId);
        } else if (old.sessions) {
          return {
            ...old,
            sessions: old.sessions.filter((s: any) => s.id !== sessionId),
          };
        } else if (old.pages) {
          // Handle infinite query
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              sessions: page.sessions.filter((s: any) => s.id !== sessionId),
            })),
          };
        }

        return old;
      });

      return { previousFeedData, previousSession };
    },

    onError: (error, sessionId, context) => {
      // Rollback
      if (context?.previousFeedData) {
        context.previousFeedData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousSession) {
        queryClient.setQueryData(SESSION_KEYS.detail(sessionId), context.previousSession);
      }
    },

    onSettled: (_, __, sessionId) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.all() });
    },

    ...options,
  });
}

/**
 * Support (like) or unsupport a session
 *
 * @example
 * const supportMutation = useSupportSession(currentUserId);
 * supportMutation.mutate({ sessionId: 'abc123', action: 'support' });
 * supportMutation.mutate({ sessionId: 'abc123', action: 'unsupport' });
 */
export function useSupportSession(
  currentUserId?: string,
  options?: Partial<UseMutationOptions<void, Error, SupportSessionData, SupportSessionContext>>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, SupportSessionData, SupportSessionContext>({
    mutationFn: async ({ sessionId, action }) => {
      if (action === 'support') {
        await sessionService.supportSession(sessionId);
      } else {
        await sessionService.unsupportSession(sessionId);
      }
    },

    onMutate: async ({ sessionId, action }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      await queryClient.cancelQueries({ queryKey: SESSION_KEYS.detail(sessionId) });

      // Snapshot
      const previousFeedData = queryClient.getQueriesData({ queryKey: ['feed'] });
      const previousSession = queryClient.getQueryData(SESSION_KEYS.detail(sessionId));

      const increment = action === 'support' ? 1 : -1;

      // Optimistically update feed sessions
      queryClient.setQueriesData<any>({ queryKey: ['feed'] }, (old: any) => {
        if (!old) return old;

        const updateSession = (session: any) => {
          if (session.id !== sessionId) return session;

          const supportedBy = session.supportedBy || [];
          const newSupportedBy =
            action === 'support'
              ? [...supportedBy, currentUserId].filter(Boolean)
              : supportedBy.filter((id: string) => id !== currentUserId);

          return {
            ...session,
            supportCount: Math.max(0, (session.supportCount || 0) + increment),
            supportedBy: newSupportedBy,
            isSupported: action === 'support',
          };
        };

        if (Array.isArray(old)) {
          return old.map(updateSession);
        } else if (old.sessions) {
          return {
            ...old,
            sessions: old.sessions.map(updateSession),
          };
        } else if (old.pages) {
          // Handle infinite query
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              sessions: page.sessions.map(updateSession),
            })),
          };
        }

        return old;
      });

      // Optimistically update single session
      queryClient.setQueryData<Session | null>(
        SESSION_KEYS.detail(sessionId),
        (old: any) => {
          if (!old) return old;

          const supportedBy = old.supportedBy || [];
          const newSupportedBy =
            action === 'support'
              ? [...supportedBy, currentUserId].filter(Boolean)
              : supportedBy.filter((id: string) => id !== currentUserId);

          return {
            ...old,
            supportCount: Math.max(0, (old.supportCount || 0) + increment),
            supportedBy: newSupportedBy,
            isSupported: action === 'support',
          };
        }
      );

      return { previousFeedData, previousSession };
    },

    onError: (error, { sessionId }, context) => {
      // Rollback
      if (context?.previousFeedData) {
        context.previousFeedData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousSession) {
        queryClient.setQueryData(SESSION_KEYS.detail(sessionId), context.previousSession);
      }
    },

    onSettled: (_, __, { sessionId }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.detail(sessionId) });
    },

    ...options,
  });
}

/**
 * Update a session
 *
 * @example
 * const updateMutation = useUpdateSession();
 * updateMutation.mutate({
 *   sessionId: 'abc123',
 *   data: { title: 'Updated title', visibility: 'everyone' }
 * });
 */
export function useUpdateSession(
  options?: Partial<
    UseMutationOptions<void, Error, { sessionId: string; data: Partial<Session> }, UpdateSessionContext>
  >
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { sessionId: string; data: Partial<Session> }, UpdateSessionContext>({
    mutationFn: ({ sessionId, data }) => sessionService.updateSession(sessionId, data),

    onMutate: async ({ sessionId, data }) => {
      await queryClient.cancelQueries({ queryKey: SESSION_KEYS.detail(sessionId) });

      const previousSession = queryClient.getQueryData(SESSION_KEYS.detail(sessionId));

      // Optimistically update
      queryClient.setQueryData<Session | null>(
        SESSION_KEYS.detail(sessionId),
        (old: any) => {
          if (!old) return old;
          return { ...old, ...data };
        }
      );

      return { previousSession };
    },

    onError: (error, { sessionId }, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(SESSION_KEYS.detail(sessionId), context.previousSession);
      }
    },

    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.all() });
    },

    ...options,
  });
}

/**
 * Helper hook to invalidate session data
 *
 * @example
 * const invalidateSession = useInvalidateSession();
 * invalidateSession(sessionId);
 */
export function useInvalidateSession() {
  const queryClient = useQueryClient();

  return (sessionId: string) => {
    queryClient.invalidateQueries({ queryKey: SESSION_KEYS.detail(sessionId) });
    queryClient.invalidateQueries({ queryKey: SESSION_KEYS.detailWithData(sessionId) });
  };
}

/**
 * Helper hook to invalidate all sessions
 *
 * @example
 * const invalidateAllSessions = useInvalidateAllSessions();
 * invalidateAllSessions();
 */
export function useInvalidateAllSessions() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: SESSION_KEYS.all() });
    queryClient.invalidateQueries({ queryKey: ['feed'] });
  };
}
