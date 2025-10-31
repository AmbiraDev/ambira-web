/**
 * Central Firebase mocks export
 * Import this in test setup to mock all Firebase services
 */

export * from './auth';
export * from './firestore';
export * from './storage';

// Mock Firebase app initialization
export const mockFirebaseApp = {
  name: '[DEFAULT]',
  options: {
    apiKey: 'mock-api-key',
    authDomain: 'mock-app.firebaseapp.com',
    projectId: 'mock-project-id',
    storageBucket: 'mock-app.appspot.com',
    messagingSenderId: 'mock-sender-id',
    appId: 'mock-app-id',
  },
  automaticDataCollectionEnabled: false,
};

export const initializeApp = jest.fn(() => mockFirebaseApp);
export const getApp = jest.fn(() => mockFirebaseApp);
export const getApps = jest.fn(() => [mockFirebaseApp]);
export const deleteApp = jest.fn().mockResolvedValue(undefined);
