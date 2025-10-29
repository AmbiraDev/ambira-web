import { User } from '@/domain/entities/User';
import { ProfileService } from '@/features/profile/services/ProfileService';

const findByUsername = jest.fn();
const findById = jest.fn();
const findByUserId = jest.fn();
const getFollowerIds = jest.fn();
const getFollowingIds = jest.fn();
const isFollowing = jest.fn();

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
    })),
  })
);

const baseUser: User = {
  id: 'profile-1',
  email: 'test@example.com',
  name: 'Test User',
  username: 'test',
  createdAt: new Date(),
  updatedAt: new Date(),
  profileVisibility: 'everyone',
};

describe('ProfileService', () => {
  const service = new ProfileService();

  beforeEach(() => {
    jest.clearAllMocks();
    findByUserId.mockResolvedValue([]);
    getFollowerIds.mockResolvedValue([]);
    getFollowingIds.mockResolvedValue([]);
    isFollowing.mockResolvedValue(false);
  });

  it('exposes repository passthroughs for basic lookups', async () => {
    findByUsername.mockResolvedValueOnce(baseUser);
    findById.mockResolvedValueOnce(baseUser);

    await expect(service.getProfileByUsername('test')).resolves.toBe(baseUser);
    await expect(service.getProfileById('profile-1')).resolves.toBe(baseUser);
  });

  it('enforces follower-only privacy checks', async () => {
    const profileUser: User = {
      ...baseUser,
      profileVisibility: 'followers',
    };

    isFollowing.mockResolvedValueOnce(true);
    await expect(service.canViewProfile(profileUser, 'viewer')).resolves.toBe(
      true
    );

    isFollowing.mockResolvedValueOnce(false);
    await expect(service.canViewProfile(profileUser, 'viewer')).resolves.toBe(
      false
    );
  });

  it('blocks self-follow/unfollow operations with descriptive errors', async () => {
    await expect(service.followUser('same', 'same')).rejects.toThrow(
      'Cannot follow yourself'
    );
    await expect(service.unfollowUser('same', 'same')).rejects.toThrow(
      'Cannot unfollow yourself'
    );
  });

  it('prevents duplicate follow attempts before hitting not-implemented guard', async () => {
    isFollowing.mockResolvedValueOnce(true);
    await expect(service.followUser('viewer', 'profile-1')).rejects.toThrow(
      'Already following this user'
    );
  });
});
