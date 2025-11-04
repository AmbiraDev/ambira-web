# React Query at Feature Boundaries - Examples

This document provides complete, real-world examples of the standardized caching pattern.

## Example 1: Complete Groups Feature

This example shows the full stack from component to database.

### Layer 1: Component (Presentation)

```typescript
// src/app/groups/[id]/page.tsx
'use client';

import { useGroupDetails, useGroupLeaderboard, useJoinGroup } from '@/features/groups/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function GroupPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  // Query hooks - React Query at the boundary
  const { data: group, isLoading, error } = useGroupDetails(params.id);
  const { data: leaderboard, isLoading: isLoadingLeaderboard } =
    useGroupLeaderboard(params.id, selectedPeriod);

  // Mutation hooks
  const joinMutation = useJoinGroup();

  // Event handlers
  const handleJoin = () => {
    if (!user) return;

    joinMutation.mutate(
      { groupId: params.id, userId: user.id },
      {
        onSuccess: () => {
          // Optional: Show success message
          console.log('Successfully joined group!');
        },
        onError: (error) => {
          // Optional: Show error message
          console.error('Failed to join group:', error);
        },
      }
    );
  };

  // Loading and error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Group not found</div>
      </div>
    );
  }

  // Presentation logic only
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <p className="text-gray-600 mt-2">{group.description}</p>
          </div>

          {!group.isMember(user?.id || '') && (
            <button
              onClick={handleJoin}
              disabled={joinMutation.isPending}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {joinMutation.isPending ? 'Joining...' : 'Join Group'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold">{group.getMemberCount()}</div>
            <div className="text-gray-600">Members</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold">{group.category}</div>
            <div className="text-gray-600">Category</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold">{group.privacy}</div>
            <div className="text-gray-600">Privacy</div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Leaderboard</h2>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month')}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {isLoadingLeaderboard ? (
            <div>Loading leaderboard...</div>
          ) : (
            <div className="space-y-2">
              {leaderboard?.map((entry, index) => (
                <div
                  key={entry.userId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-bold text-gray-400">#{index + 1}</div>
                    <div>
                      <div className="font-semibold">{entry.username}</div>
                      <div className="text-sm text-gray-600">{entry.sessionCount} sessions</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold">
                    {Math.round(entry.totalMinutes / 60)}h
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Layer 2: Feature Hooks (React Query Boundary)

```typescript
// src/features/groups/hooks/useGroups.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GroupService } from '../services/GroupService';
import { Group } from '@/domain/entities/Group';
import { LeaderboardEntry, TimePeriod } from '../types/groups.types';

const groupService = new GroupService();

export const GROUPS_KEYS = {
  all: () => ['groups'] as const,
  details: () => [...GROUPS_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...GROUPS_KEYS.details(), id] as const,
  leaderboard: (groupId: string, period: TimePeriod) =>
    [...GROUPS_KEYS.detail(groupId), 'leaderboard', period] as const,
};

export function useGroupDetails(
  groupId: string,
  options?: Partial<UseQueryOptions<Group | null, Error>>
) {
  return useQuery<Group | null, Error>({
    queryKey: GROUPS_KEYS.detail(groupId),
    queryFn: () => groupService.getGroupDetails(groupId),
    staleTime: 15 * 60 * 1000,
    enabled: !!groupId,
    ...options,
  });
}

export function useGroupLeaderboard(
  groupId: string,
  period: TimePeriod,
  options?: Partial<UseQueryOptions<LeaderboardEntry[], Error>>
) {
  return useQuery<LeaderboardEntry[], Error>({
    queryKey: GROUPS_KEYS.leaderboard(groupId, period),
    queryFn: () => groupService.getGroupLeaderboard(groupId, period),
    staleTime: 5 * 60 * 1000,
    enabled: !!groupId,
    ...options,
  });
}
```

```typescript
// src/features/groups/hooks/useGroupMutations.ts
import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
import { GroupService } from '../services/GroupService';
import { GROUPS_KEYS } from './useGroups';

const groupService = new GroupService();

export function useJoinGroup(
  options?: Partial<
    UseMutationOptions<void, Error, { groupId: string; userId: string }>
  >
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { groupId: string; userId: string }>({
    mutationFn: ({ groupId, userId }) =>
      groupService.joinGroup(groupId, userId),

    // Optimistic update
    onMutate: async ({ groupId, userId }) => {
      await queryClient.cancelQueries({
        queryKey: GROUPS_KEYS.detail(groupId),
      });

      const previousGroup = queryClient.getQueryData(
        GROUPS_KEYS.detail(groupId)
      );

      queryClient.setQueryData(GROUPS_KEYS.detail(groupId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          memberIds: [...old.memberIds, userId],
        };
      });

      return { previousGroup };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousGroup) {
        queryClient.setQueryData(
          GROUPS_KEYS.detail(variables.groupId),
          context.previousGroup
        );
      }
    },

    // Invalidate on success
    onSuccess: (_, { groupId, userId }) => {
      queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: ['groups', 'user', userId] });
    },

    ...options,
  });
}
```

### Layer 3: Service (Business Logic)

```typescript
// src/features/groups/services/GroupService.ts
import { Group } from '@/domain/entities/Group';
import { GroupRepository } from '@/infrastructure/firebase/repositories/GroupRepository';
import { UserRepository } from '@/infrastructure/firebase/repositories/UserRepository';
import { SessionRepository } from '@/infrastructure/firebase/repositories/SessionRepository';
import { LeaderboardCalculator } from '../domain/LeaderboardCalculator';
import { LeaderboardEntry, TimePeriod } from '../types/groups.types';

export class GroupService {
  private readonly groupRepo: GroupRepository;
  private readonly userRepo: UserRepository;
  private readonly sessionRepo: SessionRepository;
  private readonly leaderboardCalc: LeaderboardCalculator;

  constructor() {
    this.groupRepo = new GroupRepository();
    this.userRepo = new UserRepository();
    this.sessionRepo = new SessionRepository();
    this.leaderboardCalc = new LeaderboardCalculator();
  }

  async getGroupDetails(groupId: string): Promise<Group | null> {
    return this.groupRepo.findById(groupId);
  }

  async joinGroup(groupId: string, userId: string): Promise<void> {
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Business rule: Check if already a member
    if (group.isMember(userId)) {
      throw new Error('Already a member of this group');
    }

    // Business rule: Check if can join (public vs approval-required)
    if (group.privacy === 'approval-required') {
      throw new Error('This group requires approval to join');
    }

    // Create updated group with new member
    const updatedGroup = group.withAddedMember(userId);

    // Save to repository
    await this.groupRepo.save(updatedGroup);
  }

  async getGroupLeaderboard(
    groupId: string,
    period: TimePeriod
  ): Promise<LeaderboardEntry[]> {
    const group = await this.groupRepo.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    const memberIds = Array.from(group.memberIds);
    const users = await this.userRepo.findByIds(memberIds);

    const dateRange = this.getDateRangeForPeriod(period);

    const sessions = await this.sessionRepo.findByUserIds(memberIds, {
      groupId: groupId,
      startDate: dateRange.start,
      endDate: dateRange.end,
    });

    return this.leaderboardCalc.calculate(users, sessions, period);
  }

  private getDateRangeForPeriod(period: TimePeriod): {
    start: Date;
    end: Date;
  } {
    const now = new Date();
    const end = now;
    let start: Date;

    switch (period) {
      case 'week':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;

      case 'month':
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        break;

      default:
        start = new Date(0);
    }

    return { start, end };
  }
}
```

### Layer 4: Repository (Data Access)

```typescript
// src/infrastructure/firebase/repositories/GroupRepository.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Group } from '@/domain/entities/Group';

export class GroupRepository {
  private readonly collectionName = 'groups';

  async findById(groupId: string): Promise<Group | null> {
    const docRef = doc(db, this.collectionName, groupId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return this.mapToEntity(docSnap.id, docSnap.data());
  }

  async findByMemberId(userId: string, limit?: number): Promise<Group[]> {
    const q = query(
      collection(db, this.collectionName),
      where('memberIds', 'array-contains', userId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => this.mapToEntity(doc.id, doc.data()));
  }

  async save(group: Group): Promise<void> {
    const docRef = doc(db, this.collectionName, group.id);

    await updateDoc(docRef, {
      memberIds: Array.from(group.memberIds),
      updatedAt: new Date(),
    });
  }

  private mapToEntity(id: string, data: any): Group {
    return new Group({
      id,
      name: data.name,
      description: data.description,
      category: data.category,
      privacy: data.privacy,
      ownerId: data.ownerId,
      memberIds: data.memberIds || [],
      adminIds: data.adminIds || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    });
  }
}
```

## Example 2: Feed with Infinite Scroll

### Component

```typescript
// src/app/feed/page.tsx
'use client';

import { useFeedSessions } from '@/features/feed/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

export default function FeedPage() {
  const { user } = useAuth();
  const { ref, inView } = useInView();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeedSessions(user?.id || '', { type: 'following' });

  // Auto-load more when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <div>Loading feed...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const allSessions = data?.pages.flatMap((page) => page.sessions) || [];

  return (
    <div className="space-y-4">
      {allSessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}

      {/* Intersection observer trigger */}
      <div ref={ref} className="h-10">
        {isFetchingNextPage && <div>Loading more...</div>}
      </div>

      {!hasNextPage && <div className="text-center text-gray-500">No more sessions</div>}
    </div>
  );
}
```

### Hook with Infinite Query

```typescript
// src/features/feed/hooks/useFeed.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { FeedService, FeedFilters } from '../services/FeedService';

const feedService = new FeedService();

export const FEED_KEYS = {
  all: () => ['feed'] as const,
  lists: () => [...FEED_KEYS.all(), 'list'] as const,
  list: (userId: string, filters: FeedFilters) =>
    [...FEED_KEYS.lists(), userId, filters] as const,
};

export function useFeedSessions(userId: string, filters: FeedFilters = {}) {
  return useInfiniteQuery({
    queryKey: FEED_KEYS.list(userId, filters),
    queryFn: ({ pageParam }) =>
      feedService.getFeed(userId, filters, {
        limit: 20,
        cursor: pageParam,
      }),
    getNextPageParam: lastPage => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!userId,
  });
}
```

## Example 3: Optimistic Comment Creation

### Component

```typescript
// src/components/CommentForm.tsx
'use client';

import { useCreateComment } from '@/features/comments/hooks';
import { useState } from 'react';

export function CommentForm({ sessionId }: { sessionId: string }) {
  const [content, setContent] = useState('');
  const createMutation = useCreateComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    createMutation.mutate(
      { sessionId, content },
      {
        onSuccess: () => {
          setContent(''); // Clear form
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className="w-full p-3 border rounded-lg"
        rows={3}
      />
      <button
        type="submit"
        disabled={createMutation.isPending || !content.trim()}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
      >
        {createMutation.isPending ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
}
```

### Mutation Hook with Optimistic Update

```typescript
// src/features/comments/hooks/useCommentMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CommentService } from '../services/CommentService';
import { COMMENTS_KEYS } from './useComments';
import { SESSION_KEYS } from '@/features/sessions/hooks';

const commentService = new CommentService();

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      content,
    }: {
      sessionId: string;
      content: string;
    }) => commentService.createComment(sessionId, content),

    onMutate: async ({ sessionId, content }) => {
      // Cancel queries
      await queryClient.cancelQueries({
        queryKey: COMMENTS_KEYS.list(sessionId),
      });

      // Snapshot
      const previousComments = queryClient.getQueryData(
        COMMENTS_KEYS.list(sessionId)
      );

      // Optimistic update - add temporary comment
      const tempComment = {
        id: 'temp-' + Date.now(),
        sessionId,
        content,
        userId: 'current-user',
        username: 'You',
        createdAt: new Date(),
        isOptimistic: true, // Flag for UI
      };

      queryClient.setQueryData(COMMENTS_KEYS.list(sessionId), (old: any) => {
        return old ? [...old, tempComment] : [tempComment];
      });

      // Update comment count on session
      queryClient.setQueryData(SESSION_KEYS.detail(sessionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          commentCount: old.commentCount + 1,
        };
      });

      return { previousComments };
    },

    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousComments) {
        queryClient.setQueryData(
          COMMENTS_KEYS.list(variables.sessionId),
          context.previousComments
        );
      }
    },

    onSuccess: (newComment, variables) => {
      // Replace optimistic comment with real one
      queryClient.setQueryData(
        COMMENTS_KEYS.list(variables.sessionId),
        (old: any) => {
          if (!Array.isArray(old)) return [newComment];
          return old.map(comment =>
            comment.isOptimistic ? newComment : comment
          );
        }
      );

      // Invalidate to get fresh data
      queryClient.invalidateQueries({
        queryKey: COMMENTS_KEYS.list(variables.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: SESSION_KEYS.detail(variables.sessionId),
      });
    },
  });
}
```

## Key Takeaways

1. **Components** focus on presentation and user interaction
2. **Hooks** handle all React Query logic (caching, optimistic updates, invalidation)
3. **Services** contain pure business logic with no React dependencies
4. **Repositories** handle data access only

This separation makes each layer:

- **Easier to test** (mock at each boundary)
- **Easier to understand** (single responsibility)
- **Easier to maintain** (changes isolated to one layer)
- **More reusable** (services can be used anywhere, not just in React)
