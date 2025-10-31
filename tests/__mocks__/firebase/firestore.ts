/**
 * Mock implementation of Firebase Firestore for testing
 * Provides comprehensive mocking for all Firestore operations
 */

import type {
  DocumentData,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp as FirestoreTimestamp,
} from 'firebase/firestore';

// In-memory data store for mock Firestore
const mockDataStore = new Map<string, Map<string, DocumentData>>();

// Mock document reference
export class MockDocumentReference {
  constructor(
    public readonly collectionPath: string,
    public readonly id: string
  ) {}

  get path() {
    return `${this.collectionPath}/${this.id}`;
  }
}

// Mock collection reference
export class MockCollectionReference {
  constructor(public readonly path: string) {}
}

// Mock query
export class MockQuery {
  private whereClauses: Array<{
    field: string;
    operator: string;
    value: unknown;
  }> = [];
  private orderByClauses: Array<{ field: string; direction: 'asc' | 'desc' }> =
    [];
  private limitValue?: number;
  private startAfterDoc?: QueryDocumentSnapshot;

  constructor(
    private collectionPath: string,
    private data: Map<string, DocumentData> = new Map()
  ) {}

  where(field: string, operator: string, value: unknown) {
    this.whereClauses.push({ field, operator, value });
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    this.orderByClauses.push({ field, direction });
    return this;
  }

  limit(limitValue: number) {
    this.limitValue = limitValue;
    return this;
  }

  startAfter(doc: QueryDocumentSnapshot) {
    this.startAfterDoc = doc;
    return this;
  }

  async get(): Promise<QuerySnapshot> {
    let results = Array.from(this.data.entries());

    // Apply where clauses
    results = results.filter(([_, doc]) => {
      return this.whereClauses.every(clause => {
        const fieldValue = doc[clause.field];
        switch (clause.operator) {
          case '==':
            return fieldValue === clause.value;
          case '!=':
            return fieldValue !== clause.value;
          case '>':
            return (fieldValue as any) > (clause.value as any);
          case '>=':
            return (fieldValue as any) >= (clause.value as any);
          case '<':
            return (fieldValue as any) < (clause.value as any);
          case '<=':
            return (fieldValue as any) <= (clause.value as any);
          case 'in':
            return (
              Array.isArray(clause.value) && clause.value.includes(fieldValue)
            );
          case 'array-contains':
            return (
              Array.isArray(fieldValue) && fieldValue.includes(clause.value)
            );
          default:
            return true;
        }
      });
    });

    // Apply orderBy
    if (this.orderByClauses.length > 0) {
      results.sort((a, b) => {
        for (const { field, direction } of this.orderByClauses) {
          const aVal = a[1][field];
          const bVal = b[1][field];

          if (aVal instanceof Date && bVal instanceof Date) {
            const diff = aVal.getTime() - bVal.getTime();
            if (diff !== 0) return direction === 'asc' ? diff : -diff;
          } else if (aVal < bVal) {
            return direction === 'asc' ? -1 : 1;
          } else if (aVal > bVal) {
            return direction === 'asc' ? 1 : -1;
          }
        }
        return 0;
      });
    }

    // Apply limit
    if (this.limitValue) {
      results = results.slice(0, this.limitValue);
    }

    const docs = results.map(([id, data]) =>
      createMockQueryDocumentSnapshot(this.collectionPath, id, data)
    );

    return createMockQuerySnapshot(docs);
  }
}

// Create mock query document snapshot
function createMockQueryDocumentSnapshot(
  collectionPath: string,
  id: string,
  data: DocumentData
): QueryDocumentSnapshot {
  return {
    id,
    exists: () => true,
    data: () => data,
    get: (field: string) => data[field],
    ref: new MockDocumentReference(collectionPath, id),
    metadata: {
      hasPendingWrites: false,
      fromCache: false,
      isEqual: () => false,
    },
    toJSON: () => ({ id, ...data }),
  } as unknown as QueryDocumentSnapshot;
}

// Create mock document snapshot
function createMockDocumentSnapshot(
  collectionPath: string,
  id: string,
  data: DocumentData | null
): DocumentSnapshot {
  return {
    id,
    exists: () => data !== null,
    data: () => data || undefined,
    get: (field: string) => (data ? data[field] : undefined),
    ref: new MockDocumentReference(collectionPath, id),
    metadata: {
      hasPendingWrites: false,
      fromCache: false,
      isEqual: () => false,
    },
    toJSON: () => (data ? { id, ...data } : { id }),
  } as unknown as DocumentSnapshot;
}

// Create mock query snapshot
function createMockQuerySnapshot(docs: QueryDocumentSnapshot[]): QuerySnapshot {
  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback: (doc: QueryDocumentSnapshot) => void) => {
      docs.forEach(callback);
    },
  } as QuerySnapshot;
}

// Mock Firestore functions
export const mockFirestore = {
  collection: (path: string) => {
    if (!mockDataStore.has(path)) {
      mockDataStore.set(path, new Map());
    }
    return new MockCollectionReference(path);
  },

  doc: (collectionPath: string, docId?: string) => {
    const id = docId || `mock-id-${Date.now()}`;
    return new MockDocumentReference(collectionPath, id);
  },

  getDoc: async (ref: MockDocumentReference) => {
    const collection = mockDataStore.get(ref.collectionPath);
    const data = collection?.get(ref.id) || null;
    return createMockDocumentSnapshot(ref.collectionPath, ref.id, data);
  },

  getDocs: async (query: MockQuery) => {
    return query.get();
  },

  addDoc: async (ref: MockCollectionReference, data: DocumentData) => {
    const collection =
      mockDataStore.get(ref.path) || new Map<string, DocumentData>();
    const id = `mock-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const docData = {
      ...data,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };

    collection.set(id, docData);
    mockDataStore.set(ref.path, collection);

    return new MockDocumentReference(ref.path, id);
  },

  setDoc: async (
    ref: MockDocumentReference,
    data: DocumentData,
    options?: { merge?: boolean }
  ) => {
    const collection =
      mockDataStore.get(ref.collectionPath) || new Map<string, DocumentData>();

    if (options?.merge) {
      const existing = collection.get(ref.id) || {};
      collection.set(ref.id, { ...existing, ...data });
    } else {
      collection.set(ref.id, data);
    }

    mockDataStore.set(ref.collectionPath, collection);
  },

  updateDoc: async (ref: MockDocumentReference, data: DocumentData) => {
    const collection = mockDataStore.get(ref.collectionPath);
    if (!collection) {
      throw new Error(`Collection ${ref.collectionPath} not found`);
    }

    const existing = collection.get(ref.id);
    if (!existing) {
      throw new Error(`Document ${ref.id} not found in ${ref.collectionPath}`);
    }

    collection.set(ref.id, { ...existing, ...data, updatedAt: new Date() });
  },

  deleteDoc: async (ref: MockDocumentReference) => {
    const collection = mockDataStore.get(ref.collectionPath);
    if (collection) {
      collection.delete(ref.id);
    }
  },

  query: (ref: MockCollectionReference | MockQuery) => {
    const collectionPath =
      ref instanceof MockCollectionReference ? ref.path : ref['collectionPath'];
    const data = mockDataStore.get(collectionPath) || new Map();
    return new MockQuery(collectionPath, data);
  },

  where: (field: string, operator: string, value: unknown) => ({
    field,
    operator,
    value,
  }),

  orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') => ({
    field,
    direction,
  }),

  limit: (limitValue: number) => ({ limitValue }),

  startAfter: (doc: QueryDocumentSnapshot) => ({ startAfter: doc }),

  // Batch operations
  writeBatch: () => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  }),

  // Field values
  increment: (value: number) => ({ _type: 'increment', value }),
  arrayUnion: (...elements: unknown[]) => ({ _type: 'arrayUnion', elements }),
  arrayRemove: (...elements: unknown[]) => ({
    _type: 'arrayRemove',
    elements,
  }),
  serverTimestamp: () => ({ _type: 'serverTimestamp' }),

  // Timestamp mock functions
  TimestampNow: () => ({
    toDate: () => new Date(),
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0,
  }),
  TimestampFromDate: (date: Date) => ({
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  }),

  // Utility to clear all data
  _clearAll: () => {
    mockDataStore.clear();
  },

  // Utility to seed data
  _seedData: (collectionPath: string, id: string, data: DocumentData) => {
    const collection =
      mockDataStore.get(collectionPath) || new Map<string, DocumentData>();
    collection.set(id, data);
    mockDataStore.set(collectionPath, collection);
  },

  // Utility to get all data
  _getAllData: (collectionPath: string) => {
    return mockDataStore.get(collectionPath);
  },
};

// Export mock functions for jest.mock
export const collection = mockFirestore.collection;
export const doc = mockFirestore.doc;
export const getDoc = mockFirestore.getDoc;
export const getDocs = mockFirestore.getDocs;
export const addDoc = mockFirestore.addDoc;
export const setDoc = mockFirestore.setDoc;
export const updateDoc = mockFirestore.updateDoc;
export const deleteDoc = mockFirestore.deleteDoc;
export const query = mockFirestore.query;
export const where = mockFirestore.where;
export const orderBy = mockFirestore.orderBy;
export const limit = mockFirestore.limit;
export const startAfter = mockFirestore.startAfter;
export const writeBatch = mockFirestore.writeBatch;
export const increment = mockFirestore.increment;
export const arrayUnion = mockFirestore.arrayUnion;
export const arrayRemove = mockFirestore.arrayRemove;
export const serverTimestamp = mockFirestore.serverTimestamp;

// Export Timestamp as an object matching Firebase's API
export const Timestamp = {
  now: mockFirestore.TimestampNow,
  fromDate: mockFirestore.TimestampFromDate,
};
