/**
 * User Domain Entity Factory
 * Creates mock users for testing
 */

import { User } from '@/domain/entities/User';
import type { ProfileVisibility } from '@/domain/entities/User';

interface CreateUserOptions {
  id?: string;
  username?: string;
  name?: string;
  email?: string;
  createdAt?: Date;
  bio?: string;
  location?: string;
  profilePicture?: string;
  followersCount?: number;
  followingCount?: number;
  profileVisibility?: ProfileVisibility;
}

let userIdCounter = 1;

export function createMockUser(options: CreateUserOptions = {}): User {
  const id = options.id || `user-${userIdCounter++}`;
  const username = options.username || `user${id.slice(-2)}`;

  return new User(
    id,
    username,
    options.name ?? 'Test User',
    options.email ?? `${username}@example.com`,
    options.createdAt ?? new Date('2024-01-01'),
    options.bio,
    options.location,
    options.profilePicture,
    options.followersCount ?? 0,
    options.followingCount ?? 0,
    options.profileVisibility ?? 'everyone'
  );
}

export function createMockUserBatch(
  count: number,
  baseOptions: CreateUserOptions = {}
): User[] {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({
      ...baseOptions,
      id: `user-batch-${i}`,
      username: baseOptions.username
        ? `${baseOptions.username}${i}`
        : `user${i}`,
    })
  );
}

/**
 * Create a user with followers (social context)
 */
export function createMockUserWithFollowers(
  followersCount: number = 10,
  followingCount: number = 5,
  options: CreateUserOptions = {}
): User {
  return createMockUser({
    ...options,
    followersCount,
    followingCount,
  });
}

/**
 * Create a user with private profile
 */
export function createMockPrivateUser(options: CreateUserOptions = {}): User {
  return createMockUser({
    ...options,
    profileVisibility: 'private',
  });
}

/**
 * Create a user visible only to followers
 */
export function createMockFollowersOnlyUser(
  options: CreateUserOptions = {}
): User {
  return createMockUser({
    ...options,
    profileVisibility: 'followers',
  });
}

export function resetUserFactory(): void {
  userIdCounter = 1;
}
