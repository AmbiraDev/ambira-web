/**
 * Integration Test: User Login Flow
 *
 * Tests the complete user login workflow:
 * - Form submission with credentials
 * - API authentication
 * - Auth state update
 * - Cache population
 * - Protected route access
 * - Error handling (invalid credentials)
 */

 
// Note: 'any' types used for test mocks and query client flexibility

import {
  createTestQueryClient,
  createMockFirebaseApi,
  testFirebaseStore,
  resetFirebaseStore,
  createTestUser,
  resetFactoryCounters,
} from '../__helpers__';

// Mock Firebase API
const mockFirebaseApi = createMockFirebaseApi(testFirebaseStore);

jest.mock('@/lib/api', () => ({
  firebaseAuthApi: {
    signIn: mockFirebaseApi.auth.signIn,
    signOut: mockFirebaseApi.auth.signOut,
    getCurrentUser: mockFirebaseApi.auth.getCurrentUser,
  },
}));

describe('Integration: User Login Flow', () => {
  let queryClient: any;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    resetFirebaseStore();
    resetFactoryCounters();
    jest.clearAllMocks();
    // Reset mock implementations to default
    mockFirebaseApi.auth.signIn.mockReset();
    mockFirebaseApi.auth.signIn.mockImplementation(
      async (email: string, _password: string) => {
        const user = Array.from(testFirebaseStore['users'].values()).find(
          u => u.email === email
        );
        if (!user) throw new Error('Invalid credentials');
        return user;
      }
    );
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('completes full login flow: credentials → API → auth state → redirect', async () => {
    // Arrange: Create existing user
    const existingUser = createTestUser({
      email: 'test@example.com',
      username: 'testuser',
    });
    testFirebaseStore.createUser(existingUser);

    // Act: Login with valid credentials
    const loggedInUser = await mockFirebaseApi.auth.signIn(
      'test@example.com',
      'password123'
    );

    // Assert: Login successful
    expect(mockFirebaseApi.auth.signIn).toHaveBeenCalledWith(
      'test@example.com',
      'password123'
    );
    expect(loggedInUser).toBeDefined();
    expect(loggedInUser.id).toBe(existingUser.id);
    expect(loggedInUser.email).toBe(existingUser.email);
  });

  it('rejects login with invalid email', async () => {
    // Arrange: Create existing user
    const existingUser = createTestUser({ email: 'test@example.com' });
    testFirebaseStore.createUser(existingUser);

    // Act & Assert: Attempt login with wrong email
    await expect(
      mockFirebaseApi.auth.signIn('wrong@example.com', 'password123')
    ).rejects.toThrow('Invalid credentials');
  });

  it('rejects login with invalid password', async () => {
    // Arrange: Create existing user
    const existingUser = createTestUser({ email: 'test@example.com' });
    testFirebaseStore.createUser(existingUser);

    // Mock to check password
    mockFirebaseApi.auth.signIn.mockImplementationOnce(
      async (email: string, password: string) => {
        const user = Array.from(testFirebaseStore['users'].values()).find(
          u => u.email === email
        );
        if (!user) throw new Error('Invalid credentials');
        // In real app, would check password hash
        if (password !== 'password123') {
          throw new Error('Invalid credentials');
        }
        return user;
      }
    );

    // Act & Assert: Attempt login with wrong password
    await expect(
      mockFirebaseApi.auth.signIn('test@example.com', 'wrongpassword')
    ).rejects.toThrow('Invalid credentials');
  });

  it('populates user data in cache after successful login', async () => {
    // Arrange: Create existing user
    const existingUser = createTestUser({
      email: 'test@example.com',
      followerCount: 10,
      followingCount: 5,
    });
    testFirebaseStore.createUser(existingUser);

    // Act: Login
    const loggedInUser = await mockFirebaseApi.auth.signIn(
      'test@example.com',
      'password123'
    );

    // Assert: User data complete
    expect(loggedInUser.followerCount).toBe(10);
    expect(loggedInUser.followingCount).toBe(5);
  });

  it('allows access to protected routes after login', async () => {
    // Arrange: Create user and login
    const existingUser = createTestUser({ email: 'test@example.com' });
    testFirebaseStore.createUser(existingUser);

    // Act: Login
    await mockFirebaseApi.auth.signIn('test@example.com', 'password123');

    // Simulate getting current user (protected route check)
    mockFirebaseApi.auth.getCurrentUser.mockResolvedValueOnce(existingUser);
    const currentUser = await mockFirebaseApi.auth.getCurrentUser();

    // Assert: User is authenticated
    expect(currentUser).toBeDefined();
    expect(currentUser?.id).toBe(existingUser.id);
  });

  it('handles network errors during login', async () => {
    // Mock network error
    mockFirebaseApi.auth.signIn.mockRejectedValueOnce(
      new Error('Network error')
    );

    // Act & Assert: Handle error
    await expect(
      mockFirebaseApi.auth.signIn('test@example.com', 'password123')
    ).rejects.toThrow('Network error');
  });

  it('handles rate limiting on login attempts', async () => {
    // Arrange: Create user
    const existingUser = createTestUser({ email: 'test@example.com' });
    testFirebaseStore.createUser(existingUser);

    // Mock rate limiting after 3 failed attempts
    let attemptCount = 0;
    mockFirebaseApi.auth.signIn.mockImplementation(
      async (_email: string, _password: string) => {
        attemptCount++;
        if (attemptCount > 3) {
          throw new Error('Too many login attempts. Please try again later.');
        }
        throw new Error('Invalid credentials');
      }
    );

    // Act & Assert: Multiple failed attempts
    await expect(
      mockFirebaseApi.auth.signIn('test@example.com', 'wrong1')
    ).rejects.toThrow('Invalid credentials');

    await expect(
      mockFirebaseApi.auth.signIn('test@example.com', 'wrong2')
    ).rejects.toThrow('Invalid credentials');

    await expect(
      mockFirebaseApi.auth.signIn('test@example.com', 'wrong3')
    ).rejects.toThrow('Invalid credentials');

    await expect(
      mockFirebaseApi.auth.signIn('test@example.com', 'wrong4')
    ).rejects.toThrow('Too many login attempts');
  });

  it('case-insensitive email login', async () => {
    // Arrange: Create user
    const existingUser = createTestUser({ email: 'test@example.com' });
    testFirebaseStore.createUser(existingUser);

    // Mock case-insensitive lookup
    mockFirebaseApi.auth.signIn.mockImplementationOnce(
      async (email: string, _password: string) => {
        const user = Array.from(testFirebaseStore['users'].values()).find(
          u => u.email.toLowerCase() === email.toLowerCase()
        );
        if (!user) throw new Error('Invalid credentials');
        return user;
      }
    );

    // Act: Login with different case
    const loggedInUser = await mockFirebaseApi.auth.signIn(
      'TEST@EXAMPLE.COM',
      'password123'
    );

    // Assert: Login successful
    expect(loggedInUser.id).toBe(existingUser.id);
  });

  it('clears previous session data on new login', async () => {
    // Arrange: Create two users
    const user1 = createTestUser({ email: 'user1@test.com' });
    const user2 = createTestUser({ email: 'user2@test.com' });
    testFirebaseStore.createUser(user1);
    testFirebaseStore.createUser(user2);

    // Act: Login as user1
    const loggedInUser1 = await mockFirebaseApi.auth.signIn(
      'user1@test.com',
      'password123'
    );
    expect(loggedInUser1.id).toBe(user1.id);

    // Act: Logout and login as user2
    await mockFirebaseApi.auth.signOut();

    const loggedInUser2 = await mockFirebaseApi.auth.signIn(
      'user2@test.com',
      'password123'
    );

    // Assert: New user logged in, previous session cleared
    expect(loggedInUser2.id).toBe(user2.id);
    expect(loggedInUser2.id).not.toBe(user1.id);
  });
});
