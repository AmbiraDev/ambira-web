/**
 * SessionService Unit Tests
 *
 * Tests core session operations including:
 * - Getting sessions
 * - Updating sessions
 * - Deleting sessions
 * - Supporting sessions
 * - Retrieving session data
 */

import { SessionService } from '@/features/sessions/services/SessionService';
import {
  createMockSession,
  createMockSessionBatch,
} from '../../../__mocks__/factories';

const mockGetSession = jest.fn();
const mockGetSessionWithDetails = jest.fn();
const mockGetSessions = jest.fn();
const mockDeleteSession = jest.fn();
const mockSupportSession = jest.fn();
const mockRemoveSupportFromSession = jest.fn();
const mockUpdateSession = jest.fn();

jest.mock('@/lib/api', () => ({
  firebaseApi: {
    session: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      getSessionWithDetails: (...args: unknown[]) =>
        mockGetSessionWithDetails(...args),
      getSessions: (...args: unknown[]) => mockGetSessions(...args),
      deleteSession: (...args: unknown[]) => mockDeleteSession(...args),
      updateSession: (...args: unknown[]) => mockUpdateSession(...args),
    },
    post: {
      supportSession: (...args: unknown[]) => mockSupportSession(...args),
      removeSupportFromSession: (...args: unknown[]) =>
        mockRemoveSupportFromSession(...args),
    },
  },
}));

jest.mock('@/lib/validation', () => ({
  validateOrThrow: (schema: unknown, data: unknown) => data,
  UpdateSessionSchema: {},
}));

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SessionService();
  });

  describe('getSession', () => {
    it('should retrieve session by ID', async () => {
      // Arrange
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Act
      const result = await service.getSession(mockSession.id);

      // Assert
      expect(result).toEqual(mockSession);
      expect(mockGetSession).toHaveBeenCalledWith(mockSession.id);
    });

    it('should return null when session not found', async () => {
      // Arrange
      mockGetSession.mockRejectedValue(new Error('Not found'));

      // Act
      const result = await service.getSession('non-existent');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      mockGetSession.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await service.getSession('session-123');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getSessionWithDetails', () => {
    it('should retrieve session with user and activity details', async () => {
      // Arrange
      const mockSession = createMockSession();
      mockGetSessionWithDetails.mockResolvedValue(mockSession);

      // Act
      const result = await service.getSessionWithDetails(mockSession.id);

      // Assert
      expect(result).toEqual(mockSession);
      expect(mockGetSessionWithDetails).toHaveBeenCalledWith(mockSession.id);
    });

    it('should return null on error', async () => {
      // Arrange
      mockGetSessionWithDetails.mockRejectedValue(new Error('Not found'));

      // Act
      const result = await service.getSessionWithDetails('session-123');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getUserSessions', () => {
    it('should retrieve all sessions for a user', async () => {
      // Arrange
      const sessions = createMockSessionBatch(3, { userId: 'user-123' });
      mockGetSessions.mockResolvedValue({ sessions, hasMore: false });

      // Act
      const result = await service.getUserSessions('user-123');

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].userId).toBe('user-123');
      expect(mockGetSessions).toHaveBeenCalledWith(100, {
        userId: 'user-123',
      });
    });

    it('should return empty array on error', async () => {
      // Arrange
      mockGetSessions.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await service.getUserSessions('user-123');

      // Assert
      expect(result).toEqual([]);
    });

    it('should pass filters to API', async () => {
      // Arrange
      mockGetSessions.mockResolvedValue({ sessions: [], hasMore: false });

      // Act
      await service.getUserSessions('user-123', { limit: 50 });

      // Assert
      expect(mockGetSessions).toHaveBeenCalledWith(100, {
        userId: 'user-123',
        limit: 50,
      });
    });
  });

  describe('deleteSession', () => {
    it('should delete session by ID', async () => {
      // Arrange
      mockDeleteSession.mockResolvedValue(undefined);

      // Act
      await service.deleteSession('session-123');

      // Assert
      expect(mockDeleteSession).toHaveBeenCalledWith('session-123');
    });

    it('should propagate errors', async () => {
      // Arrange
      mockDeleteSession.mockRejectedValue(new Error('Delete failed'));

      // Act & Assert
      await expect(service.deleteSession('session-123')).rejects.toThrow(
        'Delete failed'
      );
    });
  });

  describe('supportSession', () => {
    it('should add support (like) to session', async () => {
      // Arrange
      mockSupportSession.mockResolvedValue(undefined);

      // Act
      await service.supportSession('session-123');

      // Assert
      expect(mockSupportSession).toHaveBeenCalledWith('session-123');
    });

    it('should handle support errors', async () => {
      // Arrange
      mockSupportSession.mockRejectedValue(new Error('Already supported'));

      // Act & Assert
      await expect(service.supportSession('session-123')).rejects.toThrow();
    });
  });

  describe('unsupportSession', () => {
    it('should remove support from session', async () => {
      // Arrange
      mockRemoveSupportFromSession.mockResolvedValue(undefined);

      // Act
      await service.unsupportSession('session-123');

      // Assert
      expect(mockRemoveSupportFromSession).toHaveBeenCalledWith('session-123');
    });

    it('should handle unsupport errors', async () => {
      // Arrange
      mockRemoveSupportFromSession.mockRejectedValue(
        new Error('Not supported')
      );

      // Act & Assert
      await expect(service.unsupportSession('session-123')).rejects.toThrow();
    });
  });

  describe('updateSession', () => {
    it('should update session with new data', async () => {
      // Arrange
      mockUpdateSession.mockResolvedValue(undefined);
      const updates = { title: 'Updated Title' };

      // Act
      await service.updateSession('session-123', updates);

      // Assert
      expect(mockUpdateSession).toHaveBeenCalledWith('session-123', updates);
    });

    it('should validate data before updating', async () => {
      // Arrange
      mockUpdateSession.mockResolvedValue(undefined);
      const updates = { title: 'Updated', visibility: 'private' };

      // Act
      await service.updateSession('session-123', updates);

      // Assert
      expect(mockUpdateSession).toHaveBeenCalledWith('session-123', updates);
    });

    it('should propagate update errors', async () => {
      // Arrange
      mockUpdateSession.mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(
        service.updateSession('session-123', { title: 'New' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle empty user sessions', async () => {
      // Arrange
      mockGetSessions.mockResolvedValue({ sessions: [], hasMore: false });

      // Act
      const result = await service.getUserSessions('inactive-user');

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle concurrent session operations', async () => {
      // Arrange
      const session1 = createMockSession({ id: 'session-1' });
      const session2 = createMockSession({ id: 'session-2' });

      mockGetSession
        .mockResolvedValueOnce(session1)
        .mockResolvedValueOnce(session2);

      // Act
      const results = await Promise.all([
        service.getSession('session-1'),
        service.getSession('session-2'),
      ]);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(session1);
      expect(results[1]).toEqual(session2);
    });
  });
});
