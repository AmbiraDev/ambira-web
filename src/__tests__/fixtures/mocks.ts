/**
 * Mock Factory Functions for Test Isolation
 *
 * This module provides factory functions for creating isolated mock instances.
 * Use these factories in test files instead of relying on global mocks to ensure
 * better test isolation and prevent state leakage between tests.
 *
 * Benefits:
 * - Each test gets a fresh mock instance
 * - Prevents mock state from affecting other tests
 * - Easier to customize mocks per test
 * - Better test readability and maintainability
 *
 * Usage:
 * ```typescript
 * import { createMockAuth, createMockFirebaseApi } from '@/__tests__/fixtures/mocks';
 *
 * jest.mock('@/lib/firebase', () => ({
 *   auth: createMockAuth(),
 * }));
 * ```
 */

/**
 * Create a mock Firebase Auth instance
 *
 * @param overrides - Partial overrides for custom behavior
 * @returns Mock Firebase Auth object
 */
export const createMockAuth = (overrides = {}) => ({
  currentUser: null,
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  ...overrides,
})

/**
 * Create a mock Firebase DB (Firestore) instance
 *
 * @param overrides - Partial overrides for custom behavior
 * @returns Mock Firebase DB object
 */
export const createMockDb = (overrides = {}) => ({
  collection: jest.fn(),
  doc: jest.fn(),
  ...overrides,
})

/**
 * Create a mock Firebase Storage instance
 *
 * @param overrides - Partial overrides for custom behavior
 * @returns Mock Firebase Storage object
 */
export const createMockStorage = (overrides = {}) => ({
  ref: jest.fn(),
  ...overrides,
})

/**
 * Create a mock Firebase Session API instance
 *
 * @param overrides - Partial overrides for custom behavior
 * @returns Mock Firebase Session API object
 */
export const createMockFirebaseSessionApi = (overrides = {}) => ({
  getSessions: jest.fn(() => Promise.resolve({ sessions: [], nextCursor: null })),
  getSession: jest.fn(() => Promise.resolve(null)),
  createSession: jest.fn(() => Promise.resolve({ id: 'mock-session' })),
  updateSession: jest.fn(() => Promise.resolve()),
  deleteSession: jest.fn(() => Promise.resolve()),
  getActiveSession: jest.fn(() => Promise.resolve(null)),
  saveActiveSession: jest.fn(() => Promise.resolve()),
  clearActiveSession: jest.fn(() => Promise.resolve()),
  ...overrides,
})

/**
 * Create a mock Firebase Activity API instance
 *
 * @param overrides - Partial overrides for custom behavior
 * @returns Mock Firebase Activity API object
 */
export const createMockFirebaseActivityApi = (overrides = {}) => ({
  getProjects: jest.fn(() => Promise.resolve([])),
  createProject: jest.fn(() => Promise.resolve({ id: 'mock-project' })),
  updateProject: jest.fn(() => Promise.resolve()),
  deleteProject: jest.fn(() => Promise.resolve()),
  ...overrides,
})

/**
 * Create a mock Firebase Notification API instance
 *
 * @param overrides - Partial overrides for custom behavior
 * @returns Mock Firebase Notification API object
 */
export const createMockFirebaseNotificationApi = (overrides = {}) => ({
  getUserNotifications: jest.fn(() => Promise.resolve([])),
  markAsRead: jest.fn(() => Promise.resolve()),
  markAllAsRead: jest.fn(() => Promise.resolve()),
  deleteNotification: jest.fn(() => Promise.resolve()),
  createNotification: jest.fn(() => Promise.resolve()),
  getUnreadCount: jest.fn(() => Promise.resolve(0)),
  ...overrides,
})

/**
 * Create a mock Firebase Auth API instance
 *
 * @param overrides - Partial overrides for custom behavior
 * @returns Mock Firebase Auth API object
 */
export const createMockFirebaseAuthApi = (overrides = {}) => ({
  getCurrentUser: jest.fn(() => Promise.resolve(null)),
  login: jest.fn(() => Promise.resolve({ user: { id: 'mock-user' }, token: 'mock-token' })),
  logout: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signup: jest.fn(() => Promise.resolve({ user: { id: 'mock-user' }, token: 'mock-token' })),
  ...overrides,
})

/**
 * Create a mock QueryClient instance for React Query
 *
 * @param overrides - Partial overrides for custom behavior
 * @returns Mock QueryClient object
 */
export const createMockQueryClient = (overrides = {}) => ({
  invalidateQueries: jest.fn(),
  setQueryData: jest.fn(),
  getQueryData: jest.fn(),
  cancelQueries: jest.fn(),
  clear: jest.fn(),
  prefetchQuery: jest.fn(),
  removeQueries: jest.fn(),
  resetQueries: jest.fn(),
  ...overrides,
})

/**
 * Create a mock axios instance
 *
 * @param overrides - Partial overrides for custom behavior
 * @returns Mock axios object
 */
export const createMockAxios = (overrides = {}) => ({
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  request: jest.fn(),
  ...overrides,
})

/**
 * Create a mock axios create function that returns a mock instance
 *
 * @param baseConfig - Base configuration for the axios instance
 * @returns Mock axios create function
 */
export const createMockAxiosCreate = (baseConfig = {}) => {
  const mockAxios = createMockAxios()
  return jest.fn(() => mockAxios)
}

/**
 * Create mock Next.js router
 *
 * @param overrides - Partial overrides for custom behavior
 * @returns Mock router object
 */
export const createMockRouter = (overrides = {}) => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  ...overrides,
})

/**
 * Create mock localStorage
 *
 * @param initialState - Initial items in localStorage
 * @returns Mock localStorage object
 */
export const createMockLocalStorage = (initialState: Record<string, string> = {}) => {
  let store = { ...initialState }
  return {
    length: Object.keys(store).length,
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  } as Storage
}

/**
 * Create mock Context value for Auth
 *
 * @param overrides - Partial overrides for custom behavior
 * @returns Mock Auth context value
 */
export const createMockAuthContext = (overrides = {}) => ({
  user: null,
  loading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  signup: jest.fn(),
  ...overrides,
})

/**
 * Create mock Context value for Projects
 *
 * @param overrides - Partial overrides for custom behavior
 * @returns Mock Projects context value
 */
export const createMockProjectsContext = (overrides = {}) => ({
  projects: [],
  loading: false,
  error: null,
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  getProjectStats: jest.fn(),
  ...overrides,
})

/**
 * Create mock Context value for Toast
 *
 * @param overrides - Partial overrides for custom behavior
 * @returns Mock Toast context value
 */
export const createMockToastContext = (overrides = {}) => ({
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  ...overrides,
})

/**
 * Create mock Context value for Timer
 *
 * @param overrides - Partial overrides for custom behavior
 * @returns Mock Timer context value
 */
export const createMockTimerContext = (overrides = {}) => ({
  activeSession: null,
  isRunning: false,
  elapsedTime: 0,
  startTimer: jest.fn(),
  stopTimer: jest.fn(),
  resumeTimer: jest.fn(),
  resetTimer: jest.fn(),
  ...overrides,
})
