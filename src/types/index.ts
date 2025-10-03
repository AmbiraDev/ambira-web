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
  order?: number; // For drag and drop ordering
}

// Task management interfaces
export interface CreateTaskData {
  name: string;
  projectId: string;
}

export interface UpdateTaskData {
  name?: string;
  status?: 'active' | 'completed' | 'archived';
  order?: number;
}

export interface BulkTaskUpdate {
  taskIds: string[];
  status: 'active' | 'completed' | 'archived';
}

export interface TaskStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  archivedTasks: number;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  averageTasksPerSession: number;
  mostProductiveHour: number;
}

export interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  createTask: (data: CreateTaskData) => Promise<Task>;
  updateTask: (id: string, data: UpdateTaskData, projectId?: string) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  bulkUpdateTasks: (update: BulkTaskUpdate) => Promise<void>;
  getProjectTasks: (projectId: string) => Promise<Task[]>;
  getTaskStats: (projectId: string) => Promise<TaskStats>;
  loadProjectTasks: (projectId: string) => Promise<void>;
  loadProjectTasksAndAdd: (projectId: string) => Promise<void>;
  getAllTasks: () => Promise<void>;
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
  showStartTime?: boolean;
  hideTaskNames?: boolean;
  howFelt?: number; // 1-5 rating
  privateNotes?: string;
  isArchived: boolean;
  // Social engagement fields (sessions are posts)
  supportCount: number;
  commentCount: number;
  isSupported?: boolean; // Whether current user has supported this session
  createdAt: Date;
  updatedAt: Date;
}

// Sessions with populated related data for display
export interface SessionWithDetails extends Session {
  user: User;
  project: Project;
}

// Session support (like/kudos)
export interface SessionSupport {
  id: string;
  sessionId: string;
  userId: string;
  createdAt: Date;
}

// Feed response for sessions
export interface FeedResponse {
  sessions: SessionWithDetails[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface FeedFilters {
  type?: 'following' | 'trending' | 'recent';
  projectId?: string;
  userId?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  bannerUrl?: string;
  location?: string;
  category: 'work' | 'study' | 'side-project' | 'learning' | 'other';
  type: 'just-for-fun' | 'professional' | 'competitive' | 'other';
  privacySetting: 'public' | 'approval-required';
  memberCount: number;
  adminUserIds: string[];
  memberIds: string[];
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  status: 'active' | 'pending' | 'left' | 'removed';
}

export interface GroupPost extends Post {
  groupId: string;
  groupVisibility: 'group-only' | 'public';
}

export interface CreateGroupData {
  name: string;
  description: string;
  category: 'work' | 'study' | 'side-project' | 'learning' | 'other';
  type: 'just-for-fun' | 'professional' | 'competitive' | 'other';
  privacySetting: 'public' | 'approval-required';
  location?: string;
  imageUrl?: string;
  bannerUrl?: string;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  category?: 'work' | 'study' | 'side-project' | 'learning' | 'other';
  type?: 'just-for-fun' | 'professional' | 'competitive' | 'other';
  privacySetting?: 'public' | 'approval-required';
  location?: string;
  imageUrl?: string;
  bannerUrl?: string;
}

export interface GroupFilters {
  category?: 'work' | 'study' | 'side-project' | 'learning' | 'other';
  type?: 'just-for-fun' | 'professional' | 'competitive' | 'other';
  privacySetting?: 'public' | 'approval-required';
  location?: string;
  search?: string;
}

export interface GroupStats {
  totalMembers: number;
  totalPosts: number;
  totalHours: number;
  weeklyHours: number;
  monthlyHours: number;
  activeMembers: number;
  topProjects: Array<{
    projectId: string;
    projectName: string;
    hours: number;
    memberCount: number;
  }>;
}

export interface GroupLeaderboardEntry {
  userId: string;
  user: User;
  totalHours: number;
  weeklyHours: number;
  monthlyHours: number;
  sessionCount: number;
  rank: number;
}

export interface GroupLeaderboard {
  period: 'weekly' | 'monthly' | 'yearly' | 'all-time';
  entries: GroupLeaderboardEntry[];
  lastUpdated: Date;
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
  sessionId: string; // Comments are attached to sessions
  userId: string;
  parentId?: string; // For nested replies
  content: string;
  likeCount: number;
  replyCount: number;
  isLiked?: boolean; // Whether current user has liked this comment
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  user?: User;
}

export interface CommentWithDetails extends Comment {
  user: User;
  replies?: CommentWithDetails[];
}

export interface CreateCommentData {
  sessionId: string;
  content: string;
  parentId?: string;
}

export interface UpdateCommentData {
  content: string;
}

export interface CommentLike {
  id: string;
  commentId: string;
  userId: string;
  createdAt: Date;
}

export interface CommentsResponse {
  comments: CommentWithDetails[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'follow' | 'support' | 'comment' | 'mention' | 'reply' | 'achievement' | 'streak' | 'group' | 'challenge';
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: Date;
  // Additional metadata based on type
  actorId?: string; // User who triggered the notification
  sessionId?: string; // Session related to the notification
  commentId?: string;
  groupId?: string;
  challengeId?: string;
}

export interface NotificationPreferences {
  email: {
    follows: boolean;
    supports: boolean;
    comments: boolean;
    mentions: boolean;
    replies: boolean;
    achievements: boolean;
    streaks: boolean;
    groupPosts: boolean;
    challenges: boolean;
  };
  inApp: {
    follows: boolean;
    supports: boolean;
    comments: boolean;
    mentions: boolean;
    replies: boolean;
    achievements: boolean;
    streaks: boolean;
    groupPosts: boolean;
    challenges: boolean;
  };
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  bio?: string;
  location?: string;
  profilePicture?: string;
  followersCount: number;
  followingCount: number;
  totalHours: number;
  isFollowing?: boolean;
  isPrivate?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  totalHours: number;
  weeklyHours: number;
  monthlyHours: number;
  currentStreak: number;
  longestStreak: number;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  averageSessionDuration: number;
  mostProductiveHour: number;
  favoriteProject?: {
    id: string;
    name: string;
    hours: number;
  };
}

export interface ActivityData {
  date: string;
  hours: number;
  sessions: number;
}

export interface WeeklyActivity {
  week: string;
  hours: number;
  sessions: number;
}

export interface ProjectBreakdown {
  projectId: string;
  projectName: string;
  hours: number;
  percentage: number;
  color: string;
}

export interface PrivacySettings {
  profileVisibility: 'everyone' | 'followers' | 'private';
  activityVisibility: 'everyone' | 'followers' | 'private';
  projectVisibility: 'everyone' | 'followers' | 'private';
  blockedUsers: string[];
}

export interface UserSearchResult {
  id: string;
  username: string;
  name: string;
  bio?: string;
  profilePicture?: string;
  followersCount: number;
  isFollowing?: boolean;
}

export interface SuggestedUser {
  id: string;
  username: string;
  name: string;
  bio?: string;
  profilePicture?: string;
  followersCount: number;
  reason: string; // Why this user was suggested
  isFollowing?: boolean;
}

export type ProfileTab = 'overview' | 'achievements' | 'following' | 'posts';

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
  visibility?: 'everyone' | 'followers' | 'private';
  showStartTime?: boolean;
  hideTaskNames?: boolean;
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
  showStartTime?: boolean;
  hideTaskNames?: boolean;
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
