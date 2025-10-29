import type { FeedResult } from '@/infrastructure/firebase/repositories/FeedRepository';
import { Session } from '@/domain/entities/Session';
import { FeedService } from '@/features/feed/services/FeedService';

const getFeedForFollowing = jest.fn();
const getPublicFeed = jest.fn();
const getFeedForGroupMembersUnfollowed = jest.fn();
const findByUserId = jest.fn();
const findByGroupId = jest.fn();
const getFollowingIds = jest.fn();
const getGroupMemberIds = jest.fn();
const isFollowing = jest.fn();

jest.mock('@/infrastructure/firebase/repositories/FeedRepository', () => ({
  FeedRepository: jest.fn().mockImplementation(() => ({
    getFeedForFollowing,
    getPublicFeed,
    getFeedForGroupMembersUnfollowed,
  })),
}));

jest.mock(
  '@/infrastructure/firebase/repositories/SocialGraphRepository',
  () => ({
    SocialGraphRepository: jest.fn().mockImplementation(() => ({
      getFollowingIds,
      getGroupMemberIds,
      isFollowing,
    })),
  })
);

jest.mock('@/infrastructure/firebase/repositories/SessionRepository', () => ({
  SessionRepository: jest.fn().mockImplementation(() => ({
    findByUserId,
    findByGroupId,
  })),
}));

describe('FeedService', () => {
  const service = new FeedService();
  const emptyResult: FeedResult = { sessions: [], hasMore: false };

  beforeEach(() => {
    jest.clearAllMocks();
    getFeedForFollowing.mockResolvedValue(emptyResult);
    getPublicFeed.mockResolvedValue(emptyResult);
    getFeedForGroupMembersUnfollowed.mockResolvedValue(emptyResult);
    findByUserId.mockResolvedValue([]);
    findByGroupId.mockResolvedValue([]);
    getFollowingIds.mockResolvedValue(['friend-1', 'friend-2']);
    getGroupMemberIds.mockResolvedValue(['member-1', 'member-2']);
    isFollowing.mockResolvedValue(true);
  });

  it('returns following feed when no filters supplied', async () => {
    const result = await service.getFeed('user-1');

    expect(getFollowingIds).toHaveBeenCalledWith('user-1');
    expect(getFeedForFollowing).toHaveBeenCalledWith(
      ['friend-1', 'friend-2'],
      20,
      undefined
    );
    expect(result).toEqual(emptyResult);
  });

  it('falls back to empty feed when user follows nobody', async () => {
    getFollowingIds.mockResolvedValueOnce([]);

    const result = await service.getFeed('user-1');

    expect(result.sessions).toHaveLength(0);
    expect(result.hasMore).toBe(false);
  });

  it('routes public/trending requests to feed repository', async () => {
    await service.getFeed('user-1', { type: 'all' }, { limit: 5 });
    expect(getPublicFeed).toHaveBeenCalledWith(5, undefined);

    await service.getFeed('user-1', { type: 'recent' }, { cursor: 'cur' });
    expect(getPublicFeed).toHaveBeenCalledWith(20, 'cur'); // default limit for options
  });

  it('requires userId for user feeds and supports pagination hints', async () => {
    await expect(service.getFeed('user-1', { type: 'user' })).rejects.toThrow(
      'userId required for user feed'
    );

    const session = new Session('s-1', 'u', 'p', 'a', 60, new Date());
    findByUserId.mockResolvedValueOnce([session]);
    const result = await service.getFeed(
      'user-1',
      { type: 'user', userId: 'target' },
      { limit: 1 }
    );

    expect(findByUserId).toHaveBeenCalledWith('target', 1);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe('s-1');
  });

  it('requires groupId for group feeds', async () => {
    await expect(service.getFeed('user-1', { type: 'group' })).rejects.toThrow(
      'groupId required for group feed'
    );

    const groupSession = new Session(
      'session-x',
      'u',
      'p',
      'a',
      120,
      new Date()
    );
    findByGroupId.mockResolvedValueOnce([groupSession]);
    const result = await service.getFeed(
      'user-1',
      { type: 'group', groupId: 'group-1' },
      { limit: 1 }
    );

    expect(findByGroupId).toHaveBeenCalledWith('group-1', 1);
    expect(result.nextCursor).toBe('session-x');
  });

  it('merges group members with follow list when requesting unfollowed group feed', async () => {
    await service.getFeed(
      'user-1',
      { type: 'group-members-unfollowed' },
      { limit: 15, cursor: 'p1' }
    );

    expect(getGroupMemberIds).toHaveBeenCalledWith('user-1');
    expect(getFeedForGroupMembersUnfollowed).toHaveBeenCalledWith(
      ['member-1', 'member-2'],
      ['friend-1', 'friend-2'],
      15,
      'p1'
    );
  });
});
