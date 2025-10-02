import { authApi } from '../api';

// Mock axios
const mockAxios = {
  interceptors: {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  },
  post: jest.fn(),
  get: jest.fn(),
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxios),
}));

// Mock the mockApi
jest.mock('../mockApi', () => ({
  mockAuthApi: {
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    verifyToken: jest.fn(),
  },
}));

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    it('should set and get token correctly', () => {
      const token = 'test-token-123';
      
      authApi.setToken(token);
      expect(authApi.getToken()).toBe(token);
    });

    it('should clear token correctly', () => {
      const token = 'test-token-123';
      
      authApi.setToken(token);
      expect(authApi.getToken()).toBe(token);
      
      authApi.clearToken();
      expect(authApi.getToken()).toBe(null);
    });
  });

  describe('Login', () => {
    it('should call login with correct credentials', async () => {
      const credentials = {
        email: 'test@test.com',
        password: 'password123',
      };

      const mockResponse = {
        user: {
          id: '1',
          email: 'test@test.com',
          name: 'Test User',
          username: 'testuser',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: 'mock-token',
      };

      (mockAuthApi.login as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.login(credentials);

      expect(mockAuthApi.login).toHaveBeenCalledWith(credentials);
      expect(result).toEqual(mockResponse);
    });

    it('should handle login errors', async () => {
      const credentials = {
        email: 'test@test.com',
        password: 'wrongpassword',
      };

      const error = new Error('Invalid credentials');
      (mockAuthApi.login as jest.Mock).mockRejectedValue(error);

      await expect(authApi.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Signup', () => {
    it('should call signup with correct credentials', async () => {
      const credentials = {
        email: 'new@test.com',
        password: 'password123',
        name: 'New User',
        username: 'newuser',
      };

      const mockResponse = {
        user: {
          id: '2',
          email: 'new@test.com',
          name: 'New User',
          username: 'newuser',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: 'mock-token-2',
      };

      (mockAuthApi.signup as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.signup(credentials);

      expect(mockAuthApi.signup).toHaveBeenCalledWith(credentials);
      expect(result).toEqual(mockResponse);
    });

    it('should handle signup errors', async () => {
      const credentials = {
        email: 'existing@test.com',
        password: 'password123',
        name: 'Existing User',
        username: 'existinguser',
      };

      const error = new Error('Email already exists');
      (mockAuthApi.signup as jest.Mock).mockRejectedValue(error);

      await expect(authApi.signup(credentials)).rejects.toThrow('Email already exists');
    });
  });

  describe('Logout', () => {
    it('should call logout successfully', async () => {
      (mockAuthApi.logout as jest.Mock).mockResolvedValue(undefined);

      await authApi.logout();

      expect(mockAuthApi.logout).toHaveBeenCalled();
    });

    it('should handle logout errors gracefully', async () => {
      const error = new Error('Network error');
      (mockAuthApi.logout as jest.Mock).mockRejectedValue(error);

      // Should not throw even if logout fails
      await expect(authApi.logout()).resolves.toBeUndefined();
    });
  });

  describe('Get Current User', () => {
    it('should get current user with valid token', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        username: 'testuser',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockAuthApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await authApi.getCurrentUser();

      expect(mockAuthApi.getCurrentUser).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should handle getCurrentUser errors', async () => {
      const error = new Error('Invalid token');
      (mockAuthApi.getCurrentUser as jest.Mock).mockRejectedValue(error);

      await expect(authApi.getCurrentUser()).rejects.toThrow('Invalid token');
    });
  });

  describe('Verify Token', () => {
    it('should verify valid token', async () => {
      (mockAuthApi.verifyToken as jest.Mock).mockResolvedValue(true);

      const result = await authApi.verifyToken();

      expect(mockAuthApi.verifyToken).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle invalid token', async () => {
      (mockAuthApi.verifyToken as jest.Mock).mockResolvedValue(false);

      const result = await authApi.verifyToken();

      expect(mockAuthApi.verifyToken).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should handle verification errors', async () => {
      const error = new Error('Network error');
      (mockAuthApi.verifyToken as jest.Mock).mockRejectedValue(error);

      const result = await authApi.verifyToken();

      expect(result).toBe(false);
    });
  });
});
