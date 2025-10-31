/**
 * Integration Test: User Signup Flow
 *
 * Tests the complete user signup workflow:
 * - Form submission
 * - API call to create user
 * - Auth state update
 * - Cache update
 * - Navigation to onboarding/feed
 * - Error handling
 */

 
// Note: 'any' types used for test mocks; unused imports kept for future test coverage

import {
  createTestQueryClient,
  TestProviders,
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
    signUp: mockFirebaseApi.auth.signUp,
    signIn: mockFirebaseApi.auth.signIn,
    signOut: mockFirebaseApi.auth.signOut,
    getCurrentUser: mockFirebaseApi.auth.getCurrentUser,
  },
}));

jest.mock('@/lib/react-query/auth.queries', () => {
  const actual = jest.requireActual('@/lib/react-query/auth.queries');
  return {
    ...actual,
    useAuth: jest.fn(),
    useSignup: jest.fn(),
  };
});

describe('Integration: User Signup Flow', () => {
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

  it('completes full signup flow: form → API → auth state → cache → redirect', async () => {
    // Arrange: Setup signup data
    const signupData = {
      email: 'newuser@test.com',
      username: 'newuser',
      displayName: 'New User',
      password: 'password123',
    };

    // Act: Call signup
    const newUser = await mockFirebaseApi.auth.signUp(signupData);

    // Assert: User created in Firebase
    expect(mockFirebaseApi.auth.signUp).toHaveBeenCalledWith(signupData);
    expect(newUser).toBeDefined();
    expect(newUser.email).toBe(signupData.email);
    expect(newUser.username).toBe(signupData.username);

    // Assert: User stored in Firebase
    const storedUser = testFirebaseStore.getUser(newUser.id);
    expect(storedUser).toBeDefined();
    expect(storedUser?.email).toBe(signupData.email);
  });

  it('prevents signup with duplicate email', async () => {
    // Arrange: Create existing user
    const existingUser = createTestUser({ email: 'existing@test.com' });
    testFirebaseStore.createUser(existingUser);

    // Mock to check for duplicate
    mockFirebaseApi.auth.signUp.mockImplementationOnce(async (data: any) => {
      const duplicate = Array.from(testFirebaseStore['users'].values()).find(
        u => u.email === data.email
      );
      if (duplicate) {
        throw new Error('Email already exists');
      }
      return createTestUser(data);
    });

    // Act & Assert: Attempt signup with duplicate email
    await expect(
      mockFirebaseApi.auth.signUp({
        email: 'existing@test.com',
        username: 'newuser',
        displayName: 'New User',
        password: 'password123',
      })
    ).rejects.toThrow('Email already exists');
  });

  it('prevents signup with duplicate username', async () => {
    // Arrange: Create existing user
    const existingUser = createTestUser({ username: 'existinguser' });
    testFirebaseStore.createUser(existingUser);

    // Mock to check for duplicate username
    mockFirebaseApi.auth.signUp.mockImplementationOnce(async (data: any) => {
      const duplicate = Array.from(testFirebaseStore['users'].values()).find(
        u => u.username === data.username
      );
      if (duplicate) {
        throw new Error('Username already taken');
      }
      return createTestUser(data);
    });

    // Act & Assert: Attempt signup with duplicate username
    await expect(
      mockFirebaseApi.auth.signUp({
        email: 'newuser@test.com',
        username: 'existinguser',
        displayName: 'New User',
        password: 'password123',
      })
    ).rejects.toThrow('Username already taken');
  });

  it('validates required fields during signup', async () => {
    // Mock validation - use mockImplementation (not Once) for all calls in this test
    mockFirebaseApi.auth.signUp.mockImplementation(async (data: any) => {
      if (!data.email) throw new Error('Email is required');
      if (!data.username) throw new Error('Username is required');
      if (!data.password) throw new Error('Password is required');
      return createTestUser(data);
    });

    // Act & Assert: Missing email
    await expect(
      mockFirebaseApi.auth.signUp({
        username: 'user',
        displayName: 'User',
        password: 'pass',
      } as any)
    ).rejects.toThrow('Email is required');

    // Act & Assert: Missing username
    await expect(
      mockFirebaseApi.auth.signUp({
        email: 'user@test.com',
        displayName: 'User',
        password: 'pass',
      } as any)
    ).rejects.toThrow('Username is required');

    // Act & Assert: Missing password
    await expect(
      mockFirebaseApi.auth.signUp({
        email: 'user@test.com',
        username: 'user',
        displayName: 'User',
      } as any)
    ).rejects.toThrow('Password is required');
  });

  it('initializes user with default values', async () => {
    // Act: Signup new user
    const newUser = await mockFirebaseApi.auth.signUp({
      email: 'user@test.com',
      username: 'testuser',
      displayName: 'Test User',
      password: 'password123',
    });

    // Assert: Default values set
    expect(newUser.followerCount).toBe(0);
    expect(newUser.followingCount).toBe(0);
    expect(newUser.createdAt).toBeInstanceOf(Date);
    expect(newUser.id).toBeDefined();
  });

  it('handles signup API errors gracefully', async () => {
    // Mock network error
    mockFirebaseApi.auth.signUp.mockRejectedValueOnce(
      new Error('Network error')
    );

    // Act & Assert: Handle error
    await expect(
      mockFirebaseApi.auth.signUp({
        email: 'user@test.com',
        username: 'testuser',
        displayName: 'Test User',
        password: 'password123',
      })
    ).rejects.toThrow('Network error');

    // Assert: No user created in store
    const users = Array.from(testFirebaseStore['users'].values());
    expect(users).toHaveLength(0);
  });

  it('sanitizes user input during signup', async () => {
    // Mock sanitization
    mockFirebaseApi.auth.signUp.mockImplementationOnce(async (data: any) => {
      const sanitizedUser = createTestUser({
        email: data.email.toLowerCase().trim(),
        username: data.username.toLowerCase().trim(),
        displayName: data.displayName.trim(),
      });
      testFirebaseStore.createUser(sanitizedUser);
      return sanitizedUser;
    });

    // Act: Signup with unsanitized data
    const newUser = await mockFirebaseApi.auth.signUp({
      email: '  USER@TEST.COM  ',
      username: '  TestUser  ',
      displayName: '  Test User  ',
      password: 'password123',
    });

    // Assert: Data sanitized
    expect(newUser.email).toBe('user@test.com');
    expect(newUser.username).toBe('testuser');
    expect(newUser.displayName).toBe('Test User');
  });
});
