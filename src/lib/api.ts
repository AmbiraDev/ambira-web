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
  SessionFormData,
  SessionFilters,
  SessionSort,
  SessionListResponse,
  UserProfile,
  UserStats,
  ActivityData,
  WeeklyActivity,
  ProjectBreakdown,
  PrivacySettings,
  UserSearchResult,
  SuggestedUser
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
  startSession: async (projectId: string): Promise<ActiveTimer> => {
    const response: AxiosResponse<ActiveTimer> = await api.post('/sessions/start', {
      projectId,
    });
    return response.data;
  },

  // Update active timer (for pause/resume)
  updateActiveTimer: async (timerId: string, pausedDuration: number): Promise<ActiveTimer> => {
    const response: AxiosResponse<ActiveTimer> = await api.put(`/sessions/active/${timerId}`, {
      pausedDuration,
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

// Session API methods
export const sessionApi = {
  // Create a new session (manual entry)
  createSession: async (sessionData: SessionFormData): Promise<Session> => {
    const response: AxiosResponse<Session> = await api.post('/sessions', sessionData);
    return response.data;
  },

  // Get user's sessions with filtering and pagination
  getSessions: async (
    page: number = 1,
    limit: number = 20,
    filters: SessionFilters = {},
    sort: SessionSort = { field: 'startTime', direction: 'desc' }
  ): Promise<SessionListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortField: sort.field,
      sortDirection: sort.direction,
      ...(filters.projectId && { projectId: filters.projectId }),
      ...(filters.dateFrom && { dateFrom: filters.dateFrom.toISOString() }),
      ...(filters.dateTo && { dateTo: filters.dateTo.toISOString() }),
      ...(filters.tags && { tags: filters.tags.join(',') }),
      ...(filters.visibility && { visibility: filters.visibility }),
      ...(filters.search && { search: filters.search }),
    });

    const response: AxiosResponse<SessionListResponse> = await api.get(`/sessions?${params}`);
    return response.data;
  },

  // Get single session by ID
  getSession: async (id: string): Promise<Session> => {
    const response: AxiosResponse<Session> = await api.get(`/sessions/${id}`);
    return response.data;
  },

  // Update session
  updateSession: async (id: string, sessionData: Partial<SessionFormData>): Promise<Session> => {
    const response: AxiosResponse<Session> = await api.put(`/sessions/${id}`, sessionData);
    return response.data;
  },

  // Delete session
  deleteSession: async (id: string): Promise<void> => {
    await api.delete(`/sessions/${id}`);
  },

  // Archive session
  archiveSession: async (id: string): Promise<Session> => {
    const response: AxiosResponse<Session> = await api.patch(`/sessions/${id}/archive`);
    return response.data;
  },

  // Unarchive session
  unarchiveSession: async (id: string): Promise<Session> => {
    const response: AxiosResponse<Session> = await api.patch(`/sessions/${id}/unarchive`);
    return response.data;
  },
};

// User API methods
export const userApi = {
  // Get user profile by username
  getUserProfile: async (username: string): Promise<UserProfile> => {
    const response: AxiosResponse<UserProfile> = await api.get(`/users/${username}`);
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: Partial<{
    name: string;
    bio: string;
    location: string;
    profilePicture: string;
  }>): Promise<UserProfile> => {
    const response: AxiosResponse<UserProfile> = await api.put('/users/profile', data);
    return response.data;
  },

  // Get user statistics
  getUserStats: async (userId: string): Promise<UserStats> => {
    const response: AxiosResponse<UserStats> = await api.get(`/users/${userId}/stats`);
    return response.data;
  },

  // Get activity data for calendar heatmap
  getActivityData: async (userId: string, year: number): Promise<ActivityData[]> => {
    const response: AxiosResponse<ActivityData[]> = await api.get(`/users/${userId}/activity?year=${year}`);
    return response.data;
  },

  // Get weekly activity data
  getWeeklyActivity: async (userId: string, weeks: number = 12): Promise<WeeklyActivity[]> => {
    const response: AxiosResponse<WeeklyActivity[]> = await api.get(`/users/${userId}/weekly-activity?weeks=${weeks}`);
    return response.data;
  },

  // Get project breakdown
  getProjectBreakdown: async (userId: string): Promise<ProjectBreakdown[]> => {
    const response: AxiosResponse<ProjectBreakdown[]> = await api.get(`/users/${userId}/project-breakdown`);
    return response.data;
  },

  // Follow user
  followUser: async (userId: string): Promise<void> => {
    await api.post(`/users/${userId}/follow`);
  },

  // Unfollow user
  unfollowUser: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}/follow`);
  },

  // Get followers
  getFollowers: async (userId: string, page: number = 1, limit: number = 20): Promise<{
    users: UserProfile[];
    totalCount: number;
    hasMore: boolean;
  }> => {
    const response: AxiosResponse<{
      users: UserProfile[];
      totalCount: number;
      hasMore: boolean;
    }> = await api.get(`/users/${userId}/followers?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get following
  getFollowing: async (userId: string, page: number = 1, limit: number = 20): Promise<{
    users: UserProfile[];
    totalCount: number;
    hasMore: boolean;
  }> => {
    const response: AxiosResponse<{
      users: UserProfile[];
      totalCount: number;
      hasMore: boolean;
    }> = await api.get(`/users/${userId}/following?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Search users
  searchUsers: async (query: string, page: number = 1, limit: number = 20): Promise<{
    users: UserSearchResult[];
    totalCount: number;
    hasMore: boolean;
  }> => {
    const response: AxiosResponse<{
      users: UserSearchResult[];
      totalCount: number;
      hasMore: boolean;
    }> = await api.get(`/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get suggested users
  getSuggestedUsers: async (limit: number = 10): Promise<SuggestedUser[]> => {
    const response: AxiosResponse<SuggestedUser[]> = await api.get(`/users/suggested?limit=${limit}`);
    return response.data;
  },

  // Get privacy settings
  getPrivacySettings: async (): Promise<PrivacySettings> => {
    const response: AxiosResponse<PrivacySettings> = await api.get('/users/privacy-settings');
    return response.data;
  },

  // Update privacy settings
  updatePrivacySettings: async (settings: Partial<PrivacySettings>): Promise<PrivacySettings> => {
    const response: AxiosResponse<PrivacySettings> = await api.put('/users/privacy-settings', settings);
    return response.data;
  },

  // Block user
  blockUser: async (userId: string): Promise<void> => {
    await api.post(`/users/${userId}/block`);
  },

  // Unblock user
  unblockUser: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}/block`);
  },
};

export default api;
