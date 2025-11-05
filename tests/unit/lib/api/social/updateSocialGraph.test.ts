/**
 * Unit Test: updateSocialGraph Helper (Unfollow Action)
 *
 * Tests the social graph update logic for unfollow operations:
 * - Deletes social graph documents
 * - Decrements follower/following counts
 * - Handles mutual friendship counts
 * - Error handling and validation
 */

import { updateSocialGraph } from '@/lib/api/social/helpers';
import {
  runTransaction,
  doc,
  getDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  runTransaction: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  increment: jest.fn((value: number) => ({ _increment: value })),
  serverTimestamp: jest.fn(() => ({ _serverTimestamp: true })),
}));

describe('updateSocialGraph - Unfollow Action', () => {
  const currentUserId = 'user-1';
  const targetUserId = 'user-2';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Unfollow', () => {
    it('deletes social graph documents and decrements counts', async () => {
      const mockTransaction = {
        get: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        set: jest.fn(),
      };

      // Mock reads (must happen first in transaction)
      mockTransaction.get
        .mockResolvedValueOnce({
          // currentUserDoc
          exists: () => true,
          data: () => ({
            id: currentUserId,
            followingCount: 1,
            outboundFriendshipCount: 1,
          }),
        })
        .mockResolvedValueOnce({
          // targetUserDoc
          exists: () => true,
          data: () => ({
            id: targetUserId,
            followersCount: 1,
            inboundFriendshipCount: 1,
          }),
        })
        .mockResolvedValueOnce({
          // isFollowing check
          exists: () => true,
        })
        .mockResolvedValueOnce({
          // mutual check
          exists: () => false,
        });

      (runTransaction as jest.Mock).mockImplementation(
        async (
          _db: unknown,
          callback: (transaction: unknown) => Promise<void>
        ) => {
          await callback(mockTransaction);
        }
      );

      // Act
      await updateSocialGraph(currentUserId, targetUserId, 'unfollow');

      // Assert: Transaction executed
      expect(runTransaction).toHaveBeenCalledWith(db, expect.any(Function));

      // Assert: Social graph docs deleted
      expect(mockTransaction.delete).toHaveBeenCalledTimes(2);

      // Assert: Counts decremented
      const updateCalls = mockTransaction.update.mock.calls;
      expect(updateCalls).toHaveLength(2);

      // Check that one call has follower updates and one has following updates
      const hasFollowerUpdate = updateCalls.some((call: unknown[]) => {
        const data = call[1] as Record<string, unknown>;
        return (
          data.outboundFriendshipCount !== undefined &&
          data.followingCount !== undefined
        );
      });
      const hasFollowingUpdate = updateCalls.some((call: unknown[]) => {
        const data = call[1] as Record<string, unknown>;
        return (
          data.inboundFriendshipCount !== undefined &&
          data.followersCount !== undefined
        );
      });

      expect(hasFollowerUpdate).toBe(true);
      expect(hasFollowingUpdate).toBe(true);
    });

    it('decrements mutual friendship count when users are mutual followers', async () => {
      const mockTransaction = {
        get: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        set: jest.fn(),
      };

      mockTransaction.get
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ id: currentUserId, mutualFriendshipCount: 1 }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ id: targetUserId, mutualFriendshipCount: 1 }),
        })
        .mockResolvedValueOnce({
          exists: () => true, // isFollowing
        })
        .mockResolvedValueOnce({
          exists: () => true, // mutual check - target follows current user back
        });

      (runTransaction as jest.Mock).mockImplementation(
        async (
          _db: unknown,
          callback: (transaction: unknown) => Promise<void>
        ) => {
          await callback(mockTransaction);
        }
      );

      // Act
      await updateSocialGraph(currentUserId, targetUserId, 'unfollow');

      // Assert: Mutual counts decremented
      const updateCalls = mockTransaction.update.mock.calls;
      const hasMutualDecrement = updateCalls.some((call: unknown[]) => {
        const data = call[1] as Record<string, unknown>;
        const mutual = data.mutualFriendshipCount as
          | { _increment: number }
          | undefined;
        return mutual && mutual._increment === -1;
      });
      expect(hasMutualDecrement).toBe(true);
    });

    it('does not decrement mutual count when not mutual followers', async () => {
      const mockTransaction = {
        get: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        set: jest.fn(),
      };

      mockTransaction.get
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ id: currentUserId }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ id: targetUserId }),
        })
        .mockResolvedValueOnce({
          exists: () => true, // isFollowing
        })
        .mockResolvedValueOnce({
          exists: () => false, // not mutual
        });

      (runTransaction as jest.Mock).mockImplementation(
        async (
          _db: unknown,
          callback: (transaction: unknown) => Promise<void>
        ) => {
          await callback(mockTransaction);
        }
      );

      // Act
      await updateSocialGraph(currentUserId, targetUserId, 'unfollow');

      // Assert: No mutual count updates
      const updateCalls = mockTransaction.update.mock.calls;
      updateCalls.forEach((call: unknown[]) => {
        const updateData = call[1] as Record<string, unknown>;
        expect(updateData.mutualFriendshipCount).toBeUndefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('does nothing if already not following', async () => {
      const mockTransaction = {
        get: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        set: jest.fn(),
      };

      mockTransaction.get
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ id: currentUserId }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ id: targetUserId }),
        })
        .mockResolvedValueOnce({
          exists: () => false, // not following
        })
        .mockResolvedValueOnce({
          exists: () => false,
        });

      (runTransaction as jest.Mock).mockImplementation(
        async (
          _db: unknown,
          callback: (transaction: unknown) => Promise<void>
        ) => {
          await callback(mockTransaction);
        }
      );

      // Act
      await updateSocialGraph(currentUserId, targetUserId, 'unfollow');

      // Assert: No writes performed (transaction returns early)
      expect(mockTransaction.delete).not.toHaveBeenCalled();
      expect(mockTransaction.update).not.toHaveBeenCalled();
    });

    it('throws error when current user not found', async () => {
      const mockTransaction = {
        get: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      };

      mockTransaction.get.mockResolvedValueOnce({
        exists: () => false, // user not found
      });

      (runTransaction as jest.Mock).mockImplementation(
        async (
          _db: unknown,
          callback: (transaction: unknown) => Promise<void>
        ) => {
          await callback(mockTransaction);
        }
      );

      // Act & Assert
      await expect(
        updateSocialGraph(currentUserId, targetUserId, 'unfollow')
      ).rejects.toThrow();
    });

    it('throws error when target user not found', async () => {
      const mockTransaction = {
        get: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      };

      mockTransaction.get
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ id: currentUserId }),
        })
        .mockResolvedValueOnce({
          exists: () => false, // target not found
        });

      (runTransaction as jest.Mock).mockImplementation(
        async (
          _db: unknown,
          callback: (transaction: unknown) => Promise<void>
        ) => {
          await callback(mockTransaction);
        }
      );

      // Act & Assert
      await expect(
        updateSocialGraph(currentUserId, targetUserId, 'unfollow')
      ).rejects.toThrow();
    });

    it('handles transaction failures gracefully', async () => {
      (runTransaction as jest.Mock).mockRejectedValue(
        new Error('Transaction failed')
      );

      // Act & Assert
      await expect(
        updateSocialGraph(currentUserId, targetUserId, 'unfollow')
      ).rejects.toThrow();
    });
  });

  describe('Data Integrity', () => {
    it('updates timestamps on both users', async () => {
      const mockTransaction = {
        get: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        set: jest.fn(),
      };

      mockTransaction.get
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ id: currentUserId }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ id: targetUserId }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
        })
        .mockResolvedValueOnce({
          exists: () => false,
        });

      (runTransaction as jest.Mock).mockImplementation(
        async (
          _db: unknown,
          callback: (transaction: unknown) => Promise<void>
        ) => {
          await callback(mockTransaction);
        }
      );

      // Act
      await updateSocialGraph(currentUserId, targetUserId, 'unfollow');

      // Assert: Timestamps updated
      const updateCalls = mockTransaction.update.mock.calls;
      updateCalls.forEach((call: unknown[]) => {
        const updateData = call[1] as Record<string, unknown>;
        expect(updateData.updatedAt).toBeDefined();
      });
    });

    it('performs all reads before writes (transaction requirement)', async () => {
      const operations: string[] = [];
      const mockTransaction = {
        get: jest.fn((..._args: unknown[]) => {
          operations.push('read');
          return Promise.resolve({
            exists: () => true,
            data: () => ({}),
          });
        }),
        delete: jest.fn((..._args: unknown[]) => {
          operations.push('write');
          return Promise.resolve();
        }),
        update: jest.fn((..._args: unknown[]) => {
          operations.push('write');
          return Promise.resolve();
        }),
        set: jest.fn(),
      };

      (runTransaction as jest.Mock).mockImplementation(
        async (
          _db: unknown,
          callback: (transaction: unknown) => Promise<void>
        ) => {
          await callback(mockTransaction);
        }
      );

      // Act
      await updateSocialGraph(currentUserId, targetUserId, 'unfollow');

      // Assert: All reads before writes
      const firstWriteIndex = operations.indexOf('write');
      const readsBeforeFirstWrite = operations
        .slice(0, firstWriteIndex)
        .every(op => op === 'read');
      expect(readsBeforeFirstWrite).toBe(true);
    });
  });

  describe('Notification Behavior', () => {
    it('does not create notification for unfollow action', async () => {
      const mockTransaction = {
        get: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        set: jest.fn(),
      };

      mockTransaction.get
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ id: currentUserId }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ id: targetUserId }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
        })
        .mockResolvedValueOnce({
          exists: () => false,
        });

      (runTransaction as jest.Mock).mockImplementation(
        async (
          _db: unknown,
          callback: (transaction: unknown) => Promise<void>
        ) => {
          await callback(mockTransaction);
        }
      );

      // Act
      await updateSocialGraph(currentUserId, targetUserId, 'unfollow');

      // Assert: No notification created (addDoc not called)
      const { addDoc } = require('firebase/firestore');
      expect(addDoc).not.toHaveBeenCalled();
    });
  });
});
