import { 
  AuthResponse, 
  LoginCredentials, 
  SignupCredentials, 
  AuthUser,
  Project,
  ProjectStats,
  CreateProjectData,
  UpdateProjectData
} from '@/types';

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

// Mock projects database (in memory)
const mockProjects: Project[] = [
  {
    id: '1',
    userId: '1',
    name: 'Ambira Web App',
    description: 'Building the next generation productivity tracking app',
    icon: '💻',
    color: 'orange',
    weeklyTarget: 20,
    totalTarget: 1000,
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    userId: '1',
    name: 'Learning React',
    description: 'Mastering React and modern web development',
    icon: '⚛️',
    color: 'blue',
    weeklyTarget: 10,
    totalTarget: 500,
    status: 'active',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    userId: '1',
    name: 'Fitness Goals',
    description: 'Personal fitness and wellness journey',
    icon: '💪',
    color: 'green',
    weeklyTarget: 8,
    status: 'active',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-18'),
  },
];

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

// Helper function to get current user ID from token
const getCurrentUserId = (token: string): string => {
  const userId = mockTokens.get(token);
  if (!userId) {
    throw new Error('Invalid token');
  }
  return userId;
};

// Mock project API
export const mockProjectApi = {
  getProjects: async (token: string): Promise<Project[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const userId = getCurrentUserId(token);
    return mockProjects.filter(p => p.userId === userId);
  },

  getProject: async (id: string, token: string): Promise<Project> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const userId = getCurrentUserId(token);
    const project = mockProjects.find(p => p.id === id && p.userId === userId);
    
    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  },

  createProject: async (data: CreateProjectData, token: string): Promise<Project> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const userId = getCurrentUserId(token);
    const newProject: Project = {
      id: (mockProjects.length + 1).toString(),
      userId,
      ...data,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockProjects.push(newProject);
    return newProject;
  },

  updateProject: async (id: string, data: UpdateProjectData, token: string): Promise<Project> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const userId = getCurrentUserId(token);
    const projectIndex = mockProjects.findIndex(p => p.id === id && p.userId === userId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }

    mockProjects[projectIndex] = {
      ...mockProjects[projectIndex],
      ...data,
      updatedAt: new Date(),
    };

    return mockProjects[projectIndex];
  },

  deleteProject: async (id: string, token: string): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const userId = getCurrentUserId(token);
    const projectIndex = mockProjects.findIndex(p => p.id === id && p.userId === userId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }

    mockProjects.splice(projectIndex, 1);
  },

  getProjectStats: async (id: string, token: string): Promise<ProjectStats> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 700));

    const userId = getCurrentUserId(token);
    const project = mockProjects.find(p => p.id === id && p.userId === userId);
    
    if (!project) {
      throw new Error('Project not found');
    }

    // Mock statistics - in a real app, these would be calculated from session data
    const mockStats: ProjectStats = {
      totalHours: Math.floor(Math.random() * 200) + 50,
      weeklyHours: Math.floor(Math.random() * 25) + 5,
      sessionCount: Math.floor(Math.random() * 100) + 20,
      currentStreak: Math.floor(Math.random() * 30) + 1,
      weeklyProgressPercentage: Math.min(100, ((Math.floor(Math.random() * 25) + 5) / (project.weeklyTarget || 20)) * 100),
      totalProgressPercentage: Math.min(100, ((Math.floor(Math.random() * 200) + 50) / (project.totalTarget || 500)) * 100),
      averageSessionDuration: Math.floor(Math.random() * 120) + 30, // minutes
      lastSessionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    };

    return mockStats;
  },

  archiveProject: async (id: string, token: string): Promise<Project> => {
    return mockProjectApi.updateProject(id, { status: 'archived' }, token);
  },

  restoreProject: async (id: string, token: string): Promise<Project> => {
    return mockProjectApi.updateProject(id, { status: 'active' }, token);
  },
};
