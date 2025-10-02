import axios, { AxiosInstance, AxiosResponse } from 'axios';
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
  },

  // Clear token
  clearToken: () => {
    authToken = null;
  },

  // Get current token
  getToken: () => authToken,

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

export default api;
