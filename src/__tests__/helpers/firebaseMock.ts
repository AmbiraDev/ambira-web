/**
 * Firebase Mock Setup for Tests
 * This file sets up global mocks for Firebase to work in Jest environment
 */

// Mock global Response for Firebase Auth
global.Response = class Response {
  constructor(public body: any, public init?: ResponseInit) {}
  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
  text() {
    return Promise.resolve(this.body);
  }
} as any;

// Mock global Request for Firebase Auth
global.Request = class Request {
  constructor(public url: string, public init?: RequestInit) {}
} as any;

// Mock Headers for Firebase Auth
global.Headers = class Headers {
  private headers: Map<string, string> = new Map();

  append(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value);
  }

  get(name: string) {
    return this.headers.get(name.toLowerCase()) || null;
  }

  has(name: string) {
    return this.headers.has(name.toLowerCase());
  }

  set(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value);
  }
} as any;

export {};
