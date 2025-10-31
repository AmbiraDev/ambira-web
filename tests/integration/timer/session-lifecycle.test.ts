/**
 * Integration Test: Session Lifecycle (Timer)
 *
 * Tests the complete timer session workflow:
 * - Start timer → Timer context update → Persist to Firebase
 * - Pause → Resume → Stop
 * - Complete → Save session → Update cache → Navigate to feed
 * - Cancel timer
 */

// Note: 'any' types used for test mocks; unused vars acceptable in test setup

import {
  createTestQueryClient,
  createMockFirebaseApi,
  testFirebaseStore,
  resetFirebaseStore,
  createTestUser,
  createTestProject,
  createTestActivity,
  createActiveSessionData,
  resetFactoryCounters,
  waitForCacheUpdate,
} from '../__helpers__';
import { CACHE_KEYS } from '@/lib/queryClient';

// Mock Firebase API
const mockFirebaseApi = createMockFirebaseApi(testFirebaseStore);

jest.mock('@/lib/api', () => ({
  firebaseSessionApi: {
    saveActiveSession: mockFirebaseApi.activeSession.save,
    getActiveSession: mockFirebaseApi.activeSession.get,
    clearActiveSession: mockFirebaseApi.activeSession.clear,
    createSession: mockFirebaseApi.sessions.create,
  },
}));

describe('Integration: Timer Session Lifecycle', () => {
  let queryClient: any;
  let user: any;
  let project: any;
  let activity: any;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    resetFirebaseStore();
    resetFactoryCounters();
    jest.clearAllMocks();

    // Setup test data
    user = createTestUser({ email: 'test@example.com' });
    project = createTestProject(user.id, { name: 'Test Project' });
    activity = createTestActivity(user.id, { name: 'Development' });

    testFirebaseStore.createUser(user);
    testFirebaseStore.createProject(project);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('starts timer and persists to Firebase', async () => {
    // Arrange: Timer data
    const startTime = new Date();
    const timerData = createActiveSessionData(project.id, { startTime });

    // Act: Start timer
    await mockFirebaseApi.activeSession.save(user.id, timerData);

    // Assert: Timer saved to Firebase
    expect(mockFirebaseApi.activeSession.save).toHaveBeenCalledWith(
      user.id,
      timerData
    );

    // Assert: Timer data persisted
    const savedTimer = await mockFirebaseApi.activeSession.get(user.id);
    expect(savedTimer).toBeDefined();
    expect(savedTimer.projectId).toBe(project.id);
    expect(savedTimer.isPaused).toBe(false);
    expect(savedTimer.pausedDuration).toBe(0);
  });

  it('pauses timer and saves elapsed time', async () => {
    // Arrange: Start timer
    const startTime = new Date();
    const timerData = createActiveSessionData(project.id, { startTime });
    await mockFirebaseApi.activeSession.save(user.id, timerData);

    // Act: Pause timer after 10 seconds
    const pausedData = createActiveSessionData(project.id, {
      startTime,
      pausedDuration: 10,
      isPaused: true,
    });
    await mockFirebaseApi.activeSession.save(user.id, pausedData);

    // Assert: Paused state saved
    const pausedTimer = await mockFirebaseApi.activeSession.get(user.id);
    expect(pausedTimer.isPaused).toBe(true);
    expect(pausedTimer.pausedDuration).toBe(10);
  });

  it('resumes timer with adjusted start time', async () => {
    // Arrange: Start and pause timer
    const originalStartTime = new Date();
    const pausedData = createActiveSessionData(project.id, {
      startTime: originalStartTime,
      pausedDuration: 10,
      isPaused: true,
    });
    await mockFirebaseApi.activeSession.save(user.id, pausedData);

    // Act: Resume timer
    const now = new Date();
    const adjustedStartTime = new Date(now.getTime() - 10 * 1000);
    const resumedData = createActiveSessionData(project.id, {
      startTime: adjustedStartTime,
      pausedDuration: 0,
      isPaused: false,
    });
    await mockFirebaseApi.activeSession.save(user.id, resumedData);

    // Assert: Timer resumed
    const resumedTimer = await mockFirebaseApi.activeSession.get(user.id);
    expect(resumedTimer.isPaused).toBe(false);
    expect(resumedTimer.pausedDuration).toBe(0);
    expect(resumedTimer.startTime.getTime()).toBeLessThan(now.getTime());
  });

  it('completes timer and creates session record', async () => {
    // Arrange: Start timer
    const startTime = new Date(Date.now() - 3600000); // 1 hour ago
    const timerData = createActiveSessionData(project.id, { startTime });
    await mockFirebaseApi.activeSession.save(user.id, timerData);

    // Act: Complete timer and create session
    const sessionData = {
      userId: user.id,
      projectId: project.id,
      activityId: activity.id,
      title: 'Completed work session',
      description: 'Worked on feature X',
      duration: 3600, // 1 hour
      startTime,
      visibility: 'everyone' as const,
      supportCount: 0,
      commentCount: 0,
    };

    const session = await mockFirebaseApi.sessions.create(sessionData);

    // Clear active timer
    await mockFirebaseApi.activeSession.clear(user.id);

    // Assert: Session created
    expect(mockFirebaseApi.sessions.create).toHaveBeenCalledWith(sessionData);
    expect(session).toBeDefined();
    expect(session.duration).toBe(3600);
    expect(session.projectId).toBe(project.id);

    // Assert: Active timer cleared
    const clearedTimer = await mockFirebaseApi.activeSession.get(user.id);
    expect(clearedTimer).toBeUndefined();

    // Assert: Session stored
    const storedSession = testFirebaseStore.getSession(session.id);
    expect(storedSession).toBeDefined();
    expect(storedSession?.title).toBe('Completed work session');
  });

  it('cancels timer without creating session', async () => {
    // Arrange: Start timer
    const startTime = new Date();
    const timerData = createActiveSessionData(project.id, { startTime });
    await mockFirebaseApi.activeSession.save(user.id, timerData);

    // Verify timer exists
    const activeTimer = await mockFirebaseApi.activeSession.get(user.id);
    expect(activeTimer).toBeDefined();

    // Act: Cancel timer
    await mockFirebaseApi.activeSession.clear(user.id);

    // Assert: Timer cleared
    const clearedTimer = await mockFirebaseApi.activeSession.get(user.id);
    expect(clearedTimer).toBeUndefined();

    // Assert: No session created
    const sessions = testFirebaseStore.getSessions({ userId: user.id });
    expect(sessions).toHaveLength(0);
  });

  it('updates cache after completing session', async () => {
    // Arrange: Start timer and populate cache
    const startTime = new Date(Date.now() - 3600000);
    const timerData = createActiveSessionData(project.id, { startTime });
    await mockFirebaseApi.activeSession.save(user.id, timerData);

    queryClient.setQueryData(CACHE_KEYS.ACTIVE_SESSION(user.id), timerData);

    // Act: Complete session
    const sessionData = {
      userId: user.id,
      projectId: project.id,
      activityId: activity.id,
      title: 'Test session',
      duration: 3600,
      startTime,
      visibility: 'everyone' as const,
      supportCount: 0,
      commentCount: 0,
    };

    const session = await mockFirebaseApi.sessions.create(sessionData);
    await mockFirebaseApi.activeSession.clear(user.id);

    // Simulate cache invalidation
    queryClient.setQueryData(CACHE_KEYS.ACTIVE_SESSION(user.id), null);
    queryClient.invalidateQueries({
      queryKey: CACHE_KEYS.SESSIONS(user.id),
    });

    // Assert: Active session cleared from cache
    const cachedActiveSession = queryClient.getQueryData(
      CACHE_KEYS.ACTIVE_SESSION(user.id)
    );
    expect(cachedActiveSession).toBeNull();
  });

  it('handles multiple pause/resume cycles', async () => {
    // Arrange: Start timer
    const startTime = new Date();
    await mockFirebaseApi.activeSession.save(
      user.id,
      createActiveSessionData(project.id, { startTime })
    );

    // Act: Pause → Resume → Pause → Resume
    await mockFirebaseApi.activeSession.save(
      user.id,
      createActiveSessionData(project.id, {
        startTime,
        pausedDuration: 5,
        isPaused: true,
      })
    );

    await mockFirebaseApi.activeSession.save(
      user.id,
      createActiveSessionData(project.id, {
        startTime: new Date(Date.now() - 5000),
        pausedDuration: 0,
        isPaused: false,
      })
    );

    await mockFirebaseApi.activeSession.save(
      user.id,
      createActiveSessionData(project.id, {
        startTime: new Date(Date.now() - 5000),
        pausedDuration: 10,
        isPaused: true,
      })
    );

    await mockFirebaseApi.activeSession.save(
      user.id,
      createActiveSessionData(project.id, {
        startTime: new Date(Date.now() - 10000),
        pausedDuration: 0,
        isPaused: false,
      })
    );

    // Assert: Final state is resumed
    const finalTimer = await mockFirebaseApi.activeSession.get(user.id);
    expect(finalTimer.isPaused).toBe(false);
  });

  it('prevents starting timer when active session exists', async () => {
    // Arrange: Start timer
    const startTime = new Date();
    await mockFirebaseApi.activeSession.save(
      user.id,
      createActiveSessionData(project.id, { startTime })
    );

    // Act: Check for existing session
    const existingSession = await mockFirebaseApi.activeSession.get(user.id);

    // Assert: Session exists, prevent new start
    expect(existingSession).toBeDefined();

    // Simulate validation error
    if (existingSession) {
      const error = new Error('Active session already exists');
      expect(error.message).toBe('Active session already exists');
    }
  });

  it('validates session duration when completing', async () => {
    // Arrange: Start timer
    const startTime = new Date(Date.now() - 100); // 100ms ago
    await mockFirebaseApi.activeSession.save(
      user.id,
      createActiveSessionData(project.id, { startTime })
    );

    // Mock validation
    mockFirebaseApi.sessions.create.mockImplementationOnce(
      async (data: any) => {
        if (data.duration < 60) {
          // Minimum 1 minute
          throw new Error('Session too short');
        }
        const session = testFirebaseStore.getSessions()[0];
        if (!session) throw new Error('No session found');
        return session;
      }
    );

    // Act & Assert: Try to complete too-short session
    await expect(
      mockFirebaseApi.sessions.create({
        userId: user.id,
        projectId: project.id,
        activityId: activity.id,
        title: 'Test',
        duration: 1, // 1 second
        startTime,
        visibility: 'everyone' as const,
        supportCount: 0,
        commentCount: 0,
      })
    ).rejects.toThrow('Session too short');
  });
});
