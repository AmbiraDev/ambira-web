import axios, { AxiosInstance, AxiosResponse } from 'axios';
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
  Task
} from '@/types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management (in memory)
let authToken: string | null = null;

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      authToken = null;
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API methods
export const authApi = {
  // Set token for authenticated requests
  setToken: (token: string) => {
    authToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  },

  // Clear token
  clearToken: () => {
    authToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  },

  // Get current token
  getToken: () => {
    if (authToken) return authToken;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  },

  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Signup
  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/signup', credentials);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    authToken = null;
  },

  // Get current user
  getCurrentUser: async (): Promise<AuthUser> => {
    const response: AxiosResponse<AuthUser> = await api.get('/auth/me');
    return response.data;
  },

  // Verify token
  verifyToken: async (): Promise<boolean> => {
    try {
      await api.get('/auth/verify');
      return true;
    } catch {
      return false;
    }
  },
};

// Project API methods
export const projectApi = {
  // Get all user's projects
  getProjects: async (): Promise<Project[]> => {
    const response: AxiosResponse<Project[]> = await api.get('/projects');
    return response.data;
  },

  // Get single project by ID
  getProject: async (id: string): Promise<Project> => {
    const response: AxiosResponse<Project> = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Create new project
  createProject: async (data: CreateProjectData): Promise<Project> => {
    const response: AxiosResponse<Project> = await api.post('/projects', data);
    return response.data;
  },

  // Update project
  updateProject: async (id: string, data: UpdateProjectData): Promise<Project> => {
    const response: AxiosResponse<Project> = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  // Delete project
  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  // Get project statistics
  getProjectStats: async (id: string): Promise<ProjectStats> => {
    const response: AxiosResponse<ProjectStats> = await api.get(`/projects/${id}/stats`);
    return response.data;
  },

  // Archive project
  archiveProject: async (id: string): Promise<Project> => {
    const response: AxiosResponse<Project> = await api.patch(`/projects/${id}/archive`);
    return response.data;
  },

  // Restore project
  restoreProject: async (id: string): Promise<Project> => {
    const response: AxiosResponse<Project> = await api.patch(`/projects/${id}/restore`);
    return response.data;
  },
};

// Timer API methods
export const timerApi = {
  // Start a new timer session
  startSession: async (projectId: string, taskIds: string[] = []): Promise<ActiveTimer> => {
    const response: AxiosResponse<ActiveTimer> = await api.post('/sessions/start', {
      projectId,
      taskIds,
    });
    return response.data;
  },

  // Update active timer (for pause/resume)
  updateActiveTimer: async (timerId: string, pausedDuration: number, taskIds: string[] = []): Promise<ActiveTimer> => {
    const response: AxiosResponse<ActiveTimer> = await api.put(`/sessions/active/${timerId}`, {
      pausedDuration,
      taskIds,
    });
    return response.data;
  },

  // Get active timer
  getActiveTimer: async (): Promise<ActiveTimer | null> => {
    try {
      const response: AxiosResponse<ActiveTimer> = await api.get('/sessions/active');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No active timer
      }
      throw error;
    }
  },

  // Finish timer and create session
  finishSession: async (timerId: string, sessionData: CreateSessionData): Promise<Session> => {
    const response: AxiosResponse<Session> = await api.post(`/sessions/finish/${timerId}`, sessionData);
    return response.data;
  },

  // Cancel active timer
  cancelActiveTimer: async (timerId: string): Promise<void> => {
    await api.delete(`/sessions/active/${timerId}`);
  },
};

// Task API methods
export const taskApi = {
  // Get tasks for a project
  getProjectTasks: async (projectId: string): Promise<Task[]> => {
    const response: AxiosResponse<Task[]> = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
  },

  // Update task status
  updateTaskStatus: async (taskId: string, status: 'active' | 'completed' | 'archived'): Promise<Task> => {
    const response: AxiosResponse<Task> = await api.patch(`/tasks/${taskId}`, { status });
    return response.data;
  },
};

export default api;
