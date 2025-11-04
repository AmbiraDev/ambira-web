/**
 * FeedService Unit Tests
 *
 * Tests feed retrieval for different feed types (following, public, user, group)
 * Tests pagination and filter logic
 */

// Note: 'any' types used for test mocks; unused imports kept for future test coverage

import { FeedService, FeedType } from '@/features/feed/services/FeedService';
import { FeedRepository } from '@/infrastructure/firebase/repositories/FeedRepository';
import { SocialGraphRepository } from '@/infrastructure/firebase/repositories/SocialGraphRepository';
import { SessionRepository } from '@/infrastructure/firebase/repositories/SessionRepository';
import { Session } from '@/domain/entities/Session';

jest.mock('@/infrastructure/firebase/repositories/FeedRepository');
jest.mock('@/infrastructure/firebase/repositories/SocialGraphRepository');
jest.mock('@/infrastructure/firebase/repositories/SessionRepository');

describe('FeedService', () => {
  let feedService: FeedService;
  let mockFeedRepoInstance: jest.Mocked<FeedRepository>;
  let mockSocialGraphRepoInstance: jest.Mocked<SocialGraphRepository>;
  let mockSessionRepoInstance: jest.Mocked<SessionRepository>;

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

    // Create mock instances
    mockFeedRepoInstance = {
      getPublicFeed: jest.fn(),
      getFeedForFollowing: jest.fn(),
      getFeedForGroupMembersUnfollowed: jest.fn(),
    } as any;

    mockSocialGraphRepoInstance = {
      getFollowingIds: jest.fn(),
      getGroupMemberIds: jest.fn(),
    } as any;

    mockSessionRepoInstance = {
      findByUserId: jest.fn(),
      findByGroupId: jest.fn(),
    } as any;

    // Mock the constructors to return our mock instances
    (
      FeedRepository as jest.MockedClass<typeof FeedRepository>
    ).mockImplementation(() => mockFeedRepoInstance);
    (
      SocialGraphRepository as jest.MockedClass<typeof SocialGraphRepository>
    ).mockImplementation(() => mockSocialGraphRepoInstance);
    (
      SessionRepository as jest.MockedClass<typeof SessionRepository>
    ).mockImplementation(() => mockSessionRepoInstance);

    feedService = new FeedService();
  });

  describe('getFeed - following', () => {
    it('should get following feed', async () => {
      // ARRANGE
      const mockResult = {
        sessions: [mockSession],
        hasMore: false,
      };

      mockSocialGraphRepoInstance.getFollowingIds.mockResolvedValue([
        'user-2',
        'user-3',
      ]);
      mockFeedRepoInstance.getFeedForFollowing.mockResolvedValue(mockResult);

      // ACT
      const result = await feedService.getFeed('user-1', { type: 'following' });

      // ASSERT
      expect(result.sessions).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('should include current user in following feed (for own posts)', async () => {
      // ARRANGE
      const mockResult = {
        sessions: [mockSession],
        hasMore: false,
      };

      mockSocialGraphRepoInstance.getFollowingIds.mockResolvedValue([
        'user-2',
        'user-3',
      ]);
      mockFeedRepoInstance.getFeedForFollowing.mockResolvedValue(mockResult);

      // ACT
      await feedService.getFeed('user-1', { type: 'following' });

      // ASSERT - Verify current user is included in the userIds
      expect(mockFeedRepoInstance.getFeedForFollowing).toHaveBeenCalledWith(
        expect.arrayContaining(['user-1', 'user-2', 'user-3']),
        20,
        undefined
      );
    });

    it('should not duplicate current user if already in following list', async () => {
      // ARRANGE
      const mockResult = {
        sessions: [mockSession],
        hasMore: false,
      };

      // User somehow follows themselves
      mockSocialGraphRepoInstance.getFollowingIds.mockResolvedValue([
        'user-1',
        'user-2',
      ]);
      mockFeedRepoInstance.getFeedForFollowing.mockResolvedValue(mockResult);

      // ACT
      await feedService.getFeed('user-1', { type: 'following' });

      // ASSERT - Verify no duplicates (Set deduplication)
      const calledWith = mockFeedRepoInstance.getFeedForFollowing.mock
        .calls[0]?.[0] as string[];
      const uniqueIds = new Set(calledWith);
      expect(calledWith.length).toBe(uniqueIds.size);
      expect(uniqueIds.has('user-1')).toBe(true);
      expect(uniqueIds.has('user-2')).toBe(true);
    });

    it('should show own posts even if not following anyone', async () => {
      // ARRANGE
      const mockResult = {
        sessions: [mockSession],
        hasMore: false,
      };

      // Not following anyone
      mockSocialGraphRepoInstance.getFollowingIds.mockResolvedValue([]);
      mockFeedRepoInstance.getFeedForFollowing.mockResolvedValue(mockResult);

      // ACT
      await feedService.getFeed('user-1', { type: 'following' });

      // ASSERT - Should still call feed repo with current user
      expect(mockFeedRepoInstance.getFeedForFollowing).toHaveBeenCalledWith(
        ['user-1'],
        20,
        undefined
      );
    });

    it('should return empty feed if not following anyone', async () => {
      // ARRANGE
      mockSocialGraphRepoInstance.getFollowingIds.mockResolvedValue([]);
      mockFeedRepoInstance.getFeedForFollowing.mockResolvedValue({
        sessions: [],
        hasMore: false,
      });

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
      const mockSession2 = new Session(
        'session-2',
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
      const mockResult = {
        sessions: [mockSession, mockSession2],
        hasMore: true,
      };

      mockFeedRepoInstance.getPublicFeed.mockResolvedValue(mockResult);

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

      mockFeedRepoInstance.getPublicFeed.mockResolvedValue(mockResult);

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
      mockSessionRepoInstance.findByUserId.mockResolvedValue([mockSession]);

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
      mockSessionRepoInstance.findByGroupId.mockResolvedValue([mockSession]);

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

      mockSocialGraphRepoInstance.getGroupMemberIds.mockResolvedValue([
        'user-2',
        'user-3',
      ]);
      mockSocialGraphRepoInstance.getFollowingIds.mockResolvedValue(['user-2']);
      mockFeedRepoInstance.getFeedForGroupMembersUnfollowed.mockResolvedValue(
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
      mockSocialGraphRepoInstance.getGroupMemberIds.mockResolvedValue([]);
      mockFeedRepoInstance.getFeedForGroupMembersUnfollowed.mockResolvedValue({
        sessions: [],
        hasMore: false,
      });

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

      mockFeedRepoInstance.getPublicFeed.mockResolvedValue(mockResult);

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

      mockSocialGraphRepoInstance.getFollowingIds.mockResolvedValue(['user-2']);
      mockFeedRepoInstance.getFeedForFollowing.mockResolvedValue(mockResult);

      // ACT
      const result = await feedService.refreshFeed('user-1', {
        type: 'following',
      });

      // ASSERT
      expect(result.sessions).toHaveLength(1);
    });
  });
});
