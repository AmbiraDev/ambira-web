import '@testing-library/jest-dom'

// Mock global Response, Request, Headers for Firebase Auth compatibility
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body
      this.init = init
    }
    json() {
      return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body)
    }
    text() {
      return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body))
    }
  }
}

if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(url, init) {
      this.url = url
      this.init = init
    }
  }
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor() {
      this.headers = new Map()
    }
    append(name, value) {
      this.headers.set(name.toLowerCase(), value)
    }
    get(name) {
      return this.headers.get(name.toLowerCase()) || null
    }
    has(name) {
      return this.headers.has(name.toLowerCase())
    }
    set(name, value) {
      this.headers.set(name.toLowerCase(), value)
    }
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => () => {
  const DynamicComponent = () => null
  DynamicComponent.displayName = 'LoadableComponent'
  DynamicComponent.preload = jest.fn()
  return DynamicComponent
})

// Mock window.location - simplified
if (typeof window !== 'undefined' && !window.location) {
  window.location = {
    href: 'http://localhost:3000',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  };
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Provide a minimal global fetch for libraries that expect it in Node test env
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
  }))
}

// Provide a default axios mock so tests don't need to re-declare it and to avoid TDZ issues
jest.mock('axios', () => {
  const mockAxios = {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
  return {
    create: jest.fn(() => mockAxios),
  }
})

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  },
  db: {
    collection: jest.fn(),
  },
  storage: {
    ref: jest.fn(),
  },
}))

// Mock Firebase API
jest.mock('@/lib/firebaseApi', () => ({
  firebaseApi: {
    getSessions: jest.fn(() => Promise.resolve({ sessions: [], nextCursor: null })),
    getSession: jest.fn(() => Promise.resolve(null)),
    createSession: jest.fn(() => Promise.resolve({ id: 'mock-session' })),
    updateSession: jest.fn(() => Promise.resolve()),
    deleteSession: jest.fn(() => Promise.resolve()),
  },
}))

// Mock React Query
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query')
  return {
    ...actual,
    QueryClient: jest.fn().mockImplementation(() => ({
      invalidateQueries: jest.fn(),
      setQueryData: jest.fn(),
      getQueryData: jest.fn(),
      cancelQueries: jest.fn(),
      clear: jest.fn(),
    })),
  }
})

// Mock queryClient
jest.mock('@/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
    cancelQueries: jest.fn(),
    clear: jest.fn(),
  },
  CACHE_KEYS: {
    USER_STATS: (userId) => ['user', 'stats', userId],
    USER_PROFILE: (userId) => ['user', 'profile', userId],
    FEED_SESSIONS: (limit, cursor, filters) => ['feed', 'sessions', limit, cursor, filters],
    SESSION: (sessionId) => ['session', sessionId],
    COMMENTS: (sessionId) => ['comments', sessionId],
  },
  CACHE_TIMES: {
    REAL_TIME: 30 * 1000,
    SHORT: 1 * 60 * 1000,
    MEDIUM: 5 * 60 * 1000,
    LONG: 15 * 60 * 1000,
  },
}))
