/**
 * FeedService Unit Tests
 *
 * Tests feed retrieval for different feed types (following, public, user, group)
 * Tests pagination and filter logic
 */

import {
  FeedService,
  FeedType,
  FeedFilters,
} from '@/features/feed/services/FeedService';
import { FeedRepository } from '@/infrastructure/firebase/repositories/FeedRepository';
import { SocialGraphRepository } from '@/infrastructure/firebase/repositories/SocialGraphRepository';
import { SessionRepository } from '@/infrastructure/firebase/repositories/SessionRepository';
import { SessionWithDetails } from '@/types';

jest.mock('@/infrastructure/firebase/repositories/FeedRepository');
jest.mock('@/infrastructure/firebase/repositories/SocialGraphRepository');
jest.mock('@/infrastructure/firebase/repositories/SessionRepository');

describe('FeedService', () => {
  let feedService: FeedService;
  let mockFeedRepo: jest.Mocked<FeedRepository>;
  let mockSocialGraphRepo: jest.Mocked<SocialGraphRepository>;
  let mockSessionRepo: jest.Mocked<SessionRepository>;

  const mockSession: SessionWithDetails = {
    id: 'session-1',
    userId: 'user-1',
    projectId: 'project-1',
    duration: 3600,
    startedAt: new Date(),
    completedAt: new Date(),
    title: 'Work Session',
    description: 'Description',
    visibility: 'everyone',
    supportCount: 5,
    commentCount: 2,
    activityId: 'activity-1',
    tags: [],
    groupIds: [],
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      avatar: 'https://example.com/avatar.jpg',
    },
    activity: {
      id: 'activity-1',
      name: 'Work',
      color: '#007AFF',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockFeedRepo = FeedRepository as jest.Mocked<typeof FeedRepository>;
    mockSocialGraphRepo = SocialGraphRepository as jest.Mocked<
      typeof SocialGraphRepository
    >;
    mockSessionRepo = SessionRepository as jest.Mocked<
      typeof SessionRepository
    >;

    feedService = new FeedService();
  });

  describe('getFeed - following', () => {
    it('should get following feed', async () => {
      // ARRANGE
      const mockResult = {
        sessions: [mockSession],
        hasMore: false,
      };

      jest.spyOn(feedService as any, 'socialGraphRepo', 'get').mockReturnValue({
        getFollowingIds: jest.fn().mockResolvedValue(['user-2', 'user-3']),
      } as any);

      jest.spyOn(feedService as any, 'feedRepo', 'get').mockReturnValue({
        getFeedForFollowing: jest.fn().mockResolvedValue(mockResult),
      } as any);

      // ACT
      const result = await feedService.getFeed('user-1', { type: 'following' });

      // ASSERT
      expect(result.sessions).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('should return empty feed if not following anyone', async () => {
      // ARRANGE
      jest.spyOn(feedService as any, 'socialGraphRepo', 'get').mockReturnValue({
        getFollowingIds: jest.fn().mockResolvedValue([]),
      } as any);

      // ACT
      const result = await feedService.getFeed('user-1', { type: 'following' });

      // ASSERT
      expect(result.sessions).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getFeed - public/trending/recent/all', () => {
    it('should get public feed', async () => {
      // ARRANGE
      const mockResult = {
        sessions: [mockSession, { ...mockSession, id: 'session-2' }],
        hasMore: true,
      };

      jest.spyOn(feedService as any, 'feedRepo', 'get').mockReturnValue({
        getPublicFeed: jest.fn().mockResolvedValue(mockResult),
      } as any);

      // ACT
      const result = await feedService.getFeed('user-1', { type: 'all' });

      // ASSERT
      expect(result.sessions).toHaveLength(2);
      expect(result.hasMore).toBe(true);
    });

    it('should support pagination with cursor', async () => {
      // ARRANGE
      const mockResult = {
        sessions: [mockSession],
        hasMore: true,
        nextCursor: 'next-cursor',
      };

      jest.spyOn(feedService as any, 'feedRepo', 'get').mockReturnValue({
        getPublicFeed: jest.fn().mockResolvedValue(mockResult),
      } as any);

      // ACT
      const result = await feedService.getFeed(
        'user-1',
        { type: 'trending' },
        { cursor: 'cursor-123' }
      );

      // ASSERT
      expect(result.nextCursor).toBe('next-cursor');
    });
  });

  describe('getFeed - user', () => {
    it('should get user feed', async () => {
      // ARRANGE
      const mockResult = {
        sessions: [mockSession],
        hasMore: false,
      };

      jest.spyOn(feedService as any, 'sessionRepo', 'get').mockReturnValue({
        findByUserId: jest.fn().mockResolvedValue([mockSession]),
      } as any);

      // ACT
      const result = await feedService.getFeed('user-1', {
        type: 'user',
        userId: 'user-2',
      });

      // ASSERT
      expect(result.sessions).toHaveLength(1);
    });

    it('should throw error if userId not provided for user feed', async () => {
      // ACT & ASSERT
      await expect(
        feedService.getFeed('user-1', { type: 'user' })
      ).rejects.toThrow('userId required for user feed');
    });
  });

  describe('getFeed - group', () => {
    it('should get group feed', async () => {
      // ARRANGE
      const mockResult = {
        sessions: [mockSession],
        hasMore: false,
      };

      jest.spyOn(feedService as any, 'sessionRepo', 'get').mockReturnValue({
        findByGroupId: jest.fn().mockResolvedValue([mockSession]),
      } as any);

      // ACT
      const result = await feedService.getFeed('user-1', {
        type: 'group',
        groupId: 'group-1',
      });

      // ASSERT
      expect(result.sessions).toHaveLength(1);
    });

    it('should throw error if groupId not provided for group feed', async () => {
      // ACT & ASSERT
      await expect(
        feedService.getFeed('user-1', { type: 'group' })
      ).rejects.toThrow('groupId required for group feed');
    });
  });

  describe('getFeed - group-members-unfollowed', () => {
    it('should get feed from unfollowed group members', async () => {
      // ARRANGE
      const mockResult = {
        sessions: [mockSession],
        hasMore: false,
      };

      jest.spyOn(feedService as any, 'socialGraphRepo', 'get').mockReturnValue({
        getGroupMemberIds: jest.fn().mockResolvedValue(['user-2', 'user-3']),
        getFollowingIds: jest.fn().mockResolvedValue(['user-2']),
      } as any);

      jest.spyOn(feedService as any, 'feedRepo', 'get').mockReturnValue({
        getFeedForGroupMembersUnfollowed: jest
          .fn()
          .mockResolvedValue(mockResult),
      } as any);

      // ACT
      const result = await feedService.getFeed('user-1', {
        type: 'group-members-unfollowed',
      });

      // ASSERT
      expect(result.sessions).toHaveLength(1);
    });

    it('should return empty feed if no group members', async () => {
      // ARRANGE
      jest.spyOn(feedService as any, 'socialGraphRepo', 'get').mockReturnValue({
        getGroupMemberIds: jest.fn().mockResolvedValue([]),
      } as any);

      // ACT
      const result = await feedService.getFeed('user-1', {
        type: 'group-members-unfollowed',
      });

      // ASSERT
      expect(result.sessions).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getFeed - custom limit', () => {
    it('should respect custom limit', async () => {
      // ARRANGE
      const mockResult = {
        sessions: Array(50).fill(mockSession),
        hasMore: true,
      };

      jest.spyOn(feedService as any, 'feedRepo', 'get').mockReturnValue({
        getPublicFeed: jest.fn().mockResolvedValue(mockResult),
      } as any);

      // ACT
      const result = await feedService.getFeed(
        'user-1',
        { type: 'all' },
        { limit: 50 }
      );

      // ASSERT
      expect(result.sessions).toHaveLength(50);
    });
  });

  describe('getFeed - invalid type', () => {
    it('should throw error for unknown feed type', async () => {
      // ACT & ASSERT
      await expect(
        feedService.getFeed('user-1', { type: 'invalid' as FeedType })
      ).rejects.toThrow('Unknown feed type');
    });
  });

  describe('refreshFeed', () => {
    it('should refresh feed (re-fetch without cursor)', async () => {
      // ARRANGE
      const mockResult = {
        sessions: [mockSession],
        hasMore: false,
      };

      jest.spyOn(feedService as any, 'socialGraphRepo', 'get').mockReturnValue({
        getFollowingIds: jest.fn().mockResolvedValue(['user-2']),
      } as any);

      jest.spyOn(feedService as any, 'feedRepo', 'get').mockReturnValue({
        getFeedForFollowing: jest.fn().mockResolvedValue(mockResult),
      } as any);

      // ACT
      const result = await feedService.refreshFeed('user-1', {
        type: 'following',
      });

      // ASSERT
      expect(result.sessions).toHaveLength(1);
    });
  });
});
