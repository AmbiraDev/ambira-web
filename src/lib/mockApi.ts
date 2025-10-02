import { 
  AuthResponse, 
  LoginCredentials, 
  SignupCredentials, 
  AuthUser,
  Project,
  ProjectStats,
  CreateProjectData,
  UpdateProjectData,
  ActiveTimer,
  Session,
  CreateSessionData,
  SessionFormData,
  SessionFilters,
  SessionSort,
  SessionListResponse,
  Task
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

// Mock tasks database (in memory)
const mockTasks: Task[] = [
  {
    id: '1',
    projectId: '1',
    name: 'Implement user authentication',
    status: 'completed',
    createdAt: new Date('2024-01-01'),
    completedAt: new Date('2024-01-05'),
  },
  {
    id: '2',
    projectId: '1',
    name: 'Build project dashboard',
    status: 'active',
    createdAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    projectId: '1',
    name: 'Add timer functionality',
    status: 'active',
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '4',
    projectId: '2',
    name: 'Learn React hooks',
    status: 'completed',
    createdAt: new Date('2024-01-10'),
    completedAt: new Date('2024-01-12'),
  },
  {
    id: '5',
    projectId: '2',
    name: 'Build React components',
    status: 'active',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '6',
    projectId: '3',
    name: 'Create workout plan',
    status: 'active',
    createdAt: new Date('2024-01-05'),
  },
];

// Mock active timers database (in memory)
const mockActiveTimers: ActiveTimer[] = [];

// Mock sessions database (in memory)
const mockSessions: Session[] = [];

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

// Mock timer API
export const mockTimerApi = {
  startSession: async (projectId: string, taskIds: string[] = [], token: string): Promise<ActiveTimer> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const userId = getCurrentUserId(token);
    
    // Check if project exists and belongs to user
    const project = mockProjects.find(p => p.id === projectId && p.userId === userId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Cancel any existing active timer for this user
    const existingTimerIndex = mockActiveTimers.findIndex(t => t.userId === userId);
    if (existingTimerIndex !== -1) {
      mockActiveTimers.splice(existingTimerIndex, 1);
    }

    // Create new active timer
    const newTimer: ActiveTimer = {
      id: `timer_${Date.now()}`,
      userId,
      projectId,
      startTime: new Date(),
      pausedDuration: 0,
      selectedTaskIds: taskIds,
      lastUpdated: new Date(),
    };

    mockActiveTimers.push(newTimer);
    return newTimer;
  },

  updateActiveTimer: async (timerId: string, pausedDuration: number, taskIds: string[] = [], token: string): Promise<ActiveTimer> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const userId = getCurrentUserId(token);
    const timerIndex = mockActiveTimers.findIndex(t => t.id === timerId && t.userId === userId);
    
    if (timerIndex === -1) {
      throw new Error('Active timer not found');
    }

    mockActiveTimers[timerIndex] = {
      ...mockActiveTimers[timerIndex],
      pausedDuration,
      selectedTaskIds: taskIds,
      lastUpdated: new Date(),
    };

    return mockActiveTimers[timerIndex];
  },

  getActiveTimer: async (token: string): Promise<ActiveTimer | null> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const userId = getCurrentUserId(token);
    const activeTimer = mockActiveTimers.find(t => t.userId === userId);
    
    return activeTimer || null;
  },

  finishSession: async (timerId: string, sessionData: CreateSessionData, token: string): Promise<Session> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const userId = getCurrentUserId(token);
    const timerIndex = mockActiveTimers.findIndex(t => t.id === timerId && t.userId === userId);
    
    if (timerIndex === -1) {
      throw new Error('Active timer not found');
    }

    // Get selected tasks
    const selectedTasks = mockTasks.filter(task => sessionData.taskIds.includes(task.id));

    // Create session
    const newSession: Session = {
      id: `session_${Date.now()}`,
      userId,
      projectId: sessionData.projectId,
      title: sessionData.title,
      description: sessionData.description,
      duration: sessionData.duration,
      startTime: sessionData.startTime,
      tasks: selectedTasks,
      tags: sessionData.tags || [],
      visibility: 'private',
      howFelt: sessionData.howFelt,
      privateNotes: sessionData.privateNotes,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockSessions.push(newSession);

    // Remove active timer
    mockActiveTimers.splice(timerIndex, 1);

    return newSession;
  },

  cancelActiveTimer: async (timerId: string, token: string): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const userId = getCurrentUserId(token);
    const timerIndex = mockActiveTimers.findIndex(t => t.id === timerId && t.userId === userId);
    
    if (timerIndex !== -1) {
      mockActiveTimers.splice(timerIndex, 1);
    }
  },
};

// Mock task API
export const mockTaskApi = {
  getProjectTasks: async (projectId: string, token: string): Promise<Task[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const userId = getCurrentUserId(token);
    
    // Verify project belongs to user
    const project = mockProjects.find(p => p.id === projectId && p.userId === userId);
    if (!project) {
      throw new Error('Project not found');
    }

    return mockTasks.filter(task => task.projectId === projectId);
  },

  updateTaskStatus: async (taskId: string, status: 'active' | 'completed' | 'archived', token: string): Promise<Task> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const userId = getCurrentUserId(token);
    const taskIndex = mockTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    // Verify task belongs to user's project
    const task = mockTasks[taskIndex];
    const project = mockProjects.find(p => p.id === task.projectId && p.userId === userId);
    if (!project) {
      throw new Error('Task not found');
    }

    mockTasks[taskIndex] = {
      ...task,
      status,
      completedAt: status === 'completed' ? new Date() : undefined,
    };

    return mockTasks[taskIndex];
  },
};

// Mock session API
export const mockSessionApi = {
  createSession: async (sessionData: SessionFormData, token: string): Promise<Session> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const userId = getCurrentUserId(token);
    
    // Verify project belongs to user
    const project = mockProjects.find(p => p.id === sessionData.projectId && p.userId === userId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Get selected tasks
    const selectedTasks = sessionData.taskIds ? 
      mockTasks.filter(task => sessionData.taskIds!.includes(task.id)) : [];

    // Create session
    const newSession: Session = {
      id: `session_${Date.now()}`,
      userId,
      projectId: sessionData.projectId,
      title: sessionData.title,
      description: sessionData.description,
      duration: sessionData.duration,
      startTime: sessionData.startTime,
      tasks: selectedTasks,
      tags: sessionData.tags || [],
      visibility: sessionData.visibility,
      howFelt: sessionData.howFelt,
      privateNotes: sessionData.privateNotes,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockSessions.push(newSession);
    return newSession;
  },

  getSessions: async (
    page: number = 1,
    limit: number = 20,
    filters: SessionFilters = {},
    sort: SessionSort = { field: 'startTime', direction: 'desc' },
    token: string
  ): Promise<SessionListResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const userId = getCurrentUserId(token);
    
    // Filter sessions by user
    let filteredSessions = mockSessions.filter(session => session.userId === userId);

    // Apply filters
    if (filters.projectId) {
      filteredSessions = filteredSessions.filter(session => session.projectId === filters.projectId);
    }

    if (filters.dateFrom) {
      filteredSessions = filteredSessions.filter(session => session.startTime >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filteredSessions = filteredSessions.filter(session => session.startTime <= filters.dateTo!);
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredSessions = filteredSessions.filter(session => 
        filters.tags!.some(tag => session.tags.includes(tag))
      );
    }

    if (filters.visibility) {
      filteredSessions = filteredSessions.filter(session => session.visibility === filters.visibility);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredSessions = filteredSessions.filter(session => 
        session.title.toLowerCase().includes(searchLower) ||
        session.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filteredSessions.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sort.field) {
        case 'startTime':
          aValue = new Date(a.startTime).getTime();
          bValue = new Date(b.startTime).getTime();
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          aValue = new Date(a.startTime).getTime();
          bValue = new Date(b.startTime).getTime();
      }

      if (sort.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

    return {
      sessions: paginatedSessions,
      totalCount: filteredSessions.length,
      hasMore: endIndex < filteredSessions.length,
    };
  },

  getSession: async (id: string, token: string): Promise<Session> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const userId = getCurrentUserId(token);
    const session = mockSessions.find(s => s.id === id && s.userId === userId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  },

  updateSession: async (id: string, sessionData: Partial<SessionFormData>, token: string): Promise<Session> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 700));

    const userId = getCurrentUserId(token);
    const sessionIndex = mockSessions.findIndex(s => s.id === id && s.userId === userId);
    
    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }

    // Get selected tasks if taskIds provided
    const selectedTasks = sessionData.taskIds ? 
      mockTasks.filter(task => sessionData.taskIds!.includes(task.id)) : 
      mockSessions[sessionIndex].tasks;

    // Update session
    mockSessions[sessionIndex] = {
      ...mockSessions[sessionIndex],
      ...sessionData,
      tasks: selectedTasks,
      updatedAt: new Date(),
    };

    return mockSessions[sessionIndex];
  },

  deleteSession: async (id: string, token: string): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const userId = getCurrentUserId(token);
    const sessionIndex = mockSessions.findIndex(s => s.id === id && s.userId === userId);
    
    if (sessionIndex !== -1) {
      mockSessions.splice(sessionIndex, 1);
    }
  },

  archiveSession: async (id: string, token: string): Promise<Session> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const userId = getCurrentUserId(token);
    const sessionIndex = mockSessions.findIndex(s => s.id === id && s.userId === userId);
    
    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }

    mockSessions[sessionIndex] = {
      ...mockSessions[sessionIndex],
      isArchived: true,
      updatedAt: new Date(),
    };

    return mockSessions[sessionIndex];
  },

  unarchiveSession: async (id: string, token: string): Promise<Session> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const userId = getCurrentUserId(token);
    const sessionIndex = mockSessions.findIndex(s => s.id === id && s.userId === userId);
    
    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }

    mockSessions[sessionIndex] = {
      ...mockSessions[sessionIndex],
      isArchived: false,
      updatedAt: new Date(),
    };

    return mockSessions[sessionIndex];
  },
};
