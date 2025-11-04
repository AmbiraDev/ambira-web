/**
 * Mock API client for testing
 * Provides comprehensive HTTP request mocking
 */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface MockResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

interface MockRequest {
  method: HttpMethod;
  url: string;
  data?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}

// Store mock responses
const mockResponses = new Map<string, MockResponse>();
const requestHistory: MockRequest[] = [];

// Helper to create response key
function createResponseKey(method: HttpMethod, url: string): string {
  return `${method}:${url}`;
}

// Mock API client
export const mockApiClient = {
  get: jest.fn().mockImplementation(
    async <T = unknown>(
      url: string,
      config?: {
        params?: Record<string, string>;
        headers?: Record<string, string>;
      }
    ): Promise<MockResponse<T>> => {
      requestHistory.push({
        method: 'GET',
        url,
        params: config?.params,
        headers: config?.headers,
      });

      const key = createResponseKey('GET', url);
      const response = mockResponses.get(key);

      if (response) {
        if (response.status >= 400) {
          throw {
            response: {
              status: response.status,
              data: response.data,
              statusText: response.statusText,
            },
            message: `Request failed with status code ${response.status}`,
          };
        }
        return response as MockResponse<T>;
      }

      // Default successful response
      return {
        data: {} as T,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
      };
    }
  ),

  post: jest
    .fn()
    .mockImplementation(
      async <T = unknown>(
        url: string,
        data?: unknown,
        config?: { headers?: Record<string, string> }
      ): Promise<MockResponse<T>> => {
        requestHistory.push({
          method: 'POST',
          url,
          data,
          headers: config?.headers,
        });

        const key = createResponseKey('POST', url);
        const response = mockResponses.get(key);

        if (response) {
          if (response.status >= 400) {
            throw {
              response: {
                status: response.status,
                data: response.data,
                statusText: response.statusText,
              },
              message: `Request failed with status code ${response.status}`,
            };
          }
          return response as MockResponse<T>;
        }

        // Default successful response
        return {
          data: data as T,
          status: 201,
          statusText: 'Created',
          headers: { 'content-type': 'application/json' },
        };
      }
    ),

  put: jest
    .fn()
    .mockImplementation(
      async <T = unknown>(
        url: string,
        data?: unknown,
        config?: { headers?: Record<string, string> }
      ): Promise<MockResponse<T>> => {
        requestHistory.push({
          method: 'PUT',
          url,
          data,
          headers: config?.headers,
        });

        const key = createResponseKey('PUT', url);
        const response = mockResponses.get(key);

        if (response) {
          if (response.status >= 400) {
            throw {
              response: {
                status: response.status,
                data: response.data,
                statusText: response.statusText,
              },
              message: `Request failed with status code ${response.status}`,
            };
          }
          return response as MockResponse<T>;
        }

        // Default successful response
        return {
          data: data as T,
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
        };
      }
    ),

  patch: jest
    .fn()
    .mockImplementation(
      async <T = unknown>(
        url: string,
        data?: unknown,
        config?: { headers?: Record<string, string> }
      ): Promise<MockResponse<T>> => {
        requestHistory.push({
          method: 'PATCH',
          url,
          data,
          headers: config?.headers,
        });

        const key = createResponseKey('PATCH', url);
        const response = mockResponses.get(key);

        if (response) {
          if (response.status >= 400) {
            throw {
              response: {
                status: response.status,
                data: response.data,
                statusText: response.statusText,
              },
              message: `Request failed with status code ${response.status}`,
            };
          }
          return response as MockResponse<T>;
        }

        // Default successful response
        return {
          data: data as T,
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
        };
      }
    ),

  delete: jest
    .fn()
    .mockImplementation(
      async <T = unknown>(
        url: string,
        config?: { headers?: Record<string, string> }
      ): Promise<MockResponse<T>> => {
        requestHistory.push({
          method: 'DELETE',
          url,
          headers: config?.headers,
        });

        const key = createResponseKey('DELETE', url);
        const response = mockResponses.get(key);

        if (response) {
          if (response.status >= 400) {
            throw {
              response: {
                status: response.status,
                data: response.data,
                statusText: response.statusText,
              },
              message: `Request failed with status code ${response.status}`,
            };
          }
          return response as MockResponse<T>;
        }

        // Default successful response
        return {
          data: {} as T,
          status: 204,
          statusText: 'No Content',
          headers: { 'content-type': 'application/json' },
        };
      }
    ),

  // Utility functions for testing
  mockResponse: <T = unknown>(
    method: HttpMethod,
    url: string,
    response: Partial<MockResponse<T>>
  ) => {
    const key = createResponseKey(method, url);
    mockResponses.set(key, {
      data: response.data as T,
      status: response.status || 200,
      statusText: response.statusText || 'OK',
      headers: response.headers || { 'content-type': 'application/json' },
    });
  },

  mockError: (
    method: HttpMethod,
    url: string,
    status: number,
    message?: string
  ) => {
    const key = createResponseKey(method, url);
    mockResponses.set(key, {
      data: { error: message || 'Error occurred' },
      status,
      statusText: message || 'Error',
      headers: { 'content-type': 'application/json' },
    });
  },

  getRequestHistory: () => [...requestHistory],

  getLastRequest: () => requestHistory[requestHistory.length - 1],

  clearRequestHistory: () => {
    requestHistory.length = 0;
  },

  clearMockResponses: () => {
    mockResponses.clear();
  },

  reset: () => {
    mockResponses.clear();
    requestHistory.length = 0;
    mockApiClient.get.mockClear();
    mockApiClient.post.mockClear();
    mockApiClient.put.mockClear();
    mockApiClient.patch.mockClear();
    mockApiClient.delete.mockClear();
  },
};

// Export for convenient use
export const {
  get,
  post,
  put,
  patch,
  delete: deleteRequest,
  mockResponse,
  mockError,
  getRequestHistory,
  getLastRequest,
  clearRequestHistory,
  clearMockResponses,
  reset: resetApiMock,
} = mockApiClient;

export default mockApiClient;
