import '@testing-library/jest-dom';

// Mock global Response, Request, Headers for Firebase Auth compatibility
if (typeof global.Response === 'undefined') {
  (global as any).Response = class Response {
    body: any;
    init: any;

    constructor(body: any, init: any) {
      this.body = body;
      this.init = init;
    }

    json(): Promise<any> {
      return Promise.resolve(
        typeof this.body === 'string' ? JSON.parse(this.body) : this.body
      );
    }

    text(): Promise<string> {
      return Promise.resolve(
        typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
      );
    }
  };
}

if (typeof global.Request === 'undefined') {
  (global as any).Request = class Request {
    url: string;
    init: any;

    constructor(url: string, init: any) {
      this.url = url;
      this.init = init;
    }
  };
}

if (typeof global.Headers === 'undefined') {
  (global as any).Headers = class Headers {
    headers: Map<string, string>;

    constructor() {
      this.headers = new Map();
    }

    append(name: string, value: string): void {
      this.headers.set(name.toLowerCase(), value);
    }

    get(name: string): string | null {
      return this.headers.get(name.toLowerCase()) || null;
    }

    has(name: string): boolean {
      return this.headers.has(name.toLowerCase());
    }

    set(name: string, value: string): void {
      this.headers.set(name.toLowerCase(), value);
    }
  };
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
}));

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => () => {
  const DynamicComponent = () => null;
  DynamicComponent.displayName = 'LoadableComponent';
  DynamicComponent.preload = jest.fn();
  return DynamicComponent;
});

// Mock window.location - simplified
if (typeof window !== 'undefined' && !(window as any).location) {
  (window as any).location = {
    href: 'http://localhost:3000',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  };
}

// Mock localStorage
const localStorageMock: Storage = {
  length: 0,
  key: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock: Storage = {
  length: 0,
  key: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Provide a minimal global fetch for libraries that expect it in Node test env
if (typeof global.fetch === 'undefined') {
  (global as any).fetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
  }));
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
  };
  return {
    create: jest.fn(() => mockAxios),
  };
});

// Mock window.alert for components that use alert()
window.alert = jest.fn();

// NOTE: Firebase, API, and QueryClient mocks have been migrated to factory functions
// in src/__tests__/fixtures/mocks.ts for better test isolation.
//
// Global mocks have been removed to enforce test isolation. Each test should create
// its own mocks using the factory functions. This prevents state leakage between tests
// and makes mock behavior explicit and testable.
//
// To mock services in your tests, import and use the factory functions:
//
// Example:
// ```typescript
// import { createMockFirebaseSessionApi, createMockQueryClient } from '@/__tests__/fixtures/mocks';
//
// jest.mock('@/lib/api', () => ({
//   firebaseSessionApi: createMockFirebaseSessionApi(),
// }));
//
// jest.mock('@/lib/queryClient', () => ({
//   queryClient: createMockQueryClient(),
// }));
// ```
//
// See src/__tests__/fixtures/README.md for comprehensive documentation on using mock factories.
