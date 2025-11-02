/**
 * Mock implementation of Firebase Storage for testing
 */

import type { StorageReference, UploadResult } from 'firebase/storage';

// Mock storage data
const mockStorageData = new Map<string, Blob>();

// Mock storage reference
export class MockStorageReference {
  constructor(
    public readonly fullPath: string,
    public readonly name: string
  ) {}

  toString() {
    return `gs://mock-bucket/${this.fullPath}`;
  }
}

// Mock upload result
function createMockUploadResult(ref: MockStorageReference): UploadResult {
  return {
    ref: ref as unknown as StorageReference,
    metadata: {
      bucket: 'mock-bucket',
      fullPath: ref.fullPath,
      generation: '1',
      metageneration: '1',
      name: ref.name,
      size: 1024,
      timeCreated: new Date().toISOString(),
      updated: new Date().toISOString(),
      md5Hash: 'mock-md5-hash',
      contentType: 'image/jpeg',
      downloadTokens: ['mock-download-token'],
    },
  };
}

// Mock Storage functions
export const mockStorage = {
  ref: jest.fn().mockImplementation((storage: unknown, path?: string) => {
    const fullPath = path || '';
    const pathParts = fullPath.split('/');
    const name = pathParts[pathParts.length - 1] || '';
    return new MockStorageReference(fullPath, name);
  }),

  uploadBytes: jest
    .fn()
    .mockImplementation(
      async (ref: MockStorageReference, data: Blob, _metadata?: unknown) => {
        mockStorageData.set(ref.fullPath, data);
        return createMockUploadResult(ref);
      }
    ),

  uploadBytesResumable: jest
    .fn()
    .mockImplementation((ref: MockStorageReference, data: Blob) => {
      // Mock upload task
      const task = {
        on: jest.fn(
          (
            event: string,
            nextOrObserver: unknown,
            error?: (error: Error) => void,
            complete?: () => void
          ) => {
            // Simulate successful upload
            if (typeof complete === 'function') {
              setTimeout(complete, 100);
            }
            return jest.fn(); // unsubscribe function
          }
        ),
        snapshot: {
          bytesTransferred: data.size,
          totalBytes: data.size,
          state: 'success',
          ref,
        },
        then: jest.fn((onFulfilled: (snapshot: unknown) => void) => {
          mockStorageData.set(ref.fullPath, data);
          const result = createMockUploadResult(ref);
          onFulfilled(result);
          return Promise.resolve(result);
        }),
        catch: jest.fn(),
      };

      return task;
    }),

  uploadString: jest
    .fn()
    .mockImplementation(
      async (
        ref: MockStorageReference,
        data: string,
        _format?: string,
        _metadata?: unknown
      ) => {
        const blob = new Blob([data], { type: 'text/plain' });
        mockStorageData.set(ref.fullPath, blob);
        return createMockUploadResult(ref);
      }
    ),

  getDownloadURL: jest
    .fn()
    .mockImplementation(async (ref: MockStorageReference) => {
      if (!mockStorageData.has(ref.fullPath)) {
        throw new Error('storage/object-not-found');
      }
      return `https://firebasestorage.googleapis.com/v0/b/mock-bucket/o/${encodeURIComponent(ref.fullPath)}?alt=media`;
    }),

  deleteObject: jest
    .fn()
    .mockImplementation(async (ref: MockStorageReference) => {
      mockStorageData.delete(ref.fullPath);
    }),

  listAll: jest.fn().mockImplementation(async (ref: MockStorageReference) => {
    const items: MockStorageReference[] = [];
    const prefixes: MockStorageReference[] = [];

    mockStorageData.forEach((_, path) => {
      if (path.startsWith(ref.fullPath)) {
        const relativePath = path
          .substring(ref.fullPath.length)
          .replace(/^\//, '');
        const parts = relativePath.split('/');

        if (parts.length === 1 && parts[0]) {
          // Direct child file
          items.push(new MockStorageReference(path, parts[0]));
        } else if (parts[0]) {
          // Directory
          const prefix = `${ref.fullPath}/${parts[0]}`;
          if (!prefixes.find(p => p.fullPath === prefix)) {
            prefixes.push(new MockStorageReference(prefix, parts[0]));
          }
        }
      }
    });

    return { items, prefixes, nextPageToken: undefined };
  }),

  getMetadata: jest
    .fn()
    .mockImplementation(async (ref: MockStorageReference) => {
      if (!mockStorageData.has(ref.fullPath)) {
        throw new Error('storage/object-not-found');
      }

      return {
        bucket: 'mock-bucket',
        fullPath: ref.fullPath,
        generation: '1',
        metageneration: '1',
        name: ref.name,
        size: 1024,
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString(),
        md5Hash: 'mock-md5-hash',
        contentType: 'image/jpeg',
        downloadTokens: undefined,
      };
    }),

  updateMetadata: jest
    .fn()
    .mockImplementation(
      async (ref: MockStorageReference, metadata: Record<string, unknown>) => {
        if (!mockStorageData.has(ref.fullPath)) {
          throw new Error('storage/object-not-found');
        }

        return {
          bucket: 'mock-bucket',
          fullPath: ref.fullPath,
          generation: '1',
          metageneration: '2',
          name: ref.name,
          size: 1024,
          timeCreated: new Date().toISOString(),
          updated: new Date().toISOString(),
          md5Hash: 'mock-md5-hash',
          contentType: 'image/jpeg',
          downloadTokens: undefined,
          ...metadata,
        };
      }
    ),

  // Utility functions for testing
  _clearAll: () => {
    mockStorageData.clear();
  },

  _seedFile: (path: string, data: Blob) => {
    mockStorageData.set(path, data);
  },

  _hasFile: (path: string) => {
    return mockStorageData.has(path);
  },

  _getFile: (path: string) => {
    return mockStorageData.get(path);
  },

  _getAllFiles: () => {
    return Array.from(mockStorageData.keys());
  },

  _reset: () => {
    mockStorageData.clear();
    mockStorage.ref.mockClear();
    mockStorage.uploadBytes.mockClear();
    mockStorage.uploadBytesResumable.mockClear();
    mockStorage.uploadString.mockClear();
    mockStorage.getDownloadURL.mockClear();
    mockStorage.deleteObject.mockClear();
    mockStorage.listAll.mockClear();
    mockStorage.getMetadata.mockClear();
    mockStorage.updateMetadata.mockClear();
  },
};

// Export individual functions for jest.mock
export const ref = mockStorage.ref;
export const uploadBytes = mockStorage.uploadBytes;
export const uploadBytesResumable = mockStorage.uploadBytesResumable;
export const uploadString = mockStorage.uploadString;
export const getDownloadURL = mockStorage.getDownloadURL;
export const deleteObject = mockStorage.deleteObject;
export const listAll = mockStorage.listAll;
export const getMetadata = mockStorage.getMetadata;
export const updateMetadata = mockStorage.updateMetadata;
