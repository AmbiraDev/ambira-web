import { User } from '@/domain/entities/User';
import { ProfileService } from '@/features/profile/services/ProfileService';

const findByUsername = jest.fn();
const findById = jest.fn();
const findByUserId = jest.fn();
const getFollowerIds = jest.fn();
const getFollowingIds = jest.fn();
const isFollowing = jest.fn();
const follow = jest.fn();
const unfollow = jest.fn();

jest.mock('@/infrastructure/firebase/repositories/UserRepository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    findByUsername,
    findById,
  })),
}));

jest.mock('@/infrastructure/firebase/repositories/SessionRepository', () => ({
  SessionRepository: jest.fn().mockImplementation(() => ({
    findByUserId,
    findByGroupId: jest.fn(),
  })),
}));

jest.mock(
  '@/infrastructure/firebase/repositories/SocialGraphRepository',
  () => ({
    SocialGraphRepository: jest.fn().mockImplementation(() => ({
      getFollowerIds,
      getFollowingIds,
      isFollowing,
      follow,
      unfollow,
    })),
  })
);

const baseUser = new User(
  'profile-1',
  'test',
  'Test User',
  'test@example.com',
  new Date()
);

describe('ProfileService', () => {
  const service = new ProfileService();

  beforeEach(() => {
    jest.clearAllMocks();
    findByUserId.mockResolvedValue([]);
    getFollowerIds.mockResolvedValue([]);
    getFollowingIds.mockResolvedValue([]);
    isFollowing.mockResolvedValue(false);
    follow.mockResolvedValue(undefined);
    unfollow.mockResolvedValue(undefined);
  });

  it('exposes repository passthroughs for basic lookups', async () => {
    findByUsername.mockResolvedValueOnce(baseUser);
    findById.mockResolvedValueOnce(baseUser);

    await expect(service.getProfileByUsername('test')).resolves.toBe(baseUser);
    await expect(service.getProfileById('profile-1')).resolves.toBe(baseUser);
  });

  it('enforces follower-only privacy checks', async () => {
    const profileUser = new User(
      baseUser.id,
      baseUser.username,
      baseUser.name,
      baseUser.email,
      baseUser.createdAt,
      baseUser.bio,
      baseUser.location,
      baseUser.profilePicture,
      baseUser.followerCount,
      baseUser.followingCount,
      'followers'
    );

    isFollowing.mockResolvedValueOnce(true);
    await expect(service.canViewProfile(profileUser, 'viewer')).resolves.toBe(
      true
    );

    isFollowing.mockResolvedValueOnce(false);
    await expect(service.canViewProfile(profileUser, 'viewer')).resolves.toBe(
      false
    );
  });

  it('delegates follow/unfollow operations to repository', async () => {
    // Follow should delegate to repository
    await service.followUser('user1', 'user2');
    expect(follow).toHaveBeenCalledWith('user1', 'user2');

    // Unfollow should delegate to repository
    await service.unfollowUser('user1', 'user2');
    expect(unfollow).toHaveBeenCalledWith('user1', 'user2');
  });

  it('propagates errors from repository follow/unfollow operations', async () => {
    // Simulate repository throwing error for self-follow
    follow.mockRejectedValueOnce(new Error('Cannot follow yourself'));
    await expect(service.followUser('same', 'same')).rejects.toThrow(
      'Cannot follow yourself'
    );

    // Simulate repository throwing error for duplicate follow
    follow.mockRejectedValueOnce(new Error('Already following this user'));
    await expect(service.followUser('user1', 'user2')).rejects.toThrow(
      'Already following this user'
    );
  });
});
