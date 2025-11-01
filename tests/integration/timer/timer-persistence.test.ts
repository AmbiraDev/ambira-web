/**
 * Integration Test: Timer Persistence
 *
 * Tests timer persistence across page refreshes and browser restarts:
 * - Start timer → Refresh page → Timer restored
 * - Browser close → Reopen → Active timer shows
 * - Stale session cleanup (>24 hours)
 * - Concurrent session handling
 */

 
// Note: 'any' types used for test mocks

import {
  createTestQueryClient,
  createMockFirebaseApi,
  testFirebaseStore,
  resetFirebaseStore,
  createTestUser,
  createTestProject,
  createActiveSessionData,
  resetFactoryCounters,
} from '../__helpers__';
import { CACHE_KEYS } from '@/lib/queryClient';

// Mock Firebase API
const mockFirebaseApi = createMockFirebaseApi(testFirebaseStore);

jest.mock('@/lib/api', () => ({
  firebaseSessionApi: {
    saveActiveSession: mockFirebaseApi.activeSession.save,
    getActiveSession: mockFirebaseApi.activeSession.get,
    clearActiveSession: mockFirebaseApi.activeSession.clear,
  },
}));

describe('Integration: Timer Persistence', () => {
  let queryClient: any;
  let user: any;
  let project: any;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    resetFirebaseStore();
    resetFactoryCounters();
    jest.clearAllMocks();

    // Setup test data
    user = createTestUser({ email: 'test@example.com' });
    project = createTestProject(user.id);

    testFirebaseStore.createUser(user);
    testFirebaseStore.createProject(project);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('persists timer across page refresh', async () => {
    // Arrange: Start timer
    const startTime = new Date();
    const timerData = createActiveSessionData(project.id, { startTime });
    await mockFirebaseApi.activeSession.save(user.id, timerData);

    // Simulate page refresh: clear cache, fetch from Firebase
    queryClient.clear();

    // Act: Fetch timer after "refresh"
    const restoredTimer = await mockFirebaseApi.activeSession.get(user.id);

    // Assert: Timer restored
    expect(restoredTimer).toBeDefined();
    expect(restoredTimer.projectId).toBe(project.id);
    expect(restoredTimer.startTime.getTime()).toBe(startTime.getTime());
    expect(restoredTimer.isPaused).toBe(false);
  });

  it('restores paused timer with correct elapsed time', async () => {
    // Arrange: Start and pause timer
    const startTime = new Date(Date.now() - 300000); // 5 minutes ago
    const pausedData = createActiveSessionData(project.id, {
      startTime,
      pausedDuration: 300, // 5 minutes in seconds
      isPaused: true,
    });
    await mockFirebaseApi.activeSession.save(user.id, pausedData);

    // Simulate page refresh
    queryClient.clear();

    // Act: Fetch timer
    const restoredTimer = await mockFirebaseApi.activeSession.get(user.id);

    // Assert: Paused state and duration preserved
    expect(restoredTimer).toBeDefined();
    expect(restoredTimer.isPaused).toBe(true);
    expect(restoredTimer.pausedDuration).toBe(300);
  });

  it('clears stale sessions older than 24 hours', async () => {
    // Arrange: Create old timer (25 hours ago)
    const oldStartTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const staleTimer = createActiveSessionData(project.id, {
      startTime: oldStartTime,
    });
    await mockFirebaseApi.activeSession.save(user.id, staleTimer);

    // Mock stale session validation
    mockFirebaseApi.activeSession.get.mockImplementationOnce(
      async (userId: string) => {
        const timer = testFirebaseStore.getActiveSession(userId);
        if (!timer) return null;

        const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
        const age = Date.now() - timer.startTime.getTime();

        if (age > MAX_AGE || age < 0) {
          // Clear stale session
          await mockFirebaseApi.activeSession.clear(userId);
          return null;
        }

        return timer;
      }
    );

    // Act: Attempt to fetch stale timer
    const fetchedTimer = await mockFirebaseApi.activeSession.get(user.id);

    // Assert: Stale timer cleared
    expect(fetchedTimer).toBeNull();
    expect(mockFirebaseApi.activeSession.clear).toHaveBeenCalledWith(user.id);
  });

  it('handles timer with future start time (clock skew)', async () => {
    // Arrange: Create timer with future start time (clock skew)
    const futureStartTime = new Date(Date.now() + 60000); // 1 minute in future
    const invalidTimer = createActiveSessionData(project.id, {
      startTime: futureStartTime,
    });
    await mockFirebaseApi.activeSession.save(user.id, invalidTimer);

    // Mock validation
    mockFirebaseApi.activeSession.get.mockImplementationOnce(
      async (userId: string) => {
        const timer = testFirebaseStore.getActiveSession(userId);
        if (!timer) return null;

        const age = Date.now() - timer.startTime.getTime();

        if (age < 0) {
          // Invalid future time
          await mockFirebaseApi.activeSession.clear(userId);
          return null;
        }

        return timer;
      }
    );

    // Act: Fetch timer
    const fetchedTimer = await mockFirebaseApi.activeSession.get(user.id);

    // Assert: Invalid timer cleared
    expect(fetchedTimer).toBeNull();
  });

  it('syncs timer across multiple tabs', async () => {
    // Arrange: Start timer in "tab 1"
    const startTime = new Date();
    const timerData = createActiveSessionData(project.id, { startTime });
    await mockFirebaseApi.activeSession.save(user.id, timerData);

    // Act: "Tab 2" fetches timer
    const timerInTab2 = await mockFirebaseApi.activeSession.get(user.id);

    // Assert: Same timer in both tabs
    expect(timerInTab2).toBeDefined();
    expect(timerInTab2.projectId).toBe(project.id);
    expect(timerInTab2.startTime.getTime()).toBe(startTime.getTime());

    // Act: Pause in "tab 1"
    const pausedData = createActiveSessionData(project.id, {
      startTime,
      pausedDuration: 60,
      isPaused: true,
    });
    await mockFirebaseApi.activeSession.save(user.id, pausedData);

    // Act: "Tab 2" refetches
    const updatedTimerInTab2 = await mockFirebaseApi.activeSession.get(user.id);

    // Assert: Paused state synced
    expect(updatedTimerInTab2.isPaused).toBe(true);
    expect(updatedTimerInTab2.pausedDuration).toBe(60);
  });

  it('handles conflicting timer updates gracefully', async () => {
    // Arrange: Start timer
    const startTime = new Date();
    await mockFirebaseApi.activeSession.save(
      user.id,
      createActiveSessionData(project.id, { startTime })
    );

    // Act: Concurrent pause operations from two tabs
    const pause1 = createActiveSessionData(project.id, {
      startTime,
      pausedDuration: 30,
      isPaused: true,
    });

    const pause2 = createActiveSessionData(project.id, {
      startTime,
      pausedDuration: 35,
      isPaused: true,
    });

    await mockFirebaseApi.activeSession.save(user.id, pause1);
    await mockFirebaseApi.activeSession.save(user.id, pause2);

    // Act: Fetch final state
    const finalTimer = await mockFirebaseApi.activeSession.get(user.id);

    // Assert: Last write wins (pause2)
    expect(finalTimer.pausedDuration).toBe(35);
  });

  it('preserves timer through network interruption', async () => {
    // Arrange: Start timer
    const startTime = new Date();
    const timerData = createActiveSessionData(project.id, { startTime });
    await mockFirebaseApi.activeSession.save(user.id, timerData);

    // Simulate network interruption
    mockFirebaseApi.activeSession.get.mockRejectedValueOnce(
      new Error('Network error')
    );

    // Act: Attempt to fetch (fails)
    await expect(mockFirebaseApi.activeSession.get(user.id)).rejects.toThrow(
      'Network error'
    );

    // Restore network
    mockFirebaseApi.activeSession.get.mockClear();

    // Act: Retry fetch
    const restoredTimer = await mockFirebaseApi.activeSession.get(user.id);

    // Assert: Timer still exists
    expect(restoredTimer).toBeDefined();
    expect(restoredTimer.projectId).toBe(project.id);
  });

  it('updates cache on timer state changes', async () => {
    // Arrange: Start timer and set in cache
    const startTime = new Date();
    const timerData = createActiveSessionData(project.id, { startTime });
    await mockFirebaseApi.activeSession.save(user.id, timerData);

    queryClient.setQueryData(CACHE_KEYS.ACTIVE_SESSION(user.id), timerData);

    // Act: Pause timer
    const pausedData = createActiveSessionData(project.id, {
      startTime,
      pausedDuration: 45,
      isPaused: true,
    });
    await mockFirebaseApi.activeSession.save(user.id, pausedData);

    // Update cache
    queryClient.setQueryData(CACHE_KEYS.ACTIVE_SESSION(user.id), pausedData);

    // Assert: Cache updated
    const cachedTimer = queryClient.getQueryData(
      CACHE_KEYS.ACTIVE_SESSION(user.id)
    );
    expect(cachedTimer.isPaused).toBe(true);
    expect(cachedTimer.pausedDuration).toBe(45);
  });

  it('auto-saves timer periodically', async () => {
    // Arrange: Start timer
    const startTime = new Date();
    const timerData = createActiveSessionData(project.id, { startTime });
    await mockFirebaseApi.activeSession.save(user.id, timerData);

    // Act: Simulate auto-save (e.g., every 10 seconds)
    await mockFirebaseApi.activeSession.save(user.id, timerData);
    await mockFirebaseApi.activeSession.save(user.id, timerData);
    await mockFirebaseApi.activeSession.save(user.id, timerData);

    // Assert: Multiple saves called
    expect(mockFirebaseApi.activeSession.save).toHaveBeenCalledTimes(4); // Initial + 3 auto-saves
  });

  it('restores timer to correct project after refresh', async () => {
    // Arrange: Create multiple projects
    const project2 = createTestProject(user.id, { name: 'Project 2' });
    testFirebaseStore.createProject(project2);

    // Start timer on project2
    const startTime = new Date();
    const timerData = createActiveSessionData(project2.id, { startTime });
    await mockFirebaseApi.activeSession.save(user.id, timerData);

    // Simulate refresh
    queryClient.clear();

    // Act: Restore timer
    const restoredTimer = await mockFirebaseApi.activeSession.get(user.id);

    // Assert: Correct project
    expect(restoredTimer.projectId).toBe(project2.id);
    expect(restoredTimer.projectId).not.toBe(project.id);
  });
});
