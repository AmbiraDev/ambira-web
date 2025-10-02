import { AuthResponse, LoginCredentials, SignupCredentials, AuthUser } from '@/types';

// Mock users database (in memory)
const mockUsers: AuthUser[] = [
  {
    id: '1',
    email: 'demo@ambira.com',
    name: 'Demo User',
    username: 'demo',
    bio: 'Productivity enthusiast',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// Mock tokens (in memory)
const mockTokens = new Map<string, string>();

// Generate mock token
const generateToken = (userId: string): string => {
  return `mock_token_${userId}_${Date.now()}`;
};

// Mock API responses
export const mockAuthApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = mockUsers.find(u => u.email === credentials.email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // For demo purposes, accept any password
    const token = generateToken(user.id);
    mockTokens.set(token, user.id);

    return {
      user,
      token,
    };
  },

  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if email already exists
    if (mockUsers.some(u => u.email === credentials.email)) {
      throw new Error('Email already exists');
    }

    // Check if username already exists
    if (mockUsers.some(u => u.username === credentials.username)) {
      throw new Error('Username already exists');
    }

    // Create new user
    const newUser: AuthUser = {
      id: (mockUsers.length + 1).toString(),
      email: credentials.email,
      name: credentials.name,
      username: credentials.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUsers.push(newUser);

    const token = generateToken(newUser.id);
    mockTokens.set(token, newUser.id);

    return {
      user: newUser,
      token,
    };
  },

  logout: async (): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // In a real app, you might invalidate the token on the server
  },

  getCurrentUser: async (token: string): Promise<AuthUser> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const userId = mockTokens.get(token);
    if (!userId) {
      throw new Error('Invalid token');
    }

    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },

  verifyToken: async (token: string): Promise<boolean> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return mockTokens.has(token);
  },
};
