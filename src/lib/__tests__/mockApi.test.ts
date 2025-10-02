import { mockAuthApi } from '../mockApi';

describe('Mock API', () => {
  beforeEach(() => {
    // Clear any existing mock data
    jest.clearAllMocks();
  });

  describe('Login', () => {
    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'demo@ambira.com',
        password: 'anypassword',
      };

      const result = await mockAuthApi.login(credentials);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('demo@ambira.com');
      expect(result.user.name).toBe('Demo User');
      expect(result.token).toMatch(/^mock_token_/);
    });

    it('should reject invalid email', async () => {
      const credentials = {
        email: 'nonexistent@test.com',
        password: 'anypassword',
      };

      await expect(mockAuthApi.login(credentials)).rejects.toThrow('Invalid email or password');
    });

    it('should simulate network delay', async () => {
      const credentials = {
        email: 'demo@ambira.com',
        password: 'anypassword',
      };

      const startTime = Date.now();
      await mockAuthApi.login(credentials);
      const endTime = Date.now();

      // Should take at least 1000ms (simulated delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Signup', () => {
    it('should signup with new credentials', async () => {
      const credentials = {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
        username: 'newuser',
      };

      const result = await mockAuthApi.signup(credentials);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('newuser@test.com');
      expect(result.user.name).toBe('New User');
      expect(result.user.username).toBe('newuser');
      expect(result.token).toMatch(/^mock_token_/);
    });

    it('should reject duplicate email', async () => {
      const credentials = {
        email: 'demo@ambira.com', // Already exists
        password: 'password123',
        name: 'Duplicate User',
        username: 'duplicate',
      };

      await expect(mockAuthApi.signup(credentials)).rejects.toThrow('Email already exists');
    });

    it('should reject duplicate username', async () => {
      const credentials = {
        email: 'unique@test.com',
        password: 'password123',
        name: 'Unique User',
        username: 'demo', // Already exists
      };

      await expect(mockAuthApi.signup(credentials)).rejects.toThrow('Username already exists');
    });

    it('should simulate network delay', async () => {
      const credentials = {
        email: 'delay@test.com',
        password: 'password123',
        name: 'Delay User',
        username: 'delayuser',
      };

      const startTime = Date.now();
      await mockAuthApi.signup(credentials);
      const endTime = Date.now();

      // Should take at least 1500ms (simulated delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(1500);
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      await expect(mockAuthApi.logout()).resolves.toBeUndefined();
    });

    it('should simulate network delay', async () => {
      const startTime = Date.now();
      await mockAuthApi.logout();
      const endTime = Date.now();

      // Should take at least 500ms (simulated delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(500);
    });
  });

  describe('Get Current User', () => {
    it('should get current user with valid token', async () => {
      // First create a user by signing up
      const signupCredentials = {
        email: 'current@test.com',
        password: 'password123',
        name: 'Current User',
        username: 'currentuser',
      };

      const signupResult = await mockAuthApi.signup(signupCredentials);
      const token = signupResult.token;

      // Then get the current user
      const user = await mockAuthApi.getCurrentUser(token);

      expect(user.email).toBe('current@test.com');
      expect(user.name).toBe('Current User');
      expect(user.username).toBe('currentuser');
    });

    it('should reject invalid token', async () => {
      const invalidToken = 'invalid-token';

      await expect(mockAuthApi.getCurrentUser(invalidToken)).rejects.toThrow('Invalid token');
    });

    it('should simulate network delay', async () => {
      const signupCredentials = {
        email: 'delay2@test.com',
        password: 'password123',
        name: 'Delay User 2',
        username: 'delayuser2',
      };

      const signupResult = await mockAuthApi.signup(signupCredentials);
      const token = signupResult.token;

      const startTime = Date.now();
      await mockAuthApi.getCurrentUser(token);
      const endTime = Date.now();

      // Should take at least 800ms (simulated delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(800);
    });
  });

  describe('Verify Token', () => {
    it('should verify valid token', async () => {
      // First create a user by signing up
      const signupCredentials = {
        email: 'verify@test.com',
        password: 'password123',
        name: 'Verify User',
        username: 'verifyuser',
      };

      const signupResult = await mockAuthApi.signup(signupCredentials);
      const token = signupResult.token;

      // Then verify the token
      const isValid = await mockAuthApi.verifyToken(token);

      expect(isValid).toBe(true);
    });

    it('should reject invalid token', async () => {
      const invalidToken = 'invalid-token';

      const isValid = await mockAuthApi.verifyToken(invalidToken);

      expect(isValid).toBe(false);
    });

    it('should simulate network delay', async () => {
      const signupCredentials = {
        email: 'delay3@test.com',
        password: 'password123',
        name: 'Delay User 3',
        username: 'delayuser3',
      };

      const signupResult = await mockAuthApi.signup(signupCredentials);
      const token = signupResult.token;

      const startTime = Date.now();
      await mockAuthApi.verifyToken(token);
      const endTime = Date.now();

      // Should take at least 300ms (simulated delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(300);
    });
  });

  describe('Data Persistence', () => {
    it('should maintain user data across multiple operations', async () => {
      // Signup a user
      const signupCredentials = {
        email: 'persist@test.com',
        password: 'password123',
        name: 'Persist User',
        username: 'persistuser',
      };

      const signupResult = await mockAuthApi.signup(signupCredentials);
      const token = signupResult.token;

      // Get the user
      const user = await mockAuthApi.getCurrentUser(token);
      expect(user.email).toBe('persist@test.com');

      // Verify the token
      const isValid = await mockAuthApi.verifyToken(token);
      expect(isValid).toBe(true);

      // Login with the same credentials should work
      const loginResult = await mockAuthApi.login({
        email: 'persist@test.com',
        password: 'anypassword',
      });
      expect(loginResult.user.email).toBe('persist@test.com');
    });
  });
});
