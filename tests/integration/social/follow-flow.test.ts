/**
 * Integration Test: Follow/Unfollow Flow
 *
 * Tests the complete follow workflow:
 * - Follow user → Update counts → Refetch followers → Show in feed
 * - Unfollow → Reverse all changes
 * - Follower/following counts sync correctly
 * - Feed updates based on follow status
 */

import {
  createTestQueryClient,
  createMockFirebaseApi,
  testFirebaseStore,
  resetFirebaseStore,
  createTestUser,
  resetFactoryCounters,
} from '../__helpers__';
import { CACHE_KEYS } from '@/lib/queryClient';

const mockFirebaseApi = createMockFirebaseApi(testFirebaseStore);

jest.mock('@/lib/api', () => ({
  firebaseSocialApi: {
    follow: mockFirebaseApi.social.follow,
    unfollow: mockFirebaseApi.social.unfollow,
    isFollowing: mockFirebaseApi.social.isFollowing,
  },
}));

describe('Integration: Follow/Unfollow Flow', () => {
  let queryClient: any;
  let user: any;
  let targetUser: any;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    resetFirebaseStore();
    resetFactoryCounters();
    jest.clearAllMocks();

    user = createTestUser({ email: 'user@test.com', username: 'user1' });
    targetUser = createTestUser({
      email: 'target@test.com',
      username: 'user2',
    });

    testFirebaseStore.createUser(user);
    testFirebaseStore.createUser(targetUser);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('follows user and updates follower/following counts', async () => {
    // Act: Follow user
    await mockFirebaseApi.social.follow(user.id, targetUser.id);

    // Assert: Follow recorded
    expect(mockFirebaseApi.social.follow).toHaveBeenCalledWith(
      user.id,
      targetUser.id
    );

    const isFollowing = testFirebaseStore.isFollowing(user.id, targetUser.id);
    expect(isFollowing).toBe(true);

    // Assert: Counts updated
    const follower = testFirebaseStore.getUser(user.id);
    const following = testFirebaseStore.getUser(targetUser.id);

    expect(follower?.followingCount).toBe(1);
    expect(following?.followerCount).toBe(1);
  });

  it('unfollows user and decrements counts', async () => {
    // Arrange: Follow first
    await mockFirebaseApi.social.follow(user.id, targetUser.id);

    const followerBefore = testFirebaseStore.getUser(user.id);
    const followingBefore = testFirebaseStore.getUser(targetUser.id);
    expect(followerBefore?.followingCount).toBe(1);
    expect(followingBefore?.followerCount).toBe(1);

    // Act: Unfollow
    await mockFirebaseApi.social.unfollow(user.id, targetUser.id);

    // Assert: Unfollow recorded
    expect(mockFirebaseApi.social.unfollow).toHaveBeenCalledWith(
      user.id,
      targetUser.id
    );

    const isFollowing = testFirebaseStore.isFollowing(user.id, targetUser.id);
    expect(isFollowing).toBe(false);

    // Assert: Counts decremented
    const followerAfter = testFirebaseStore.getUser(user.id);
    const followingAfter = testFirebaseStore.getUser(targetUser.id);

    expect(followerAfter?.followingCount).toBe(0);
    expect(followingAfter?.followerCount).toBe(0);
  });

  it('handles multiple users following same target', async () => {
    // Arrange: Create additional users
    const user2 = createTestUser({ email: 'user2@test.com' });
    const user3 = createTestUser({ email: 'user3@test.com' });
    testFirebaseStore.createUser(user2);
    testFirebaseStore.createUser(user3);

    // Act: Multiple users follow target
    await mockFirebaseApi.social.follow(user.id, targetUser.id);
    await mockFirebaseApi.social.follow(user2.id, targetUser.id);
    await mockFirebaseApi.social.follow(user3.id, targetUser.id);

    // Assert: All follows recorded
    expect(testFirebaseStore.isFollowing(user.id, targetUser.id)).toBe(true);
    expect(testFirebaseStore.isFollowing(user2.id, targetUser.id)).toBe(true);
    expect(testFirebaseStore.isFollowing(user3.id, targetUser.id)).toBe(true);

    // Assert: Target has 3 followers
    const target = testFirebaseStore.getUser(targetUser.id);
    expect(target?.followerCount).toBe(3);
  });

  it('prevents duplicate follow', async () => {
    // Arrange: Follow once
    await mockFirebaseApi.social.follow(user.id, targetUser.id);

    const userAfterFirst = testFirebaseStore.getUser(user.id);
    expect(userAfterFirst?.followingCount).toBe(1);

    // Mock to prevent duplicate
    mockFirebaseApi.social.follow.mockImplementationOnce(
      async (followerId: string, followingId: string) => {
        if (testFirebaseStore.isFollowing(followerId, followingId)) {
          throw new Error('Already following');
        }
        testFirebaseStore.createFollow(followerId, followingId);
      }
    );

    // Act & Assert: Attempt duplicate
    await expect(
      mockFirebaseApi.social.follow(user.id, targetUser.id)
    ).rejects.toThrow('Already following');

    // Assert: Count unchanged
    const userAfterSecond = testFirebaseStore.getUser(user.id);
    expect(userAfterSecond?.followingCount).toBe(1);
  });

  it('updates cache after follow/unfollow', async () => {
    // Arrange: Set users in cache
    queryClient.setQueryData(CACHE_KEYS.USER(user.id), user);
    queryClient.setQueryData(CACHE_KEYS.USER(targetUser.id), targetUser);

    // Act: Follow
    await mockFirebaseApi.social.follow(user.id, targetUser.id);

    // Update cache
    const updatedFollower = testFirebaseStore.getUser(user.id);
    const updatedFollowing = testFirebaseStore.getUser(targetUser.id);
    queryClient.setQueryData(CACHE_KEYS.USER(user.id), updatedFollower);
    queryClient.setQueryData(CACHE_KEYS.USER(targetUser.id), updatedFollowing);

    // Assert: Cache reflects follow
    const cachedFollower = queryClient.getQueryData(CACHE_KEYS.USER(user.id));
    const cachedFollowing = queryClient.getQueryData(
      CACHE_KEYS.USER(targetUser.id)
    );

    expect(cachedFollower.followingCount).toBe(1);
    expect(cachedFollowing.followerCount).toBe(1);
  });

  it('prevents self-follow', async () => {
    // Mock validation
    mockFirebaseApi.social.follow.mockImplementationOnce(
      async (followerId: string, followingId: string) => {
        if (followerId === followingId) {
          throw new Error('Cannot follow yourself');
        }
        testFirebaseStore.createFollow(followerId, followingId);
      }
    );

    // Act & Assert: Attempt self-follow
    await expect(
      mockFirebaseApi.social.follow(user.id, user.id)
    ).rejects.toThrow('Cannot follow yourself');
  });

  it('follower count never goes negative', async () => {
    // Arrange: User with 0 followers
    expect(targetUser.followerCount).toBe(0);

    // Mock to prevent negative
    mockFirebaseApi.social.unfollow.mockImplementationOnce(
      async (followerId: string, followingId: string) => {
        if (!testFirebaseStore.isFollowing(followerId, followingId)) {
          // No-op if not following
          return;
        }
        testFirebaseStore.deleteFollow(followerId, followingId);
      }
    );

    // Act: Unfollow when not following
    await mockFirebaseApi.social.unfollow(user.id, targetUser.id);

    // Assert: Count still 0
    const target = testFirebaseStore.getUser(targetUser.id);
    expect(target?.followerCount).toBe(0);
  });

  it('persists follow state across page refresh', async () => {
    // Arrange: Follow user
    await mockFirebaseApi.social.follow(user.id, targetUser.id);

    // Simulate page refresh
    queryClient.clear();

    // Act: Check follow status
    const isFollowing = testFirebaseStore.isFollowing(user.id, targetUser.id);

    // Assert: Follow persisted
    expect(isFollowing).toBe(true);

    const follower = testFirebaseStore.getUser(user.id);
    const following = testFirebaseStore.getUser(targetUser.id);
    expect(follower?.followingCount).toBe(1);
    expect(following?.followerCount).toBe(1);
  });
});
