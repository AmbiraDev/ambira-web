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
import { Session } from '@/domain/entities/Session';

// Create mock instances
const mockFeedRepo = {
  getPublicFeed: jest.fn(),
  getFeedForFollowing: jest.fn(),
  getUserFeed: jest.fn(),
  getGroupFeed: jest.fn(),
  getFeedForGroupMembersUnfollowed: jest.fn(),
} as unknown as jest.Mocked<FeedRepository>;

const mockSocialGraphRepo = {
  getFollowingIds: jest.fn(),
  getGroupMemberIds: jest.fn(),
} as unknown as jest.Mocked<SocialGraphRepository>;

const mockSessionRepo = {
  findByUserId: jest.fn(),
  findByGroupId: jest.fn(),
} as unknown as jest.Mocked<SessionRepository>;

jest.mock('@/infrastructure/firebase/repositories/FeedRepository', () => ({
  FeedRepository: jest.fn(() => mockFeedRepo),
}));
jest.mock(
  '@/infrastructure/firebase/repositories/SocialGraphRepository',
  () => ({
    SocialGraphRepository: jest.fn(() => mockSocialGraphRepo),
  })
);
jest.mock('@/infrastructure/firebase/repositories/SessionRepository', () => ({
  SessionRepository: jest.fn(() => mockSessionRepo),
}));

describe('FeedService', () => {
  let feedService: FeedService;

  const mockSession = new Session(
    'session-1',
    'user-1',
    'project-1',
    'activity-1',
    3600,
    new Date(),
    'Work Session',
    'Description',
    'everyone',
    5,
    2,
    []
  );

  beforeEach(() => {
    jest.clearAllMocks();
    feedService = new FeedService();
  });

  describe('getFeed - following', () => {
    it('should get following feed', async () => {
      // ARRANGE
      const mockResult = {
        sessions: [mockSession],
        hasMore: false,
      };

      mockSocialGraphRepo.getFollowingIds.mockResolvedValue([
        'user-2',
        'user-3',
      ]);
      mockFeedRepo.getFeedForFollowing.mockResolvedValue(mockResult);

      // ACT
      const result = await feedService.getFeed('user-1', { type: 'following' });

      // ASSERT
      expect(result.sessions).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('should include current user in feed even when not following anyone', async () => {
      // ARRANGE
      // User doesn't follow anyone
      mockSocialGraphRepo.getFollowingIds.mockResolvedValue([]);

      // Mock feed repository to return empty sessions (user has no posts)
      mockFeedRepo.getFeedForFollowing.mockResolvedValue({
        sessions: [],
        hasMore: false,
      });

      // ACT
      const result = await feedService.getFeed('user-1', { type: 'following' });

      // ASSERT
      // Should still call feed repo with current user included
      expect(mockFeedRepo.getFeedForFollowing).toHaveBeenCalledWith(
        ['user-1'],
        20,
        undefined
      );
      // Result depends on what feed repository returns (in this case, empty)
      expect(result.sessions).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getFeed - public/trending/recent/all', () => {
    it('should get public feed', async () => {
      // ARRANGE
      const session2 = new Session(
        'session-2',
        mockSession.userId,
        mockSession.projectId,
        mockSession.activityId,
        mockSession.duration,
        mockSession.createdAt,
        mockSession.title,
        mockSession.description,
        mockSession.visibility,
        mockSession.supportCount,
        mockSession.commentCount
      );
      const mockResult = {
        sessions: [mockSession, session2],
        hasMore: true,
      };

      mockFeedRepo.getPublicFeed.mockResolvedValue(mockResult);

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

      mockFeedRepo.getPublicFeed.mockResolvedValue(mockResult);

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
      mockSessionRepo.findByUserId.mockResolvedValue([mockSession]);

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
      mockSessionRepo.findByGroupId.mockResolvedValue([mockSession]);

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

      mockSocialGraphRepo.getGroupMemberIds.mockResolvedValue([
        'user-2',
        'user-3',
      ]);
      mockSocialGraphRepo.getFollowingIds.mockResolvedValue(['user-2']);
      mockFeedRepo.getFeedForGroupMembersUnfollowed.mockResolvedValue(
        mockResult
      );

      // ACT
      const result = await feedService.getFeed('user-1', {
        type: 'group-members-unfollowed',
      });

      // ASSERT
      expect(result.sessions).toHaveLength(1);
    });

    it('should return empty feed if no group members', async () => {
      // ARRANGE
      mockSocialGraphRepo.getGroupMemberIds.mockResolvedValue([]);

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

      mockFeedRepo.getPublicFeed.mockResolvedValue(mockResult);

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

      mockSocialGraphRepo.getFollowingIds.mockResolvedValue(['user-2']);
      mockFeedRepo.getFeedForFollowing.mockResolvedValue(mockResult);

      // ACT
      const result = await feedService.refreshFeed('user-1', {
        type: 'following',
      });

      // ASSERT
      expect(result.sessions).toHaveLength(1);
    });
  });
});
