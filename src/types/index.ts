// Core data types for Ambira

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  bio?: string;
  location?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  weeklyTarget?: number; // hours
  totalTarget?: number; // hours
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectStats {
  totalHours: number;
  weeklyHours: number;
  sessionCount: number;
  currentStreak: number;
  weeklyProgressPercentage: number;
  totalProgressPercentage: number;
  averageSessionDuration: number;
  lastSessionDate?: Date;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  completedAt?: Date;
}

export interface Session {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  description?: string;
  duration: number; // seconds
  startTime: Date;
  tasks: Task[];
  tags: string[];
  visibility: 'everyone' | 'followers' | 'private';
  howFelt?: number; // 1-5 rating
  privateNotes?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  supportCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  location?: string;
  category: 'work' | 'study' | 'side-project' | 'learning' | 'other';
  type: 'just-for-fun' | 'professional' | 'competitive' | 'other';
  privacySetting: 'public' | 'approval-required';
  memberCount: number;
  adminUserIds: string[];
  createdAt: Date;
}

export interface Challenge {
  id: string;
  groupId?: string;
  name: string;
  description: string;
  type: 'most-activity' | 'fastest-effort' | 'longest-session' | 'group-goal';
  goalValue?: number;
  startDate: Date;
  endDate: Date;
  participantCount: number;
  createdByUserId: string;
  createdAt: Date;
}

export interface Achievement {
  id: string;
  userId: string;
  type: string;
  name: string;
  description: string;
  earnedAt: Date;
  sessionId?: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId?: string;
  content: string;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
  bio?: string;
  location?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  username: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
}

// Project-related types
export interface CreateProjectData {
  name: string;
  description: string;
  icon: string;
  color: string;
  weeklyTarget?: number;
  totalTarget?: number;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  weeklyTarget?: number;
  totalTarget?: number;
  status?: 'active' | 'completed' | 'archived';
}

export interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

export interface ProjectContextType {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  archiveProject: (id: string) => Promise<Project>;
  restoreProject: (id: string) => Promise<Project>;
  getProjectStats: (id: string) => Promise<ProjectStats>;
}

// Timer-related types
export interface ActiveTimer {
  id: string;
  userId: string;
  projectId: string;
  startTime: Date;
  pausedDuration: number; // seconds
  selectedTaskIds: string[];
  lastUpdated: Date;
}

export interface TimerState {
  isRunning: boolean;
  startTime: Date | null;
  pausedDuration: number;
  currentProject: Project | null;
  selectedTasks: Task[];
  activeTimerId: string | null;
  isConnected: boolean;
  lastAutoSave: Date | null;
}

export interface TimerContextType {
  timerState: TimerState;
  startTimer: (projectId: string, taskIds?: string[]) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  finishTimer: (title: string, description?: string, tags?: string[], howFelt?: number, privateNotes?: string) => Promise<Session>;
  resetTimer: () => Promise<void>;
  updateSelectedTasks: (taskIds: string[]) => Promise<void>;
  loadActiveTimer: () => Promise<void>;
  getElapsedTime: () => number;
  getFormattedTime: (seconds: number) => string;
}

export interface CreateSessionData {
  projectId: string;
  title: string;
  description?: string;
  duration: number;
  startTime: Date;
  taskIds: string[];
  tags?: string[];
  howFelt?: number;
  privateNotes?: string;
}

// Session management interfaces
export interface SessionFormData {
  projectId: string;
  title: string;
  description?: string;
  duration: number;
  startTime: Date;
  taskIds?: string[];
  tags: string[];
  visibility: 'everyone' | 'followers' | 'private';
  howFelt?: number;
  privateNotes?: string;
}

export interface SessionFilters {
  projectId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  visibility?: string;
  search?: string;
}

export interface SessionSort {
  field: 'startTime' | 'duration' | 'title';
  direction: 'asc' | 'desc';
}

export interface SessionListResponse {
  sessions: Session[];
  totalCount: number;
  hasMore: boolean;
}

export interface SessionFormProps {
  initialData?: Partial<SessionFormData>;
  onSubmit: (data: SessionFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'timer' | 'manual';
}

export interface SessionHistoryProps {
  sessions: Session[];
  projects: Project[];
  filters: SessionFilters;
  sort: SessionSort;
  onFiltersChange: (filters: SessionFilters) => void;
  onSortChange: (sort: SessionSort) => void;
  onSessionEdit: (session: Session) => void;
  onSessionDelete: (sessionId: string) => void;
  onSessionArchive: (sessionId: string) => void;
  isLoading?: boolean;
}
