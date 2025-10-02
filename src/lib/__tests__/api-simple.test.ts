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

describe('API Service - Simple Tests', () => {
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

  describe('API Methods Exist', () => {
    it('should have all required methods', () => {
      expect(typeof authApi.login).toBe('function');
      expect(typeof authApi.signup).toBe('function');
      expect(typeof authApi.logout).toBe('function');
      expect(typeof authApi.getCurrentUser).toBe('function');
      expect(typeof authApi.verifyToken).toBe('function');
      expect(typeof authApi.setToken).toBe('function');
      expect(typeof authApi.clearToken).toBe('function');
      expect(typeof authApi.getToken).toBe('function');
    });
  });
});
