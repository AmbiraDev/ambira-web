/**
 * Firebase Feed Integration Tests
 * Tests loading and displaying images from Firestore in the feed
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { getDocs, query, where, orderBy, limit, getDoc, doc } from 'firebase/firestore';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('token')
    }
  },
  db: { _type: 'firestore' },
  storage: { _type: 'storage' }
}));

jest.mock('firebase/firestore', () => ({
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  doc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    fromDate: (date: Date) => date,
    now: () => new Date()
  },
  writeBatch: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn()
}));

// Mock Next.js
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  }
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>
}));

// Import after all mocks are set
import { firebaseSessionApi } from '@/lib/api';

describe('Firebase Feed Images Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading images from Firestore', () => {
    it('should load sessions with and without images from Firestore', async () => {
      const mockSessionsData = [
        {
          id: 'session1',
          userId: 'user1',
          projectId: 'proj1',
          title: 'Session with Images',
          description: 'Great work today',
          duration: 3600,
          startTime: new Date('2024-01-01'),
          tasks: [],
          tags: ['Work'],
          visibility: 'everyone',
          images: [
            'https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/session-images%2Fuser1%2Fimage1.jpg?alt=media&token=abc',
            'https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/session-images%2Fuser1%2Fimage2.jpg?alt=media&token=def'
          ],
          supportCount: 5,
          commentCount: 3,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 'session2',
          userId: 'user2',
          projectId: 'proj2',
          title: 'Session without Images',
          description: 'Quick session',
          duration: 1800,
          startTime: new Date('2024-01-02'),
          tasks: [],
          tags: [],
          visibility: 'everyone',
          images: [],
          supportCount: 2,
          commentCount: 1,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02')
        }
      ];

      // Mock Firestore query
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSessionsData.map(data => ({
          id: data.id,
          data: () => data,
          exists: () => true
        }))
      });

      // Mock user data
      (getDoc as jest.Mock).mockImplementation((docRef) => {
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            name: 'Test User',
            username: 'testuser',
            email: 'test@example.com',
            profilePicture: 'https://example.com/avatar.jpg'
          })
        });
      });

      (query as jest.Mock).mockReturnValue('mock-query');
      (where as jest.Mock).mockReturnValue('mock-where');
      (orderBy as jest.Mock).mockReturnValue('mock-orderby');
      (limit as jest.Mock).mockReturnValue('mock-limit');

      const result = await firebaseSessionApi.getSessions(20, undefined);

      // Verify sessions were loaded
      expect(result.sessions).toHaveLength(2);

      // Verify first session has images
      const sessionWithImages = result.sessions[0];
      expect(sessionWithImages.images).toBeDefined();
      expect(sessionWithImages.images!).toHaveLength(2);
      expect(sessionWithImages.images![0]).toContain('firebasestorage.googleapis.com');
      expect(sessionWithImages.images![0]).toContain('?alt=media&token=');

      // Verify second session has no images
      const sessionWithoutImages = result.sessions[1];
      expect(sessionWithoutImages.images).toEqual([]);
    });

    it('should default to empty array when session has undefined images field', async () => {
      const mockLegacySession = {
        id: 'legacy',
        userId: 'user1',
        title: 'Old Session',
        duration: 1800,
        // No images field
        visibility: 'everyone',
        supportCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (getDocs as jest.Mock).mockResolvedValue({
        docs: [{
          id: mockLegacySession.id,
          data: () => mockLegacySession,
          exists: () => true
        }]
      });

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          name: 'User',
          username: 'user',
          email: 'user@example.com'
        })
      });

      (query as jest.Mock).mockReturnValue('mock-query');

      const result = await firebaseSessionApi.getSessions(10);

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].images).toEqual([]);
    });

    it('should preserve image order from Firestore', async () => {
      const orderedImages = [
        'https://firebasestorage.googleapis.com/image1.jpg',
        'https://firebasestorage.googleapis.com/image2.jpg',
        'https://firebasestorage.googleapis.com/image3.jpg'
      ];

      const mockSession = {
        id: 'session1',
        userId: 'user1',
        title: 'Session',
        duration: 3600,
        images: orderedImages,
        visibility: 'everyone',
        supportCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (getDocs as jest.Mock).mockResolvedValue({
        docs: [{
          id: mockSession.id,
          data: () => mockSession,
          exists: () => true
        }]
      });

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          name: 'User',
          username: 'user',
          email: 'user@example.com'
        })
      });

      (query as jest.Mock).mockReturnValue('mock-query');

      const result = await firebaseSessionApi.getSessions(10);

      expect(result.sessions[0].images).toEqual(orderedImages);
      expect(result.sessions[0].images![0]).toBe(orderedImages[0]);
      expect(result.sessions[0].images![2]).toBe(orderedImages[2]);
    });
  });

  describe('Filtering sessions by image presence', () => {
    it('should load and distinguish sessions based on image presence', async () => {
      const mockSessions = [
        {
          id: 's1',
          userId: 'u1',
          title: 'With Images',
          duration: 3600,
          images: ['https://storage.url/img.jpg'],
          visibility: 'everyone',
          supportCount: 0,
          commentCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 's2',
          userId: 'u2',
          title: 'No Images',
          duration: 1800,
          images: [],
          visibility: 'everyone',
          supportCount: 0,
          commentCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSessions.map(s => ({
          id: s.id,
          data: () => s,
          exists: () => true
        }))
      });

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ name: 'User', username: 'user', email: 'user@example.com' })
      });

      (query as jest.Mock).mockReturnValue('mock-query');

      const result = await firebaseSessionApi.getSessions(10);

      const withImages = result.sessions.filter((s: any) => s.images && s.images.length > 0);
      const withoutImages = result.sessions.filter((s: any) => !s.images || s.images.length === 0);

      expect(withImages).toHaveLength(1);
      expect(withoutImages).toHaveLength(1);
    });
  });

  describe('Image URL validation in Firestore data', () => {
    it('should validate that image URLs are valid Firebase Storage URLs', async () => {
      const mockSession = {
        id: 'session1',
        userId: 'user1',
        title: 'Session',
        duration: 3600,
        images: [
          'https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/path?alt=media&token=abc'
        ],
        visibility: 'everyone',
        supportCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (getDocs as jest.Mock).mockResolvedValue({
        docs: [{
          id: mockSession.id,
          data: () => mockSession,
          exists: () => true
        }]
      });

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ name: 'User', username: 'user', email: 'user@example.com' })
      });

      (query as jest.Mock).mockReturnValue('mock-query');

      const result = await firebaseSessionApi.getSessions(10);

      const imageUrl = result.sessions[0].images![0];

      // Validate URL format
      expect(imageUrl).toMatch(/^https:\/\/firebasestorage\.googleapis\.com/);
      expect(imageUrl).toContain('?alt=media&token=');
    });

    it('should properly handle sessions with maximum 3 images', async () => {
      const mockSession = {
        id: 'session1',
        userId: 'user1',
        title: 'Session with Max Images',
        duration: 3600,
        images: [
          'https://firebasestorage.googleapis.com/image1.jpg',
          'https://firebasestorage.googleapis.com/image2.jpg',
          'https://firebasestorage.googleapis.com/image3.jpg'
        ],
        visibility: 'everyone',
        supportCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (getDocs as jest.Mock).mockResolvedValue({
        docs: [{
          id: mockSession.id,
          data: () => mockSession,
          exists: () => true
        }]
      });

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ name: 'User', username: 'user', email: 'user@example.com' })
      });

      (query as jest.Mock).mockReturnValue('mock-query');

      const result = await firebaseSessionApi.getSessions(10);

      expect(result.sessions[0].images).toHaveLength(3);
      expect(result.sessions[0].images!.length).toBeLessThanOrEqual(3);
    });
  });

  describe('populateSessionsWithDetails with images', () => {
    it('should include images field when populating session details from Firestore', async () => {
      const mockSessionDoc = {
        id: 'session-123',
        data: () => ({
          userId: 'user1',
          projectId: 'proj1',
          title: 'Test Session',
          description: 'Description',
          duration: 3600,
          startTime: new Date(),
          tasks: [],
          tags: ['Work'],
          visibility: 'everyone',
          images: [
            'https://firebasestorage.googleapis.com/image1.jpg',
            'https://firebasestorage.googleapis.com/image2.jpg'
          ],
          supportCount: 5,
          commentCount: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        exists: () => true
      };

      // Mock user data fetch
      (getDoc as jest.Mock).mockImplementation((docRef) => {
        const path = JSON.stringify(docRef);
        if (path.includes('users')) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({
              name: 'Test User',
              username: 'testuser',
              email: 'test@example.com',
              profilePicture: 'https://example.com/avatar.jpg'
            })
          });
        }
        if (path.includes('projects')) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({
              name: 'Test Project',
              icon: '📝',
              color: '#007AFF'
            })
          });
        }
        return Promise.resolve({
          exists: () => false,
          data: () => ({})
        });
      });

      // Import and test populateSessionsWithDetails
      const { populateSessionsWithDetails } = require('@/lib/firebaseApi');

      // This function is not exported, but we can test through getFeedSessions
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [mockSessionDoc]
      });

      (query as jest.Mock).mockReturnValue('mock-query');

      const result = await firebaseSessionApi.getSessions(10);

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].images).toBeDefined();
      expect(result.sessions[0].images!).toHaveLength(2);
      expect((result.sessions[0] as any).user).toBeDefined();
      expect((result.sessions[0] as any).activity || (result.sessions[0] as any).project).toBeDefined();
    });
  });

  describe('Feed performance with images', () => {
    it('should load and filter multiple sessions with images within acceptable performance time', async () => {
      const mockSessions = Array.from({ length: 20 }, (_, i) => ({
        id: `session${i}`,
        userId: `user${i}`,
        projectId: `proj${i}`,
        title: `Session ${i}`,
        duration: 3600,
        images: i % 2 === 0 ? [
          `https://firebasestorage.googleapis.com/image${i}_1.jpg`,
          `https://firebasestorage.googleapis.com/image${i}_2.jpg`
        ] : [],
        visibility: 'everyone',
        supportCount: i,
        commentCount: i * 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSessions.map(s => ({
          id: s.id,
          data: () => s,
          exists: () => true
        }))
      });

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ name: 'User', username: 'user', email: 'user@example.com' })
      });

      (query as jest.Mock).mockReturnValue('mock-query');

      const startTime = Date.now();
      const result = await firebaseSessionApi.getSessions(20);
      const endTime = Date.now();

      // Verify all sessions loaded
      expect(result.sessions).toHaveLength(20);

      // Verify alternating image presence
      const withImages = result.sessions.filter((s: any) => s.images && s.images.length > 0);
      expect(withImages).toHaveLength(10);

      // Should complete reasonably fast
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});
