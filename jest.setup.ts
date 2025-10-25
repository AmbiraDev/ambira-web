import '@testing-library/jest-dom'

// Mock global Response, Request, Headers for Firebase Auth compatibility
if (typeof global.Response === 'undefined') {
  (global as any).Response = class Response {
    body: any
    init: any

    constructor(body: any, init: any) {
      this.body = body
      this.init = init
    }

    json(): Promise<any> {
      return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body)
    }

    text(): Promise<string> {
      return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body))
    }
  }
}

if (typeof global.Request === 'undefined') {
  (global as any).Request = class Request {
    url: string
    init: any

    constructor(url: string, init: any) {
      this.url = url
      this.init = init
    }
  }
}

if (typeof global.Headers === 'undefined') {
  (global as any).Headers = class Headers {
    headers: Map<string, string>

    constructor() {
      this.headers = new Map()
    }

    append(name: string, value: string): void {
      this.headers.set(name.toLowerCase(), value)
    }

    get(name: string): string | null {
      return this.headers.get(name.toLowerCase()) || null
    }

    has(name: string): boolean {
      return this.headers.has(name.toLowerCase())
    }

    set(name: string, value: string): void {
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
if (typeof window !== 'undefined' && !(window as any).location) {
  (window as any).location = {
    href: 'http://localhost:3000',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  }
}

// Mock localStorage
const localStorageMock: Storage = {
  length: 0,
  key: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock: Storage = {
  length: 0,
  key: jest.fn(),
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
  (global as any).fetch = jest.fn(async () => ({
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
    USER_STATS: (userId: string) => ['user', 'stats', userId],
    USER_PROFILE: (userId: string) => ['user', 'profile', userId],
    FEED_SESSIONS: (limit: number, cursor: string | null, filters: any) => ['feed', 'sessions', limit, cursor, filters],
    SESSION: (sessionId: string) => ['session', sessionId],
    COMMENTS: (sessionId: string) => ['comments', sessionId],
  },
  CACHE_TIMES: {
    REAL_TIME: 30 * 1000,
    SHORT: 1 * 60 * 1000,
    MEDIUM: 5 * 60 * 1000,
    LONG: 15 * 60 * 1000,
  },
}))
