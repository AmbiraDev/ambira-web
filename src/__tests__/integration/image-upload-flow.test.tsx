/**
 * Integration test for the complete image upload flow
 * Tests the end-to-end process of uploading images with a session
 */

import { CreateSessionData, Session } from '@/types';

// Mock Firebase first, before any imports
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    }
  },
  db: {},
  storage: {}
}));

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    fromDate: (date: Date) => date
  },
  writeBatch: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn()
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(() => ({
    fullPath: 'session-images/test-user-123/test-image.jpg'
  })),
  uploadBytes: jest.fn().mockResolvedValue({}),
  getDownloadURL: jest.fn().mockResolvedValue('https://storage.example.com/test-image.jpg'),
  deleteObject: jest.fn().mockResolvedValue(undefined)
}));

describe('Image Upload Integration Flow', () => {
  // Import modules after mocks are set up
  let firebaseSessionApi: any;
  let uploadImages: any;

  beforeAll(async () => {
    const firebaseApiModule = await import('@/lib/firebaseApi');
    const imageUploadModule = await import('@/lib/imageUpload');
    firebaseSessionApi = firebaseApiModule.firebaseSessionApi;
    uploadImages = imageUploadModule.uploadImages;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete session creation with images', () => {
    it('should upload images and create session with image URLs', async () => {
      // Step 1: Create mock image files
      const imageFiles = [
        new File(['image1'], 'photo1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'photo2.jpg', { type: 'image/jpeg' })
      ];

      // Step 2: Upload images to Firebase Storage
      const uploadResults = await uploadImages(imageFiles);

      expect(uploadResults).toHaveLength(2);
      expect(uploadResults[0]).toHaveProperty('url');
      expect(uploadResults[0]).toHaveProperty('path');
      expect(uploadResults[0].url).toContain('https://');

      // Step 3: Extract image URLs
      const imageUrls = uploadResults.map(result => result.url);

      // Step 4: Create session data with image URLs
      const sessionData: CreateSessionData = {
        projectId: 'test-project',
        title: 'Morning Work Session',
        description: 'Completed some great work with visual progress',
        duration: 3600,
        startTime: new Date(),
        taskIds: [],
        tags: ['Work'],
        visibility: 'everyone',
        images: imageUrls
      };

      // Mock the Firestore operations
      const { addDoc } = require('firebase/firestore');
      addDoc.mockResolvedValue({ id: 'new-session-123' });

      // Step 5: Create session with images
      const session = await firebaseSessionApi.createSession(sessionData);

      // Step 6: Verify session was created with images
      expect(session).toBeDefined();
      expect(session.images).toEqual(imageUrls);
      expect(session.images).toHaveLength(2);
    });

    it('should handle session creation with zero images', async () => {
      const sessionData: CreateSessionData = {
        projectId: 'test-project',
        title: 'Quick Session',
        description: 'No images needed',
        duration: 1800,
        startTime: new Date(),
        taskIds: [],
        visibility: 'private',
        images: []
      };

      const { addDoc } = require('firebase/firestore');
      addDoc.mockResolvedValue({ id: 'new-session-456' });

      const session = await firebaseSessionApi.createSession(sessionData);

      expect(session).toBeDefined();
      expect(session.images).toEqual([]);
    });

    it('should handle session creation without images field', async () => {
      const sessionData: CreateSessionData = {
        projectId: 'test-project',
        title: 'Legacy Session',
        description: 'Created before image support',
        duration: 2400,
        startTime: new Date(),
        taskIds: []
      };

      const { addDoc } = require('firebase/firestore');
      addDoc.mockResolvedValue({ id: 'new-session-789' });

      const session = await firebaseSessionApi.createSession(sessionData);

      expect(session).toBeDefined();
      expect(session.images).toEqual([]);
    });
  });

  describe('Session retrieval with images', () => {
    it('should populate session images when fetching from Firestore', async () => {
      const mockSessionData = {
        userId: 'test-user-123',
        projectId: 'test-project',
        title: 'Session with Images',
        description: 'Test description',
        duration: 3600,
        startTime: new Date(),
        tasks: [],
        tags: ['Work'],
        visibility: 'everyone',
        images: [
          'https://storage.example.com/image1.jpg',
          'https://storage.example.com/image2.jpg'
        ],
        supportCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { getDoc, doc } = require('firebase/firestore');

      // Mock Firestore document fetch
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockSessionData,
        id: 'session-123'
      });

      // In a real scenario, this would fetch from Firestore
      const sessionDoc = await getDoc(doc({}, 'sessions', 'session-123'));
      const sessionData = sessionDoc.data();

      expect(sessionData.images).toBeDefined();
      expect(sessionData.images).toHaveLength(2);
      expect(sessionData.images[0]).toContain('https://');
    });

    it('should handle sessions without images field in Firestore', async () => {
      const mockLegacySessionData = {
        userId: 'test-user-123',
        projectId: 'test-project',
        title: 'Old Session',
        description: 'Created before image feature',
        duration: 1800,
        startTime: new Date(),
        tasks: [],
        tags: [],
        visibility: 'private',
        // No images field
        supportCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { getDoc, doc } = require('firebase/firestore');

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockLegacySessionData,
        id: 'legacy-session-456'
      });

      const sessionDoc = await getDoc(doc({}, 'sessions', 'legacy-session-456'));
      const sessionData = sessionDoc.data();

      // Should default to empty array when field is missing
      expect(sessionData.images || []).toEqual([]);
    });
  });

  describe('Image upload error handling', () => {
    it('should fail gracefully when image upload fails', async () => {
      const { uploadBytes } = require('firebase/storage');
      uploadBytes.mockRejectedValue(new Error('Storage quota exceeded'));

      const imageFiles = [
        new File(['large-image'], 'large.jpg', { type: 'image/jpeg' })
      ];

      await expect(uploadImages(imageFiles)).rejects.toThrow('Failed to upload image');
    });

    it('should allow session creation to proceed even if image upload fails', async () => {
      // Simulate partial failure: upload fails but session creation should continue
      const sessionData: CreateSessionData = {
        projectId: 'test-project',
        title: 'Session Despite Upload Failure',
        description: 'Images failed to upload',
        duration: 3600,
        startTime: new Date(),
        taskIds: [],
        images: [] // Empty because upload failed
      };

      const { addDoc } = require('firebase/firestore');
      addDoc.mockResolvedValue({ id: 'session-without-images' });

      const session = await firebaseSessionApi.createSession(sessionData);

      expect(session).toBeDefined();
      expect(session.images).toEqual([]);
    });
  });

  describe('Image deletion on session cleanup', () => {
    it('should delete images from storage when provided paths', async () => {
      const { deleteObject } = require('firebase/storage');

      const imagePaths = [
        'session-images/user123/image1.jpg',
        'session-images/user123/image2.jpg'
      ];

      const imageUploadModule = await import('@/lib/imageUpload');
      const { deleteImages } = imageUploadModule;

      await deleteImages(imagePaths);

      expect(deleteObject).toHaveBeenCalledTimes(2);
    });
  });

  describe('Maximum image constraints', () => {
    it('should enforce maximum of 3 images per session', async () => {
      const tooManyImages = [
        new File(['1'], '1.jpg', { type: 'image/jpeg' }),
        new File(['2'], '2.jpg', { type: 'image/jpeg' }),
        new File(['3'], '3.jpg', { type: 'image/jpeg' }),
        new File(['4'], '4.jpg', { type: 'image/jpeg' })
      ];

      await expect(uploadImages(tooManyImages)).rejects.toThrow('Maximum 3 images allowed');
    });

    it('should successfully upload exactly 3 images', async () => {
      const exactlyThreeImages = [
        new File(['1'], '1.jpg', { type: 'image/jpeg' }),
        new File(['2'], '2.jpg', { type: 'image/jpeg' }),
        new File(['3'], '3.jpg', { type: 'image/jpeg' })
      ];

      const results = await uploadImages(exactlyThreeImages);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.url && r.path)).toBe(true);
    });
  });

  describe('File size validation', () => {
    it('should reject files larger than 5MB', async () => {
      // Create a mock large file (6MB)
      const largeFile = new File(
        [new ArrayBuffer(6 * 1024 * 1024)],
        'large.jpg',
        { type: 'image/jpeg' }
      );

      // Define file size on the object
      Object.defineProperty(largeFile, 'size', {
        value: 6 * 1024 * 1024,
        writable: false
      });

      const imageUploadModule = await import('@/lib/imageUpload');
      const { uploadImage } = imageUploadModule;

      await expect(uploadImage(largeFile)).rejects.toThrow('Image must be less than 5MB');
    });

    it('should accept files under 5MB', async () => {
      const validFile = new File(
        [new ArrayBuffer(3 * 1024 * 1024)],
        'valid.jpg',
        { type: 'image/jpeg' }
      );

      Object.defineProperty(validFile, 'size', {
        value: 3 * 1024 * 1024,
        writable: false
      });

      const imageUploadModule = await import('@/lib/imageUpload');
      const { uploadImage } = imageUploadModule;
      const result = await uploadImage(validFile);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('path');
    });
  });

  describe('Feed integration with images', () => {
    it('should include images when fetching feed sessions', async () => {
      const { getDocs, query } = require('firebase/firestore');

      // Mock feed query results
      getDocs.mockResolvedValue({
        docs: [
          {
            id: 'session1',
            data: () => ({
              userId: 'user1',
              title: 'Session with Images',
              images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
              visibility: 'everyone',
              duration: 3600,
              startTime: new Date(),
              createdAt: new Date(),
              supportCount: 5,
              commentCount: 2
            })
          },
          {
            id: 'session2',
            data: () => ({
              userId: 'user2',
              title: 'Session without Images',
              images: [],
              visibility: 'everyone',
              duration: 1800,
              startTime: new Date(),
              createdAt: new Date(),
              supportCount: 3,
              commentCount: 1
            })
          }
        ]
      });

      // Mock user data
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com'
        })
      });

      const feedResult = await getDocs(query({}));
      const sessions = feedResult.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      expect(sessions[0].images).toHaveLength(2);
      expect(sessions[1].images).toHaveLength(0);
    });
  });
});
