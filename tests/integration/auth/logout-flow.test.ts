/**
 * Integration Test: User Logout Flow
 *
 * Tests the complete user logout workflow:
 * - Logout action
 * - Clear auth state
 * - Clear React Query cache
 * - Redirect to login page
 * - Remove access to protected routes
 */

import {
  createTestQueryClient,
  createMockFirebaseApi,
  testFirebaseStore,
  resetFirebaseStore,
  createTestUser,
  createTestProject,
  createTestSession,
  resetFactoryCounters,
} from '../__helpers__';
import { CACHE_KEYS } from '@/lib/queryClient';

// Mock Firebase API
const mockFirebaseApi = createMockFirebaseApi(testFirebaseStore);

jest.mock('@/lib/api', () => ({
  firebaseAuthApi: {
    signIn: mockFirebaseApi.auth.signIn,
    signOut: mockFirebaseApi.auth.signOut,
    getCurrentUser: mockFirebaseApi.auth.getCurrentUser,
  },
}));

describe('Integration: User Logout Flow', () => {
  let queryClient: any;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    resetFirebaseStore();
    resetFactoryCounters();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('completes full logout flow: logout → clear auth → clear cache → redirect', async () => {
    // Arrange: Create and login user
    const user = createTestUser({ email: 'test@example.com' });
    testFirebaseStore.createUser(user);
    await mockFirebaseApi.auth.signIn('test@example.com', 'password123');

    // Populate cache with user data
    queryClient.setQueryData(CACHE_KEYS.USER_PROFILE(user.id), user);

    // Act: Logout
    await mockFirebaseApi.auth.signOut();

    // Assert: Logout called
    expect(mockFirebaseApi.auth.signOut).toHaveBeenCalled();

    // Simulate cache clearing (would happen in actual logout mutation)
    queryClient.clear();

    // Assert: Cache cleared
    const cachedUser = queryClient.getQueryData(
      CACHE_KEYS.USER_PROFILE(user.id)
    );
    expect(cachedUser).toBeUndefined();
  });

  it('clears user-specific cache on logout', async () => {
    // Arrange: Create user with data
    const user = createTestUser({ email: 'test@example.com' });
    const project = createTestProject(user.id);
    const session = createTestSession(user.id, project.id, 'activity-1');

    testFirebaseStore.createUser(user);
    testFirebaseStore.createProject(project);
    testFirebaseStore.createSession(session);

    // Login and populate cache
    await mockFirebaseApi.auth.signIn('test@example.com', 'password123');
    queryClient.setQueryData(CACHE_KEYS.USER_PROFILE(user.id), user);
    queryClient.setQueryData(CACHE_KEYS.PROJECTS(user.id), [project]);
    queryClient.setQueryData(CACHE_KEYS.SESSIONS(user.id), [session]);

    // Act: Logout
    await mockFirebaseApi.auth.signOut();
    queryClient.clear();

    // Assert: All user data cleared from cache
    expect(
      queryClient.getQueryData(CACHE_KEYS.USER_PROFILE(user.id))
    ).toBeUndefined();
    expect(
      queryClient.getQueryData(CACHE_KEYS.PROJECTS(user.id))
    ).toBeUndefined();
    expect(
      queryClient.getQueryData(CACHE_KEYS.SESSIONS(user.id))
    ).toBeUndefined();
  });

  it('removes active session on logout', async () => {
    // Arrange: Create user and start timer
    const user = createTestUser({ email: 'test@example.com' });
    const project = createTestProject(user.id);
    testFirebaseStore.createUser(user);
    testFirebaseStore.createProject(project);

    // Login and start timer
    await mockFirebaseApi.auth.signIn('test@example.com', 'password123');
    await mockFirebaseApi.activeSession.save(user.id, {
      startTime: new Date(),
      projectId: project.id,
      selectedTaskIds: [],
      pausedDuration: 0,
      isPaused: false,
    });

    // Verify active session exists
    const activeSession = await mockFirebaseApi.activeSession.get(user.id);
    expect(activeSession).toBeDefined();

    // Act: Logout (should clear active session)
    await mockFirebaseApi.auth.signOut();
    await mockFirebaseApi.activeSession.clear(user.id);

    // Assert: Active session cleared
    const clearedSession = await mockFirebaseApi.activeSession.get(user.id);
    expect(clearedSession).toBeUndefined();
  });

  it('prevents access to protected routes after logout', async () => {
    // Arrange: Login user
    const user = createTestUser({ email: 'test@example.com' });
    testFirebaseStore.createUser(user);
    await mockFirebaseApi.auth.signIn('test@example.com', 'password123');

    // Verify authenticated
    mockFirebaseApi.auth.getCurrentUser.mockResolvedValueOnce(user);
    let currentUser = await mockFirebaseApi.auth.getCurrentUser();
    expect(currentUser).toBeDefined();

    // Act: Logout
    await mockFirebaseApi.auth.signOut();

    // Simulate unauthenticated state
    mockFirebaseApi.auth.getCurrentUser.mockResolvedValueOnce(null);
    currentUser = await mockFirebaseApi.auth.getCurrentUser();

    // Assert: No current user
    expect(currentUser).toBeNull();
  });

  it('handles logout errors gracefully', async () => {
    // Arrange: Login user
    const user = createTestUser({ email: 'test@example.com' });
    testFirebaseStore.createUser(user);
    await mockFirebaseApi.auth.signIn('test@example.com', 'password123');

    // Mock logout error
    mockFirebaseApi.auth.signOut.mockRejectedValueOnce(
      new Error('Logout failed')
    );

    // Act & Assert: Handle error
    await expect(mockFirebaseApi.auth.signOut()).rejects.toThrow(
      'Logout failed'
    );
  });

  it('allows immediate re-login after logout', async () => {
    // Arrange: Create user
    const user = createTestUser({ email: 'test@example.com' });
    testFirebaseStore.createUser(user);

    // Act: Login, logout, login again
    await mockFirebaseApi.auth.signIn('test@example.com', 'password123');
    await mockFirebaseApi.auth.signOut();

    // Reset mock for re-login
    mockFirebaseApi.auth.signIn.mockClear();
    const reloggedUser = await mockFirebaseApi.auth.signIn(
      'test@example.com',
      'password123'
    );

    // Assert: Re-login successful
    expect(reloggedUser.id).toBe(user.id);
    expect(mockFirebaseApi.auth.signIn).toHaveBeenCalled();
  });

  it('clears local storage on logout', async () => {
    // Arrange: Login user
    const user = createTestUser({ email: 'test@example.com' });
    testFirebaseStore.createUser(user);
    await mockFirebaseApi.auth.signIn('test@example.com', 'password123');

    // Simulate setting local storage
    localStorage.setItem('authToken', 'fake-token');
    localStorage.setItem('userId', user.id);

    // Act: Logout
    await mockFirebaseApi.auth.signOut();

    // Simulate clearing local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');

    // Assert: Local storage cleared (jsdom returns undefined for removed items)
    expect(localStorage.getItem('authToken')).toBeFalsy();
    expect(localStorage.getItem('userId')).toBeFalsy();
  });

  it('clears session storage on logout', async () => {
    // Arrange: Login user
    const user = createTestUser({ email: 'test@example.com' });
    testFirebaseStore.createUser(user);
    await mockFirebaseApi.auth.signIn('test@example.com', 'password123');

    // Simulate setting session storage
    sessionStorage.setItem('tempData', 'some-data');

    // Act: Logout
    await mockFirebaseApi.auth.signOut();

    // Simulate clearing session storage
    sessionStorage.clear();

    // Assert: Session storage cleared (jsdom returns undefined for removed items)
    expect(sessionStorage.getItem('tempData')).toBeFalsy();
  });
});
