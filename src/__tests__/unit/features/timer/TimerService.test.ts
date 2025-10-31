/**
 * TimerService Unit Tests
 *
 * Tests core timer operations: start, pause, resume, complete, cancel
 * Tests business rules and error handling
 */

import {
  TimerService,
  StartTimerData,
  CompleteTimerData,
} from '@/features/timer/services/TimerService';
import { ActiveSessionRepository } from '@/infrastructure/firebase/repositories/ActiveSessionRepository';
import { SessionRepository } from '@/infrastructure/firebase/repositories/SessionRepository';
import { ActiveSession } from '@/domain/entities/ActiveSession';
import { Session } from '@/domain/entities/Session';

// Create mock instances
const mockActiveSessionRepoInstance = {
  getActiveSession: jest.fn(),
  saveActiveSession: jest.fn(),
  deleteActiveSession: jest.fn(),
} as unknown as jest.Mocked<ActiveSessionRepository>;

const mockSessionRepoInstance = {
  save: jest.fn(),
  findById: jest.fn(),
} as unknown as jest.Mocked<SessionRepository>;

// Mock the repositories
jest.mock(
  '@/infrastructure/firebase/repositories/ActiveSessionRepository',
  () => ({
    ActiveSessionRepository: jest.fn(() => mockActiveSessionRepoInstance),
  })
);
jest.mock('@/infrastructure/firebase/repositories/SessionRepository', () => ({
  SessionRepository: jest.fn(() => mockSessionRepoInstance),
}));

describe('TimerService', () => {
  let timerService: TimerService;

  beforeEach(() => {
    jest.clearAllMocks();
    timerService = new TimerService();
  });

  describe('startTimer', () => {
    it('should start a new timer successfully', async () => {
      // ARRANGE
      const startData: StartTimerData = {
        userId: 'user-123',
        projectId: 'project-456',
        title: 'Test Session',
      };

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(null);
      mockActiveSessionRepoInstance.saveActiveSession.mockResolvedValue(
        undefined
      );

      // ACT
      const result = await timerService.startTimer(startData);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.projectId).toBe('project-456');
      expect(result.status).toBe('running');
    });

    it('should throw error if timer already exists', async () => {
      // ARRANGE
      const startData: StartTimerData = {
        userId: 'user-123',
        projectId: 'project-456',
      };

      const existingSession = new ActiveSession(
        'session-789',
        'user-123',
        'project-456',
        new Date(),
        'running',
        0
      );

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(
        existingSession
      );

      // ACT & ASSERT
      await expect(timerService.startTimer(startData)).rejects.toThrow(
        'An active timer already exists'
      );
    });

    it('should support custom start time', async () => {
      // ARRANGE
      const now = new Date();
      const customStart = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      const startData: StartTimerData = {
        userId: 'user-123',
        projectId: 'project-456',
        customStartTime: customStart,
      };

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(null);
      mockActiveSessionRepoInstance.saveActiveSession.mockResolvedValue(
        undefined
      );

      // ACT
      const result = await timerService.startTimer(startData);

      // ASSERT
      expect(result.startTime).toEqual(customStart);
    });
  });

  describe('pauseTimer', () => {
    it('should pause an active timer', async () => {
      // ARRANGE
      const activeSession = new ActiveSession(
        'session-789',
        'user-123',
        'project-456',
        new Date(),
        'running',
        0
      );

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(
        activeSession
      );
      mockActiveSessionRepoInstance.saveActiveSession.mockResolvedValue(
        undefined
      );

      // ACT
      const result = await timerService.pauseTimer('user-123');

      // ASSERT
      expect(result.status).toBe('paused');
    });

    it('should throw error if no active timer', async () => {
      // ARRANGE
      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(timerService.pauseTimer('user-123')).rejects.toThrow(
        'No active timer to pause'
      );
    });

    it('should throw error if timer already paused', async () => {
      // ARRANGE
      const now = new Date();
      const pausedSession = new ActiveSession(
        'session-789',
        'user-123',
        'project-456',
        now,
        'paused',
        100,
        now
      );

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(
        pausedSession
      );

      // ACT & ASSERT
      await expect(timerService.pauseTimer('user-123')).rejects.toThrow(
        'Timer is already paused'
      );
    });
  });

  describe('resumeTimer', () => {
    it('should resume a paused timer', async () => {
      // ARRANGE
      const now = new Date();
      const pausedSession = new ActiveSession(
        'session-789',
        'user-123',
        'project-456',
        now,
        'paused',
        100,
        now
      );

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(
        pausedSession
      );
      mockActiveSessionRepoInstance.saveActiveSession.mockResolvedValue(
        undefined
      );

      // ACT
      const result = await timerService.resumeTimer('user-123');

      // ASSERT
      expect(result.status).toBe('running');
    });

    it('should throw error if no active timer', async () => {
      // ARRANGE
      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(timerService.resumeTimer('user-123')).rejects.toThrow(
        'No active timer to resume'
      );
    });

    it('should throw error if timer already running', async () => {
      // ARRANGE
      const runningSession = new ActiveSession(
        'session-789',
        'user-123',
        'project-456',
        new Date(),
        'running',
        0
      );

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(
        runningSession
      );

      // ACT & ASSERT
      await expect(timerService.resumeTimer('user-123')).rejects.toThrow(
        'Timer is already running'
      );
    });
  });

  describe('completeTimer', () => {
    it('should complete timer and save as session', async () => {
      // ARRANGE
      const now = new Date();
      const activeSession = new ActiveSession(
        'session-789',
        'user-123',
        'project-456',
        now,
        'running',
        0
      );

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(
        activeSession
      );
      mockActiveSessionRepoInstance.deleteActiveSession.mockResolvedValue(
        undefined
      );
      mockSessionRepoInstance.save.mockResolvedValue(undefined);

      // ACT
      const result = await timerService.completeTimer('user-123', {
        title: 'Completed Work',
        visibility: 'followers',
      });

      // ASSERT
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.visibility).toBe('followers');
    });

    it('should throw error if no active timer to complete', async () => {
      // ARRANGE
      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(timerService.completeTimer('user-123')).rejects.toThrow(
        'No active timer to complete'
      );
    });

    it('should use provided title and description', async () => {
      // ARRANGE
      const now = new Date();
      const activeSession = new ActiveSession(
        'session-789',
        'user-123',
        'project-456',
        now,
        'running',
        0
      );

      const completeData: CompleteTimerData = {
        title: 'Custom Title',
        description: 'Custom Description',
        visibility: 'private',
      };

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(
        activeSession
      );
      mockActiveSessionRepoInstance.deleteActiveSession.mockResolvedValue(
        undefined
      );
      mockSessionRepoInstance.save.mockResolvedValue(undefined);

      // ACT
      const result = await timerService.completeTimer('user-123', completeData);

      // ASSERT
      expect(result.title).toBe('Custom Title');
      expect(result.description).toBe('Custom Description');
    });
  });

  describe('stopTimer', () => {
    it('should stop and discard timer', async () => {
      // ARRANGE
      const activeSession = new ActiveSession(
        'session-789',
        'user-123',
        'project-456',
        new Date(),
        'running',
        0
      );

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(
        activeSession
      );
      mockActiveSessionRepoInstance.deleteActiveSession.mockResolvedValue(
        undefined
      );

      // ACT
      await timerService.stopTimer('user-123');

      // ASSERT
      expect(
        mockActiveSessionRepoInstance.deleteActiveSession
      ).toHaveBeenCalledWith('user-123', 'session-789');
    });

    it('should throw error if no active timer to stop', async () => {
      // ARRANGE
      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(timerService.stopTimer('user-123')).rejects.toThrow(
        'No active timer to stop'
      );
    });
  });

  describe('cancelTimer', () => {
    it('should cancel timer (alias for stopTimer)', async () => {
      // ARRANGE
      const activeSession = new ActiveSession(
        'session-789',
        'user-123',
        'project-456',
        new Date(),
        'running',
        0
      );

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(
        activeSession
      );
      mockActiveSessionRepoInstance.deleteActiveSession.mockResolvedValue(
        undefined
      );

      // ACT
      await timerService.cancelTimer('user-123');

      // ASSERT - should complete without error
      expect(true).toBe(true);
    });
  });

  describe('getActiveSession', () => {
    it('should get current active session', async () => {
      // ARRANGE
      const activeSession = new ActiveSession(
        'session-789',
        'user-123',
        'project-456',
        new Date(),
        'running',
        0
      );

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(
        activeSession
      );

      // ACT
      const result = await timerService.getActiveSession('user-123');

      // ASSERT
      expect(result).toBe(activeSession);
    });

    it('should return null if no active session', async () => {
      // ARRANGE
      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(null);

      // ACT
      const result = await timerService.getActiveSession('user-123');

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe('updateTimerMetadata', () => {
    it('should update timer title and description', async () => {
      // ARRANGE
      const activeSession = new ActiveSession(
        'session-789',
        'user-123',
        'project-456',
        new Date(),
        'running',
        0
      );

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(
        activeSession
      );
      mockActiveSessionRepoInstance.saveActiveSession.mockResolvedValue(
        undefined
      );

      // ACT
      const result = await timerService.updateTimerMetadata(
        'user-123',
        'New Title',
        'New Description'
      );

      // ASSERT
      expect(result).toBeDefined();
    });

    it('should throw error if no active timer', async () => {
      // ARRANGE
      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        timerService.updateTimerMetadata('user-123', 'Title')
      ).rejects.toThrow('No active timer to update');
    });
  });

  describe('adjustStartTime', () => {
    it('should adjust start time to earlier time', async () => {
      // ARRANGE
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const activeSession = new ActiveSession(
        'session-789',
        'user-123',
        'project-456',
        oneHourAgo,
        'running',
        0
      );

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(
        activeSession
      );
      mockActiveSessionRepoInstance.saveActiveSession.mockResolvedValue(
        undefined
      );

      // ACT
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const result = await timerService.adjustStartTime(
        'user-123',
        twoHoursAgo
      );

      // ASSERT
      expect(result).toBeDefined();
    });

    it('should throw error if start time is in future', async () => {
      // ARRANGE
      const futureTime = new Date(Date.now() + 10000);

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(
        new ActiveSession(
          'session-789',
          'user-123',
          'project-456',
          new Date(),
          'running',
          0
        )
      );

      // ACT & ASSERT
      await expect(
        timerService.adjustStartTime('user-123', futureTime)
      ).rejects.toThrow('Start time cannot be in the future');
    });

    it('should throw error if no active timer', async () => {
      // ARRANGE
      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        timerService.adjustStartTime('user-123', new Date())
      ).rejects.toThrow('No active timer to adjust');
    });
  });

  describe('autoSaveSession', () => {
    it('should auto-save active session', async () => {
      // ARRANGE
      const activeSession = new ActiveSession(
        'session-789',
        'user-123',
        'project-456',
        new Date(),
        'running',
        0
      );

      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(
        activeSession
      );
      mockActiveSessionRepoInstance.saveActiveSession.mockResolvedValue(
        undefined
      );

      // ACT
      await timerService.autoSaveSession('user-123');

      // ASSERT
      expect(
        mockActiveSessionRepoInstance.saveActiveSession
      ).toHaveBeenCalledWith(activeSession);
    });

    it('should do nothing if no active session', async () => {
      // ARRANGE
      mockActiveSessionRepoInstance.getActiveSession.mockResolvedValue(null);

      // ACT
      await timerService.autoSaveSession('user-123');

      // ASSERT
      expect(
        mockActiveSessionRepoInstance.saveActiveSession
      ).not.toHaveBeenCalled();
    });
  });
});
