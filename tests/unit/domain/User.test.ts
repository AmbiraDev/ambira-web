/**
 * User Domain Entity Unit Tests
 * Tests User domain business logic and invariants
 */

import { User } from '@/domain/entities/User'

describe('User Domain Entity', () => {
  describe('construction and validation', () => {
    it('should create a valid user', () => {
      const user = new User(
        'user-123',
        'johndoe',
        'John Doe',
        'john@example.com',
        new Date('2024-01-01')
      )

      expect(user.id).toBe('user-123')
      expect(user.username).toBe('johndoe')
      expect(user.name).toBe('John Doe')
      expect(user.email).toBe('john@example.com')
    })

    it('should throw error with empty username', () => {
      expect(() => new User('user-123', '', 'John Doe', 'john@example.com', new Date())).toThrow(
        'Username cannot be empty'
      )
    })

    it('should throw error with empty name', () => {
      expect(() => new User('user-123', 'johndoe', '', 'john@example.com', new Date())).toThrow(
        'Name cannot be empty'
      )
    })

    it('should throw error with invalid email', () => {
      expect(() => new User('user-123', 'johndoe', 'John Doe', 'not-an-email', new Date())).toThrow(
        'Valid email is required'
      )
    })

    it('should throw error with negative follower count', () => {
      expect(
        () =>
          new User(
            'user-123',
            'johndoe',
            'John Doe',
            'john@example.com',
            new Date(),
            undefined,
            undefined,
            undefined,
            -1
          )
      ).toThrow('Follower count cannot be negative')
    })

    it('should throw error with negative following count', () => {
      expect(
        () =>
          new User(
            'user-123',
            'johndoe',
            'John Doe',
            'john@example.com',
            new Date(),
            undefined,
            undefined,
            undefined,
            0,
            -1
          )
      ).toThrow('Following count cannot be negative')
    })
  })

  describe('profile visibility', () => {
    const user = new User(
      'user-123',
      'johndoe',
      'John Doe',
      'john@example.com',
      new Date(),
      'My bio',
      'New York',
      undefined,
      10,
      5,
      'everyone'
    )

    it('should be visible to everyone with everyone visibility', () => {
      expect(user.isVisibleTo('other-user')).toBe(true)
      expect(user.isVisibleTo(null)).toBe(true)
    })

    it('should always be visible to self', () => {
      const privateUser = new User(
        'user-123',
        'johndoe',
        'John Doe',
        'john@example.com',
        new Date(),
        undefined,
        undefined,
        undefined,
        0,
        0,
        'private'
      )
      expect(privateUser.isVisibleTo('user-123')).toBe(true)
    })

    it('should respect followers-only visibility', () => {
      const followersOnlyUser = new User(
        'user-123',
        'johndoe',
        'John Doe',
        'john@example.com',
        new Date(),
        undefined,
        undefined,
        undefined,
        0,
        0,
        'followers'
      )
      expect(followersOnlyUser.isVisibleTo('other-user', true)).toBe(true)
      expect(followersOnlyUser.isVisibleTo('other-user', false)).toBe(false)
    })

    it('should not be visible with private visibility', () => {
      const privateUser = new User(
        'user-123',
        'johndoe',
        'John Doe',
        'john@example.com',
        new Date(),
        undefined,
        undefined,
        undefined,
        0,
        0,
        'private'
      )
      expect(privateUser.isVisibleTo('other-user')).toBe(false)
      expect(privateUser.isVisibleTo('other-user', true)).toBe(false)
    })
  })

  describe('display name', () => {
    it('should return full name when available', () => {
      const user = new User('user-123', 'johndoe', 'John Doe', 'john@example.com', new Date())
      expect(user.getDisplayName()).toBe('John Doe')
    })

    it('should reject empty name during construction', () => {
      // Empty name is not allowed due to validation
      // The User entity enforces that name cannot be empty
      expect(() => new User('user-123', 'johndoe', '', 'john@example.com', new Date())).toThrow(
        'Name cannot be empty'
      )
    })
  })

  describe('initials', () => {
    it('should extract initials from name', () => {
      const user = new User('user-123', 'johndoe', 'John Doe', 'john@example.com', new Date())
      expect(user.getInitials()).toBe('JD')
    })

    it('should handle single word names', () => {
      const user = new User('user-123', 'johndoe', 'John', 'john@example.com', new Date())
      expect(user.getInitials()).toBe('J')
    })

    it('should handle multi-word names', () => {
      const user = new User(
        'user-123',
        'johndoe',
        'John Michael Doe',
        'john@example.com',
        new Date()
      )
      expect(user.getInitials()).toBe('JM')
    })

    it('should uppercase initials', () => {
      const user = new User('user-123', 'johndoe', 'john doe', 'john@example.com', new Date())
      expect(user.getInitials()).toMatch(/^[A-Z]{1,2}$/)
    })
  })

  describe('social metrics', () => {
    it('should track follower count', () => {
      const user = new User(
        'user-123',
        'johndoe',
        'John Doe',
        'john@example.com',
        new Date(),
        undefined,
        undefined,
        undefined,
        42
      )
      expect(user.followerCount).toBe(42)
    })

    it('should track following count', () => {
      const user = new User(
        'user-123',
        'johndoe',
        'John Doe',
        'john@example.com',
        new Date(),
        undefined,
        undefined,
        undefined,
        0,
        15
      )
      expect(user.followingCount).toBe(15)
    })

    it('should default counts to zero', () => {
      const user = new User('user-123', 'johndoe', 'John Doe', 'john@example.com', new Date())
      expect(user.followerCount).toBe(0)
      expect(user.followingCount).toBe(0)
    })
  })

  describe('profile fields', () => {
    it('should support optional bio', () => {
      const user = new User(
        'user-123',
        'johndoe',
        'John Doe',
        'john@example.com',
        new Date(),
        'My awesome bio'
      )
      expect(user.bio).toBe('My awesome bio')
    })

    it('should support optional location', () => {
      const user = new User(
        'user-123',
        'johndoe',
        'John Doe',
        'john@example.com',
        new Date(),
        undefined,
        'San Francisco, CA'
      )
      expect(user.location).toBe('San Francisco, CA')
    })

    it('should support optional profile picture', () => {
      const user = new User(
        'user-123',
        'johndoe',
        'John Doe',
        'john@example.com',
        new Date(),
        undefined,
        undefined,
        'https://example.com/avatar.jpg'
      )
      expect(user.profilePicture).toBe('https://example.com/avatar.jpg')
    })
  })

  describe('timestamps', () => {
    it('should track creation date', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z')
      const user = new User('user-123', 'johndoe', 'John Doe', 'john@example.com', createdAt)
      expect(user.createdAt).toEqual(createdAt)
    })
  })
})
