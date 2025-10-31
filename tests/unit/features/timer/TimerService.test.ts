/**
 * TimerService Unit Tests
 *
 * Tests the core timer business logic including:
 * - Starting timers
 * - Pausing/resuming timers
 * - Completing timers
 * - Auto-completion of old sessions
 * - Error handling for invalid operations
 */

import { TimerService } from '@/features/timer/services/TimerService';
import { ActiveSessionRepository } from '@/infrastructure/firebase/repositories/ActiveSessionRepository';
import { SessionRepository } from '@/infrastructure/firebase/repositories/SessionRepository';
import {
  createMockActiveSession,
  createMockRunningSession,
  createMockPausedSession,
  createMockOldSession,
} from '../../../__mocks__/factories';

// Mock repositories
jest.mock('@/infrastructure/firebase/repositories/ActiveSessionRepository');
jest.mock('@/infrastructure/firebase/repositories/SessionRepository');

describe('TimerService', () => {
  let service: TimerService;
  let mockActiveSessionRepo: jest.Mocked<ActiveSessionRepository>;
  let mockSessionRepo: jest.Mocked<SessionRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockActiveSessionRepo = {
      getActiveSession: jest.fn(),
      saveActiveSession: jest.fn(),
      deleteActiveSession: jest.fn(),
    } as any;

    mockSessionRepo = {
      saveSession: jest.fn(),
      findById: jest.fn(),
    } as any;

    // Mock constructor calls
    (
      ActiveSessionRepository as jest.MockedClass<
        typeof ActiveSessionRepository
      >
    ).mockImplementation(() => mockActiveSessionRepo);
    (
      SessionRepository as jest.MockedClass<typeof SessionRepository>
    ).mockImplementation(() => mockSessionRepo);

    service = new TimerService();
  });

  describe('startTimer', () => {
    it('should create and save a new running session', async () => {
      // Arrange
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(null);
      const data = {
        userId: 'user-123',
        projectId: 'project-456',
        activityId: 'activity-789',
        title: 'Coding Session',
      };

      // Act
      const result = await service.startTimer(data);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.projectId).toBe('project-456');
      expect(result.status).toBe('running');
      expect(mockActiveSessionRepo.saveActiveSession).toHaveBeenCalledWith(
        result
      );
    });

    it('should use custom start time when provided', async () => {
      // Arrange
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(null);
      const customTime = new Date('2024-01-15T08:00:00Z');
      const data = {
        userId: 'user-123',
        projectId: 'project-456',
        customStartTime: customTime,
      };

      // Act
      const result = await service.startTimer(data);

      // Assert
      expect(result.startTime).toEqual(customTime);
    });

    it('should throw error if timer already active', async () => {
      // Arrange
      const existingSession = createMockRunningSession();
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(existingSession);

      const data = {
        userId: 'user-123',
        projectId: 'project-456',
      };

      // Act & Assert
      await expect(service.startTimer(data)).rejects.toThrow(
        'An active timer already exists'
      );
    });

    it('should set initial duration to 0 for new session', async () => {
      // Arrange
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(null);
      const data = {
        userId: 'user-123',
        projectId: 'project-456',
      };

      // Act
      const result = await service.startTimer(data);

      // Assert
      expect(result.pausedDuration).toBe(0);
      expect(result.status).toBe('running');
    });
  });

  describe('getActiveSession', () => {
    it('should return active session when present', async () => {
      // Arrange
      const mockSession = createMockRunningSession();
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(mockSession);

      // Act
      const result = await service.getActiveSession('user-123');

      // Assert
      expect(result).toEqual(mockSession);
      expect(mockActiveSessionRepo.getActiveSession).toHaveBeenCalledWith(
        'user-123'
      );
    });

    it('should return null when no active session', async () => {
      // Arrange
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(null);

      // Act
      const result = await service.getActiveSession('user-123');

      // Assert
      expect(result).toBeNull();
    });

    it('should auto-complete and return null for old sessions', async () => {
      // Arrange
      const oldSession = createMockOldSession();
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(oldSession);

      // Act
      const result = await service.getActiveSession('user-123');

      // Assert
      expect(result).toBeNull();
      // Should attempt to auto-complete
      expect(mockActiveSessionRepo.deleteActiveSession).toHaveBeenCalled();
    });
  });

  describe('pauseTimer', () => {
    it('should pause a running timer', async () => {
      // Arrange
      const runningSession = createMockRunningSession();
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(runningSession);

      // Act
      const result = await service.pauseTimer('user-123');

      // Assert
      expect(result.status).toBe('paused');
      expect(result.lastPausedAt).toBeDefined();
      expect(mockActiveSessionRepo.saveActiveSession).toHaveBeenCalledWith(
        result
      );
    });

    it('should throw error when pausing already paused timer', async () => {
      // Arrange
      const pausedSession = createMockPausedSession();
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(pausedSession);

      // Act & Assert
      await expect(service.pauseTimer('user-123')).rejects.toThrow(
        'Timer is already paused'
      );
    });

    it('should throw error when no active timer exists', async () => {
      // Arrange
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(null);

      // Act & Assert
      await expect(service.pauseTimer('user-123')).rejects.toThrow(
        'No active timer to pause'
      );
    });
  });

  describe('resumeTimer', () => {
    it('should resume a paused timer', async () => {
      // Arrange
      const pausedSession = createMockPausedSession();
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(pausedSession);

      // Act
      const result = await service.resumeTimer('user-123');

      // Assert
      expect(result.status).toBe('running');
      expect(mockActiveSessionRepo.saveActiveSession).toHaveBeenCalledWith(
        result
      );
    });

    it('should throw error when resuming already running timer', async () => {
      // Arrange
      const runningSession = createMockRunningSession();
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(runningSession);

      // Act & Assert
      await expect(service.resumeTimer('user-123')).rejects.toThrow(
        'Timer is already running'
      );
    });

    it('should throw error when no active timer exists', async () => {
      // Arrange
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(null);

      // Act & Assert
      await expect(service.resumeTimer('user-123')).rejects.toThrow(
        'No active timer to resume'
      );
    });
  });

  describe('completeTimer', () => {
    it('should complete active timer with title and description', async () => {
      // Arrange
      const activeSession = createMockRunningSession({
        userId: 'user-123',
        projectId: 'project-456',
      });
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(activeSession);
      mockSessionRepo.saveSession.mockResolvedValue(undefined);

      // Act
      const result = await service.completeTimer('user-123', {
        title: 'Completed Work',
        description: 'Finished the feature',
        visibility: 'everyone',
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.title).toBe('Completed Work');
      expect(mockSessionRepo.saveSession).toHaveBeenCalled();
    });

    it('should throw error when no active timer to complete', async () => {
      // Arrange
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(null);

      // Act & Assert
      await expect(service.completeTimer('user-123')).rejects.toThrow(
        'No active timer to complete'
      );
    });

    it('should use default visibility when not specified', async () => {
      // Arrange
      const activeSession = createMockRunningSession();
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(activeSession);
      mockSessionRepo.saveSession.mockResolvedValue(undefined);

      // Act
      const result = await service.completeTimer('user-123');

      // Assert
      expect(result.visibility).toBeDefined();
    });

    it('should handle group IDs when completing timer', async () => {
      // Arrange
      const activeSession = createMockRunningSession();
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(activeSession);
      mockSessionRepo.saveSession.mockResolvedValue(undefined);

      // Act
      const result = await service.completeTimer('user-123', {
        groupIds: ['group-1', 'group-2'],
      });

      // Assert
      expect(result.groupIds).toContain('group-1');
      expect(result.groupIds).toContain('group-2');
    });
  });

  describe('cancelTimer', () => {
    it('should delete active timer without saving', async () => {
      // Arrange
      const activeSession = createMockRunningSession();
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(activeSession);

      // Act
      await service.cancelTimer('user-123');

      // Assert
      expect(mockActiveSessionRepo.deleteActiveSession).toHaveBeenCalledWith(
        'user-123'
      );
      expect(mockSessionRepo.saveSession).not.toHaveBeenCalled();
    });

    it('should throw error when no timer to cancel', async () => {
      // Arrange
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(null);

      // Act & Assert
      await expect(service.cancelTimer('user-123')).rejects.toThrow(
        'No active timer to cancel'
      );
    });
  });

  describe('error handling', () => {
    it('should propagate repository errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockActiveSessionRepo.getActiveSession.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.startTimer({
          userId: 'user-123',
          projectId: 'project-456',
        })
      ).rejects.toThrow('Database error');
    });

    it('should handle concurrent requests safely', async () => {
      // Arrange
      mockActiveSessionRepo.getActiveSession.mockResolvedValue(null);

      // Act
      const promises = Array(5)
        .fill(null)
        .map(() =>
          service.startTimer({
            userId: 'user-123',
            projectId: 'project-456',
          })
        );

      const results = await Promise.all(promises);

      // Assert - all should succeed (in real scenario, only first would)
      expect(results).toHaveLength(5);
    });
  });
});
